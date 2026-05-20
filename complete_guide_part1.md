# 🇮🇳 TOURISM GOVERNMENT SYSTEM — COMPLETE INTERVIEW GUIDE

# ══════════════════════════════════════════════
# SECTION 1: PROJECT SPEECH (4 MINUTES)
# ══════════════════════════════════════════════

"So I worked on a **Tourism Government Management System** — it's a full-stack platform where government officials manage heritage sites, cultural events, programs, and tourists. We have 6 different roles — Admin, Program Manager, Tourism Officer, Auditor, Compliance Officer, and Tourist — and each role gets a completely different experience in the UI.

We went with **microservices** — 7 Spring Boot services, each with its own database. The reason we didn't use a monolith is because services like EventBookingService can get heavy traffic during festival seasons, and we wanted to **scale them independently**. All services register with **Eureka**, and the frontend talks only to the **API Gateway** — it never hits a service directly. The Gateway does JWT validation, extracts `X-User-Id` and `X-User-Roles` from the token, and forwards them as request headers — so downstream services don't need to decode the JWT themselves, they just read `@RequestHeader`. This keeps the **security logic centralized** in one place.

On the frontend, React with Vite. One important thing I did in `api.js` is an **axios interceptor** — every outgoing request automatically gets the Bearer token attached. So no component ever manually handles auth headers — it's one place, all requests covered. **Single responsibility**.

Now my modules — starting with the **Dashboard**. The key decision here was using `Promise.all` for the 5 data-fetching calls. Initially I wrote them sequentially — each `await` one after another — and the page took almost 3 seconds to load. Switching to `Promise.all` made them **fire in parallel**, so it dropped to under 500ms — basically the speed of the slowest single API. But the catch was — if even one fails, `Promise.all` rejects everything. So I added individual `.catch()` on each promise returning empty data as fallback. That way if, say, ProgramService is down for deployment, the dashboard still loads — it just shows zero for programs. The **RBAC** is a `switch/case` on the user role — same component, same data structure, just different filtered arrays per role.

The **Notification System** — this one I'm most proud of because it's truly **end-to-end**. On the backend, notifications are **not** created by the user — they're triggered by **other services via Feign**. When SiteService creates a new heritage site, the SiteController calls `NotificationClient.create()` which hits our NotificationService. So it's real **event-driven** inter-service communication. The entity uses `@PrePersist` to auto-set `createdDate` and default `UNREAD` status — so the service layer doesn't need to worry about it.

The tricky part was the frontend. I needed the **bell icon badge in the Navbar** to stay in sync with the **Notifications page** — two completely different components. Initially I tried passing callbacks through props, but it got messy with 3-4 levels of prop drilling. So I moved to **React Context** — `NotificationProvider` wraps the entire app, polls unread count every 30 seconds with `setInterval`, and any component can call `refresh()`. I store the interval ID in a `useRef` — not `useState` — because updating a ref doesn't trigger a re-render, which would cause an infinite loop with the polling. When someone marks a notification as read, I do the PATCH call, update local state immutably using spread — `{ ...n, status: 'READ' }` inside a `.map()` — then call `refresh()` from context. Bell updates instantly, no page reload.

The **Report module** shows **inter-service aggregation** most clearly. The ReportingService has **7 Feign clients** — when you generate a SITE report, it calls SiteClient to get all heritage sites, aggregates the data, persists a Report entity, and then calls NotificationClient to alert the user that their report is ready. So a single user action touches 3 services — frontend → ReportingService → SiteService + NotificationService.

For the download, the backend returns `byte[]` with `APPLICATION_OCTET_STREAM` content type. On the frontend I receive it as a **Blob** — the reason is, axios defaults to parsing JSON, but binary data breaks if parsed as text. So `responseType: 'blob'` is critical. Then I do `createObjectURL`, hidden anchor click, clean up — no third-party download library needed.

One challenge — Feign failures cascading. If NotificationService was down, creating a heritage site would **also fail** because the Feign call threw an exception inside SiteService. The fix was making notification calls non-blocking with proper fallback handling — a site creation shouldn't fail just because a notification couldn't be sent."

---

# ══════════════════════════════════════════════
# SECTION 2: BACKEND — SPRING BOOT DEEP CONCEPTS
# ══════════════════════════════════════════════

## 2.1 What is Spring Boot?

Spring Boot is a framework built on top of the Spring Framework that **auto-configures** everything. Without Spring Boot, you'd write 50+ lines of XML config for a database connection. Spring Boot does it with 3 lines in `application.yml`.

**Key features used in your project:**
- **Auto-configuration** — detects MySQL dependency → auto-configures DataSource
- **Embedded Tomcat** — no need to deploy WAR files, just run the JAR
- **Starter dependencies** — `spring-boot-starter-web` brings in everything for REST APIs
- **Actuator** — health checks, metrics (used by Eureka for heartbeat)

---

## 2.2 Layered Architecture (Your Project Structure)

