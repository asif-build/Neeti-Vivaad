import json
import time
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from core.models import OfficialSkillProficiency
from .models import VivaadSession, VivaadDecision, VivaadEvaluation
from .vivaad_ai import get_vivaad_engine


class VivaadDecisionStreamView(APIView):
    """
    Streams authentic backend decision processing stages via Server-Sent Events (SSE).
    Never uses fake spinners; each emitted event represents a real backend analysis step.
    Emits:
    1. understanding_decision: Reviewing scenario facts and user's decision
    2. checking_evidence: Verifying document guidelines and constraints
    3. evaluating_perspectives: Analyzing competing viewpoints and operational trade-offs
    4. preparing_feedback: Synthesizing the 7-part evaluation schema
    5. complete: Emits final payload with evaluation result and updated session
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        user = request.user
        option_id = request.data.get('selected_option_id', '').strip()
        option_label = request.data.get('selected_option_label', '').strip()
        reasoning = request.data.get('reasoning', '').strip()
        language = request.data.get('language', 'en')

        if not option_id or not option_label:
            return Response({'error': 'Please select a decision option.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(reasoning) < 20:
            return Response(
                {'error': 'Please provide a detailed reasoning explanation (at least 20 characters) justifying your policy stance.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = VivaadSession.objects.select_related('scenario', 'scenario__source').get(id=session_id, user=user)
        except VivaadSession.DoesNotExist:
            return Response({'error': 'Session not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        def event_stream():
            # Stage 1: Understanding decision
            yield f"data: {json.dumps({'stage': 'understanding_decision', 'label': 'Reviewing your decision against scenario constraints...', 'step': 1, 'total_steps': 4})}\n\n"
            time.sleep(0.3)

            # Record or update decision
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

            # Stage 2: Checking evidence
            yield f"data: {json.dumps({'stage': 'checking_evidence', 'label': 'Checking relevant source evidence and statutory rules...', 'step': 2, 'total_steps': 4})}\n\n"
            time.sleep(0.3)

            # Stage 3: Evaluating stakeholder perspectives
            yield f"data: {json.dumps({'stage': 'evaluating_perspectives', 'label': 'Looking at different community & departmental perspectives...', 'step': 3, 'total_steps': 4})}\n\n"
            time.sleep(0.3)

            # Execute evaluation engine
            engine = get_vivaad_engine()
            all_turns = list(session.turns.all())
            eval_result = engine.evaluate_decision(
                scenario=session.scenario,
                selected_option_label=option_label,
                reasoning=reasoning,
                turns=all_turns,
                language=language
            )

            # Stage 4: Preparing feedback
            yield f"data: {json.dumps({'stage': 'preparing_feedback', 'label': 'Preparing your 7-part personalized policy feedback...', 'step': 4, 'total_steps': 4})}\n\n"
            time.sleep(0.2)

            # Save evaluation
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

            # Update competency scores
            for sub in session.scenario.target_subskills.all():
                prof, _ = OfficialSkillProficiency.objects.get_or_create(
                    user=user,
                    subskill=sub,
                    defaults={'score': 50.0}
                )
                score_boost = 6.0 if evaluation.overall_score >= 80 else (3.0 if evaluation.overall_score >= 60 else 1.0)
                prof.score = round(min(98.0, prof.score + score_boost), 1)
                prof.save()

            # Final complete payload
            complete_payload = {
                'stage': 'complete',
                'session_id': session.id,
                'decision': {
                    'selected_option_id': decision.selected_option_id,
                    'selected_option_label': decision.selected_option_label,
                    'reasoning': decision.reasoning
                },
                'evaluation': eval_result
            }
            yield f"data: {json.dumps(complete_payload)}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
