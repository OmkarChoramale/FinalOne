# 📘 BACKEND DEEP GUIDE — Everything For Interview

---

# 1️⃣ YOUR MICROSERVICES STARTUP ORDER

```
STEP 1: EurekaServer (port 8761)      ← Registry must start FIRST
STEP 2: ConfigServer (port 8181)      ← Config provider starts SECOND
STEP 3: GatewayAPI (port 8383)        ← Gateway registers with Eureka
STEP 4: All 7 business services       ← Each registers with Eureka
         UserService, SiteService, EventBookingService,
         ProgramService, NotificationService (7070),
         ReportingService (9090), ComplianceService
```

---

# 2️⃣ EUREKA SERVER — Service Discovery

### Your Code:
```java
@SpringBootApplication
@EnableEurekaServer        // ← This ONE annotation makes it a registry server
public class EurekaServerApplication { ... }
```

### Your Config (`application.properties`):
```properties
spring.application.name=EurekaServer
server.port=8761
eureka.client.register-with-eureka=false   # Don't register with yourself
eureka.client.fetch-registry=false          # Don't fetch from yourself
eureka.server.enable-self-preservation=true # Prevent mass eviction during network issues
```

### How It Works:
```
NotificationService starts → sends heartbeat to Eureka:
  "I am NOTIFICATION-SERVICE at 192.168.1.5:7070"

Gateway needs to call NotificationService:
  → asks Eureka: "Where is NOTIFICATION-SERVICE?"
  → Eureka responds: "192.168.1.5:7070"
  → Gateway routes the request

Every 30 seconds: each service sends heartbeat to Eureka
If heartbeat stops for 90 seconds: Eureka marks service as DOWN
```

### How to ADD Eureka to any service (3 steps):
```
1. pom.xml: Add spring-cloud-starter-netflix-eureka-client
2. Main class: Add @EnableDiscoveryClient
3. application.properties: 
   eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
   eureka.instance.prefer-ip-address=true
```

### Interview Q&A:
**Q: What is self-preservation?** → When Eureka stops receiving heartbeats from many services simultaneously (network issue), it assumes it's a network problem, NOT that services are down. It preserves the registry instead of removing them all.

**Q: What if Eureka is down?** → Services cache the last known registry. Existing connections continue working. New services can't register until Eureka recovers.

---

# 3️⃣ CONFIG SERVER — Centralized Configuration

### Your Code:
```java
@SpringBootApplication
@EnableConfigServer        // ← Makes this a config server
public class ConfigServerApplication { ... }
```

### Your Config:
```properties
server.port=8181
spring.cloud.config.server.git.uri=https://github.com/yaswanthkumaryallapu/configserver.git
spring.cloud.config.server.git.default-label=main
spring.cloud.config.server.git.clone-on-start=true
spring.cloud.config.server.git.search-paths=config
```

### How It Works:
```
Git Repository (GitHub)
  └── config/
       ├── NOTIFICATION-SERVICE.properties
       ├── REPORT-SERVICE.properties
       └── USER-SERVICE.properties

Service starts → fetches config from ConfigServer
  → ConfigServer reads from Git → returns properties
  → Service uses these properties (DB URL, credentials, etc.)
```

### How services connect to Config Server:
```properties
# In each service's application.properties:
spring.config.import=optional:configserver:http://localhost:8181
```
The `optional:` prefix means: "If Config Server is down, use local properties instead of failing."

---

# 4️⃣ API GATEWAY — Single Entry Point + JWT Security

### Your Code:
```java
@SpringBootApplication
@EnableDiscoveryClient     // ← Register with Eureka to discover services
public class GatewayApiApplication { ... }
```

### Route Configuration:
```properties
# Route 1: Notification Service
spring.cloud.gateway.routes[3].id=notification-service-route
spring.cloud.gateway.routes[3].uri=lb://NOTIFICATION-SERVICE     # lb:// = load balanced via Eureka
spring.cloud.gateway.routes[3].predicates[0]=Path=/tourismgov/v1/notifications/**
spring.cloud.gateway.routes[3].filters[0]=Authentication          # Apply JWT filter

# Route 2: Report Service
spring.cloud.gateway.routes[6].id=report-service-route
spring.cloud.gateway.routes[6].uri=lb://REPORT-SERVICE
spring.cloud.gateway.routes[6].predicates[0]=Path=/tourismgov/v1/dashboard/**,/tourismgov/v1/reports/**
spring.cloud.gateway.routes[6].filters[0]=Authentication
```

