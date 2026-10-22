import { MediaStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  listPendingMedia,
  listPendingStories,
  reviewMedia,
  reviewStory,
} from "@/lib/media";
import { requireActor } from "@/lib/session";

export const metadata = {
  title: "Media review",
  description: "Review photos and family stories.",
};

export default function AdminMediaPage() {
  return (
    <Suspense fallback={<MediaReviewSkeleton />}>
      <MediaReviewContent />
    </Suspense>
  );
}

async function MediaReviewContent() {
  const { actor } = await requireActor();
  if (actor.role !== "ADMIN" || actor.membershipStatus !== "APPROVED") {
    redirect("/account");
  }
  const [media, stories] = await Promise.all([
    listPendingMedia(),
    listPendingStories(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Administration
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Photo and story review
      </h1>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-stone-950">Photos</h2>
        {media.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {media.map((item) => (
              <li
                className="rounded-2xl border border-stone-200 bg-white p-6"
                key={item.id}
              >
                <p className="font-semibold text-stone-950">
                  {item.caption || "Uncaptioned photo"}
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  Submitted by {item.uploadedBy.name ?? item.uploadedBy.email ?? "Unknown"}
                  {item.person ? ` · ${item.person.primaryName}` : ""}
                </p>
                <p className="mt-2 text-xs text-stone-400">
                  {item.format ?? "unknown format"} · {item.bytes ?? 0} bytes
                </p>
                <ReviewActions id={item.id} type="media" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No pending photos.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-stone-950">Stories</h2>
        {stories.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {stories.map((story) => (
              <li
                className="rounded-2xl border border-stone-200 bg-white p-6"
                key={story.id}
              >
                <h3 className="font-semibold text-stone-950">{story.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">
                  {story.body}
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  Submitted by {story.submittedBy.name ?? story.submittedBy.email ?? "Unknown"}
                  {story.person ? ` · ${story.person.primaryName}` : ""}
                </p>
                <ReviewActions id={story.id} type="story" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No pending stories.</p>
        )}
      </section>
    </main>
  );
}

function ReviewActions({
  id,
  type,
}: {
  id: string;
  type: "media" | "story";
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <form action={reviewMediaAction}>
        <input name="id" type="hidden" value={id} />
        <input name="type" type="hidden" value={type} />
        <input name="status" type="hidden" value={MediaStatus.APPROVED} />
        <button
          className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
          type="submit"
        >
          Approve
        </button>
      </form>
      <form action={reviewMediaAction}>
        <input name="id" type="hidden" value={id} />
        <input name="type" type="hidden" value={type} />
        <input name="status" type="hidden" value={MediaStatus.REJECTED} />
        <button
          className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-800 hover:border-stone-500"
          type="submit"
        >
          Reject
        </button>
      </form>
    </div>
  );
}

async function reviewMediaAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "");
  const status = String(formData.get("status") ?? "") as "APPROVED" | "REJECTED";
  if (type === "story") await reviewStory(actor, id, status);
  else await reviewMedia(actor, id, status);
  revalidatePath("/admin/media");
  revalidatePath("/history");
}

function MediaReviewSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-96 rounded bg-stone-200" />
      <div className="mt-10 h-64 rounded-2xl bg-stone-200" />
    </main>
  );
}
