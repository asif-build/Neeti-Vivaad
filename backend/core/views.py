from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, UserStatus, OfficialProfile, EmailVerificationToken, PasswordResetToken,
    CompetencyDomain, SubSkill, OfficialSkillProficiency, RoleCompetencyRequirement
)
from .serializers import (
    UserSerializer, RegisterSerializer, OfficialProfileSerializer,
    OfficialSkillProficiencySerializer, CompetencyDomainSerializer
)
from .email_service import EmailService

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # User starts with PENDING_VERIFICATION
            user.status = UserStatus.PENDING_VERIFICATION
            user.is_email_verified = False
            user.save()

            # Create fresh secure verification token (expires in 24 hours)
            token_obj = EmailVerificationToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=24)
            )
            
            # Dispatch personalized Welcome + Verification email
            EmailService.send_welcome_verification_email(user, token_obj, request)

            return Response({
                'message': 'Account created successfully. A verification link has been dispatched to your official email.',
                'email': user.email,
                'status': user.status,
                'is_email_verified': False,
                'verification_token': str(token_obj.token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        # Check specifically for email collision
        if 'email' in serializer.errors:
            email_errors = serializer.errors['email']
            err_msg = email_errors[0] if isinstance(email_errors, list) else str(email_errors)
            return Response({'error': err_msg, 'email_exists': True, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        # Fallback error formatting
        first_key = list(serializer.errors.keys())[0]
        first_err = serializer.errors[first_key]
        err_msg = first_err[0] if isinstance(first_err, list) else str(first_err)
        return Response({'error': err_msg, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('token')
        if not token_str:
            return Response({'error': 'Verification token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        token_obj = EmailVerificationToken.objects.filter(token=token_str, is_used=False).first()
        if not token_obj:
            return Response({'error': 'Invalid, already used, or non-existent verification token.'}, status=status.HTTP_400_BAD_REQUEST)

        if token_obj.is_expired:
            return Response({'error': 'This verification token has expired. Please request a new verification email.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark token as single-use completed
        token_obj.is_used = True
        token_obj.verified_at = timezone.now()
        token_obj.save()

        # Update User status to ACTIVE
        user = token_obj.user
        user.is_email_verified = True
        user.status = UserStatus.ACTIVE
        user.save()

        # Optionally send post-verification welcome
        EmailService.send_account_verified_email(user, request)

        # Issue JWT credentials immediately for smooth onboarding
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Your email has been verified and your account is now active!',
            'is_email_verified': True,
            'status': user.status,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            # Mask user existence
            return Response({'message': 'If an unverified account exists with that email, a new verification link has been dispatched.'})

        if user.is_email_verified or user.status == UserStatus.ACTIVE:
            return Response({'message': 'This account has already been verified. You can log in directly.', 'already_verified': True})

        # Rate limiting: max 1 request every 60 seconds
        recent_token = EmailVerificationToken.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(seconds=60)
        ).first()
        if recent_token:
            return Response(
                {'error': 'A verification email was recently dispatched. Please wait at least 60 seconds before requesting another.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Invalidate old unused tokens and issue a fresh one
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)
        new_token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        EmailService.send_welcome_verification_email(user, new_token, request)

        return Response({
            'message': 'A fresh verification email has been dispatched to your address.',
            'verification_token': str(new_token.token)
        })

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user:
            # Rate limiting: check recent requests
            recent_request = PasswordResetToken.objects.filter(
                user=user,
                created_at__gte=timezone.now() - timedelta(seconds=60)
            ).first()
            if recent_request:
                return Response(
                    {'error': 'A password reset email was recently dispatched. Please wait 60 seconds before requesting another.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

            # Invalidate old unused reset tokens
            PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

            reset_token = PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=1)
            )
            EmailService.send_password_reset_email(user, reset_token, request)

        # Generic safe response to prevent email harvesting
        return Response({
            'message': 'If an account exists with that email address, password reset instructions have been sent.'
        })

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('token')
        new_password = request.data.get('password')

        if not token_str or not new_password:
            return Response({'error': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        token_obj = PasswordResetToken.objects.filter(token=token_str, is_used=False).first()
        if not token_obj:
            return Response({'error': 'Invalid, expired, or already used password reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if token_obj.is_expired:
            return Response({'error': 'This password reset link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user
        user.set_password(new_password)
        user.save()

        # Mark token used
        token_obj.is_used = True
        token_obj.used_at = timezone.now()
        token_obj.save()

        # Invalidate any other active reset tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        return Response({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        })

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({'error': 'Please provide both email/username and password.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
        if not user or not user.check_password(password):
            return Response({'error': 'Invalid credentials. Please verify your email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check account status
        if user.status == UserStatus.SUSPENDED:
            return Response({'error': 'This official account has been suspended. Please contact your system administrator.'}, status=status.HTTP_403_FORBIDDEN)

        # Ensure OfficialProfile exists
        OfficialProfile.objects.get_or_create(
            user=user,
            defaults={'designation': 'Statistical Officer', 'organisation': 'Government of India'}
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'status': user.status,
            'is_email_verified': user.is_email_verified,
            'user': UserSerializer(user).data
        })

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully. Session invalidated.'})
        except Exception:
            return Response({'message': 'Logged out successfully.'})

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'user': UserSerializer(request.user).data
        })

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = OfficialProfile.objects.get_or_create(
            user=user,
            defaults={'designation': 'Statistical Officer', 'organisation': 'Government of India'}
        )
        proficiencies = OfficialSkillProficiency.objects.filter(user=user)
        domains = CompetencyDomain.objects.all()

        domain_scores = []
        for domain in domains:
            domain_profs = proficiencies.filter(subskill__domain=domain)
            if domain_profs.exists():
                avg_score = round(sum(p.score for p in domain_profs) / domain_profs.count(), 1)
            else:
                avg_score = 0.0
            domain_scores.append({
                'domain_id': domain.id,
                'domain_type': domain.domain_type,
                'domain_name': domain.name,
                'average_score': avg_score,
                'has_proficiencies': domain_profs.exists()
            })

        return Response({
            'user': UserSerializer(user).data,
            'official_profile': OfficialProfileSerializer(profile).data,
            'proficiencies': OfficialSkillProficiencySerializer(proficiencies, many=True).data,
            'domain_scores': domain_scores,
            'profile_complete': user.profile_complete,
            'baseline_completed': user.baseline_completed,
            'status': user.status,
            'is_email_verified': user.is_email_verified
        })

    def patch(self, request):
        user = request.user
        profile, _ = OfficialProfile.objects.get_or_create(user=user)

        # Update User basics
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        mobile_number = request.data.get('mobile_number')
        if first_name is not None: user.first_name = first_name
        if last_name is not None: user.last_name = last_name
        if mobile_number is not None: user.mobile_number = mobile_number

        # Update OfficialProfile
        if 'designation' in request.data:
            profile.designation = request.data['designation']
            profile.current_role = request.data['designation']
        if 'department' in request.data: profile.department = request.data['department']
        if 'organisation' in request.data: profile.organisation = request.data['organisation']
        if 'experience_years' in request.data:
            try:
                profile.experience_years = float(request.data['experience_years'])
            except (ValueError, TypeError):
                pass
        if 'education' in request.data: profile.education = request.data['education']
        if 'certifications' in request.data: profile.certifications = request.data['certifications']
        
        # Handle skills and confirmed_skills
        raw_skills = request.data.get('skills', [])
        confirmed_skills = request.data.get('confirmed_skills', [])
        
        if confirmed_skills and isinstance(confirmed_skills, list):
            profile.confirmed_skills = confirmed_skills
            profile.skills = [s['skill'] if isinstance(s, dict) and 'skill' in s else str(s) for s in confirmed_skills]
        elif raw_skills and isinstance(raw_skills, list):
            profile.skills = [str(s).strip() for s in raw_skills if str(s).strip()]
            profile.confirmed_skills = [
                {
                    'skill': s,
                    'evidence': 'Confirmed by officer in profile review',
                    'confidence': 0.88,
                    'domain_type': 'STATISTICAL',
                    'user_confirmed': True,
                    'source': 'USER_EDIT'
                }
                for s in profile.skills
            ]

        if 'training_history' in request.data: profile.training_history = request.data['training_history']
        if 'learning_preferences' in request.data: profile.learning_preferences = request.data['learning_preferences']
        
        profile.onboarding_step = 5
        profile.save()

        # Calculate competencies and mark complete
        if profile.confirmed_skills:
            try:
                calculate_and_persist_competencies(
                    user=user,
                    confirmed_skills=profile.confirmed_skills,
                    current_role=profile.designation or 'Statistical Officer',
                    target_role=profile.designation or 'Senior Statistical Officer',
                    experience_years=profile.experience_years,
                    education=profile.education
                )
            except Exception as e:
                print(f"[ProfileView] Error calculating competencies: {e}")

        if profile.designation:
            user.profile_complete = True
        user.save()

        return Response({
            'message': 'Official Profile updated successfully',
            'user': UserSerializer(user).data,
            'official_profile': OfficialProfileSerializer(profile).data,
            'profile_complete': user.profile_complete
        })

    def put(self, request):
        return self.patch(request)

class CompetenciesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        proficiencies = OfficialSkillProficiency.objects.filter(user=user)
        domains = CompetencyDomain.objects.all()

        domains_data = []
        for d in domains:
            d_profs = proficiencies.filter(subskill__domain=d)
            avg = round(sum(p.score for p in d_profs) / d_profs.count(), 1) if d_profs.exists() else 0.0
            domains_data.append({
                'id': d.id,
                'name': d.name,
                'domain_type': d.domain_type,
                'description': d.description,
                'average_score': avg,
                'subskills': OfficialSkillProficiencySerializer(d_profs, many=True).data
            })

        return Response({
            'baseline_completed': user.baseline_completed,
            'total_proficiencies_count': proficiencies.count(),
            'domain_scores': domains_data
        })

class SkillGapAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        proficiencies = OfficialSkillProficiency.objects.filter(user=user)
        
        if not user.baseline_completed or not proficiencies.exists():
            return Response({
                'official': user.get_full_name() or user.username,
                'designation': getattr(getattr(user, 'official_profile', None), 'designation', 'Statistical Officer'),
                'baseline_completed': False,
                'top_gaps': [],
                'all_gaps': [],
                'gaps_by_domain': {},
                'message': 'Please complete the baseline assessment to generate your personalized skill gap analysis.'
            })

        user_desig = getattr(getattr(user, 'official_profile', None), 'designation', 'Senior Statistical Officer')
        reqs = RoleCompetencyRequirement.objects.filter(designation=user_desig)
        if not reqs.exists():
            reqs = RoleCompetencyRequirement.objects.filter(designation='Senior Statistical Officer')
        req_map = {r.subskill_id: r.target_score for r in reqs}

        gaps = []
        for prof in proficiencies:
            target = req_map.get(prof.subskill_id, 80.0)
            gap_val = round(max(0.0, target - prof.score), 1)
            gaps.append({
                'subskill_id': prof.subskill.id,
                'subskill_name': prof.subskill.name,
                'subskill_code': prof.subskill.code,
                'domain_name': prof.subskill.domain.name,
                'domain_type': prof.subskill.domain.domain_type,
                'current_score': prof.score,
                'target_score': target,
                'gap': gap_val,
                'priority': 'HIGH' if gap_val > 25 else ('MEDIUM' if gap_val > 10 else 'LOW')
            })

        gaps.sort(key=lambda x: x['gap'], reverse=True)

        gaps_by_domain = {}
        for gap in gaps:
            dtype = gap['domain_type']
            if dtype not in gaps_by_domain:
                gaps_by_domain[dtype] = []
            gaps_by_domain[dtype].append(gap)

        return Response({
            'official': user.get_full_name() or user.username,
            'designation': user_desig,
            'baseline_completed': True,
            'top_gaps': gaps[:5],
            'all_gaps': gaps,
            'gaps_by_domain': gaps_by_domain
        })

from .resume_service import extract_text_from_file, analyze_resume, calculate_and_persist_competencies
import os

class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile, _ = OfficialProfile.objects.get_or_create(user=user)

        file_obj = request.FILES.get('resume')
        raw_text_input = request.data.get('resume_text', '')

        if not file_obj and not raw_text_input:
            return Response(
                {'error': 'Please provide a resume file (PDF, DOCX, TXT) or paste resume text.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if file_obj:
            if file_obj.size > 10 * 1024 * 1024:
                return Response(
                    {'error': 'Resume file size exceeds the 10MB limit. Please upload a smaller file.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            filename = file_obj.name
            ext = os.path.splitext(filename)[1].lower()
            if ext not in ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.md']:
                return Response(
                    {'error': f'Unsupported file type "{ext}". Please upload a PDF, DOCX, or TXT document.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                raw_text = extract_text_from_file(file_obj, filename)
                profile.resume_file = file_obj
            except ValueError as ve:
                return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': f'Failed to process resume file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            raw_text = raw_text_input.strip()
            if len(raw_text) < 20:
                return Response({'error': 'Resume text is too short. Please provide complete resume content.'}, status=status.HTTP_400_BAD_REQUEST)

        profile.raw_resume_text = raw_text

        # Perform analysis (Gemini or deterministic rule-based extractor)
        extracted_data = analyze_resume(raw_text, getattr(file_obj, 'name', 'resume.txt'))
        profile.extracted_resume_data = extracted_data

        # Update profile fields
        if extracted_data.get('designation'):
            profile.designation = extracted_data['designation']
            profile.current_role = extracted_data['designation']
        if extracted_data.get('department'):
            profile.department = extracted_data['department']
        if extracted_data.get('organisation'):
            profile.organisation = extracted_data['organisation']
        if extracted_data.get('experience_years'):
            try:
                profile.experience_years = float(extracted_data['experience_years'])
            except (ValueError, TypeError):
                pass
        if extracted_data.get('education'):
            profile.education = extracted_data['education']
        if extracted_data.get('certifications'):
            profile.certifications = extracted_data['certifications']

        initial_skills = extracted_data.get('skills', [])
        profile.confirmed_skills = initial_skills
        profile.skills = [s['skill'] for s in initial_skills if isinstance(s, dict) and 'skill' in s]
        profile.onboarding_step = 2
        profile.save()

        # Update User basics if extracted and empty
        if extracted_data.get('first_name') and not user.first_name:
            user.first_name = extracted_data['first_name']
        if extracted_data.get('last_name') and not user.last_name:
            user.last_name = extracted_data['last_name']
        if extracted_data.get('mobile_number') and not user.mobile_number:
            user.mobile_number = extracted_data['mobile_number']
        user.save()

        return Response({
            'message': 'Resume analyzed successfully.',
            'extracted_data': extracted_data,
            'skills': initial_skills,
            'profile': OfficialProfileSerializer(profile).data,
            'user': UserSerializer(user).data
        })

class ConfirmSkillsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile, _ = OfficialProfile.objects.get_or_create(user=user)

        skills_list = request.data.get('skills', [])
        if not isinstance(skills_list, list):
            return Response({'error': 'Skills must be an array of skill objects.'}, status=status.HTTP_400_BAD_REQUEST)

        cleaned_skills = []
        for s in skills_list:
            if isinstance(s, dict) and s.get('skill'):
                cleaned_skills.append({
                    'skill': str(s['skill']).strip(),
                    'evidence': str(s.get('evidence', 'Confirmed by officer during onboarding')),
                    'confidence': float(s.get('confidence', 0.85)),
                    'source': str(s.get('source', 'RESUME')),
                    'user_confirmed': bool(s.get('user_confirmed', True)),
                    'domain_type': str(s.get('domain_type', 'STATISTICAL'))
                })
            elif isinstance(s, str) and s.strip():
                cleaned_skills.append({
                    'skill': s.strip(),
                    'evidence': 'Added by officer during onboarding',
                    'confidence': 0.85,
                    'source': 'MANUAL_ENTRY',
                    'user_confirmed': True,
                    'domain_type': 'STATISTICAL'
                })

        profile.confirmed_skills = cleaned_skills
        profile.skills = [s['skill'] for s in cleaned_skills]
        profile.onboarding_step = 3
        profile.save()

        return Response({
            'message': 'Skills confirmed successfully.',
            'confirmed_skills': cleaned_skills,
            'total_skills_count': len(cleaned_skills)
        })

class CareerGoalsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile, _ = OfficialProfile.objects.get_or_create(user=user)

        current_role = request.data.get('current_role', profile.designation)
        target_role = request.data.get('target_role', '')
        career_goal = request.data.get('career_goal', '')

        if current_role: profile.current_role = current_role
        if target_role: profile.target_role = target_role
        if career_goal: profile.career_goal = career_goal
        
        profile.onboarding_step = 4
        profile.save()

        return Response({
            'message': 'Career goals saved successfully.',
            'current_role': profile.current_role,
            'target_role': profile.target_role,
            'career_goal': profile.career_goal
        })

class LearningPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile, _ = OfficialProfile.objects.get_or_create(user=user)

        preferred_formats = request.data.get('preferred_formats', ['Interactive Case Studies', 'Simulated Policy Debates'])
        weekly_hours = request.data.get('weekly_hours', 5.0)
        preferred_difficulty = request.data.get('preferred_difficulty', 'Intermediate')

        prefs = {
            'preferred_formats': preferred_formats,
            'weekly_hours': float(weekly_hours),
            'preferred_difficulty': preferred_difficulty
        }

        profile.learning_preferences = prefs
        profile.onboarding_step = 5
        profile.save()

        return Response({
            'message': 'Learning preferences saved successfully.',
            'learning_preferences': prefs
        })

class FinalizeCompetenciesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile, _ = OfficialProfile.objects.get_or_create(user=user)

        comp_result = calculate_and_persist_competencies(
            user=user,
            confirmed_skills=profile.confirmed_skills,
            current_role=profile.current_role or profile.designation,
            target_role=profile.target_role or profile.designation,
            experience_years=profile.experience_years,
            education=profile.education
        )

        user.refresh_from_db()

        return Response({
            'message': 'Official Competency Profile generated and stored in PostgreSQL.',
            'user': UserSerializer(user).data,
            'domain_scores': comp_result['domain_scores'],
            'top_gaps': comp_result['top_gaps'],
            'all_gaps': comp_result['all_gaps']
        })

