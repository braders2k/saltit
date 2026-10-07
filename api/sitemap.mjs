// /sitemap.xml is rewritten here. A static .xml file was sent as
// application/xml with Content-Disposition, and some fetchers reported
// HTTP 500 for that response. This reply is text/xml with a charset and
// no download disposition.
export const config = { runtime: "edge" };

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://saltit.co.uk/</loc>
  </url>
  <url>
    <loc>https://saltit.co.uk/wifi-help/</loc>
  </url>
  <url>
    <loc>https://saltit.co.uk/virus-scam-cleanup/</loc>
  </url>
  <url>
    <loc>https://saltit.co.uk/laptop-pc-repair/</loc>
  </url>
  <url>
    <loc>https://saltit.co.uk/printer-setup/</loc>
  </url>
  <url>
    <loc>https://saltit.co.uk/help-for-parents/</loc>
  </url>
</urlset>
`;

export default function handler() {
  return new Response(XML, {
    status: 200,
    headers: {
      "content-type": "text/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
