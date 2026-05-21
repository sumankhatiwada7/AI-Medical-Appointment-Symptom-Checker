import express from "express";
import { authorize, authMiddleware } from "../auth/auth.middleware";
import { getDoctorProfile, registerDoctor, recommendDoctors } from "./doctor.controller";

const router = express.Router();

router.post("/register", registerDoctor);
router.get("/:id", authMiddleware, authorize("DOCTOR"), getDoctorProfile);
router.post("/recommend/:sessionId", authMiddleware, authorize("DOCTOR"), recommendDoctors);

export default router;