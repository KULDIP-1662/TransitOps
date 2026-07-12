import { type ComponentType } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings as SettingsIcon,
  Moon,
  Sun,
  LogOut,
  Search,
  Bell,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ErrorBoundary from './ErrorBoundary';
import { ROLE_LABELS, type Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vehicles', label: 'Fleet', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trips', label: 'Trips', icon: Route },
  {
    to: '/maintenance',
    label: 'Maintenance',
    icon: Wrench,
    roles: ['FLEET_MANAGER'],
  },
  { to: '/fuel', label: 'Fuel & Expenses', icon: Fuel },
  {
    to: '/reports',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'],
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: SettingsIcon,
    roles: ['FLEET_MANAGER'],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const visibleNav = NAV.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Truck size={20} />
          </div>
          <div>
            <div className="font-heading text-lg font-bold leading-tight">
              TransitOps
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              Fleet Operations
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-4 py-3 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
          TransitOps © 2026 · RBAC Enabled
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search records, references, drivers…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Bell size={18} />
            </button>

            <div className="mx-1 flex items-center gap-2.5 border-l border-slate-200 pl-3 dark:border-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {user?.name?.[0] ?? '?'}
              </div>
              <div className="hidden leading-tight md:block">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-slate-400">
                  {user ? ROLE_LABELS[user.role] : ''}
                </div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
