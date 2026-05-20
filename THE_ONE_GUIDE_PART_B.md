# 📘 THE ONE BIG GUIDE — PART B: Frontend Modules (With Code)

---

# 9️⃣ Dashboard.jsx — Every Concept

### STEP 1: State + Data Fetching
```jsx
const Dashboard = () => {
  const [data, setData] = useState(null);      // All dashboard metrics
  const [loading, setLoading] = useState(true); // Show spinner

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
        const BASE_URL = 'http://localhost:8383/tourismgov/v1';

        const [sitesRes, programsRes, eventsRes, usersRes, bookingsPagedRes] = 
          await Promise.all([
            axios.get(`${BASE_URL}/sites`, axiosConfig).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/programs`, axiosConfig).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/events`, axiosConfig).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/users`, axiosConfig).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/bookings/paged?size=1`, axiosConfig)
              .catch(() => ({ data: { totalElements: 0 } }))
          ]);
```

**📌 `useState(null)` vs `useState({})`**
`null` means "not loaded yet". `{}` means "loaded but empty". We check `if (loading)` to show spinner and `data?.role` with optional chaining to avoid crash.

**📌 `useEffect(() => {...}, [])` — Run Once on Mount**
Empty array `[]` = run this function ONE time when component first appears. This is where we fetch data. Without `[]`, it runs on every re-render = infinite API loop.

**📌 `async/await` — Clean Async Code**
`await` pauses the function until the API responds. The function MUST be marked `async`. This replaces messy `.then().then().then()` chains.

**📌 `Promise.all([...])` — Parallel Execution**
Fires ALL 5 API calls at the same time. Without it: 500ms + 500ms + 500ms + 500ms + 500ms = 2.5 seconds. With it: max(500ms, 500ms, 500ms, 500ms, 500ms) = 500ms. **5x faster**.

**📌 `.catch(() => ({ data: [] }))` — Graceful Degradation**
If SiteService is down, instead of crashing, return fake response `{ data: [] }`. Dashboard shows 0 sites instead of error screen. Each promise has its OWN catch — so one failure doesn't kill others.

**📌 Array Destructuring `const [a, b, c] = await Promise.all([...])`**
Position 0 → sitesRes, Position 1 → programsRes, etc. Clean way to name each result.

### STEP 2: Data Processing
```jsx
        const totalSites = sitesRes.data?.length || 0;
        const activeProgs = programsRes.data?.filter
            ? programsRes.data.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNED').length
            : 0;
        const totalBookings = bookingsPagedRes.data?.totalElements || 0;
```

**📌 `?.` Optional Chaining** — If `data` is null, returns `undefined` instead of crashing.
**📌 `|| 0` OR Fallback** — If left side is falsy (null/undefined/0), use 0.
**📌 `.filter()` — Array Method** — Creates new array with only items matching the condition. Here: keep only ACTIVE or PLANNED programs, then `.length` to count them.
**📌 `.totalElements` — Spring Boot Pageable** — Backend returns `{ content: [...], totalElements: 150 }`. We read `totalElements` for total count without fetching all records.

### STEP 3: RBAC Switch/Case
```jsx
  switch (userRole) {
    case 'ADMINISTRATOR':
    case 'ADMIN':
        displayKpis = [allKpis.sites, allKpis.programs, allKpis.events, 
                       allKpis.audits, allKpis.users, allKpis.bookings]; // 6 cards
        displayModules = [allModules.touristDetail, allModules.programs, ...]; // 6 modules
        break;
    case 'TOURIST':
    default:
        displayKpis = [allKpis.programs, allKpis.events, allKpis.bookings]; // 3 cards
        displayModules = [allModules.touristDetail, allModules.programs, allModules.events];
        break;
  }
```

**📌 `switch/case` — Role-Based Access Control (RBAC)**
Same data object `allKpis`, same components — the switch just picks WHICH items each role sees. Admin sees 6, Tourist sees 3. No duplicate code.

**📌 Fall-through: `case 'ADMINISTRATOR': case 'ADMIN':`**
Both values share the same logic. This handles different role name formats from the database.

### STEP 4: Rendering with .map()
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {displayKpis.map((kpi, index) => (
    <StatCard key={index} label={kpi.label} value={kpi.value} icon={kpi.icon} color={kpi.color} />
  ))}
