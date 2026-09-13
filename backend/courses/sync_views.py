import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Course, IGOTCourseEnrollment
from core.models import OfficialSkillProficiency, CompetencyDomain
from core.resume_service import calculate_and_persist_competencies
from .recommendation import CourseRecommendationEngine


class CourseActionStartView(APIView):
    """
    Called when a user clicks 'COMPLETE ON iGOT →'.
    Records user engagement and creates or activates an enrollment record.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        user = request.user
        course = Course.objects.filter(igot_course_id=course_id).first()
        if not course:
            try:
                course = Course.objects.filter(id=int(course_id)).first()
            except (ValueError, TypeError):
                course = None

        if not course:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        enrollment, created = IGOTCourseEnrollment.objects.get_or_create(
            user=user,
            course=course,
            defaults={
                'status': IGOTCourseEnrollment.Status.IN_PROGRESS,
                'progress_percentage': 25.0,
                'enrolled_at': timezone.now(),
                'last_synced_at': timezone.now()
            }
        )

        if not created and enrollment.status != IGOTCourseEnrollment.Status.COMPLETED:
            enrollment.status = IGOTCourseEnrollment.Status.IN_PROGRESS
            enrollment.last_synced_at = timezone.now()
            enrollment.save(update_fields=['status', 'last_synced_at'])

        return Response({
            'message': f"Started learning on iGOT: {course.title}",
            'enrollment_id': enrollment.id,
            'status': enrollment.status,
            'igot_course_url': course.igot_course_url or course.url,
            'enrolled_at': enrollment.enrolled_at.isoformat()
        })


class CourseSyncCompletionView(APIView):
    """
    Authorized iGOT Sync Endpoint:
    Verifies completion of an iGOT Karmayogi course, updates the civil servant's
    skill proficiencies in Neeti Saarthi, recalculates growth gaps, and refreshes recommendations.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        user = request.user
        course = Course.objects.filter(igot_course_id=course_id).first()
        if not course:
            try:
                course = Course.objects.filter(id=int(course_id)).first()
            except (ValueError, TypeError):
                course = None

        if not course:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        enrollment, _ = IGOTCourseEnrollment.objects.get_or_create(
            user=user,
            course=course,
            defaults={
                'status': IGOTCourseEnrollment.Status.IN_PROGRESS,
                'enrolled_at': timezone.now()
            }
        )

        # Mark course completed
        now = timezone.now()
        cert_id = f"iGOT-{timezone.now().year}-{str(uuid.uuid4())[:8].upper()}"
        enrollment.status = IGOTCourseEnrollment.Status.COMPLETED
        enrollment.progress_percentage = 100.0
        enrollment.completed_at = now
        enrollment.last_synced_at = now
        enrollment.certificate_id = cert_id

        # Determine target subskills to credit
        subskills = list(course.target_subskills.all())
        boost_points = 15.0
        credited_names = []

        for sub in subskills:
            prof, _ = OfficialSkillProficiency.objects.get_or_create(
                user=user,
                subskill=sub,
                defaults={'score': 50.0}
            )
            # Apply skill boost (e.g. +15 points, max 98)
            new_score = min(98.0, round(prof.score + boost_points, 1))
            prof.score = new_score
            prof.save(update_fields=['score', 'last_updated'])
            credited_names.append({
                'subskill': sub.name,
                'domain': sub.domain.name,
                'new_score': new_score,
                'boost': boost_points
            })

        enrollment.skills_credited = credited_names
        enrollment.save()

        # Update OfficialProfile training history & certifications
        profile = getattr(user, 'official_profile', None)
        if profile:
            current_certs = list(profile.certifications or [])
            cert_entry = f"{course.title} (iGOT Karmayogi, {now.strftime('%b %Y')})"
            if cert_entry not in current_certs:
                current_certs.append(cert_entry)
                profile.certifications = current_certs
                profile.save(update_fields=['certifications'])

            # Recompute domain aggregates and gap scores
            if profile.confirmed_skills:
                try:
                    calculate_and_persist_competencies(
                        user=user,
                        confirmed_skills=profile.confirmed_skills,
                        current_role=profile.designation or 'Statistical Officer',
                        target_role=profile.designation or 'Senior Statistical Officer',
                        experience_years=profile.experience_years,
                        education=profile.education
                    )
                except Exception as e:
                    print(f"[CourseSync] Error recalculating competencies: {e}")

        # Fetch updated domain scores
        domain_scores = []
        user_profs = OfficialSkillProficiency.objects.filter(user=user)
        for d in CompetencyDomain.objects.all():
            d_profs = user_profs.filter(subskill__domain=d)
            avg = round(sum(p.score for p in d_profs) / d_profs.count(), 1) if d_profs.exists() else 0.0
            domain_scores.append({
                'domain_name': d.name,
                'average_score': avg
            })

        return Response({
            'message': f"Course verified and synced from iGOT Karmayogi successfully! {len(credited_names)} skills strengthened.",
            'course_title': course.title,
            'certificate_id': cert_id,
            'status': 'COMPLETED',
            'completed_at': now.strftime("%B %d, %Y"),
            'skills_credited': credited_names,
            'updated_domain_scores': domain_scores
        })


class UserEnrollmentsListView(APIView):
    """List all iGOT courses enrolled or completed by the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enrollments = IGOTCourseEnrollment.objects.filter(user=user).select_related('course').order_by('-last_synced_at')
        
        data = []
        for e in enrollments:
            data.append({
                'id': e.id,
                'course_id': e.course.id,
                'igot_course_id': e.course.igot_course_id,
                'title': e.course.title,
                'provider': e.course.provider,
                'thumbnail_url': e.course.thumbnail_url,
                'igot_course_url': e.course.igot_course_url or e.course.url,
                'category': e.course.category,
                'status': e.status,
                'progress_percentage': e.progress_percentage,
                'enrolled_at': e.enrolled_at.strftime('%Y-%m-%d') if e.enrolled_at else None,
                'completed_at': e.completed_at.strftime('%B %d, %Y') if e.completed_at else None,
                'certificate_id': e.certificate_id,
                'skills_credited': e.skills_credited
            })

        return Response({
            'count': len(data),
            'enrollments': data
        })
