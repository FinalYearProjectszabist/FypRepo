# Intelligent EV Charging Network Platform (FYP — SZABIST Islamabad)

| Part | Tech |
|------|------|
| Frontend | React (Vite), Tailwind CSS, Framer Motion, Axios |
| Backend | Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, JWT, BCrypt, JavaMail |
| Database | PostgreSQL |

```
FypRepo/
├── backend/    Spring Boot REST API  (http://localhost:8080/api)
└── frontend/   React app             (http://localhost:5173)
```

---

## Module 1 — Authentication & Profile ✅

| Feature (proposal) | Kahan hai |
|---|---|
| **Signup** (role-based: Driver / Station Owner) | `POST /api/auth/signup` · `SignupPage.jsx` |
| **Signin** (+ 5 ghalat password = 15 min lock) | `POST /api/auth/login` · `LoginPage.jsx` |
| **Recover Password** (email pe 6-digit code) | `/api/auth/forgot-password`, `/api/auth/reset-password` |
| **Two Way Verification** — (1) signup pe email verification code (2) Security page se on karo to har login pe password ke baad email pe 6-digit code | `/api/auth/verify-email`, `/api/profile/mfa/*`, `/api/auth/login/mfa` |
| **Social Media Sign-in** (Google) | `POST /api/auth/google` · `GoogleSignInButton.jsx` |
| **Profile and Vehicle Management** | `/api/profile`, `/api/vehicles` · `ProfilePage.jsx`, `VehiclesPage.jsx` |
| **Input Validation Rules** | Backend: `common/ValidationRules.java` · Frontend: `src/utils/validation.js` |

### Roles
- **DRIVER** — signup se banta hai; vehicles add kar sakta hai.
- **STATION_OWNER** — signup se banta hai (signup pe "Station Owner" select karo).
- **ADMIN** — public signup se **nahi** banta. Pehli dafa backend start hone pe khud ban jata hai:
  - Email: `admin@evplatform.local`
  - Password: `Admin@12345` (`ADMIN_EMAIL` / `ADMIN_PASSWORD` env variables se change karo)

Login ke baad Driver/Owner → `/dashboard`, Admin → `/admin/users`.

### Vehicle fields (Compatibility Engine & Cost Calculator yahi data use karenge)
make, model, year, battery capacity (kWh), connector type (`CCS2` / `CHADEMO` / `TYPE2`), full-charge range (km),
current battery %, registration number, primary vehicle. Max 5 vehicles per driver.

