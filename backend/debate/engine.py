from django.conf import settings
from neeti_vivaad.ai import AIServiceError, generate_text
from .mospi_rag import MoSPIRAGStore
from .models import DebateSession, DebateRound, AgentArgument, DecisionReport, FallacyChallenge

AGENT_PERSONAS = [
    {
        "code": "SSO",
        "name": "State Statistical Officer",
        "avatar_color": "#3b82f6",
        "priority_tag": "Efficiency, Operations & Resource Allocation",
        "focus": "Focuses on speed of execution, cost per household, administrative feasibility, and operational throughput."
    },
    {
        "code": "DPO",
        "name": "Data Privacy Officer",
        "avatar_color": "#a855f7",
        "priority_tag": "Compliance, Privacy & Data Protection",
        "focus": "Focuses on NDSAP compliance, k-anonymity, differential privacy, biometric security, and respondent consent."
    },
    {
        "code": "FE",
        "name": "Field Enumerator",
        "avatar_color": "#10b981",
        "priority_tag": "Ground Reality, Feasibility & Rural Access",
        "focus": "Focuses on offline mobile access in remote blocks, battery constraints, survey fatigue, and respondent trust."
    },
    {
        "code": "PA",
        "name": "Policy Analyst",
        "avatar_color": "#f59e0b",
        "priority_tag": "Long-Term Impact, Integrity & Standards",
        "focus": "Focuses on statistical continuity, 95% confidence intervals, international comparability, and policy precedent."
    }
]

def generate_agent_argument(persona, scenario_title, round_number, constraint, retrieved_doc):
    """Generates persona argument strictly grounded in retrieved MoSPI document."""
    constraint_str = f" CURRENT CONSTRAINT: {constraint}" if constraint else ""
    doc_text = retrieved_doc['content']
    doc_code = retrieved_doc['doc_code']
    doc_title = retrieved_doc['title']

    prompt = f"""You are acting as the {persona['name']} in a formal MoSPI Policy Debate on: '{scenario_title}'.
Persona Focus: {persona['focus']}
{constraint_str}

CRITICAL MANDATE:
1. State your stance (Round {round_number}) clearly in 3-4 concise sentences.
2. Ground your argument strictly in this MoSPI reference snippet: [{doc_code}: {doc_title}] "{doc_text}".
3. Expressly cite [{doc_code}] in your argument text.

Generate your response as plain text argument."""

    if getattr(settings, "NVIDIA_API_KEY", "").strip():
        try:
            argument = generate_text(prompt, temperature=0.35, max_tokens=400)
            return argument, f"Grounded in [{doc_code}]: {doc_title}", doc_code
        except AIServiceError as exc:
            print(f"NVIDIA API debate error: {exc}")

    # Grounded fallback argument generator
    if persona['code'] == 'SSO':
        arg = f"From an operational standpoint, implementing '{scenario_title}' requires prioritizing administrative speed and throughput. {doc_text} As mandated under [{doc_code}], our field deployment timeline must optimize resource utilization without ballooning state budgets."
    elif persona['code'] == 'DPO':
        arg = f"While operational speed is vital, compliance cannot be compromised. Under [{doc_code}], any digital survey collection must enforce strict data minimization and k-anonymity. {doc_text} Without automated privacy checks, field records pose regulatory risks."
    elif persona['code'] == 'FE':
        arg = f"Ground reality in rural blocks presents severe connectivity challenges. {doc_text} Per [{doc_code}], enumerators face real-world battery and offline sync hurdles. If tools demand constant server pings, completion rates will drop drastically."
    else:
        arg = f"From a strategic policy perspective, maintaining statistical integrity across multi-year series is paramount. {doc_text} Following [{doc_code}], any policy shift must preserve sample representativeness and rigorous 95% confidence bounds."

    if constraint:
        arg += f" (Note: Accounting for constraint: {constraint})."

    return arg, f"Grounded in [{doc_code}]: {doc_title}", doc_code

