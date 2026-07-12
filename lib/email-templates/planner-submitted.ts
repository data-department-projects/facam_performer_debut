export function renderPlannerSubmittedTemplate(data: {
  name: string;
  collaboratorName: string;
  weekStartDate: string;
  weekEndDate: string;
  taskCount: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Planning à valider — FACAM PERFORMER</title></head>
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
              <p style="margin:0 0 16px;color:#000d32;font-size:16px;font-weight:600;">Un planning attend votre validation</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:22px;">
                Bonjour ${data.name},<br/><br/>
                ${data.collaboratorName} vient de soumettre son planning de la semaine du ${data.weekStartDate} au ${data.weekEndDate} pour validation.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4fa;border-radius:8px;padding:20px;">
                <tr>
                  <td>
                    <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Tâches planifiées</p>
                    <p style="margin:4px 0 0;color:#001b61;font-size:15px;font-weight:600;">${data.taskCount}</p>
                  </td>
                </tr>
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
