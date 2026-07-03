import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticateUser } from "../../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

const router = Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/me", authenticateUser, authController.getMe);

export default router;
