const CSRF_TOKEN_HEADER = 'x-csrf-token';

export function getCSRFTokenFromHeaders(headers: Headers): string | null {
  return headers.get(CSRF_TOKEN_HEADER);
}
