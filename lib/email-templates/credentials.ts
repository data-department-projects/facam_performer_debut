export function renderCredentialsTemplate(data: {
  email: string;
  password: string;
  name: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Vos identifiants — FACAM PERFORMER</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="background-color:#001b61;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">FACAM PERFORMER</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">FACAM STAIRWAY</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#000d32;font-size:16px;font-weight:600;">Bienvenue sur FACAM PERFORMER</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:22px;">
                Bonjour ${data.name},<br/><br/>
                Votre compte a été créé. Voici vos identifiants de connexion :
              </p>
              <!-- Credentials -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4fa;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;">
                    <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <p style="margin:4px 0 0;color:#001b61;font-size:15px;font-weight:600;">${data.email}</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e5e7eb;padding:8px 0 0;">
                    <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mot de passe temporaire</p>
                    <p style="margin:4px 0 0;color:#001b61;font-size:15px;font-weight:600;font-family:monospace;">${data.password}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:22px;">
                Connectez-vous sur la plateforme et changez votre mot de passe dès votre première connexion.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Si vous n'êtes pas à l'origine de la création de ce compte, contactez votre administrateur.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">Email de sécurité — FACAM STAIRWAY</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
