import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { getApprovedMediaUrl, listPublicStories } from "@/lib/media";

export const metadata = {
  title: "Family history",
  description: "Approved family stories and photographs.",
};

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryContent />
    </Suspense>
  );
}

async function HistoryContent() {
  const stories = await listPublicStories();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Family history
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Stories we have preserved
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-600">
        Approved stories and photographs shared by family members.
      </p>
      {stories.length > 0 ? (
        <div className="mt-10 space-y-8">
          {stories.map((story) => (
            <article
              className="rounded-2xl border border-stone-200 bg-white p-6"
              key={story.id}
            >
              <h2 className="text-2xl font-semibold text-stone-950">
                {story.title}
              </h2>
              {story.person && (
                <Link
                  className="mt-2 inline-block text-sm text-stone-500 underline underline-offset-4"
                  href={`/people/${story.person.id}`}
                >
                  About {story.person.primaryName}
                </Link>
              )}
              <p className="mt-5 whitespace-pre-line leading-7 text-stone-600">
                {story.body}
              </p>
              {story.media.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {story.media.map((media) => {
                    const url = getApprovedMediaUrl(media);
                    return url ? (
                      <figure key={media.id}>
                        {/* Cloudinary signs this authenticated URL only after approval. */}
                        <Image
                          alt={media.caption || "Approved family photograph"}
                          className="aspect-[4/3] w-full rounded-xl object-cover"
                          height={900}
                          src={url}
                          unoptimized
                          width={1200}
                        />
                        {media.caption && (
                          <figcaption className="mt-2 text-sm text-stone-500">
                            {media.caption}
                          </figcaption>
                        )}
                      </figure>
                    ) : null;
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-stone-300 p-8 text-stone-600">
          No approved stories have been published yet.
        </p>
      )}
    </main>
  );
}

function HistorySkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-80 rounded bg-stone-200" />
      <div className="mt-10 h-72 rounded-2xl bg-stone-200" />
    </main>
  );
}
