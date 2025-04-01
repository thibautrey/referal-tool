import { Request, Response, NextFunction } from "express";

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: any;
}

export type ControllerFunction = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;
