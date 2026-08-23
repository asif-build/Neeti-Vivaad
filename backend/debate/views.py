from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import User, OfficialSkillProficiency, SubSkill
from .models import DebateScenario, DebateSession, DebateRound, AgentArgument, DecisionReport, FallacyChallenge
from .mospi_rag import MoSPIRAGStore
from .engine import AGENT_PERSONAS, generate_agent_argument, generate_fallacy_challenge, generate_decision_report

class ScenariosListView(APIView):
    def get(self, request):
        scenarios = DebateScenario.objects.all()
        data = []
        for s in scenarios:
            data.append({
                'id': s.id,
                'title': s.title,
                'category': s.category,
                'description': s.description,
                'initial_constraint': s.initial_constraint
            })
        return Response({'scenarios': data})

class StartDebateView(APIView):
    def post(self, request):
        user = request.user if request.user.is_authenticated else User.objects.filter(role='OFFICIAL').first()
        if not user:
            user = User.objects.first()

        scenario_id = request.data.get('scenario_id')
        try:
            scenario = DebateScenario.objects.get(id=scenario_id)
        except DebateScenario.DoesNotExist:
            scenario = DebateScenario.objects.first()
            if not scenario:
                scenario = DebateScenario.objects.create(
                    title="Direct Benefit Transfer Survey Redesign: Continuous Digital Capture vs 5-Year Sample",
                    category="Data Policy",
                    description="Debate on replacing traditional periodic paper sample surveys with real-time digital household microdata capture across rural and urban blocks.",
                    initial_constraint="Standard 2026 MoSPI Operational Budget"
                )

        session = DebateSession.objects.create(
            user=user,
            scenario=scenario,
            active_constraint=scenario.initial_constraint,
            status='IN_PROGRESS'
        )

        # Generate Round 1: Opening Arguments
        round_1 = DebateRound.objects.create(
            session=session,
            round_number=1,
            round_name='Opening Arguments'
        )

        rag = MoSPIRAGStore()
        round_args = []
        for persona in AGENT_PERSONAS:
            query = f"{scenario.title} {persona['focus']}"
            retrieved_docs = rag.retrieve(query, top_k=1)
            doc = retrieved_docs[0] if retrieved_docs else {
                'doc_code': 'MOSPI-IDQF-2024',
                'title': 'India Data Quality Framework 2024',
                'content': 'Data collections must maintain high integrity and 95% confidence intervals.'
            }

            arg_text, cit, doc_code = generate_agent_argument(
                persona, scenario.title, 1, session.active_constraint, doc
            )

            arg_obj = AgentArgument.objects.create(
                round=round_1,
                agent_code=persona['code'],
                agent_name=persona['name'],
                avatar_color=persona['avatar_color'],
                priority_tag=persona['priority_tag'],
                argument_text=arg_text,
                source_citation=cit,
                document_code=doc_code
            )

            round_args.append({
                'id': arg_obj.id,
                'agent_code': arg_obj.agent_code,
                'agent_name': arg_obj.agent_name,
                'avatar_color': arg_obj.avatar_color,
                'priority_tag': arg_obj.priority_tag,
                'argument_text': arg_obj.argument_text,
                'source_citation': arg_obj.source_citation,
                'document_code': arg_obj.document_code
            })

        # Fallacy Challenge for Round 1
        f_data = generate_fallacy_challenge(1, "State Statistical Officer", round_args[0]['argument_text'])
        fallacy_obj = FallacyChallenge.objects.create(
            session=session,
            round_number=1,
            target_agent_name=f_data['options'][0],
            argument_snippet=f_data['snippet'],
            fallacy_type=f_data['fallacy'],
            options=f_data['options'],
            correct_option_index=f_data['correct'],
            explanation=f_data['explanation']
        )

        return Response({
            'session_id': session.id,
            'scenario_title': scenario.title,
            'category': scenario.category,
            'active_constraint': session.active_constraint,
            'current_round': 1,
            'round_name': round_1.round_name,
            'arguments': round_args,
            'fallacy_challenge': {
                'id': fallacy_obj.id,
                'round_number': 1,
                'argument_snippet': fallacy_obj.argument_snippet,
                'options': fallacy_obj.options,
                'explanation': fallacy_obj.explanation
            }
        }, status=status.HTTP_201_CREATED)

