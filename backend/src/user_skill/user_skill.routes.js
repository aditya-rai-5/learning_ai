import { Router } from "express";
import * as userSkillController from "./user_skill.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all user skill routes
router.use(authMiddleware);

router.post("/", userSkillController.addSkill);
router.get("/", userSkillController.getSkills);
router.delete("/:id", userSkillController.removeSkill);

export default router;
