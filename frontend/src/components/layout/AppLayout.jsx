import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LogOut, Luggage, MapPinned, LogIn, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function NavItem({ to, icon: Icon, active, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive: routeActive }) => {
        const isActive = active ?? routeActive;
        return `inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          isActive ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
        }`;
      }}
    >
      <Icon className="w-4 h-4" />
      {children}
    </NavLink>
  );
}

function TabItem({ to, icon: Icon, active, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
          (active ?? isActive) ? 'text-slate-900' : 'text-slate-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`px-5 py-1.5 rounded-full transition-all ${
              (active ?? isActive) ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25' : ''
            }`}
          >
            <Icon className="w-5 h-5" />
          </span>
          {children}
        </>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const onTrips = pathname.startsWith('/trips') && pathname !== '/trips/new';

  // Start each page at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Solid header: content never shows through or above it */}
      <header
        className={`sticky top-0 z-30 w-full bg-white border-b transition-shadow duration-300 ${
          scrolled ? 'border-stone-200 shadow-md shadow-slate-900/5' : 'border-stone-200/70'
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto h-16 sm:h-[72px] px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3">
          <Link to={isAuthenticated ? '/trips' : '/destinations'} className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/30 flex-shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </span>
            <span className="font-serif text-lg font-bold text-slate-900 truncate">Smart Travel Planner</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-stone-100">
            {isAuthenticated && (
              <NavItem to="/trips" icon={Luggage} active={pathname.startsWith('/trips')}>
                My trips
              </NavItem>
            )}
            <NavItem to="/destinations" icon={MapPinned}>
              Destinations
            </NavItem>
          </nav>

          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <span className="hidden md:flex items-center gap-2 pr-1 text-sm text-slate-700">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-white text-sm font-bold flex items-center justify-center uppercase ring-2 ring-white shadow">
                    {user?.username?.[0] || '?'}
                  </span>
                  <span className="max-w-[9rem] truncate font-medium">{user?.username}</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                  className="inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Log out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/20"
              >
                <LogIn className="w-4 h-4" />
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-32 md:pb-16">
        <Outlet />
      </main>

      {/* Mobile tab bar */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-30 rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch px-2 py-1">
          {isAuthenticated && (
            <TabItem to="/trips" icon={Luggage} active={onTrips}>
              Trips
            </TabItem>
          )}
          {isAuthenticated && (
            <TabItem to="/trips/new" icon={Plus}>
              New trip
            </TabItem>
          )}
          <TabItem to="/destinations" icon={MapPinned}>
            Explore
          </TabItem>
        </div>
      </nav>
    </div>
  );
}
