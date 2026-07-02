import { Resend } from 'resend';

/*
 * All notification emails. Every function is fire-and-forget safe: if
 * RESEND_API_KEY is missing or a send fails, we log and move on — email must
 * never break an API request.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.rundog.boston';
const FROM = process.env.EMAIL_FROM ?? 'Go Dogs Boston <onboarding@resend.dev>';

let _resend: Resend | null = null;

function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/* Branded shell — palette colors inlined for email clients */
function layout(heading: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  return `
  <div style="background:#f6eedd;padding:32px 16px;font-family:'Public Sans',-apple-system,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#fbf6ea;border:1px solid rgba(54,43,31,0.12);border-radius:14px;overflow:hidden;">
      <div style="background:#2f4f38;padding:18px 24px;">
        <span style="color:#f6eedd;font-size:19px;font-weight:800;letter-spacing:0.02em;">Go Dogs Boston</span>
        <span style="color:#c9d15f;font-size:16px;"> &#127934;</span>
      </div>
      <div style="padding:26px 24px;color:#362b1f;">
        <h1 style="margin:0 0 12px;font-size:21px;line-height:1.25;color:#362b1f;">${heading}</h1>
        <div style="font-size:15px;line-height:1.55;color:rgba(54,43,31,0.8);">${bodyHtml}</div>
        ${
          cta
            ? `<a href="${cta.url}" style="display:inline-block;margin-top:20px;background:#2f4f38;color:#f6eedd;font-weight:700;font-size:14px;padding:11px 22px;border-radius:8px;text-decoration:none;">${cta.label}</a>`
            : ''
        }
      </div>
      <div style="padding:14px 24px;border-top:1px solid rgba(54,43,31,0.1);">
        <p style="margin:0;font-size:11px;letter-spacing:0.08em;color:rgba(54,43,31,0.45);">MADE IN BOSTON &middot; FREE TO JOIN &middot; TAILS WILL BE WAGGED</p>
      </div>
    </div>
  </div>`;
}

interface SendArgs {
  to: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  ics?: string;
}

async function send({ to, subject, heading, bodyHtml, cta, ics }: SendArgs): Promise<void> {
  const resend = client();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return;
  }
  if (!to.includes('@')) return;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: layout(heading, bodyHtml, cta),
      attachments: ics
        ? [{ filename: 'go-dogs-boston-run.ics', content: Buffer.from(ics).toString('base64'), contentType: 'text/calendar' }]
        : undefined,
    });
    if (error) console.error(`[email] send failed: ${error.message}`);
  } catch (err) {
    console.error('[email] send threw:', err);
  }
}

const threadUrl = (conversationId: string) => `${APP_URL}/messages/${conversationId}`;

export async function notifyNewMatch(args: {
  to: string;
  recipientName: string;
  senderName: string;
  message: string;
  conversationId: string;
}): Promise<void> {
  await send({
    to: args.to,
    subject: `${args.senderName} wants to run with you`,
    heading: 'You have a new match 🐾',
    bodyHtml: `<p>Hi ${args.recipientName},</p>
      <p><strong>${args.senderName}</strong> just reached out on Go Dogs Boston:</p>
      <p style="background:#f6eedd;border-left:3px solid #bd6b44;padding:10px 14px;border-radius:6px;">&ldquo;${args.message}&rdquo;</p>`,
    cta: { label: 'Reply now', url: threadUrl(args.conversationId) },
  });
}

export async function notifyNewMessage(args: {
  to: string;
  recipientName: string;
  senderName: string;
  preview: string;
  conversationId: string;
}): Promise<void> {
  await send({
    to: args.to,
    subject: `New message from ${args.senderName}`,
    heading: 'New message 💬',
    bodyHtml: `<p>Hi ${args.recipientName},</p>
      <p><strong>${args.senderName}</strong> sent you a message:</p>
      <p style="background:#f6eedd;border-left:3px solid #2f4f38;padding:10px 14px;border-radius:6px;">&ldquo;${args.preview}&rdquo;</p>`,
    cta: { label: 'Open the conversation', url: threadUrl(args.conversationId) },
  });
}

export async function notifyRunProposed(args: {
  to: string;
  recipientName: string;
  proposerName: string;
  runLabel: string;
  location: string;
  conversationId: string;
}): Promise<void> {
  await send({
    to: args.to,
    subject: `${args.proposerName} proposed a run — ${args.runLabel}`,
    heading: 'Run proposed 📅',
    bodyHtml: `<p>Hi ${args.recipientName},</p>
      <p><strong>${args.proposerName}</strong> wants to book a run:</p>
      <p style="background:#f6eedd;border-radius:6px;padding:12px 14px;">
        <strong>${args.runLabel}</strong><br/>${args.location}
      </p>
      <p>Accept in the app and we&rsquo;ll send you both a calendar invite.</p>`,
    cta: { label: 'Accept or decline', url: threadUrl(args.conversationId) },
  });
}

export async function notifyRunConfirmed(args: {
  to: string;
  recipientName: string;
  otherName: string;
  runLabel: string;
  location: string;
  conversationId: string;
  ics: string;
}): Promise<void> {
  await send({
    to: args.to,
    subject: `Run booked — ${args.runLabel} with ${args.otherName}`,
    heading: 'Your run is booked ✅',
    bodyHtml: `<p>Hi ${args.recipientName},</p>
      <p>You and <strong>${args.otherName}</strong> are on:</p>
      <p style="background:#f6eedd;border-radius:6px;padding:12px 14px;">
        <strong>${args.runLabel}</strong><br/>${args.location}
      </p>
      <p>A calendar invite is attached — add it to your calendar and don&rsquo;t be late. Someone with four legs is counting on you.</p>`,
    cta: { label: 'View the run', url: threadUrl(args.conversationId) },
    ics: args.ics,
  });
}

export async function notifyRunDeclined(args: {
  to: string;
  recipientName: string;
  otherName: string;
  runLabel: string;
  conversationId: string;
}): Promise<void> {
  await send({
    to: args.to,
    subject: `${args.otherName} can't make ${args.runLabel}`,
    heading: 'That time doesn&rsquo;t work 😕',
    bodyHtml: `<p>Hi ${args.recipientName},</p>
      <p><strong>${args.otherName}</strong> can&rsquo;t make <strong>${args.runLabel}</strong>. Propose another time — the dog remains extremely available.</p>`,
    cta: { label: 'Propose a new time', url: threadUrl(args.conversationId) },
  });
}
