import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to read client configuration from cookies and inject into HTML
 * This ensures SSR renders with correct theme/language/fontSize on first paint
 */
export function middleware(request: NextRequest) {
  // Read configuration from cookies (set by Electron)
  const theme = request.cookies.get('app-theme')?.value || 'dark';
  const fontSize = request.cookies.get('app-fontsize')?.value || '14';
  const language = request.cookies.get('app-language')?.value || 'en';

  console.log('[MIDDLEWARE] Config from cookies:', { theme, fontSize, language });

  // Create response
  const response = NextResponse.next();

  // Set custom headers to pass config to the client
  response.headers.set('X-App-Theme', theme);
  response.headers.set('X-App-FontSize', fontSize);
  response.headers.set('X-App-Language', language);

  return response;
}

export const config = {
  // Match all pages except static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
