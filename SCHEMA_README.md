# LearnAI Database Schema & Relations Guide

This document breaks down the database schema and major table relationships for the LearnAI platform. It is designed to help you quickly grasp the data flow and system architecture.

## 📌 Core Entities

The database is built using PostgreSQL and Prisma ORM, categorized into six main domains:

1. **Identity & Access**: `User`, `Notification`
2. **Course Catalogue**: `Course`, `Module`, `LearningPath`, `Tag`
3. **Enrollment & Progress**: `Enrollment`, `ProgressTracking`, `StudySession`, `Certificate`
4. **Assessment**: `Assessment`, `AssessmentQuestion`, `AssessmentAttempt`
5. **RAG & AI**: `RagContext`, `Interaction`, `DocumentSource`
6. **Community & Monetization**: `DiscussionThread`, `Payment`, `PayoutRequest`

---

## 🔗 Major Table Relationships

### 1. User & Course (The Instructors)
- **Relation**: 1-to-Many
- **Description**: A `User` (with the role of INSTRUCTOR) can create multiple `Course` records. 
- **Foreign Key**: `Course.createdBy` references `User.id`.

### 2. User, Course & Enrollment (The Students)
- **Relation**: Many-to-Many (via `Enrollment`)
- **Description**: A `User` (Student) can enroll in multiple courses, and a `Course` can have multiple enrolled students. The `Enrollment` table serves as the junction table joining them together.
- **Foreign Keys**: 
  - `Enrollment.userId` references `User.id`
  - `Enrollment.courseId` references `Course.id`

### 3. Course & Module (The Content)
- **Relation**: 1-to-Many
- **Description**: A single `Course` is broken down into multiple sequential `Module` records (which can be Video, Text, or Code).
- **Foreign Key**: `Module.courseId` references `Course.id`.

### 4. Module, ContentVersion & RagContext (The AI Tutor System)
- **Relation**: Hierarchical 1-to-Many 
- **Description**: This is the heart of the RAG (Retrieval-Augmented Generation) system.
  - A `Module` has multiple `ContentVersion`s (to track edits).
  - A `ContentVersion` is broken down into many `RagContext` records.
  - **Crucial Detail**: `RagContext` stores text chunks alongside their mathematical embeddings using the `pgvector` PostgreSQL extension (`vector(384)`). This allows the AI to perform mathematical similarity searches to find exact course material to answer student questions.

### 5. User, Course & Interaction (AI Chat)
- **Relation**: 1-to-Many
- **Description**: When a user chats with the AI Tutor, an `Interaction` record is created. It explicitly tracks which `User` asked the question, which `Course`/`Module` they were on, and which `RagContext` chunks were retrieved to answer them.

### 6. User, Course & Payment (Monetization)
- **Relation**: Multi-way
- **Description**: The `Payment` table records transactions. It links to the `User` (Student paying), the `Course` being purchased, and explicitly to the Instructor (`User`) who will receive the revenue split, making payouts easy to calculate.

---

## 🧠 Key Architecture Decisions (Great for Interviews)

- **Vector Search in Postgres**: By using `pgvector` in the `RagContext` table, the platform avoids the need for a separate external Vector Database (like Pinecone). This ensures relational data and embeddings are kept in sync natively.
- **Secure Video Streaming**: Instead of serving videos directly from the DB or a public server, the system relies on AWS S3 with temporary signed URLs to prevent unauthorized downloading.
- **Robust Access Control**: The `Role` enum (STUDENT, INSTRUCTOR, ADMIN) directly on the `User` model makes it very easy for backend middleware to securely lock down specific routes (like Instructor payout requests or Admin dashboards).
