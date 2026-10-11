import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Bell,
  Sparkles,
  UserCheck,
  ChevronDown,
  Building2,
  Menu,
  X,
  Clock,
  ExternalLink,
  MapPin,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Vote,
  Calendar,
  Megaphone,
  User,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAI: () => void;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenAI, onNavigate }) => {
  const {
    currentUser,
    allUsers,
    switchUser,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.globalSearch(searchQuery.trim());
        setSearchResults(res.results);
        setShowSearchDropdown(true);
      } catch (_) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hod':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'faculty':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coordinator':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'election_officer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sports_coordinator':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'hod':
        return 'HOD';
      case 'faculty':
        return 'Faculty Mentor';
      case 'coordinator':
        return 'Student Coordinator';
      case 'election_officer':
        return 'Election Officer';
      case 'sports_coordinator':
        return 'Sports Coordinator';
      default:
        return 'Student';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onNavigate('campus')}>
            <img
              src="/bgmit-logo.svg"
              alt="BGMIT Mudhol Emblem"
              className="w-10 h-10 object-contain shrink-0 rounded-full border border-amber-400/60 bg-slate-900 p-0.5 shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 text-base leading-none">
                  BGMIT <span className="text-blue-700 font-black">MUDHOL</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  VTU • AICTE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block mt-0.5 truncate max-w-xs">
                Biluru Gurubasav Mahaswamiji Institute of Tech • BVVS
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="relative flex-1 max-w-md mx-2 hidden md:block" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search students, tasks, complaints, events, circulars..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none text-slate-800 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Search Results {isSearching ? '(Searching...)' : `(${searchResults.length})`}</span>
                <span className="text-[10px] font-normal text-slate-400">Esc or click outside to close</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {isSearching ? 'Searching campus records...' : 'No matching records found across your authorized scope.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        onNavigate(item.linkModule);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="p-3 hover:bg-blue-50/60 transition cursor-pointer flex items-start gap-2.5 group"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 shrink-0 mt-0.5">
                        {item.type === 'user' && <User className="w-3.5 h-3.5" />}
                        {item.type === 'task' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {item.type === 'complaint' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.type === 'request' && <FileText className="w-3.5 h-3.5" />}
                        {item.type === 'event' && <Calendar className="w-3.5 h-3.5" />}
                        {item.type === 'election' && <Vote className="w-3.5 h-3.5" />}
                        {item.type === 'notice' && <Megaphone className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions, Campus Map, AI button, Notifications, Persona Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Direct Campus Map & Directions Button */}
          <button
            onClick={() => onNavigate('campus')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition text-xs font-semibold cursor-pointer"
            title="View BGMIT Mudhol Campus Map & Directions"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden md:inline">Campus &amp; Map</span>
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 border border-indigo-200/80 shadow-sm transition text-xs font-semibold group cursor-pointer"
            title="Open College AI Assistant"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden sm:inline">Governance AI</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-700 rounded-full">
                      {unreadCount} unread
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          onNavigate(notif.linkModule);
                          setShowNotifMenu(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 ${
                          !notif.isRead ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            !notif.isRead ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-slate-300'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{notif.title}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="capitalize px-1 rounded bg-slate-100 text-slate-600 font-medium">
                              {notif.linkModule}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role & Persona Switcher */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                      currentUser.role
                    )}`}
                  >
                    {formatRoleName(currentUser.role)}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
            </button>

            {/* Persona Switcher Dropdown */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
                      Active User Persona
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                      ID: {currentUser.rollNumber || currentUser.id}
                    </span>
                  </div>
                  <p className="font-bold text-sm mt-1">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-300">{currentUser.email}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-white/15 font-medium">
                      Dept: {currentUser.department}
                    </span>
                    {currentUser.semester && (
                      <span className="px-1.5 py-0.5 rounded bg-white/15 font-medium">
                        Sem {currentUser.semester}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                    Switch Test Persona ({allUsers.length} Roles Available)
                  </p>
                </div>

                <div className="max-h-72 overflow-y-auto p-1 divide-y divide-slate-50">
                  {allUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                          isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.department}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(
                              u.role
                            )}`}
                          >
                            {formatRoleName(u.role)}
                          </span>
                          {isSelected && <UserCheck className="w-4 h-4 text-blue-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
