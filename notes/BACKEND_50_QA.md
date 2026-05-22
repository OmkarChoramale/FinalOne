# 📘 TOP 50 BACKEND INTERVIEW Q&A — With Your Code

---

## 🔹 SPRING BOOT (Q1–Q10)

### Q1: What is Spring Boot?
Spring Boot is a framework on top of Spring that **auto-configures** everything. You add `spring-boot-starter-data-jpa` → it auto-configures DataSource, Hibernate, EntityManager. No XML needed.

**Your project:** All 7 services are Spring Boot apps. Each has `@SpringBootApplication` which combines 3 annotations:
```java
@SpringBootApplication  // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class NotificationServiceApplication { ... }
```

---

### Q2: What is `@RestController` vs `@Controller`?
`@Controller` returns a **view** (HTML page). `@RestController` returns **data** (JSON).

`@RestController` = `@Controller` + `@ResponseBody`

**Your code:**
```java
@RestController  // Every method returns JSON, not a view
@RequestMapping("/tourismgov/v1/notifications")
public class NotificationController { ... }
```

---

### Q3: What is Dependency Injection? How do you use it?
Instead of creating objects with `new`, Spring **creates and injects** them for you. This is called IoC (Inversion of Control).

**Your code uses constructor injection via Lombok:**
```java
@RequiredArgsConstructor  // Lombok generates constructor for 'final' fields
public class NotificationController {
    private final NotificationService notificationService;  // Spring injects this
}
```
**Why constructor over @Autowired?** Constructor injection makes dependencies explicit, fields can be `final` (immutable), and it's easier to unit test with mocks.

---

### Q4: What are Spring Boot Profiles?
Profiles let you have different configs for different environments.
```properties
# application-dev.properties  → for local development
# application-prod.properties → for production
spring.profiles.active=dev
```
Your project uses `application.properties` for each service with environment-specific DB URLs.

---

### Q5: What is `@RequestHeader`? Why do you use it?
It reads a value from the HTTP request header.

**Your code:**
```java
@GetMapping
public ResponseEntity<List<NotificationResponseDTO>> getAll(
        @RequestHeader("X-User-Id") Long userId) {     // ← Reads header injected by Gateway
    return ResponseEntity.ok(notificationService.getAll(userId));
}
```
**Why:** The API Gateway extracts `userId` from JWT and puts it in `X-User-Id` header. Controllers just read the header — they never touch JWT directly. This is the **Trusted Subsystem Pattern**.

---

### Q6: Explain `@Valid` and Bean Validation.
`@Valid` triggers validation annotations on the DTO before the method runs.

```java
@PostMapping
public ResponseEntity<NotificationResponseDTO> create(
        @Valid @RequestBody NotificationRequestDTO request) {  // ← @Valid checks DTO fields
```

If the DTO has:
```java
@NotBlank(message = "Subject is required")
@Size(max = 100)
private String subject;
```
And client sends `{ "subject": "" }` → Spring returns **400 Bad Request** automatically with the error message. Controller method never executes.

---

### Q7: What is `ResponseEntity`? Why not just return the object?
`ResponseEntity` gives you control over **status code**, **headers**, and **body**.

**Your code:**
```java
// 201 CREATED — for POST (new resource created):
return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(request));

// 200 OK — for GET (returning data):
return ResponseEntity.ok(notificationService.getAll(userId));

// 200 OK with custom headers — for file download:
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
headers.setContentDisposition(ContentDisposition.attachment()
        .filename("Tourism_Report_" + id + ".txt").build());
return new ResponseEntity<>(data, headers, HttpStatus.OK);
```

---

### Q8: What is `@Slf4j`?
Lombok annotation that auto-generates a logger. Instead of writing:
```java
private static final Logger log = LoggerFactory.getLogger(ReportController.class);
```
You just write `@Slf4j` and use `log.info()`, `log.warn()`, `log.error()` directly.

**Your code:**
```java
@Slf4j
public class ReportController {
    log.info("Generating {} report for User: {}", request.getScope(), userId);
}
```

---

### Q9: What is `@RequestParam` vs `@PathVariable`?
**@PathVariable** → part of URL: `/reports/download/5` → `id = 5`
**@RequestParam** → query string: `/reports/history?scope=SITE` → `scope = SITE`

**Your code uses both:**
```java
// PathVariable — required, part of URL structure:
@GetMapping("/download/{id}")
public ResponseEntity<byte[]> download(@PathVariable Long id) { ... }

// RequestParam — optional, for filtering:
@GetMapping("/history")
public ResponseEntity<List<ReportSummaryDTO>> getHistory(
        @RequestParam(required = false) ReportScope scope,       // optional filter
        @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate date) { ... }
```