```
com.tourismgov.notification/
├── controller/     ← Receives HTTP requests, returns responses
│   └── NotificationController.java
├── service/        ← Business logic
│   └── NotificationService.java
├── repository/     ← Database operations (Spring Data JPA)
│   └── NotificationRepository.java
├── model/          ← JPA entities (maps to database tables)
│   └── Notification.java
├── dto/            ← Data Transfer Objects (request/response shapes)
│   ├── NotificationRequestDTO.java
│   └── NotificationResponseDTO.java
├── enums/          ← Constants (NotificationCategory, NotificationStatus)
├── client/         ← Feign clients (calls to other services)
│   └── UserClient.java
├── security/       ← Security configuration
└── exception/      ← Custom exception handlers
```

**Why layers?**
- **Controller** → handles HTTP, validation, response codes → NEVER has business logic
- **Service** → contains ALL business logic → doesn't know about HTTP
- **Repository** → ONLY talks to database → doesn't know about business rules
- **DTO** → decouples entity from API → entity can change without breaking API

**Interview Q: "Why use DTOs instead of returning entities directly?"**
> 1. Security — entities might have fields you don't want to expose (passwords)
> 2. Flexibility — API shape can differ from DB schema
> 3. Validation — RequestDTO has `@NotBlank`, entity has `@Column`
> 4. Versioning — change API without changing DB

---

## 2.3 Key Annotations in Your Project

### Controller Layer:
```java
@RestController              // = @Controller + @ResponseBody (returns JSON)
@RequestMapping("/tourismgov/v1/notifications")  // Base URL path
@RequiredArgsConstructor     // Lombok: generates constructor for final fields (DI)

@GetMapping                  // HTTP GET
@PostMapping                 // HTTP POST
@PatchMapping("/{id}/read")  // HTTP PATCH with path variable
@PathVariable Long id        // Extracts {id} from URL
@RequestHeader("X-User-Id")  // Reads HTTP header value
@RequestBody                 // Parses JSON body into Java object
@Valid                       // Triggers validation on the DTO
```

### Entity Layer:
```java
@Entity                      // Marks class as JPA entity (maps to DB table)
@Table(name = "notifications")  // Explicit table name
@Id                          // Primary key
@GeneratedValue(strategy = GenerationType.IDENTITY)  // Auto-increment
@Column(name = "user_id", nullable = false)  // Column mapping
@Enumerated(EnumType.STRING) // Store enum as text, not number
@PrePersist                  // Runs before INSERT — auto-set defaults
```

### Validation:
```java
@NotBlank(message = "Subject is required")  // Not null AND not empty string
@NotNull(message = "Scope is mandatory")     // Not null (for non-string)
@Size(max = 100)                             // Max length
```

### Lombok:
```java
@Getter @Setter              // Generates getters/setters for all fields
@NoArgsConstructor           // Generates empty constructor
@AllArgsConstructor          // Generates constructor with all fields
@Builder                     // Generates builder pattern: Notification.builder().subject("Hi").build()
@RequiredArgsConstructor     // Constructor for final fields only (used for DI)
@Slf4j                       // Generates logger: log.info("message")
```

**Interview Q: "What is @RequiredArgsConstructor and why use it?"**
> It generates a constructor for all `final` fields. Spring uses **constructor injection** to inject dependencies. Instead of writing:
> ```java
> private final NotificationService service;
> public NotificationController(NotificationService service) {
>     this.service = service;
> }
> ```
> Lombok generates this automatically. It's the **recommended DI approach** over `@Autowired` because it makes dependencies explicit and enables unit testing.

---

## 2.4 Spring Data JPA & MySQL

### How JPA Works:
```
Java Object (Entity) ←→ JPA/Hibernate ←→ SQL ←→ MySQL Table
```

Your `Notification.java` entity maps to a `notifications` table:
```
Java Field                    MySQL Column
─────────────────────────     ─────────────────
Long notificationId    →      notification_id BIGINT PRIMARY KEY AUTO_INCREMENT
Long userId            →      user_id BIGINT NOT NULL
String subject         →      subject VARCHAR(100) NOT NULL
String message         →      message VARCHAR(500) NOT NULL
NotificationCategory   →      category VARCHAR(50) NOT NULL  (stored as STRING)
NotificationStatus     →      status VARCHAR(20) NOT NULL
LocalDateTime          →      created_date DATETIME NOT NULL
```

### Repository (No SQL Needed!):
```java
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedDateDesc(Long userId);
    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);
}
```
Spring Data JPA **generates the SQL automatically** from method names:
- `findByUserId` → `SELECT * FROM notifications WHERE user_id = ?`
- `findByUserIdAndStatus` → `SELECT * FROM notifications WHERE user_id = ? AND status = ?`
- `OrderByCreatedDateDesc` → `ORDER BY created_date DESC`

**Interview Q: "What is the difference between JPA and Hibernate?"**
> JPA is a **specification** (set of interfaces/annotations). Hibernate is an **implementation** of JPA. Think of JPA as the interface and Hibernate as the class that implements it. Spring Data JPA adds another layer on top — auto-generating repository implementations.

---

## 2.5 @PrePersist — Lifecycle Callback

```java
@PrePersist
protected void onCreate() {
    this.createdDate = LocalDateTime.now();
    if (this.status == null) this.status = NotificationStatus.UNREAD;
}
```

