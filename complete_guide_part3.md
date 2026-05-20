# COMPLETE INTERVIEW GUIDE — PART 3

# ══════════════════════════════════════════════
# SECTION 8: JAVASCRIPT DEEP CONCEPTS
# ══════════════════════════════════════════════

## 8.1 ES6+ Features Used in Your Code

### const vs let vs var
```js
const token = localStorage.getItem('token');  // Cannot reassign
let navLinks = [{ name: 'Dashboard' }];       // Can reassign
// var → function-scoped, hoisted — AVOID in modern JS
```
**Rule:** Use `const` by default. Use `let` only when reassignment is needed.

### Arrow Functions
```js
// Traditional function:
function fetchData() { return axios.get('/api'); }

// Arrow function (your code uses this everywhere):
const fetchData = () => axios.get('/api');
const fetchData = async () => { const res = await axios.get('/api'); return res; };

// In callbacks:
notifications.filter(n => n.status === 'UNREAD')
displayKpis.map((kpi, index) => <StatCard key={index} {...kpi} />)
```
Arrow functions are shorter AND they don't have their own `this` context.

### Template Literals
```js
`Bearer ${token}`                           // String interpolation
`/tourismgov/v1/notifications/${id}/read`   // Dynamic URL
`TourismGov_Brief_${id}.txt`                // Dynamic filename
```

### Destructuring
```js
// Array destructuring:
const [data, setData] = useState(null);
const [sitesRes, programsRes, eventsRes] = await Promise.all([...]);

// Object destructuring:
const { refresh: refreshGlobalCount } = useNotifications();  // Rename while destructuring
const { unreadCount, latestNotification } = useNotifications();
const StatCard = ({ label, value, icon, color }) => (...);   // Props destructuring
```

### Spread Operator `...`
```js
// Copy object with override (immutable update):
{ ...notification, status: 'READ' }
// Before: { id: 1, subject: "Hi", status: "UNREAD" }
// After:  { id: 1, subject: "Hi", status: "READ" }

// Copy state with override:
setAuthState(prev => ({ ...prev, isLoggedIn: true, userRole: role }));

// Spread props:
<StatCard {...kpi} />  // Same as: <StatCard label={kpi.label} value={kpi.value} ... />
```

### Optional Chaining `?.`
```js
sitesRes.data?.length          // If data is null → returns undefined (no crash)
decoded.roles || decoded.role  // Fallback chain
latestNotification.category?.replace('_', ' ')  // Safe method call
```

### Nullish/OR Fallback
```js
const rawRole = localStorage.getItem('role') || 'TOURIST';  // If null/empty → 'TOURIST'
const totalSites = sitesRes.data?.length || 0;               // If undefined → 0
```

### Short-Circuit Evaluation
```js
{unreadCount > 0 && <span className="badge">{unreadCount}</span>}
// If unreadCount is 0 → renders nothing
// If unreadCount is 3 → renders the badge
```

---

## 8.2 Async/Await & Promises

### Promise = A value that might be available later
```js
axios.get('/notifications')  // Returns a Promise
  .then(res => console.log(res.data))   // When resolved
  .catch(err => console.log(err))        // When rejected
```

### async/await = Cleaner syntax for Promises
```js
const fetchAlerts = async () => {
    try {
        const response = await notificationApi.getAll();  // Pauses here until done
        setNotifications(response.data);
    } catch (err) {
        console.error(err);     // If API fails
    } finally {
        setLoading(false);      // Always runs
    }
};
```

### Promise.all = Parallel execution
```js
// These 5 calls START simultaneously, not one after another:
const [sites, programs, events, users, bookings] = await Promise.all([
    axios.get('/sites').catch(() => ({ data: [] })),
    axios.get('/programs').catch(() => ({ data: [] })),
    axios.get('/events').catch(() => ({ data: [] })),
    axios.get('/users').catch(() => ({ data: [] })),
    axios.get('/bookings/paged').catch(() => ({ data: { totalElements: 0 } }))
]);
```

**Interview Q: "Promise.all vs Promise.allSettled?"**
> `Promise.all` — rejects if ANY promise rejects (unless individual `.catch`)
> `Promise.allSettled` — waits for ALL to finish, never rejects, returns status for each
> We used `Promise.all` with per-promise `.catch` which achieves similar resilience.

---

## 8.3 Array Methods (Used Heavily)

### .filter() — Keep items matching condition
```js
// Count active programs:
programs.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNED').length

// Triple filter for notifications:
notifications.filter(n => {
    const matchesStatus = statusFilter === 'ALL' || n.status === 'UNREAD';
    const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
    const matchesSearch = searchQuery === '' || n.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
});
```