---

### Q10: What is `spring.jpa.hibernate.ddl-auto=update`?
It controls how Hibernate handles table creation:
```
create      → DROP + CREATE tables every time (destroys data)
update      → ADD new columns/tables, never drops (safe for dev)
validate    → Only CHECK if tables match entities (safe for prod)
none        → Do nothing
```
**Your ReportingService uses `update`** — Hibernate auto-creates/updates tables based on your `@Entity` classes.

---

## 🔹 MICROSERVICES (Q11–Q20)

### Q11: Why microservices instead of monolith?
| Monolith | Microservices (Your project) |
|---|---|
| One deploy breaks everything | Deploy services independently |
| Scale everything together | Scale only EventBookingService during festivals |
| One team, one codebase | Different teams work on different services |
| One DB | Each service has own DB |

**Your project:** 7 services, each with its own MySQL database (notificationdb, reportdb, etc.)

---

### Q12: What is Eureka and how does it work?
Eureka is a **Service Registry**. Services register their address on startup.

**Your Eureka Server:**
```java
@EnableEurekaServer   // Just this one annotation
public class EurekaServerApplication { ... }
```

**Your config:**
```properties
eureka.client.register-with-eureka=false  # I am the registry, don't register with myself
eureka.client.fetch-registry=false         # Don't fetch from myself
eureka.server.enable-self-preservation=true
```

**Each microservice registers by adding:**
```properties
eureka.instance.prefer-ip-address=true
eureka.instance.instance-id=${spring.cloud.client.ip-address}:${spring.application.name}:${server.port}
```

---

### Q13: What does `lb://` mean in Gateway routes?
`lb://` = **Load Balanced**. Gateway doesn't hardcode the IP — it asks Eureka.

```properties
spring.cloud.gateway.routes[3].uri=lb://NOTIFICATION-SERVICE
```
Gateway → asks Eureka "Where is NOTIFICATION-SERVICE?" → gets `192.168.1.5:7070` → forwards request.

---

### Q14: What is a Gateway Predicate?
A condition that decides which route matches.

```properties
spring.cloud.gateway.routes[3].predicates[0]=Path=/tourismgov/v1/notifications/**
```
If URL matches `/tourismgov/v1/notifications/**` → route to NOTIFICATION-SERVICE.

---

### Q15: What is a Gateway Filter?
Code that runs **before/after** the request is forwarded.

```properties
spring.cloud.gateway.routes[3].filters[0]=Authentication
```
Your `AuthenticationGatewayFilterFactory` runs BEFORE forwarding — validates JWT, injects headers.

---

### Q16: What is the RouteValidator? Why open some endpoints?
It decides which routes need JWT and which don't.

**Your code:**
```java
public static final List<String> openApiEndpoints = List.of(
    "/tourismgov/v1/auth/register",   // Login doesn't have token yet
    "/tourismgov/v1/auth/login",       // Registration doesn't have token yet
    "/eureka"
);

public Predicate<ServerHttpRequest> isSecured = request -> {
    String path = request.getURI().getPath();
    // GET /events is public (tourists can browse without login)
    if (path.contains("/events") && HttpMethod.GET.equals(method)) {
        if (!path.contains("/bookings")) return false;
    }
    return openApiEndpoints.stream().noneMatch(uri -> path.contains(uri));
};
```

---

### Q17: What is `Predicate<T>` in Java?
A functional interface that takes an input and returns `true/false`.

```java
Predicate<ServerHttpRequest> isSecured = request -> {
    return true;  // or false
};
// Usage:
if (validator.isSecured.test(exchange.getRequest())) { ... }
```

---

### Q18: What is Config Server and why use it?
Centralized configuration — all service configs stored in ONE Git repo.

```java
@EnableConfigServer
public class ConfigServerApplication { ... }
```
```properties
spring.cloud.config.server.git.uri=https://github.com/.../configserver.git
```
**Why?** Change a DB password → update in Git → all services pick it up. No redeploying 7 services.

---

### Q19: What does `optional:configserver:` mean?
```properties
spring.config.import=optional:configserver:http://localhost:8181
```
`optional:` means → if Config Server is down, use LOCAL properties. Without `optional:`, service would FAIL to start.

---

### Q20: How do your services discover each other?
```
1. Each service starts → registers with Eureka (name + IP + port)
2. Feign client asks Eureka for target service address
3. Eureka returns current IP:port
4. Feign makes HTTP call to that address
```
No hardcoded URLs anywhere.

