export function renderOverdueTaskReminderTemplate(data: {
  name: string;
  itemTitle: string;
  itemType: string;
  context: string;
  overdueDays: string;
  link: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Échéance dépassée — FACAM PERFORMER</title></head>
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
              <p style="margin:0 0 16px;color:#b91c1c;font-size:16px;font-weight:600;">Échéance dépassée — ${data.itemType}</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:22px;">
                Bonjour ${data.name},<br/><br/>
                ${data.itemType === "réunion" ? "L'échéance suivante" : "La tâche suivante"} n'a pas encore été marquée comme terminée et son échéance est dépassée depuis ${data.overdueDays} jour${data.overdueDays === "1" ? "" : "s"}. Merci de la finaliser ou de mettre à jour son statut.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">${data.itemType}</p>
                    <p style="margin:4px 0 0;color:#001b61;font-size:15px;font-weight:600;">${data.itemTitle}</p>
                    <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">${data.context}</p>
                  </td>
                </tr>
              </table>
              <a href="${data.link}" style="display:inline-block;background-color:#001b61;color:#ffffff;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Voir dans FACAM PERFORMER</a>
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
