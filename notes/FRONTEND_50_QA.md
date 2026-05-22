# 📘 TOP 50 FRONTEND INTERVIEW Q&A — With Your Code

---

## 🔹 REACT HOOKS (Q1–Q15)

### Q1: What is `useState`? Show examples from your code.
`useState` stores data that can change. When you call `setState`, React **re-renders** the component with new data.

**Your code uses it everywhere:**
```jsx
// Simple values:
const [loading, setLoading] = useState(true);         // Boolean
const [searchQuery, setSearchQuery] = useState('');    // String
const [selectedScope, setSelectedScope] = useState('SITE'); // String

// Complex values:
const [data, setData] = useState(null);                // Object or null
const [notifications, setNotifications] = useState([]); // Array
const [alert, setAlert] = useState({ show: false, message: "", type: "success" }); // Object
```

---

### Q2: What is `useEffect`? Why does it have a dependency array?
`useEffect` runs **side effects** — API calls, timers, event listeners. The dependency array controls WHEN it runs.

**Your code:**
```jsx
// ✅ Empty [] → runs ONCE on mount (Dashboard.jsx):
useEffect(() => { fetchDashboardData(); }, []);

// ✅ With dependency → runs when 'refresh' changes (NotificationContext.jsx):
useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30000);
    return () => clearInterval(intervalRef.current);  // ← CLEANUP
}, [refresh]);

// ✅ Conditional fetch (ReportPage.jsx):
useEffect(() => { if (isAuthorized) fetchHistory(); }, []);
```
**Without []** → runs on EVERY render → infinite API loop!

---

### Q3: What is useEffect cleanup? Why does your code need it?
The **return function** inside useEffect runs when the component **unmounts** (removed from page).

**Your code (NotificationContext.jsx):**
```jsx
useEffect(() => {
    intervalRef.current = setInterval(refresh, 30000); // Start polling
    return () => clearInterval(intervalRef.current);    // ← Stop polling on unmount
}, [refresh]);
```
**Without cleanup:** The timer keeps running even after user logs out → **memory leak** → polling hits API for a user who doesn't exist → errors in console.

---

### Q4: What is `useContext`? How does your project use it?
`useContext` reads data from a **Context Provider** — global state without prop drilling.

**Your code:**
```jsx
// 1. CREATE context (NotificationContext.jsx):
const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });

// 2. PROVIDE (wraps entire app):
<NotificationContext.Provider value={{ unreadCount, refresh }}>
    {children}
</NotificationContext.Provider>

// 3. CONSUME — in Navbar.jsx:
const { unreadCount, latestNotification, refresh } = useNotifications();

// 4. CONSUME — in NotificationsPage.jsx:
const { refresh: refreshGlobalCount } = useNotifications();
```
**Two different components** (Navbar + NotificationsPage) read the **same unreadCount**. When NotificationsPage calls `refresh()`, Navbar's bell badge updates instantly.

---

### Q5: What is `useMemo`? Where do you use it and why?
`useMemo` caches a **computed value** — only recalculates when dependencies change.

**Your code (NotificationsPage.jsx):**
```jsx
const filteredList = useMemo(() => {
    return notifications.filter(n => {
        const matchesStatus = statusFilter === 'ALL' || n.status === 'UNREAD';
        const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
        const matchesSearch = searchQuery === '' || 
            n.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesCategory && matchesSearch;
    });
}, [notifications, statusFilter, selectedCategory, searchQuery]);
```
**Without useMemo:** Filter runs on EVERY re-render (even unrelated ones like modal open).
**With useMemo:** Filter runs ONLY when the 4 dependencies change. Performance optimization.

---

### Q6: `useMemo` vs `useCallback` — what's the difference?
- **useMemo** → caches a **value** (result of computation)
- **useCallback** → caches a **function** (reference stays same across renders)

