import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AgentWorkspace from "./AgentWorkspace";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const agent = await prisma.agent.findFirst({ where: { id, ownerId: session.user.id } });
  if (!agent) notFound();

  return <AgentWorkspace agent={agent} />;
}
