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
