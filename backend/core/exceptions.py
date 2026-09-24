import math
from rest_framework.views import exception_handler
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """
    Custom exception handler for Neeti Saarthi DRF API.
    Provides clean, user-friendly, privacy-preserving responses
    without leaking internal implementation or throttling scopes.
    """
    if isinstance(exc, Throttled):
        wait = math.ceil(exc.wait) if exc.wait is not None else 60
        custom_data = {
            'error': "You're doing that a little too quickly. Please try again in a moment.",
            'detail': f"Please wait {wait} seconds before retrying.",
            'retry_after': wait
        }
        response = Response(custom_data, status=status.HTTP_429_TOO_MANY_REQUESTS)
        response['Retry-After'] = str(wait)
        return response

    # Delegate to standard DRF exception handler for all other exceptions
    response = exception_handler(exc, context)
    if response is None:
        import logging
        logging.getLogger(__name__).exception("Unhandled API exception", exc_info=exc)
        return Response(
            {'error': "An internal error occurred while processing this request. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    return response

