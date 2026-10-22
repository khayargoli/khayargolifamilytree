import { revalidatePath } from "next/cache";
import { Suspense } from "react";

import { listPublicPeopleForTree } from "@/lib/public-data";
import { submitPhoto, submitStory } from "@/lib/media";
import { requireActor } from "@/lib/session";

export const metadata = {
  title: "Photos and stories",
  description: "Submit photos and family stories for review.",
};

export default function MediaContributionPage() {
  return (
    <Suspense fallback={<MediaSkeleton />}>
      <MediaContributionContent />
    </Suspense>
  );
}

async function MediaContributionContent() {
  const { session } = await requireActor();
  if (
    session.user.membershipStatus !== "APPROVED" &&
    session.user.role !== "ADMIN"
  ) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-10">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
          Photos and stories
        </h1>
        <p className="mt-4 text-stone-600">
          Your membership must be approved before you can submit media or
          stories.
        </p>
      </main>
    );
  }

  const people = await listPublicPeopleForTree();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Family history
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Share a photo or story
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-600">
        Uploads are private while pending. An administrator reviews the
        caption, people, and story before publication.
      </p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-stone-950">Photo</h2>
          <form action={submitPhotoAction} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-stone-800" htmlFor="file">
              Image file
            </label>
            <input
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full rounded-xl border border-stone-300 px-4 py-3 text-sm"
              id="file"
              name="file"
              required
              type="file"
            />
            <p className="text-xs text-stone-500">Maximum 10 MB.</p>
            <label className="block text-sm font-medium text-stone-800" htmlFor="caption">
              Caption (optional)
            </label>
            <input
              className="w-full rounded-xl border border-stone-300 px-4 py-3"
              id="caption"
              maxLength={500}
              name="caption"
            />
            <PersonSelect id="photo-personId" people={people} />
            <SubmitButton label="Submit photo" />
          </form>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-stone-950">Family story</h2>
          <form action={submitStoryAction} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-stone-800" htmlFor="title">
              Title
            </label>
            <input
              className="w-full rounded-xl border border-stone-300 px-4 py-3"
              id="title"
              maxLength={200}
              name="title"
              required
            />
            <label className="block text-sm font-medium text-stone-800" htmlFor="body">
              Story
            </label>
            <textarea
              className="min-h-48 w-full rounded-xl border border-stone-300 px-4 py-3"
              id="body"
              maxLength={50_000}
              name="body"
              required
            />
            <PersonSelect id="story-personId" people={people} />
            <SubmitButton label="Submit story" />
          </form>
        </section>
      </div>
    </main>
  );
}

function PersonSelect({
  id,
  people,
}: {
  id: string;
  people: Awaited<ReturnType<typeof listPublicPeopleForTree>>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-800" htmlFor={id}>
        Associated person (optional)
      </label>
      <select
        className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
        id={id}
        name="personId"
      >
        <option value="">No associated person</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.primaryName}
          </option>
        ))}
      </select>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
      type="submit"
    >
      {label}
    </button>
  );
}

async function submitPhotoAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("An image file is required.");
  await submitPhoto(actor, file, {
    caption: String(formData.get("caption") ?? ""),
    personId: String(formData.get("personId") ?? "") || null,
  });
  revalidatePath("/contribute/media");
}

async function submitStoryAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await submitStory(actor, {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    personId: String(formData.get("personId") ?? "") || null,
  });
  revalidatePath("/contribute/media");
}

function MediaSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-96 rounded bg-stone-200" />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-2xl bg-stone-200" />
        <div className="h-96 rounded-2xl bg-stone-200" />
      </div>
    </main>
  );
}
