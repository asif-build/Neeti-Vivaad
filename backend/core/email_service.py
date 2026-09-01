import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from .models import EmailLog

logger = logging.getLogger(__name__)

class EmailService:
    """
    Production-grade Email Lifecycle Service for Neethi Sarthi.
    Dispatches transactional emails via Resend SMTP (or configured backend),
    logs delivery events, and maintains audit trails without leaking secrets.
    """

    @classmethod
    def get_frontend_base_url(cls, request=None):
        import os
        frontend_url = os.getenv('FRONTEND_URL') or getattr(settings, 'FRONTEND_URL', None)
        if frontend_url:
            return frontend_url.rstrip('/')
        if request:
            origin = request.headers.get('origin') or request.headers.get('Origin')
            if origin:
                return origin.rstrip('/')
            referer = request.headers.get('referer') or request.headers.get('Referer')
            if referer:
                from urllib.parse import urlparse
                p = urlparse(referer)
                if p.scheme and p.netloc:
                    return f"{p.scheme}://{p.netloc}"
        return 'http://localhost:3000'

    @classmethod
    def send_welcome_verification_email(cls, user, token, request=None):
        """
        Sends initial Welcome + Email Verification link after registration.
        """
        subject = "Welcome to Neethi Sarthi — Verify Your Account"
        email_type = 'WELCOME_VERIFICATION'
        
        frontend_url = cls.get_frontend_base_url(request)
        verification_url = f"{frontend_url}/verify-email?token={token.token}"

        context = {
            'first_name': user.first_name or 'Official',
            'user': user,
            'verification_url': verification_url,
            'expiry_hours': 24,
            'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@neethi-sarthi.gov.in')
        }

        return cls._send_templated_email(
            user=user,
            recipient_email=user.email,
            subject=subject,
            email_type=email_type,
            template_html='emails/welcome_verification.html',
            template_txt='emails/welcome_verification.txt',
            context=context
        )

    @classmethod
    def send_account_verified_email(cls, user, request=None):
        """
        Sends second welcome email once account has been successfully verified.
        Subject: "Your Neethi Sarthi Account Is Ready 🎉"
        """
        if not getattr(settings, 'SEND_POST_VERIFICATION_EMAIL', True):
            return True, None

        subject = "Your Neethi Sarthi Account Is Verified"
        email_type = 'ACCOUNT_VERIFIED'

        frontend_url = cls.get_frontend_base_url(request)
        onboarding_url = f"{frontend_url}/candidate/onboarding"

        context = {
            'first_name': user.first_name or 'Official',
            'user': user,
            'onboarding_url': onboarding_url
        }

        return cls._send_templated_email(
            user=user,
            recipient_email=user.email,
            subject=subject,
            email_type=email_type,
            template_html='emails/welcome_verified.html',
            template_txt='emails/welcome_verified.txt',
            context=context
        )

    @classmethod
    def send_password_reset_email(cls, user, token, request=None):
        """
        Sends secure, expiring password reset link.
        Subject: "Reset Your Neethi Sarthi Password"
        """
        subject = "Reset Your Neethi Sarthi Password"
        email_type = 'PASSWORD_RESET'

        frontend_url = cls.get_frontend_base_url(request)
        reset_url = f"{frontend_url}/reset-password?token={token.token}"

        context = {
            'first_name': user.first_name or 'Official',
            'user': user,
            'reset_url': reset_url,
            'expiry_minutes': 60
        }

        return cls._send_templated_email(
            user=user,
            recipient_email=user.email,
            subject=subject,
            email_type=email_type,
            template_html='emails/password_reset.html',
            template_txt='emails/password_reset.txt',
            context=context
        )

    @classmethod
    def _send_templated_email(cls, user, recipient_email, subject, email_type, template_html, template_txt, context):
        """
        Internal dispatcher with rendering, logging, and error handling.
        """
        log_entry = EmailLog.objects.create(
            recipient_email=recipient_email,
            recipient_user=user,
            email_type=email_type,
            subject=subject,
            status=EmailLog.EmailStatus.PENDING
        )

        try:
            html_content = render_to_string(template_html, context)
            plain_content = render_to_string(template_txt, context)

            from_email = settings.DEFAULT_FROM_EMAIL
            
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_content,
                from_email=from_email,
                to=[recipient_email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            # Send message via configured backend (Resend SMTP or Console)
            send_result = msg.send(fail_silently=False)
            
            log_entry.status = EmailLog.EmailStatus.SENT
            log_entry.sent_at = timezone.now()
            log_entry.save()

            logger.info(f"[{email_type}] Successfully sent email to {recipient_email}")
            return True, None
        except Exception as e:
            err_msg = str(e)
            logger.error(f"[{email_type}] Failed to send email to {recipient_email}: {err_msg}")
            
            # Record sanitized failure in audit log
            log_entry.status = EmailLog.EmailStatus.FAILED
            log_entry.failure_reason = err_msg[:500]
            log_entry.save()

            return False, err_msg
