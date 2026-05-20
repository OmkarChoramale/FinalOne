# 📘 THE ONE BIG GUIDE — PART A: Speech + Backend + API Layer

---

# 1️⃣ YOUR 4-MINUTE INTERVIEW SPEECH

"So I worked on a **Tourism Government Management System** — a full-stack platform where government officials manage heritage sites, cultural events, programs, and tourists. 6 different roles — Admin, Manager, Officer, Auditor, Compliance, Tourist — each gets a different experience.

We went with **microservices** — 7 Spring Boot services, each with its own database. All register with **Eureka**, frontend talks only to the **API Gateway** on port 8383. Gateway validates JWT, extracts `X-User-Id` and `X-User-Roles`, forwards as headers — so downstream services don't decode JWT themselves. **Centralized security**.

On frontend, React with Vite. I built an **axios interceptor** — every request automatically gets Bearer token attached. **Single responsibility** — no component handles auth manually.

**Dashboard** — fires 5 API calls in parallel using `Promise.all`. Initially sequential — took 3 seconds. Parallel dropped to 500ms. Each call has `.catch()` fallback — if ProgramService is down, dashboard still loads with zero. **Graceful degradation**. RBAC via `switch/case` — Admin sees 6 cards, Tourist sees 3.

**Notification System** — backend notifications triggered by **other services via Feign**. On frontend, **Context API** wraps app, polls every 30 seconds. Bell icon reads `unreadCount` from context. Mark-as-read uses spread operator `{ ...n, status: 'READ' }` inside `.map()`, then calls `refresh()` — bell updates instantly. I store interval ID in `useRef` not `useState` — because useState would cause infinite re-render loop.

**Report module** — ReportingService has **7 Feign clients**, pulls data from all services, aggregates, saves to MySQL. Download uses `byte[]` backend → `Blob` frontend → `createObjectURL` → hidden anchor click. `useMemo` for search optimization.

Challenge: Feign failures cascading — NotificationService down meant site creation also failed. Fix: non-blocking fallbacks for non-critical operations."

---

# 2️⃣ FILE: api.js — The HTTP Brain

### YOUR ACTUAL CODE:
```js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8383';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
```

### CONCEPTS EXPLAINED:

**📌 `axios.create()` — Axios Instance**
Instead of writing `axios.get('http://localhost:8383/...')` everywhere, you create ONE instance with baseURL preset. Now `api.get('/notifications')` automatically becomes `http://localhost:8383/notifications`.
> **WHERE USED:** This single instance is used by ALL API objects below — notificationApi, reportApi, dashboardApi.

**📌 `interceptors.request.use()` — Interceptor Pattern**
Think of it as a **security guard at the door**. Every request passes through this function BEFORE being sent. It reads token from localStorage and attaches it as `Authorization: Bearer eyJ...` header.
> **WHY IT MATTERS:** Without this, every component would need to manually add the token. With this, write it ONCE — 100% of requests are covered. This is the **Single Responsibility Principle**.

**📌 `localStorage.getItem('token')` — Browser Storage**
localStorage = browser's key-value storage. Survives page refresh and browser close. We store the JWT token here after login.
> **WHERE USED:** api.js (interceptor reads token), Navbar.jsx (reads role, name), Dashboard.jsx (reads role), ReportPage.jsx (reads role).

### YOUR API OBJECTS:
```js
export const notificationApi = {
    getAll:        () => api.get('/tourismgov/v1/notifications'),
    getUnread:     () => api.get('/tourismgov/v1/notifications/unread'),
    markAsRead:    (id) => api.patch(`/tourismgov/v1/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/tourismgov/v1/notifications/read-all'),
    create:        (data) => api.post('/tourismgov/v1/notifications', data),
};

export const reportApi = {
    generate:  (data) => api.post('/tourismgov/v1/reports/generate', data),
    getHistory:(params) => api.get('/tourismgov/v1/reports/history', { params }),
    download:  (id) => api.get(`/tourismgov/v1/reports/download/${id}`, {
        responseType: 'blob'   // ← Critical! Tells axios to treat response as binary file
    })
};
```

**📌 `responseType: 'blob'` — Binary Response Handling**
By default axios parses response as JSON text. But the download endpoint returns `byte[]` (raw file data). If axios parses binary as JSON, the file corrupts. `blob` tells axios: "Don't parse this — give me raw binary."
> **WHERE USED:** Only in `reportApi.download()`. The blob is then used in ReportPage.jsx's `handleDownload` function.

**📌 Template Literals `` `${id}` ``**
JavaScript ES6 feature — embed variables inside strings using `${}`. Cleaner than string concatenation (`'/path/' + id + '/read'`).
> **WHERE USED:** Every API URL with dynamic parameters.

---

# 3️⃣ FILE: auth.js — JWT Decoding

### YOUR ACTUAL CODE:
```js
import { jwtDecode } from 'jwt-decode';