class NextRoundView(APIView):
    def post(self, request):
        session_id = request.data.get('session_id')
        try:
            session = DebateSession.objects.get(id=session_id)
        except DebateSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        last_round = session.rounds.order_by('-round_number').first()
        next_num = (last_round.round_number + 1) if last_round else 1

        if next_num > 4:
            # Generate final decision report if not already existing
            if not hasattr(session, 'decision_report'):
                generate_decision_report(session, session.rounds.all())
            return Response({'message': 'Debate concluded', 'status': 'CONCLUDED'})

        round_names = {
            2: 'Rebuttal & Cross-Examination',
            3: 'Constraint Adaptability Stance',
            4: 'Final Synthesis Stance'
        }
        r_name = round_names.get(next_num, f'Round {next_num}')

        new_round = DebateRound.objects.create(
            session=session,
            round_number=next_num,
            round_name=r_name
        )

        rag = MoSPIRAGStore()
        round_args = []
        for persona in AGENT_PERSONAS:
            query = f"{session.scenario.title} {persona['focus']} round {next_num}"
            retrieved_docs = rag.retrieve(query, top_k=1)
            doc = retrieved_docs[0] if retrieved_docs else {
                'doc_code': 'NSC-REC-2023-08',
                'title': 'NSC Direct Benefit Transfer Recommendation',
                'content': 'Transition to digital surveys must preserve representativeness.'
            }

            arg_text, cit, doc_code = generate_agent_argument(
                persona, session.scenario.title, next_num, session.active_constraint, doc
            )

            arg_obj = AgentArgument.objects.create(
                round=new_round,
                agent_code=persona['code'],
                agent_name=persona['name'],
                avatar_color=persona['avatar_color'],
                priority_tag=persona['priority_tag'],
                argument_text=arg_text,
                source_citation=cit,
                document_code=doc_code
            )

            round_args.append({
                'id': arg_obj.id,
                'agent_code': arg_obj.agent_code,
                'agent_name': arg_obj.agent_name,
                'avatar_color': arg_obj.avatar_color,
                'priority_tag': arg_obj.priority_tag,
                'argument_text': arg_obj.argument_text,
                'source_citation': arg_obj.source_citation,
                'document_code': arg_obj.document_code
            })

        # Fallacy Challenge for this round
        f_data = generate_fallacy_challenge(next_num, AGENT_PERSONAS[(next_num-1)%4]['name'], round_args[0]['argument_text'])
        fallacy_obj = FallacyChallenge.objects.create(
            session=session,
            round_number=next_num,
            target_agent_name=f_data['options'][0],
            argument_snippet=f_data['snippet'],
            fallacy_type=f_data['fallacy'],
            options=f_data['options'],
            correct_option_index=f_data['correct'],
            explanation=f_data['explanation']
        )

        decision_report_data = None
        if next_num == 4:
            session.status = 'CONCLUDED'
            session.save()
            report = generate_decision_report(session, session.rounds.all())
            decision_report_data = {
                'executive_summary': report.executive_summary,
                'recommended_policy': report.recommended_policy,
                'tradeoffs_identified': report.tradeoffs_identified,
                'mitigation_steps': report.mitigation_steps,
                'judgment_tree': report.judgment_tree
            }

        return Response({
            'session_id': session.id,
            'current_round': next_num,
            'round_name': r_name,
            'arguments': round_args,
            'fallacy_challenge': {
                'id': fallacy_obj.id,
                'round_number': next_num,
                'argument_snippet': fallacy_obj.argument_snippet,
                'options': fallacy_obj.options,
                'explanation': fallacy_obj.explanation
            },
            'decision_report': decision_report_data
        })

