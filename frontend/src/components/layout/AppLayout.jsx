import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Compass, LogOut, Luggage, MapPinned, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`
      }
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{children}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-dotted-pattern">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to={isAuthenticated ? '/trips' : '/destinations'} className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-sm flex-shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </span>
            <span className="font-serif text-lg font-bold text-slate-900 truncate hidden sm:inline">
              Smart Travel Planner
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {isAuthenticated && <NavItem to="/trips" icon={Luggage}>My trips</NavItem>}
            <NavItem to="/destinations" icon={MapPinned}>Destinations</NavItem>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="hidden md:flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center uppercase">
                    {user?.username?.[0] || '?'}
                  </span>
                  {user?.username}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
              >
                <LogIn className="w-4 h-4" />
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
