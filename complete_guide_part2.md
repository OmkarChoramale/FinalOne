# COMPLETE INTERVIEW GUIDE — PART 2

# ══════════════════════════════════════════════
# SECTION 4: JWT SECURITY — DEEP DIVE
# ══════════════════════════════════════════════

## 4.1 What is JWT?

JWT (JSON Web Token) = a **signed JSON string** used for stateless authentication.

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJvbWthckBlbWFpbC5jb20iLCJyb2xlcyI6IlJPTEVfQURNSU4iLCJ1c2VySWQiOjF9.abc123
 └─── Header ───┘ └──────────────── Payload ────────────────────────────────────────┘ └─ Signature ─┘
```

**Header** (Base64): `{ "alg": "HS256" }` — algorithm used
**Payload** (Base64): `{ "sub": "omkar@email.com", "roles": "ROLE_ADMIN", "userId": 1, "exp": 1700000000 }` — user data
**Signature**: `HMACSHA256(header + "." + payload, SECRET_KEY)` — proof it wasn't tampered

### Important: Base64 ≠ Encrypted
> JWT payload is **encoded, NOT encrypted**. Anyone can decode it with `jwtDecode`. The signature only proves it wasn't modified — it doesn't hide the data. Never put passwords in JWT.

## 4.2 JWT Flow in Your Project

```
1. POST /auth/login { email: "omkar@email.com", password: "pass123" }
2. UserService → validates password against BCrypt hash in DB
3. UserService → generates JWT:
     { sub: "omkar@email.com", roles: "ROLE_ADMIN", userId: 1, exp: +24h }
4. Signs with SECRET_KEY → returns token string to frontend
5. Frontend → localStorage.setItem('token', token)
6. Every subsequent request:
     axios interceptor → reads localStorage → attaches header:
     Authorization: Bearer eyJhb...
7. API Gateway receives request:
     → reads Authorization header
     → validates signature with same SECRET_KEY
     → extracts userId, roles from payload
     → adds X-User-Id: 1, X-User-Roles: ROLE_ADMIN to request headers
     → forwards to microservice
8. Microservice controller:
     @RequestHeader("X-User-Id") Long userId  → gets 1
     → queries DB: WHERE user_id = 1
```

## 4.3 Why Stateless?

Traditional session: Server stores session in memory → if server restarts, user logged out.
JWT: Token contains everything → **no server-side session storage** → any server can validate it.

**Interview Q: "How do you logout with JWT?"**
> Since JWT is stateless, server can't invalidate it. Options:
> 1. Frontend removes token from localStorage (our approach)
> 2. Short expiration time (e.g., 1 hour)
> 3. Token blacklist in Redis (for critical systems)

**Interview Q: "Where do you store JWT — localStorage vs Cookie?"**
> We use localStorage. It's simpler but vulnerable to XSS attacks. HttpOnly cookies are more secure but need CSRF protection. For a government intranet system, localStorage with proper XSS prevention is acceptable.

---

# ══════════════════════════════════════════════
# SECTION 5: MySQL & DATABASE CONCEPTS
# ══════════════════════════════════════════════

## 5.1 Database Per Service Pattern

Each microservice has its **own MySQL database**:
```
notification_db  → notifications table
report_db        → reports table
user_db          → users table
site_db          → heritage_sites, preservation_activities tables
event_db         → events, bookings tables
program_db       → programs, resources tables
compliance_db    → compliance_records, audits tables
```

**Why separate databases?**
- Services are truly independent — one can use MySQL, another could use PostgreSQL
- No accidental cross-service table joins
- Each service owns its data completely

**Interview Q: "But how do you get user data in NotificationService if User table is in a different DB?"**
> Feign clients. NotificationService calls UserService's API to get user data — it NEVER queries user_db directly. This is the key rule of microservices: **no shared databases**.

## 5.2 Your Tables Structure

### notifications table:
```sql
CREATE TABLE notifications (
    notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    entity_id       BIGINT,
    subject         VARCHAR(100) NOT NULL,
    message         VARCHAR(500) NOT NULL,
    category        VARCHAR(50) NOT NULL,   -- Stores ENUM as string: 'ACTION_REQUIRED'
    status          VARCHAR(20) NOT NULL,    -- 'UNREAD' or 'READ'
    created_date    DATETIME NOT NULL
);
```

### reports table:
```sql
CREATE TABLE reports (
    report_id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    scope               VARCHAR(50) NOT NULL,    -- 'SITE', 'EVENT', 'PROGRAM', 'COMPLIANCE'
    metrics             TEXT NOT NULL,             -- Full report content as text
    generated_date      DATETIME NOT NULL,
    generated_by_user_id BIGINT NOT NULL
);
```

## 5.3 Key MySQL Concepts Used

**AUTO_INCREMENT:** Database generates unique IDs automatically — `@GeneratedValue(strategy = IDENTITY)`

**ENUM stored as STRING:** `@Enumerated(EnumType.STRING)` stores `'UNREAD'` not `0`. Why? If you add a new enum value between existing ones, numeric indexes shift. Strings are safe.

**TEXT column type:** `metrics TEXT` — used for report content. VARCHAR max is 65,535 chars. TEXT can hold up to 4GB.

**NOT NULL constraint:** `nullable = false` in JPA → `NOT NULL` in MySQL. Ensures data integrity at DB level.

**Interview Q: "What is the N+1 query problem?"**
> When you fetch a list of entities and each has a related entity, JPA fires 1 query for the list + N queries for each related entity. Solution: `@Query` with `JOIN FETCH` or `@EntityGraph`. In our project, we avoid this because notifications don't have nested relationships — it's a flat entity.

---

# ══════════════════════════════════════════════
# SECTION 6: DESIGN PATTERNS IN YOUR PROJECT
# ══════════════════════════════════════════════

## 6.1 Backend Patterns

### 1. Repository Pattern
```java
public interface NotificationRepository extends JpaRepository<Notification, Long> { }
```
Abstracts database access behind an interface. Service layer calls `repository.save()` — doesn't know if it's MySQL, PostgreSQL, or MongoDB underneath.

### 2. DTO Pattern (Data Transfer Object)
```java
// Entity (internal) — has JPA annotations, DB constraints
public class Notification { @Id private Long notificationId; ... }

