# Smart Travel Planner — Frontend Report

| | |
|---|---|
| **Project** | Smart Travel Planner |
| **Module** | Frontend (web application) |
| **Technology** | React 18, Vite, Tailwind CSS |
| **Backend** | Django REST Framework API (PostgreSQL, JWT authentication) |

---

## 1. Introduction

The frontend is the part of Smart Travel Planner that users see and interact with. It is a single-page web application (SPA) built with React. Users can create an account, plan trips, compare transport and accommodation options, discover destinations, and generate a day-by-day travel plan that fits their budget.

All data is stored and processed by the Django backend. The frontend sends requests to the backend's REST API and displays the results.

## 2. Objectives

1. Provide a simple, attractive interface for planning a trip from start to finish.
2. Integrate every backend API that is available in Version 1.
3. Secure the application with JWT login, so each user sees only their own trips.
4. Work well on both desktop and mobile screens.
5. Show costs honestly: never present unknown prices as free, and clearly mark estimates.

## 3. Technology Stack

### 3.1 Libraries used in the application

| Library | Purpose |
|---|---|
| **React 18** | Builds the user interface from reusable components; hooks (`useState`, `useEffect`, `useMemo`) manage data and updates. |
| **React DOM** | Renders React components in the browser. |
| **React Router DOM 6** | Page navigation without reloading, and protection of pages that require login. |
| **Lucide React** | Icon set (plane, bed, map pin, calendar, etc.). |

### 3.2 Build and styling tools

| Tool | Purpose |
|---|---|
| **Vite** | Development server with instant reload; production build; forwards `/api` requests to the Django server during development. |
| **Tailwind CSS** | Utility-class styling for a consistent design system. |
| **PostCSS + Autoprefixer** | Processes Tailwind and adds browser compatibility prefixes. |

### 3.3 Built without extra libraries

- **API calls:** the browser's native `fetch` API with a custom wrapper (no Axios).
- **Login state:** React Context API (no Redux).
- **UI components:** dialogs, dropdowns, skeleton loaders and buttons are custom-built (no UI kit).
- **Formatting:** the browser's `Intl` API for Indian currency (₹20,000) and dates.

### 3.4 External services

| Service | Use |
|---|---|
| Django REST backend | All application data and logic |
| Wikipedia REST API | A real photo of each destination city |
| Unsplash | Fixed banner photos |
| Google Fonts | Inter (body text) and Playfair Display (headings) |

## 4. System Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│                                                                  │
│   Pages (routes)  ──►  Components  ──►  API layer (client.js)    │
│        ▲                                     │                   │
│        └──── AuthContext (login state) ◄─────┤                   │
│                                              │  JSON over HTTP   │
└──────────────────────────────────────────────┼───────────────────┘
                                               ▼
                         Django REST API  (/api/...)  ──►  PostgreSQL
```

- **Pages** decide what is shown for each URL.
- **Components** are reusable building blocks (cards, forms, dialogs).
- **API layer** is the only place that talks to the backend. It adds the login token, refreshes it when it expires, and converts errors into readable messages.
- **AuthContext** stores whether the user is logged in and shares it with every page.

## 5. Folder Structure

```
frontend/
├── index.html
├── vite.config.js          # dev server + proxy to Django
├── tailwind.config.js
└── src/
    ├── main.jsx            # app entry point
    ├── App.jsx             # routes
    ├── api/
    │   ├── client.js       # fetch wrapper, JWT, token refresh, errors
    │   └── endpoints.js    # one function per backend endpoint
    ├── context/
    │   └── AuthContext.jsx # login / logout / session state
    ├── pages/              # one file per screen
    ├── components/
    │   ├── auth/           # login & register forms and layout
    │   ├── layout/         # header, mobile tab bar, route guards
    │   ├── trips/          # trip form, transport, accommodation, flights, hotels, planner
    │   ├── destinations/   # discover destination form, place helpers
    │   └── ui/             # shared: Button, Modal, Combobox, Photo…
    ├── constants/          # dropdown choices, airport codes
    └── utils/              # formatting, city photos, scroll lock
