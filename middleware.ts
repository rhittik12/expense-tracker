import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Private deployment: only authenticated & allow‑listed users (by email domain or exact) may access app.
// Adjust ALLOW_EMAILS / ALLOW_DOMAIN via env (NEXT_PUBLIC_ALLOW_EMAILS / NEXT_PUBLIC_ALLOW_DOMAIN) if desired.
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health'
]);

const allowedEmails = (process.env.NEXT_PUBLIC_ALLOW_EMAILS||'').split(',').map(e=>e.trim()).filter(Boolean);
const allowedDomain = process.env.NEXT_PUBLIC_ALLOW_DOMAIN?.trim();

export default clerkMiddleware( async (auth, req) => {
  if (isPublicRoute(req)) return;
  const { userId, sessionClaims } = auth();
  if (!userId) { auth().redirectToSignIn(); return; }
  const email = (sessionClaims?.email as string) || (sessionClaims?.primary_email as string) || '';
  const domain = email.split('@')[1];
  if (allowedEmails.length===0 && !allowedDomain) return; // if no allowlist configured, allow all signed-in
  if (allowedEmails.includes(email)) return;
  if (allowedDomain && domain === allowedDomain) return;
  // Not allowed -> sign out / deny
  return new Response('Forbidden', { status: 403 });
});

export const config = {
  matcher: ['/((?!.+\\.[\w]+$|_next).*)','/','/(api|trpc)(.*)']
};
