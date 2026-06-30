export async function captureScreenshot(url: string): Promise<string | null> {
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&type=jpeg&waitUntil=networkidle2`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    // microlink returns the screenshot URL directly when embed=screenshot.url
    if (typeof data === 'string' && data.startsWith('http')) return data;
    return data?.data?.screenshot?.url ?? null;
  } catch {
    return null;
  }
}
