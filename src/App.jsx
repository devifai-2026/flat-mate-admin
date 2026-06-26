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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="listings" element={<Listings />} />
          <Route path="listings/new" element={<AddListing />} />
          <Route path="listings/:type/:id" element={<ListingDetail />} />
          <Route path="chats" element={<Chats />} />
          <Route path="chats/:id" element={<ChatView />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="guests" element={<Guests />} />
          <Route path="guests/:id" element={<GuestDetail />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="bonus-gifting" element={<BonusGifting />} />
          <Route path="api-activity" element={<ApiActivity />} />
          <Route path="db-storage" element={<DbStorage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
