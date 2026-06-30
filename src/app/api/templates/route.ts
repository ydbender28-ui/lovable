import { STARTER_TEMPLATES } from '@/lib/templates';

export async function GET() {
  return Response.json({ templates: STARTER_TEMPLATES });
}
