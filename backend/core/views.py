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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        if 'designation' in request.data: profile.designation = request.data['designation']
        if 'department' in request.data: profile.department = request.data['department']
        if 'organisation' in request.data: profile.organisation = request.data['organisation']
        if 'experience_years' in request.data: profile.experience_years = float(request.data['experience_years'])
        if 'education' in request.data: profile.education = request.data['education']
        if 'skills' in request.data: profile.skills = request.data['skills']
        if 'training_history' in request.data: profile.training_history = request.data['training_history']
        if 'learning_preferences' in request.data: profile.learning_preferences = request.data['learning_preferences']
        profile.save()

        if profile.designation and profile.department:
            user.profile_complete = True
        user.save()

        return Response({
            'message': 'Official Profile updated successfully',
            'user': UserSerializer(user).data,
            'official_profile': OfficialProfileSerializer(profile).data
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