---

## 🔹 OPENFEIGN & FALLBACK (Q21–Q30)

### Q21: What is OpenFeign?
A **declarative HTTP client** — you write an interface, Spring generates the implementation.

```java
@FeignClient(name = "SITE-SERVICE", fallback = SiteClientFallback.class)
public interface SiteClient {
    @GetMapping("/tourismgov/v1/sites")
    List<SiteDTO> getAllSites();
}
```
You NEVER write the HTTP call. Feign auto-generates: `GET http://<eureka-resolved-ip>/tourismgov/v1/sites`.

---

### Q22: How do you enable Feign?
Two steps:
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```
```java
@EnableFeignClients   // On main class
public class ReportingServiceApplication { ... }
```

---

### Q23: What is a Feign Fallback?
A class that implements the same Feign interface but returns **default/empty data** when the target service is DOWN.

**Your code:**
```java
@Component
@Slf4j
public class SiteClientFallback implements SiteClient {
    @Override
    public List<SiteDTO> getAllSites() {
        log.warn("FALLBACK: SiteService unavailable. Returning empty list.");
        return Collections.emptyList();  // ← Returns [] instead of crashing
    }
}
```

---

### Q24: How do you connect fallback to the client?
```java
@FeignClient(name = "SITE-SERVICE", fallback = SiteClientFallback.class)
//                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
public interface SiteClient { ... }
```
When SiteService is down → Spring calls `SiteClientFallback.getAllSites()` instead.

---

### Q25: What is `contextId` and why did you use it?
Two Feign clients (`EventClient` and `BookingClient`) both target `EVENTBOOKING-SERVICE`. Spring creates beans by service name → name clash. `contextId` gives each a unique bean name.

```java
@FeignClient(name = "EVENTBOOKING-SERVICE", contextId = "eventClient", ...)
public interface EventClient { ... }

@FeignClient(name = "EVENTBOOKING-SERVICE", contextId = "bookingClient", ...)
public interface BookingClient { ... }
```

---

### Q26: What happens when Feign call fails WITHOUT fallback?
`FeignException` is thrown → propagates up → controller returns **500 Internal Server Error** to frontend. The PRIMARY operation (like site creation) also fails.

---

### Q27: What happens WITH fallback?
Fallback method runs → returns empty list/logs warning → primary operation **continues successfully** → user gets partial data instead of error.

---

### Q28: How many Feign clients does your ReportingService have?
**7 Feign clients**, all with fallbacks:
```
SiteClient      → SITE-SERVICE         (SiteClientFallback)
EventClient     → EVENTBOOKING-SERVICE  (EventClientFallback)
BookingClient   → EVENTBOOKING-SERVICE  (BookingClientFallback)
ProgramClient   → PROGRAM-SERVICE       (ProgramClientFallback)
ComplianceClient→ COMPLIANCE-SERVICE    (ComplianceClientFallback)
UserClient      → USER-SERVICE          (UserClientFallback)
NotificationClient→ NOTIFICATION-SERVICE (NotificationClientFallback)
```

---

### Q29: Fallback vs Circuit Breaker — what's the difference?
| Fallback | Circuit Breaker |
|---|---|
| Always catches failure | Tracks failure RATE |
| Every failed call hits the target service | After threshold, STOPS calling target |
| Simple | Has 3 states: CLOSED → OPEN → HALF-OPEN |
| No auto-recovery tracking | Auto-tests and recovers |

**Your project uses Fallback.** Circuit Breaker (Resilience4j) would be the next step.

---

### Q30: What is `@EnableAsync` on your NotificationService?
```java
@EnableAsync
public class NotificationServiceApplication { ... }
```
Enables async method execution. Methods marked with `@Async` run in a **separate thread** — the caller doesn't wait. Useful for sending notifications in background without blocking the main request.

---

## 🔹 JWT SECURITY (Q31–Q37)

### Q31: How does JWT authentication work in your project?
```
Login → UserService generates JWT with { userId, roles, email }
     → Frontend stores in localStorage
     → Every request: axios interceptor adds "Authorization: Bearer eyJ..."
     → Gateway reads header → validates signature → extracts claims
     → Adds X-User-Id, X-User-Roles headers → forwards to service
     → Service reads @RequestHeader("X-User-Id") → queries own DB
```

---

### Q32: Show me the JWT validation code.
```java
@Component
public class JwtUtil {
    private static final String SECRET = "bAW23OfGJzdzDw6XmZrCvxUrAWe1DjhOLvYUY7jMDqT";

