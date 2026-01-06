from typing import Optional
import requests
from django.conf import settings


class SupabaseAuthError(Exception):
    pass


def _base_url() -> str:
    if not settings.SUPABASE_URL:
        raise SupabaseAuthError('SUPABASE_URL is not configured')
    return settings.SUPABASE_URL.rstrip('/')


def _anon_key() -> str:
    if not settings.SUPABASE_ANON_KEY:
        raise SupabaseAuthError('SUPABASE_ANON_KEY is not configured')
    return settings.SUPABASE_ANON_KEY


def _headers(authorization: Optional[str] = None) -> dict:
    headers = {
        'apikey': _anon_key(),
        'Content-Type': 'application/json',
    }
    if authorization:
        headers['Authorization'] = authorization
    else:
        headers['Authorization'] = f"Bearer {_anon_key()}"
    return headers


def sign_up(payload: dict) -> dict:
    response = requests.post(
        f"{_base_url()}/auth/v1/signup",
        json=payload,
        headers=_headers(),
        timeout=15,
    )
    if not response.ok:
        raise SupabaseAuthError(response.text)
    return response.json()


def sign_in_with_password(email: str, password: str) -> dict:
    response = requests.post(
        f"{_base_url()}/auth/v1/token?grant_type=password",
        json={'email': email, 'password': password},
        headers=_headers(),
        timeout=15,
    )
    if not response.ok:
        raise SupabaseAuthError(response.text)
    return response.json()


def get_user(access_token: str) -> dict:
    response = requests.get(
        f"{_base_url()}/auth/v1/user",
        headers=_headers(authorization=f"Bearer {access_token}"),
        timeout=15,
    )
    if not response.ok:
        raise SupabaseAuthError(response.text)
    return response.json()


def recover_password(email: str, redirect_to: Optional[str]) -> dict:
    payload = {'email': email}
    if redirect_to:
        payload['redirect_to'] = redirect_to
    response = requests.post(
        f"{_base_url()}/auth/v1/recover",
        json=payload,
        headers=_headers(),
        timeout=15,
    )
    if not response.ok:
        raise SupabaseAuthError(response.text)
    return response.json()


def update_password(access_token: str, password: str) -> dict:
    response = requests.put(
        f"{_base_url()}/auth/v1/user",
        json={'password': password},
        headers=_headers(authorization=f"Bearer {access_token}"),
        timeout=15,
    )
    if not response.ok:
        raise SupabaseAuthError(response.text)
    return response.json()


def resend_signup(email: str, redirect_to: Optional[str]) -> dict:
    payload = {'type': 'signup', 'email': email}
    if redirect_to:
        payload['redirect_to'] = redirect_to
    response = requests.post(
        f"{_base_url()}/auth/v1/resend",
        json=payload,
        headers=_headers(),
        timeout=15,
    )
    if not response.ok:
        raise SupabaseAuthError(response.text)
    return response.json()


def build_oauth_url(provider: str, redirect_to: Optional[str]) -> str:
    base = f"{_base_url()}/auth/v1/authorize"
    if redirect_to:
        return f"{base}?provider={provider}&redirect_to={redirect_to}"
    return f"{base}?provider={provider}"
