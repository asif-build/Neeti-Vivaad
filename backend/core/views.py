from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User, CompetencyDomain, SubSkill, OfficialSkillProficiency, RoleCompetencyRequirement
from .serializers import (
    UserSerializer, RegisterSerializer, ProfileUpdateSerializer,
    OfficialSkillProficiencySerializer, CompetencyDomainSerializer
)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Account registered successfully',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({'error': 'Please provide both email/username and password.'}, status=status.HTTP_400_BAD_REQUEST)

        # Lookup user by email or username
        user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
        if not user or not user.check_password(password):
            return Response({'error': 'Invalid credentials. Please verify your email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

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
            'proficiencies': OfficialSkillProficiencySerializer(proficiencies, many=True).data,
            'domain_scores': domain_scores,
            'profile_complete': user.profile_complete,
            'baseline_completed': user.baseline_completed
        })

    def patch(self, request):
        user = request.user
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Mark profile_complete when basic details are provided
            user = serializer.save()
            if user.designation and user.department:
                user.profile_complete = True
                user.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        
        # If user hasn't completed baseline, return baseline status with empty gaps
        if not user.baseline_completed or not proficiencies.exists():
            return Response({
                'official': user.get_full_name() or user.username,
                'designation': user.designation or 'Not Specified',
                'baseline_completed': False,
                'top_gaps': [],
                'all_gaps': [],
                'gaps_by_domain': {},
                'message': 'Please complete the baseline assessment to generate your personalized skill gap analysis.'
            })

        reqs = RoleCompetencyRequirement.objects.filter(designation=user.designation)
        if not reqs.exists():
            # Fallback to general requirements if custom designation has no explicit entry
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

        # Sort gaps by gap size descending
        gaps.sort(key=lambda x: x['gap'], reverse=True)

        # Group by domain
        gaps_by_domain = {}
        for gap in gaps:
            dtype = gap['domain_type']
            if dtype not in gaps_by_domain:
                gaps_by_domain[dtype] = []
            gaps_by_domain[dtype].append(gap)

        return Response({
            'official': user.get_full_name() or user.username,
            'designation': user.designation,
            'baseline_completed': True,
            'top_gaps': gaps[:5],
            'all_gaps': gaps,
            'gaps_by_domain': gaps_by_domain
        })
