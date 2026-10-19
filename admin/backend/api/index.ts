import type { Request, Response } from "express";
import { app } from "../src/app.js";

export default function handler(request: Request, response: Response): void {
  app(request, response);
}
