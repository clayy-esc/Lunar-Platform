import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PanelsTopLeft, GitBranch, MonitorPlay, ChartNoAxesCombined, ListChecks, Palette, Settings2, LogOut, X } from 'lucide-react';
import { LunarLogo } from '../common/LunarLogo';
import { useAuth } from '../../contexts/useAuth';

interface SidebarProps {
  surveyId?: string;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ surveyId, onLogout, isMobileOpen = false, onMobileClose }) => {
  const { user } = useAuth();
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose?.();
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen, onMobileClose]);

  const getNavLinks = () => {
    const links = [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true }];
    if (!surveyId) return links;
    const base = `/dashboard/${surveyId}`;
    return [
      ...links,
      { to: `${base}/builder`, icon: PanelsTopLeft, label: 'Form Builder' },
      { to: `${base}/logic`, icon: GitBranch, label: 'Logic Flow' },
      { to: `${base}/preview`, icon: MonitorPlay, label: 'Preview' },
      { to: `${base}/analytics`, icon: ChartNoAxesCombined, label: 'Analytics' },
      { to: `${base}/submissions`, icon: ListChecks, label: 'Submissions' },
      { to: `${base}/theme`, icon: Palette, label: 'Theme' },
      { to: `${base}/settings`, icon: Settings2, label: 'Settings' },
    ];
  };

  const navLinks = getNavLinks();

  const closeOnMobile = () => onMobileClose?.();

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close survey navigation"
          onClick={closeOnMobile}
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-xs md:hidden"
        />
      )}
      <aside id="survey-navigation" aria-label="Survey navigation" className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 -translate-x-full flex-col transition-transform duration-200 ease-out md:static md:w-60 md:translate-x-0 md:transition-none ${isMobileOpen ? 'translate-x-0' : ''}`}>
        <div className="flex h-20 items-center border-b border-white/10 px-5">
          <LunarLogo
            size={36}
            showText={true}
            textClassName="[&_.text-slate-900]:text-white [&_.text-slate-500]:text-slate-400"
          />
          <button
            type="button"
            onClick={closeOnMobile}
            aria-label="Close survey navigation"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169b2] focus-visible:ring-offset-2 md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </div>
          <nav className="space-y-1.5">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/dashboard'}
                  onClick={closeOnMobile}
                  className={({ isActive }) =>
                    `sidebar-nav-item group flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'sidebar-nav-item-active font-bold'
                        : 'border border-transparent'
                    }`
                  }
                >
                  <link.icon className="mr-3 h-4.5 w-4.5 opacity-80 transition-transform group-hover:scale-105" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
            {surveyId && (
            <div className="mt-7 border-t border-white/10 pt-6">
              <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Current survey
              </div>
              <div className="mx-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#ffb928]" />
                <span className="truncate">Survey workspace</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4169b2] text-xs font-extrabold text-white">
              {(user?.email[0] || 'L').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">Your account</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email || 'Lunar member'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            type="button"
            className="flex min-h-11 w-full items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5 opacity-75" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
};
