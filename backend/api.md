# API Documentation

## 1. User Registration (Sign Up)
**URL:** `POST /api/auth/register`

**Input JSON:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "STUDENT",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Output JSON (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-string",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-05-29T10:00:00.000Z",
    "updatedAt": "2026-05-29T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
}
```

---

## 2. User Login
**URL:** `POST /api/auth/login`

**Input JSON:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Output JSON (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-string",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-05-29T10:00:00.000Z",
    "updatedAt": "2026-05-29T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
}
```

---

## 3. Get Current User Profile
**URL:** `GET /api/auth/me`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
*(No request body needed)*

**Output JSON (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "role": "STUDENT",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2026-05-29T10:00:00.000Z",
  "updatedAt": "2026-05-29T10:00:00.000Z"
}
```

---

## 4. Add or Update User Skill
**URL:** `POST /api/user-skills`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
```json
{
  "skillTag": "JavaScript",
  "proficiency": 80
}
```

**Output JSON (201 Created):**
```json
{
  "message": "Skill added/updated successfully",
  "skill": {
    "id": "skill-uuid-string",
    "userId": "user-uuid-string",
    "skillTag": "JavaScript",
    "proficiency": 80,
    "updatedAt": "2026-05-29T10:30:00.000Z"
  }
}
```

---

## 5. Get All User Skills
**URL:** `GET /api/user-skills`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
*(No request body needed)*

**Output JSON (200 OK):**
```json
[
  {
    "id": "skill-uuid-string-1",
    "userId": "user-uuid-string",
    "skillTag": "JavaScript",
    "proficiency": 80,
    "updatedAt": "2026-05-29T10:30:00.000Z"
  },
  {
    "id": "skill-uuid-string-2",
    "userId": "user-uuid-string",
    "skillTag": "Python",
    "proficiency": 60,
    "updatedAt": "2026-05-29T10:15:00.000Z"
  }
]
```

---

## 6. Remove User Skill
**URL:** `DELETE /api/user-skills/:id_or_tag`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
*(No request body needed. You can pass either the skill's UUID or the `skillTag` like "JavaScript" in the URL path.)*

**Output JSON (200 OK):**
```json
{
  "message": "Skill removed successfully"
}
```

---

## 7. Create Course
**URL:** `POST /api/courses`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
```json
{
  "title": "Introduction to AI",
  "description": "Learn the basics of Artificial Intelligence.",
  "level": "BEGINNER",
  "price": 49.99,
  "currency": "USD",
  "tags": ["AI", "Machine Learning"],
  "thumbnailUrl": "https://example.com/ai-thumb.jpg"
}
```

**Output JSON (201 Created):**
```json
{
  "message": "Course created successfully",
  "course": {
    "id": "course-uuid-string",
    "title": "Introduction to AI",
    "slug": "introduction-to-ai-a1b2c3",
    "description": "Learn the basics of Artificial Intelligence.",
    "level": "BEGINNER",
    "price": "49.99",
    "currency": "USD",
    "thumbnailUrl": "https://example.com/ai-thumb.jpg",
    "createdBy": "user-uuid-string",
    "createdAt": "2026-05-29T11:00:00.000Z"
  }
}
```

---

## 8. Get All Courses
**URL:** `GET /api/courses`

**Input JSON:**
*(No request body needed)*

**Output JSON (200 OK):**
```json
[
  {
    "id": "course-uuid-string",
    "title": "Introduction to AI",
    "slug": "introduction-to-ai-a1b2c3",
    "description": "Learn the basics of Artificial Intelligence.",
    "level": "BEGINNER",
    "price": "49.99",
    "currency": "USD",
    "thumbnailUrl": "https://example.com/ai-thumb.jpg",
    "createdBy": "user-uuid-string",
    "createdAt": "2026-05-29T11:00:00.000Z",
    "creator": {
      "id": "user-uuid-string",
      "name": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "tags": [
      {
        "courseId": "course-uuid-string",
        "tagId": "tag-uuid-1",
        "tag": {
          "id": "tag-uuid-1",
          "name": "ai"
        }
      },
      {
        "courseId": "course-uuid-string",
        "tagId": "tag-uuid-2",
        "tag": {
          "id": "tag-uuid-2",
          "name": "machine learning"
        }
      }
    ]
  }
]
```

---

## 9. Get Course by ID or Slug
**URL:** `GET /api/courses/:id_or_slug`

**Input JSON:**
*(No request body needed)*

**Output JSON (200 OK):**
```json
{
  "id": "course-uuid-string",
  "title": "Introduction to AI",
  "slug": "introduction-to-ai-a1b2c3",
  "description": "Learn the basics of Artificial Intelligence.",
  "level": "BEGINNER",
  "price": "49.99",
  "currency": "USD",
  "thumbnailUrl": "https://example.com/ai-thumb.jpg",
  "createdBy": "user-uuid-string",
  "createdAt": "2026-05-29T11:00:00.000Z",
  "creator": {
    "id": "user-uuid-string",
    "name": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg"
  },
  "tags": [
    {
      "courseId": "course-uuid-string",
      "tagId": "tag-uuid-1",
      "tag": {
        "id": "tag-uuid-1",
        "name": "ai"
      }
    }
  ],
  "modules": []
}
```

---

## 10. Update Course
**URL:** `PUT /api/courses/:id`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
```json
{
  "title": "Advanced AI Concepts",
  "level": "ADVANCED",
  "price": 59.99,
  "tags": ["AI", "Deep Learning"]
}
```

**Output JSON (200 OK):**
```json
{
  "message": "Course updated successfully",
  "course": {
    "id": "course-uuid-string",
    "title": "Advanced AI Concepts",
    "slug": "advanced-ai-concepts-d4e5f6",
    "description": "Learn the basics of Artificial Intelligence.",
    "level": "ADVANCED",
    "price": "59.99",
    "currency": "USD",
    "thumbnailUrl": "https://example.com/ai-thumb.jpg",
    "createdBy": "user-uuid-string",
    "createdAt": "2026-05-29T11:00:00.000Z"
  }
}
```

---

## 11. Delete Course
**URL:** `DELETE /api/courses/:id`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
*(No request body needed)*

**Output JSON (200 OK):**
```json
{
  "message": "Course deleted successfully"
}
```

---

## 12. Create Module
**URL:** `POST /api/courses/:courseId/modules`
*(Requires Authorization Header: `Bearer <token>` - Instructor only)*

**Input JSON:**
```json
{
  "title": "Getting Started",
  "contentType": "VIDEO",
  "body": "<iframe src='...'></iframe>",
  "order": 1,
  "durationS": 300
}
```

**Output JSON (201 Created):**
```json
{
  "message": "Module created successfully",
  "module": {
    "id": "module-uuid",
    "courseId": "course-uuid",
    "title": "Getting Started",
    "contentType": "VIDEO",
    "body": "<iframe src='...'></iframe>",
    "order": 1,
    "durationS": 300
  }
}
```

---

## 13. Get Course Modules
**URL:** `GET /api/courses/:courseId/modules`
*(Requires Authorization Header: `Bearer <token>` - Must be enrolled or creator)*

**Output JSON (200 OK):**
```json
[
  {
    "id": "module-uuid",
    "courseId": "course-uuid",
    "title": "Getting Started",
    "contentType": "VIDEO",
    "body": "<iframe src='...'></iframe>",
    "order": 1,
    "durationS": 300
  }
]
```

---

## 14. Enroll in Course (or Purchase)
**URL:** `POST /api/payments/enroll/:courseId`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
```json
{
  "gateway": "STRIPE"
}
```

**Output JSON (Free Course - 200 OK):**
```json
{
  "message": "Successfully enrolled in free course",
  "enrollment": {
    "id": "enrollment-uuid",
    "userId": "user-uuid",
    "courseId": "course-uuid",
    "enrolledAt": "2026-05-30T10:00:00.000Z"
  }
}
```

**Output JSON (Paid Course - 200 OK):**
```json
{
  "message": "Payment required",
  "paymentDetails": {
    "status": "PAYMENT_REQUIRED",
    "paymentId": "payment-uuid",
    "amount": 49.99,
    "currency": "USD",
    "instructorId": "instructor-uuid"
  }
}
```

---

## 15. Get My Enrollments
**URL:** `GET /api/enrollments`
*(Requires Authorization Header: `Bearer <token>`)*

**Output JSON (200 OK):**
```json
[
  {
    "id": "enrollment-uuid",
    "userId": "user-uuid",
    "courseId": "course-uuid",
    "enrolledAt": "2026-05-30T10:00:00.000Z",
    "course": {
      "id": "course-uuid",
      "title": "Introduction to AI",
      "thumbnailUrl": "...",
      "creator": { "name": "John Doe" }
    },
    "progress": []
  }
]
```

---

## 16. Update Module Progress
**URL:** `POST /api/enrollments/:courseId/progress/:moduleId`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
```json
{
  "status": "COMPLETED",
  "timeSpentS": 60,
  "lastPosition": "300"
}
```

**Output JSON (200 OK):**
```json
{
  "message": "Progress updated",
  "progress": {
    "id": "progress-uuid",
    "enrollmentId": "enrollment-uuid",
    "moduleId": "module-uuid",
    "status": "COMPLETED",
    "timeSpentS": 360,
    "lastPosition": "300",
    "updatedAt": "2026-05-30T10:00:00.000Z"
  }
}
```

---

## 17. Complete Course
**URL:** `POST /api/enrollments/:courseId/complete`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
*(No request body needed)*

**Output JSON (200 OK):**
```json
{
  "message": "Course marked as completed",
  "enrollment": {
    "id": "enrollment-uuid",
    "userId": "user-uuid",
    "courseId": "course-uuid",
    "completedAt": "2026-05-31T10:00:00.000Z"
  }
}
```

---

## 18. Payment Webhook (Simulation)
**URL:** `POST /api/payments/webhook`

**Input JSON:**
```json
{
  "paymentId": "payment-uuid-from-enroll-endpoint",
  "status": "SUCCESS"
}
```

**Output JSON (200 OK):**
```json
{
  "message": "Payment marked as SUCCESS",
  "payment": {
    "id": "payment-uuid",
    "status": "SUCCESS",
    "transactionId": "txn-xyz"
  }
}
```

---

## 19. Get Instructor Earnings
**URL:** `GET /api/payments/earnings`
*(Requires Authorization Header: `Bearer <token>` - Instructor/Admin only)*

**Output JSON (200 OK):**
```json
{
  "totalEarnings": 499.90,
  "transactions": [
    {
      "id": "payment-uuid",
      "amount": "49.99",
      "currency": "USD",
      "status": "SUCCESS",
      "createdAt": "2026-05-31T10:00:00.000Z",
      "course": { "title": "Introduction to AI" },
      "user": { "name": "Jane Student", "email": "jane@example.com" }
    }
  ]
}
```

---

## 20. Create Assessment
**URL:** `POST /api/courses/:courseId/assessments`
*(Or `POST /api/courses/:courseId/modules/:moduleId/assessments` to link to a module)*
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
```json
{
  "title": "AI Basics Quiz",
  "passScore": 10,
  "maxAttempts": 3,
  "timeLimitS": 600
}
```

**Output JSON (201 Created):**
```json
{
  "id": "assessment-uuid",
  "courseId": "course-uuid",
  "moduleId": null,
  "title": "AI Basics Quiz",
  "passScore": 10,
  "maxAttempts": 3,
  "timeLimitS": 600
}
```

---

## 21. Add Question to Assessment
**URL:** `POST /api/assessments/:assessmentId/questions`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
```json
{
  "type": "MULTIPLE_CHOICE",
  "prompt": "What does AI stand for?",
  "optionsJson": ["Artificial Intelligence", "Automated Interface"],
  "answerKey": "Artificial Intelligence",
  "points": 5
}
```

**Output JSON (201 Created):**
```json
{
  "id": "question-uuid",
  "assessmentId": "assessment-uuid",
  "type": "MULTIPLE_CHOICE",
  "prompt": "What does AI stand for?",
  "optionsJson": ["Artificial Intelligence", "Automated Interface"],
  "answerKey": "Artificial Intelligence",
  "points": 5
}
```

---

## 22. Get Assessment (Instructor - Includes Answers)
**URL:** `GET /api/assessments/:assessmentId/instructor`
*(Requires Authorization Header: `Bearer <token>`)*

**Output JSON (200 OK):**
```json
{
  "id": "assessment-uuid",
  "title": "AI Basics Quiz",
  "questions": [
    {
      "id": "question-uuid",
      "prompt": "What does AI stand for?",
      "answerKey": "Artificial Intelligence",
      "points": 5
    }
  ]
}
```

---

## 23. Get Assessment (Student - Hides Answers)
**URL:** `GET /api/assessments/:assessmentId`
*(Requires Authorization Header: `Bearer <token>`)*

**Output JSON (200 OK):**
```json
{
  "id": "assessment-uuid",
  "title": "AI Basics Quiz",
  "questions": [
    {
      "id": "question-uuid",
      "prompt": "What does AI stand for?",
      "optionsJson": ["Artificial Intelligence", "Automated Interface"],
      "points": 5
    }
  ]
}
```

---

## 24. Start Assessment Attempt
**URL:** `POST /api/assessments/:assessmentId/attempts`
*(Requires Authorization Header: `Bearer <token>`)*

**Output JSON (201 Created):**
```json
{
  "id": "attempt-uuid",
  "assessmentId": "assessment-uuid",
  "userId": "user-uuid",
  "score": 0,
  "answersJson": {},
  "passed": false,
  "startedAt": "2026-05-31T10:00:00.000Z"
}
```

---

## 25. Submit Assessment Attempt
**URL:** `POST /api/attempts/:attemptId/submit`
*(Requires Authorization Header: `Bearer <token>`)*

**Input JSON:**
```json
{
  "answers": {
    "question-uuid-1": "Artificial Intelligence",
    "question-uuid-2": "True"
  }
}
```

**Output JSON (200 OK):**
```json
{
  "id": "attempt-uuid",
  "score": 10,
  "answersJson": {
    "question-uuid-1": "Artificial Intelligence"
  },
  "passed": true,
  "submittedAt": "2026-05-31T10:05:00.000Z"
}
```

---

## 26. Issue Certificate
**URL:** `POST /api/courses/:courseId/certificates`
*(Requires Authorization Header: `Bearer <token>` - Must have completed course)*

**Input JSON:**
*(No request body needed)*

**Output JSON (201 Created):**
```json
{
  "message": "Certificate issued successfully",
  "certificate": {
    "id": "cert-uuid",
    "userId": "user-uuid",
    "courseId": "course-uuid",
    "hash": "random-hex-hash",
    "certUrl": "https://example.com/certificates/hash.pdf",
    "issuedAt": "2026-05-31T10:00:00.000Z"
  }
}
```

---

## 27. Get My Certificates
**URL:** `GET /api/my-certificates`
*(Requires Authorization Header: `Bearer <token>`)*

**Output JSON (200 OK):**
```json
[
  {
    "id": "cert-uuid",
    "courseId": "course-uuid",
    "certUrl": "https://example.com/certificates/hash.pdf",
    "course": {
      "id": "course-uuid",
      "title": "Introduction to AI",
      "thumbnailUrl": "..."
    }
  }
]
```

---

## 28. Verify Certificate
**URL:** `GET /api/certificates/verify/:hash`
*(Public endpoint, no auth required)*

**Output JSON (200 OK):**
```json
{
  "valid": true,
  "certificate": {
    "id": "cert-uuid",
    "user": { "name": "Jane Student" },
    "course": { "title": "Introduction to AI" }
  }
}
```

---

## 29. Create Learning Path
**URL:** `POST /api/learning-paths`
*(Requires Authorization Header: `Bearer <token>` - Instructor/Admin only)*

**Input JSON:**
```json
{
  "title": "Full-Stack Web Developer Path",
  "description": "Master frontend and backend development.",
  "tags": ["web", "full-stack"],
  "courses": [
    { "courseId": "course-uuid-1", "order": 1 },
    { "courseId": "course-uuid-2", "order": 2 }
  ]
}
```

**Output JSON (201 Created):**
```json
{
  "message": "Learning path created successfully",
  "path": {
    "id": "path-uuid",
    "title": "Full-Stack Web Developer Path",
    "description": "Master frontend and backend development.",
    "createdBy": "user-uuid",
    "tags": ["web", "full-stack"],
    "courses": [
      {
        "id": "lpc-uuid-1",
        "pathId": "path-uuid",
        "courseId": "course-uuid-1",
        "order": 1,
        "course": {
          "title": "HTML & CSS Basics",
          "thumbnailUrl": "..."
        }
      }
    ]
  }
}
```

---

## 30. Get All Learning Paths
**URL:** `GET /api/learning-paths`

**Output JSON (200 OK):**
```json
[
  {
    "id": "path-uuid",
    "title": "Full-Stack Web Developer Path",
    "description": "Master frontend and backend development.",
    "createdBy": "user-uuid",
    "tags": ["web", "full-stack"],
    "creator": { "name": "John Doe" },
    "courses": [
      {
        "order": 1,
        "course": {
          "id": "course-uuid-1",
          "title": "HTML & CSS Basics",
          "slug": "html-css-basics",
          "level": "BEGINNER"
        }
      }
    ]
  }
]
```

---

## 31. Get Learning Path By ID
**URL:** `GET /api/learning-paths/:pathId`

**Output JSON (200 OK):**
```json
{
  "id": "path-uuid",
  "title": "Full-Stack Web Developer Path",
  "description": "Master frontend and backend development.",
  "createdBy": "user-uuid",
  "tags": ["web", "full-stack"],
  "creator": { "name": "John Doe" },
  "courses": [
    {
      "order": 1,
      "course": {
        "id": "course-uuid-1",
        "title": "HTML & CSS Basics",
        "description": "...",
        "slug": "html-css-basics",
        "level": "BEGINNER",
        "price": "49.99"
      }
    }
  ]
}
```

---

## 32. Update Learning Path
**URL:** `PUT /api/learning-paths/:pathId`
*(Requires Authorization Header: `Bearer <token>` - Creator/Admin only)*

**Input JSON:**
```json
{
  "title": "Advanced Full-Stack Path",
  "description": "An updated description.",
  "tags": ["web", "advanced"],
  "courses": [
    { "courseId": "course-uuid-2", "order": 1 },
    { "courseId": "course-uuid-3", "order": 2 }
  ]
}
```

**Output JSON (200 OK):**
```json
{
  "message": "Learning path updated successfully",
  "path": {
    "id": "path-uuid",
    "title": "Advanced Full-Stack Path"
  }
}
```

---

## 33. Delete Learning Path
**URL:** `DELETE /api/learning-paths/:pathId`
*(Requires Authorization Header: `Bearer <token>` - Creator/Admin only)*

**Output JSON (200 OK):**
```json
{
  "message": "Learning path deleted successfully"
}
```