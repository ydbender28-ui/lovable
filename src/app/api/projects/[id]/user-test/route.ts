import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type UserTestResult = {
  overallScore: number; // 0-100
  testers: Array<{
    persona: string;
    goal: string;
    steps: string[];
    issues: string[];
    verdict: "passed" | "confused" | "blocked";
  }>;
  criticalIssues: string[];
  quickWins: string[];
};

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!project?.versions[0]) return NextResponse.json({ error: "No code to test" }, { status: 400 });

  const files: Record<string, string> = JSON.parse(project.versions[0].files);
  const code = Object.entries(files).map(([p, c]) => `// ${p}\n${c}`).join("\n\n").slice(0, 50000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res;
  try {
    res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
    system: `You are a UX research AI that simulates real users interacting with web apps. Analyze the provided React app code and simulate 4 different user personas testing it. Think like a real person clicking through the UI — identify confusing labels, broken flows, missing feedback, accessibility issues, and steps that would make a real user give up.

Return ONLY valid JSON in this exact shape:
{
  "overallScore": 78,
  "testers": [
    {
      "persona": "Non-technical small business owner, 45",
      "goal": "Sign up and complete first task",
      "steps": ["Lands on homepage", "Clicks sign up", "Fills form", "Gets confused by..."],
      "issues": ["Button label unclear", "No success message after submit"],
      "verdict": "confused"
    }
  ],
  "criticalIssues": ["No error handling on the login form — wrong password shows nothing", "Mobile: nav overflows off screen"],
  "quickWins": ["Add placeholder text to all inputs", "Show a success toast after form submit"]
}

verdict is: "passed" (completed goal), "confused" (got lost but kept trying), "blocked" (hit a dead end and would leave).
Personas should be diverse: power user, first-timer, mobile user on slow connection, non-English speaker.`,
      messages: [{ role: "user", content: `Test this app:\n\n${code}` }],
    });
  } catch (e) {
    clearTimeout(timeout);
    const isTimeout = e instanceof Error && e.name === "AbortError";
    return NextResponse.json({ error: isTimeout ? "Test timed out — try again" : "Test failed" }, { status: 500 });
  }
  clearTimeout(timeout);

  try {
    const text = (res.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return NextResponse.json(JSON.parse(match[0]) as UserTestResult);
  } catch {
    return NextResponse.json({ error: "Test failed — could not parse results" }, { status: 500 });
  }
}
