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
    "tags": ["AI", "Machine Learning"],
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
    "tags": ["AI", "Machine Learning"],
    "thumbnailUrl": "https://example.com/ai-thumb.jpg",
    "createdBy": "user-uuid-string",
    "createdAt": "2026-05-29T11:00:00.000Z",
    "creator": {
      "id": "user-uuid-string",
      "name": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
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
  "tags": ["AI", "Machine Learning"],
  "thumbnailUrl": "https://example.com/ai-thumb.jpg",
  "createdBy": "user-uuid-string",
  "createdAt": "2026-05-29T11:00:00.000Z",
  "creator": {
    "id": "user-uuid-string",
    "name": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg"
  },
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
  "level": "ADVANCED"
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
    "tags": ["AI", "Machine Learning"],
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
