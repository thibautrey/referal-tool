declare namespace Express {
  interface Request {
    currentProjectId?: string;
    validatedProjectId?: number;
    projectAccess?: {
      role: "OWNER" | "MEMBER" | "ADMIN";
      isOwner: boolean;
      isAdmin: boolean;
      membershipId?: number;
    };
  }
}
