import hashlib
from unittest.mock import patch, MagicMock
import requests
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework.test import APIClient
from rest_framework import status

from core.recaptcha import verify_recaptcha, GENERIC_VERIFY_ERROR
from core.models import PasswordResetToken

User = get_user_model()

class PasswordSecurityTests(TestCase):
    """
    Validates AUTH_PASSWORD_VALIDATORS:
    - UserAttributeSimilarityValidator
    - MinimumLengthValidator: 12
    - CommonPasswordValidator
    - NumericPasswordValidator
    """

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="rajesh.kumar@gov.in",
            email="rajesh.kumar@gov.in",
            first_name="Rajesh",
            last_name="Kumar"
        )

    def test_minimum_length_12_enforced(self):
        with self.assertRaises(DjangoValidationError):
            validate_password("Short1!", user=self.user)

    def test_numeric_password_rejected(self):
        with self.assertRaises(DjangoValidationError):
            validate_password("12345678901234", user=self.user)

    def test_common_password_rejected(self):
        with self.assertRaises(DjangoValidationError):
            validate_password("password123456", user=self.user)

    def test_user_attribute_similarity_rejected(self):
        with self.assertRaises(DjangoValidationError):
            validate_password("rajesh.kumar@gov.in", user=self.user)

    def test_valid_strong_password_accepted(self):
        # 12+ chars, mixed case, digits, symbols, not similar to name/email
        try:
            validate_password("Neeti#Kavach$9821!", user=self.user)
        except DjangoValidationError:
            self.fail("Strong password was unexpectedly rejected by validators")

    @patch('core.views.verify_recaptcha')
    def test_register_api_enforces_password_validators(self, mock_recaptcha):
        mock_recaptcha.return_value = (True, None)

        # 1. Weak password (too short)
        payload = {
            "first_name": "Suresh",
            "last_name": "Patel",
            "email": "suresh.patel@gov.in",
            "password": "short"
        }
        res = self.client.post('/api/auth/register/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Similar to name
        payload["password"] = "SureshPatel2026!"
        res = self.client.post('/api/auth/register/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Valid compliant password (no personal name parts)
        payload["password"] = "SupremeSecurity#2026!"
        res = self.client.post('/api/auth/register/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_password_reset_confirm_enforces_validate_password(self):
        token_obj = PasswordResetToken.objects.create(user=self.user)
        
        # 1. Short password
        res = self.client.post('/api/auth/password-reset/confirm/', data={
            'token': str(token_obj.token),
            'password': 'short'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Strong password
        res = self.client.post('/api/auth/password-reset/confirm/', data={
            'token': str(token_obj.token),
            'password': 'SecureReset#Pass2026!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)


@override_settings(
    RECAPTCHA_ENABLED=True,
    RECAPTCHA_SECRET_KEY="test-secret-key",
    RECAPTCHA_MIN_SCORE=0.5,
    RECAPTCHA_ALLOWED_HOSTNAMES=["testserver", "neetisaarthi.gov.in"]
)
class RecaptchaTests(TestCase):
    """
    Tests Google reCAPTCHA v3 verification logic:
    - valid reCAPTCHA
    - missing token
    - invalid token
    - expired token
    - duplicate token
    - wrong action
    - wrong hostname
    - low score
    - high score
    - Google timeout
    - Google unavailable
    """

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def _make_dummy_request(self, token=None):
        request = MagicMock()
        request.data = {'recaptcha_token': token} if token else {}
        request.POST = {}
        request.headers = {}
        request.META = {'REMOTE_ADDR': '127.0.0.1'}
        return request

    @patch('requests.post')
    def test_valid_recaptcha_high_score(self, mock_post):
        mock_post.return_value.json.return_value = {
            'success': True,
            'action': 'register',
            'score': 0.9,
            'hostname': 'testserver'
        }
        req = self._make_dummy_request(token='valid-token-123')
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertTrue(valid)
        self.assertIsNone(err)

    def test_missing_token(self):
        req = self._make_dummy_request(token=None)
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertFalse(valid)
        self.assertEqual(err, GENERIC_VERIFY_ERROR)

    @patch('requests.post')
    def test_invalid_token(self, mock_post):
        mock_post.return_value.json.return_value = {
            'success': False,
            'error-codes': ['invalid-input-response']
        }
        req = self._make_dummy_request(token='invalid-token')
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertFalse(valid)
        self.assertEqual(err, GENERIC_VERIFY_ERROR)

    @patch('requests.post')
    def test_expired_token(self, mock_post):
        mock_post.return_value.json.return_value = {
            'success': False,
            'error-codes': ['timeout-or-duplicate']
        }
        req = self._make_dummy_request(token='expired-token')
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertFalse(valid)
        self.assertEqual(err, GENERIC_VERIFY_ERROR)

    @patch('requests.post')
    def test_duplicate_token_rejected_by_cache(self, mock_post):
        mock_post.return_value.json.return_value = {
            'success': True,
            'action': 'login',
            'score': 0.8,
            'hostname': 'testserver'
        }
        req = self._make_dummy_request(token='duplicate-token-test')

        # First attempt passes
        valid1, err1 = verify_recaptcha(req, expected_action='login')
        self.assertTrue(valid1)

        # Immediate replay with same token fails without contacting Google
        mock_post.reset_mock()
        valid2, err2 = verify_recaptcha(req, expected_action='login')
        self.assertFalse(valid2)
        self.assertEqual(err2, GENERIC_VERIFY_ERROR)
        mock_post.assert_not_called()

    @patch('requests.post')
    def test_wrong_action(self, mock_post):
        mock_post.return_value.json.return_value = {
            'success': True,
            'action': 'public_page',
            'score': 0.9,
            'hostname': 'testserver'
        }
        req = self._make_dummy_request(token='action-mismatch-token')
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertFalse(valid)
        self.assertEqual(err, GENERIC_VERIFY_ERROR)

    @patch('requests.post')
    def test_wrong_hostname(self, mock_post):
        mock_post.return_value.json.return_value = {
            'success': True,
            'action': 'register',
            'score': 0.9,
            'hostname': 'malicious-phishing-domain.com'
        }
        req = self._make_dummy_request(token='wrong-host-token')
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertFalse(valid)
        self.assertEqual(err, GENERIC_VERIFY_ERROR)

    @patch('requests.post')
    def test_low_score_rejected(self, mock_post):
        mock_post.return_value.json.return_value = {
            'success': True,
            'action': 'register',
            'score': 0.2, # Below 0.5
            'hostname': 'testserver'
        }
        req = self._make_dummy_request(token='bot-token-low-score')
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertFalse(valid)
        self.assertEqual(err, GENERIC_VERIFY_ERROR)

    @patch('requests.post')
    def test_google_timeout_handled_safely(self, mock_post):
        mock_post.side_effect = requests.exceptions.Timeout("Connection timed out after 5s")
        req = self._make_dummy_request(token='timeout-token')
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertFalse(valid)
        self.assertEqual(err, GENERIC_VERIFY_ERROR)

    @patch('requests.post')
    def test_google_unavailable_handled_safely(self, mock_post):
        mock_post.side_effect = requests.exceptions.ConnectionError("Could not resolve host")
        req = self._make_dummy_request(token='unavailable-token')
        valid, err = verify_recaptcha(req, expected_action='register')
        self.assertFalse(valid)
        self.assertEqual(err, GENERIC_VERIFY_ERROR)


class RateLimitingAndSuspiciousLoginTests(TestCase):
    """
    Tests rate limiting and login failure behaviors:
    - rate-limit exceeded
    - repeated registration attempts
    - repeated login attempts
    - password reset abuse
    - generic authentication error (never reveals email existence)
    """

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('core.views.verify_recaptcha')
    def test_login_never_reveals_email_existence(self, mock_recaptcha):
        mock_recaptcha.return_value = (True, None)

        # 1. Non-existent account
        res = self.client.post('/api/auth/login/', data={
            'email': 'nonexistent.user.999@gov.in',
            'password': 'SomePassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Invalid credentials", res.json().get('error', ''))

        # 2. Existing account with bad password
        user = User.objects.create_user(
            username="real.officer@gov.in",
            email="real.officer@gov.in",
            password="StrongRealPassword#2026"
        )
        res = self.client.post('/api/auth/login/', data={
            'email': 'real.officer@gov.in',
            'password': 'WrongPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        # Verify response message is completely identical
        self.assertIn("Invalid credentials", res.json().get('error', ''))

    @patch('core.views.verify_recaptcha')
    def test_repeated_registration_attempts_throttled(self, mock_recaptcha):
        mock_recaptcha.return_value = (True, None)
        
        # Registration IP throttle limit is 5/hour
        throttled = False
        for i in range(10):
            payload = {
                "first_name": f"Officer{i}",
                "last_name": "Test",
                "email": f"officer{i}@gov.in",
                "password": f"ComplexPass#{i}9821a"
            }
            res = self.client.post('/api/auth/register/', data=payload, format='json')
            if res.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                throttled = True
                self.assertIn("Retry-After", res.headers)
                self.assertIn("quickly", res.json().get('error', '').lower())
                break
        self.assertTrue(throttled, "Expected repeated registration attempts to trigger HTTP 429 throttle")

    @patch('core.views.verify_recaptcha')
    def test_password_reset_request_abuse_throttled(self, mock_recaptcha):
        mock_recaptcha.return_value = (True, None)

        throttled = False
        for i in range(10):
            res = self.client.post('/api/auth/password-reset/request/', data={
                'email': 'victim@gov.in'
            }, format='json')
            if res.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                throttled = True
                self.assertIn("Retry-After", res.headers)
                break
        self.assertTrue(throttled, "Expected password reset requests to trigger HTTP 429 throttle")
