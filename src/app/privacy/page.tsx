export const metadata = {
  title: "Privacy",
  description: "How the Khayargoli Family Tree handles public and private information.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Privacy
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Sharing family information with care
      </h1>
      <div className="mt-8 space-y-6 leading-7 text-stone-600">
        <p>
          Only information explicitly approved for public visibility appears
          in this directory and on public profiles.
        </p>
        <p>
          Private contact details are not part of public profiles. Sensitive
          information about living people and minors is kept restricted by
          default.
        </p>
        <p>
          If you see an incorrect or inappropriate public detail, please
          contact a family tree administrator so it can be reviewed.
        </p>
      </div>
    </main>
  );
}
