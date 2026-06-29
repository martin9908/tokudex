export default function Loading() {
    return (
        <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10 w-full space-y-4 animate-pulse">
            <div className="rounded-3xl border border-cyan-900/50 bg-[#05101d] min-h-[330px]" />
            <div className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 md:p-5">
                <div className="h-7 w-40 rounded bg-cyan-900/40 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="h-16 rounded-xl border border-cyan-900/45 bg-[#081a2b]/70" />
                    ))}
                </div>
            </div>
        </div>
    );
}
