# 🎤 Project Script — Sound Like You BUILT It (4 Min)

---

**[0:00]** "So I worked on a **Tourism Government Management System** — it's a full-stack platform where government officials manage heritage sites, cultural events, programs, and tourists. We have 6 different roles — Admin, Program Manager, Tourism Officer, Auditor, Compliance Officer, and Tourist — and each role gets a completely different experience in the UI.

**[0:20]** We went with **microservices** — 7 Spring Boot services, each with its own database. The reason we didn't use a monolith is because services like EventBookingService can get heavy traffic during festival seasons, and we wanted to **scale them independently**. All services register with **Eureka**, and the frontend talks only to the **API Gateway** — it never hits a service directly. The Gateway does JWT validation, extracts `X-User-Id` and `X-User-Roles` from the token, and forwards them as request headers — so downstream services don't need to decode the JWT themselves, they just read `@RequestHeader`. This keeps the **security logic centralized** in one place.

**[0:55]** On the frontend, React with Vite. One important thing I did in `api.js` is an **axios interceptor** — every outgoing request automatically gets the Bearer token attached. So no component ever manually handles auth headers — it's one place, all requests covered. **Single responsibility**.

**[1:10]** Now my modules — starting with the **Dashboard**. The key decision here was using `Promise.all` for the 5 data-fetching calls. Initially I wrote them sequentially — each `await` one after another — and the page took almost 3 seconds to load. Switching to `Promise.all` made them **fire in parallel**, so it dropped to under 500ms — basically the speed of the slowest single API. But the catch was — if even one fails, `Promise.all` rejects everything. So I added individual `.catch()` on each promise returning empty data as fallback. That way if, say, ProgramService is down for deployment, the dashboard still loads — it just shows zero for programs. The **RBAC** is a `switch/case` on the user role — same component, same data structure, just different filtered arrays per role.

**[1:55]** The **Notification System** — this one I'm most proud of because it's truly **end-to-end**. On the backend, notifications are **not** created by the user — they're triggered by **other services via Feign**. When SiteService creates a new heritage site, the SiteController calls `NotificationClient.create()` which hits our NotificationService. So it's real **event-driven** inter-service communication. The entity uses `@PrePersist` to auto-set `createdDate` and default `UNREAD` status — so the service layer doesn't need to worry about it.

**[2:25]** The tricky part was the frontend. I needed the **bell icon badge in the Navbar** to stay in sync with the **Notifications page** — two completely different components. Initially I tried passing callbacks through props, but it got messy with 3-4 levels of prop drilling. So I moved to **React Context** — `NotificationProvider` wraps the entire app, polls unread count every 30 seconds with `setInterval`, and any component can call `refresh()`. I store the interval ID in a `useRef` — not `useState` — because updating a ref doesn't trigger a re-render, which would cause an infinite loop with the polling. When someone marks a notification as read, I do the PATCH call, update local state immutably using spread — `{ ...n, status: 'READ' }` inside a `.map()` — then call `refresh()` from context. Bell updates instantly, no page reload.

**[3:10]** The **Report module** shows **inter-service aggregation** most clearly. The ReportingService has **7 Feign clients** — when you generate a SITE report, it calls SiteClient to get all heritage sites, aggregates the data, persists a Report entity, and then calls NotificationClient to alert the user that their report is ready. So a single user action touches 3 services — frontend → ReportingService → SiteService + NotificationService.

**[3:30]** For the download, the backend returns `byte[]` with `APPLICATION_OCTET_STREAM` content type. On the frontend I receive it as a **Blob** — the reason is, axios defaults to parsing JSON, but binary data breaks if parsed as text. So `responseType: 'blob'` is critical. Then I do `createObjectURL`, hidden anchor click, clean up — no third-party download library needed. The report history has a search bar where I used `useMemo` instead of computing filtered results on every render — the filter only runs when `history` or `searchQuery` actually change.

**[3:55]** One challenge that taught me a lot — Feign failures cascading. If NotificationService was down, creating a heritage site would **also fail** because the Feign call threw an exception inside SiteService. The fix was making notification calls non-blocking with proper fallback handling — a site creation shouldn't fail just because a notification couldn't be sent. That's when I really understood why **circuit breakers** and **fallbacks** matter in microservices."

**[4:05]** "That's the overview — happy to dive into any part."

---

> ✅ This version makes interviewer think: "He actually built this. He knows the WHY behind every decision."

