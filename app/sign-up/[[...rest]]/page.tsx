import { SignUp } from '@clerk/nextjs';

export default function SignUpCatchAll() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
