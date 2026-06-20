import { prisma } from "@/lib/prisma";

function passwordGate(slug: string, projectName: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${projectName}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px;width:360px;text-align:center}
h2{color:#fff;font-size:20px;margin-bottom:8px}p{color:#71717a;font-size:14px;margin-bottom:24px}
input{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px 16px;color:#fff;font-size:14px;outline:none;margin-bottom:12px}
input:focus{border-color:#8b5cf6}button{width:100%;background:linear-gradient(135deg,#8b5cf6,#6366f1);border:none;border-radius:10px;padding:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
.err{color:#f87171;font-size:12px;margin-top:8px;display:none}</style></head>
<body><div class="card"><div style="font-size:36px;margin-bottom:16px">🔒</div>
<h2>${projectName}</h2><p>This app is password protected</p>
<input type="password" id="pw" placeholder="Enter password" onkeydown="if(event.key==='Enter')check()"/>
<button onclick="check()">Unlock →</button>
<p class="err" id="err">Incorrect password</p></div>
<script>
function check(){
  const pw=document.getElementById('pw').value;
  fetch('/p/${slug}?pw='+encodeURIComponent(pw)).then(r=>{
    if(r.ok&&r.headers.get('x-pw-ok')==='1'){sessionStorage.setItem('pw_${slug}',pw);location.reload()}
    else{document.getElementById('err').style.display='block'}
  })
}
const saved=sessionStorage.getItem('pw_${slug}');
if(saved)fetch('/p/${slug}?pw='+encodeURIComponent(saved)).then(r=>{if(r.ok&&r.headers.get('x-pw-ok')==='1')document.getElementById('pw').value=saved});
</script></body></html>`;
}

export async function GET(req: Request, ctx: RouteContext<"/p/[slug]">) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const pwAttempt = url.searchParams.get("pw");

  const project = await prisma.project.findUnique({ where: { publishSlug: slug } });

  if (!project?.publishedHtml) {
    return new Response("<h1>Not found</h1>", { status: 404, headers: { "Content-Type": "text/html" } });
  }

  // Password check
  if (project.publishPassword) {
    const correct = project.publishPassword === pwAttempt;
    if (pwAttempt !== null) {
      // Checking password via fetch
      return correct
        ? new Response("ok", { headers: { "x-pw-ok": "1", "Content-Type": "text/plain" } })
        : new Response("bad", { status: 401, headers: { "Content-Type": "text/plain" } });
    }
    // No pw provided — show gate
    return new Response(passwordGate(slug, project.name), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Track unique visits — skip if visitor cookie already set
  const cookieName = `v_${project.id}`;
  const cookies = req.headers.get("cookie") ?? "";
  const alreadyVisited = cookies.split(";").some(c => c.trim().startsWith(`${cookieName}=`));
  if (!alreadyVisited) {
    prisma.project.update({ where: { id: project.id }, data: { visitCount: { increment: 1 } } }).catch(() => {});
  }

  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
  if (!alreadyVisited) {
    // 30-day cookie
    headers.set("Set-Cookie", `${cookieName}=1; Path=/; Max-Age=2592000; SameSite=Lax`);
  }
  return new Response(project.publishedHtml, { headers });
}
