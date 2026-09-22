# Neeti Saarthi — Security & Authentication Architecture

This document defines the production-grade authentication protection, password security policies, Google reCAPTCHA v3 bot prevention, and API rate limiting implemented across the Neeti Saarthi platform.

---

## 1. Environment Variables Reference

### Backend (`.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `RECAPTCHA_ENABLED` | `boolean` | `True` (prod), `False` (dev) | Toggles reCAPTCHA v3 token verification on the backend. |
| `RECAPTCHA_SECRET_KEY` | `string` | `""` | Google reCAPTCHA v3 server-side secret key. **Never exposed to clients or checked into git.** |
| `RECAPTCHA_MIN_SCORE` | `float` | `0.5` | Minimum risk score required (0.0 to 1.0) before a request is treated as human. |
| `RECAPTCHA_ALLOWED_HOSTNAMES` | `comma-separated` | `""` | Optional whitelist of domain hostnames returned by Google siteverify (e.g. `neetisaarthi.gov.in,neetisaarthi.com`). Defaults to `ALLOWED_HOSTS`. |
| `THROTTLE_LOGIN_IP` | `string` | `5/minute` | Rate limit for login attempts by IP. |
| `THROTTLE_LOGIN_ACCOUNT` | `string` | `5/10m` | Rate limit for login attempts by account. |
| `THROTTLE_REGISTER_IP` | `string` | `5/hour` | Rate limit for registration attempts by IP. |
| `THROTTLE_PW_RESET_IP` | `string` | `5/hour` | Rate limit for password reset requests by IP. |
| `THROTTLE_PW_RESET_ACC` | `string` | `3/15m` | Rate limit for password reset requests by account. |
| `SUPPORT_EMAIL` | `string` | `neetisaarthi@gmail.com` | Immutable recipient destination for all user support inquiries. |

### Frontend (`.env.production` / `.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 public site key used in Next.js builds. |
| `VITE_RECAPTCHA_SITE_KEY` | Equivalent public site key recognized by Vite / frontend environments. |
| `NEXT_PUBLIC_RECAPTCHA_ENABLED` | Set to `true` in production to enable token acquisition. |
| `NEXT_PUBLIC_API_BASE` | Base URL for the Django REST API backend. |

---

## 2. Password Security & Validation Rules

Neeti Saarthi enforces strict password complexity to safeguard official civil service records.

### Django `AUTH_PASSWORD_VALIDATORS` Configured
1. **`UserAttributeSimilarityValidator`**:
   - Compares passwords against user attributes: `username`, `email`, `first_name`, `last_name`.
   - Rejects passwords that share more than 70% similarity with user information.
2. **`MinimumLengthValidator`**:
   - Enforces a minimum length of **12 characters**.
3. **`CommonPasswordValidator`**:
   - Compares against a dictionary of over 20,000 common passwords.
4. **`NumericPasswordValidator`**:
   - Rejects passwords consisting entirely of numeric digits.

