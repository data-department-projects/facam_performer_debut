export function renderWeeklyReminderTemplate(data: { name: string }): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Planification semaine — FACAM PERFORMER</title></head>
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
              <p style="margin:0 0 16px;color:#000d32;font-size:16px;font-weight:600;">Planifiez votre semaine prochaine</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:22px;">
                Bonjour ${data.name},<br/><br/>
                C'est vendredi ! Pensez à planifier vos tâches pour la semaine prochaine dans votre Week Planner et à les soumettre à la validation de votre Manager.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                La planification de la semaine prochaine doit être soumise avant la fin de la journée.
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
