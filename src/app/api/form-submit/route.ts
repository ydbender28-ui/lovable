import { NextRequest } from "next/server";
import { Resend } from "resend";

// Form submissions from generated sites
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formType, fields, projectId, recipientEmail } = body;

    if (!fields || typeof fields !== 'object') {
      return Response.json({ error: "Invalid form data" }, { status: 400 });
    }

    // If no Resend API key, just return success (graceful degradation)
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.log('Form submission (no email configured):', { formType, fields });
      return Response.json({ success: true, message: "Form submitted successfully" });
    }

    const resend = new Resend(resendKey);

    const fieldLines = Object.entries(fields)
      .map(([k, v]) => `<tr><td style="padding:8px;font-weight:bold;color:#555;">${k}</td><td style="padding:8px;">${v}</td></tr>`)
      .join('');

    const subject = formType === 'booking'
      ? `New Booking Request`
      : formType === 'contact'
      ? `New Contact Form Submission`
      : `New Form Submission`;

    await resend.emails.send({
      from: 'forms@thatcode.dev',
      to: recipientEmail || process.env.DEFAULT_NOTIFICATION_EMAIL || 'ydbender28@gmail.com',
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#6366f1;">${subject}</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            ${fieldLines}
          </table>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Submitted via thatcode.dev${projectId ? ` · Project ${projectId}` : ''}</p>
        </div>
      `,
    });

    return Response.json({ success: true, message: "Form submitted and email sent" });
  } catch (err) {
    console.error('Form submit error:', err);
    return Response.json({ success: true, message: "Form submitted successfully" }); // still succeed for UX
  }
}
