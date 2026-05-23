import  Express  from "express";
import { login, register, refresh } from "./auth.controller";
const router = Express.Router();


router.post("/register",register);
router.post("/login",login);
router.post("/refresh",refresh);

export default router;