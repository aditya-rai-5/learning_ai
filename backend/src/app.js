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

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user-skills", userSkillRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courses/:courseId/modules", moduleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api", assessmentRoutes); // Mount at /api so sub-routes like /assessments and /courses work correctly
app.use("/api", certificateRoutes); // Mount at /api to support /courses/:courseId/certificates and /certificates/:id

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;
