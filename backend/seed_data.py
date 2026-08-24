import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neeti_vivaad.settings')
django.setup()

from core.models import User, UserRole, CompetencyDomain, CompetencyDomainType, SubSkill, OfficialSkillProficiency, RoleCompetencyRequirement
from courses.models import Course
from assessment.models import DocumentUpload, Quiz, Question, Option, QuizAttempt
from debate.models import DebateScenario, DebateSession, DebateRound, AgentArgument, DecisionReport, FallacyChallenge

def seed():
    print("--- Seeding Neeti Vivaad MoSPI Database ---")

    # 1. Users
    rajesh, _ = User.objects.get_or_create(
        username='rajesh_kumar',
        defaults={
            'first_name': 'Rajesh',
            'last_name': 'Kumar',
            'email': 'rajesh.kumar@mospi.gov.in',
            'role': UserRole.OFFICIAL,
            'department': 'NSO Field Operations Division',
            'designation': 'Senior Statistical Officer',
            'experience_years': 7,
            'education': 'M.Sc. Mathematical Statistics (DU)',
            'ctq_score': 82.5
        }
    )
    rajesh.set_password('official123')
    rajesh.save()

    sharma, _ = User.objects.get_or_create(
        username='dr_sharma',
        defaults={
            'first_name': 'Dr. A.',
            'last_name': 'Sharma',
            'email': 'dg.mospi@gov.in',
            'role': UserRole.ADMIN,
            'department': 'Ministry Headquarters, New Delhi',
            'designation': 'Director General (MoSPI)',
            'experience_years': 22,
            'education': 'Ph.D. Econometrics (ISI Kolkata)',
            'ctq_score': 94.0
        }
    )
    sharma.set_password('admin123')
    sharma.save()

    # 2. Competency Domains & SubSkills
    d_stat, _ = CompetencyDomain.objects.get_or_create(
        domain_type=CompetencyDomainType.STATISTICAL,
        defaults={'name': 'Statistical Methodology & Data Science', 'description': 'Core statistical theory, sampling design, and estimation.'}
    )
    d_tech, _ = CompetencyDomain.objects.get_or_create(
        domain_type=CompetencyDomainType.TECHNICAL,
        defaults={'name': 'Technical & Software Tools', 'description': 'Data wrangling, SQL, Python/R modeling, and digital survey platforms.'}
    )
    d_dig, _ = CompetencyDomain.objects.get_or_create(
        domain_type=CompetencyDomainType.DIGITAL_GOVERNANCE,
        defaults={'name': 'Digital Governance & Data Security', 'description': 'NDSAP compliance, k-anonymity, data privacy, and IT frameworks.'}
    )
    d_beh, _ = CompetencyDomain.objects.get_or_create(
        domain_type=CompetencyDomainType.BEHAVIOURAL,
        defaults={'name': 'Behavioural, Managerial & Decision Making', 'description': 'Critical thinking, fallacy detection, policy trade-off evaluation, and team management.'}
    )

    subskills_data = [
        # Statistical
        (d_stat, 'Sampling Design & Estimation', 'STAT-01', 58.0, 85.0),
        (d_stat, 'High-Frequency Survey Design', 'STAT-02', 45.0, 80.0),
        (d_stat, 'Statistical Anomaly Detection', 'STAT-03', 72.0, 80.0),

        # Technical
        (d_tech, 'SQL Data Analysis & Wrangling', 'TECH-01', 52.0, 85.0),
        (d_tech, 'Python & R Statistical Modeling', 'TECH-02', 40.0, 75.0),
        (d_tech, 'CAPI Mobile Survey Platforms', 'TECH-03', 88.0, 80.0),

        # Digital Governance
        (d_dig, 'NDSAP Compliance & Data Sharing', 'GOV-01', 50.0, 90.0),
        (d_dig, 'Digital k-Anonymity & Privacy', 'GOV-02', 42.0, 85.0),

        # Behavioural
        (d_beh, 'Policy Trade-off Analysis & Fallacies', 'BEH-01', 65.0, 88.0),
        (d_beh, 'Field Team Leadership & Ethics', 'BEH-02', 82.0, 80.0)
    ]

    for domain, name, code, current_score, req_score in subskills_data:
        sub, _ = SubSkill.objects.get_or_create(
            code=code,
            defaults={'domain': domain, 'name': name, 'description': f'Skill: {name}'}
        )
        OfficialSkillProficiency.objects.get_or_create(
            user=rajesh,
            subskill=sub,
            defaults={'score': current_score}
        )
        RoleCompetencyRequirement.objects.get_or_create(
            designation='Senior Statistical Officer',
            subskill=sub,
            defaults={'target_score': req_score}
        )

    # 3. iGOT Course Catalog
    courses_seed = [
        {
            'igot_id': 'IGOT-STAT-401',
            'title': 'Advanced Sampling Design & Multi-Stage Estimation for Government Surveys',
            'provider': 'iGOT Karmayogi / NSO Academy',
            'domain': d_stat,
            'desc': 'Comprehensive course covering multi-stage stratified sampling, cluster design, and non-sampling error reduction in national sample surveys.',
            'duration': 6.0,
            'difficulty': 'Advanced',
            'subskill_codes': ['STAT-01', 'STAT-02']
        },
        {
            'igot_id': 'IGOT-GOV-302',
            'title': 'Digital Data Privacy, NDSAP Guidelines & k-Anonymity Standards',
            'provider': 'iGOT Karmayogi / MeitY',
            'domain': d_dig,
            'desc': 'Learn National Data Sharing and Accessibility Policy (NDSAP) mandates, microdata masking, k-anonymity protocols, and secure PII deletion at tablet entry.',
            'duration': 4.5,
            'difficulty': 'Intermediate',
            'subskill_codes': ['GOV-01', 'GOV-02']
        },
        {
            'igot_id': 'IGOT-TECH-205',
            'title': 'SQL Data Wrangling & Automated Anomaly Detection in Microdata',
            'provider': 'iGOT Karmayogi / NIC',
            'domain': d_tech,
            'desc': 'Master SQL analytical window functions, automated duplicate household detection, and data validation scripts for MoSPI statistical databases.',
            'duration': 8.0,
            'difficulty': 'Intermediate',
            'subskill_codes': ['TECH-01', 'STAT-03']
        },
        {
            'igot_id': 'IGOT-BEH-501',
            'title': 'Critical Thinking, Policy Fallacy Detection & Evidence-Based Decision Making',
            'provider': 'iGOT Karmayogi / ISTM',
            'domain': d_beh,
            'desc': 'Master multi-agent policy trade-off synthesis, spot logical fallacies in survey proposals, and build evidence-grounded decision reports for senior ministry leadership.',
            'duration': 5.0,
            'difficulty': 'Advanced',
            'subskill_codes': ['BEH-01', 'BEH-02']
        }
    ]

    for cdata in courses_seed:
        c, _ = Course.objects.get_or_create(
            igot_course_id=cdata['igot_id'],
            defaults={
                'title': cdata['title'],
                'provider': cdata['provider'],
                'domain': cdata['domain'],
                'description': cdata['desc'],
                'duration_hours': cdata['duration'],
                'difficulty': cdata['difficulty'],
                'rating': 4.9
            }
        )
        subs = SubSkill.objects.filter(code__in=cdata['subskill_codes'])
        c.target_subskills.set(subs)

    # 4. Reference Documents (Official Grounding Sources)
    from debate.models import ReferenceDocument, ScenarioConstraint

    ref_idqf, _ = ReferenceDocument.objects.get_or_create(
        doc_code='MOSPI-IDQF-2024',
        defaults={
            'title': 'India Data Quality Framework (IDQF) 2024 Standards',
            'publisher': 'Ministry of Statistics and Programme Implementation',
            'document_type': 'Official Policy Standard',
            'page_reference': 'Section 4.2: Data Integrity & Precision',
            'publication_year': 2024,
            'is_indexed': True,
            'content': 'All national sample surveys must maintain a minimum confidence interval of 95%. Automated anomaly detection must flag duplicate household records within 24 hours of submission.'
        }
    )

    ref_ndsap, _ = ReferenceDocument.objects.get_or_create(
        doc_code='NDSAP-PRIVACY-2023',
        defaults={
            'title': 'National Data Sharing and Accessibility Policy (NDSAP) Privacy Mandates',
            'publisher': 'MeitY & MoSPI',
            'document_type': 'Gazette Notification',
            'page_reference': 'Clause 12: Microdata Masking',
            'publication_year': 2023,
            'is_indexed': True,
            'content': 'Microdata dissemination requires k-anonymity (k>=5) and differential privacy noise addition before public release. PII must be stripped at tablet entry.'
        }
    )

    ref_nsc, _ = ReferenceDocument.objects.get_or_create(
        doc_code='NSC-SAMPLING-2024',
        defaults={
            'title': 'National Statistical Commission Guidelines on Multi-Stage Sampling',
            'publisher': 'National Statistical Commission (NSC)',
            'document_type': 'Technical Guidelines',
            'page_reference': 'Chapter 3: Stratified Cluster Sampling',
            'publication_year': 2024,
            'is_indexed': True,
            'content': 'Multi-stage stratified sampling with non-replacement cluster allocations must be maintained across all rural and urban blocks.'
        }
    )

    ref_fod, _ = ReferenceDocument.objects.get_or_create(
        doc_code='FOD-CAPI-MANUAL-2025',
        defaults={
            'title': 'NSO Field Operations Division CAPI Survey Manual',
            'publisher': 'NSO Field Operations Directorate',
            'document_type': 'Field Operations Manual',
            'page_reference': 'SOP 8: Real-Time Verification',
            'publication_year': 2025,
            'is_indexed': True,
            'content': 'CAPI handheld survey verification procedures, offline-first sync protocols, and field supervisor audit trails for all NSS rounds.'
        }
    )

    # 5. Pre-seeded Debate Scenarios with References & Constraints
    scenarios_seed = [
        {
            'title': 'Direct Benefit Transfer (DBT) Survey Redesign: Continuous Digital Capture vs 5-Year Sample',
            'category': 'Data Policy',
            'desc': 'Debate on replacing traditional periodic paper sample surveys with real-time digital household microdata capture across rural and urban blocks.',
            'constraint': 'Standard 2026 MoSPI Operational Budget',
            'difficulty': 'Intermediate',
            'status': 'Active',
            'learning_obj': 'Evaluate data velocity trade-offs against multi-stage confidence interval stability.',
            'refs': [ref_idqf, ref_nsc],
            'constraints': [
                {'name': 'Budget Reduction (20%)', 'desc': 'Operational budget reduced by 20% due to mid-year austerity mandate.', 'impact': 'Forces prioritization of high-density survey blocks.', 'round': 2},
                {'name': 'Offline Sync Deadline', 'desc': 'Mandatory end-of-day data synchronisation across all remote clusters.', 'impact': 'Requires fallback caching protocols.', 'round': 3}
            ]
        },
        {
            'title': 'Mandatory Geo-tagging and Facial Verification in Agricultural Crop Yield Surveys',
            'category': 'Field Operations',
            'desc': 'Debate on enforcing mandatory real-time GPS boundary mapping and enumerator facial authentication during kharif harvest data collection.',
            'constraint': 'Severe rural cellular network outage reported across 4 states',
            'difficulty': 'Advanced',
            'status': 'Active',
            'learning_obj': 'Analyze enumerator operational burden versus fraud elimination in crop cutting experiments.',
            'refs': [ref_fod, ref_idqf],
            'constraints': [
                {'name': 'Cellular Blackout', 'desc': 'Complete loss of cellular connectivity across 4 target survey zones.', 'impact': 'Biometric verification must operate offline.', 'round': 2}
            ]
        },
        {
            'title': 'Open Microdata Dissemination vs Strict Respondent Privacy under NDSAP 2024',
            'category': 'Ethics & Privacy',
            'desc': 'Debate on balancing public statistical transparency with respondent identity preservation using synthetic data generators and differential noise.',
            'constraint': 'Compliance deadline shortened from 6 months to 30 days',
            'difficulty': 'Intermediate',
            'status': 'Active',
            'learning_obj': 'Determine optimal k-anonymity parameters without compromising econometric microdata utility.',
            'refs': [ref_ndsap, ref_idqf],
            'constraints': [
                {'name': 'Accelerated Compliance Order', 'desc': 'High Court mandate requiring microdata release within 30 days.', 'impact': 'Precludes manual de-identification passes.', 'round': 2}
            ]
        }
    ]

    for sc in scenarios_seed:
        scenario_obj, _ = DebateScenario.objects.get_or_create(
            title=sc['title'],
            defaults={
                'category': sc['category'],
                'description': sc['desc'],
                'initial_constraint': sc['constraint'],
                'difficulty': sc['difficulty'],
                'status': sc['status'],
                'learning_objective': sc['learning_obj']
            }
        )
        scenario_obj.reference_sources.set(sc['refs'])
        for con in sc['constraints']:
            ScenarioConstraint.objects.get_or_create(
                scenario=scenario_obj,
                name=con['name'],
                defaults={
                    'description': con['desc'],
                    'impact': con['impact'],
                    'trigger_round': con['round']
                }
            )

    # 6. Additional Cohort Users for Workforce Analytics
    cohort_officials = [
        ('priya_sharma', 'Priya', 'Sharma', 'priya.sharma@mospi.gov.in', 'Survey Design & Research Division', 'Assistant Director (Statistics)', 9, 89.0),
        ('ananya_sen', 'Ananya', 'Sen', 'ananya.sen@mospi.gov.in', 'Economic Statistics Division', 'Junior Statistical Officer', 4, 79.0),
        ('vikram_singh', 'Vikramaditya', 'Singh', 'vikram.singh@mospi.gov.in', 'National Accounts Division', 'Statistical Investigator (Gr. I)', 6, 84.0),
        ('amit_verma', 'Amit', 'Verma', 'amit.verma@mospi.gov.in', 'NSO Field Operations Division', 'Field Supervisor', 8, 77.5),
        ('sunita_rao', 'Sunita', 'Rao', 'sunita.rao@mospi.gov.in', 'Survey Design & Research Division', 'Senior Statistical Officer', 11, 91.0)
    ]

    all_subskills = list(SubSkill.objects.all())
    for uname, fname, lname, email, dept, desig, exp, ctq in cohort_officials:
        u, created = User.objects.get_or_create(
            username=uname,
            defaults={
                'first_name': fname,
                'last_name': lname,
                'email': email,
                'role': UserRole.OFFICIAL,
                'department': dept,
                'designation': desig,
                'experience_years': exp,
                'education': 'M.Sc. Applied Statistics',
                'ctq_score': ctq
            }
        )
        if created:
            u.set_password('official123')
            u.save()
            for s in all_subskills:
                OfficialSkillProficiency.objects.get_or_create(
                    user=u,
                    subskill=s,
                    defaults={'score': min(98.0, max(35.0, ctq + (hash(s.code + uname) % 25) - 10))}
                )

    # 7. Pre-seeded Quiz & Document
    doc, _ = DocumentUpload.objects.get_or_create(
        user=rajesh,
        title="MoSPI India Data Quality Framework (IDQF) 2024 Guidelines",
        defaults={
            'extracted_text': """India Data Quality Framework (IDQF) 2024 Standards.
Ministry of Statistics and Programme Implementation (MoSPI).
Section 1. Core Principles:
All national sample statistical collections must maintain a minimum confidence interval of 95%. Automated anomaly detection must flag duplicate household records within 24 hours of submission.
Section 2. Privacy & Masking:
Microdata dissemination must undergo k-anonymity (k>=5) and differential privacy noise addition before public release. Personally Identifiable Information (PII) including Aadhaar numbers and biometric tokens must be stripped at the field collection tablet level.
Section 3. Enumerator Compliance:
Enumerators operating in LWE (Left-Wing Extremism) affected or hilly terrains must be provided offline-first mobile survey tools. Multi-tier verification shouldn't exceed 15 minutes per household to maintain public cooperation and response rates."""
        }
    )

    sub_gov = SubSkill.objects.get(code='GOV-02')
    quiz, _ = Quiz.objects.get_or_create(
        document=doc,
        title="Grounded Assessment: IDQF 2024 Guidelines",
        defaults={'subskill': sub_gov}
    )

    q1, _ = Question.objects.get_or_create(
        quiz=quiz,
        question_text="What is the mandatory minimum confidence interval required for all national sample statistical collections under IDQF 2024?",
        defaults={
            'source_citation': 'Section 1: All national sample statistical collections must maintain a minimum confidence interval of 95%.',
            'explanation': 'Section 1 explicitly mandates a 95% confidence interval for national statistical sampling.'
        }
    )
    Option.objects.get_or_create(question=q1, option_text="90%", is_correct=False)
    Option.objects.get_or_create(question=q1, option_text="95%", is_correct=True)
    Option.objects.get_or_create(question=q1, option_text="99%", is_correct=False)
    Option.objects.get_or_create(question=q1, option_text="100%", is_correct=False)

    q2, _ = Question.objects.get_or_create(
        quiz=quiz,
        question_text="According to Section 2, what level of k-anonymity must microdata undergo before public dissemination?",
        defaults={
            'source_citation': 'Section 2: Microdata dissemination must undergo k-anonymity (k>=5).',
            'explanation': 'Section 2 specifies that k must be greater than or equal to 5 (k>=5) before public release.'
        }
    )
    Option.objects.get_or_create(question=q2, option_text="k>=2", is_correct=False)
    Option.objects.get_or_create(question=q2, option_text="k>=5", is_correct=True)
    Option.objects.get_or_create(question=q2, option_text="k>=10", is_correct=False)
    Option.objects.get_or_create(question=q2, option_text="No anonymity required", is_correct=False)

    # 8. Quiz Attempts History
    all_users = User.objects.filter(role=UserRole.OFFICIAL)
    for u in all_users:
        QuizAttempt.objects.get_or_create(
            user=u,
            quiz=quiz,
            defaults={
                'score_percentage': 85.0 if u.username == 'rajesh_kumar' else (75.0 + (hash(u.username) % 25)),
                'total_questions': 2,
                'correct_answers': 2
            }
        )

    print("--- Seeding Completed Successfully! ---")

if __name__ == '__main__':
    seed()
