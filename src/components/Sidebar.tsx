import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  CheckSquare,
  Vote,
  AlertCircle,
  FileText,
  CalendarDays,
  Megaphone,
  Sliders,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Users,
  MapPin,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenAI: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isOpen,
  onClose,
  onOpenAI,
}) => {
  const { currentUser } = useAuth();

  const isStaffOrAdmin = ['super_admin', 'hod', 'faculty', 'election_officer', 'sports_coordinator'].includes(
    currentUser.role
  );

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string | null;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Overview & Matrix',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks',
      label: 'Responsibilities & Tasks',
      icon: CheckSquare,
      badge: null,
    },
    {
      id: 'elections',
      label: 'Council Elections & Voting',
      icon: Vote,
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'complaints',
      label: 'Student Grievance Redressal',
      icon: AlertCircle,
      badge: null,
    },
    {
      id: 'requests',
      label: 'Leaves & On-Duty Permissions',
      icon: FileText,
      badge: null,
    },
    {
      id: 'events',
      label: 'Sports & Campus Events',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'notices',
      label: 'Official Circulars & Notices',
      icon: Megaphone,
      badge: null,
    },
    {
      id: 'rules',
      label: 'Accountability & SLA Rules',
      icon: Sliders,
      badge: 'SLA Engine',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'campus',
      label: 'Campus & Location Map',
      icon: MapPin,
      badge: 'Mudhol',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
  ];

  // Audit log and User Management accessible to HOD and Super Admin
  if (currentUser.role === 'super_admin' || currentUser.role === 'hod') {
    navItems.push({
      id: 'users',
      label: 'User Directory & Access',
      icon: Users,
      badge: currentUser.role === 'super_admin' ? 'Admin' : null,
      badgeColor: 'bg-purple-100 text-purple-800',
    });
    navItems.push({
      id: 'audit',
      label: 'Administrative Audit Trail',
      icon: ShieldAlert,
      badge: null,
      badgeColor: '',
    });
  }

  const handleNavClick = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[65px] left-0 h-screen lg:h-[calc(100vh-65px)] w-64 bg-white border-r border-slate-200 z-40 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Institutional Header in Mobile */}
          <div className="lg:hidden pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/bgmit-logo.svg"
                alt="BGMIT Emblem"
                className="w-9 h-9 object-contain rounded-full border border-amber-400 bg-slate-900 p-0.5"
              />
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">BGMIT Mudhol</span>
                <span className="text-[10px] text-slate-500 font-medium block">BVVS • VTU Belagavi</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Governance Navigation
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* AI Quick Banner */}
          <div className="mt-6 p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>College AI Agent</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Instant answers grounded in college policy documents & SLA guidelines.
            </p>
            <button
              onClick={() => {
                onOpenAI();
                onClose();
              }}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <span>Ask AI Assistant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* User Card footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">
                {currentUser.role.replace('_', ' ')} • {currentUser.department}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
