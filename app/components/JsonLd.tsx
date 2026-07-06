/**
 * Renders a JSON-LD structured-data <script>. Server component — pass a plain
 * schema.org object. Reused for TVSeries, BreadcrumbList, WebSite, Organization.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
