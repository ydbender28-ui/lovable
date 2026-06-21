import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ShareViewer from "./ShareViewer";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link || link.expiresAt < new Date()) notFound();

  return <ShareViewer filesJson={link.filesJson} expiresAt={link.expiresAt.toISOString()} />;
}
