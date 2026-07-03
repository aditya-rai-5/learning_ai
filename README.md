# LearnAI - Advanced AI-Powered LMS

LearnAI is a next-generation Learning Management System (LMS) built to provide highly interactive and personalized education. It features comprehensive role management, secure video streaming, automated revenue splitting, and a deeply integrated Retrieval-Augmented Generation (RAG) AI Tutor.

## 🌟 Key Features

### 🎓 For Students
- **Course & Learning Path Discovery**: Browse and enroll in individual courses or structured learning paths.
- **Distraction-Free Video Player**: Secure, signed-URL video streaming to prevent unauthorized downloads.
- **AI Tutor (RAG Integration)**: Ask questions directly inside a course module. The AI uses semantic and temporal search (via `pgvector`) to find exact moments in the video or text to answer your questions.
- **Interactive Assessments**: Test your knowledge with timed quizzes.
- **Community & Certificates**: Participate in Q&A discussion threads and earn cryptographic certificates upon course completion.

### 👨‍🏫 For Instructors
- **Course Builder**: Create modules (Video, Text, Code) and structure learning outcomes.
- **Assessment Creator**: Build custom quizzes with dynamic scoring.
- **Earnings & Payouts**: Automatically receive an 80% revenue split on all course sales. Request payouts directly from the dashboard.
- **Analytics**: Track student enrollment, study session times, and completion rates.

### 🛡️ For Admins
- **Global Dashboards**: Monitor platform health, active users, and system notifications.
- **Payout Management**: Review and approve manual payout requests from instructors.
- **Community Moderation**: Oversee discussion threads and manage user roles.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, React Router, TanStack Query (React Query), Lucide Icons.
- **Backend**: Node.js, Express.js, Prisma ORM.
- **Database**: PostgreSQL with `pgvector` for embedding storage and similarity search.
- **Storage**: AWS S3 (via `@aws-sdk/client-s3` and `multer-s3`) for secure, private asset hosting.
- **AI/ML**: `@xenova/transformers` for local embedding generation, integrated with external LLM SDKs (OpenAI/Groq/Anthropic).
- **Payments**: Razorpay.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (with `pgvector` extension installed)
- AWS Account (S3 Bucket)
- Razorpay Account

### 1. Database Setup
Ensure you have a PostgreSQL instance running with the `pgvector` extension enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Backend Configuration
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on the following template:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/learnai"

# Authentication
JWT_SECRET="your_super_secret_jwt_key"

# AWS S3 (Secure Video/Document Storage)
AWS_REGION="your-aws-region"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"

# Payments
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

Push the database schema and start the server:
```bash
npx prisma db push
npm run dev
```

### 3. Frontend Configuration
Navigate to the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL="http://localhost:5000/api"
```

Start the frontend development server:
```bash
npm run dev
```

## 🔐 Security Notes
- **Video Delivery**: Video files are uploaded to AWS S3 with a private ACL. The frontend requests a temporary signed URL (valid for 1 hour) immediately before playback, ensuring content cannot be hotlinked or downloaded directly.
- **Authentication**: JWT-based stateless authentication with robust role-based middleware ensuring strict boundary control between Students, Instructors, and Admins.

## 📄 License
This project is proprietary and confidential.
