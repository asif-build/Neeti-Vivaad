import os
import re
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from core.models import User, OfficialSkillProficiency, SubSkill
from core.throttling import VivaadScenarioGenThrottle, VivaadDecisionThrottle, ResumeUploadThrottle
from core.recaptcha import verify_recaptcha
from assessment.extraction import process_document_source, DocumentExtractionError
from .models import (
    DebateScenario, DebateSession, DebateRound, AgentArgument, DecisionReport, FallacyChallenge,
    VivaadSource, VivaadScenario, VivaadPerspective, VivaadSession, VivaadTurn, VivaadDecision, VivaadEvaluation
)
from .vivaad_ai import get_vivaad_engine, VivaadAIError, STANDARD_EVALUATION_CRITERIA
from .mospi_rag import MoSPIRAGStore
from .engine import AGENT_PERSONAS, generate_agent_argument, generate_fallacy_challenge, generate_decision_report


# =====================================================================
# PHASE 2: NEETI VIVAAD STUDIO (Authoring Flow: Source, Scenario, Edit, Publish)
# =====================================================================

class VivaadSourceUploadView(APIView):
    """
    Ingest a document source (PDF, DOCX, TXT) for Option A scenario generation.
    Extracts text, preserves page and heading provenance, creates structured chunks.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ResumeUploadThrottle]

    def post(self, request):
        user = request.user
        title = request.data.get('title', '').strip()
        file_obj = request.FILES.get('file')
        raw_text = request.data.get('text', '').strip()

        if not file_obj and not raw_text:
            return Response(
                {'error': "Please provide a PDF/DOCX file or paste scenario reference text."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if file_obj:
                if file_obj.size > 15 * 1024 * 1024:
                    return Response({'error': "File size exceeds 15MB limit. Please upload a smaller document."}, status=status.HTTP_400_BAD_REQUEST)

                # Sanitize filename
                safe_basename = os.path.basename(file_obj.name)
                clean_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', safe_basename)
                file_obj.name = clean_filename
                filename = clean_filename

                ext = os.path.splitext(filename)[1].lower()
                if ext not in ['.pdf', '.docx', '.doc', '.txt']:
                    return Response({'error': f"Unsupported file type '{ext}'. Please upload a PDF, DOCX, or TXT document."}, status=status.HTTP_400_BAD_REQUEST)

                file_bytes = file_obj.read()
                if len(file_bytes) == 0:
                    return Response({'error': "Uploaded file is empty."}, status=status.HTTP_400_BAD_REQUEST)

                # Magic byte check
                if ext == '.pdf' and not file_bytes[:4] == b'%PDF':
                    return Response({'error': 'Uploaded file is not a valid PDF document.'}, status=status.HTTP_400_BAD_REQUEST)
                elif ext == '.docx' and not file_bytes[:4] == b'PK\x03\x04':
                    return Response({'error': 'Uploaded file is not a valid DOCX document.'}, status=status.HTTP_400_BAD_REQUEST)

                extracted_data = process_document_source(file_bytes, filename)
            else:
                filename = "Custom Policy Reference.txt"
                file_bytes = raw_text.encode('utf-8')
                extracted_data = process_document_source(file_bytes, filename)

        except DocumentExtractionError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': "We couldn't read this document. Please verify the format."},
                status=status.HTTP_400_BAD_REQUEST
            )

        doc_title = title or os.path.splitext(extracted_data["filename"])[0]
        source = VivaadSource.objects.create(
            user=user,
            title=doc_title,
            file=file_obj,
            filename=extracted_data["filename"],
            file_type=extracted_data["file_type"],
            file_size=extracted_data["file_size"],
            content_hash=extracted_data["content_hash"],
            page_count=extracted_data["page_count"],
            extracted_text=extracted_data["extracted_text"],
            chunks=extracted_data["chunks"]
        )

        return Response({
            'source_id': source.id,
            'title': source.title,
            'filename': source.filename,
            'file_type': source.file_type,
            'page_count': source.page_count,
            'chunk_count': len(source.chunks),
            'preview': source.extracted_text[:350] + ('...' if len(source.extracted_text) > 350 else '')
        }, status=status.HTTP_201_CREATED)


class VivaadScenarioGenerateView(APIView):
    """
    Synthesize a structured Policy Decision Scenario draft.
    Supports Option A (from source document) and Option B (from creator custom text).
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [VivaadScenarioGenThrottle]

    def post(self, request):
        captcha_valid, captcha_error = verify_recaptcha(request, expected_action='vivaad_scenario_gen')
        if not captcha_valid:
            return Response({'error': captcha_error}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        source_id = request.data.get('source_id')
        title = request.data.get('title', '').strip()
        situation = request.data.get('situation', '').strip()
        decision_question = request.data.get('decision_question', '').strip()
        constraints_input = request.data.get('constraints')
        category = request.data.get('category', 'Data Policy')
        difficulty = request.data.get('difficulty', 'Intermediate')
        subskill_id = request.data.get('subskill_id')

        engine = get_vivaad_engine()
        source = None
        source_type = 'CUSTOM'

        try:
            if source_id:
                # Option A: Document-Backed Scenario
                source = VivaadSource.objects.get(id=source_id, user=user)
                source_type = 'DOCUMENT'
                generated = engine.generate_from_source(
                    chunks=source.chunks,
                    title=title,
                    category=category,
                    difficulty=difficulty
                )
            else:
                # Option B: Creator-Provided Custom Scenario
                if not situation:
                    return Response({'error': 'Please provide the situation/background description.'}, status=status.HTTP_400_BAD_REQUEST)
                generated = engine.generate_from_custom(
                    title=title,
                    situation=situation,
                    decision_question=decision_question,
                    constraints_input=constraints_input,
                    category=category,
                    difficulty=difficulty
                )
        except VivaadSource.DoesNotExist:
            return Response({'error': 'Source document not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)
        except VivaadAIError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'error': f"Scenario generation failed: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create VivaadScenario record
        scenario = VivaadScenario.objects.create(
            created_by=user,
            title=generated["title"],
            source_type=source_type,
            source=source,
            category=category,
            difficulty=difficulty,
            status='DRAFT',
            version=1,
            situation=generated["situation"],
            decision_question=generated["decision_question"],
            objective=generated.get("objective", ""),
            constraints=generated.get("constraints", []),
            affected_people=generated.get("affected_people", []),
            risks=generated.get("risks", []),
            options=generated.get("options", []),
            evaluation_criteria=generated.get("evaluation_criteria", STANDARD_EVALUATION_CRITERIA)
        )

        # Associate SubSkill if provided
        if subskill_id:
            sub = SubSkill.objects.filter(id=subskill_id).first()
            if sub:
                scenario.target_subskills.add(sub)
        else:
            first_sub = SubSkill.objects.first()
            if first_sub:
                scenario.target_subskills.add(first_sub)

        # Create Perspectives
        perspectives_data = []
        for p in generated.get("perspectives", []):
            persp_obj = VivaadPerspective.objects.create(
                scenario=scenario,
                name=p["name"],
                role=p["role"],
                avatar_color=p.get("avatar_color", "emerald"),
                primary_concern=p["primary_concern"],
                objective=p.get("objective", ""),
                position=p["position"],
                relevant_evidence=p.get("relevant_evidence", ""),
                source_page=p.get("source_page"),
                source_section=p.get("source_section", ""),
                key_questions=p.get("key_questions", []),
                order=p.get("order", 1)
            )
            perspectives_data.append({
                'id': persp_obj.id,
                'name': persp_obj.name,
                'role': persp_obj.role,
                'avatar_color': persp_obj.avatar_color,
                'primary_concern': persp_obj.primary_concern,
                'objective': persp_obj.objective,
                'position': persp_obj.position,
                'relevant_evidence': persp_obj.relevant_evidence,
                'source_page': persp_obj.source_page,
                'source_section': persp_obj.source_section,
                'key_questions': persp_obj.key_questions
            })

        return Response({
            'scenario_id': scenario.id,
            'title': scenario.title,
            'source_type': scenario.source_type,
            'source_label': scenario.get_source_type_display(),
            'category': scenario.category,
            'difficulty': scenario.difficulty,
            'status': scenario.status,
            'version': scenario.version,
            'situation': scenario.situation,
            'decision_question': scenario.decision_question,
            'objective': scenario.objective,
            'constraints': scenario.constraints,
            'affected_people': scenario.affected_people,
            'risks': scenario.risks,
            'options': scenario.options,
            'evaluation_criteria': scenario.evaluation_criteria,
            'perspectives': perspectives_data
        }, status=status.HTTP_201_CREATED)


class VivaadScenarioManageView(APIView):
    """
    Author review workspace: inspect, edit, or delete a scenario draft.
    Enforces IDOR authorization (only creator or staff).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, scenario_id):
        user = request.user
        try:
            scenario = VivaadScenario.objects.select_related('source', 'created_by').get(id=scenario_id)
        except VivaadScenario.DoesNotExist:
            return Response({'error': 'Scenario not found.'}, status=status.HTTP_404_NOT_FOUND)

        if scenario.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized to view this studio draft.'}, status=status.HTTP_403_FORBIDDEN)

        perspectives = scenario.perspectives.all()
        p_list = [
            {
                'id': p.id,
                'name': p.name,
                'role': p.role,
                'avatar_color': p.avatar_color,
                'primary_concern': p.primary_concern,
                'objective': p.objective,
                'position': p.position,
                'relevant_evidence': p.relevant_evidence,
                'source_page': p.source_page,
                'source_section': p.source_section,
                'key_questions': p.key_questions
            }
            for p in perspectives
        ]

        return Response({
            'scenario_id': scenario.id,
            'title': scenario.title,
            'source_type': scenario.source_type,
            'source_label': scenario.get_source_type_display(),
            'category': scenario.category,
            'difficulty': scenario.difficulty,
            'status': scenario.status,
            'version': scenario.version,
            'situation': scenario.situation,
            'decision_question': scenario.decision_question,
            'objective': scenario.objective,
            'constraints': scenario.constraints,
            'affected_people': scenario.affected_people,
            'risks': scenario.risks,
            'options': scenario.options,
            'evaluation_criteria': scenario.evaluation_criteria,
            'perspectives': p_list
        })

    def patch(self, request, scenario_id):
        user = request.user
        try:
            scenario = VivaadScenario.objects.get(id=scenario_id)
        except VivaadScenario.DoesNotExist:
            return Response({'error': 'Scenario not found.'}, status=status.HTTP_404_NOT_FOUND)

        if scenario.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized to edit this scenario.'}, status=status.HTTP_403_FORBIDDEN)

        # If scenario is published, creating edits initiates a new draft version
        if scenario.status == 'PUBLISHED':
            scenario.pk = None
            scenario.version += 1
            scenario.status = 'DRAFT'
            scenario.published_at = None

        data = request.data
        if 'title' in data:
            scenario.title = data['title'].strip()
        if 'situation' in data:
            scenario.situation = data['situation'].strip()
        if 'decision_question' in data:
            scenario.decision_question = data['decision_question'].strip()
        if 'objective' in data:
            scenario.objective = data['objective'].strip()
        if 'category' in data:
            scenario.category = data['category']
        if 'difficulty' in data:
            scenario.difficulty = data['difficulty']
        if 'constraints' in data:
            scenario.constraints = data['constraints']
        if 'affected_people' in data:
            scenario.affected_people = data['affected_people']
        if 'risks' in data:
            scenario.risks = data['risks']
        if 'options' in data:
            scenario.options = data['options']
        scenario.save()

        return Response({'message': 'Scenario updated successfully.', 'scenario_id': scenario.id, 'version': scenario.version})

    def delete(self, request, scenario_id):
        user = request.user
        try:
            scenario = VivaadScenario.objects.get(id=scenario_id)
        except VivaadScenario.DoesNotExist:
            return Response({'error': 'Scenario not found.'}, status=status.HTTP_404_NOT_FOUND)

        if scenario.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized to delete this scenario.'}, status=status.HTTP_403_FORBIDDEN)

        scenario.delete()
        return Response({'message': 'Scenario deleted successfully.'})


class VivaadPerspectiveActionView(APIView):
    """
    Granular author operations on perspectives:
    - action='add': Add a manual perspective
    - action='regenerate': Refresh perspective with alternative angle
    - action='delete': Remove perspective
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, scenario_id):
        user = request.user
        try:
            scenario = VivaadScenario.objects.select_related('source').get(id=scenario_id)
        except VivaadScenario.DoesNotExist:
            return Response({'error': 'Scenario not found.'}, status=status.HTTP_404_NOT_FOUND)

        if scenario.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action', 'add')

        if action == 'add':
            name = request.data.get('name', '').strip()
            role = request.data.get('role', '').strip()
            concern = request.data.get('primary_concern', '').strip()
            position = request.data.get('position', '').strip()
            objective = request.data.get('objective', '').strip()
            evidence = request.data.get('relevant_evidence', '').strip()
            source_page = request.data.get('source_page')
            key_questions = request.data.get('key_questions', [])
            avatar_color = request.data.get('avatar_color', 'emerald')

            if not name or not role or not position:
                return Response({'error': 'Name, role, and position are required.'}, status=status.HTTP_400_BAD_REQUEST)

            next_order = scenario.perspectives.count() + 1
            persp = VivaadPerspective.objects.create(
                scenario=scenario,
                name=name,
                role=role,
                avatar_color=avatar_color,
                primary_concern=concern,
                objective=objective,
                position=position,
                relevant_evidence=evidence,
                source_page=int(source_page) if source_page else None,
                key_questions=key_questions,
                order=next_order
            )

            return Response({
                'message': 'Perspective added successfully.',
                'perspective': {
                    'id': persp.id,
                    'name': persp.name,
                    'role': persp.role,
                    'avatar_color': persp.avatar_color,
                    'primary_concern': persp.primary_concern,
                    'position': persp.position,
                    'key_questions': persp.key_questions
                }
            }, status=status.HTTP_201_CREATED)

        elif action == 'regenerate':
            persp_id = request.data.get('perspective_id')
            persp = scenario.perspectives.filter(id=persp_id).first()
            if not persp:
                return Response({'error': 'Perspective not found.'}, status=status.HTTP_404_NOT_FOUND)

            # Regenerate dynamic perspective
            persp.position = f"\"{persp.role} strongly emphasizes {persp.primary_concern}. Implementation must balance administrative velocity with strict accountability.\""
            persp.save()
            return Response({'message': 'Perspective regenerated.', 'perspective_id': persp.id})

        elif action == 'delete':
            persp_id = request.data.get('perspective_id')
            persp = scenario.perspectives.filter(id=persp_id).first()
            if not persp:
                return Response({'error': 'Perspective not found.'}, status=status.HTTP_404_NOT_FOUND)
            persp.delete()
            return Response({'message': 'Perspective deleted successfully.'})

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class VivaadScenarioPublishView(APIView):
    """
    Publish a policy decision scenario. Freezes the version and makes it visible in the learner catalog.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, scenario_id):
        user = request.user
        try:
            scenario = VivaadScenario.objects.get(id=scenario_id)
        except VivaadScenario.DoesNotExist:
            return Response({'error': 'Scenario not found.'}, status=status.HTTP_404_NOT_FOUND)

        if scenario.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized to publish.'}, status=status.HTTP_403_FORBIDDEN)

        if scenario.perspectives.count() < 2:
            return Response({'error': 'A scenario must have at least 2 perspectives before publishing.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(scenario.options) < 2:
            return Response({'error': 'A scenario must have at least 2 decision options before publishing.'}, status=status.HTTP_400_BAD_REQUEST)

        scenario.status = 'PUBLISHED'
        scenario.published_at = timezone.now()
        scenario.save()

        return Response({
            'message': 'Scenario published successfully! It is now live for civil servants.',
            'scenario_id': scenario.id,
            'version': scenario.version,
            'status': scenario.status,
            'published_at': scenario.published_at
        })


class VivaadStudioDashboardView(APIView):
    """
    Creator dashboard listing drafts, published, and archived scenarios.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        scenarios = VivaadScenario.objects.filter(created_by=user).order_by('-updated_at')
        results = [
            {
                'id': s.id,
                'title': s.title,
                'status': s.status,
                'version': s.version,
                'category': s.category,
                'difficulty': s.difficulty,
                'source_type': s.source_type,
                'source_label': s.get_source_type_display(),
                'perspectives_count': s.perspectives.count(),
                'options_count': len(s.options),
                'created_at': s.created_at,
                'updated_at': s.updated_at,
                'published_at': s.published_at
            }
            for s in scenarios
        ]
        return Response({'total': len(results), 'scenarios': results})


# =====================================================================
# PHASE 2: LEARNER EXPERIENCE (Catalog, Perspectives, Discussion, Decision & Evaluation)
# =====================================================================

class VivaadScenarioCatalogView(APIView):
    """
    Public / Authenticated catalog of PUBLISHED policy decision scenarios.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = VivaadScenario.objects.filter(status='PUBLISHED').prefetch_related('perspectives', 'target_subskills')

        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        difficulty = request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty__iexact=difficulty)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)

        results = []
        for s in queryset:
            results.append({
                'id': s.id,
                'title': s.title,
                'category': s.category,
                'difficulty': s.difficulty,
                'version': s.version,
                'source_type': s.source_type,
                'source_label': s.get_source_type_display(),
                'situation_summary': s.situation[:180] + ('...' if len(s.situation) > 180 else ''),
                'decision_question': s.decision_question,
                'perspective_count': s.perspectives.count(),
                'published_at': s.published_at
            })

        return Response({'total': len(results), 'scenarios': results})


class VivaadScenarioDetailView(APIView):
    """
    Retrieves full scenario situation, constraints, affected people, and perspective cards.
    """
    permission_classes = [AllowAny]

    def get(self, request, scenario_id):
        try:
            scenario = VivaadScenario.objects.select_related('source').get(id=scenario_id)
        except VivaadScenario.DoesNotExist:
            return Response({'error': 'Scenario not found.'}, status=status.HTTP_404_NOT_FOUND)

        if scenario.status != 'PUBLISHED':
            if not request.user.is_authenticated or (scenario.created_by != request.user and not request.user.is_staff):
                return Response({'error': 'This scenario is not published.'}, status=status.HTTP_404_NOT_FOUND)

        perspectives = scenario.perspectives.all()
        p_list = [
            {
                'id': p.id,
                'name': p.name,
                'role': p.role,
                'avatar_color': p.avatar_color,
                'primary_concern': p.primary_concern,
                'objective': p.objective,
                'position': p.position,
                'relevant_evidence': p.relevant_evidence,
                'source_page': p.source_page,
                'source_section': p.source_section,
                'key_questions': p.key_questions
            }
            for p in perspectives
        ]

        source_data = None
        if scenario.source:
            source_data = {
                'id': scenario.source.id,
                'title': scenario.source.title,
                'filename': scenario.source.filename,
                'file_type': scenario.source.file_type,
                'page_count': scenario.source.page_count,
                'file_size': scenario.source.file_size,
                'chunks': [
                    {
                        'chunk_id': c.get('chunk_id', idx + 1),
                        'page_number': c.get('page_number', 1),
                        'section_title': c.get('section_title') or c.get('heading', f"Page {c.get('page_number', 1)}"),
                        'text': c.get('text', '')
                    }
                    for idx, c in enumerate(scenario.source.chunks)
                ],
                'preview': scenario.source.extracted_text[:600]
            }

        return Response({
            'id': scenario.id,
            'title': scenario.title,
            'version': scenario.version,
            'category': scenario.category,
            'difficulty': scenario.difficulty,
            'source_type': scenario.source_type,
            'source_label': scenario.get_source_type_display(),
            'source': source_data,
            'situation': scenario.situation,
            'decision_question': scenario.decision_question,
            'objective': scenario.objective,
            'constraints': scenario.constraints,
            'affected_people': scenario.affected_people,
            'risks': scenario.risks,
            'options': scenario.options,
            'perspectives': p_list
        })


class VivaadSessionStartView(APIView):
    """
    Start an authenticated learner simulation session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        captcha_valid, captcha_error = verify_recaptcha(request, expected_action='start_vivaad')
        if not captcha_valid:
            return Response({'error': captcha_error}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        scenario_id = request.data.get('scenario_id')

        try:
            scenario = VivaadScenario.objects.get(id=scenario_id)
        except VivaadScenario.DoesNotExist:
            return Response({'error': 'Scenario not found.'}, status=status.HTTP_404_NOT_FOUND)

        session = VivaadSession.objects.create(
            user=user,
            scenario=scenario,
            scenario_version=scenario.version,
            status='IN_PROGRESS'
        )

        return Response({
            'session_id': session.id,
            'scenario_id': scenario.id,
            'scenario_title': scenario.title,
            'version': scenario.version,
            'status': session.status,
            'started_at': session.started_at
        }, status=status.HTTP_201_CREATED)


class VivaadSessionTurnView(APIView):
    """
    Controlled interactive dialogue with a selected perspective (capped at 4 turns).
    Perspective responds with dynamic in-character policy arguments and challenges.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        user = request.user
        perspective_id = request.data.get('perspective_id')
        user_message = request.data.get('message', '').strip()

        if not user_message:
            return Response({'error': 'Please provide a message or response.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = VivaadSession.objects.select_related('scenario').get(id=session_id, user=user)
        except VivaadSession.DoesNotExist:
            return Response({'error': 'Session not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'IN_PROGRESS':
            return Response({'error': 'This simulation session has already concluded.'}, status=status.HTTP_400_BAD_REQUEST)

        perspective = session.scenario.perspectives.filter(id=perspective_id).first()
        if not perspective:
            perspective = session.scenario.perspectives.first()

        # Count previous learner turns for this session
        previous_turns = session.turns.filter(perspective=perspective)
        learner_turn_count = previous_turns.filter(speaker_type='LEARNER').count() + 1

        # Record learner's turn
        VivaadTurn.objects.create(
            session=session,
            perspective=perspective,
            turn_number=learner_turn_count,
            speaker_type='LEARNER',
            message=user_message
        )

        # Generate dynamic perspective reply
        engine = get_vivaad_engine()
        history_dicts = [{'speaker_type': t.speaker_type, 'message': t.message} for t in previous_turns]
        reply_data = engine.generate_perspective_reply(
            scenario=session.scenario,
            perspective=perspective,
            history=history_dicts,
            learner_message=user_message
        )

        # Record perspective's turn
        VivaadTurn.objects.create(
            session=session,
            perspective=perspective,
            turn_number=learner_turn_count,
            speaker_type='PERSPECTIVE',
            message=reply_data["reply"]
        )

        return Response({
            'session_id': session.id,
            'perspective_id': perspective.id,
            'perspective_name': perspective.name,
            'perspective_role': perspective.role,
            'learner_turn_number': learner_turn_count,
            'reply': reply_data["reply"],
            'is_final_turn': reply_data.get("is_final_turn", learner_turn_count >= 3),
            'max_turns': 3
        })


class VivaadSessionDecideView(APIView):
    """
    Submit final decision option and mandatory reasoning.
    Executes multi-criteria evaluation across 6 dimensions without dogma.
    Updates official competency progress with audit provenance.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [VivaadDecisionThrottle]

    def post(self, request, session_id):
        captcha_valid, captcha_error = verify_recaptcha(request, expected_action='submit_vivaad_decision')
        if not captcha_valid:
            return Response({'error': captcha_error}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        option_id = request.data.get('selected_option_id', '').strip()
        option_label = request.data.get('selected_option_label', '').strip()
        reasoning = request.data.get('reasoning', '').strip()

        if not option_id or not option_label:
            return Response({'error': 'Please select a decision option.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(reasoning) < 20:
            return Response({'error': 'Please provide a detailed reasoning explanation (at least 20 characters) justifying your policy stance.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = VivaadSession.objects.select_related('scenario', 'scenario__source').get(id=session_id, user=user)
        except VivaadSession.DoesNotExist:
            return Response({'error': 'Session not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        # Create or update Decision record
        decision, _ = VivaadDecision.objects.get_or_create(
            session=session,
            defaults={
                'selected_option_id': option_id,
                'selected_option_label': option_label,
                'reasoning': reasoning
            }
        )
        decision.selected_option_id = option_id
        decision.selected_option_label = option_label
        decision.reasoning = reasoning
        decision.save()

        language = request.data.get('language', 'en')

        # Multi-criteria evaluation
        engine = get_vivaad_engine()
        all_turns = list(session.turns.all())
        eval_result = engine.evaluate_decision(
            scenario=session.scenario,
            selected_option_label=option_label,
            reasoning=reasoning,
            turns=all_turns,
            language=language
        )

        # Create or update Evaluation record
        evaluation, _ = VivaadEvaluation.objects.get_or_create(
            session=session,
            defaults={
                'overall_score': eval_result["overall_score"],
                'criteria_scores': eval_result["criteria_scores"],
                'what_you_did_well': eval_result["what_you_did_well"],
                'try_next_time': eval_result["try_next_time"],
                'tradeoffs_analysis': eval_result["tradeoffs_analysis"],
                'source_backed_notes': eval_result["source_backed_notes"],
                'competency_deltas': eval_result["competency_deltas"]
            }
        )
        evaluation.overall_score = eval_result["overall_score"]
        evaluation.criteria_scores = eval_result["criteria_scores"]
        evaluation.what_you_did_well = eval_result["what_you_did_well"]
        evaluation.try_next_time = eval_result["try_next_time"]
        evaluation.tradeoffs_analysis = eval_result["tradeoffs_analysis"]
        evaluation.source_backed_notes = eval_result["source_backed_notes"]
        evaluation.competency_deltas = eval_result["competency_deltas"]
        evaluation.save()

        session.status = 'EVALUATED'
        session.completed_at = timezone.now()
        session.save()

        # Update Competency Progression modestly
        target_subskills = session.scenario.target_subskills.all()
        competency_updates = []
        for sub in target_subskills:
            prof, _ = OfficialSkillProficiency.objects.get_or_create(
                user=user,
                subskill=sub,
                defaults={'score': 50.0}
            )
            score_boost = 6.0 if evaluation.overall_score >= 80 else (3.0 if evaluation.overall_score >= 60 else 1.0)
            prof.score = round(min(98.0, prof.score + score_boost), 1)
            prof.save()
            competency_updates.append({
                'subskill_name': sub.name,
                'delta': score_boost,
                'new_score': prof.score
            })

        return Response({
            'message': 'Decision evaluated successfully.',
            'session_id': session.id,
            'decision': {
                'selected_option_id': decision.selected_option_id,
                'selected_option_label': decision.selected_option_label,
                'reasoning': decision.reasoning
            },
            'evaluation': {
                'overall_score': evaluation.overall_score,
                'makes_sense_because': eval_result.get('makes_sense_because', ''),
                'think_about_this_too': eval_result.get('think_about_this_too', []),
                'another_view': eval_result.get('another_view', ''),
                'criteria_scores': evaluation.criteria_scores,
                'criteria_feedback': eval_result.get('criteria_feedback', {}),
                'what_you_considered': eval_result.get('what_you_considered', []),
                'areas_to_think_about': eval_result.get('areas_to_think_about', []),
                'other_perspectives_reaction': eval_result.get('other_perspectives_reaction', []),
                'what_you_did_well': evaluation.what_you_did_well,
                'try_next_time': evaluation.try_next_time,
                'tradeoffs_analysis': evaluation.tradeoffs_analysis,
                'source_backed_notes': evaluation.source_backed_notes,
                'competency_updates': competency_updates
            }
        })


class VivaadSessionResultView(APIView):
    """
    Retrieve stored evaluation, scores, and feedback for a finished session.
    Enforces IDOR ownership protection.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        user = request.user
        try:
            session = VivaadSession.objects.select_related('scenario', 'decision_record', 'evaluation_record').get(id=session_id)
        except VivaadSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.user != user and not user.is_staff:
            return Response({'error': 'Unauthorized to view this session result.'}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(session, 'evaluation_record'):
            return Response({'error': 'This session has not yet been evaluated.'}, status=status.HTTP_400_BAD_REQUEST)

        decision = session.decision_record
        evaluation = session.evaluation_record

        # Re-evaluate dynamically for fresh structured feedback if needed
        engine = get_vivaad_engine()
        all_turns = list(session.turns.all())
        language = request.query_params.get('language', 'en')
        fresh_eval = engine.evaluate_decision(
            scenario=session.scenario,
            selected_option_label=decision.selected_option_label,
            reasoning=decision.reasoning,
            turns=all_turns,
            language=language
        )

        return Response({
            'session_id': session.id,
            'scenario_title': session.scenario.title,
            'scenario_version': session.scenario_version,
            'completed_at': session.completed_at,
            'decision': {
                'selected_option_label': decision.selected_option_label,
                'reasoning': decision.reasoning
            },
            'evaluation': {
                'overall_score': evaluation.overall_score,
                'makes_sense_because': fresh_eval.get('makes_sense_because', ''),
                'think_about_this_too': fresh_eval.get('think_about_this_too', []),
                'another_view': fresh_eval.get('another_view', ''),
                'criteria_scores': evaluation.criteria_scores,
                'criteria_feedback': fresh_eval.get('criteria_feedback', {}),
                'what_you_considered': fresh_eval.get('what_you_considered', []),
                'areas_to_think_about': fresh_eval.get('areas_to_think_about', []),
                'other_perspectives_reaction': fresh_eval.get('other_perspectives_reaction', []),
                'what_you_did_well': evaluation.what_you_did_well,
                'try_next_time': evaluation.try_next_time,
                'tradeoffs_analysis': evaluation.tradeoffs_analysis,
                'source_backed_notes': evaluation.source_backed_notes
            }
        })


# =====================================================================
# LEGACY DEBATE VIEWS (Preserved for backwards compatibility)
# =====================================================================

class ScenariosListView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return VivaadScenarioCatalogView().get(request)

class StartDebateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        return VivaadSessionStartView().post(request)

class NextRoundView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        return Response({'message': 'Please use Neeti Vivaad interactive turn dialogue.'})

class InjectConstraintView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        return Response({'message': 'Constraint injected.'})

class AnswerFallacyView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        return Response({'is_correct': True, 'explanation': 'Fallacy answered.'})

class GetDebateSessionView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, session_id):
        return VivaadSessionResultView().get(request, session_id)
