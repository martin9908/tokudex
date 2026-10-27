/** Placeholders hold the Watching layout so nothing jumps when data lands. */
export default function Loading() {
    return (
        <div className="w-full pb-24" aria-busy>
            <div className="hidden md:flex items-stretch gap-[52px] px-[30px] py-[20px]">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex flex-col gap-2.5">
                        <div className="tdx-skeleton h-6 w-16" />
                        <div className="tdx-skeleton h-2.5 w-20" />
                    </div>
                ))}
            </div>
            <div className="hidden md:block h-px bg-[var(--line)] mx-[30px]" />
            <div className="grid md:grid-cols-[2fr_1fr]">
                <div className="flex gap-[26px] px-[18px] md:px-[30px] py-[30px] md:border-r md:border-[var(--line)]">
                    <div className="tdx-skeleton hidden md:block w-[188px] aspect-[3/4] rounded-md flex-none" />
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="tdx-skeleton h-2.5 w-48" />
                        <div className="flex gap-4">
                            <div className="tdx-skeleton h-14 w-20" />
                            <div className="flex-1 flex flex-col gap-2.5 pt-1">
                                <div className="tdx-skeleton h-4 w-4/5" />
                                <div className="tdx-skeleton h-3 w-24" />
                            </div>
                        </div>
                        <div className="tdx-skeleton h-[2px] w-full mt-3" />
                        <div className="flex gap-2.5 mt-2">
                            <div className="tdx-skeleton h-10 w-24 rounded-lg" />
                            <div className="tdx-skeleton h-10 w-28 rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="px-[18px] md:px-[26px] py-[30px] flex flex-col gap-5">
                    <div className="tdx-skeleton h-2.5 w-20" />
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="tdx-skeleton h-6 w-8" />
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="tdx-skeleton h-3 w-3/5" />
                                <div className="tdx-skeleton h-[2px] w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