**Your code (NotificationContext.jsx):**
```jsx
// useCallback — caches the function itself:
const refresh = useCallback(async () => {
    const res = await notificationApi.getUnread();
    setUnreadCount(res.data.length);
}, []);
```
**Why?** `refresh` is in the `useEffect` dependency array. Without `useCallback`, a new function is created every render → `useEffect` fires again → new interval → **infinite loop**.

---

### Q7: What is `useRef`? Why not `useState` for interval ID?
`useRef` stores a mutable value that **doesn't trigger re-render** when changed.

**Your code (NotificationContext.jsx):**
```jsx
const intervalRef = useRef(null);
intervalRef.current = setInterval(refresh, 30000);
```
**If you used useState instead:**
```jsx
const [intervalId, setIntervalId] = useState(null);
setIntervalId(setInterval(refresh, 30000));
// setIntervalId triggers re-render → useEffect runs again → new interval → infinite loop!
```

---

### Q8: What is `useNavigate`?
Programmatic navigation — redirect user without clicking a link.

**Your code (Navbar.jsx):**
```jsx
const navigate = useNavigate();
const handleLogout = () => {
    localStorage.clear();
    navigate('/');              // ← Redirect to home page
    window.location.reload();  // Force full page refresh
};
```

---

### Q9: What is `useLocation`?
Reads the current URL path — used for highlighting active nav links.

**Your code (Navbar.jsx):**
```jsx
const location = useLocation();
// Highlight active link:
className={location.pathname === link.path ? 'text-[#FF6D00]' : 'text-slate-600'}
```

---

### Q10: What is `useState` functional update? Where do you use it?
When the new state depends on the old state, use the `prev =>` form.

**Your code (NotificationsPage.jsx):**
```jsx
// Mark ONE as read — update specific item:
setNotifications(prev => prev.map(n => 
    n.notificationId === notif.notificationId 
        ? { ...n, status: 'READ' }   // This one → change status
        : n                           // Others → keep same
));

// Mark ALL as read:
setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
```
**Why `prev =>`?** If two state updates happen quickly, `notifications` variable might be stale. `prev` always has the LATEST state.

---

### Q11: What happens if you call `useState` setter multiple times in one event?
React **batches** state updates. All `setState` calls in one event handler result in ONE re-render.

```jsx
const handleMarkAllAsRead = async () => {
    await notificationApi.markAllAsRead();                    // API call
    setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' }))); // State update 1
    refreshGlobalCount();                                     // State update 2 (in context)
    // React batches both → ONE re-render
};
```

---

### Q12: Controlled vs Uncontrolled components?
**Controlled:** React state controls the input value.

**Your code (NotificationsPage.jsx):**
```jsx
<input 
    value={searchQuery}                          // React controls the value
    onChange={(e) => setSearchQuery(e.target.value)}  // Update state on every keystroke
/>
```
Every keystroke: `onChange` fires → `setSearchQuery` updates state → component re-renders → input shows new value.

---

### Q13: What are React keys? Why use them in lists?
Keys help React identify which items changed, added, or removed when re-rendering a list.

**Your code (Dashboard.jsx):**
```jsx
{displayKpis.map((kpi, index) => (
    <StatCard key={index} {...kpi} />  // key helps React track changes
))}
```

**Your code (NotificationsPage.jsx):**
```jsx
{filteredList.map((notif) => (
    <motion.div key={notif.notificationId} ...>  // ← Unique ID is better than index
))}
```
**Best practice:** Use unique IDs (`notificationId`), not array index. Index breaks when items are reordered/deleted.

---

### Q14: What is `!!` (double bang) operator?
Converts any value to `true` or `false`.

**Your code (Navbar.jsx):**
```jsx
const isLoggedIn = !!token;
// token = "eyJ..."  → !!token = true
// token = null       → !!token = false
```

**Your code (AuthContext.jsx):**
```jsx
<AuthContext.Provider value={{ isLoggedIn: !!user }}>
```

---

### Q15: Why `{!loading && children}` in AuthContext?
```jsx
<AuthContext.Provider value={{ user, login, logout }}>
    {!loading && children}
</AuthContext.Provider>
```
While `loading` is `true` (checking localStorage on mount), render **nothing**. Once done, render children. Prevents flash of unauthenticated content before user state is loaded.

