"use client";

import { useEffect } from "react";

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  useEffect(() => {
    // Keep this hook available for production error reporting in a later phase.
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-stone-950">
        Something went wrong
      </h1>
      <p className="mt-4 text-stone-600">
        Please try again. If the problem continues, contact the family tree
        administrator.
      </p>
      <button
        className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}
