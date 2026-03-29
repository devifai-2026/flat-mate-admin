# FlatMate Admin Dashboard

Admin panel for the [JustFlatmate](https://justflatmate.com) platform — manage users, listings, chats, tickets, and monitor platform health.

**Live:** [admin.justflatmate.com](https://admin.justflatmate.com)

## Tech Stack

- **React 19** + React Router v7
- **Vite** — build tool
- **Recharts** — charts & graphs (area, bar, pie, scatter, composed)
- **Lucide React** — icons
- **Axios** — API client
- **Socket.IO Client** — real-time updates

## Features

### Dashboard
- Revenue, users, listings, tickets, teams KPI cards
- Period selector (1 month, 3 months, 6 months, this year)
- Signup & revenue trend charts (area + composed)
- Monthly comparison bar charts
- Listing, user type, and ticket status breakdown (donut charts)
- Ticket categories horizontal bar chart
- Moderation summary with hidden listings count
- Latest posts (rooms, PGs, requirements)
- Platform health grid

### Users
- Paginated user list with search
- User detail page with tabs: Listings, Wishlist, Teams, Transactions, Conversations
- Block/unblock users

### Listings
- Rooms, PGs, Requirements tabs with counts
- Search, hidden-only filter
- Listing detail page with images, description, amenities, owner info
- Hide/unhide moderation

### Chats
- Conversation list with participants and last message
- Message viewer (read-only)

### Tickets
- Status filter (Open, In Progress, Resolved)
- Ticket detail with message thread
- Admin reply and status management

### Guests
- Guest visitor tracking with device info
- Daily guest visitor charts
- Top pages analytics

### Transactions
- Platform-wide transaction history

### API Activity
- Requests today, this week, error count, avg response time
- Hourly traffic bar chart
- Daily requests line/area chart (7d)
- Response time scatter chart
- Status code vs latency scatter chart
- Endpoint load vs speed scatter chart
- Status code distribution
- Error breakdown with endpoint details
- Top endpoints list
- Filterable API logs table

### DB Storage
- Database overview (size, collections, documents)
- Storage breakdown pie chart
- Documents per collection bar chart
- Documents vs storage size scatter chart
- Index size per collection bar chart
- Collections detail table

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `https://justflatmate.in/api` |

## Deployment (Netlify)

The project includes `netlify.toml` and `public/_redirects` for SPA routing.

1. Connect this repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set `VITE_API_URL` in environment variables

## Project Structure

```
src/
  components/
    Layout.jsx          # Sidebar + header layout
  hooks/
    useSocket.js        # Socket.IO hook
  pages/
    Dashboard.jsx       # Analytics dashboard
    Users.jsx           # User list
    UserDetail.jsx      # User profile + activity
    Listings.jsx        # Listings table
    ListingDetail.jsx   # Listing detail view
    Chats.jsx           # Conversation list
    ChatView.jsx        # Message viewer
    Tickets.jsx         # Ticket list
    TicketDetail.jsx    # Ticket detail + reply
    Guests.jsx          # Guest analytics
    GuestDetail.jsx     # Guest detail
    Transactions.jsx    # Transaction history
    ApiActivity.jsx     # API monitoring
    DbStorage.jsx       # Database stats
    Login.jsx           # Admin login
    NotFound.jsx        # 404 page
  services/
    api.js              # Axios instance with auth
  App.jsx               # Router config
  main.jsx              # Entry point
```
