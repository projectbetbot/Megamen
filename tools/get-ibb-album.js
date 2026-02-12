// tools/get-ibb-album.js
// Usage: node tools/get-ibb-album.js "https://ibb.co/album/Jw0Rgd" > gallery.json

const albumUrl = process.argv[2];
if (!albumUrl) {
  console.error('Provide an album url: node tools/get-ibb-album.js "https://ibb.co/album/Jw0Rgd"');
  process.exit(1);
}

async function main() {
  const res = await fetch(albumUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch album page: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  // Find i.ibb.co direct image links inside the HTML
  // Imgbb often includes them as thumbnails or direct links in page source.
  const matches = [...html.matchAll(/https?:\/\/i\.ibb\.co\/[^\s"'<>]+/g)].map(m => m[0]);

  // De-dupe while preserving order
  const seen = new Set();
  const urls = [];
  for (const u of matches) {
    // Strip common trailing junk
    const clean = u.replace(/\\u0026/g, "&").replace(/&quot;|\\u0022/g, '"').replace(/["')\\]+$/g, "");
    if (!seen.has(clean)) {
      seen.add(clean);
      urls.push(clean);
    }
  }

  if (!urls.length) {
    console.error("No i.ibb.co links found on the album page HTML.");
    console.error("If this happens, use Option B (manual) or an Imgbb API key approach.");
    process.exit(2);
  }

  // Output as JSON array
  process.stdout.write(JSON.stringify(urls, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
