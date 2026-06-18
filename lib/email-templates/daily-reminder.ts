export function renderDailyReminderTemplate(data: { name: string }): string {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Rappel quotidien — FACAM PERFORMER</title></head>
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
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:capitalize;">${today}</p>
              <p style="margin:0 0 16px;color:#000d32;font-size:16px;font-weight:600;">Rappel de mise à jour quotidienne</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:22px;">
                Bonjour ${data.name},<br/><br/>
                N'oubliez pas de mettre à jour l'avancement de vos tâches du jour dans votre Week Planner.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Si vos tâches sont déjà à jour, ignorez ce message.
              </p>
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
