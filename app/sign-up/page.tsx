import { SignUpForm } from "@/components/auth/sign-up-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up - Marcus AI",
  description: "Create your Marcus AI account",
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white"
            >
              <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
              <path d="m17 4 3 3" />
              <path d="m14 7 3 3" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold">Create an account</h1>
          <p className="mt-2 text-muted-foreground">Join Marcus AI and start chatting</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
