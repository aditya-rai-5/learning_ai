import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./auth/auth.routes.js";
import userSkillRoutes from "./user_skill/user_skill.routes.js";
import courseRoutes from "./course/course.routes.js";
import moduleRoutes from "./module/module.routes.js";
import paymentRoutes from "./payment/payment.routes.js";
import enrollmentRoutes from "./enrollment/enrollment.routes.js";
import assessmentRoutes from "./assessment/assessment.routes.js";
import certificateRoutes from "./certificate/certificate.routes.js";
import learningPathRoutes from "./learning_path/learning_path.routes.js";
import reviewRoutes from "./review/review.routes.js";
import bookmarkRoutes from "./bookmark/bookmark.routes.js";
import discussionRoutes from "./discussion/discussion.routes.js";
import notificationRoutes from "./notification/notification.routes.js";
import studySessionRoutes from "./study_session/study_session.routes.js";
import aiRoutes from "./ai/ai.routes.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user-skills", userSkillRoutes);
app.use("/api/courses/:courseId/modules", moduleRoutes);
app.use("/api/courses/:courseId/reviews", reviewRoutes);
app.use("/api/courses/:courseId", aiRoutes);   // AI: /chat, /ingest, /ai-config, /document-sources
app.use("/api/courses", courseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/study-sessions", studySessionRoutes);
app.use("/api", assessmentRoutes); // Mount at /api so sub-routes like /assessments and /courses work correctly
app.use("/api", certificateRoutes); // Mount at /api to support /courses/:courseId/certificates and /certificates/:id
app.use("/api", learningPathRoutes); // Mount at /api to support /learning-paths
app.use("/api", discussionRoutes); // Mount at /api to support /threads and /replies

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;