from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, OutstandingToken, BlacklistedToken
from django.utils import timezone
from django.db.models import Q
from .models import (
    User, OfficialProfile, EmailVerificationToken,
    CompetencyDomain, SubSkill, OfficialSkillProficiency, RoleCompetencyRequirement
)
from .serializers import (
    UserSerializer, RegisterSerializer, OfficialProfileSerializer,
    OfficialSkillProficiencySerializer, CompetencyDomainSerializer
)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            token_obj = EmailVerificationToken.objects.filter(user=user).last()
            
            return Response({
                'message': 'Account registered successfully. Please verify your official email.',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'verification_token': str(token_obj.token) if token_obj else None,
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('token')
        email = request.data.get('email')

        token_obj = None
        if token_str:
            token_obj = EmailVerificationToken.objects.filter(token=token_str).first()
        elif email:
            token_obj = EmailVerificationToken.objects.filter(user__email__iexact=email).last()

        if not token_obj:
            return Response({'error': 'Invalid or expired verification token.'}, status=status.HTTP_400_BAD_REQUEST)

        token_obj.is_verified = True
        token_obj.verified_at = timezone.now()
        token_obj.save()

        user = token_obj.user
        user.is_email_verified = True
        user.save()

        return Response({
            'message': f'Email {user.email} verified successfully.',
            'is_email_verified': True,
            'user': UserSerializer(user).data
        })

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({'error': 'Please provide both email/username and password.'}, status=status.HTTP_400_BAD_REQUEST)

        # Lookup user in database
        user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
        if not user or not user.check_password(password):
            return Response({'error': 'Invalid credentials. Please verify your email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

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
            'baseline_completed': user.baseline_completed
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
