import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicAgentChat from "./PublicAgentChat";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent) return { title: "Agent not found" };
  return { title: `${agent.avatar} ${agent.name}`, description: agent.description ?? undefined };
}

export default async function PublicAgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent || !agent.public) notFound();
  return <PublicAgentChat agent={{ id: agent.id, name: agent.name, description: agent.description, avatar: agent.avatar }} />;
}