---

## 🔹 CONTEXT API & STATE MANAGEMENT (Q16–Q22)

### Q16: What problem does Context API solve?
**Prop drilling** — passing data through 4+ component levels.

```
Without Context: App → Layout → Page → Section → Navbar → needs unreadCount
With Context:    NotificationProvider wraps app → Navbar reads directly
```

---

### Q17: How does your NotificationContext work end-to-end?
```
1. App.jsx wraps entire app in <NotificationProvider>
2. Provider runs useEffect → calls getUnread API → sets unreadCount
3. Provider starts setInterval → polls every 30 seconds
4. Navbar reads unreadCount from context → shows badge
5. NotificationsPage calls refresh() → context fetches new data → Navbar updates
```

---

### Q18: How does your AuthContext work?
```jsx
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');  // Check on mount
        if (token) setUser({ token, role, name, userId });
        setLoading(false);
    }, []);

    const login = (userData) => {
        localStorage.setItem('token', userData.token);  // Save to storage
        setUser(userData);                               // Update context
    };

    const logout = () => {
        localStorage.clear();   // Clear storage
        setUser(null);          // Reset context
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
```

---

### Q19: Why two separate contexts (Auth + Notification)?
**Single Responsibility.** AuthContext handles login/logout. NotificationContext handles alerts. If you combined them, changing notifications would re-render EVERY component that uses auth — unnecessary renders.

---

### Q20: What is a custom hook? Show your example.
A function starting with `use` that wraps `useContext`.

```jsx
export const useNotifications = () => useContext(NotificationContext);
export const useAuth = () => useContext(AuthContext);
```
**Usage:** `const { unreadCount } = useNotifications();` — cleaner than `useContext(NotificationContext)` everywhere.

---

### Q21: How does the storage event listener work?
```jsx
useEffect(() => {
    const handleStorage = () => refresh();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
}, [refresh]);
```
When another tab changes localStorage (login/logout), this fires `refresh()` to sync notification state across tabs.

---

### Q22: Context vs Redux — when would you use Redux?
| Context (Your project) | Redux |
|---|---|
| Simple shared state (unreadCount, user) | Complex state with many actions |
| Few consumers | Hundreds of components consuming |
| No time-travel debugging needed | Need dev tools, middleware |
| Small-medium apps | Large enterprise apps |

Your project has simple state — Context is the right choice.

---

## 🔹 AXIOS & API CALLS (Q23–Q28)

### Q23: What is an axios interceptor?
Code that runs **before every request** (or after every response).

**Your code (api.js):**
```jsx
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;  // Auto-attach token
    }
    return config;
});
```
**Without interceptor:** Every component manually adds the token. **With interceptor:** Write once, 100% of requests covered.

---

### Q24: What is `axios.create()` and why use it?
Creates a **custom instance** with preset config.

```jsx
const api = axios.create({
    baseURL: 'http://localhost:8383',
    headers: { 'Content-Type': 'application/json' },
});
```
Now `api.get('/notifications')` = `axios.get('http://localhost:8383/notifications')`. One place to change base URL.

---

### Q25: What is `Promise.all`? Why is it in your Dashboard?
Fires multiple async operations **in parallel**.

```jsx
const [sitesRes, programsRes, eventsRes, usersRes, bookingsRes] = await Promise.all([
    axios.get(`${BASE_URL}/sites`, config).catch(() => ({ data: [] })),
    axios.get(`${BASE_URL}/programs`, config).catch(() => ({ data: [] })),
    axios.get(`${BASE_URL}/events`, config).catch(() => ({ data: [] })),
    axios.get(`${BASE_URL}/users`, config).catch(() => ({ data: [] })),
    axios.get(`${BASE_URL}/bookings/paged?size=1`, config).catch(() => ({ data: { totalElements: 0 } }))
]);
```
**Sequential:** 500ms + 500ms + 500ms + 500ms + 500ms = **2.5 seconds**
**Promise.all:** max(500ms) = **500ms** — 5x faster!

