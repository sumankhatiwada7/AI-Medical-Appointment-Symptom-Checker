import  Express  from "express";
import { Symptomanalyze, getRecommendedDoctorsForSession } from "./symptom.controller.js";
import { authMiddleware } from "../auth/auth.middleware";

const router = Express.Router();


router.post("/analyze", authMiddleware, Symptomanalyze);
router.get("/sessions/:sessionId/doctors", authMiddleware, getRecommendedDoctorsForSession);

export default router;
