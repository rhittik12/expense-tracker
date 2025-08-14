import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const user = await clerkClient().users.getUser(userId);
  return NextResponse.json({ role: (user.publicMetadata.role as string)||'user' });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const user = await clerkClient().users.getUser(userId);
  const currentRole = (user.publicMetadata.role as string)||'user';
  // only allow self-elevation if already admin (for simplicity) - production would require existing admin
  if (currentRole !== 'admin') return new NextResponse('Forbidden', { status: 403 });
  const body = await req.json();
  const targetRole = body.role as string;
  if (!['user','admin'].includes(targetRole)) return new NextResponse('Invalid role', { status: 400 });
  await clerkClient().users.updateUser(userId, { publicMetadata: { role: targetRole } });
  return NextResponse.json({ role: targetRole });
}
