import express from "express";

import { authMiddleware,authorize } from "../auth/auth.middleware";
import { getpendingdoctors,approvedoctor,rejectdoctor } from "./admin.controller";


const router= express.Router();


router.get("/pendingdoctors",authMiddleware,authorize("ADMIN"),getpendingdoctors);
router.post("/approvedoctor/:id",authMiddleware,authorize("ADMIN"),approvedoctor);
router.post("/rejectdoctor/:id",authMiddleware,authorize("ADMIN"),rejectdoctor);

export default router;