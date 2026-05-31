import { Router } from "express";
import * as courseController from "./course.controller.js";
import { authenticateUser } from "../../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.get("/", courseController.getCourses);
router.get("/:identifier", courseController.getCourse);

// Protected routes (requires login)
router.use(authenticateUser);
router.post("/", courseController.createCourse);
router.put("/:id", courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);

export default router;