**📌 `lb://NOTIFICATION-SERVICE`** → `lb://` means **load balanced**. Gateway asks Eureka for the IP of NOTIFICATION-SERVICE, so you never hardcode ports.

**📌 `predicates`** → URL pattern matching. Any request to `/tourismgov/v1/notifications/**` goes to NotificationService.

**📌 `filters[0]=Authentication`** → Apply your custom JWT filter BEFORE forwarding.

### JWT Filter (AuthenticationGatewayFilterFactory.java):
```java
@Component
public class AuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<Config> {
    private final RouteValidator validator;
    private final JwtUtil jwtUtil;

    @Override
    public GatewayFilter apply(Config config) {
        return ((exchange, chain) -> {
            if (validator.isSecured.test(exchange.getRequest())) {
                String authHeader = exchange.getRequest().getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);     // 1. Read "Bearer eyJ..."
                
                if (authHeader == null) return onError(exchange, "Missing auth", UNAUTHORIZED);
                authHeader = authHeader.substring(7);          // 2. Remove "Bearer " prefix
                
                jwtUtil.validateToken(authHeader);             // 3. Validate signature
                Claims claims = jwtUtil.getClaims(authHeader); // 4. Extract payload
                
                exchange = exchange.mutate()
                    .request(exchange.getRequest().mutate()
                        .header("X-User-Id", claims.get("userId"))    // 5. Inject headers
                        .header("X-User-Roles", claims.get("roles"))
                        .header("X-User-Email", claims.get("email"))
                        .build()).build();
            }
            return chain.filter(exchange);  // 6. Forward to microservice
        });
    }
}
```

### The COMPLETE Security Flow:
```
React → axios interceptor adds "Authorization: Bearer eyJ..."
  → API Gateway receives request
  → AuthenticationGatewayFilterFactory runs:
     1. Reads Authorization header
     2. Strips "Bearer " prefix
     3. Validates JWT signature with secret key
     4. Extracts claims: { userId: 1, roles: "ROLE_ADMIN", email: "omkar@..." }
     5. Mutates request: adds X-User-Id: 1, X-User-Roles: ROLE_ADMIN headers
     6. Forwards to target microservice
  → NotificationController: @RequestHeader("X-User-Id") Long userId → gets 1
```

### CORS Configuration:
```properties
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowed-origins=http://localhost:5173
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowed-methods=GET,POST,PUT,PATCH,DELETE,OPTIONS
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowed-headers=*
spring.cloud.gateway.globalcors.cors-configurations.[/**].allow-credentials=true
```

**Q: What is CORS?** → Browser security that blocks requests to different origins. Frontend on `localhost:5173` calling backend on `localhost:8383` is cross-origin. Gateway must explicitly allow it.

**Q: Why allow OPTIONS?** → Before sending POST/PATCH, the browser sends a "preflight" OPTIONS request to check if the server allows it. If OPTIONS is blocked, the actual request never fires.

---

# 5️⃣ OPENFEIGN — Inter-Service Communication

### Your NotificationClient (in ReportingService):
```java
@FeignClient(name = "NOTIFICATION-SERVICE")   // ← name matches Eureka registration
public interface NotificationClient {
    @PostMapping("/tourismgov/v1/notifications")
    void createNotification(@RequestBody NotificationRequestDTO request);

    @PostMapping("/tourismgov/v1/notifications/broadcast")
    void sendGlobalBroadcast(@RequestBody NotificationRequestDTO request);
}
```

### How to ADD Feign to any service (3 steps):
```
1. pom.xml: Add spring-cloud-starter-openfeign
2. Main class: Add @EnableFeignClients
3. Create interface with @FeignClient(name = "TARGET-SERVICE")
```