    public void validateToken(final String token) {
        Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token);
        // If signature doesn't match → throws exception → Gateway returns 401
    }

    public Claims getClaims(final String token) {
        return Jwts.parserBuilder().setSigningKey(getSignKey())
                .build().parseClaimsJws(token).getBody();
    }

    private Key getSignKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());  // Same key as UserService
    }
}
```

---

### Q33: Why must Gateway and UserService use the SAME secret key?
UserService SIGNS the token with `SECRET`. Gateway VERIFIES the signature with the same `SECRET`. Different keys → verification fails → 401 for every request.

---

### Q34: Why validate JWT in Gateway only, not in each service?
**Centralized security.** If you change the secret or add a claim, update ONE place. Services trust Gateway-injected headers — this is the **Trusted Subsystem Pattern**.

---

### Q35: What is `exchange.mutate()` in the Gateway filter?
Spring Cloud Gateway uses **immutable** request objects. You can't modify the original request. `mutate()` creates a modified COPY with new headers added.

```java
exchange = exchange.mutate()
    .request(exchange.getRequest().mutate()
        .header("X-User-Id", userId)
        .header("X-User-Roles", roles)
        .build())
    .build();
```

---

### Q36: What if JWT expires?
`jwtUtil.validateToken()` throws `ExpiredJwtException`. The catch block returns **401 Unauthorized**. Frontend gets 401 → redirects to login.

---

### Q37: What is CORS and why did you configure it?
**Cross-Origin Resource Sharing.** Browser blocks requests from `localhost:5173` (React) to `localhost:8383` (Gateway) because they're different origins. Gateway must explicitly allow it:
```properties
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowed-origins=http://localhost:5173
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowed-methods=GET,POST,PUT,PATCH,DELETE,OPTIONS
```

---

## 🔹 JPA & DATABASE (Q38–Q43)

### Q38: What is `@PrePersist`?
JPA lifecycle callback that runs **before every INSERT**.

```java
@PrePersist
protected void onCreate() {
    this.createdDate = LocalDateTime.now();
    if (this.status == null) this.status = NotificationStatus.UNREAD;
}
```
You NEVER manually set createdDate — it's guaranteed by the entity itself.

---

### Q39: `@Enumerated(STRING)` vs `@Enumerated(ORDINAL)`?
```java
@Enumerated(EnumType.STRING)   // Stores "UNREAD" in DB ← Your choice
@Enumerated(EnumType.ORDINAL)  // Stores 0 in DB
```
**STRING is safer.** If you add a new enum between existing ones, ordinal values shift. "UNREAD" string never changes.

---

### Q40: How does Spring Data JPA auto-generate queries?
```java
List<Notification> findByUserIdOrderByCreatedDateDesc(Long userId);
// → SELECT * FROM notifications WHERE user_id = ? ORDER BY created_date DESC

List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);
// → SELECT * FROM notifications WHERE user_id = ? AND status = ?
```
Spring parses the method name and generates SQL. No query writing needed.

---

### Q41: What is `database-per-service` pattern?
Each microservice has its own database:
```
NotificationService → notificationdb
ReportingService    → reportdb
UserService         → userdb
```
**Rule:** Service A NEVER queries Service B's database directly. It calls Service B's API via Feign.

---

### Q42: What is `createDatabaseIfNotExist=true`?
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/notificationdb?createDatabaseIfNotExist=true
```
If `notificationdb` doesn't exist in MySQL, it auto-creates it on startup. Saves manual DB setup.

---

### Q43: What is the N+1 query problem?
Fetching a list + each item's relation = 1 + N queries.
```
SELECT * FROM orders       → 1 query
SELECT * FROM items WHERE order_id = 1  → query 2
SELECT * FROM items WHERE order_id = 2  → query 3
... N more queries
```
**Fix:** `JOIN FETCH` or `@EntityGraph`. Your entities are flat (no nested relations), so N+1 doesn't apply.

---

## 🔹 REST API & FILE DOWNLOAD (Q44–Q47)

### Q44: How does file download work in your project?
**Backend:**
```java
@GetMapping("/download/{id}")
public ResponseEntity<byte[]> download(@PathVariable Long id) {
    byte[] data = reportService.downloadReport(id);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);  // Binary data
    headers.setContentDisposition(ContentDisposition.attachment()
            .filename("Tourism_Report_" + id + ".txt").build());  // Suggested filename
    return new ResponseEntity<>(data, headers, HttpStatus.OK);
}
```
- `APPLICATION_OCTET_STREAM` → tells browser "this is a file, not JSON"
- `ContentDisposition.attachment()` → tells browser "download it, don't display"
- `byte[]` → raw binary data