</div>
```

**📌 `.map()` — Transform Array to JSX**
Takes `[kpi1, kpi2, kpi3]` → returns `[<StatCard/>, <StatCard/>, <StatCard/>]`. React renders the array as visible components.

**📌 `key={index}` — React List Identity**
React needs `key` to track which items changed when array updates. Use unique ID when available, index as fallback.

**📌 Props — Parent → Child Data**
`<StatCard label="Sites" value={42} />` — parent passes data, child receives as `({ label, value }) =>`.

### STEP 5: Reusable Components
```jsx
const StatCard = ({ label, value, icon, color }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] shadow-xl">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${color}`}>
      {icon}
    </div>
    <p>{label}</p>
    <span>{value.toLocaleString()}</span>
  </motion.div>
);
```

**📌 `motion.div` — Framer Motion Animation**
Replaces `<div>`. `whileHover={{ y: -5 }}` = float up 5px on mouse hover. Smooth CSS animation without writing CSS.

**📌 `value.toLocaleString()` — Number Formatting**
`1234567` → `"12,34,567"` (Indian format). Adds comma separators automatically.

**📌 `${color}` in className — Dynamic CSS**
`color` prop is `"bg-[#1A237E]"`. Tailwind class gets inserted dynamically → different background per card.

---

# 🔟 NotificationsPage.jsx — Every Concept

### STEP 1: Context Consumption
```jsx
const { refresh: refreshGlobalCount } = useNotifications();
```

**📌 Destructuring with Rename `refresh: refreshGlobalCount`**
Extracts `refresh` from context but renames it to `refreshGlobalCount` for clarity. Now calling `refreshGlobalCount()` triggers the context's refresh → bell badge updates everywhere.

### STEP 2: Mark Single as Read (THE KEY PATTERN)
```jsx
const openNotification = async (notif) => {
    setFocusedNotif(notif);                              // Open modal
    if (notif.status === 'UNREAD') {
        await notificationApi.markAsRead(notif.notificationId);  // API: PATCH
        setNotifications(prev => prev.map(n =>           // Update LOCAL state
            n.notificationId === notif.notificationId
                ? { ...n, status: 'READ' }               // This one → change status
                : n                                       // Others → keep same
        ));
        refreshGlobalCount();                            // Update bell badge
    }
};
```

**📌 `{ ...n, status: 'READ' }` — Spread Operator (Immutable Update)**
Creates a COPY of the notification object with `status` changed to `'READ'`. The original object is NOT modified. React requires immutability — if you mutate directly, React doesn't detect the change and won't re-render.

**📌 `.map()` for Updating One Item in Array**
Loop through ALL notifications. When ID matches → return updated copy. When not → return original unchanged. Result: new array with one item changed.

**📌 `prev =>` — Functional State Update**
`setNotifications(prev => prev.map(...))` — `prev` is the CURRENT state value. This is safer than `setNotifications(notifications.map(...))` because `notifications` might be stale if multiple updates happen quickly.

### STEP 3: Triple Filter with useMemo
```jsx
const filteredList = useMemo(() => {
    return notifications.filter(n => {
        const matchesStatus = statusFilter === 'ALL' || n.status === 'UNREAD';
        const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
        const matchesSearch = searchQuery === '' || 
            n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesCategory && matchesSearch;
    });
}, [notifications, statusFilter, selectedCategory, searchQuery]);
```

**📌 `useMemo(fn, [deps])` — Cached Computation**
Only re-runs the filter when `notifications`, `statusFilter`, `selectedCategory`, or `searchQuery` changes. If parent re-renders for unrelated reasons → cached result is reused. Performance optimization.

**📌 Triple Filter with `&&` (AND)**
All 3 conditions must be `true` for a notification to appear. If any filter is set to `'ALL'` or empty, that condition always passes (`true`), effectively disabling that filter.

**📌 `.toLowerCase().includes()` — Case-Insensitive Search**
User types "heritage" → matches "New Heritage Site Created" because both are lowercased before comparison.

### STEP 4: Modal with AnimatePresence
```jsx
<AnimatePresence>
  {focusedNotif && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div onClick={() => setFocusedNotif(null)}
        className="absolute inset-0 bg-[#1A237E]/60 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="relative max-w-xl bg-white rounded-[4rem] p-12">
        <h2>{focusedNotif.subject}</h2>
        <p>{focusedNotif.message}</p>
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

**📌 `{focusedNotif && (...)}` — Conditional Rendering**
If `focusedNotif` is null → renders nothing. If it's an object → renders the modal. Clicking a notification sets it → modal appears. Clicking X/backdrop sets null → modal disappears.

**📌 `AnimatePresence` — Exit Animations**
Normal React removes elements instantly. AnimatePresence waits for the `exit` animation to finish before removing from DOM. Modal fades out smoothly instead of disappearing.

**📌 `fixed inset-0` — Full Screen Overlay**
`position: fixed` + `top:0 right:0 bottom:0 left:0` = covers the entire viewport. `z-[100]` = appears above everything else.

**📌 `backdrop-blur-xl` — Glassmorphism Effect**
Blurs the content behind the dark overlay. Modern UI technique — gives depth and focus.

---

# 1️⃣1️⃣ ReportPage.jsx — Every Concept

### Config-Driven UI:
```jsx
const SCOPES = [
  { id: 'SITE', label: 'Heritage Sites', icon: <Layers />, img: heritageSiteImg },
  { id: 'EVENT', label: 'Cultural Events', icon: <Calendar />, img: eventReportImg },
  { id: 'PROGRAM', label: 'Gov Programs', icon: <PieChart />, img: 'https://...' },
  { id: 'COMPLIANCE', label: 'Compliance Audit', icon: <ShieldCheck />, img: 'https://...' },
];
// Render: SCOPES.map(scope => <Card />)
```

**📌 Config-Driven UI — DRY Principle**
Define data as array → render with `.map()`. Want to add a 5th scope? Add one object. No new component needed.

**📌 `import heritageSiteImg from '../../assets/HeritageSiteReport.png'`**
Vite requires ES module imports for local images. String paths like `'src/assets/img.png'` won't work at runtime — Vite needs to process and hash the file during build.

### File Download (THE STAR PATTERN):
```jsx
const handleDownload = async (id) => {
    const response = await reportApi.download(id);           // blob response
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TourismGov_Brief_${id}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
```

| Line | What | Why |
|---|---|---|
| `reportApi.download(id)` | GET with `responseType: 'blob'` | Receive binary data |
| `new Blob([response.data])` | Create binary file object in memory | Blob = Binary Large Object |
| `URL.createObjectURL(blob)` | Create temporary URL `blob:http://...` | Browser can use this as file source |
| `document.createElement('a')` | Create invisible anchor tag | Need `<a>` with download attribute to trigger download |
| `link.setAttribute('download', filename)` | Set suggested filename | Browser saves with this name |
| `link.click()` | Programmatic click | Triggers the browser download dialog |
| `link.remove()` | Cleanup | Remove invisible element from DOM |

### Toast Alert with Auto-Hide:
```jsx
const triggerAlert = (msg, type = "success") => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 4000);
};
```

**📌 `setTimeout(fn, 4000)` — Delayed Execution**
Shows the toast → after 4 seconds → automatically hides it. No user action needed.

**📌 Default Parameter `type = "success"`**
If no type passed: `triggerAlert("Done")` → type defaults to `"success"`.

### Double Authorization:
```jsx
// LEVEL 1 — Route level (App.jsx):
<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'AUDITOR']}><ReportsPage /></ProtectedRoute>

// LEVEL 2 — Component level (ReportPage.jsx):
const isAuthorized = userRole !== 'TOURIST';
{!isAuthorized ? <SecurityDenied /> : <FullPage />}
```

**📌 Defense in Depth** — Even if someone bypasses ProtectedRoute (by manipulating the router), the component itself blocks unauthorized access. Two layers of security.

---

# 1️⃣2️⃣ QUICK REFERENCE — ALL CONCEPTS MAP

| Concept | Where Used | File |
|---|---|---|
| `axios.create()` | HTTP instance | api.js |
| `interceptor` | Auto-attach JWT | api.js |
| `responseType: 'blob'` | File download | api.js → reportApi |
| `jwtDecode()` | Extract role from token | auth.js |
| `createContext()` | Global notification state | NotificationContext.jsx |
| `useCallback` | Cache refresh function | NotificationContext.jsx |
| `useRef` | Store interval ID | NotificationContext.jsx |
| `setInterval` + cleanup | Polling every 30s | NotificationContext.jsx |
| `Promise.all` | 5 parallel API calls | Dashboard.jsx |
| `.catch(() => fallback)` | Graceful degradation | Dashboard.jsx |
| `switch/case` RBAC | Role-based UI filtering | Dashboard.jsx |
| `.map()` rendering | List of cards | Dashboard.jsx, NotificationsPage.jsx |
| `{ ...n, status }` spread | Immutable state update | NotificationsPage.jsx |
| `prev =>` functional update | Safe state update | NotificationsPage.jsx |
| `useMemo` | Cached filter results | NotificationsPage.jsx, ReportPage.jsx |
| Triple `.filter()` | Search + status + category | NotificationsPage.jsx |
| `AnimatePresence` | Modal enter/exit animation | NotificationsPage.jsx, ReportPage.jsx |
| `Blob + createObjectURL` | File download in browser | ReportPage.jsx |
| `setTimeout` | Auto-hide toast after 4s | ReportPage.jsx |
| Config-driven `.map()` | SCOPES array → 4 cards | ReportPage.jsx |
| `<ProtectedRoute>` | Route guard | App.jsx |
| `<Outlet>` | Nested route rendering | App.jsx (LayoutWithNavbar) |
| `@RestController` | REST API controller | NotificationController.java |
| `@RequestHeader` | Read Gateway headers | All controllers |
| `@PrePersist` | Auto-set defaults before save | Notification.java |
| `@FeignClient` | Inter-service HTTP calls | NotificationClient.java, UserClient.java |
| `@Builder` | Fluent object creation | Notification.java, Report.java |
| `@Enumerated(STRING)` | Store enum as text in DB | Notification.java |

