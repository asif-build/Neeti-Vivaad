# Neeti Saarthi (Neeti-Vivaad)

> **Empowering Civil Servants with Intelligent Competency Profiling, Document-Grounded Knowledge Checks, and Real iGOT Karmayogi Learning Pathways.**

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Django](https://img.shields.io/badge/Backend-Django%205%20%2B%20DRF-green?style=flat&logo=django)](https://www.djangoproject.com/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-blue?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Mission Karmayogi](https://img.shields.io/badge/Alignment-Mission%20Karmayogi-orange)](https://igotkarmayogi.gov.in/)

---

## 🏛️ Overview

**Neeti Saarthi** is an AI-powered civil service capacity-building and competency intelligence platform developed in alignment with the Government of India's **Mission Karmayogi** framework.

Designed for statistical officers, policy analysts, administrative leaders, and departmental trainees, Neeti Saarthi provides an end-to-end journey from role & skill profiling to personalized recommendations from the **real iGOT Karmayogi** course catalogue, grounded document assessment in the **Knowledge Check Studio**, and interactive learning companionship.

---

## 🔄 The End-to-End Civil Service Learning Journey

```
CREATE ACCOUNT
      ↓
VERIFY EMAIL
      ↓
UPLOAD RESUME / ONBOARDING
      ↓
AI CREATES COMPETENCY PROFILE
      ↓
OFFICER REVIEWS PROFILE
      ↓
NEETI SAARTHI IDENTIFIES ROLE + SKILLS + FOCUS GAPS
      ↓
REAL iGOT COURSE CATALOGUE
      ↓
PERSONALIZED LEARNING RECOMMENDATIONS
      ↓
"COMPLETE ON iGOT" (Direct Portal Integration)
      ↓
AUTHORIZED iGOT COMPLETION SYNC
      ↓
GROUNDED KNOWLEDGE CHECK (Upload Circular/Guideline)
      ↓
SOURCE-BACKED FEEDBACK & PAGE CITATIONS
      ↓
SKILL & GROWTH RADAR UPDATED (With Audit Provenance)
```

---

## ✨ Core Features & Capabilities

### 1. Document-Grounded Knowledge Check Studio (`/quiz/studio`)
- **Real Document Ingestion**: Upload official government circulars, guideline manuals, or policy documents in **PDF**, **DOCX**, or **TXT** format (up to 15 MB).
- **Page & Section Extraction**: Preserves 1-indexed `page_number`, heading hierarchies, and table structures using `pypdf` and `python-docx`.
- **Grounded Question Generation**: Questions are synthesized directly from verified text chunks with mandatory **verbatim** continuous evidence snippets.
- **Dual Engine AIProvider**:
  - *LLM Engine*: Structured JSON schema queries to NVIDIA NIM / Google Gemini APIs with server-side schema and citation validation.
  - *Deterministic Rule Engine*: High-precision offline fallback extracting statutory rules, numerical thresholds (e.g. *confidence intervals*, *k-anonymity*, *statutory timeframes*), and definitions with zero hallucination.
- **Authoring & Review Workspace**:
  - Review generated questions with source badges (`Page X • Section: Y`).
  - **"View Source"** modal displaying exact document excerpts.
  - Inline question editing, regeneration, deletion, and manual question creation.
  - Lifecycle: `DRAFT` &rarr; `PUBLISHED` &rarr; `ARCHIVED` with immutable version tracking.
  - Author Management Dashboard to track all drafts and published assessments.

### 2. Learner Knowledge Check Hub (`/quiz`)
- **No Synthetic or Mock Questions**: Learner tests are loaded strictly from published official assessments.
- **Public Showcase & Protected Runner**: Visitors can preview check metadata; authenticated civil servants take the interactive check and record progress.
- **Focused Question Runner**: Clean question presentation with client-withheld answers to eliminate inspect-element cheating.
- **Source-Backed Results**:
  - Percentage score and correctness breakdown.
  - *"What You Did Well"* and *"Keep Practising"* thematic summaries.
  - Per-question feedback citing the exact document page number and verbatim excerpt.
  - Modest, defensible progression updates to `OfficialSkillProficiency` (e.g. +6.0 pts for &ge;80% score) linked to the attempt audit trail.

### 3. Real iGOT Karmayogi Course Catalogue (`/courses`)
- **Official iGOT Integration**: Synchronized with the live iGOT Karmayogi course catalog (`igotkarmayogi.gov.in/#/contentList`).
- **Authentic Metadata**: Displays genuine course titles, descriptions, providers, durations, and verified Karmayogi thumbnails.
- **No Fabricated Links**: "View on iGOT" and "Complete on iGOT" buttons link directly to legitimate official course pages.
- **Search & Filters**: Search by title or provider, and filter across functional, behavioral, and domain competencies.
- **Personalized Recommendations**: Courses address specific competency gaps identified on the user's dashboard.

### 4. Officer Competency Profiling & Dashboard (`/dashboard`)
- **Resume & CV Analysis**: Automatic extraction of designation, organization, cadre, and existing competencies.
- **Baseline Competency Assessment**: 10-subskill evaluation covering behavioral, functional, and domain dimensions.
- **Interactive Competency Radar**: Live visualization of proficiency scores (scale: 0–100) and priority skill gaps.
- **Profile Setup Wizard**: Guided multi-step onboarding (`/profile/setup`) for seamless officer intake.

### 5. Neeti Saarthi Buddy
- Persistent, context-aware AI learning companion accessible via a floating action panel.
- Provides session greetings, proactive learning advice, guidance on next steps, and celebratory milestone prompts.

### 6. Editorial & Brutalist Design System
- High-contrast, accessibility-first visual style tailored for official public service interfaces.
- Custom brutalist cards (`card-brutal`), bold typography (`Space Grotesk`, `Inter`, `JetBrains Mono`), and a distinct national palette: Saffron (`#F2A900`), Deep Navy (`#0B1F3A`), and Emerald (`#0F766E`).

---

## 🛠️ Architecture & Tech Stack

```
Neeti-Vivaad/
├── backend/                  # Django REST API & Assessment Engine
│   ├── assessment/           # Knowledge Check Studio, extraction & AIProvider
│   │   ├── extraction.py     # PDF & DOCX page-aware text chunker
│   │   ├── ai_provider.py    # LLM & deterministic rule generation engine
│   │   ├── models.py         # DocumentUpload, Quiz, Question, QuizAttempt, QuizAnswer
│   │   ├── views.py          # Studio & learner assessment endpoints
│   │   └── urls.py           # REST routing
│   ├── core/                 # User auth, official profile, competency models
│   ├── courses/              # Real iGOT course synchronization & recommendations
│   ├── dashboard/            # Skill analytics & admin dashboards
│   ├── buddy/                # Neeti Saarthi Buddy assistant API
│   └── neeti_vivaad/         # Django settings, root URLs, and WSGI/ASGI
│
└── frontend/                 # Next.js App Router Web Application
    ├── app/
    │   ├── quiz/             # Learner Knowledge Check Hub
    │   ├── quiz/studio/      # Authoring Knowledge Check Studio
    │   ├── courses/          # Real iGOT Karmayogi Course Catalogue
    │   ├── dashboard/        # Officer Competency Dashboard & Radar
    │   ├── profile/setup/    # Guided Profile Setup & Resume Upload
    │   └── components/       # Reusable Brutalist UI, AuthModal, Buddy
    ├── public/               # Static assets & icons
    └── utils/                # API client & auth tokens helper
```

### Technology Matrix

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16.3 (Turbopack, App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.12+, Django 5.1+, Django REST Framework (DRF), SimpleJWT |
| **Document Processing** | `pypdf` (v6.16+), `python-docx` (v1.2+), `lxml` |
| **Database** | SQLite (development) / PostgreSQL (production) |
| **AI Services** | NVIDIA NIM API, Google Gemini API, Deterministic Regulatory Rule Parsers |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.17 or higher
- **Python**: v3.10, 3.11, or 3.12
- **Git**

---

### Backend Installation & Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install pypdf python-docx lxml
   ```

4. **Configure Environment Variables**:
   Create a `.env` file inside `backend/`:
   ```env
   DJANGO_SECRET_KEY=your-secure-secret-key
   DEBUG=True

   # Optional AI Provider Keys (System operates gracefully offline if omitted)
   NVIDIA_API_KEY=your-nvidia-api-key
   NVIDIA_API_BASE_URL=https://integrate.api.nvidia.com/v1
   NVIDIA_NEMOTRON_MODEL=nvidia/llama-3.1-nemotron-70b-instruct

   # Email Service (Optional for local dev)
   EMAIL_HOST_USER=neetisaarthi@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   ```

5. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Start the Django development server**:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```

---

### Frontend Installation & Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install npm packages**:
   ```bash
   npm install
   ```

3. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Open [http://localhost:3000](http://localhost:3000) to view Neeti Saarthi.

---

## 🧪 Verification & Testing

### 1. Django Assessment Test Suite
Run the automated test suite verifying document extraction, IDOR security, and question generation:
```bash
cd backend
.\venv\Scripts\python.exe manage.py test assessment
```
*(All 7 unit and integration tests will execute and pass.)*

### 2. Full End-to-End Civil Service Journey Test
Execute the comprehensive end-to-end verification script with a real test officer and multi-page policy PDF:
```bash
cd backend
.\venv\Scripts\python.exe scratch\verify_phase1_e2e.py
```
This verifies:
- PDF upload & page-level chunk extraction.
- Grounded question generation with verbatim evidence.
- Studio author review, manual question composer, and publishing workflow.
- Learner test runner execution with answer scoring.
- Source-backed explanations citing exact document pages.
- Database audit records (`QuizAttempt`, `QuizAnswer`) and competency progression in `OfficialSkillProficiency`.

### 3. Frontend Production Build
Verify zero TypeScript and Turbopack compilation errors:
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Data Integrity

- **Strict IDOR Protection**: Endpoints enforce document and draft quiz ownership (`quiz.created_by == request.user`). Users cannot access, edit, or delete another officer's private material.
- **Client Answer Shielding**: Correct options (`is_correct`) are stripped from learner test-runner payloads.
- **MIME & Content Validation**: Uploaded documents are inspected for magic bytes, preventing arbitrary script or executable upload.
- **Zero Hallucination Guarantee**: Questions generated in the Knowledge Check system must cite a verbatim continuous excerpt found in the uploaded source document.

---

## 📄 License

This project is developed for administrative innovation and public sector capacity building. Distributed under the **MIT License**.