class InjectConstraintView(APIView):
    """What-If Injector endpoint: changes active constraint mid-debate."""
    def post(self, request):
        session_id = request.data.get('session_id')
        constraint_text = request.data.get('constraint_text', 'Budget reduced by 40%')

        try:
            session = DebateSession.objects.get(id=session_id)
        except DebateSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        session.active_constraint = constraint_text
        session.save()

        # Trigger immediate what-if response round
        next_view = NextRoundView()
        return next_view.post(request)

class AnswerFallacyView(APIView):
    """Fallacy Hunter evaluation endpoint."""
    def post(self, request):
        challenge_id = request.data.get('challenge_id')
        selected_option_index = request.data.get('option_index')

        try:
            challenge = FallacyChallenge.objects.get(id=challenge_id)
        except FallacyChallenge.DoesNotExist:
            return Response({'error': 'Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

        is_correct = (int(selected_option_index) == challenge.correct_option_index)
        challenge.is_answered = True
        challenge.user_answered_index = int(selected_option_index)
        challenge.is_user_correct = is_correct
        challenge.save()

        # Update User CTQ score
        user = challenge.session.user
        old_ctq = user.ctq_score
        ctq_delta = 5.0 if is_correct else -1.5
        user.ctq_score = round(min(100.0, max(0.0, user.ctq_score + ctq_delta)), 1)
        user.save()

        # Feed CTQ into Behavioural/Managerial competency score
        beh_skill = SubSkill.objects.filter(domain__domain_type='BEHAVIOURAL').first()
        if beh_skill:
            prof, _ = OfficialSkillProficiency.objects.get_or_create(user=user, subskill=beh_skill)
            prof.score = round(min(100.0, prof.score + (3.0 if is_correct else 0.0)), 1)
            prof.save()

        return Response({
            'challenge_id': challenge.id,
            'is_correct': is_correct,
            'correct_option_index': challenge.correct_option_index,
            'explanation': challenge.explanation,
            'ctq_delta': ctq_delta,
            'new_ctq_score': user.ctq_score
        })

class GetDebateSessionView(APIView):
    def get(self, request, session_id):
        try:
            session = DebateSession.objects.get(id=session_id)
        except DebateSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        rounds_data = []
        for r in session.rounds.all():
            args = []
            for arg in r.arguments.all():
                args.append({
                    'id': arg.id,
                    'agent_code': arg.agent_code,
                    'agent_name': arg.agent_name,
                    'avatar_color': arg.avatar_color,
                    'priority_tag': arg.priority_tag,
                    'argument_text': arg.argument_text,
                    'source_citation': arg.source_citation,
                    'document_code': arg.document_code
                })
            rounds_data.append({
                'round_number': r.round_number,
                'round_name': r.round_name,
                'arguments': args
            })

        fallacies_data = []
        for f in session.fallacies.all():
            fallacies_data.append({
                'id': f.id,
                'round_number': f.round_number,
                'argument_snippet': f.argument_snippet,
                'options': f.options,
                'is_answered': f.is_answered,
                'is_user_correct': f.is_user_correct,
                'correct_option_index': f.correct_option_index,
                'explanation': f.explanation
            })

        report_data = None
        if hasattr(session, 'decision_report'):
            rep = session.decision_report
            report_data = {
                'executive_summary': rep.executive_summary,
                'recommended_policy': rep.recommended_policy,
                'tradeoffs_identified': rep.tradeoffs_identified,
                'mitigation_steps': rep.mitigation_steps,
                'judgment_tree': rep.judgment_tree
            }

        return Response({
            'session_id': session.id,
            'scenario_title': session.scenario.title,
            'category': session.scenario.category,
            'active_constraint': session.active_constraint,
            'status': session.status,
            'rounds': rounds_data,
            'fallacy_challenges': fallacies_data,
            'decision_report': report_data
        })
