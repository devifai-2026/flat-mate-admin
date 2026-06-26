import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import AddListing from './pages/AddListing';
import Chats from './pages/Chats';
import ChatView from './pages/ChatView';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import Guests from './pages/Guests';
import GuestDetail from './pages/GuestDetail';
import ApiActivity from './pages/ApiActivity';
import DbStorage from './pages/DbStorage';
import Transactions from './pages/Transactions';
import BonusGifting from './pages/BonusGifting';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/login" replace />;
}

function getRole() {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || '{}').role || 'admin';
  } catch {
    return 'admin';
  }
}

// Routes wrapped in this are hidden from the restricted "lister" role —
// they get bounced to their landing page (Listings) instead.
function FullAdminRoute({ children }) {
  return getRole() === 'lister' ? <Navigate to="/listings" replace /> : children;
}

// The index ("/") is the Dashboard for admins, but listers don't have a
// dashboard, so send them straight to Listings.
function HomeRoute() {
  return getRole() === 'lister' ? <Navigate to="/listings" replace /> : <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Tabs available to the lister role */}
          <Route index element={<HomeRoute />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="listings" element={<Listings />} />
          <Route path="listings/new" element={<AddListing />} />
          <Route path="listings/:type/:id" element={<ListingDetail />} />

          {/* Full-admin-only tabs — listers are redirected to /listings */}
          <Route path="chats" element={<FullAdminRoute><Chats /></FullAdminRoute>} />
          <Route path="chats/:id" element={<FullAdminRoute><ChatView /></FullAdminRoute>} />
          <Route path="tickets" element={<FullAdminRoute><Tickets /></FullAdminRoute>} />
          <Route path="tickets/:id" element={<FullAdminRoute><TicketDetail /></FullAdminRoute>} />
          <Route path="guests" element={<FullAdminRoute><Guests /></FullAdminRoute>} />
          <Route path="guests/:id" element={<FullAdminRoute><GuestDetail /></FullAdminRoute>} />
          <Route path="transactions" element={<FullAdminRoute><Transactions /></FullAdminRoute>} />
          <Route path="bonus-gifting" element={<FullAdminRoute><BonusGifting /></FullAdminRoute>} />
          <Route path="api-activity" element={<FullAdminRoute><ApiActivity /></FullAdminRoute>} />
          <Route path="db-storage" element={<FullAdminRoute><DbStorage /></FullAdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
