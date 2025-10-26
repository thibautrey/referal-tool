import { Translator } from "../lib/i18n";

interface ProjectMemberInvitationPayload {
  projectName: string;
  inviterEmail: string;
}

export const getProjectMemberInvitationTemplate = (
  payload: ProjectMemberInvitationPayload,
  translator: Translator
) => `
  <div style="font-family: Arial, sans-serif; color: #1f2933; padding: 24px;">
    <h2 style="margin-bottom: 16px;">${translator.t("email.invite.heading", {
      projectName: payload.projectName,
    })}</h2>
    <p style="margin-bottom: 16px;">
      ${translator.t("email.invite.body", {
        inviterEmail: payload.inviterEmail,
        projectName: payload.projectName,
      })}
    </p>
    <p style="margin-bottom: 16px;">
      ${translator.t("email.invite.secondary")}
    </p>
    <p style="margin-bottom: 0; color: #52606d; font-size: 14px;">
      ${translator.t("email.invite.footer")}
    </p>
    <div style="margin-top: 24px;">
      <a
        href="https://rflnk.com"
        style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #0b69a3;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
        "
      >
        ${translator.t("email.invite.cta")}
      </a>
    </div>
  </div>
`;
