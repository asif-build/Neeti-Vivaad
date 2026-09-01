import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neeti_vivaad.settings')
django.setup()

from core.models import CompetencyDomain, CompetencyDomainType, SubSkill, RoleCompetencyRequirement
from courses.models import Course
from assessment.models import BaselineQuestion
from debate.models import DebateScenario

def seed():
    print("--- Seeding Neeti-Vivaad Reference Framework & Catalog (ZERO USERS) ---")

    # 1. Competency Domains
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

    # 2. SubSkills & Role Requirements
    subskills_data = [
        # Statistical
        (d_stat, 'Sampling Design & Estimation', 'STAT-01', 85.0),
        (d_stat, 'High-Frequency Survey Design', 'STAT-02', 80.0),
        (d_stat, 'Statistical Anomaly Detection', 'STAT-03', 80.0),

        # Technical
        (d_tech, 'SQL Data Analysis & Wrangling', 'TECH-01', 85.0),
        (d_tech, 'Python & R Statistical Modeling', 'TECH-02', 75.0),
        (d_tech, 'CAPI Mobile Survey Platforms', 'TECH-03', 80.0),

        # Digital Governance
        (d_dig, 'NDSAP Compliance & Data Sharing', 'GOV-01', 90.0),
        (d_dig, 'Digital k-Anonymity & Privacy', 'GOV-02', 85.0),

        # Behavioural
        (d_beh, 'Policy Trade-off Analysis & Fallacies', 'BEH-01', 88.0),
        (d_beh, 'Field Team Leadership & Ethics', 'BEH-02', 80.0)
    ]

    standard_designations = [
        'Senior Statistical Officer',
        'Statistical Officer',
        'Statistical Investigator',
        'Director',
        'Deputy Director',
        'Data Analyst'
    ]

    for domain, name, code, req_score in subskills_data:
        sub, _ = SubSkill.objects.get_or_create(
            code=code,
            defaults={'domain': domain, 'name': name, 'description': f'Skill: {name}'}
        )
        for desig in standard_designations:
            RoleCompetencyRequirement.objects.get_or_create(
                designation=desig,
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
        },
        {
            'igot_id': 'IGOT-TECH-301',
            'title': 'Python & R Data Analytics for High-Frequency Economic Indicators',
            'provider': 'iGOT Karmayogi / CDAC',
            'domain': d_tech,
            'desc': 'Applied econometrics and time-series modeling for Consumer Price Index (CPI) and Index of Industrial Production (IIP) datasets.',
            'duration': 7.5,
            'difficulty': 'Advanced',
            'subskill_codes': ['TECH-02', 'STAT-02']
        },
        {
            'igot_id': 'IGOT-STAT-202',
            'title': 'Non-Sampling Error Mitigation in Household Surveys',
            'provider': 'iGOT Karmayogi / NSO Academy',
            'domain': d_stat,
            'desc': 'Methods to identify, measure, and minimize non-response bias and respondent fatigue in periodic labour force surveys.',
            'duration': 5.0,
            'difficulty': 'Intermediate',
            'subskill_codes': ['STAT-02', 'STAT-03']
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

    # 4. Pre-seeded Debate Scenarios
    scenarios_seed = [
        {
            'title': 'Direct Benefit Transfer (DBT) Survey Redesign: Continuous Digital Capture vs 5-Year Sample',
            'category': 'Data Policy',
            'desc': 'Debate on replacing traditional periodic paper sample surveys with real-time digital household microdata capture across rural and urban blocks.',
            'constraint': 'Standard 2026 MoSPI Operational Budget'
        },
        {
            'title': 'Mandatory Geo-tagging and Facial Verification in Agricultural Crop Yield Surveys',
            'category': 'Field Operations',
            'desc': 'Debate on enforcing mandatory real-time GPS boundary mapping and enumerator facial authentication during kharif harvest data collection.',
            'constraint': 'Severe rural cellular network outage reported across 4 states'
        },
        {
            'title': 'Open Microdata Dissemination vs Strict Respondent Privacy under NDSAP 2024',
            'category': 'Ethics & Privacy',
            'desc': 'Debate on balancing public statistical transparency with respondent identity preservation using synthetic data generators and differential noise.',
            'constraint': 'Compliance deadline shortened from 6 months to 30 days'
        }
    ]

    for sc in scenarios_seed:
        DebateScenario.objects.get_or_create(
            title=sc['title'],
            defaults={
                'category': sc['category'],
                'description': sc['desc'],
                'initial_constraint': sc['constraint']
            }
        )

    # 5. Baseline Assessment Calibrated Questions (ZERO PREDEFINED USERS)
    baseline_questions_data = [
        # Statistical Domain
        {
            'subskill_code': 'STAT-01',
            'question': 'When designing a multi-stage stratified sample across heterogeneous districts, how should sample size be allocated to minimize national estimation variance?',
            'options': [
                'Equal allocation across all strata regardless of size',
                'Neyman optimal allocation proportional to stratum size and variance',
                'Cluster allocation without stratification',
                'Convenience sampling from urban blocks only'
            ],
            'correct': 1,
            'explanation': 'Neyman allocation minimizes estimation variance for a given sample size by allocating samples proportionally to stratum size and standard deviation.'
        },
        {
            'subskill_code': 'STAT-02',
            'question': 'In high-frequency monthly household surveys, what is the primary risk of using a fixed panel without rotational sample replacement?',
            'options': [
                'Complete loss of survey software calibration',
                'Panel attrition and respondent fatigue leading to non-random attrition bias',
                'Zero probability of duplicate households',
                'Excessive increase in stratum variance'
            ],
            'correct': 1,
            'explanation': 'Fixed panels suffer from panel attrition and respondent fatigue over repeated visits, requiring rotating panel designs (e.g. 4-month rotation).'
        },
        {
            'subskill_code': 'STAT-03',
            'question': 'Which statistical metric is most effective at detecting multivariate outliers in microdata where individual variables appear within univariate bounds?',
            'options': [
                'Simple arithmetic mean',
                'Mahalanobis distance based on covariance matrix',
                'Median absolute deviation on single column',
                'Interquartile range on target variable only'
            ],
            'correct': 1,
            'explanation': 'Mahalanobis distance accounts for the covariance between variables to identify multivariate outliers that univariate bounds miss.'
        },

        # Technical Domain
        {
            'subskill_code': 'TECH-01',
            'question': 'Which SQL construct allows computing running cumulative expenditure totals per household while preserving individual survey line items?',
            'options': [
                'GROUP BY household_id with SUM()',
                'SUM(expenditure) OVER (PARTITION BY household_id ORDER BY survey_date)',
                'SELECT DISTINCT expenditure FROM surveys',
                'CROSS JOIN on household table'
            ],
            'correct': 1,
            'explanation': 'Window functions with PARTITION BY and ORDER BY compute cumulative aggregates without collapsing rows.'
        },
        {
            'subskill_code': 'TECH-02',
            'question': 'When training predictive models on highly imbalanced survey anomaly datasets, why is accuracy an unreliable evaluation metric?',
            'options': [
                'Because accuracy requires normal distribution',
                'A trivial model predicting the majority class achieves high accuracy while missing all anomalies (use Precision-Recall / F1)',
                'Accuracy cannot be calculated on numerical data',
                'Accuracy requires SQL execution'
            ],
            'correct': 1,
            'explanation': 'In imbalanced datasets (e.g. 99% normal, 1% anomaly), accuracy is misleading; PR-AUC, Recall, and F1-score are necessary.'
        },
        {
            'subskill_code': 'TECH-03',
            'question': 'What is the most robust offline synchronization strategy for CAPI mobile tablets operating in low-connectivity rural blocks?',
            'options': [
                'Real-time continuous WebSockets only',
                'Local encrypted SQLite storage with idempotent conflict-free delta sync queues',
                'Direct unencrypted CSV email transmission',
                'Manual paper backup without digital verification'
            ],
            'correct': 1,
            'explanation': 'Offline-first CAPI applications use local encrypted storage and queue changes as idempotent mutations synced once network connectivity is restored.'
        },

        # Digital Governance
        {
            'subskill_code': 'GOV-01',
            'question': 'Under the National Data Sharing and Accessibility Policy (NDSAP), how are government datasets classified for public dissemination?',
            'options': [
                'Secret, Confidential, and Restricted only',
                'Open Access (shareable), Registered Access, and Restricted / Negative List',
                'Commercial and Non-commercial only',
                'All government microdata is classified as completely public without scrubbing'
            ],
            'correct': 1,
            'explanation': 'NDSAP classifies data into Open Access (freely shareable), Registered Access (subject to terms), and Restricted (sensitive/negative list).'
        },
        {
            'subskill_code': 'GOV-02',
            'question': 'What is the primary guarantee provided by enforcing k-anonymity (k=5) on published statistical microdata?',
            'options': [
                'The dataset contains exactly 5 columns',
                'Each quasi-identifier combination is shared by at least 5 distinct individuals in the release',
                'Encryption key length is 5 bytes',
                'Survey is administered 5 times'
            ],
            'correct': 1,
            'explanation': 'k-anonymity guarantees that each combination of quasi-identifiers (e.g. age, gender, pin code) appears at least k times, preventing individual re-identification.'
        },

        # Behavioural & Decision Making
        {
            'subskill_code': 'BEH-01',
            'question': 'In a debate on survey methodology, an official claims: "We have conducted this survey on paper for 40 years without issues, therefore digital CAPI transition is unnecessary and dangerous." Which logical fallacy is being committed?',
            'options': [
                'False Dilemma',
                'Appeal to Tradition (Argumentum ad Antiquitatem)',
                'Ad Hominem',
                'Post Hoc Ergo Propter Hoc'
            ],
            'correct': 1,
            'explanation': 'Appeal to Tradition argues that a policy or method is correct simply because it has historically been done that way, ignoring technological improvements.'
        },
        {
            'subskill_code': 'BEH-02',
            'question': 'When facing contradictory data reports between field enumerator observations and automated sensor logs during drought assessment, what is the most evidence-grounded action?',
            'options': [
                'Immediately dismiss sensor logs as unverified technology',
                'Discard enumerator reports without investigation',
                'Perform multi-source cross-triangulation with ground-truth satellite imagery and calibrate error margins',
                'Publish whichever dataset aligns with prior expectations'
            ],
            'correct': 2,
            'explanation': 'Evidence-based governance requires triangulation across diverse data streams with explicit confidence intervals and bias auditing.'
        }
    ]

    for qdata in baseline_questions_data:
        sub = SubSkill.objects.get(code=qdata['subskill_code'])
        BaselineQuestion.objects.get_or_create(
            subskill=sub,
            question_text=qdata['question'],
            defaults={
                'domain': sub.domain,
                'options': qdata['options'],
                'correct_option_index': qdata['correct'],
                'explanation': qdata['explanation']
            }
        )

    print("--- Seeding Completed: Reference Domains, SubSkills, Courses, Scenarios & Baseline Questions Ready (0 Users in DB) ---")

if __name__ == '__main__':
    seed()