### Backend Validation Authority
- `validate_password(password, user=user)` is executed in every API path that creates or modifies credentials:
  - Account Registration: [`RegisterSerializer`](file:///c:/Users/DELL/Desktop/Neeti-Vivaad/backend/core/serializers.py)
  - Password Reset Confirmation: [`PasswordResetConfirmView`](file:///c:/Users/DELL/Desktop/Neeti-Vivaad/backend/core/views.py)
- Passwords are **never transmitted to Gemini or any third-party AI service**.

### Frontend Password Strength Recommender
- Integrated in registration and password reset forms via [`PasswordStrengthMeter.tsx`](file:///c:/Users/DELL/Desktop/Neeti-Vivaad/frontend/app/components/PasswordStrengthMeter.tsx).
- Runs **100% locally** in the browser without network latency.
- Features:
  - Dynamic score meter (Weak, Fair, Good, Strong).
  - 12-character minimum indicator.
  - Uppercase, lowercase, numeric, and special character checklist.
  - Common password detection and warnings.
  - Personal information similarity warning (matches against entered name and email).
  - Password show/hide toggle buttons.
  - Confirm password field with real-time matching indicator.

---

## 3. Google reCAPTCHA v3 Bot Decision Logic

Neeti Saarthi utilizes frictionless Google reCAPTCHA v3. Legitimate learners are not interrupted with visual puzzles.

### Backend Verification: `verify_recaptcha()`
Location: [`backend/core/recaptcha.py`](file:///c:/Users/DELL/Desktop/Neeti-Vivaad/backend/core/recaptcha.py)

The function verifies:
1. **Token Presence**: Extracted from request body (`recaptcha_token` / `captcha_token`) or HTTP header (`X-Recaptcha-Token`).
2. **Single-Use Replay Defense**:
   - Tokens are hashed using SHA-256 and stored in the atomic cache for 3 minutes.
   - Duplicate or replayed tokens are immediately rejected.
3. **Safe API Call**:
   - Requests are dispatched to `https://www.google.com/recaptcha/api/siteverify` with a 5-second hard timeout.
   - Handles network timeouts and Google service outages safely.
4. **Action Matching**:
   - Ensures the token generated on the client explicitly matches the server-expected action (e.g., prevents a token generated on a low-risk public page from being used to submit a sensitive assessment).
5. **Hostname Whitelisting**:
   - Verifies the hostname reported by Google matches approved application domains.
6. **Risk Score Threshold**:
   - Compares the returned score ($0.0 \dots 1.0$) against `RECAPTCHA_MIN_SCORE` (default `0.5`).
7. **Confidentiality**:
   - Raw tokens and API secret keys are **never written to log files**.
8. **User Privacy**:
   - Verification failures never leak technical details (such as `score: 0.22`). Instead, the UI displays:
     > *"We couldn't verify this request. Please try again."*

---

## 4. Protected Actions Registry

ReCAPTCHA tokens are generated dynamically **immediately before the dispatch of the protected request** (never on passive page load):

| Action Name | Description | Endpoint |
|---|---|---|
| `register` | Official account creation | `/api/auth/register/` |
| `login` | Official authentication | `/api/auth/login/` |
| `resend_verification` | Verification link dispatch | `/api/auth/resend-verification/` |
| `password_reset` | Password reset link request | `/api/auth/password-reset/request/` |
| `contact_support` | Support ticket dispatch | `/api/support/` |
| `submit_review` | Review submission | `/api/reviews/submit/` |
| `resume_upload` | Resume upload and profile extraction | `/api/onboarding/resume-upload/` |
| `generate_quiz` | AI assessment generation | `/api/assessment/generate-quiz/` |
| `start_vivaad` | Vivaad session initialization | `/api/debate/sessions/start/` |
| `submit_vivaad_decision` | Deliberation verdict submission | `/api/debate/sessions/<id>/decide/` |

---

## 5. Suspicious Login & Anti-Harvesting Policies

1. **Email Harvesting Prevention**:
   - Failed logins return: `"Invalid credentials. Please verify your email and password."`
   - Password reset requests return: `"If an account exists with that email address, password reset instructions have been sent."`
   - Resend verification requests return: `"If an unverified account exists with that email, a new verification link has been dispatched."`
   - Endpoints **never reveal whether an email address exists** in the system.
2. **Suspicious Login Handling**:
   - Users are not permanently locked out solely based on a low reCAPTCHA score.
   - Instead, strict IP and account throttling is applied, requiring email verification and prompting the user to retry after cooldown.

---

## 6. API Rate Limiting Architecture

DRF Throttling is strictly decoupled from bot scoring:

- **Auth Scopes**:
  - `LoginIPThrottle`: 5 requests / minute
  - `LoginAccountThrottle`: 5 attempts / 10 minutes
  - `RegistrationIPThrottle`: 5 requests / hour
  - `VerificationIPThrottle`: 5 requests / hour
  - `PasswordResetIPThrottle`: 5 requests / hour
  - `PasswordResetAccountThrottle`: 3 requests / 15 minutes
- **Heavy AI Operations**:
  - `ResumeUploadThrottle`: 10 requests / hour
  - `KnowledgeCheckGenThrottle`: 10 requests / hour
  - `VivaadScenarioGenThrottle`: 10 requests / hour
  - `VivaadDecisionThrottle`: 30 requests / hour
  - `BuddyRateThrottle`: 30 messages / minute
- **Response Format on 429**:
  ```http
  HTTP/1.1 429 Too Many Requests
  Retry-After: 120
  Content-Type: application/json

  {
    "error": "You're doing that a little too quickly. Please try again in a moment.",
    "detail": "Please wait 120 seconds before retrying.",
    "retry_after": 120
  }
  ```

---

## 7. Sensitive Data Auditing (Never Logged)

To prevent security leaks, the system never writes the following to application logs or persistence storage:
- Plaintext passwords or confirmation passwords
- reCAPTCHA raw tokens or client verification responses
- `RECAPTCHA_SECRET_KEY` or `DJANGO_SECRET_KEY`
- Raw email verification tokens in cleartext
- Password reset tokens in cleartext
- Private resume documents or extracted personal identifiers