### What happens internally:
```
reportService.generateReport() calls notificationClient.createNotification(dto)
  → Feign sees @FeignClient(name = "NOTIFICATION-SERVICE")
  → Asks Eureka: "Where is NOTIFICATION-SERVICE?"
  → Eureka: "192.168.1.5:7070"
  → Feign generates: POST http://192.168.1.5:7070/tourismgov/v1/notifications
  → Sends DTO as JSON body
  → If NOTIFICATION-SERVICE is down → throws FeignException
```

---

# 6️⃣ FALLBACK PATTERN — What I Added

### THE PROBLEM:
```
User clicks "Create Heritage Site"
  → SiteService creates site ✅
  → SiteService calls NotificationClient to send alert
  → NotificationService is DOWN ❌
  → FeignException thrown
  → Site creation ALSO fails ❌  ← THIS IS THE BUG
```

### THE SOLUTION — Feign Fallback:
When the target service is down, instead of crashing, use a **fallback class** that returns default/empty data.

### Fallback class for NotificationClient (in ReportingService):
```java
@Component
@Slf4j
public class NotificationClientFallback implements NotificationClient {
    @Override
    public void createNotification(NotificationRequestDTO request) {
        log.warn("FALLBACK: NotificationService is unavailable. Notification skipped for: {}",
                 request.getSubject());
        // Do nothing — notification is non-critical, site creation continues
    }

    @Override
    public void sendGlobalBroadcast(NotificationRequestDTO request) {
        log.warn("FALLBACK: Broadcast skipped — NotificationService down.");
    }
}
```

### Updated Feign Client:
```java
@FeignClient(name = "NOTIFICATION-SERVICE", fallback = NotificationClientFallback.class)
public interface NotificationClient { ... }
```

### THE RESULT:
```
User clicks "Create Heritage Site"
  → SiteService creates site ✅
  → Calls NotificationClient → NotificationService is DOWN
  → Fallback activates: logs warning, does nothing
  → Site creation SUCCEEDS ✅  ← Non-critical failure is silenced
```

---

# 7️⃣ DESIGN PATTERNS IN YOUR BACKEND

| # | Pattern | Where | Explanation |
|---|---|---|---|
| 1 | **Microservices** | Entire backend | 7 independent services with own DB |
| 2 | **API Gateway** | GatewayAPI | Single entry point, routing, JWT filter |
| 3 | **Service Discovery** | EurekaServer | Dynamic service registration & lookup |
| 4 | **Centralized Config** | ConfigServer | All configs in one Git repo |
| 5 | **Repository** | JpaRepository interfaces | Abstracts DB access behind interface |
| 6 | **DTO** | Request/Response DTOs | Decouple entity from API contract |
| 7 | **Builder** | `@Builder` (Lombok) | Fluent object construction |
| 8 | **Dependency Injection** | `@RequiredArgsConstructor` | Spring manages object creation |
| 9 | **Interceptor/Filter** | Gateway JWT filter | Pre-processes every request |
| 10 | **Declarative Client** | `@FeignClient` | Write interface, Spring generates HTTP calls |
| 11 | **Fallback** | FeignClient fallback classes | Graceful handling when service is down |
| 12 | **Database Per Service** | Each service has own DB | No shared tables between services |
| 13 | **Layered Architecture** | Controller→Service→Repository | Separation of concerns |
| 14 | **Lifecycle Callback** | `@PrePersist` | Auto-set defaults before DB insert |
| 15 | **Trusted Subsystem** | Gateway injects headers | Services trust Gateway-injected headers |

---

# 8️⃣ ALL ANNOTATIONS REFERENCE

### Spring Boot Core:
| Annotation | Meaning |
|---|---|
| `@SpringBootApplication` | = @Configuration + @EnableAutoConfiguration + @ComponentScan |
| `@Component` | Register class as Spring-managed bean |
| `@RestController` | = @Controller + @ResponseBody (returns JSON) |
| `@Service` | Marks service layer class (semantic @Component) |
| `@Repository` | Marks data access layer (semantic @Component) |

