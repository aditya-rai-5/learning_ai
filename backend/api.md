# API Documentation

## Authentication & Identity

### 1. User Registration (Sign Up)

Create a new user account.

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Auth required:** No

#### Request Body

The request body should be a JSON object containing the following fields:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | Yes | The user's email address. Must be unique. |
| `password` | `string` | Yes | The user's password (will be hashed before saving). |
| `name` | `string` | Yes | The user's full name. |
| `role` | `string` | No | The role of the user. Options: `STUDENT`, `INSTRUCTOR`, `ADMIN`. Defaults to `STUDENT` if not provided. |
| `avatarUrl` | `string` | No | Optional URL to the user's avatar profile picture. |

#### Example Request

```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "STUDENT"
}
```

#### Success Response

- **Code:** `201 Created`
- **Content:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-string",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "avatarUrl": null,
    "createdAt": "2026-05-29T10:00:00.000Z",
    "updatedAt": "2026-05-29T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
}
```

#### Error Responses

- **Condition:** User with the given email already exists.
  - **Code:** `400 Bad Request`
  - **Content:** `{ "error": "User already exists" }`

- **Condition:** Missing required fields or invalid data.
  - **Code:** `400 Bad Request`
  - **Content:** `{ "error": "Error message detailing what went wrong" }`
