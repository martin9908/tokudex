/** Same shape as the title page — hero, filter row, then episode rows. */
export default function Loading() {
    return (
        <div className="w-full pb-24" aria-busy>
            <div className="flex gap-[26px] px-[18px] md:px-[30px] pt-[30px] pb-[26px]">
                <div className="tdx-skeleton w-[86px] md:w-[124px] aspect-[3/4] rounded-md flex-none" />
                <div className="flex-1 flex flex-col gap-3">
                    <div className="tdx-skeleton h-2.5 w-32" />
                    <div className="tdx-skeleton h-7 w-3/5" />
                    <div className="flex items-center gap-5 mt-3">
                        <div className="tdx-skeleton h-7 w-16" />
                        <div className="tdx-skeleton h-[2px] flex-1 max-w-[260px]" />
                        <div className="tdx-skeleton h-9 w-20 rounded-lg" />
                    </div>
                </div>
                <div className="hidden lg:flex w-[210px] flex-col gap-2 flex-none">
                    <div className="tdx-skeleton h-2.5 w-full" />
                    <div className="tdx-skeleton h-2.5 w-4/5" />
                    <div className="tdx-skeleton h-2.5 w-3/5" />
                </div>
            </div>
            <div className="flex gap-3 px-[18px] md:px-[30px] pb-4">
                {[56, 72, 84].map((w) => (
                    <div key={w} className="tdx-skeleton h-8 rounded-[7px]" style={{ width: w }} />
                ))}
            </div>
            <div className="h-px bg-[var(--line)] mx-[18px] md:mx-[30px]" />
            {Array.from({ length: 8 }, (_, i) => (
                <div
                    key={i}
                    className="grid grid-cols-[62px_1fr_auto] items-center gap-[18px] px-[18px] md:px-[30px] py-[15px]"
                >
                    <div className="tdx-skeleton h-6 w-8" />
                    <div className="tdx-skeleton h-3" style={{ width: `${45 + ((i * 17) % 40)}%` }} />
                    <div className="tdx-skeleton h-3 w-14" />
                </div>
            ))}
        </div>
    );
}
