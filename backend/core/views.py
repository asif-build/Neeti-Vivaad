from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, CompetencyDomain, SubSkill, OfficialSkillProficiency, RoleCompetencyRequirement
from .serializers import UserSerializer, OfficialSkillProficiencySerializer, CompetencyDomainSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Simple convenience lookup for demo logins
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

class ProfileView(APIView):
    def get(self, request):
        # Default to first official if unauthenticated in demo mode
        user = request.user if request.user.is_authenticated else User.objects.filter(role='OFFICIAL').first()
        if not user:
            user = User.objects.first()
            
        proficiencies = OfficialSkillProficiency.objects.filter(user=user)
        domains = CompetencyDomain.objects.all()
        
        domain_scores = []
        for domain in domains:
            domain_profs = proficiencies.filter(subskill__domain=domain)
            if domain_profs.exists():
                avg_score = round(sum(p.score for p in domain_profs) / domain_profs.count(), 1)
            else:
                avg_score = 50.0
            domain_scores.append({
                'domain_id': domain.id,
                'domain_type': domain.domain_type,
                'domain_name': domain.name,
                'average_score': avg_score
            })
            
        return Response({
            'user': UserSerializer(user).data,
            'proficiencies': OfficialSkillProficiencySerializer(proficiencies, many=True).data,
            'domain_scores': domain_scores
        })

class SkillGapAnalysisView(APIView):
    def get(self, request):
        user = request.user if request.user.is_authenticated else User.objects.filter(role='OFFICIAL').first()
        if not user:
            user = User.objects.first()

        proficiencies = OfficialSkillProficiency.objects.filter(user=user)
        reqs = RoleCompetencyRequirement.objects.filter(designation=user.designation)
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
            'top_gaps': gaps[:5],
            'all_gaps': gaps,
            'gaps_by_domain': gaps_by_domain
        })
