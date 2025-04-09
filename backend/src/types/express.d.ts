declare namespace Express {
  interface Request {
    currentProjectId?: string;
    validatedProjectId?: number;
  }
}