### .map() — Transform each item
```js
// Render list of components:
displayKpis.map((kpi, index) => <StatCard key={index} {...kpi} />)

// Update one item in array (immutable):
notifications.map(n => 
    n.notificationId === id ? { ...n, status: 'READ' } : n
)

// Update ALL items:
notifications.map(n => ({ ...n, status: 'READ' }))
```

### .find() — Get first matching item
```js
categories.find(c => c.id === notif.category)  // Find category style for this notification
```

### .includes() — Check if array contains value
```js
['ADMIN', 'MANAGER', 'AUDITOR'].includes(user.role)  // Role check
report.scope.toLowerCase().includes(searchQuery)       // Search check
```

---

## 8.4 DOM Manipulation (File Download)

```js
// This is pure JavaScript — no React needed:
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');      // Create invisible <a>
link.href = url;
link.setAttribute('download', `Report_${id}.txt`);  // Set download filename
document.body.appendChild(link);               // Add to page
link.click();                                  // Trigger download
link.remove();                                 // Cleanup
```

**Interview Q: "What is a Blob?"**
> Binary Large Object — represents raw binary data in the browser. Used for files, images, audio. `URL.createObjectURL(blob)` creates a temporary URL like `blob:http://localhost:5173/abc-123` that the browser can use as a file source.

---

## 8.5 localStorage

```js
localStorage.setItem('token', 'eyJhb...');    // Save
localStorage.getItem('token');                  // Read → returns string or null
localStorage.removeItem('token');               // Delete one
localStorage.clear();                           // Delete all (used for logout)
```

- Stores key-value pairs as **strings**
- Persists across browser sessions (survives tab close)
- Max ~5MB per origin
- Synchronous API (blocks main thread — but fast for small data)

---

# ══════════════════════════════════════════════
# SECTION 9: REACT DEEP CONCEPTS
# ══════════════════════════════════════════════

## 9.1 Virtual DOM

React doesn't update the real DOM directly. It:
1. Creates a virtual copy of DOM in memory
2. When state changes → creates a NEW virtual DOM
3. **Diffs** old vs new virtual DOM
4. Updates ONLY the changed parts in real DOM

This is why React is fast — it minimizes expensive real DOM operations.

---

## 9.2 All React Hooks Used in Your Project

### useState — Store component data
```jsx
const [data, setData] = useState(null);           // Object
const [loading, setLoading] = useState(true);      // Boolean
const [notifications, setNotifications] = useState([]); // Array
const [alert, setAlert] = useState({ show: false, message: "", type: "success" }); // Object
```
When you call `setData(newValue)` → React re-renders the component with new data.

### useEffect — Side effects (API calls, timers)
```jsx
// Run ONCE on mount (empty dependency array):
useEffect(() => { fetchData(); }, []);

// Run when specific value changes:
useEffect(() => { /* runs when refresh changes */ }, [refresh]);

// Cleanup on unmount:
useEffect(() => {
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);  // ← cleanup function
}, []);
```

**Interview Q: "Why does useEffect with [] run twice in dev?"**
> React 18 StrictMode intentionally double-invokes effects in development to catch bugs (missing cleanup, race conditions). In production, it runs once.

### useContext — Read shared state
```jsx
// Create:
const NotificationContext = createContext({ unreadCount: 0 });

// Provide (wrap app):
<NotificationContext.Provider value={{ unreadCount, refresh }}>
    {children}
</NotificationContext.Provider>

// Consume (any child):
const { unreadCount, refresh } = useContext(NotificationContext);
// Or with custom hook:
const { unreadCount } = useNotifications();
```

### useMemo — Cache computed value
```jsx
const filteredHistory = useMemo(() => {
    return history.filter(report => report.scope.includes(searchQuery));
}, [history, searchQuery]);
// Only recalculates when history or searchQuery changes
// If parent re-renders for OTHER reasons → cached result reused
```

**Interview Q: "useMemo vs useCallback?"**
> `useMemo` caches a **value**: `useMemo(() => computeExpensiveValue(), [deps])`
> `useCallback` caches a **function**: `useCallback(() => doSomething(), [deps])`
> Both prevent unnecessary recalculations/recreations on re-render.

### useCallback — Cache a function
```jsx
const refresh = useCallback(async () => {
    const res = await notificationApi.getUnread();
    setUnreadCount(res.data.length);
}, []);
// Function reference stays the same across renders
// Important when function is a dependency of useEffect
```

### useRef — Mutable value without re-render
```jsx
const intervalRef = useRef(null);
intervalRef.current = setInterval(refresh, 30000);
// Changing .current does NOT trigger re-render
// Used for: interval IDs, DOM refs, previous values
```

### useNavigate — Programmatic navigation
```jsx
const navigate = useNavigate();
navigate('/login');        // Go to login page
navigate(-1);              // Go back
```

### useLocation — Read current URL
```jsx
const location = useLocation();
location.pathname === '/reports'  // true if on reports page
// Used in Navbar to highlight active link
```

