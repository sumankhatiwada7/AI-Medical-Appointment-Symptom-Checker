import express from "express";
import multer from "multer";
import { authorize, authMiddleware } from "../auth/auth.middleware";
import { getDoctorProfile, registerDoctor, recommendDoctors } from "./doctor.controller";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/register",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "validationDocument", maxCount: 1 },
  ]),
  registerDoctor
);
router.get("/:id", authMiddleware, authorize("DOCTOR"), getDoctorProfile);
router.post("/recommend/:sessionId", authMiddleware, authorize("DOCTOR"), recommendDoctors);

export default router;