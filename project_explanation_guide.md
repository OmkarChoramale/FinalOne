# 🇮🇳 Tourism Government Management System — Project Explanation Guide

> Use this to explain your project beautifully in any interview.

---

## 📌 1. THE ELEVATOR PITCH (30 seconds)

> "I built a **Tourism Government Management System** — a full-stack web application for managing India's heritage sites, cultural events, government programs, and tourist registrations. It uses a **microservices architecture** with **7 Spring Boot services**, a **React frontend**, **Eureka service discovery**, a **Spring Cloud Gateway**, and a **Config Server**. My specific modules are the **Dashboard** (real-time KPI analytics), **Notification System** (real-time alerts with global state), and **Report Generation** (on-demand report creation and secure file download)."

---

## 📌 2. FULL TECH STACK TABLE

### Backend
| Technology | Purpose | Where Used |
|---|---|---|
| **Java 17** | Core language | All microservices |
| **Spring Boot 3** | Framework | REST APIs, auto-config, dependency injection |
| **Spring Cloud Gateway** | API Gateway | Single entry point on port 8383 — routes, JWT validation |
| **Spring Cloud Netflix Eureka** | Service Discovery | Services register themselves, Gateway discovers dynamically |
| **Spring Cloud Config Server** | Centralized Config | All services read config from one place |
| **Spring Data JPA / Hibernate** | ORM | Entity mapping, CRUD repositories |
| **MySQL** | Database | Persistent storage for each service |
| **Spring Security + JWT** | Authentication | Token-based stateless auth |
| **OpenFeign** | Inter-service communication | NotificationService calls UserService, ReportingService calls 7 services |
| **Lombok** | Code reduction | `@Getter`, `@Setter`, `@Builder`, `@RequiredArgsConstructor` |
| **Jakarta Validation** | Input validation | `@NotBlank`, `@Size`, `@Valid` |

### Frontend
| Technology | Purpose | Where Used |
|---|---|---|
| **React 18** | UI Framework | Component-based SPA |
| **Vite** | Build tool | Dev server + HMR (Hot Module Replacement) |
| **React Router v6** | Routing | URL → component mapping, `Outlet`, `Navigate` |
| **Axios** | HTTP client | API calls with interceptor for JWT |
| **Tailwind CSS** | Styling | Utility-first CSS classes |
| **Framer Motion** | Animations | Hover effects, modal transitions, toast alerts |
| **Lucide React** | Icons | SVG icon components |
| **jwt-decode** | JWT parsing | Decode token to extract role/userId |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Eureka Server** | Service registry — all services register + discover |
| **Config Server** | Centralized configuration management |
| **API Gateway (8383)** | Single entry, JWT filter, load balancing, routing |

---

## 📌 3. MICROSERVICES ARCHITECTURE

```
                    ┌──────────────┐
                    │ Config Server│ ← Centralized configuration
                    └──────┬───────┘
                           │ reads config
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────▼──────┐ ┌───────▼───────┐ ┌───────▼────────┐
│ Eureka Server │ │  API Gateway  │ │  React Frontend│
│ (Registry)    │ │  (port 8383)  │ │  (port 5173)   │
└───────────────┘ └───────┬───────┘ └────────┬───────┘
   ↑ register              │ routes            │ HTTP
   │                       ▼                   │
   │  ┌──────────────────────────────────┐     │
   ├──│ UserService      → /users, /auth │◄────┤
   ├──│ SiteService      → /sites        │◄────┤
   ├──│ EventBookingService → /events    │◄────┤
   ├──│ ProgramService   → /programs     │◄────┤
   ├──│ NotificationService → /notifications│◄──┤
   ├──│ ReportingService → /reports, /dashboard│◄┤
   └──│ ComplianceService→ /compliance   │◄────┘
      └──────────────────────────────────┘
            ↕ Feign (inter-service calls)
```

**Interview Explanation:**
> "All frontend requests go through the **API Gateway** on port 8383. The Gateway reads the JWT token, extracts `X-User-Id` and `X-User-Roles` headers, and routes to the correct microservice using **Eureka** for service discovery. Services communicate with each other via **OpenFeign** — for example, when a report is generated, the ReportingService uses Feign to call SiteService, EventService, and ProgramService to aggregate data, then notifies the user via NotificationService."

---

## 📌 4. MY 3 MODULES — DEEP EXPLANATION

---

### 🟦 MODULE 1: DASHBOARD (Analytics & Navigation Hub)

**What it does:** Aggregates real-time KPI metrics from multiple microservices and provides role-based navigation to system modules.

