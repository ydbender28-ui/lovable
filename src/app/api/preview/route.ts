import { buildPublishHtml, fetchReactScripts } from "@/lib/buildHtml";

export async function POST(req: Request) {
  const { files, projectName } = await req.json();
  const reactScripts = await fetchReactScripts();
  const html = buildPublishHtml(files, projectName, reactScripts);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
