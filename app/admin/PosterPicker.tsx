import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buttonClasses } from "../components/atoms";
import ActionForm from "../components/forms/ActionForm";
import { moderateTitle } from "../community/actions";

type Item = {
    id: string;
    title: string;
    revision: number;
    hidden: boolean;
    cover_image_url: string | null;
};

const IMAGE_EXT = /\.(webp|png|jpe?g|avif)$/i;

/**
 * Work out which public bucket holds the approved art. The moderation RPC
 * only accepts URLs under this project's `/storage/v1/object/public/`, so an
 * existing cover tells us the bucket; otherwise fall back to the env/default.
 */
function bucketFrom(url: string | null | undefined): string | null {
    const match = url?.match(/\/storage\/v1\/object\/public\/([^/]+)\//);
    return match?.[1] ?? null;
}

/**
 * Assign poster art from approved storage. Contributors never upload; an
 * admin picks a file here, checks the crop, and publishes.
 */
export default async function PosterPicker({
    item,
    search,
}: {
    item: Item;
    search: string;
}) {
    const client = await createClient();
    let bucket = bucketFrom(item.cover_image_url);
    if (!bucket) {
        const { data } = await client
            .from("series")
            .select("cover_image_url")
            .not("cover_image_url", "is", null)
            .limit(1)
            .maybeSingle();
        bucket =
            bucketFrom(data?.cover_image_url) ??
            process.env.NEXT_PUBLIC_POSTER_BUCKET ??
            "posters";
    }
    const term = search.trim().slice(0, 100);
    const { data: files, error } = await client.storage
        .from(bucket)
        .list("", {
            limit: 24,
            search: term || undefined,
            sortBy: { column: "name", order: "asc" },
        });
    const images = (files ?? []).filter((f) => IMAGE_EXT.test(f.name));
    const publicUrl = (name: string) =>
        client.storage.from(bucket!).getPublicUrl(name).data.publicUrl;
    const currentName = item.cover_image_url?.split("/").pop() ?? null;

    return (
        <section className="tdx-panel p-4">
            <div className="flex items-baseline gap-2.5 flex-wrap">
                <h2 className="text-[17px] tracking-[-0.01em]">Assign poster</h2>
                <span className="tdx-chip tdx-chip-accent">Admin</span>
                <span className="ml-auto text-xs text-[var(--text-muted)]">{item.title}</span>
            </div>
            <p className="text-[12.5px] leading-[1.55] text-[var(--text-secondary)] mt-2 max-w-[520px]">
                Art comes from approved storage only — contributors never upload. Pick a file, check the crop, publish.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="w-[148px] flex-none">
                    <p className="tdx-eyebrow mb-2">Preview · 3:4</p>
                    <div className="relative w-[148px] aspect-[3/4] rounded-md border border-[var(--accent-primary)] bg-[var(--surface)] overflow-hidden grid place-items-center text-[var(--accent-primary)] text-[11px] text-center p-2.5">
                        {item.cover_image_url ? (
                            <Image src={item.cover_image_url} alt="" fill sizes="148px" className="object-cover" />
                        ) : (
                            "No poster assigned"
                        )}
                    </div>
                    {currentName && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-1.5 break-all leading-[1.4]">
                            {currentName}
                        </p>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <form className="flex items-center gap-2 mb-2">
                        <input type="hidden" name="id" value={item.id} />
                        <span className="tdx-eyebrow flex-none">
                            Storage · {bucket}
                        </span>
                        <input
                            name="poster"
                            defaultValue={search}
                            placeholder="filter by name"
                            aria-label="Filter storage files"
                            className="tdx-field min-h-[30px] py-1 text-xs flex-1"
                        />
                        <button className={buttonClasses({ variant: "secondary", size: "sm" })}>
                            Filter
                        </button>
                    </form>

                    {error ? (
                        <p className="tdx-callout tdx-callout-line text-xs">
                            Couldn&apos;t list the bucket ({error.message}). Paste an approved storage URL below instead.
                        </p>
                    ) : images.length === 0 ? (
                        <p className="tdx-callout tdx-callout-quiet">
                            {term ? `No files match “${term}”.` : "No image files in this bucket."}
                        </p>
                    ) : (
                        <ActionForm action={moderateTitle} className="">
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="revision" value={item.revision} />
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                                {images.map((f) => {
                                    const url = publicUrl(f.name);
                                    const selected = url === item.cover_image_url;
                                    return (
                                        <label
                                            key={f.name}
                                            className={`relative aspect-[3/4] rounded-md overflow-hidden border cursor-pointer has-[:checked]:border-[var(--accent-primary)] has-[:checked]:border-2 ${
                                                selected ? "border-[var(--accent-primary)] border-2" : "border-[var(--line)]"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="cover"
                                                value={url}
                                                defaultChecked={selected}
                                                className="sr-only"
                                            />
                                            <Image src={url} alt={f.name} fill sizes="120px" className="object-cover" />
                                            <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 text-[9.5px] leading-tight bg-[var(--shade)] text-white truncate">
                                                {f.name}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="tdx-callout tdx-callout-line text-xs mt-3">
                                Wrong aspect ratio is the usual problem — anything outside 3:4 is letterboxed in the grid, not cropped.
                            </p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                <button className={buttonClasses()}>Assign poster</button>
                                {item.hidden && (
                                    <button
                                        name="hidden"
                                        value="false"
                                        className={buttonClasses({ variant: "secondary" })}
                                    >
                                        Assign and publish
                                    </button>
                                )}
                            </div>
                        </ActionForm>
                    )}

                    <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-[var(--text-secondary)]">
                            Paste a storage URL instead
                        </summary>
                        <ActionForm action={moderateTitle} className="mt-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="revision" value={item.revision} />
                            <label className="tdx-label">
                                Approved Supabase Storage URL (blank removes the poster)
                                <input
                                    name="cover"
                                    type="url"
                                    defaultValue={item.cover_image_url ?? ""}
                                    className="tdx-field mt-1 min-h-[36px] py-1.5 text-xs"
                                />
                            </label>
                            <button className={buttonClasses({ variant: "secondary", size: "sm" })}>
                                Save poster
                            </button>
                        </ActionForm>
                    </details>
                </div>
            </div>
        </section>
    );
}