---

### Q26: Why individual `.catch()` on each promise?
`Promise.all` rejects if ANY promise rejects. Individual `.catch()` returns fallback data → other promises continue.

```jsx
axios.get('/sites').catch(() => ({ data: [] }))  
// SiteService down → returns { data: [] } → dashboard shows 0 sites
// Other 4 APIs still succeed → dashboard shows their real data
```
This is **graceful degradation**.

---

### Q27: What is `responseType: 'blob'`?
Tells axios to treat response as **binary data** instead of JSON.

```jsx
download: (id) => api.get(`/reports/download/${id}`, {
    responseType: 'blob'   // ← Without this, binary data gets corrupted
})
```
Used for file downloads — backend returns `byte[]`, frontend receives it as a `Blob`.

---

### Q28: What is `async/await` vs `.then()` chain?
Both handle promises. `async/await` is cleaner.

```jsx
// .then() chain (messy with multiple calls):
axios.get('/api').then(res => { ... }).catch(err => { ... });

// async/await (your code — cleaner):
const fetchAlerts = async () => {
    try {
        const response = await notificationApi.getAll();
        setNotifications(response.data);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        setLoading(false);  // Always runs
    }
};
```

---

## 🔹 ARRAY METHODS & IMMUTABILITY (Q29–Q35)

### Q29: How does `.map()` work for rendering lists?
Transforms array items into JSX components.

```jsx
// Dashboard — render KPI cards:
{displayKpis.map((kpi, index) => (
    <StatCard key={index} label={kpi.label} value={kpi.value} />
))}

// Notifications — render notification items:
{filteredList.map((notif) => (
    <motion.div key={notif.notificationId}>
        <h3>{notif.subject}</h3>
    </motion.div>
))}
```

---

### Q30: How does `.filter()` work in your project?
Creates a **new array** with only items matching the condition.

```jsx
// Dashboard — count active programs:
const activeProgs = programsRes.data.filter(
    p => p.status === 'ACTIVE' || p.status === 'PLANNED'
).length;

// Notifications — triple filter:
notifications.filter(n => matchesStatus && matchesCategory && matchesSearch)
```

---

### Q31: What is the spread operator `...`? Why is it important in React?
Creates a **copy** of object/array with modifications. React needs **new references** to detect changes.

```jsx
// ❌ WRONG (mutation — React won't detect change):
notification.status = 'READ';

// ✅ CORRECT (new object — React detects change):
{ ...notification, status: 'READ' }
// Creates: { id: 1, subject: "Hi", message: "...", status: "READ" }
```

**Your code (NotificationsPage.jsx):**
```jsx
setNotifications(prev => prev.map(n => 
    n.notificationId === id ? { ...n, status: 'READ' } : n
));
```

---

### Q32: How do you update ONE item in an array immutably?
`.map()` + spread operator. Loop all items, replace the matching one.

```jsx
// Mark notification #5 as READ:
setNotifications(prev => prev.map(n => 
    n.notificationId === 5 
        ? { ...n, status: 'READ' }   // Match → create copy with new status
        : n                           // No match → keep original
));
// Result: new array, only item #5 changed, others untouched
```

---

### Q33: How do you update ALL items in an array?
```jsx
// Mark ALL as read:
setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
// Every item gets spread into a new object with status overridden
```

---

### Q34: What is `.find()` and where do you use it?
Returns the **first** matching item.

```jsx
// Find category styling for a notification:
const catStyle = categories.find(c => c.id === notif.category) || categories[0];
// If notif.category is 'ACTION_REQUIRED' → finds { id: 'ACTION_REQUIRED', color: 'bg-rose-600' }
```

---

### Q35: What is `.includes()` and where do you use it?
Checks if array/string contains a value.

