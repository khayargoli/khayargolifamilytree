import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Our shared history
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-950 sm:text-6xl">
          The Khayargoli family tree
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
          A welcoming place to explore family relationships and preserve the
          stories that connect generations.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-full bg-stone-900 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-stone-700"
            href="/tree"
          >
            Explore the tree
          </Link>
          <Link
            className="rounded-full border border-stone-300 px-6 py-3 text-center text-sm font-semibold text-stone-800 transition hover:border-stone-500"
            href="/people"
          >
            Browse people
          </Link>
        </div>
      </div>
      <section className="mt-20 grid gap-4 border-t border-stone-200 pt-8 text-sm text-stone-600 sm:grid-cols-3">
        <p>Public profiles for shared family information.</p>
        <p>Relationships represented with care, including incomplete histories.</p>
        <p>Contributions reviewed by trusted family members.</p>
      </section>
    </main>
  );
}
