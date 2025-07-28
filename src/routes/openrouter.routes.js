import express from "express";
import { chatWithOpenRouter } from "../controllers/openrouter.controller.js";

const router = express.Router();

router.post("/chat", chatWithOpenRouter);

export default router;
