import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

class EmailService:
    """
    Production-grade Email Lifecycle Service for Neethi Sarthi.
    Handles personalized HTML + Plain-text email rendering and delivery.
    Configurable for Console (development) and SMTP (production).
    """

    @classmethod
    def get_frontend_base_url(cls, request=None):
        if hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL:
            return settings.FRONTEND_URL.rstrip('/')
        if request:
            origin = request.headers.get('origin') or request.headers.get('referer')
            if origin:
                return origin.rstrip('/')
        return 'http://localhost:3000'

    @classmethod
    def send_welcome_verification_email(cls, user, token, request=None):
        """
        Sends initial Welcome + Email Verification link after registration.
        """
        try:
            frontend_url = cls.get_frontend_base_url(request)
            verification_url = f"{frontend_url}/verify-email?token={token.token}"
            
            context = {
                'first_name': user.first_name or 'Official',
                'user': user,
                'verification_url': verification_url,
                'expiry_hours': 24,
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@neethi-sarthi.gov.in')
            }

            subject = "Welcome to Neethi Sarthi — Verify Your Account"
            html_content = render_to_string('emails/welcome_verification.html', context)
            plain_content = render_to_string('emails/welcome_verification.txt', context)

            send_mail(
                subject=subject,
                message=plain_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_content,
                fail_silently=False
            )
            logger.info(f"Welcome & Verification email dispatched to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch welcome verification email to {user.email}: {e}")
            return False

    @classmethod
    def send_account_verified_email(cls, user, request=None):
        """
        Sends confirmation email once account has been successfully verified.
        Can be toggled via SEND_POST_VERIFICATION_EMAIL setting.
        """
        if not getattr(settings, 'SEND_POST_VERIFICATION_EMAIL', True):
            return False

        try:
            frontend_url = cls.get_frontend_base_url(request)
            onboarding_url = f"{frontend_url}/candidate/onboarding"

            context = {
                'first_name': user.first_name or 'Official',
                'user': user,
                'onboarding_url': onboarding_url
            }

            subject = "Your Neethi Sarthi Account Is Verified"
            html_content = render_to_string('emails/welcome_verified.html', context)
            plain_content = render_to_string('emails/welcome_verified.txt', context)

            send_mail(
                subject=subject,
                message=plain_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_content,
                fail_silently=False
            )
            logger.info(f"Account verified confirmation email dispatched to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch account verified email to {user.email}: {e}")
            return False

    @classmethod
    def send_password_reset_email(cls, user, token, request=None):
        """
        Sends secure, expiring password reset link.
        """
        try:
            frontend_url = cls.get_frontend_base_url(request)
            reset_url = f"{frontend_url}/reset-password?token={token.token}"

            context = {
                'first_name': user.first_name or 'Official',
                'user': user,
                'reset_url': reset_url,
                'expiry_minutes': 60
            }

            subject = "Reset Your Neethi Sarthi Password"
            html_content = render_to_string('emails/password_reset.html', context)
            plain_content = render_to_string('emails/password_reset.txt', context)

            send_mail(
                subject=subject,
                message=plain_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_content,
                fail_silently=False
            )
            logger.info(f"Password reset email dispatched to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch password reset email to {user.email}: {e}")
            return False

    # -------------------------------------------------------------
    # Extensible Future Lifecycle Stubs (Ready for feature linkage)
    # -------------------------------------------------------------
    @classmethod
    def send_profile_completion_reminder(cls, user, request=None):
        logger.info(f"Stub: profile completion reminder for {user.email}")

    @classmethod
    def send_assessment_completion_email(cls, user, ctq_score, request=None):
        logger.info(f"Stub: baseline assessment completion email for {user.email} (CTQ: {ctq_score})")

    @classmethod
    def send_competency_report_email(cls, user, report_data, request=None):
        logger.info(f"Stub: competency report email for {user.email}")

    @classmethod
    def send_debate_summary_email(cls, user, session_data, request=None):
        logger.info(f"Stub: debate session summary email for {user.email}")
