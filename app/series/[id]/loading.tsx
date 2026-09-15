/** Same shape as the title page — hero, then episode rows. */
export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 flex flex-col gap-5" aria-busy>
            <div className="tdx-panel p-4 sm:p-6 flex flex-col sm:flex-row gap-5">
                <div className="tdx-skeleton w-[140px] aspect-[3/4] rounded-md flex-none" />
                <div className="flex-1 flex flex-col gap-3">
                    <div className="tdx-skeleton h-3 w-40" />
                    <div className="tdx-skeleton h-8 w-3/5" />
                    <div className="tdx-skeleton h-3 w-4/5" />
                    <div className="tdx-skeleton h-3 w-3/5" />
                    <div className="flex gap-2.5 mt-2">
                        <div className="tdx-skeleton h-9 w-32 rounded-lg" />
                        <div className="tdx-skeleton h-9 w-32 rounded-lg" />
                    </div>
                </div>
                <div className="tdx-skeleton w-[108px] h-[108px] rounded-full flex-none hidden sm:block" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
                <div className="tdx-panel p-4 sm:p-5">
                    <div className="tdx-skeleton h-5 w-28 mb-4" />
                    {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="grid grid-cols-[52px_1fr_auto] items-center gap-3.5 px-3 py-[11px]">
                            <div className="tdx-skeleton h-3 w-5" />
                            <div className="tdx-skeleton h-3" style={{ width: `${45 + ((i * 17) % 40)}%` }} />
                            <div className="tdx-skeleton h-3 w-14" />
                        </div>
                    ))}
                </div>
                <div className="tdx-panel p-3.5">
                    <div className="tdx-skeleton h-2.5 w-20" />
                    <div className="tdx-skeleton h-4 w-3/5 mt-3" />
                </div>
            </div>
        </div>
    );
}
