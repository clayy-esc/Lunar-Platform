import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { PanelsTopLeft, GitBranch, MonitorPlay, ChartNoAxesCombined, ListChecks, Palette, Settings2, LogOut, X } from 'lucide-react';
import { LunarLogo } from '../common/LunarLogo';

interface SidebarProps {
  surveyId?: string;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ surveyId, onLogout, isMobileOpen = false, onMobileClose }) => {
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
    if (!surveyId) return [];
    const base = `/dashboard/${surveyId}`;
    return [
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
      <aside id="survey-navigation" aria-label="Survey navigation" className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 -translate-x-full flex-col border-r border-slate-200/70 bg-white/80 shadow-lg backdrop-blur-2xl transition-transform duration-200 ease-out md:static md:w-64 md:translate-x-0 md:transition-none ${isMobileOpen ? 'translate-x-0' : ''}`}>
        <div className="h-20 flex items-center px-5 border-b border-slate-200/70">
          <LunarLogo size={36} showText={true} subtitle="Survey Builder Platform" />
          <button
            type="button"
            onClick={closeOnMobile}
            aria-label="Close survey navigation"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          {navLinks.length > 0 ? (
            <nav className="space-y-1.5">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeOnMobile}
                  className={({ isActive }) =>
                    `group flex min-h-11 items-center rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50/90 text-indigo-700 shadow-xs border border-indigo-100/80 font-bold'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-xs border border-transparent'
                    }`
                  }
                >
                  <link.icon className="mr-3 h-4.5 w-4.5 opacity-80 transition-transform group-hover:scale-105" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <div className="mx-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm leading-6 text-slate-500">
              Select a survey to open its workspace.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200/70 p-3">
          <button
            onClick={onLogout}
            type="button"
            className="flex min-h-11 w-full items-center rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="mr-3 h-5 w-5 opacity-75" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
};
