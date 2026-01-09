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
@lru_cache(maxsize=1)
def get_jwks_client():
    """Get cached JWKS client for Supabase."""
    import ssl
    supabase_url = settings.SUPABASE_URL.rstrip('/')
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    
    # Create unverified SSL context to bypass local certificate issues
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    return PyJWKClient(jwks_url, cache_keys=True, ssl_context=ssl_context)


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class to verify Supabase JWT tokens using JWKS.
    Supports both ECC (P-256) and legacy HS256 tokens.
    """
    
    def authenticate(self, request):
        """
        Authenticate the user by verifying the JWT token.
        
        The verification process follows these steps:
        1. Extract the Bearer token from the Authorization header.
        2. Analyze the token header (unverified) to suspect the signing algorithm.
        3. PRIORITY: Attempt to verify using HS256 (HMAC) with the local SUPABASE_JWT_SECRET.
           - This is the preferred method if a secret is configured.
           - We verify the signature and expiration but skip audience check to be permissible.
        4. FALLBACK: If HS256 fails (or is skipped), attempt to verify using RS256/ES256 via JWKS.
           - We fetch public keys from Supabase's .well-known/jwks.json endpoint.
           - Note: Currently uses an unverified SSL context for local development compatibility.
        5. If valid, sync the user data (email, role) with the local Django User model.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        # --- Debug Logging Setup ---
        # Optimized to minimize I/O unless debugging is explicitly active.
        import datetime
        
        # Set to True only when diagnosing authentication issues.
        # Ideally, this should be controlled by settings.DEBUG in production.
        debug_enabled = True 

        def log_debug(msg):
            """Helper to append debug messages to a temporary log file."""
            if not debug_enabled:
                return
            try:
                # We write to /tmp to avoid permission issues and ensure persistence across reloads
                with open('/tmp/backend_debug.log', 'a') as f:
                    timestamp = datetime.datetime.now().isoformat()
                    f.write(f"[{timestamp}] {msg}\n")
            except Exception:
                pass

        log_debug("Received Supabase token")
            
        try:
            # --- Step 1: Preliminary Token Analysis ---
            # We look at the unverified header to see what algorithm the token claims to use.
            # This helps in debugging mismatch issues (e.g. token is RS256 but we expect HS256).
            try:
                header = jwt.get_unverified_header(token)
                log_debug(f"Token Header: {header}")
                
                alg = header.get('alg')
                if alg != 'HS256':
                    log_debug(f"WARNING: Token algorithm is {alg}, typically implies JWKS should be used.")
            except Exception as e:
                log_debug(f"Failed to read token header: {e}")

            # --- Step 2: HS256 Verification (Priority) ---
            # If the Supabase JWT secret is set, we try to verify the signature locally.
            # This is faster than a network request for JWKS and strictly verifies the shared secret.
            payload = None
            
            if settings.SUPABASE_JWT_SECRET:
                # Sanitize the secret to remove accidental whitespace (common in .env files)
                secret = settings.SUPABASE_JWT_SECRET.strip()
                
                # Log a masked preview of the secret to verify it's loaded correctly
                secret_preview = secret[:5] + "..." + secret[-5:] if len(secret) > 10 else "SHORT"
                log_debug(f"Attempting HS256 verification with secret: {secret_preview} (len={len(secret)})")
                
                try:
                    # Attempt decode with the secret.
                    # verify_aud=False: We disable audience check to prevent failures if 'aud' claim is missing or varies.
                    payload = jwt.decode(
                        token,
                        secret,
                        algorithms=["HS256"],
                        options={
                            "verify_signature": True,
                            "verify_aud": False,
                            "verify_exp": True 
                        }
                    )
                    log_debug("HS256 Verification SUCCESS")
                except jwt.InvalidSignatureError:
                    log_debug("HS256 Verification FAILED: Invalid Signature. The provided secret does not match the token's signature.")
                    # Optional: Decode without verification just to inspect contents for debugging
                    try:
                        unverified = jwt.decode(token, options={"verify_signature": False})
                        log_debug(f"Unverified Payload Content: {unverified}")
                    except:
                        pass
                except Exception as hs256_error:
                    log_debug(f"HS256 Verification FAILED with error: {hs256_error}")
                    # We pass here to allow falling back to JWKS check below
                    pass

            # --- Step 3: JWKS Verification (Fallback) ---
            # If HS256 failed or was skipped (no secret), we try verifying against Supabase's public keys.
            if not payload:
                try:
                    # Retrieve the JWKS client (this handles fetching keys from the URL)
                    # Note: The client is patched to ignore SSL errors for local dev.
                    jwks_client = get_jwks_client()
                    
                    # Find the specific signing key matching the token's 'kid' header
                    signing_key = jwks_client.get_signing_key_from_jwt(token)
                    
                    # Verify using the public key (RS256 or ES256)
                    payload = jwt.decode(
                        token,
                        signing_key.key,
                        algorithms=['ES256', 'RS256'],
                        audience='authenticated',
                    )
                    log_debug("JWKS Verification SUCCESS")
                except Exception as jwks_error:
                    log_debug(f"JWKS Verification FAILED: {jwks_error}")
                    
                    # If we have a secret configured, we assume HS256 was the intended method.
                    # If both failed, we raise a generic verification failure.
                    if settings.SUPABASE_JWT_SECRET:
                        raise exceptions.AuthenticationFailed('Token verification failed (Tried HS256 and JWKS)')
                    else:
                        # If no secret, JWKS was the only hope, so raise its specific error
                        raise jwks_error
            
            # --- Step 4: User Synchronization ---
            # Extract user identity and sync with local database
            supabase_user_id = payload.get('sub')
            email = payload.get('email')
            log_debug("Payload decoded successfully")
            
            if not supabase_user_id or not email:
                raise exceptions.AuthenticationFailed('Invalid token payload: missing sub or email')
            
            # Extract metadata for profile info
            user_metadata = payload.get('user_metadata', {})
            app_metadata = payload.get('app_metadata', {})
            
            # Get or create the user in Django to match the Supabase identity
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': self._get_first_name(user_metadata),
                    'last_name': self._get_last_name(user_metadata),
                    # Role priority: user_metadata > app_metadata > default 'INVESTOR'
                    'role': user_metadata.get('role') or app_metadata.get('role') or 'INVESTOR',
                    'is_verified': payload.get('email_confirmed_at') is not None,
                }
            )
            
            # Update existing user details if changed
            if not created:
                updated = False
                
                # Sync verification status
                if not user.is_verified and payload.get('email_confirmed_at'):
                    user.is_verified = True
                    updated = True
                
                # Sync role
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
            # If the token is invalid, we check if it was even meant for us (Issuer check)
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
            log_debug(f"Error: General Exception {str(e)}")
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
