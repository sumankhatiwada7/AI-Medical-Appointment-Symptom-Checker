import  Express  from "express";
import { Symptomanalyze } from "./symptom.controller.js";
import { authMiddleware } from "../auth/auth.middleware";

const router = Express.Router();


router.post("/analyze", authMiddleware, Symptomanalyze);

export default router;