This runs **automatically before every INSERT**. Benefits:
- Service layer doesn't need to set defaults
- Can't forget to set `createdDate` — it's guaranteed
- Keeps entity logic inside the entity (cohesion)

Other callbacks: `@PreUpdate`, `@PostPersist`, `@PostRemove`

---

# ══════════════════════════════════════════════
# SECTION 3: MICROSERVICES ARCHITECTURE
# ══════════════════════════════════════════════

## 3.1 What is Microservices?

Breaking one big application (monolith) into small, independent services.

| Monolith | Microservices |
|---|---|
| One codebase, one deployment | 7 separate codebases, 7 deployments |
| One database | Each service has its own database |
| One failure crashes everything | One failure affects only that service |
| Scale everything together | Scale individual services independently |
| Simple to start | Complex but flexible at scale |

---

## 3.2 Eureka Server (Service Discovery)

**Problem:** If SiteService runs on port 8081, and you hardcode that in Gateway config, what happens when SiteService moves to a different port or server?

**Solution:** Eureka — a service registry.

```
1. SiteService starts → registers with Eureka: "I'm SITE-SERVICE at localhost:8081"
2. Gateway needs to call SiteService → asks Eureka: "Where is SITE-SERVICE?"
3. Eureka responds: "It's at localhost:8081"
4. Gateway routes the request
```

Each service config has:
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
spring:
  application:
    name: NOTIFICATION-SERVICE  # This is the name used in Feign and Gateway
```

**Interview Q: "What if Eureka itself goes down?"**
> Services cache the last known registry locally. So even if Eureka is temporarily down, services can still communicate using cached addresses. In production, you'd run multiple Eureka instances for high availability.

---

## 3.3 API Gateway (Spring Cloud Gateway)

**What it does:**
1. **Single entry point** — frontend only knows `localhost:8383`
2. **JWT validation** — reads token, extracts claims
3. **Header injection** — adds `X-User-Id`, `X-User-Roles` headers
4. **Routing** — `/notifications/**` → NOTIFICATION-SERVICE

```
Frontend → http://localhost:8383/tourismgov/v1/notifications
                    │
                    ▼
              API Gateway
              ├── Reads JWT token from Authorization header
              ├── Validates signature
              ├── Extracts: userId=1, role=ADMIN
              ├── Adds headers: X-User-Id: 1, X-User-Roles: ROLE_ADMIN
              └── Routes to NOTIFICATION-SERVICE (discovered via Eureka)
                    │
                    ▼
            NotificationController receives request
            with @RequestHeader("X-User-Id") Long userId
```

**Interview Q: "Why not validate JWT in each service?"**
> Centralized security — if you change the JWT secret or add a new claim, you update ONE place (Gateway), not 7 services. Services trust the Gateway's headers — this is called the **trusted subsystem pattern**.

---

## 3.4 OpenFeign (Inter-Service Communication)

Feign is a **declarative HTTP client** — you write an interface, Spring generates the implementation.

```java
@FeignClient(name = "USER-SERVICE")      // Calls the service registered as USER-SERVICE in Eureka
public interface UserClient {
    @GetMapping("/tourismgov/v1/users/internal/{id}")
    UserDTO getUserById(@PathVariable("id") Long id);

    @GetMapping("/tourismgov/v1/users/internal/all")
    List<UserDTO> getAllUsers();
}
```

**How it works internally:**
1. Feign sees `@FeignClient(name = "USER-SERVICE")`
2. Asks Eureka: "Where is USER-SERVICE?"
3. Eureka: "localhost:8082"
4. Feign generates: `GET http://localhost:8082/tourismgov/v1/users/internal/1`
5. Parses response JSON into `UserDTO`

**Your project's Feign usage:**
| Service | Feign Client | Calls |
|---|---|---|
| NotificationService | `UserClient` | UserService — to get all user IDs for broadcast |
| ReportingService | `SiteClient` | SiteService — to get heritage site data |
| ReportingService | `EventClient` | EventBookingService — to get events |
| ReportingService | `ProgramClient` | ProgramService — to get programs |
| ReportingService | `NotificationClient` | NotificationService — to send alerts |
| ReportingService | `UserClient` | UserService — to get user info |
| ReportingService | `ComplianceClient` | ComplianceService — audit data |
| ReportingService | `BookingClient` | EventBookingService — booking stats |

**Interview Q: "What happens if the called service is down?"**
> Feign throws a `FeignException`. You handle it with:
> - **Fallback classes** — return default data when service is unavailable
> - **Circuit Breaker (Resilience4j)** — stops calling a failing service temporarily, preventing cascade failures

---

## 3.5 Config Server (Centralized Configuration)

**Problem:** Each service has its own `application.yml` with DB credentials, Eureka URL, etc. If Eureka moves to a new server, you update 7 files.

**Solution:** Config Server — one central place for all configs.

```
Services start → fetch config from Config Server → then start normally
```

**Interview Q: "What if Config Server is down when a service starts?"**
> The service fails to start. In production, you'd configure `failFast: false` to use local fallback configs, or run multiple Config Server instances.

