"use client";

export default function AddSeriesButton() {
    function handleClick() {
        // TODO: open add-series modal or navigate to an add-series form
        alert("Add series — coming soon");
    }

    return (
        <button
            onClick={handleClick}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
            + Add Series
        </button>
    );
}
