from rest_framework import serializers
from .models import (
    User, OfficialProfile, EmailVerificationToken,
    CompetencyDomain, SubSkill, OfficialSkillProficiency, RoleCompetencyRequirement
)

class OfficialProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficialProfile
        fields = [
            'id', 'organisation', 'department', 'designation',
            'experience_years', 'education', 'skills', 'training_history',
            'learning_preferences', 'created_at', 'updated_at'
        ]

class UserSerializer(serializers.ModelSerializer):
    official_profile = OfficialProfileSerializer(read_only=True)
    designation = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    organisation = serializers.SerializerMethodField()
    experience_years = serializers.SerializerMethodField()
    education = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'mobile_number', 'is_email_verified', 'profile_complete', 'baseline_completed',
            'ctq_score', 'date_joined', 'official_profile',
            'designation', 'department', 'organisation', 'experience_years', 'education', 'skills'
        ]
        read_only_fields = ['id', 'date_joined']

    def get_designation(self, obj):
        if hasattr(obj, 'official_profile'):
            return obj.official_profile.designation
        return 'Statistical Officer'

    def get_department(self, obj):
        if hasattr(obj, 'official_profile'):
            return obj.official_profile.department
        return ''

    def get_organisation(self, obj):
        if hasattr(obj, 'official_profile'):
            return obj.official_profile.organisation
        return 'Government of India'

    def get_experience_years(self, obj):
        if hasattr(obj, 'official_profile'):
            return obj.official_profile.experience_years
        return 0.0

    def get_education(self, obj):
        if hasattr(obj, 'official_profile'):
            return obj.official_profile.education
        return ''

    def get_skills(self, obj):
        if hasattr(obj, 'official_profile'):
            return obj.official_profile.skills
        return []

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    mobile_number = serializers.CharField(required=False, allow_blank=True)
    designation = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    organisation = serializers.CharField(required=False, allow_blank=True)
    experience_years = serializers.FloatField(required=False, default=0.0)
    education = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'password',
            'mobile_number', 'designation', 'department', 'organisation',
            'experience_years', 'education', 'skills'
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.pop('email').lower()
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        mobile_number = validated_data.pop('mobile_number', '')

        # Profile fields
        designation = validated_data.pop('designation', 'Statistical Officer') or 'Statistical Officer'
        department = validated_data.pop('department', '')
        organisation = validated_data.pop('organisation', 'Government of India') or 'Government of India'
        experience_years = validated_data.pop('experience_years', 0.0)
        education = validated_data.pop('education', '')
        skills = validated_data.pop('skills', [])

        user = User(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            mobile_number=mobile_number,
            role='OFFICIAL',
            is_email_verified=False,
            profile_complete=False,
            baseline_completed=False,
            ctq_score=0.0
        )
        user.set_password(password)
        user.save()

        # Create linked OfficialProfile
        OfficialProfile.objects.create(
            user=user,
            designation=designation,
            department=department,
            organisation=organisation,
            experience_years=experience_years,
            education=education,
            skills=skills
        )

        # Generate Email Verification Token
        EmailVerificationToken.objects.create(user=user)

        return user

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
