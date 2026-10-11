import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, NotificationItem } from '../types/index.js';
import { api } from '../services/api.js';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  switchUser: (userId: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const DEFAULT_USER: User = {
  id: 'usr_student',
  name: 'Priya Patel',
  email: 'priya.patel@student.apex.edu',
  role: 'student',
  department: 'Computer Science',
  semester: 6,
  section: 'A',
  rollNumber: 'CS23-088',
  status: 'active',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = `tst_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadUsersAndMe = async (userIdToSelect?: string) => {
    try {
      if (userIdToSelect) {
        api.setUserId(userIdToSelect);
      }
      const [meRes, usersRes] = await Promise.all([api.getMe(), api.getUsers()]);
      setCurrentUser(meRes.user);
      setAllUsers(usersRes.users);
      refreshNotifications();
    } catch (err) {
      console.error('Failed to load user state:', err);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (_) {}
  };

  const switchUser = (userId: string) => {
    api.setUserId(userId);
    loadUsersAndMe(userId);
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      addToast('info', 'Switched Persona', `Active as ${target.name} (${target.role.replace('_', ' ').toUpperCase()})`);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (_) {}
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (_) {}
  };

  useEffect(() => {
    loadUsersAndMe();
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        switchUser,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