---

### Q45: GET vs POST vs PATCH vs PUT?
| Method | Your Usage | Idempotent? |
|---|---|---|
| **GET** `/notifications` | Fetch all notifications | Yes |
| **POST** `/reports/generate` | Create new report | No (creates each time) |
| **PATCH** `/notifications/{id}/read` | Update only status to READ | Yes |
| **PUT** | Full replacement (not used) | Yes |

---

### Q46: What is `@DateTimeFormat(iso = ISO.DATE)`?
Tells Spring how to parse date query parameters.
```java
@RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate date
// URL: /history?date=2026-05-22  → parsed as LocalDate(2026, 5, 22)
```

---

### Q47: Why `request.setRequesterId(userId)` in generate report?
```java
@PostMapping("/generate")
public ResponseEntity<ReportSummaryDTO> generate(
        @RequestHeader("X-User-Id") Long userId,
        @RequestBody @Valid ReportRequestDTO request) {
    request.setRequesterId(userId);  // ← SECURITY: Override with trusted header
```
**Security:** Even if client sends a fake `requesterId` in the body, we overwrite it with the Gateway-verified `X-User-Id`. Prevents users from generating reports as someone else.

---

## 🔹 DESIGN PATTERNS & SCENARIOS (Q48–Q50)

### Q48: List all design patterns in your project.
```
1.  Microservices Architecture     → 7 independent services
2.  API Gateway Pattern            → GatewayAPI handles routing + auth
3.  Service Discovery              → Eureka registry
4.  Centralized Configuration      → Config Server + Git
5.  Repository Pattern             → JpaRepository interfaces
6.  DTO Pattern                    → RequestDTO / ResponseDTO
7.  Builder Pattern                → @Builder (Lombok)
8.  Dependency Injection           → @RequiredArgsConstructor
9.  Interceptor/Filter Pattern     → JWT Gateway filter
10. Declarative Client             → @FeignClient interfaces
11. Fallback Pattern               → 7 fallback classes in ReportingService
12. Database Per Service           → Each service has own MySQL DB
13. Layered Architecture           → Controller → Service → Repository
14. Lifecycle Callback             → @PrePersist auto-sets defaults
15. Trusted Subsystem              → Services trust Gateway headers
```

---

### Q49: Scenario — NotificationService goes down. What happens?
**Without fallback:** Report generation crashes → 500 error → user sees "System generation protocol failed."

**With your fallback:**
```
User clicks Generate Report
→ ReportingService calls SiteClient.getAllSites() ✅ (SiteService is up)
→ ReportingService saves Report to DB ✅
→ ReportingService calls NotificationClient.createNotification() 
→ NotificationService is DOWN ❌
→ NotificationClientFallback activates:
   log.warn("FALLBACK: Notification skipped")
→ Report generation SUCCEEDS ✅
→ User gets report but no notification alert (non-critical)
```

---

### Q50: Scenario — How does a single request flow from frontend to backend?
```
1. User clicks "Generate SITE Report" in React
2. ReportPage.jsx → reportApi.generate({ scope: 'SITE' })
3. axios interceptor adds: Authorization: Bearer eyJ...
4. Request goes to: POST http://localhost:8383/tourismgov/v1/reports/generate

5. API Gateway receives request
6. AuthenticationGatewayFilterFactory:
   - Reads Authorization header
   - Strips "Bearer "
   - JwtUtil.validateToken() → verifies signature ✅
   - JwtUtil.getClaims() → { userId: 1, roles: "ROLE_ADMIN" }
   - Mutates request: adds X-User-Id: 1, X-User-Roles: ROLE_ADMIN
7. Predicate matches /tourismgov/v1/reports/** → routes to lb://REPORT-SERVICE
8. Gateway asks Eureka → "Where is REPORT-SERVICE?" → "192.168.1.5:9090"

9. ReportController.generate() receives request
   - @RequestHeader("X-User-Id") → userId = 1
   - @RequestBody → { scope: "SITE" }
   - Overwrites requesterId with trusted userId
10. ReportService.generateReport():
    - Calls SiteClient.getAllSites() → Feign → Eureka → SiteService → gets sites data
    - Aggregates metrics into text
    - Saves Report entity to MySQL (reportdb)
    - Calls NotificationClient.createNotification() → Feign → NotificationService
11. Returns ReportSummaryDTO with HTTP 201 CREATED

12. React receives response → triggerAlert("SITE compiled and encrypted")
13. React calls fetchHistory() → report appears in Audit Ledger
```

