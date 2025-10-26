interface ProjectMemberInvitationPayload {
  projectName: string;
  inviterEmail: string;
}

export const getProjectMemberInvitationTemplate = (
  payload: ProjectMemberInvitationPayload
) => `
  <div style="font-family: Arial, sans-serif; color: #1f2933; padding: 24px;">
    <h2 style="margin-bottom: 16px;">You've been invited to join ${payload.projectName}</h2>
    <p style="margin-bottom: 16px;">
      ${payload.inviterEmail} has added you as a member of the <strong>${payload.projectName}</strong> project.
    </p>
    <p style="margin-bottom: 16px;">
      Sign in to your referral tool account to collaborate with the rest of the team.
    </p>
    <p style="margin-bottom: 0; color: #52606d; font-size: 14px;">
      If you believe this invitation was sent in error, you can safely ignore this message.
    </p>
  </div>
`;