export const getUser = () => {
    const token = getAuthToken();
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        const rawRole = decoded.roles || decoded.role || '';
        const role = rawRole.replace('ROLE_', '');
        return {
            userId: decoded.userId || decoded.id,
            role: role.toUpperCase(),
            email: decoded.sub,
            name: decoded.name || 'User'
        };
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};
```

**📌 `jwtDecode()` — Decode JWT Without Secret Key**
JWT has 3 parts: `Header.Payload.Signature`. The payload is Base64-encoded (NOT encrypted). `jwtDecode` reads the payload to extract userId, role, email. It does NOT verify the token — that's the backend's job.
> **WHERE USED:** `ProtectedRoute.jsx` calls `getUser()` to check if user is logged in and has correct role.

**📌 `.replace('ROLE_', '')` — String Cleaning**
Backend stores roles as `ROLE_ADMIN`. Frontend expects `ADMIN`. This strips the prefix.

**📌 `|| ''` — OR Fallback**
`decoded.roles || decoded.role || ''` — tries `roles` first, then `role`, then empty string. Handles different JWT formats safely.

---

# 4️⃣ FILE: ProtectedRoute.jsx — Route Guard

### YOUR ACTUAL CODE:
```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = getUser();
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role))  {
        if (user.role === 'TOURIST') return <Navigate to="/dashboard" replace />;
        return <Navigate to="/main-dashboard" replace />;
    }
    return children;
};
```

**📌 Guard Pattern — Block Before Render**
This component wraps protected pages. Before rendering the child page, it checks: 1) Is user logged in? 2) Does their role match? If not → redirect.
> **WHERE USED in App.jsx:**
> ```jsx
> <Route path="/reports" element={
>     <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'AUDITOR']}>
>         <ReportsPage />
>     </ProtectedRoute>
> } />
> ```

**📌 `children` Prop — React Composition**
Whatever you put BETWEEN `<ProtectedRoute>` and `</ProtectedRoute>` becomes `props.children`. Here, `<ReportsPage />` is the children.

**📌 `.includes()` — Array Search**
`['ADMIN', 'MANAGER'].includes('TOURIST')` → `false` → redirect.
`['ADMIN', 'MANAGER'].includes('ADMIN')` → `true` → render page.

---

# 5️⃣ FILE: NotificationContext.jsx — Global State

### YOUR ACTUAL CODE:
```jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../services/api';

