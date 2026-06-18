export function renderMeetingReminderTemplate(data: {
  name: string;
  committeeName: string;
  meetingDate: string;
  meetingTime: string;
  meetingLink?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Rappel de réunion — FACAM PERFORMER</title></head>
<body style="margin:0;padding:0;background-color:#f0f4fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="background-color:#001b61;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">FACAM PERFORMER</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#000d32;font-size:16px;font-weight:600;">Rappel de réunion dans 24h</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:22px;">
                Bonjour ${data.name},<br/><br/>
                Vous avez une réunion prévue demain.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4fa;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Comité</p>
                    <p style="margin:4px 0 0;color:#001b61;font-size:15px;font-weight:600;">${data.committeeName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Date &amp; Heure</p>
                    <p style="margin:4px 0 0;color:#000d32;font-size:14px;">${data.meetingDate} à ${data.meetingTime}</p>
                  </td>
                </tr>
                ${
                  data.meetingLink
                    ? `<tr>
                  <td style="padding-top:12px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Lien de connexion</p>
                    <a href="${data.meetingLink}" style="color:#001b61;font-size:14px;">${data.meetingLink}</a>
                  </td>
                </tr>`
                    : ""
                }
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">FACAM PERFORMER — FACAM STAIRWAY</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
