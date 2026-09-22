import json
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from core.models import User, SubSkill, OfficialSkillProficiency
from debate.models import (
    VivaadSource, VivaadScenario, VivaadPerspective,
    VivaadSession, VivaadTurn, VivaadDecision, VivaadEvaluation
)


class NeetiVivaadPhase2Tests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='officer_test',
            email='officer@mospi.gov.in',
            password='password123',
            first_name='Anil',
            last_name='Kumar'
        )
        self.other_user = User.objects.create_user(
            username='other_officer',
            email='other@mospi.gov.in',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)

        from core.models import CompetencyDomain
        self.domain = CompetencyDomain.objects.create(name='Policy Governance', domain_type='FUNCTIONAL')
        self.subskill = SubSkill.objects.create(
            name='Policy Trade-off Evaluation',
            domain=self.domain,
            description='Skill in balancing administrative velocity and statutory compliance'
        )

        # Create published scenario
        self.published_scenario = VivaadScenario.objects.create(
            created_by=self.user,
            title='Real-time Microdata Sharing under DPDP 2024',
            source_type='CUSTOM',
            category='Data Policy',
            difficulty='Intermediate',
            status='PUBLISHED',
            version=1,
            situation='A ministry department wants instant API access to microdata for targeted benefit disbursement, while the privacy officer warns of k-anonymity violation risks.',
            decision_question='How should the department proceed with public data access while maintaining DPDP compliance?',
            objective='Assess trade-offs between rapid welfare disbursement and statutory data privacy safeguards.',
            constraints=['DPDP Act 2023 compliance', 'Sub-second API latency requirement'],
            affected_people=['Welfare Beneficiaries', 'Statistical Officers', 'Data Protection Authorities'],
            risks=['Re-identification risks', 'Disbursement delays'],
            options=[
                {
                    'id': 'opt_1',
                    'label': 'Phased API access with differential privacy masking',
                    'description': 'Implement synthetic microdata queries with k-anonymity (k>=5) and audit logging.'
                },
                {
                    'id': 'opt_2',
                    'label': 'Direct raw data access with post-hoc penalties',
                    'description': 'Allow immediate unrestricted access to avoid delivery bottlenecks, auditing quarterly.'
                }
            ],
            published_at=timezone.now()
        )
        self.published_scenario.target_subskills.add(self.subskill)

        # Add 2 perspectives
        self.p1 = VivaadPerspective.objects.create(
            scenario=self.published_scenario,
            name='Dr. Sunita Rao',
            role='Senior Statistical Officer',
            primary_concern='Sample Quality and Statistical Noise',
            position='Aggregated data without strict variance controls invalidates macro indicators.',
            order=1
        )
        self.p2 = VivaadPerspective.objects.create(
            scenario=self.published_scenario,
            name='Vikram Seth, IAS',
            role='Data Protection Officer',
            primary_concern='Statutory Privacy Compliance',
            position='Section 8 of DPDP Act holds officers personally liable for unconsented personally identifiable exposure.',
            order=2
        )

    def test_catalog_accessible_publicly(self):
        """Public visitors can view published scenarios without authentication."""
        anon_client = APIClient()
        res = anon_client.get('/api/debate/scenarios/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data['total'], 1)

    def test_scenario_detail(self):
        """Scenario detail includes perspectives, constraints, and options."""
        res = self.client.get(f'/api/debate/scenarios/{self.published_scenario.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['perspectives']), 2)
        self.assertEqual(len(res.data['options']), 2)

    def test_full_simulation_flow(self):
        """Simulates full learner flow: start session -> turn -> decide -> result."""
        # 1. Start Session
        start_res = self.client.post('/api/debate/sessions/start/', {'scenario_id': self.published_scenario.id})
        self.assertEqual(start_res.status_code, status.HTTP_201_CREATED)
        session_id = start_res.data['session_id']

        # 2. Interactive Turn Discussion
        turn_res = self.client.post(f'/api/debate/sessions/{session_id}/turn/', {
            'perspective_id': self.p1.id,
            'message': 'We can implement differential privacy with an epsilon of 0.5 to keep variance within 2% margin.'
        })
        self.assertEqual(turn_res.status_code, status.HTTP_200_OK)
        self.assertEqual(turn_res.data['learner_turn_number'], 1)
        self.assertTrue(len(turn_res.data['reply']) > 10)

        # 3. Decision & Reasoning Evaluation
        decide_res = self.client.post(f'/api/debate/sessions/{session_id}/decide/', {
            'selected_option_id': 'opt_1',
            'selected_option_label': 'Phased API access with differential privacy masking',
            'reasoning': 'This option balances statutory privacy requirements under DPDP Section 8 while preserving statistical data integrity through differential privacy noise injection and offline batch fallback.'
        })
        self.assertEqual(decide_res.status_code, status.HTTP_200_OK)
        self.assertIn('overall_score', decide_res.data['evaluation'])
        self.assertIn('criteria_scores', decide_res.data['evaluation'])
        self.assertIn('evidence_use', decide_res.data['evaluation']['criteria_scores'])
        self.assertIn('tradeoffs_analysis', decide_res.data['evaluation'])

        # Check competency score boost
        prof = OfficialSkillProficiency.objects.get(user=self.user, subskill=self.subskill)
        self.assertGreater(prof.score, 50.0)

        # 4. Result View
        result_res = self.client.get(f'/api/debate/sessions/{session_id}/result/')
        self.assertEqual(result_res.status_code, status.HTTP_200_OK)
        self.assertEqual(result_res.data['decision']['selected_option_label'], 'Phased API access with differential privacy masking')

    def test_idor_protection(self):
        """Users cannot view or submit turns for other users' sessions."""
        start_res = self.client.post('/api/debate/sessions/start/', {'scenario_id': self.published_scenario.id})
        session_id = start_res.data['session_id']

        # Authenticate as another user
        self.client.force_authenticate(user=self.other_user)
        turn_res = self.client.post(f'/api/debate/sessions/{session_id}/turn/', {
            'perspective_id': self.p1.id,
            'message': 'Attempting unauthorized turn.'
        })
        self.assertEqual(turn_res.status_code, status.HTTP_404_NOT_FOUND)

        result_res = self.client.get(f'/api/debate/sessions/{session_id}/result/')
        self.assertEqual(result_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_studio_flow(self):
        """Author can generate a custom scenario draft, add a perspective, and publish it."""
        gen_res = self.client.post('/api/debate/studio/generate/', {
            'title': 'Tribal Welfare Biometric Exceptions',
            'situation': 'District magistrates report finger-print wear in manual labor belts causing high failure rates. Local groups demand unconditional food ration release on local sarpanch verification.',
            'decision_question': 'Should manual bypass be authorized at panchayat discretion or restricted to biometric OTP fallback?',
            'category': 'Field Operations',
            'difficulty': 'Intermediate'
        })
        self.assertEqual(gen_res.status_code, status.HTTP_201_CREATED)
        scenario_id = gen_res.data['scenario_id']

        # Add perspective
        add_p_res = self.client.post(f'/api/debate/studio/{scenario_id}/perspectives/', {
            'action': 'add',
            'name': 'Kavita Tirkey',
            'role': 'Panchayat Grievance Officer',
            'primary_concern': 'Starvation Prevention and Zero Exclusion',
            'position': 'Ration shop biometric failure in forest zones must never result in denial of food grains.'
        })
        self.assertEqual(add_p_res.status_code, status.HTTP_201_CREATED)

        # Publish
        pub_res = self.client.post(f'/api/debate/studio/{scenario_id}/publish/')
        self.assertEqual(pub_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pub_res.data['status'], 'PUBLISHED')