```

The frontend contains about 50 source files (around 6,000 lines of code).

## 6. Pages and Routes

| URL | Page | Access |
|---|---|---|
| `/login` | Login | Public |
| `/register` | Create account | Public |
| `/destinations` | Discover and browse saved destinations | Public |
| `/destinations/:id` | One destination with its places | Public |
| `/trips` | My trips dashboard | Logged-in users |
| `/trips/new` | Plan a new trip | Logged-in users |
| `/trips/:id` | Trip details, transport, stays, trip plan | Logged-in users |
| `/trips/:id/edit` | Edit a trip | Logged-in users |
| `*` | Page not found | Public |

A **ProtectedRoute** sends logged-out users to the login page and returns them to the page they wanted after they log in. A **GuestRoute** keeps logged-in users away from the login and register pages.

## 7. Features and the APIs They Use

### 7.1 Authentication
- **Register** with username, email and password (`POST /api/accounts/register/`), then log in automatically.
- **Login** (`POST /api/token/`) returns an access token and a refresh token.
- **Automatic token refresh** (`POST /api/token/refresh/`): the access token lasts 5 minutes. When a request fails with 401, the client refreshes the token once and retries, so the user is not logged out.
- **"Keep me logged in"** stores tokens in `localStorage`; otherwise they are kept in `sessionStorage` and cleared when the browser closes.

### 7.2 Trips (`/api/trips/`)
- **Dashboard:** a greeting, total trips, a countdown to the next trip, the upcoming budget, and filters (Upcoming, On the road, Completed).
- **Trip form:** a three-step form (route, dates, travellers and budget). It has:
  - travel-mode tiles and a traveller stepper,
  - suggestions from saved destinations,
  - a live preview of budget per person per day.
- **Validation:** end date not before start date, at least 1 traveller, budget greater than 0.
- **Actions:** view, edit and delete (delete asks for confirmation).

### 7.3 Transport (`/api/transport-options/`)
- **Add, edit and delete** transport options (flight, train, bus, car, bike).
- **Comparison labels:** "Cheapest" and "Fastest".
- **Live flight search** (`GET /api/flights/search/`):
  - airport codes are filled in automatically from city names,
  - results are sorted cheapest first, with duplicates removed,
  - one click saves a flight to the trip, and flights already saved are marked.

### 7.4 Accommodation (`/api/accommodations/`)
- **Manual entry:** name, type, location, price per night and rating.
- **Find hotels** (`GET /api/hotels/search/`): lists saved hotels for the destination. Adding one asks for the nightly price the user was quoted, because hotel listings have no live prices. Hotels already on the trip are marked "Added".
- **Comparison labels:** "Cheapest" and "Top rated", plus the total cost for all nights.

### 7.5 Destinations (`/api/destinations/`, `/api/places/`)
- **Discover a destination** (`POST /api/destinations/search/`): enter a city and state; the backend finds and saves its attractions, cafés and restaurants.
- **Saved destinations:** a searchable grid with a real photo of each city.
- **Destination page:**
  - places grouped by category (attraction, viewpoint, café…) with map links,
  - counts of sightseeing spots and places to eat,
  - a "Plan a trip here" button.

### 7.6 Trip Planner (`/api/planner/...`)
- **Generate plan** (`POST …/generate/`). The backend:
  - chooses the cheapest combination of saved transport and stay that fits the budget,
  - builds a sightseeing itinerary for each day.
- **Reopen plan** (`GET …/latest/`) shows the saved plan when the trip is opened again.
- **Plan window** with four tabs:
  - **Overview:** the budget used and remaining, what has been counted (transport, stay), costs to set aside that cannot be estimated yet (return journey, local travel, food, entry tickets), the chosen transport and stay, and days at a glance.
  - **Itinerary:** stops for each day, with times.
  - **Full day:** a 09:00–21:00 timeline with lunch, dinner and free time.
  - **Hotels & food:** hotel recommendations, places to eat and other places nearby.
- **Itinerary editing:**
  - add an activity (`POST …/itinerary/items/`),
  - remove a stop (`DELETE …/items/{id}/`),
  - move a stop to another day (`PATCH …/items/{id}/move/`),
  - reorder a day (`PATCH …/itinerary/reorder/`).
- **Regenerate** asks for confirmation, because it replaces manual edits.
- **Out-of-date notice:** if transport or stays change after a plan is generated, the page suggests updating the plan.

## 8. User Interface Design

- **Visual style:** destination photography, rounded cards, an orange accent colour and serif headings (Playfair Display).
- **Responsive layout:**
  - **Desktop:** a top navigation bar.
  - **Mobile:** a bottom tab bar (Trips, New trip, Explore), and dialogs slide up from the bottom.
- **Loading states:** skeleton placeholders in the page's shape instead of spinners.
- **Empty states:** a friendly message with a next step, for example "No hotels found → Add your own stay".
- **Accessibility:**
  - labelled form fields and keyboard-usable dialogs and dropdowns (arrow keys, Enter, Esc),
  - visible focus outlines,
  - animations turn off when the user's system asks for reduced motion.
- **Honest costs:** unknown prices are shown as "Not added" or "Price not listed", never as ₹0 or "Free".

## 9. Error Handling and Validation

- **Form validation** in the browser before sending: required fields, date order, positive amounts, 3-letter airport codes, valid URLs.
- **Backend errors** in all three of the backend's formats (`{"field": [...]}`, `{"error": "..."}`, `{"detail": "..."}`) are shown next to the correct field or as a message.
- **Status codes are handled:**
  - **401:** the token is refreshed, otherwise the user is sent to login.
  - **404:** a "not found" screen.
  - **409:** the plan must be regenerated.
  - **502/504:** an outside service is busy, so the user is asked to try again.
- **Time zones:** the backend stores times in UTC. The frontend shows and enters them in Indian time, so a 07:10 flight stays 07:10.

## 10. Testing

- **Builds:** every change was checked with a production build (`vite build`).
- **API client tests:** run against a mock server with the backend's response shapes. They covered registration, login, an invalid login, automatic token refresh, create/update/delete, the 404 path and an expired session.
- **Browser tests:** headless Chrome clicked through the main flows and captured screenshots at desktop (1366 px) and mobile (390 px) widths:
  - login, trips, new trip,
  - flight search and save, adding a hotel,
  - generating, reopening and editing a plan,
  - discovering a destination.
- **Real backend tests:** the planner flow (generate, latest, add, move, reorder, remove, and adding a restaurant, which is correctly rejected) ran against the real Django backend inside a database transaction that was rolled back, so no test data was saved.

## 11. Limitations

These depend on the current backend (Version 1):

- **Live flight search:** the provider can be rate-limited or unavailable; manual transport entry is always available instead.
- **Hotels:** no live prices or availability, so users enter their own quoted price.
- **City discovery:**
  - it depends on public OpenStreetMap servers, which are sometimes slow or busy;
  - city lookup does not yet use the state, so some city names can match the wrong place.
- **Costs not calculated:** return travel, local transport and meals.
- **Not available yet:** train and bus search, user profile, feedback.

## 12. Future Scope

- Train and bus search when backend APIs exist.
- A map view of the itinerary.
- Drag-and-drop itinerary editing.
- A user profile and trip sharing.
- A feedback and rating form after a trip.
- An offline-ready progressive web app.

## 13. How to Run

```bash
cd frontend
npm install        # first time only
npm run dev        # opens on http://localhost:5173
```

The Django backend must be running on `http://127.0.0.1:8000`. For a deployed backend, set `VITE_API_BASE_URL` in a `.env` file (see `.env.example`).

For a standard deployment at the domain root, build the frontend with the default base path:

```bash
npm run build
```

If your deployment serves the app under a URL prefix, set `VITE_BASE_PATH` and `VITE_ROUTER_BASENAME` to that prefix when building. Leave both unset for a domain-root deployment.

## 14. Conclusion

The frontend delivers a complete, responsive interface for Smart Travel Planner and integrates every backend API that is available in Version 1:

- authentication with automatic token refresh,
- trips, transport, accommodation and destinations,
- flight and hotel search,
- the budget-aware trip planner with itinerary editing.

It uses a small set of well-known tools (React, React Router, Tailwind CSS and Vite) and is organised into reusable components and a single API layer, which keeps it easy to maintain and extend.
