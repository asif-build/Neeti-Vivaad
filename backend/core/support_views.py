import logging
import re
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .throttling import SupportIPThrottle, SupportEmailThrottle
from .recaptcha import verify_recaptcha
from .models import EmailLog

logger = logging.getLogger(__name__)

SUPPORT_CATEGORIES = [
    'Account & Login',
    'Email Verification',
    'Profile & Resume',
    'Courses',
    'Knowledge Check',
    'Neeti Vivaad',
    'Technical Issue',
    'Feedback'
]

class SupportTicketView(APIView):
    """
    Public support message submission endpoint.
    Protected against bot spam with Google reCAPTCHA v3, IP throttling, and Email throttling.
    Strictly delivers to the official destination: neetisaarthi@gmail.com.
    User inputs can NEVER modify the outbound recipient address (open relay prevention).
    """
    permission_classes = [AllowAny]
    throttle_classes = [SupportIPThrottle, SupportEmailThrottle]

    def post(self, request):
        # 1. CAPTCHA verification
        captcha_valid, captcha_error = verify_recaptcha(request, expected_action='contact_support')
        if not captcha_valid:
            return Response({'error': captcha_error}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Extract and validate fields
        name = (request.data.get('name') or '').strip()
        email = (request.data.get('email') or '').strip().lower()
        category = (request.data.get('category') or '').strip()
        subject = (request.data.get('subject') or '').strip()
        message = (request.data.get('message') or '').strip()

        if not email or not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email):
            return Response({'error': 'Please provide a valid email address so we can reply to you.'}, status=status.HTTP_400_BAD_REQUEST)

        if not subject or len(subject) < 3:
            return Response({'error': 'Please provide a subject for your message.'}, status=status.HTTP_400_BAD_REQUEST)

        if not message or len(message) < 10:
            return Response({'error': 'Please provide details in your message (minimum 10 characters).'}, status=status.HTTP_400_BAD_REQUEST)

        if len(message) > 4000:
            return Response({'error': 'Message length exceeds 4,000 characters. Please shorten your message.'}, status=status.HTTP_400_BAD_REQUEST)

        if category not in SUPPORT_CATEGORIES:
            category = 'General Inquiries'

        # 3. Dedicated immutable recipient
        support_destination = getattr(settings, 'SUPPORT_EMAIL', 'neetisaarthi@gmail.com')

        email_subject = f"[Neeti Saarthi Support - {category}] {subject}"
        plain_body = f"""New Support Inquiry via Neeti Saarthi Platform:
--------------------------------------------------
Sender Name: {name or 'Anonymous Learner'}
Sender Email: {email}
Category: {category}
Date/Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
Authenticated User: {request.user.username if request.user and request.user.is_authenticated else 'Guest'}

Subject: {subject}

Message:
{message}
--------------------------------------------------
"""

        html_body = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #0F766E; margin-top: 0;">New Neeti Saarthi Support Inquiry</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Sender:</td><td>{name or 'Anonymous Learner'}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Reply Email:</td><td><a href="mailto:{email}">{email}</a></td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Category:</td><td><span style="background: #FEF3C7; padding: 2px 8px; border-radius: 4px; font-weight: bold;">{category}</span></td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Subject:</td><td>{subject}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Received:</td><td>{timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</td></tr>
            </table>
            <div style="background: #F8F7F2; padding: 16px; border-radius: 6px; border-left: 4px solid #0F766E;">
                <h4 style="margin-top: 0; color: #374151;">Message Body:</h4>
                <p style="white-space: pre-wrap; margin-bottom: 0;">{message}</p>
            </div>
        </div>
        """

        # 4. Dispatch Email with audit logging
        log_entry = EmailLog.objects.create(
            recipient_email=support_destination,
            recipient_user=request.user if request.user and request.user.is_authenticated else None,
            email_type='SUPPORT_INQUIRY',
            subject=email_subject,
            status=EmailLog.EmailStatus.PENDING
        )

        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Neeti Saarthi <neetisaarthi@gmail.com>')
            msg = EmailMultiAlternatives(
                subject=email_subject,
                body=plain_body,
                from_email=from_email,
                to=[support_destination],
                reply_to=[email]
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)

            log_entry.status = EmailLog.EmailStatus.SENT
            log_entry.sent_at = timezone.now()
            log_entry.save()

            logger.info(f"Support message from {email} routed to {support_destination}")
        except Exception as exc:
            err_msg = str(exc)
            logger.error(f"Failed to send support email: {err_msg}")
            log_entry.status = EmailLog.EmailStatus.FAILED
            log_entry.failure_reason = err_msg[:500]
            log_entry.save()

        return Response({
            'success': True,
            'message': 'Thank you for contacting Neeti Saarthi! We have received your message and our team will get back to you at your email address shortly.',
            'category': category
        }, status=status.HTTP_200_OK)
