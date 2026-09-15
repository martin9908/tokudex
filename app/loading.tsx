/** Placeholders hold the home layout so nothing jumps when data lands. */
export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24" aria-busy>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_292px] gap-6">
                <div className="flex flex-col gap-6">
                    <div className="tdx-panel p-[18px] flex gap-5">
                        <div className="tdx-skeleton w-[132px] aspect-[3/4] rounded-md flex-none" />
                        <div className="flex-1 flex flex-col gap-3 pt-1">
                            <div className="tdx-skeleton h-3 w-32" />
                            <div className="tdx-skeleton h-6 w-3/5" />
                            <div className="tdx-skeleton h-3 w-2/5" />
                            <div className="tdx-skeleton h-[3px] w-full mt-2" />
                            <div className="tdx-skeleton h-16 w-full mt-2" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="tdx-panel p-[11px] flex flex-col gap-2.5">
                                <div className="tdx-skeleton aspect-[3/4] rounded-[5px]" />
                                <div className="tdx-skeleton h-3 w-4/5" />
                                <div className="tdx-skeleton h-2.5 w-3/5" />
                                <div className="tdx-skeleton h-[3px] w-full" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    {[96, 150, 130].map((h) => (
                        <div key={h} className="tdx-panel p-4" style={{ minHeight: h }}>
                            <div className="tdx-skeleton h-2.5 w-16" />
                            <div className="tdx-skeleton h-5 w-2/5 mt-3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
