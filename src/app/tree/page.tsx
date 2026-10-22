import Link from "next/link";

export const metadata = {
  title: "Family tree",
  description: "The interactive Khayargoli family tree.",
};

export default function TreePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Coming next
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
        The interactive tree is being prepared
      </h1>
      <p className="mt-5 max-w-xl leading-7 text-stone-600">
        The public directory is ready now. Interactive generations,
        focused-branch navigation, and accessible tree views arrive in Phase
        3.
      </p>
      <Link
        className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
        href="/people"
      >
        Browse public profiles
      </Link>
    </main>
  );
}