// RequestDTO (incoming) — has validation annotations
public class NotificationRequestDTO { @NotBlank private String subject; ... }

// ResponseDTO (outgoing) — has only fields the client needs
public class NotificationResponseDTO { private Long notificationId; private String subject; ... }
```
Three separate classes for same data — Entity for DB, RequestDTO for input validation, ResponseDTO for API output.

### 3. Builder Pattern (via Lombok)
```java
Notification notification = Notification.builder()
    .userId(1L)
    .subject("New Heritage Site")
    .message("Hampi added to registry")
    .category(NotificationCategory.SYSTEM_CREATE)
    .build();
```
Instead of a constructor with 8 parameters, builder makes code readable and order-independent.

### 4. Dependency Injection (IoC)
```java
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;  // Spring injects this
}
```
Controller doesn't create the service — Spring creates it and injects it. This is **Inversion of Control**. Benefits: loose coupling, easy testing (inject mock in tests).

### 5. Interceptor Pattern
**Backend:** Gateway intercepts every request to validate JWT
**Frontend:** Axios interceptor adds token to every request

### 6. Gateway Pattern
Single entry point for all clients. Handles cross-cutting concerns: authentication, rate limiting, logging, routing.

## 6.2 Frontend Patterns

### 7. Provider Pattern (Context API)
```jsx
<NotificationProvider>    ← Provides data
  <Navbar />              ← Consumes unreadCount
  <NotificationsPage />   ← Consumes notifications + refresh
</NotificationProvider>
```
Avoids prop drilling. Any nested component can access shared state.

### 8. Guard Pattern
```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = getUser();
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
    return children;
};
```
Blocks unauthorized access before rendering the page.

### 9. Component Composition
```jsx
<StatCard label="Sites" value={42} icon={<MapPin/>} color="bg-blue" />
```
Small, reusable components receive data via props. Parent controls what to show, child controls how to show it.

### 10. Config-Driven UI
```jsx
const SCOPES = [
    { id: 'SITE', label: 'Heritage Sites', icon: <Layers/>, img: siteImg },
    { id: 'EVENT', label: 'Cultural Events', ... },
];
// Render dynamically:
SCOPES.map(scope => <ScopeCard key={scope.id} {...scope} />)
```
Add a new scope? Just add one object to the array. No new component needed.

### 11. Graceful Degradation
```jsx
axios.get('/sites').catch(() => ({ data: [] }))
```
If service fails, return empty data instead of crashing. Dashboard shows 0 instead of error screen.

### 12. Polling Pattern
```jsx
useEffect(() => {
    refresh();                                    // Immediate fetch
    intervalRef.current = setInterval(refresh, 30000); // Every 30s
    return () => clearInterval(intervalRef.current);   // Cleanup
}, []);
```
Periodically check for new data. Simple alternative to WebSocket.

---

# ══════════════════════════════════════════════
# SECTION 7: REST API DEEP CONCEPTS
# ══════════════════════════════════════════════

## 7.1 HTTP Methods in Your Project

| Method | Meaning | Your Usage | Idempotent? |
|---|---|---|---|
| GET | Read data | Fetch notifications, reports, dashboard stats | Yes |
| POST | Create new | Generate report, create notification | No |
| PATCH | Partial update | Mark notification as READ | Yes |
| PUT | Full replace | (Not used in your modules) | Yes |
| DELETE | Remove | Delete compliance record | Yes |

**Interview Q: "What is idempotent?"**
> Calling it multiple times has the same effect as calling once. GET /notifications always returns same data. PATCH /notifications/5/read — marking as READ twice still results in READ. But POST /reports/generate creates a new report each time — NOT idempotent.

## 7.2 HTTP Status Codes Used

| Code | Meaning | When |
|---|---|---|
| 200 OK | Success | GET responses, PATCH mark as read |
| 201 Created | Resource created | POST generate report, POST create notification |
| 400 Bad Request | Invalid input | @Valid fails (missing subject, etc.) |
| 401 Unauthorized | No/invalid JWT | Gateway rejects expired token |
| 403 Forbidden | Wrong role | ProtectedRoute blocks tourist from reports |
| 404 Not Found | Resource missing | Notification ID doesn't exist |
| 500 Server Error | Backend crash | Unhandled exception |

## 7.3 Content-Disposition for File Download

```java
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
headers.setContentDisposition(ContentDisposition.attachment()
        .filename("Tourism_Report_" + id + ".txt").build());
return new ResponseEntity<>(data, headers, HttpStatus.OK);
```

- `APPLICATION_OCTET_STREAM` — tells browser "this is a binary file, not JSON"
- `ContentDisposition.attachment()` — tells browser "download this, don't display it"
- `.filename()` — suggests the filename for Save dialog

