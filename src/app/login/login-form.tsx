"use client";

import { signIn } from "next-auth/react";

export default function LoginForm() {
  return (
    <button
      className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
      onClick={() => signIn("google", { callbackUrl: "/account" })}
      type="button"
    >
      Continue with Google
    </button>
  );
}
