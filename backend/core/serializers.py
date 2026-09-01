from rest_framework import serializers
from .models import User, CompetencyDomain, SubSkill, OfficialSkillProficiency, RoleCompetencyRequirement

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'mobile_number', 'organisation', 'department', 'designation',
            'experience_years', 'education', 'skills', 'training_history',
            'learning_preferences', 'profile_complete', 'baseline_completed',
            'ctq_score', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'password',
            'mobile_number', 'organisation', 'department', 'designation',
            'experience_years', 'education', 'skills', 'training_history',
            'learning_preferences'
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.get('email').lower()
        username = email  # Use email as default username

        user = User(
            username=username,
            role='OFFICIAL',  # Enforce public registration can ONLY create OFFICIAL role
            profile_complete=False,
            baseline_completed=False,
            ctq_score=0.0,
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'mobile_number',
            'organisation', 'department', 'designation',
            'experience_years', 'education', 'skills',
            'training_history', 'learning_preferences', 'profile_complete'
        ]

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
