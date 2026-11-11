export type CompIncidentNotice = {
  incidentId: number;
  codeId: number;
  codeHint: string;
  attemptingUserId: number;
  createdAt: string;
};

type EmailTransport = (address: string, notice: CompIncidentNotice) => Promise<void>;

/** No mail provider is connected. A deployment can replace this without hardcoding an address. */
let emailTransport: EmailTransport = async () => {};

export function setCompIncidentEmailTransport(transport: EmailTransport | null): void {
  emailTransport = transport ?? (async () => {});
}

/**
 * Outbound alert for a blocked comp-code attempt.
 * No-op when COMP_INCIDENT_WEBHOOK_URL and COMP_INCIDENT_NOTIFY_EMAIL are unset.
 * The email hook does not send mail.
 */
export async function notifyCompIncident(notice: CompIncidentNotice): Promise<void> {
  const webhook = process.env.COMP_INCIDENT_WEBHOOK_URL?.trim();
  const email = process.env.COMP_INCIDENT_NOTIFY_EMAIL?.trim();
  if (!webhook && !email) return;

  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "comp_code_incident", ...notice }),
      });
    } catch {
      // The incident row is already stored. A failed webhook must not change the redemption result.
    }
  }

  if (email) {
    await emailTransport(email, notice);
  }
}
