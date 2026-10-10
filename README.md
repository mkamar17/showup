# Engine — Show up, or pay up (frontend prototype)

A React + Vite prototype. Friends commit a small amount of money to an event. You check in at the venue (location-gated) to get it back. No-shows' money is split between the people who turned up.

There is **no backend**. All data is mock and is saved in your browser's localStorage. **Profile → Reset demo** restores the starting data.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Requires Node 20.19+ (or 22.12+).

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Project structure

```
src/
  api/          mock "backend": state store, settlement maths, geolocation, maps API
    AppProvider.jsx   app state + all actions (commit, check-in, settle…)
    context.js        React context
    useApp.js         hook to read state/actions
    eventLogic.js     phases, recurrence, settlement applied to state
    settlement.js     pure settlement maths (pence, penny-exact splits)
    geo.js            haversine distance + radius check
    mapsApi.js        OpenStreetMap Nominatim venue search (public, no key)
    seedData.js       demo users, events, memories
    storage.js        localStorage persistence
    constants.js, format.js, hooks.js
  assets/       logo.svg, auth_bg.svg
  components/   reusable UI (NavBar, TopBar, EventCard, EventForm, MapView, CheckInPanel…)
  pages/        AuthPage, LandingPage, EventDetailPage, SettlementPage,
                CommunityPage, MemoriesPage, ProfilePage
  styles/       one stylesheet per area
  App.jsx, App.css, index.css, main.jsx
```

## Demo script (the "Friday Tennis" scenario)

1. **Sign up** with any username and any password.
   **Connect Starling (mock):** Profile → Banking → Connect Starling → Continue to Starling → Allow access. This creates an "Engine Commitments" Space. If you skip this step, the first "Connect Starling to commit" button runs the same flow.
2. **Community** → add a friend by username, e.g. `codybryan`. Max, Grisha and Levi are already your friends.
3. **Home → Create event** "Friday Tennis":
   - pick a venue (search, quick pick, or tap the map)
   - set a 150m radius, £5, 10 min grace, and optionally Repeat weekly
   - invite 3 friends
4. On the event page, click **Join & commit £5** → **Approve in Starling** → **Approve with Face ID**. £5 moves from the Starling main account into the Engine Commitments Space, with a payment reference such as `ENG-FT-1610`.
5. Use **Simulate commit** next to each friend. Total held becomes £20.
6. **Demo controls → Start event now**. The grace period runs sped up (10 min becomes 30s).
7. **Simulate 420m away**. The button stays locked: "You're 420m away — check-in unlocks within 150m."
8. **Simulate arrival** (or **Use my GPS**), then **Check in**.
9. Use **Simulate check-in** for two friends and leave one out.
10. Let the timer run out, or press **End grace period**. You land on settlement:
    - Attendees each get £6.67: £5 back plus a share of the no-show's £5. Because £5 can't split evenly 3 ways, one attendee gets £6.66, so the totals match to the penny.
    - The no-show loses £5.
    - The page shows the transfer breakdown, updated balances and "Settlement complete".
11. Save a note as a **Memory**. If the event repeats, next week's event is created automatically.

## Starling integration (mocked)

The Banking and Wallet tabs show how the app would work connected to Starling. Nothing calls Starling; it is all simulated.

| In the app | Real Starling equivalent |
|---|---|
| Connect Starling (permissions → sign in → allow) | OAuth 2.0 consent |
| Engine Commitments Space | A savings goal ("Space") in the user's own account |
| Commit → approve in bank app | Add money to the Space, with strong customer authentication |
| Refund at settlement | Withdraw money from the Space back to the main account |
| Penalty share (Pending → Completed after ~6s) | Faster Payment to each attendee |
| Starling activity statuses | Webhooks confirming each transfer |

Mock functions live in `src/api/AppProvider.jsx` (`connectStarling`, `commit`, `syncStarling`…). In a real build they would call a small backend that holds the OAuth tokens, because tokens must never live in the browser.

## How check-in works

- Check-in opens 30 minutes before the start and closes when the grace period ends.
- The browser Geolocation API (`watchPosition`) gives your position. Distance to the venue uses the haversine formula, and the **Check in** button only enables when you're inside the radius.
- Geolocation needs `localhost` or HTTPS. To test on a phone over your network, use the Simulate buttons or serve over HTTPS.
- Maps use Leaflet with OpenStreetMap tiles. Venue search uses OpenStreetMap Nominatim. Both are free and need no API key.

## Prototype notes

- No real payments or bank connections. The banking form keeps only the last 4 digits.
- Other users are mock friends. The "Simulate" buttons stand in for their phones.
- If nobody checks in, everyone is refunded, because there's no one to pay out to.
