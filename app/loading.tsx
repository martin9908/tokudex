export default function Loading() {
    return (
        <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_290px] gap-4 animate-pulse">
                <div className="hidden lg:block tdx-panel min-h-[760px]" />
                <div className="space-y-4">
                    <div className="tdx-panel h-44" />
                    <div className="tdx-panel h-32" />
                    <div className="tdx-panel h-48" />
                </div>
                <div className="space-y-4">
                    <div className="tdx-panel h-56" />
                    <div className="tdx-panel h-40" />
                </div>
            </div>
        </div>
    );
}