```jsx
// Role check in ProtectedRoute:
allowedRoles.includes(user.role)   // ['ADMIN', 'MANAGER'].includes('TOURIST') → false

// Search filter in ReportPage:
report.scope.toLowerCase().includes(searchQuery.toLowerCase())

// Case-insensitive search in notifications:
n.subject.toLowerCase().includes(searchQuery.toLowerCase())
```

---

## 🔹 REACT ROUTER & NAVIGATION (Q36–Q39)

### Q36: What is React Router? How do you use it?
Client-side routing — URL changes but page **doesn't reload**.

```jsx
<Routes>
    <Route path="/main-dashboard" element={<Dashboard />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'AUDITOR']}>
            <ReportPage />
        </ProtectedRoute>
    } />
</Routes>
```

---

### Q37: What is `<Link>` vs `<a>` tag?
`<a>` → full page reload. `<Link>` → React Router handles it, no reload.

```jsx
<Link to="/reports">Reports</Link>     // ← SPA navigation, fast
<a href="/reports">Reports</a>          // ← Full page reload, slow
```

---

### Q38: What is ProtectedRoute (Guard Pattern)?
A component that checks auth BEFORE rendering the child page.

```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = getUser();
    if (!user) return <Navigate to="/login" replace />;   // Not logged in → redirect
    if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;  // Wrong role
    return children;  // ✅ Authorized → render the page
};
```

---

### Q39: What is `<Navigate>` component?
Declarative redirect — renders nothing, just redirects.

```jsx
if (!user) return <Navigate to="/login" replace />;
// 'replace' → replaces current entry in history (can't go back)
```

---

## 🔹 ANIMATIONS, PATTERNS & UI (Q40–Q45)

### Q40: What is Framer Motion? How do you use it?
React animation library — replaces CSS transitions.

```jsx
// Hover effect (Dashboard.jsx):
<motion.div whileHover={{ y: -5 }}>  // Float up 5px on hover

// Enter animation (NotificationsPage.jsx):
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

// Infinite rotation (ReportPage.jsx):
<motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
```

---

### Q41: What is `AnimatePresence`?
Enables **exit animations**. Normal React removes elements instantly. AnimatePresence waits for `exit` animation to finish.

```jsx
<AnimatePresence>
    {focusedNotif && (
        <motion.div exit={{ scale: 0.9, opacity: 0 }}>  // ← Smooth fade out
            <Modal />
        </motion.div>
    )}
</AnimatePresence>
// When focusedNotif becomes null → modal fades out THEN gets removed from DOM
```

---

### Q42: What is conditional rendering? Show all patterns from your code.
```jsx
// 1. Ternary (if/else):
{loading ? <Spinner /> : <Content />}

// 2. Short-circuit (if only):
{unreadCount > 0 && <span className="badge">{unreadCount}</span>}

// 3. Early return:
if (loading) return <Spinner />;
if (!isAuthorized) return <AccessDenied />;
return <MainContent />;

// 4. Ternary in className (Navbar active link):
className={statusFilter === 'ALL' ? 'bg-white text-[#FF6D00]' : 'text-slate-400'}
```

---

### Q43: What is RBAC in your Dashboard? How does `switch/case` work?
Role-Based Access Control — different UI per user role.

```jsx
switch (userRole) {
    case 'ADMIN':
        displayKpis = [sites, programs, events, audits, users, bookings]; // 6 cards
        displayModules = [tourist, programs, events, sites, compliance, reports]; // 6 modules
        break;
    case 'TOURIST':
    default:
        displayKpis = [programs, events, bookings];  // 3 cards
        displayModules = [tourist, programs, events]; // 3 modules
        break;
}
```
Same component, same data structure — switch just **filters what's visible**.

---

### Q44: What is Config-Driven UI (ReportPage)?
Define data as an array → render with `.map()`. No duplicate code.

```jsx
const SCOPES = [
    { id: 'SITE', label: 'Heritage Sites', icon: <Layers/>, img: heritageSiteImg },
    { id: 'EVENT', label: 'Cultural Events', icon: <Calendar/>, img: eventReportImg },
    { id: 'PROGRAM', label: 'Gov Programs', ... },
    { id: 'COMPLIANCE', label: 'Compliance Audit', ... },
];

// Render 4 cards from config:
{SCOPES.map(scope => <ScopeCard key={scope.id} {...scope} />)}
```
**Add 5th scope?** Add one object to array. No new component needed.