### Validation rules (summary)
| Field | Rule |
|---|---|
| Full name | 3–60 letters (space . ' - allowed) |
| Email | valid format, max 100, unique |
| Password | 8–64, uppercase + lowercase + number + special char, no spaces |
| Phone | Pakistani mobile `03XXXXXXXXX` / `+923XXXXXXXXX` (DB mein AES-256 encrypted) |
| OTP / 2FA code | exactly 6 digits, 10 min expiry, max 5 tries |
| Vehicle | year 2010–2030, battery 10–250 kWh, range 50–1200 km, battery 0–100 %, plate like `ABC-123` |

### Security
- Passwords → **BCrypt** (strength 12)
- Login → **JWT** (24h); 2-step login uses a separate 10-min token that can't access the API
- Phone numbers → **AES-256-GCM** encrypted in PostgreSQL
- Saare email codes (verify / reset / 2-step) → sirf SHA-256 hash store hota hai, 10 min expiry, max 5 tries

---

## Module 2 — Station Discovery ✅

Page: **Find Chargers** (`/stations`) — har role ke liye nav mein.

| Feature (proposal) | Kahan hai |
|---|---|
| **Location Based Search and Category** | "Near me" (browser GPS) ya city select + radius slider (2–100 km); category buttons: All / Public / Cafés & businesses / Home chargers; text search (naam, area, city) |
| **Filters** | Connector (CCS2 / CHAdeMO / Type 2) — driver ki primary vehicle ka connector khud select hota hai ("Fits my …"); charging speed (22+/50+/120+ kW); max price (Rs/kWh) |
| **Availability and Status Filter** | "Available now" (koi matching charger free ho), "Open now" (Pakistan time), station status: Operational / Maintenance / Offline |
| **Rating and Facilities Filter** | Min rating (3+/4+/4.5+), facilities (Wi-Fi, Café, Restroom, Parking, Lounge, Prayer area, …) — saari selected facilities honi chahiye |
| **Sort Options** | Nearest, Cheapest, Top rated, Fastest, Most available |
| **Search Results Map View** | "List + Map" view: left list, right map; card click → map pe fly + popup |
| **Map View** | Full map view; pins ka rang availability batata hai (green free, amber busy, grey closed, red unavailable), pin pe free chargers ki ginti |

Station details drawer: chargers table (bay, connector, kW, Rs/kWh, status), opening hours, facilities, rating,
"Get directions" (Google Maps). "Book a slot" Booking & Queue module mein aayega.

**Map:** Leaflet + OpenStreetMap (CARTO dark tiles) — **koi API key nahi chahiye**, free hai.

**Demo data:** backend pehli dafa start hone pe 27 sample stations bana deta hai (Islamabad, Rawalpindi, Lahore,
Karachi, M-2 Bhera) — naam fictional hain. Owner Management module aane ke baad owners khud stations add karenge.
Seed band karne ke liye: `app.seed.stations: false`.

### API
| Method | Path | |
|---|---|---|
| GET | `/api/stations` | search — sab params optional (neeche) |
| GET | `/api/stations/{id}?lat=&lng=` | details + chargers |
| GET | `/api/stations/filters` | cities, categories, connectors, facilities, statuses, sort options |

Search params: `q`, `lat`, `lng`, `radiusKm` (default 25), `city`, `category` (PUBLIC/BUSINESS/HOME),
`connectors=CCS2,TYPE2`, `minPowerKw`, `maxPrice`, `availableOnly`, `statuses=OPERATIONAL,MAINTENANCE`,
`openNow`, `minRating`, `facilities=WIFI,CAFE`, `sort` (DISTANCE/PRICE/RATING/POWER/AVAILABILITY), `limit`.

Example: `/api/stations?lat=33.7086&lng=73.0551&radiusKm=10&connectors=CCS2&availableOnly=true&sort=PRICE`

Distance Haversine formula se nikalta hai; pehle DB mein bounding-box filter lagta hai (`idx_station_lat_lng` index).
Agar connector filter laga ho to price/power/free-count sirf un chargers se nikalte hain jo match karte hain.

### Tables
`stations` (name, category, address, city, latitude, longitude, status, hours, rating, owner) ·
`chargers` (station, connector, power kW, price/kWh, status) · `station_facilities`

---

## Windows pe chalana (VS Code)

### 1. Database banao (pgAdmin 4 ya psql)
pgAdmin → Servers → PostgreSQL 18 → Databases → right-click → **Create → Database** → naam: `ev_platform`

ya terminal mein:
```powershell
psql -U postgres -c "CREATE DATABASE ev_platform;"
```

### 2. Backend
Default DB user/password `postgres` / `postgres` hai. Agar tumhara PostgreSQL password kuch aur hai to
terminal mein pehle set karo:

```powershell
cd backend
$env:DB_PASSWORD="tumhara_postgres_password"
.\mvnw.cmd spring-boot:run
```
(Maven install karne ki zaroorat nahi — `mvnw.cmd` khud download kar leta hai.)

Ya VS Code mein: **Spring Boot Dashboard** (left sidebar) → `ev-platform-backend` → ▶ Run.
(Is case mein password `backend/src/main/resources/application.yml` mein `DB_PASSWORD` default ki jagah daal do — commit mat karna.)

`Started EvPlatformApplication` aur `Seeded admin account` console mein dikhe to backend ready hai.

> **Email codes kahan milenge?** By default email band hai (`MAIL_ENABLED=false`), to verification / reset code
> **backend console** mein print hota hai:
> ```
> ======== EMAIL (mail disabled, printed instead) ========
> Your verification code is: 405154
> ```
> Real email ke liye: `backend/src/main/resources/application-local.yml.example` ko copy karke
> `application-local.yml` banao (usi folder mein) aur Gmail + App Password daalo, `app.mail.enabled: true`.
> Ye file `.gitignore` mein hai — passwords GitHub pe nahi jayenge. **`application.yml` mein kabhi real password mat likho.**

### 3. Frontend (naya terminal)
```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```
Browser: http://localhost:5173

### 4. Tests (backend)
```powershell
cd backend
.\mvnw.cmd test
```
Integration tests in-memory H2 DB pe chalte hain (PostgreSQL ki zaroorat nahi): signup → verify → login →
vehicles → MFA → password reset → lockout → role access; aur station search ke saare filters/sorts (`StationSearchIntegrationTest`).

---

## Google Sign-in setup (optional)
1. https://console.cloud.google.com → New project → **APIs & Services → Credentials → Create credentials → OAuth client ID**
2. Type: **Web application**. *Authorized JavaScript origins*: `http://localhost:5173`
3. Client ID copy karo aur dono jagah lagao:
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`
   - backend env → `GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`
4. Frontend restart karo — Login/Signup pe "Continue with Google" button aa jayega.
   (Client ID na ho to button hide rehta hai, baqi sab chalta hai.)

---

## Environment variables (backend)
| Variable | Default | Kaam |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/ev_platform` | DB connection |
| `DB_USERNAME` / `DB_PASSWORD` | `postgres` / `postgres` | DB login |
| `JWT_SECRET` | dev key | base64, ≥ 32 bytes — production mein change karo |
| `AES_KEY` | dev key | base64, exactly 32 bytes — production mein change karo |
| `MAIL_ENABLED` | `false` | `true` = real email bhejo |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | – | SMTP login |
| `GOOGLE_CLIENT_ID` | – | Google sign-in |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@evplatform.local` / `Admin@12345` | seeded admin |
| `FRONTEND_URL` | `http://localhost:5173` | CORS |

Naya key banane ke liye (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))
```

---

## API reference (Module 1)
| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/signup` | public |
| POST | `/api/auth/verify-email` | public |
| POST | `/api/auth/resend-verification` | public |
| POST | `/api/auth/login` → `{accessToken}` ya `{mfaRequired, mfaToken, maskedEmail}` (code email ho jata hai) | public |
| POST | `/api/auth/login/mfa` | public (mfaToken + email code) |
| POST | `/api/auth/login/mfa/resend` | public (mfaToken) |
| POST | `/api/auth/google` | public |
| POST | `/api/auth/forgot-password` | public |
| POST | `/api/auth/reset-password` | public |
| GET | `/api/auth/me` | any role |
| GET / PUT | `/api/profile` | any role |
| PUT | `/api/profile/password` | any role |
| POST | `/api/profile/mfa/send-code`, `/enable`, `/disable` (email code se confirm) | any role |
| GET / POST | `/api/vehicles` | DRIVER |
| PUT / DELETE | `/api/vehicles/{id}` | DRIVER |
| GET | `/api/admin/users` | ADMIN |
| PATCH | `/api/admin/users/{id}/enabled?value=true\|false` | ADMIN |

Errors hamesha is shape mein aate hain:
```json
{ "status": 400, "code": "VALIDATION_FAILED", "message": "...", "fieldErrors": { "email": "Enter a valid email address" } }
```

## Next modules
- **Compatibility Engine (Haider):** `Charger.connectorType` vs `Vehicle.connectorType` — `StationService.search`
  ka `connectors` filter already matching chargers nikalta hai; compatible/incompatible badge aur pre-booking warning wahan add karo.
- **Cost Calculator:** `Charger.pricePerKwh` + `Vehicle.batteryCapacityKwh` / `currentBatteryPercent`.
- **Owner Management:** `Station.owner` (User, STATION_OWNER) already hai — owners ke liye create/edit API banao.
- Naya controller `/api/...` ke under banao; `@AuthenticationPrincipal AuthUser me` se current user mil jayega.
