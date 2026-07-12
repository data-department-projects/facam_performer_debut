import { Resend } from "resend";
import { renderOtpResetTemplate } from "@/lib/email-templates/otp-reset";
import { renderCredentialsTemplate } from "@/lib/email-templates/credentials";
import { renderWeeklyReminderTemplate } from "@/lib/email-templates/weekly-reminder";
import { renderMeetingReminderTemplate } from "@/lib/email-templates/meeting-reminder";
import { renderOverdueTaskReminderTemplate } from "@/lib/email-templates/overdue-task-reminder";
import { renderPlannerSubmittedTemplate } from "@/lib/email-templates/planner-submitted";

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = "FACAM PERFORMER <notifications@facamstairwaytogo.com>";

export type EmailTemplate =
  | "otp-reset"
  | "credentials"
  | "weekly-reminder"
  | "meeting-reminder"
  | "overdue-task-reminder"
  | "planner-submitted"
  | "bug-report";

function subjectFor(template: EmailTemplate): string {
  switch (template) {
    case "otp-reset":
      return "Réinitialisation de votre mot de passe — FACAM PERFORMER";
    case "credentials":
      return "Vos identifiants de connexion — FACAM PERFORMER";
    case "weekly-reminder":
      return "Planifiez votre semaine prochaine — FACAM PERFORMER";
    case "meeting-reminder":
      return "Rappel de réunion demain — FACAM PERFORMER";
    case "overdue-task-reminder":
      return "Échéance dépassée — FACAM PERFORMER";
    case "planner-submitted":
      return "Planning à valider — FACAM PERFORMER";
    case "bug-report":
      return "Nouveau bug signalé — FACAM PERFORMER";
  }
}

function renderTemplate(
  template: EmailTemplate,
  data: Record<string, string>,
): string {
  switch (template) {
    case "otp-reset":
      return renderOtpResetTemplate({
        name: data.name ?? "",
        code: data.code ?? "",
        expiresIn: data.expiresIn ?? "10",
      });
    case "credentials":
      return renderCredentialsTemplate({
        email: data.email ?? "",
        password: data.password ?? "",
        name: data.name ?? "",
        loginUrl: data.loginUrl ?? `${process.env.NEXTAUTH_URL ?? ""}/login`,
      });
    case "weekly-reminder":
      return renderWeeklyReminderTemplate({ name: data.name ?? "" });
    case "meeting-reminder":
      return renderMeetingReminderTemplate({
        name: data.name ?? "",
        committeeName: data.committeeName ?? "",
        meetingDate: data.meetingDate ?? "",
        meetingTime: data.meetingTime ?? "",
        meetingLink: data.meetingLink,
      });
    case "overdue-task-reminder":
      return renderOverdueTaskReminderTemplate({
        name: data.name ?? "",
        itemTitle: data.itemTitle ?? "",
        itemType: data.itemType ?? "",
        context: data.context ?? "",
        overdueDays: data.overdueDays ?? "0",
        link: data.link ?? (process.env.NEXTAUTH_URL ?? ""),
      });
    case "planner-submitted":
      return renderPlannerSubmittedTemplate({
        name: data.name ?? "",
        collaboratorName: data.collaboratorName ?? "",
        weekStartDate: data.weekStartDate ?? "",
        weekEndDate: data.weekEndDate ?? "",
        taskCount: data.taskCount ?? "0",
      });
    case "bug-report":
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1a1a1a;padding:24px">
        <h2 style="color:#003f7f">Nouveau bug signalé</h2>
        <p><strong>${data.fullName ?? "Inconnu"}</strong> — ${data.role ?? ""} — a signalé un problème :</p>
        <blockquote style="border-left:4px solid #003f7f;padding:8px 16px;margin:16px 0;background:#f5f5f5">
          ${data.description ?? ""}
        </blockquote>
        <p style="color:#666;font-size:13px">Soumis le ${data.submittedAt ?? ""}</p>
      </body></html>`;
  }
}

export async function sendEmail(params: {
  to: string;
  template: EmailTemplate;
  data: Record<string, string>;
}): Promise<boolean> {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn("[lib/email] RESEND_API_KEY non configuré — email non envoyé");
      return false;
    }
    const result = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: subjectFor(params.template),
      html: renderTemplate(params.template, params.data),
    });
    if (result.error) {
      console.error("[lib/email]", result.error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[lib/email]", error);
    return false;
  }
}