### Spring Cloud:
| Annotation | Meaning |
|---|---|
| `@EnableEurekaServer` | Makes this app a Eureka registry server |
| `@EnableDiscoveryClient` | Register this app with Eureka |
| `@EnableConfigServer` | Makes this app a centralized config server |
| `@EnableFeignClients` | Scan for @FeignClient interfaces and generate implementations |
| `@FeignClient(name="X")` | Declare a REST client for service "X" discovered via Eureka |

### REST API:
| Annotation | Meaning |
|---|---|
| `@RequestMapping("/path")` | Base URL for all endpoints in controller |
| `@GetMapping` / `@PostMapping` / `@PatchMapping` | HTTP method mapping |
| `@PathVariable` | Extract value from URL path `/{id}` |
| `@RequestParam` | Extract value from query string `?scope=SITE` |
| `@RequestHeader("X-User-Id")` | Extract value from HTTP header |
| `@RequestBody` | Parse JSON body into Java object |
| `@Valid` | Trigger bean validation |

### JPA/Database:
| Annotation | Meaning |
|---|---|
| `@Entity` | Maps class to database table |
| `@Table(name="x")` | Explicit table name |
| `@Id` | Primary key |
| `@GeneratedValue(IDENTITY)` | Auto-increment |
| `@Column(nullable=false)` | NOT NULL constraint |
| `@Enumerated(EnumType.STRING)` | Store enum as text not number |
| `@PrePersist` | Run before INSERT — set defaults |

### Validation:
| Annotation | Meaning |
|---|---|
| `@NotBlank` | Not null AND not empty string |
| `@NotNull` | Not null (for non-strings) |
| `@Size(max=100)` | Max length constraint |

### Lombok:
| Annotation | Meaning |
|---|---|
| `@Getter` / `@Setter` | Auto-generate getters/setters |
| `@NoArgsConstructor` | Empty constructor |
| `@AllArgsConstructor` | Constructor with all fields |
| `@Builder` | Builder pattern |
| `@RequiredArgsConstructor` | Constructor for final fields → DI |
| `@Slf4j` | Auto-generate `log` variable |

---

# 9️⃣ CIRCUIT BREAKER CONCEPT (Interview Knowledge)

### What Is It?
A pattern that prevents cascade failures in microservices.

```
CLOSED state (normal):
  All calls go through normally
  If failures > threshold → switch to OPEN

OPEN state (circuit tripped):
  All calls immediately return fallback
  No actual HTTP call made → protects the failing service
  After timeout → switch to HALF-OPEN

HALF-OPEN state (testing):
  Allow ONE test call through
  If succeeds → back to CLOSED
  If fails → back to OPEN
```

### How To Add (using Resilience4j):
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
```
```properties
# application.properties
resilience4j.circuitbreaker.instances.notificationService.failureRateThreshold=50
resilience4j.circuitbreaker.instances.notificationService.waitDurationInOpenState=30s
resilience4j.circuitbreaker.instances.notificationService.slidingWindowSize=10
```

### Your project currently uses Feign Fallback (simpler alternative):
- **Fallback** = always catches failure, returns default
- **Circuit Breaker** = tracks failure rate, stops calling after threshold, auto-recovers

**Q: "Do you use Circuit Breaker?"** → "Currently we use Feign Fallbacks for graceful degradation. Circuit Breaker with Resilience4j would be the next evolution — it adds automatic recovery and failure rate tracking, preventing the system from repeatedly calling a service it already knows is down."

---

# 🔟 SERVICE COMMUNICATION MAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    ReportingService (9090)                       │
│  Has 7 Feign Clients:                                           │
│  ├── SiteClient      → calls SiteService                       │
│  ├── EventClient     → calls EventBookingService                │
│  ├── ProgramClient   → calls ProgramService                    │
│  ├── ComplianceClient→ calls ComplianceService                  │
│  ├── UserClient      → calls UserService                       │
│  ├── BookingClient   → calls EventBookingService                │
│  └── NotificationClient → calls NotificationService (+ fallback)│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 NotificationService (7070)                       │
│  Has 1 Feign Client:                                            │
│  └── UserClient → calls UserService (for broadcast: get all IDs)│
│  + Fallback: if UserService down, broadcast logs warning        │
└─────────────────────────────────────────────────────────────────┘
```

