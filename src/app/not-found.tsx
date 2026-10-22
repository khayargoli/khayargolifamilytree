import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-stone-950">
        We could not find that page
      </h1>
      <p className="mt-4 text-stone-600">
        The page may have moved or may not be available yet.
      </p>
      <Link
        className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
        href="/"
      >
        Return home
      </Link>
    </main>
  );
}