**Full-Stack Flow:**
```
React (Dashboard.jsx)
  │
  ├── useEffect on mount → fires 5 parallel API calls via Promise.all
  │     GET /sites           → SiteService      → returns site[]
  │     GET /programs        → ProgramService    → returns program[]
  │     GET /events          → EventBookingService → returns event[]
  │     GET /users           → UserService       → returns user[]
  │     GET /bookings/paged  → EventBookingService → returns {totalElements}
  │
  ├── Processes responses:
  │     totalSites    = sitesRes.data.length
  │     activeProgs   = programs.filter(ACTIVE || PLANNED).length
  │     totalEvents   = eventsRes.data.length
  │
  ├── RBAC switch/case on userRole:
  │     ADMIN   → sees 6 KPIs + 6 module cards
  │     MANAGER → sees 3 KPIs + 3 module cards
  │     TOURIST → sees 3 KPIs + 3 module cards
  │
  └── Renders: StatCard components (KPIs) + ActionCard components (module links)
```

**Key Technologies Used:**
| Tech | How |
|---|---|
| `Promise.all` | Fires 5 API calls simultaneously — reduces load time from ~2.5s to ~500ms |
| `switch/case` (RBAC) | 6 role configurations — each sees different KPIs and modules |
| `.catch(() => fallback)` | Graceful degradation — if one API fails, dashboard still works |
| `Framer Motion` | `whileHover={{ y: -5 }}` — cards float up on hover |
| Props + Component composition | `<StatCard>` and `<ActionCard>` — reusable, clean |

**Interview Answer:**
> "The Dashboard fetches real-time metrics from 5 different microservices **in parallel** using `Promise.all`, which reduces load time significantly. It implements **Role-Based Access Control** using a switch statement — an Admin sees all 6 KPI cards and 6 navigation modules, while a Tourist only sees 3 relevant ones. Each API call has a `.catch` fallback so if any service is down, the dashboard still renders with zero values instead of crashing — this is the **graceful degradation pattern**."

---

### 🔔 MODULE 2: NOTIFICATION SYSTEM (Real-time Alerts)

**What it does:** Provides a real-time notification system where users receive alerts for actions across the platform (site created, event updated, compliance audit, etc.), with global bell icon count synced across all pages.

**Full-Stack Flow:**
```
Backend Trigger (e.g., SiteService creates a heritage site)
  │
  ├── SiteService → Feign call → NotificationService.create()
  │     POST /notifications { userId, subject, message, category }
  │
  ├── NotificationService → saves to MySQL database
  │     Notification entity: { notificationId, userId, subject, message,
  │                            category (ENUM), status (UNREAD), createdDate }
  │
  └── Frontend picks it up:
       │
       ├── NotificationContext (Provider) polls GET /notifications/unread every 30s
       │     → updates unreadCount → Navbar bell badge shows "3"
       │
       ├── NotificationsPage (full page)
       │     GET /notifications → fetches ALL notifications
       │     Double filter: status (ALL/UNREAD) + category (8 categories)
       │     Click notification → PATCH /{id}/read → mark as READ
       │     → Spread operator update: { ...n, status: 'READ' }
       │     → refreshGlobalCount() → bell badge updates
       │
       └── "Mark All Read" button
             PATCH /notifications/read-all → all set to READ
             → bell badge → 0
```

**Backend Entity (Notification.java):**
```java
@Entity
@Table(name = "notifications")
public class Notification {
    @Id @GeneratedValue(strategy = IDENTITY)
    private Long notificationId;
    private Long userId;          // Recipient
    private Long entityId;        // Related entity (site/event ID)
    private String subject;       // "New Heritage Site Created"
    private String message;       // "Hampi has been added to the registry"
    @Enumerated(EnumType.STRING)
    private NotificationCategory category;  // ACTION_REQUIRED, SYSTEM_CREATE, etc.
    @Enumerated(EnumType.STRING)
    private NotificationStatus status;      // UNREAD, READ
    private LocalDateTime createdDate;      // Auto-set via @PrePersist
}
```

