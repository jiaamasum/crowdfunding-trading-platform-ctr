"""
Supabase JWT Authentication Backend for Django REST Framework.

This module verifies JWT tokens issued by Supabase Auth using JWKS (for ECC keys).
"""
import jwt
from jwt import PyJWKClient
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from functools import lru_cache

User = get_user_model()


@lru_cache(maxsize=1)
def get_jwks_client():
    """Get cached JWKS client for Supabase."""
    supabase_url = settings.SUPABASE_URL.rstrip('/')
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True)


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class to verify Supabase JWT tokens using JWKS.
    Supports both ECC (P-256) and legacy HS256 tokens.
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # Debug logging is opt-in to avoid IO on every request.
            import datetime
            debug_enabled = settings.DEBUG and getattr(settings, 'SUPABASE_AUTH_DEBUG', False)

            def log_debug(msg):
                if not debug_enabled:
                    return
                try:
                    with open('backend_debug.log', 'a') as f:
                        timestamp = datetime.datetime.now().isoformat()
                        f.write(f"[{timestamp}] {msg}\n")
                except Exception:
                    pass

            log_debug("Received Supabase token")
            
            # Try JWKS verification first (for ECC keys)
            try:
                jwks_client = get_jwks_client()
                log_debug(f"Attempting JWKS verification with {jwks_client.uri}")
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=['ES256', 'RS256'],
                    audience='authenticated',
                )
                log_debug("JWKS Verification SUCCESS")
            except Exception as jwks_error:
                log_debug("JWKS Verification FAILED")
                # Fallback to HS256 with secret if JWKS fails
                if settings.SUPABASE_JWT_SECRET:
                    log_debug("Attempting HS256 fallback")
                    try:
                        payload = jwt.decode(
                            token,
                            settings.SUPABASE_JWT_SECRET,
                            algorithms=['HS256'],
                            audience='authenticated',
                        )
                        log_debug("HS256 Verification SUCCESS")
                    except Exception as hs256_error:
                        log_debug("HS256 Verification FAILED")
                        raise hs256_error
                else:
                    log_debug("No Secret found for fallback")
                    raise jwks_error
            
            supabase_user_id = payload.get('sub')
            email = payload.get('email')
            log_debug("Payload decoded")
            
            if not supabase_user_id or not email:
                raise exceptions.AuthenticationFailed('Invalid token payload')
            
            # Get user metadata
            user_metadata = payload.get('user_metadata', {})
            app_metadata = payload.get('app_metadata', {})
            
            # Get or create the user in Django
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': self._get_first_name(user_metadata),
                    'last_name': self._get_last_name(user_metadata),
                    'role': user_metadata.get('role') or app_metadata.get('role') or 'INVESTOR',
                    'is_verified': payload.get('email_confirmed_at') is not None,
                }
            )
            
            # Update user if needed
            if not created:
                updated = False
                
                # Update verification status if changed
                if not user.is_verified and payload.get('email_confirmed_at'):
                    user.is_verified = True
                    updated = True
                
                # Update role if set in metadata and different
                new_role = user_metadata.get('role') or app_metadata.get('role')
                if new_role and user.role != new_role:
                    user.role = new_role
                    updated = True
                
                if updated:
                    user.save()
            
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            log_debug("Error: Token Expired")
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            log_debug("Error: Invalid Token")
            try:
                unverified = jwt.decode(
                    token,
                    options={"verify_signature": False, "verify_aud": False},
                )
            except Exception:
                unverified = {}

            expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
            issuer = unverified.get('iss') if isinstance(unverified, dict) else None
            if issuer != expected_issuer:
                # Not a Supabase token, let other auth backends handle it.
                return None
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            log_debug("Error: General Exception")
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')
    
    def _get_first_name(self, metadata):
        """Extract first name from user metadata."""
        name = metadata.get('name') or metadata.get('full_name') or ''
        return name.split()[0] if name else ''
    
    def _get_last_name(self, metadata):
        """Extract last name from user metadata."""
        name = metadata.get('name') or metadata.get('full_name') or ''
        parts = name.split()
        return ' '.join(parts[1:]) if len(parts) > 1 else ''
    
    def authenticate_header(self, request):
        return 'Bearer'