---

## 9.3 React Router v6 Concepts

### Routes & Route
```jsx
<Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="*" element={<Navigate to="/" />} />   {/* Catch-all → redirect */}
</Routes>
```

### Nested Routes & Outlet
```jsx
<Route element={<LayoutWithNavbar />}>           {/* Parent: has Navbar + Outlet */}
    <Route path="/dashboard" element={<Dashboard />} />    {/* Child: renders in Outlet */}
    <Route path="/reports" element={<ReportPage />} />
</Route>

const LayoutWithNavbar = () => (
    <>
        <Navbar />
        <Outlet />   {/* ← Matched child component renders HERE */}
    </>
);
```

### Navigate — Redirect component
```jsx
{authState.isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
```

### Link — Navigation without page reload
```jsx
<Link to="/reports">Reports</Link>    // Renders as <a> but prevents full page reload
```

---

## 9.4 Conditional Rendering Patterns Used

```jsx
// 1. Ternary (if/else):
{loading ? <Spinner /> : <Content />}

// 2. Short-circuit (if only):
{unreadCount > 0 && <Badge>{unreadCount}</Badge>}

// 3. Early return:
if (loading) return <Spinner />;
if (!isAuthorized) return <AccessDenied />;
return <MainContent />;

// 4. Null for nothing:
{focusedNotif && <Modal />}  // null if focusedNotif is null → renders nothing
```

---

## 9.5 Component Types in Your Project

### Functional Component (all your components):
```jsx
const Dashboard = () => {
    const [data, setData] = useState(null);
    return <div>...</div>;
};
```

### Small Presentational Component:
```jsx
const StatCard = ({ label, value, icon, color }) => (
    <motion.div whileHover={{ y: -5 }}>
        <p>{label}</p>
        <span>{value}</span>
    </motion.div>
);
```
No state, no effects — just receives props and renders UI. Easy to test and reuse.

---

# ══════════════════════════════════════════════
# SECTION 10: COMMON INTERVIEW QUESTIONS
# ══════════════════════════════════════════════

### Spring Boot
| Question | Answer |
|---|---|
| What is Spring Boot? | Auto-configured Spring framework with embedded server |
| @RestController vs @Controller? | @RestController = @Controller + @ResponseBody (returns JSON) |
| What is @RequestHeader? | Reads HTTP header value → `@RequestHeader("X-User-Id") Long userId` |
| What is @Valid? | Triggers bean validation on the request body |
| What is @PrePersist? | JPA lifecycle callback that runs before INSERT |
| Constructor injection vs @Autowired? | Constructor (via @RequiredArgsConstructor) is recommended — explicit, testable |

### Microservices
| Question | Answer |
|---|---|
| Why microservices? | Independent scaling, deployment, team ownership |
| What is Eureka? | Service discovery — services register and find each other dynamically |
| What is API Gateway? | Single entry point — JWT validation, routing, header injection |
| What is Feign? | Declarative HTTP client for inter-service calls |
| How do services communicate? | Frontend→Gateway→Service (REST), Service→Service (Feign) |
| What if a service is down? | Fallbacks, circuit breakers, graceful degradation |

### React
| Question | Answer |
|---|---|
| What is Virtual DOM? | In-memory copy of real DOM — React diffs and patches only changes |
| useState vs useRef? | useState triggers re-render, useRef doesn't |
| useMemo vs useCallback? | useMemo caches a value, useCallback caches a function |
| What is Context API? | Global state sharing without prop drilling |
| What is useEffect cleanup? | `return () => clearInterval()` — prevents memory leaks |
| Why key prop in lists? | Helps React track which items changed/added/removed |

### JavaScript
| Question | Answer |
|---|---|
| let vs const? | const can't be reassigned, let can |
| What is Promise.all? | Runs multiple promises in parallel, resolves when all complete |
| What is async/await? | Syntactic sugar for promises — makes async code look synchronous |
| What is the spread operator? | `{...obj}` copies object, `[...arr]` copies array |
| What is optional chaining? | `obj?.prop` — returns undefined instead of crashing if obj is null |
| What is a Blob? | Binary Large Object — represents raw file data in browser |

### Security
| Question | Answer |
|---|---|
| What is JWT? | Signed JSON token for stateless authentication |
| Where is JWT validated? | API Gateway — centralized, services trust Gateway headers |
| How do you store JWT? | localStorage on frontend, axios interceptor auto-attaches |
| What is stateless auth? | No server-side sessions — token contains all needed info |

### Architecture
| Question | Answer |
|---|---|
| What is RBAC? | Role-Based Access Control — different views per role |
| What is graceful degradation? | App works partially even when some services fail |
| What is prop drilling? | Passing props through many component levels — solved by Context |
| What is SPA? | Single Page Application — one HTML page, JS handles navigation |

