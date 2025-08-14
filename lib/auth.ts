import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';

export async function requireAuth() {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

export async function getUserRole(userId: string) {
  const user = await clerkClient().users.getUser(userId);
  return (user.publicMetadata.role as string) || 'user';
}
