import { Router } from "express";
import { SessionController } from "../controllers/session.controller";

export const sessionRouter = Router();

sessionRouter.post("/create", SessionController.createSession);
sessionRouter.post("/join", SessionController.joinSession);
sessionRouter.get("/:id", SessionController.getSession);