---

### Q45: How does your Toast alert work?
```jsx
const triggerAlert = (msg, type = "success") => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 4000);
};
```
Show alert → after 4 seconds → auto-hide. `setTimeout` is the delayed execution. AnimatePresence handles the exit animation.

---

## 🔹 FILE DOWNLOAD & BROWSER APIs (Q46–Q48)

### Q46: How does file download work in your frontend?
```jsx
const handleDownload = async (id) => {
    const response = await reportApi.download(id);                    // Step 1: Get binary data
    const url = window.URL.createObjectURL(new Blob([response.data])); // Step 2: Create temp URL
    const link = document.createElement('a');                          // Step 3: Create invisible <a>
    link.href = url;
    link.setAttribute('download', `TourismGov_Brief_${id}.txt`);     // Step 4: Set filename
    document.body.appendChild(link);                                   // Step 5: Add to page
    link.click();                                                      // Step 6: Trigger download
    link.remove();                                                     // Step 7: Cleanup
};
```

---

### Q47: What is a `Blob` and `createObjectURL`?
**Blob** = Binary Large Object — represents raw file data in browser memory.
**createObjectURL** = Creates a temporary URL `blob:http://localhost:5173/abc-123` that the browser treats as a file source.

---

### Q48: What is `localStorage`? How does your project use it?
Browser key-value storage. Persists across sessions.

```jsx
// SAVE (after login):
localStorage.setItem('token', 'eyJ...');
localStorage.setItem('role', 'ADMIN');

// READ (in components):
const token = localStorage.getItem('token');
const role = localStorage.getItem('role') || 'TOURIST';  // Fallback

// CLEAR (on logout):
localStorage.clear();
```

---

## 🔹 SCENARIOS (Q49–Q50)

### Q49: Explain the full Notification flow — frontend to backend and back.
```
1. App loads → NotificationProvider mounts
2. useEffect → calls getUnread API via axios
3. Interceptor adds "Authorization: Bearer eyJ..."
4. Request → Gateway → validates JWT → adds X-User-Id header → NotificationService
5. Controller reads @RequestHeader("X-User-Id") → queries DB → returns unread list
6. Response → setUnreadCount(data.length) → Navbar badge shows "3"
7. setInterval starts → polls every 30 seconds

8. User clicks notification → openNotification(notif)
9. If UNREAD → PATCH /notifications/5/read via axios
10. Gateway validates → NotificationService marks as READ in DB
11. Frontend: setNotifications(prev => prev.map(n => 
        n.id === 5 ? { ...n, status: 'READ' } : n))
12. refreshGlobalCount() → context fetches new unread count → badge updates to "2"
```

---

### Q50: Explain how your Dashboard loads — every step.
```
1. User navigates to /main-dashboard
2. React Router matches path → renders <Dashboard />
3. Component mounts → useState initializes: data=null, loading=true
4. useEffect fires (empty []) → calls fetchDashboardData()

5. fetchDashboardData():
   a. Reads JWT from localStorage
   b. Creates axiosConfig with Bearer token
   c. Fires Promise.all with 5 API calls IN PARALLEL
   d. Each has individual .catch() returning empty data
   e. Gateway validates JWT for each request
   f. Each service returns its data

6. All 5 resolve → destructure results
7. Process data: filter active programs, read totalElements
8. setData({ role, userName, metrics }) → triggers re-render
9. finally: setLoading(false) → spinner disappears

10. Re-render:
    a. rawRole from localStorage → normalize to uppercase
    b. switch(userRole) → selects which KPIs and modules to show
    c. displayKpis.map() → renders StatCard components
    d. displayModules.map() → renders ActionCard components
    e. Each card has motion.div whileHover={{ y: -5 }} animation
```

