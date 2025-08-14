// This duplicate middleware file is kept minimal; Next.js uses root-level middleware.ts.
// Using new Clerk v5 API (clerkMiddleware) instead of deprecated authMiddleware.
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublic = createRouteMatcher(['/', '/api/export']);

export default clerkMiddleware((auth, req) => {
  if (!isPublic(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!.+\\.[\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
};