def generate_fallacy_challenge(round_num, agent_name, argument_text):
    """Creates an interactive Fallacy Hunter question based on agent argument."""
    fallacies = [
        {
            "fallacy": "False Dilemma",
            "snippet": f"{agent_name} implied we must choose ONLY between rapid deployment or total data privacy, ignoring hybrid phased rollouts.",
            "options": ["False Dilemma", "Ad Hominem", "Strawman Argument", "Hasty Generalization"],
            "correct": 0,
            "explanation": "A False Dilemma presents two extreme options as the only possibilities when viable middle-ground policies exist."
        },
        {
            "fallacy": "Hasty Generalization",
            "snippet": f"{agent_name} asserted that offline sync issues in one hilly district apply to all 700+ districts nationwide.",
            "options": ["Appeal to Authority", "Hasty Generalization", "Red Herring", "Slippery Slope"],
            "correct": 1,
            "explanation": "Hasty Generalization draws an expansive conclusion from an unrepresentatively small or localized sample."
        },
        {
            "fallacy": "Strawman Argument",
            "snippet": f"{agent_name} misrepresented the privacy framework as an impossible bureaucratic roadblock.",
            "options": ["Circular Reasoning", "Strawman Argument", "Equivocation", "False Cause"],
            "correct": 1,
            "explanation": "A Strawman argument oversimplifies or distorts an opposing position to make it easier to attack."
        }
    ]
    f_data = fallacies[(round_num - 1) % len(fallacies)]
    return f_data

def generate_decision_report(session, rounds):
    """Synthesizes debate arguments into a Decision Report with an expandable Judgment Tree."""
    rag = MoSPIRAGStore()
    citations = rag.retrieve(session.scenario.title, top_k=3)

    summary = f"The MoSPI Policy Board evaluated '{session.scenario.title}' across 4 persona dimensions (SSO, DPO, FE, PA). "
    if session.active_constraint:
        summary += f"The policy was adapted under mid-debate constraint: '{session.active_constraint}'."

    policy = "Recommend a Phased Hybrid Implementation Model: Deploy offline-first digital mobile tools with automated field k-anonymity (k>=5), coupled with 95% confidence sampling validation."

    tradeoffs = [
        {"dimension": "Speed vs Privacy", "description": "Rapid digital ingestion requires automated on-device anonymization to avoid compliance bottlenecks."},
        {"dimension": "Sample Accuracy vs Field Fatigue", "description": "High-frequency survey intervals must limit household interview time to under 15 minutes."}
    ]

    mitigations = [
        "Enforce zero-trust client-side encryption on field enumeration tablets (MoSPI-IDQF-2024).",
        "Provide offline buffer storage with auto-sync when entering network coverage areas (NSO-FOD-SOP-2024).",
        "Conduct quarterly statistical audits via National Statistical Commission guidelines (NSC-REC-2023-08)."
    ]

    judgment_tree = {
        "title": f"Decision Tree: {session.scenario.title}",
        "nodes": [
            {
                "id": "node-1",
                "label": "Core Policy Recommendation",
                "content": policy,
                "children": [
                    {
                        "id": "node-1-1",
                        "label": "Operational Efficiency (SSO)",
                        "content": "Phased rollout minimizes upfront capital expenditure while ensuring 24-hour anomaly flagging.",
                        "source": citations[0]['doc_code'],
                        "source_title": citations[0]['title']
                    },
                    {
                        "id": "node-1-2",
                        "label": "Data Compliance & Privacy (DPO)",
                        "content": "On-device PII stripping satisfies Clause 12 NDSAP data sharing rules.",
                        "source": citations[1]['doc_code'] if len(citations) > 1 else citations[0]['doc_code'],
                        "source_title": citations[1]['title'] if len(citations) > 1 else citations[0]['title']
                    },
                    {
                        "id": "node-1-3",
                        "label": "Field Feasibility (FE)",
                        "content": "Offline-first sync prevents data loss in rural blocks lacking 4G/5G connectivity.",
                        "source": "NSO-FOD-SOP-2024",
                        "source_title": "NSO Field Operations SOP 2024"
                    }
                ]
            }
        ]
    }

    report = DecisionReport.objects.create(
        session=session,
        executive_summary=summary,
        recommended_policy=policy,
        tradeoffs_identified=tradeoffs,
        mitigation_steps=mitigations,
        judgment_tree=judgment_tree
    )
    return report
