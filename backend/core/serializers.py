from rest_framework import serializers
from .models import User, CompetencyDomain, SubSkill, OfficialSkillProficiency, RoleCompetencyRequirement

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'department', 'designation', 'experience_years', 'education', 'ctq_score']

class SubSkillSerializer(serializers.ModelSerializer):
    domain_name = serializers.CharField(source='domain.name', read_only=True)
    domain_type = serializers.CharField(source='domain.domain_type', read_only=True)

    class Meta:
        model = SubSkill
        fields = ['id', 'domain', 'domain_name', 'domain_type', 'name', 'code', 'description']

class CompetencyDomainSerializer(serializers.ModelSerializer):
    subskills = SubSkillSerializer(many=True, read_only=True)

    class Meta:
        model = CompetencyDomain
        fields = ['id', 'name', 'domain_type', 'description', 'subskills']

class OfficialSkillProficiencySerializer(serializers.ModelSerializer):
    subskill_name = serializers.CharField(source='subskill.name', read_only=True)
    subskill_code = serializers.CharField(source='subskill.code', read_only=True)
    domain_name = serializers.CharField(source='subskill.domain.name', read_only=True)
    domain_type = serializers.CharField(source='subskill.domain.domain_type', read_only=True)

    class Meta:
        model = OfficialSkillProficiency
        fields = ['id', 'subskill', 'subskill_name', 'subskill_code', 'domain_name', 'domain_type', 'score', 'last_updated']
