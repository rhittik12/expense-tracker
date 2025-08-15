import { SignIn } from '@clerk/nextjs';

export default function SignInCatchAll() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignIn
        routing="path"
        path="/sign-in"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}