**Backend API Endpoints:**
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/notifications` | All notifications for logged-in user |
| GET | `/notifications/unread` | Only unread notifications |
| GET | `/notifications/category/{cat}` | Filter by category |
| PATCH | `/notifications/{id}/read` | Mark single as READ |
| PATCH | `/notifications/read-all` | Mark ALL as READ |
| POST | `/notifications` | Create targeted notification |
| POST | `/notifications/broadcast` | Broadcast to ALL users |

**Key Technologies Used:**
| Tech | How |
|---|---|
| **Context API** (React) | `NotificationProvider` shares `unreadCount` and `refresh()` globally |
| **Polling** | `setInterval(refresh, 30000)` — checks for new alerts every 30 seconds |
| **OpenFeign** (Backend) | Other services (Site, Event) call NotificationService to create alerts |
| **@PrePersist** (JPA) | Automatically sets `createdDate` and `status=UNREAD` on save |
| **X-User-Id header** | Gateway extracts from JWT → controller reads via `@RequestHeader` |
| **Spread operator** | `{ ...n, status: 'READ' }` — immutable state updates |
| **AnimatePresence** | Modal enter/exit animations |

**Interview Answer:**
> "The Notification System has two parts. On the **backend**, it's a Spring Boot microservice with a JPA entity storing notifications per user. Other services like SiteService trigger notifications via **OpenFeign** inter-service calls. On the **frontend**, I use React **Context API** to share notification state globally — the `NotificationProvider` wraps the entire app and **polls** the unread endpoint every 30 seconds. The Navbar bell icon reads `unreadCount` from context, and when users mark notifications as read on the Notifications page, I call `refreshGlobalCount()` which updates the bell badge **in real-time** across all pages. The backend identifies users via `X-User-Id` header injected by the API Gateway from the JWT token."

---

### 📊 MODULE 3: REPORT GENERATION & DOWNLOAD

**What it does:** Lets authorized users generate reports by scope (Heritage Sites, Events, Programs, Compliance), view generation history, search/filter reports, and download them as files.

**Full-Stack Flow:**
```
React (ReportPage.jsx)
  │
  ├── Authorization: ProtectedRoute checks JWT role + component checks !== TOURIST
  │
  ├── User selects scope card (SITE / EVENT / PROGRAM / COMPLIANCE)
  │     → setSelectedScope('SITE')
  │
  ├── Clicks "Generate Report"
  │     POST /reports/generate { scope: "SITE" }
  │         │
  │         ▼ Backend (ReportController.java)
  │         ├── Validates X-User-Id from Gateway header
  │         ├── ReportService.generateReport()
  │         │     ├── Uses Feign to call SiteService → gets all sites
  │         │     ├── Aggregates data into metrics string
  │         │     ├── Saves Report entity to MySQL
  │         │     └── Triggers notification via NotificationClient
  │         └── Returns 201 Created + ReportSummaryDTO
  │
  ├── Frontend shows success toast (auto-hides after 4s)
  ├── Refreshes history list
  │
  ├── Clicks "Download"
  │     GET /reports/download/{id}
  │         │
  │         ▼ Backend
  │         ├── Reads Report.metrics from DB
  │         ├── Returns byte[] with Content-Disposition: attachment
  │         │
  │         ▼ Frontend
  │         ├── responseType: 'blob' → binary data
  │         ├── new Blob([data]) → URL.createObjectURL()
  │         ├── Creates hidden <a download="filename.txt">
  │         └── Programmatic click → browser downloads file
  │
  └── Search bar filters history using useMemo + .filter()
```

**Backend Entity (Report.java):**
```java
@Entity
@Table(name = "reports")
public class Report {
    @Id @GeneratedValue(strategy = IDENTITY)
    private Long reportId;
    @Enumerated(EnumType.STRING)
    private ReportScope scope;            // SITE, EVENT, PROGRAM, COMPLIANCE
    @Column(columnDefinition = "TEXT")
    private String metrics;               // Aggregated report content
    private LocalDateTime generatedDate;
    private Long generatedByUserId;       // Who generated it
}
```

**Backend API Endpoints:**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/reports/generate` | Generate new report (aggregates data via Feign) |
| GET | `/reports/history` | Get user's report history (optional scope/date filters) |
| GET | `/reports/download/{id}` | Download report as byte[] file |

**ReportingService Feign Clients (calls 7 services):**
| Feign Client | Calls | Purpose |
|---|---|---|
| `SiteClient` | SiteService | Get heritage site data for SITE scope reports |
| `EventClient` | EventBookingService | Get event data for EVENT scope reports |
| `ProgramClient` | ProgramService | Get program data for PROGRAM scope reports |
| `ComplianceClient` | ComplianceService | Get compliance data for audits |
| `UserClient` | UserService | Get user data for metrics |
| `BookingClient` | EventBookingService | Get booking statistics |
| `NotificationClient` | NotificationService | Send "Report Generated" notification |

**Key Technologies Used:**
| Tech | How |
|---|---|
| **OpenFeign** (7 clients) | ReportingService aggregates data from ALL other services |
| **byte[] + Content-Disposition** | Backend returns file as binary with download headers |
| **Blob + createObjectURL** | Frontend creates temporary URL for file download |
| **useMemo** | Caches filtered history — only recalculates when search query changes |
| **Double authorization** | ProtectedRoute (route) + `isAuthorized` check (component) |
| **Toast with setTimeout** | Success/error alerts auto-hide after 4 seconds |
| **Config-driven UI** | SCOPES array → `.map()` renders 4 scope cards dynamically |

