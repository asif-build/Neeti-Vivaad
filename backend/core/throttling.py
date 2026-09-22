import re
from rest_framework.throttling import SimpleRateThrottle

def get_client_ip(request):
    """
    Extract client IP address safely considering reverse proxies.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip

# =====================================================================
# AUTHENTICATION THROTTLES
# =====================================================================

class LoginIPThrottle(SimpleRateThrottle):
    """5 attempts / minute / IP"""
    scope = 'login_ip'

    def get_cache_key(self, request, view):
        return f"throttle_login_ip_{get_client_ip(request)}"


class LoginAccountThrottle(SimpleRateThrottle):
    """5 attempts / 10 minutes / account identifier"""
    scope = 'login_account'

    def get_cache_key(self, request, view):
        if not hasattr(request, 'data') or not isinstance(request.data, dict):
            return None
        identifier = request.data.get('email') or request.data.get('username')
        if not identifier:
            return None
        clean_id = re.sub(r'[^a-zA-Z0-9@._-]', '', str(identifier).strip().lower())
        return f"throttle_login_account_{clean_id}"


class RegistrationIPThrottle(SimpleRateThrottle):
    """5 attempts / hour / IP"""
    scope = 'register_ip'

    def get_cache_key(self, request, view):
        return f"throttle_register_ip_{get_client_ip(request)}"


class VerificationIPThrottle(SimpleRateThrottle):
    """5 attempts / hour / IP"""
    scope = 'verify_ip'

    def get_cache_key(self, request, view):
        return f"throttle_verify_ip_{get_client_ip(request)}"


class ResendVerificationAccountThrottle(SimpleRateThrottle):
    """3 requests / 15 minutes / account"""
    scope = 'resend_verify_account'

    def get_cache_key(self, request, view):
        if not hasattr(request, 'data') or not isinstance(request.data, dict):
            return None
        email = request.data.get('email', '').strip().lower()
        if not email:
            return None
        clean_email = re.sub(r'[^a-zA-Z0-9@._-]', '', email)
        return f"throttle_resend_verify_acc_{clean_email}"


class ResendVerificationIPThrottle(SimpleRateThrottle):
    """5 requests / hour / IP"""
    scope = 'resend_verify_ip'

    def get_cache_key(self, request, view):
        return f"throttle_resend_verify_ip_{get_client_ip(request)}"


class PasswordResetAccountThrottle(SimpleRateThrottle):
    """3 requests / 15 minutes / account"""
    scope = 'password_reset_account'

    def get_cache_key(self, request, view):
        if not hasattr(request, 'data') or not isinstance(request.data, dict):
            return None
        email = request.data.get('email', '').strip().lower()
        if not email:
            return None
        clean_email = re.sub(r'[^a-zA-Z0-9@._-]', '', email)
        return f"throttle_pw_reset_acc_{clean_email}"


class PasswordResetIPThrottle(SimpleRateThrottle):
    """5 requests / hour / IP"""
    scope = 'password_reset_ip'

    def get_cache_key(self, request, view):
        return f"throttle_pw_reset_ip_{get_client_ip(request)}"


# =====================================================================
# PUBLIC & CATALOG THROTTLES
# =====================================================================

class PublicCatalogThrottle(SimpleRateThrottle):
    """120 requests / minute / IP"""
    scope = 'public_catalogue'

    def get_cache_key(self, request, view):
        return f"throttle_public_cat_{get_client_ip(request)}"


class PublicScenarioThrottle(SimpleRateThrottle):
    """120 requests / minute / IP"""
    scope = 'public_scenario'

    def get_cache_key(self, request, view):
        return f"throttle_public_scen_{get_client_ip(request)}"


class AuthenticatedUserThrottle(SimpleRateThrottle):
    """120 requests / minute / user"""
    scope = 'user_normal_api'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_user_api_{request.user.pk}"
        return f"throttle_anon_api_{get_client_ip(request)}"


# =====================================================================
# USER ACTIONS & AI ENDPOINT THROTTLES
# =====================================================================

class ResumeUploadThrottle(SimpleRateThrottle):
    """5 uploads / hour / user"""
    scope = 'resume_upload'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_resume_upload_{request.user.pk}"
        return f"throttle_resume_upload_ip_{get_client_ip(request)}"


class ResumeProcessingThrottle(SimpleRateThrottle):
    """3 extractions / hour / user"""
    scope = 'resume_processing'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_resume_proc_{request.user.pk}"
        return f"throttle_resume_proc_ip_{get_client_ip(request)}"


class CourseRecommendationThrottle(SimpleRateThrottle):
    """20 generations / hour / user"""
    scope = 'course_recommendation'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_course_rec_{request.user.pk}"
        return f"throttle_course_rec_ip_{get_client_ip(request)}"


class KnowledgeCheckGenThrottle(SimpleRateThrottle):
    """10 generations / hour / user"""
    scope = 'knowledge_check_gen'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_quiz_gen_{request.user.pk}"
        return f"throttle_quiz_gen_ip_{get_client_ip(request)}"


class QuizSubmissionThrottle(SimpleRateThrottle):
    """30 submissions / minute / user"""
    scope = 'quiz_submission'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_quiz_sub_{request.user.pk}"
        return f"throttle_quiz_sub_ip_{get_client_ip(request)}"


class VivaadScenarioGenThrottle(SimpleRateThrottle):
    """10 scenario generations / hour / user"""
    scope = 'vivaad_scenario_gen'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_vivaad_gen_{request.user.pk}"
        return f"throttle_vivaad_gen_ip_{get_client_ip(request)}"


class VivaadDecisionThrottle(SimpleRateThrottle):
    """20 decisions / hour / user"""
    scope = 'vivaad_decision'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_vivaad_dec_{request.user.pk}"
        return f"throttle_vivaad_dec_ip_{get_client_ip(request)}"


class BuddyRateThrottle(SimpleRateThrottle):
    """60 requests / minute / user"""
    scope = 'buddy'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_buddy_{request.user.pk}"
        return f"throttle_buddy_ip_{get_client_ip(request)}"


# =====================================================================
# SUPPORT & REVIEW THROTTLES
# =====================================================================

class SupportIPThrottle(SimpleRateThrottle):
    """5 submissions / hour / IP"""
    scope = 'support_ip'

    def get_cache_key(self, request, view):
        return f"throttle_support_ip_{get_client_ip(request)}"


class SupportEmailThrottle(SimpleRateThrottle):
    """10 submissions / day / email"""
    scope = 'support_email'

    def get_cache_key(self, request, view):
        if not hasattr(request, 'data') or not isinstance(request.data, dict):
            return None
        email = request.data.get('email', '').strip().lower()
        if not email:
            return None
        clean_email = re.sub(r'[^a-zA-Z0-9@._-]', '', email)
        return f"throttle_support_email_{clean_email}"


class ReviewUserThrottle(SimpleRateThrottle):
    """1 review / 24 hours / user"""
    scope = 'review_user'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_review_user_{request.user.pk}"
        return None


class ReviewIPThrottle(SimpleRateThrottle):
    """5 reviews / hour / IP"""
    scope = 'review_ip'

    def get_cache_key(self, request, view):
        return f"throttle_review_ip_{get_client_ip(request)}"


# =====================================================================
# ADMIN THROTTLES
# =====================================================================

class AdminAIGenThrottle(SimpleRateThrottle):
    """60 requests / hour / admin user"""
    scope = 'admin_ai_gen'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'ADMIN':
            return f"throttle_admin_ai_{request.user.pk}"
        return f"throttle_admin_ai_ip_{get_client_ip(request)}"


class AdminBulkThrottle(SimpleRateThrottle):
    """30 operations / minute / admin user"""
    scope = 'admin_bulk'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'ADMIN':
            return f"throttle_admin_bulk_{request.user.pk}"
        return f"throttle_admin_bulk_ip_{get_client_ip(request)}"
