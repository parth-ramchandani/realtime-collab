import { Router } from "express";
import { AiController } from "../controllers/ai.controller";

export const aiRouter = Router();

aiRouter.post("/:id/summarize", AiController.summarizeSession);
aiRouter.post("/:id/suggest", AiController.suggestNextSentence);