**Interview Answer:**
> "The Report module demonstrates **inter-service communication** — when a user generates a report, the ReportingService uses **7 OpenFeign clients** to call SiteService, EventService, ProgramService, etc. to aggregate data. The report content is stored as TEXT in MySQL. For downloading, the backend returns `byte[]` with `Content-Disposition: attachment` headers, and the frontend handles it using the **Blob + createObjectURL pattern** — creating a temporary URL and triggering download via a programmatic anchor click. The module has **double authorization** — both at the route level via `ProtectedRoute` and at the component level. I use `useMemo` for search filtering optimization so the filter only recalculates when the search query or history data actually changes."

---

## 📌 5. HOW SECURITY WORKS (End-to-End)

```
1. User logs in → POST /auth/login { email, password }
2. UserService validates → generates JWT token
   JWT Payload: { sub: "omkar@email.com", roles: "ROLE_ADMIN", userId: 1 }
3. Frontend stores token in localStorage
4. Every API call → axios interceptor attaches: Authorization: Bearer eyJ...
5. API Gateway receives request:
   ├── Reads JWT → extracts userId, role
   ├── Adds headers: X-User-Id: 1, X-User-Roles: ROLE_ADMIN
   └── Routes to correct microservice
6. Backend controller reads: @RequestHeader("X-User-Id") Long userId
7. Service logic uses userId to query user-specific data
```

**Interview Answer:**
> "I use **JWT-based stateless authentication**. The UserService generates a signed JWT on login. The frontend stores it in localStorage and an **axios interceptor** attaches it to every request. The **API Gateway** validates the JWT and injects `X-User-Id` and `X-User-Roles` headers, which backend controllers read via `@RequestHeader`. This means individual microservices don't need to validate the token themselves — the Gateway handles it centrally."

---

## 📌 6. DESIGN PATTERNS USED

| Pattern | Where | Explanation |
|---|---|---|
| **Microservices** | Backend | 7 independent services, each with own DB |
| **API Gateway** | GatewayAPI | Single entry point, JWT validation, routing |
| **Service Discovery** | Eureka | Services register/discover dynamically |
| **Interceptor** | axios `api.js` | Auto-attach JWT token to all requests |
| **Provider/Context** | NotificationContext | Global state sharing without prop drilling |
| **Guard/Middleware** | ProtectedRoute | Route-level authorization check |
| **Builder** | `@Builder` (Lombok) | Fluent entity construction in backend |
| **Repository** | Spring Data JPA | Data access abstraction |
| **DTO** | Request/Response DTOs | Decouple entity from API contract |
| **Graceful Degradation** | Dashboard `.catch()` | App works even if some services fail |
| **Config-Driven UI** | SCOPES array | Data-driven rendering with `.map()` |
| **Polling** | NotificationContext | Periodic data refresh every 30s |

---

## 📌 7. YOUR COMPLETE INTERVIEW SCRIPT

**"Tell me about your project"** (2 minutes):

> "I developed the **Tourism Government Management System**, a full-stack enterprise application for managing India's tourism infrastructure — including heritage sites, cultural events, government programs, and tourist registrations.
>
> The **backend** uses a **microservices architecture** with **7 Spring Boot services**: UserService for authentication, SiteService for heritage sites, EventBookingService for events and bookings, ProgramService for government programs, NotificationService for alerts, ReportingService for analytics, and ComplianceService for audits. All services register with **Eureka** for discovery and communicate through an **API Gateway** that handles JWT validation and routing. Services talk to each other via **OpenFeign** clients.
>
> The **frontend** is a **React SPA** built with **Vite** and styled with **Tailwind CSS**. It uses **React Router v6** for navigation with nested layouts and route protection, **Axios** with an interceptor for automatic JWT attachment, and **Context API** for global notification state.
>
> My specific modules are:
> 1. **Dashboard** — Aggregates real-time KPI metrics from 5 APIs using `Promise.all` for parallel fetching, with RBAC filtering per user role.
> 2. **Notification System** — Real-time alerts triggered via inter-service Feign calls, with Context API for global bell icon sync and 30-second polling.
> 3. **Report Generation** — On-demand report creation using 7 Feign clients to aggregate data across all services, with binary file download using the Blob pattern.
>
> Key design patterns include **Graceful Degradation** (dashboard works even if services are down), **Interceptor Pattern** (automatic JWT), **Provider Pattern** (global state), and **Guard Pattern** (route protection)."

