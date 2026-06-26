import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Home, MessageSquare, Ticket, LogOut, Eye, Activity, Database, IndianRupee, Gift, FilePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import useSocket from '../hooks/useSocket';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const SURFACE = '#F8F9FB';
const WHITE = '#fff';
const BORDER = '#E5E7EB';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/listings', label: 'Listings', icon: Home },
  { to: '/listings/new', label: 'Add Listing', icon: FilePlus },
  { to: '/chats', label: 'Chats', icon: MessageSquare },
  { to: '/tickets', label: 'Tickets', icon: Ticket, badgeKey: 'tickets' },
  { to: '/transactions', label: 'Transactions', icon: IndianRupee },
  { to: '/bonus-gifting', label: 'Bonus Gifting', icon: Gift },
  { to: '/guests', label: 'Guests', icon: Eye },
  { to: '/api-activity', label: 'API Activity', icon: Activity },
  { to: '/db-storage', label: 'DB Storage', icon: Database },
];

const breadcrumbMap = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/listings': 'Listings',
  '/listings/new': 'Listings / Add Listing',
  '/chats': 'Chats',
  '/tickets': 'Tickets',
  '/transactions': 'Transactions',
  '/bonus-gifting': 'Bonus Gifting',
  '/guests': 'Guests',
  '/api-activity': 'API Activity',
  '/db-storage': 'DB Storage',
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const socket = useSocket();
  const [ticketBadge, setTicketBadge] = useState(0);

  // Fetch badge count on mount
  useEffect(() => {
    api.get('/admin/tickets/badge-count')
      .then(res => setTicketBadge(res.data.data?.count || 0))
      .catch(() => {});
  }, []);

  // Socket listeners for ticket events
  useEffect(() => {
    if (!socket) return;

    const onTicketCreated = (ticket) => {
      setTicketBadge(prev => prev + 1);
      toast(`New ticket: ${ticket.subject || 'Support request'}`, { icon: '🎫', duration: 4000 });
    };

    const onTicketMessage = (data) => {
      if (data.fromUser) {
        toast(`New message on ticket #${data.ticketId.slice(-6)}`, { icon: '💬', duration: 3000 });
      }
    };

    const onTicketStatus = () => {
      // Refresh badge count when status changes
      api.get('/admin/tickets/badge-count')
        .then(res => setTicketBadge(res.data.data?.count || 0))
        .catch(() => {});
    };

    socket.on('ticket-created', onTicketCreated);
    socket.on('ticket-message', onTicketMessage);
    socket.on('ticket-status', onTicketStatus);

    return () => {
      socket.off('ticket-created', onTicketCreated);
      socket.off('ticket-message', onTicketMessage);
      socket.off('ticket-status', onTicketStatus);
    };
  }, [socket]);

  // Reset badge when viewing tickets page
  useEffect(() => {
    if (location.pathname.startsWith('/tickets')) {
      api.get('/admin/tickets/badge-count')
        .then(res => setTicketBadge(res.data.data?.count || 0))
        .catch(() => {});
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (breadcrumbMap[path]) return breadcrumbMap[path];
    if (path.startsWith('/users/')) return 'Users / User Detail';
    if (path.startsWith('/chats/')) return 'Chats / Conversation';
    if (path.startsWith('/tickets/')) return 'Tickets / Ticket Detail';
    if (path.startsWith('/guests/')) return 'Guests / Guest Detail';
    return 'Dashboard';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: SURFACE }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, minWidth: 260, background: DARK, display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      }}>
        <div style={{
          padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: WHITE, letterSpacing: -0.5 }}>
            Flat<span style={{ color: PRIMARY }}>Mate</span> Admin
          </span>
        </div>

        <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ to, label, icon: Icon, end, badgeKey }) => {
            const badge = badgeKey === 'tickets' ? ticketBadge : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 24px', textDecoration: 'none',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  color: isActive ? PRIMARY : 'rgba(255,255,255,0.6)',
                  background: isActive ? 'rgba(255,19,81,0.08)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent',
                  transition: 'all 0.15s',
                  position: 'relative',
                })}
              >
                <Icon size={18} />
                {label}
                {badge > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    minWidth: 20, height: 20, borderRadius: 10,
                    background: PRIMARY, color: WHITE,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 6px',
                  }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{
          height: 64, background: WHITE, borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <span style={{ fontSize: 14, color: MUTED, fontWeight: 500 }}>
            {getBreadcrumb()}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: PRIMARY,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: WHITE, fontSize: 13, fontWeight: 700,
            }}>
              {(admin.name || 'A').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>
              {admin.name || 'Admin'}
            </span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 32 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
