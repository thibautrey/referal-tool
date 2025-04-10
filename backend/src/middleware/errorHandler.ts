import { NextFunction, Request, Response } from "express";

export class PasswordValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "PasswordValidationError";
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  if (err instanceof PasswordValidationError) {
    return res.status(err.statusCode).json({
      message: err.message,
      error: "PASSWORD_VALIDATION_ERROR",
    });
  }

  // Handle other types of errors
  return res.status(500).json({
    message: "Internal server error",
    error: err.message,
  });
};
