from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Review, ReviewStatus, UserRole
from .throttling import PublicCatalogThrottle, ReviewUserThrottle, ReviewIPThrottle, AdminBulkThrottle
from .recaptcha import verify_recaptcha

class PublicReviewListView(APIView):
    """
    Public listing of approved, verified reviews for Neeti Saarthi.
    Zero fake reviews: returns only real testimonials approved by platform administrators.
    """
    permission_classes = [AllowAny]
    throttle_classes = [PublicCatalogThrottle]

    def get(self, request):
        approved_reviews = Review.objects.filter(
            status=ReviewStatus.APPROVED
        ).select_related('user').order_by('-created_at')[:50]

        data = []
        for r in approved_reviews:
            # Privacy-safe display name resolution
            name = r.display_name
            if not name:
                if r.user.first_name:
                    name = f"{r.user.first_name} {r.user.last_name[:1]}." if r.user.last_name else r.user.first_name
                else:
                    name = "Verified Learner"

            # Check verified status
            is_verified = r.user.is_email_verified or r.user.baseline_completed

            data.append({
                'id': r.id,
                'rating': r.rating,
                'comment': r.comment,
                'display_name': name,
                'feature_used': r.feature_used or 'Neeti Saarthi Platform',
                'is_verified_learner': is_verified,
                'created_at': r.created_at.strftime('%B %Y')
            })

        return Response({
            'count': len(data),
            'reviews': data
        })


class SubmitReviewView(APIView):
    """
    Submits a genuine review for moderation.
    Requires authentication, Google reCAPTCHA v3 verification, and rate limiting.
    Submissions are saved as PENDING until reviewed by an administrator.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ReviewUserThrottle, ReviewIPThrottle]

    def post(self, request):
        # 1. CAPTCHA verification
        captcha_valid, captcha_error = verify_recaptcha(request, expected_action='submit_review')
        if not captcha_valid:
            return Response({'error': captcha_error}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Rate limit check (1 review / user / 24 hours)
        recent_review = Review.objects.filter(
            user=request.user,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).first()
        if recent_review:
            return Response(
                {'error': "You have already submitted a review recently. Thank you for your feedback! Please wait 24 hours before submitting another."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # 3. Payload validation
        rating_raw = request.data.get('rating')
        comment = (request.data.get('comment') or request.data.get('content') or '').strip()
        display_name = (request.data.get('display_name') or request.data.get('name') or '').strip()[:100]
        feature_used = (request.data.get('feature_used') or request.data.get('role_title') or '').strip()[:50]

        try:
            rating = int(rating_raw)
            if rating < 1 or rating > 5:
                raise ValueError()
        except (TypeError, ValueError):
            return Response({'error': 'Please provide a valid rating between 1 and 5 stars.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(comment) < 10:
            return Response({'error': 'Review comment must be at least 10 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(comment) > 1500:
            return Response({'error': 'Review comment must not exceed 1500 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Create pending review
        review = Review.objects.create(
            user=request.user,
            rating=rating,
            comment=comment,
            display_name=display_name or None,
            feature_used=feature_used or None,
            status=ReviewStatus.PENDING
        )

        return Response({
            'message': 'Thank you for your feedback! Your review has been received and will appear publicly once verified by moderation.',
            'review_id': review.id,
            'status': review.status
        }, status=status.HTTP_201_CREATED)


class AdminReviewManageView(APIView):
    """
    Admin moderation endpoint for reviews: approve, reject, hide, flag, delete.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [AdminBulkThrottle]

    def _check_admin(self, request):
        if not request.user or getattr(request.user, 'role', '') != UserRole.ADMIN:
            return False
        return True

    def get(self, request):
        if not self._check_admin(request):
            return Response({'error': 'Administrator access required.'}, status=status.HTTP_403_FORBIDDEN)

        status_filter = request.query_params.get('status')
        qs = Review.objects.all().select_related('user')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        reviews_data = []
        for r in qs[:100]:
            reviews_data.append({
                'id': r.id,
                'user_id': r.user.id,
                'username': r.user.username,
                'user_email': r.user.email,
                'rating': r.rating,
                'comment': r.comment,
                'display_name': r.display_name,
                'feature_used': r.feature_used,
                'status': r.status,
                'is_flagged': r.is_flagged,
                'moderator_notes': r.moderator_notes,
                'created_at': r.created_at.isoformat()
            })

        return Response({
            'count': len(reviews_data),
            'reviews': reviews_data
        })

    def patch(self, request, review_id):
        if not self._check_admin(request):
            return Response({'error': 'Administrator access required.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action', '').lower()
        notes = request.data.get('moderator_notes')

        if action == 'approve':
            review.status = ReviewStatus.APPROVED
        elif action == 'reject':
            review.status = ReviewStatus.REJECTED
        elif action == 'hide':
            review.status = ReviewStatus.HIDDEN
        elif action == 'flag':
            review.is_flagged = True
        elif action == 'unflag':
            review.is_flagged = False
        else:
            return Response({'error': f"Invalid action '{action}'. Valid actions: approve, reject, hide, flag, unflag."}, status=status.HTTP_400_BAD_REQUEST)

        if notes is not None:
            review.moderator_notes = notes

        review.save()

        return Response({
            'message': f"Review #{review.id} successfully updated with action '{action}'.",
            'review_id': review.id,
            'status': review.status,
            'is_flagged': review.is_flagged
        })

    def delete(self, request, review_id):
        if not self._check_admin(request):
            return Response({'error': 'Administrator access required.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            review = Review.objects.get(id=review_id)
            review.delete()
            return Response({'message': f'Review #{review_id} has been permanently deleted.'})
        except Review.DoesNotExist:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)