const NotificationContext = createContext({
    unreadCount: 0, latestNotification: null, notifications: [], refresh: () => {},
});

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const intervalRef = useRef(null);

    const refresh = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) { setUnreadCount(0); return; }
        try {
            const res = await notificationApi.getUnread();
            const data = Array.isArray(res.data) ? res.data : [];
            setUnreadCount(data.length);
            setLatestNotification(data.length > 0 ? data[0] : null);
        } catch (err) { /* silently fail */ }
    }, []);

    useEffect(() => {
        refresh();
        intervalRef.current = setInterval(refresh, 30000);
        return () => clearInterval(intervalRef.current);
    }, [refresh]);

    return (
        <NotificationContext.Provider value={{ unreadCount, latestNotification, notifications, refresh }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
```

### EVERY CONCEPT IN THIS FILE:

**📌 `createContext()` — Context API**
Creates a "data channel" that any child component can read from. No need to pass props through every level (prop drilling).
> **Flow:** `App.jsx` wraps app in `<NotificationProvider>` → Navbar reads `unreadCount` → NotificationsPage calls `refresh()`.

**📌 `useCallback(fn, [])` — Cached Function**
Without `useCallback`, the `refresh` function is recreated every render. Since `refresh` is a dependency of `useEffect`, recreating it would restart the interval every render = infinite loop. `useCallback` with `[]` creates it ONCE.
> **WHERE USED:** `refresh` function — consumed by polling useEffect and child components.

**📌 `useRef(null)` — Mutable Ref Without Re-render**
`intervalRef.current = setInterval(...)` stores the interval ID. Unlike `useState`, changing `.current` does NOT trigger re-render. We need the ID only for cleanup — no reason to re-render when it changes.
> **Interview Q:** "Why useRef instead of useState for interval ID?" → "useState would trigger a re-render which would fire useEffect again, creating a new interval, triggering another re-render — infinite loop."

**📌 `setInterval(refresh, 30000)` — Polling**
Calls `refresh()` every 30 seconds to check for new notifications.
> **Interview Q:** "Why polling instead of WebSocket?" → "Polling is simpler and reliable. 30-second delay is acceptable for a government admin system. WebSocket adds connection management complexity."

**📌 `return () => clearInterval()` — useEffect Cleanup**
When the component unmounts (user logs out, navigates away), this runs. Stops the interval timer. Without this = **memory leak** — the timer keeps running even after the component is gone.

**📌 `Array.isArray(res.data) ? res.data : []` — Type Safety**
If API returns unexpected data (null, object instead of array), this prevents `.length` from crashing.

---

# 6️⃣ BACKEND: NotificationController.java

### YOUR ACTUAL CODE:
```java
@Slf4j
@RestController
@RequestMapping("/tourismgov/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>> getAll(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationService.getAll(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
            @PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }

    @PostMapping
    public ResponseEntity<NotificationResponseDTO> create(
            @Valid @RequestBody NotificationRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(request));
    }

    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcast(@Valid @RequestBody NotificationRequestDTO request) {
        notificationService.sendGlobalNotification(request);
        return ResponseEntity.ok("Broadcast sent successfully to all users.");
    }
}
```

### EVERY ANNOTATION EXPLAINED:

| Annotation | Meaning | Why |
|---|---|---|
| `@RestController` | This class handles HTTP requests and returns JSON | Combines `@Controller` + `@ResponseBody` |
| `@RequestMapping("/tourismgov/v1/notifications")` | Base URL path for all endpoints in this controller | Every method's URL starts with this |
| `@RequiredArgsConstructor` | Lombok generates constructor for `final` fields | Spring uses this constructor to inject `notificationService` — this is **Dependency Injection** |
| `@Slf4j` | Lombok generates a `log` variable | `log.info("message")` for logging |
| `@GetMapping` | HTTP GET method | Read data — fetching notifications |
| `@PatchMapping("/{id}/read")` | HTTP PATCH with path variable | Partial update — changing only the status field |
| `@PostMapping` | HTTP POST method | Create new resource |
| `@RequestHeader("X-User-Id")` | Read value from HTTP header | Gateway puts userId here after decoding JWT |
| `@PathVariable Long id` | Extract `{id}` from URL | `/notifications/5/read` → `id = 5` |
| `@RequestBody` | Parse JSON body into Java object | Frontend sends `{ subject: "Hi", message: "..." }` → becomes `NotificationRequestDTO` |
| `@Valid` | Trigger validation annotations on the DTO | Checks `@NotBlank`, `@Size` etc. Returns 400 if invalid |
| `ResponseEntity.ok()` | Return HTTP 200 OK | Standard success response |
| `HttpStatus.CREATED` | Return HTTP 201 Created | Used for POST — new resource was created |

---

# 7️⃣ BACKEND: Notification.java — JPA Entity

### YOUR ACTUAL CODE:
```java
@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotBlank(message = "Subject is required")
    @Size(max = 100)
    @Column(name = "subject", nullable = false, length = 100)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private NotificationCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private NotificationStatus status;

    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
        if (this.status == null) this.status = NotificationStatus.UNREAD;
    }
}
```

| Annotation | What it does |
|---|---|
| `@Entity` | Tells JPA "this class maps to a database table" |
| `@Table(name = "notifications")` | Maps to the `notifications` table in MySQL |
| `@Id` | This field is the primary key |
| `@GeneratedValue(IDENTITY)` | MySQL auto-generates IDs (AUTO_INCREMENT) |
| `@Column(nullable = false)` | Creates `NOT NULL` constraint in database |
| `@Enumerated(EnumType.STRING)` | Stores enum as text `'UNREAD'` not number `0` — safer if enum order changes |
| `@PrePersist` | Runs automatically BEFORE every INSERT — sets `createdDate` and default `UNREAD` status |
| `@Builder` | Lombok generates builder: `Notification.builder().subject("Hi").build()` |

---

# 8️⃣ BACKEND: Feign Clients — Inter-Service Communication

### NotificationClient.java (in ReportingService):
```java
@FeignClient(name = "NOTIFICATION-SERVICE")
public interface NotificationClient {
    @PostMapping("/tourismgov/v1/notifications")
    void createNotification(@RequestBody NotificationRequestDTO request);

    @PostMapping("/tourismgov/v1/notifications/broadcast")
    void sendGlobalBroadcast(@RequestBody NotificationRequestDTO request);
}
```

### UserClient.java (in NotificationService):
```java
@FeignClient(name = "USER-SERVICE")
public interface UserClient {
    @GetMapping("/tourismgov/v1/users/internal/{id}")
    UserDTO getUserById(@PathVariable("id") Long id);

    @GetMapping("/tourismgov/v1/users/internal/all")
    List<UserDTO> getAllUsers();
}
```

**📌 `@FeignClient(name = "NOTIFICATION-SERVICE")` — Declarative HTTP Client**
You write an **interface** — Spring generates the HTTP client automatically. The `name` matches the service name registered in Eureka. Feign asks Eureka "Where is NOTIFICATION-SERVICE?" → gets the IP:port → makes the HTTP call.
> **WHERE USED:** ReportingService has 7 Feign clients (Site, Event, Program, Compliance, User, Booking, Notification). NotificationService has 1 (UserClient for broadcast).

**📌 Why interface, not class?**
You never write the implementation. Spring + Feign auto-generate it at runtime using the annotations. This is the **declarative programming** style.

