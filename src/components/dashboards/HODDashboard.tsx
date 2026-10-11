import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import type { StudentTask, Complaint, GovernanceRequest, Election, CollegeEvent, Notice, AuditLog } from '../../types/index.js';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Vote,
  Calendar,
  CalendarDays,
  Download,
  Printer,
  TrendingUp,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Megaphone,
  UserCheck,
  Building2,
  CheckSquare,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const HODDashboard: React.FC<{ onNavigate: (tab: string) => void; onOpenAI: () => void }> = ({
  onNavigate,
  onOpenAI,
}) => {
  const { currentUser, addToast } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [requests, setRequests] = useState<GovernanceRequest[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');

  // AI Task summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Printable modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, tRes, cRes, rRes, eRes, evRes, nRes] = await Promise.all([
        api.getDashboardStats(),
        api.getTasks(),
        api.getComplaints(),
        api.getRequests(),
        api.getElections(),
        api.getEvents(),
        api.getNotices(),
      ]);
      setStats(sRes);
      setTasks(tRes.tasks);
      setComplaints(cRes.complaints);
      setRequests(rRes.requests);
      setElections(eRes.elections);
      setEvents(evRes.events);
      setNotices(nRes.notices);
      if (sRes.recentAudits) {
        setRecentAudits(sRes.recentAudits);
      }
    } catch (err: any) {
      addToast('error', 'Failed loading dashboard', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const handleGenerateAiSummary = async () => {
    setLoadingAi(true);
    try {
      const res = await api.summarizeTasksAI();
      setAiSummary(res.summary);
      addToast('success', 'Executive Summary Ready', 'Generated AI analysis of all pending obligations.');
    } catch (err: any) {
      addToast('error', 'AI Summary Failed', err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV for tasks & responsibilities from actual database
    const headers = ['Task ID', 'Title', 'Assignee', 'Assignee Role', 'Department', 'Priority', 'Status', 'Due Date', 'Reviewer'];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.assigneeName.replace(/"/g, '""')}"`,
      t.assigneeRole,
      t.department,
      t.priority,
      t.status,
      new Date(t.dueDate).toLocaleDateString(),
      `"${t.reviewerName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bgmit_governance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Downloaded comprehensive governance CSV report.');
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Connecting to BGMIT database...</p>
        <p className="text-xs text-slate-400">Loading live institutional records and governance statistics.</p>
      </div>
    );
  }

  const metrics = stats?.metrics || {};
  const deptStats = stats?.departmentStats || {};

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (deptFilter !== 'All' && t.department !== deptFilter) return false;
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (taskStatusFilter !== 'All' && t.status !== taskStatusFilter) return false;
    return true;
  });

  const overdueList = tasks.filter((t) => t.escalated || (new Date(t.dueDate) < new Date() && t.status !== 'verified'));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">College Admin Management Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Live Database</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized institutional governance and administrative command for authorized staff, HOD, and leadership.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('campus')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-xs cursor-pointer"
            title="View BGMIT Mudhol Campus Map"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>Campus Map</span>
          </button>

          <button
            onClick={handleGenerateAiSummary}
            disabled={loadingAi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{loadingAi ? 'Synthesizing...' : 'AI Executive Brief'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Institutional Campus Header Strip */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-900/40">
        <div className="flex items-center gap-3.5">
          <img
            src="/bgmit-logo.svg"
            alt="BGMIT Emblem"
            className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1 border border-amber-400/50 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-white">
                B.V.V. Sangha's Biluru Gurubasav Mahaswamiji Institute of Technology (BGMIT)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Mudhol Campus
              </span>
            </div>
            <p className="text-[11px] text-blue-200 mt-0.5 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Mantur Road, Mudhol - 587313, Bagalkot Dist. • Affiliated to VTU Belagavi</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://maps.app.goo.gl/tuFvXRTYUCLtEhBz8"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Get Directions</span>
          </a>
          <button
            onClick={() => onNavigate('campus')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium border border-white/15 transition cursor-pointer"
          >
            Campus Overview
          </button>
        </div>
      </div>

      {/* AI Executive Summary Card (if generated) */}
      {aiSummary && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span className="font-bold text-xs uppercase tracking-wider text-indigo-200">
                Gemini Executive Intelligence Brief
              </span>
            </div>
            <button
              onClick={() => setAiSummary(null)}
              className="text-white/60 hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
            {aiSummary}
          </p>
        </div>
      )}

      {/* Live Statistics (Section 1: All 8 Live Categories Calculated from Real DB) */}
      <div>
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
            Live Institutional Metrics
          </h2>
          <span className="text-[11px] text-slate-500">Auto-synchronized with backend records</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* 1. Total Registered Students and Faculty */}
          <div
            onClick={() => onNavigate('users')}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition">
                Students & Faculty
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics.totalStudents || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">Students</span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>{metrics.totalFaculty || 0} Faculty ({metrics.totalStaff || 0} Total Staff)</span>
              </p>
            </div>
          </div>

          {/* 2. Pending Approvals and Requests */}
          <div
            onClick={() => onNavigate('requests')}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition">
                Pending Approvals
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-indigo-700">
                {metrics.pendingApprovals || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">Awaiting Action</span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>{metrics.pendingRequests || 0} Leaves / OD • {metrics.pendingNominations || 0} Nominees</span>
              </p>
            </div>
          </div>

          {/* 3. Active and Overdue Student Responsibilities */}
          <div
            onClick={() => onNavigate('tasks')}
            className={`bg-white p-4 rounded-2xl border shadow-xs hover:shadow-md transition cursor-pointer group ${
              (metrics.overdueTasks || 0) > 0 ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-rose-600 transition">
                Responsibilities
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics.activeTasks || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">Active</span>
              </h3>
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>{metrics.overdueTasks || 0} Overdue • {metrics.submittedTasks || 0} Submitted</span>
              </p>
            </div>
          </div>

          {/* 4. Open and Resolved Student Complaints */}
          <div
            onClick={() => onNavigate('complaints')}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-purple-300 shadow-xs hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-600 transition">
                Grievance Redressal
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics.openComplaints || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">Open Cases</span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{metrics.resolvedComplaints || 0} Resolved • {metrics.escalatedComplaints || 0} Escalated</span>
              </p>
            </div>
          </div>

          {/* 5. Upcoming College Events & Sports Activities */}
          <div
            onClick={() => onNavigate('events')}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition">
                Events & Sports
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics.upcomingEvents || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">Scheduled</span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{metrics.sportsEvents || 0} Sports Activities • {events.length} Total</span>
              </p>
            </div>
          </div>

          {/* 6. Event Registrations and Volunteer Assignments */}
          <div
            onClick={() => onNavigate('events')}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-teal-300 shadow-xs hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-teal-600 transition">
                Registrations & Duties
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics.totalEventRegistrations || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">Enrolled</span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                <span>{metrics.totalVolunteerDuties || 0} Volunteer Assignments Enlisted</span>
              </p>
            </div>
          </div>

          {/* 7. Active Elections and Election Status */}
          <div
            onClick={() => onNavigate('elections')}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-sky-600 transition">
                Council Elections
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Vote className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics.activeElections || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">Live Stage</span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>{metrics.completedElections || 0} Concluded • Secret Ballot Protected</span>
              </p>
            </div>
          </div>

          {/* 8. Recent Announcements and Administrative Activities */}
          <div
            onClick={() => onNavigate('notices')}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-amber-300 shadow-xs hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-600 transition">
                Notices & Audits
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics.totalNotices || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">Circulars</span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{metrics.totalAuditActivities || 0} Administrative Audit Events</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* College Management Modules Quick Navigator (Section 3: Dedicated Modules) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              College Management Modules
            </h2>
            <p className="text-xs text-slate-500">Direct operational gateways with role-based access enforcement</p>
          </div>
          <span className="text-[11px] font-bold text-slate-400">7 Operational Systems</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-3">
          <button
            onClick={() => onNavigate('users')}
            className="p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 leading-tight">Students & Faculty</p>
            <p className="text-[10px] text-slate-500 mt-0.5">RBAC & Profiles</p>
          </button>

          <button
            onClick={() => onNavigate('tasks')}
            className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 leading-tight">Responsibilities</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Tasks & Deadlines</p>
          </button>

          <button
            onClick={() => onNavigate('complaints')}
            className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-rose-700 leading-tight">Grievance Desk</p>
            <p className="text-[10px] text-slate-500 mt-0.5">SLA & Escalations</p>
          </button>

          <button
            onClick={() => onNavigate('events')}
            className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 leading-tight">Sports & Events</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Schedules & Roster</p>
          </button>

          <button
            onClick={() => onNavigate('elections')}
            className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Vote className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-sky-700 leading-tight">Elections Hub</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Nominations & Vote</p>
          </button>

          <button
            onClick={() => onNavigate('requests')}
            className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 leading-tight">Approvals & Leaves</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Workflows & Decisions</p>
          </button>

          <button
            onClick={() => onNavigate('notices')}
            className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 leading-tight">Circulars & Notices</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Publish & Archive</p>
          </button>
        </div>
      </div>

      {/* Main Section: Responsibilities Ledger + Live Operations Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Responsibilities Ledger Table with Filters */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Student Responsibilities Ledger</h2>
              <p className="text-xs text-slate-500">Live operational ledger of student deliverables, deadlines, and verifications.</p>
            </div>

            {/* Department, Priority & Status Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer text-xs"
                >
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics & Comm.">Electronics</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mechanical Eng.">Mechanical Eng.</option>
                  <option value="Physical Education">Physical Education</option>
                </select>
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-2.5">Responsibility & Assignee</th>
                  <th className="pb-2.5">Dept</th>
                  <th className="pb-2.5">Priority</th>
                  <th className="pb-2.5">Deadline</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No responsibility records matching selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.slice(0, 8).map((task) => {
                    const isOverdue =
                      task.escalated || (new Date(task.dueDate) < new Date() && task.status !== 'verified');
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-3 pr-2">
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Assigned to: <span className="font-semibold text-slate-700">{task.assigneeName}</span> ({task.assigneeRole})
                          </p>
                        </td>
                        <td className="py-3 pr-2 font-medium text-slate-600">{task.department}</td>
                        <td className="py-3 pr-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              task.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : task.priority === 'high'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 pr-2 whitespace-nowrap">
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          {isOverdue && (
                            <span className="block text-[9px] text-rose-600 font-bold uppercase">Overdue</span>
                          )}
                        </td>
                        <td className="py-3 pr-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              task.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.status === 'submitted'
                                ? 'bg-amber-100 text-amber-800'
                                : task.status === 'returned'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-600 font-medium">
                          {task.reviewerName}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100">
            <span>Showing top {Math.min(filteredTasks.length, 8)} of {filteredTasks.length} tasks</span>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full Responsibilities Management</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Overdue Attention + Live Audit Stream */}
        <div className="space-y-6">
          {/* Overdue Attention Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Escalated Obligations</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {overdueList.length} Action Needed
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {overdueList.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  All responsibilities are within scheduled SLA timelines.
                </div>
              ) : (
                overdueList.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-xs text-rose-900 leading-tight">{t.title}</p>
                      <span className="text-[9px] font-bold px-1 rounded bg-rose-200 text-rose-900">
                        Past Deadline
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Assignee: <span className="font-semibold">{t.assigneeName}</span> • Reviewer: {t.reviewerName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Due: {new Date(t.dueDate).toLocaleDateString()} (Escalated to HOD)
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Administrative Audit Trail Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Administrative Audit Trail</h3>
              </div>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {recentAudits.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No administrative actions logged yet today.
                </div>
              ) : (
                recentAudits.slice(0, 4).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{log.details}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                      <span>By: {log.actorName}</span>
                      <span>•</span>
                      <span className="capitalize px-1 rounded bg-slate-200/60 text-slate-700">{log.module}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Department Workload Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
              Department Workload Distribution
            </h3>
            <div className="mt-3 space-y-3">
              {Object.entries(deptStats).map(([dept, count]: any) => (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{dept}</span>
                    <span className="font-bold text-slate-900">{count.tasks} Tasks</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, count.tasks * 20)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Official Dossier Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img src="/bgmit-logo.svg" alt="BGMIT" className="w-10 h-10 object-contain" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    B.V.V. Sangha's BGMIT Mudhol — Institutional Governance Dossier
                  </h3>
                  <p className="text-xs text-slate-500">Mantur Road, Mudhol - 587313 • VTU Affiliated • AY 2026-2027</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Total Responsibilities</span>
                  <p className="text-sm font-bold text-slate-900">{tasks.length} items logged</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Verified Completed</span>
                  <p className="text-sm font-bold text-slate-900">{metrics.verifiedTasks} approved</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Active Grievances</span>
                  <p className="text-sm font-bold text-slate-900">{complaints.length} cases tracked</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Electoral Ledger</span>
                  <p className="text-sm font-bold text-slate-900">{metrics.activeElections} scheduled elections</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Overdue & Escalated Liabilities:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {overdueList.map((t) => (
                    <li key={t.id}>
                      <span className="font-semibold text-slate-900">{t.title}</span> — Assignee: {t.assigneeName} ({t.department}), Due: {new Date(t.dueDate).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Send to Printer / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
