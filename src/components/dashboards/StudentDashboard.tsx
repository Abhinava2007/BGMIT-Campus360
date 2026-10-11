import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { StudentTask, Election, Complaint, GovernanceRequest, CollegeEvent } from '../../types/index.js';
import {
  CheckSquare,
  Clock,
  Vote,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

export const StudentDashboard: React.FC<{
  onNavigate: (tab: string) => void;
  onOpenAI: () => void;
}> = ({ onNavigate, onOpenAI }) => {
  const { currentUser, addToast } = useAuth();
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [requests, setRequests] = useState<GovernanceRequest[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick submit modal
  const [submittingTask, setSubmittingTask] = useState<StudentTask | null>(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [tRes, eRes, cRes, rRes, evRes] = await Promise.all([
        api.getTasks(),
        api.getElections(),
        api.getComplaints(),
        api.getRequests(),
        api.getEvents(),
      ]);
      setTasks(tRes.tasks);
      setElections(eRes.elections);
      setComplaints(cRes.complaints);
      setRequests(rRes.requests);
      setEvents(evRes.events);
    } catch (err: any) {
      addToast('error', 'Failed loading data', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [currentUser.id]);

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;
    if (!submitNotes || !evidenceLink) {
      addToast('error', 'Missing Fields', 'Please provide notes and a valid link/document reference.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitTask(submittingTask.id, submitNotes, evidenceLink);
      addToast('success', 'Evidence Submitted', 'Task submitted to reviewer for official verification.');
      setSubmittingTask(null);
      setSubmitNotes('');
      setEvidenceLink('');
      loadStudentData();
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading your student governance profile...</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status !== 'verified');
  const activeElections = elections.filter((e) => e.status === 'voting_open');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Student Welcome Cockpit with BGMIT Branding */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-blue-500/20">
        <div className="flex items-start gap-4">
          <img
            src="/bgmit-logo.svg"
            alt="BGMIT Emblem"
            className="w-14 h-14 object-contain rounded-2xl bg-white/10 p-1 border border-amber-400/40 shrink-0 hidden sm:block"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-wider">
                Student Responsibility Cockpit
              </span>
              <span className="text-xs text-blue-200 font-mono">USN / Roll: {currentUser.rollNumber || '2BG23CS042'}</span>
              <span className="text-[10px] text-emerald-300 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                BGMIT Mudhol (VTU)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
              Department of {currentUser.department} • Semester {currentUser.semester || 6}, Section {currentUser.section || 'A'}.
              You have <strong className="text-white underline">{pendingTasks.length} active responsibilities</strong> on your ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => onNavigate('tasks')}
            className="px-4 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs shadow-md hover:bg-blue-50 transition cursor-pointer"
          >
            My Responsibilities
          </button>
          <button
            onClick={() => onNavigate('campus')}
            className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            title="Campus Map & Directions"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-300" />
            <span>Campus Map</span>
          </button>
          <button
            onClick={onOpenAI}
            className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Live Election Alert Banner (if any election is voting open) */}
      {activeElections.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                  Democratic Polling Live
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className="font-bold text-sm text-slate-900">{activeElections[0].title}</p>
              <p className="text-xs text-slate-600">
                Exercise your student council franchise. One verified secret ballot per student.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('elections')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Cast Secret Ballot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: My Responsibilities + Requests & Grievances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Assigned Responsibilities */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span>My Assigned Responsibilities</span>
              </h2>
              <p className="text-xs text-slate-500">Every task has a verification criteria and deadline.</p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All ({tasks.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                You have no assigned responsibilities currently.
              </div>
            ) : (
              tasks.map((task) => {
                const isOverdue =
                  task.escalated || (new Date(task.dueDate) < new Date() && task.status !== 'verified');
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
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
                        {isOverdue && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white uppercase">
                            Overdue
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{task.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{task.instructions}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Due: {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <span>•</span>
                        <span>Reviewer: {task.reviewerName}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                      {task.status === 'assigned' || task.status === 'in_progress' || task.status === 'returned' ? (
                        <button
                          onClick={() => setSubmittingTask(task)}
                          className="w-full px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Submit Proof</span>
                        </button>
                      ) : task.status === 'submitted' ? (
                        <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Under Faculty Review</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified & Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Requests & Grievances Tracker */}
        <div className="space-y-6">
          {/* My Requests (Leave & Permissions) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>My Permission Requests</span>
              </h3>
              <button
                onClick={() => onNavigate('requests')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                + New
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {requests.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No permission requests submitted.
                </div>
              ) : (
                requests.slice(0, 3).map((r) => (
                  <div key={r.trackingId} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{r.trackingId}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          r.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-900">{r.title}</p>
                    <p className="text-[10px] text-slate-500">
                      Duration: {r.startDate} to {r.endDate}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Complaints / Grievances */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-600" />
                <span>My Filed Grievances</span>
              </h3>
              <button
                onClick={() => onNavigate('complaints')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                + File
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {complaints.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No grievances lodged by your account.
                </div>
              ) : (
                complaints.slice(0, 3).map((c) => (
                  <div key={c.trackingId} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{c.trackingId}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
                          c.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 truncate">{c.title}</p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {c.category} • {c.responses.length} official responses
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events Registration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Upcoming Sports & Events</span>
              </h3>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Explore
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {events.slice(0, 2).map((ev) => (
                <div key={ev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-bold text-slate-900">{ev.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {ev.venue} • {ev.date} at {ev.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Work Modal */}
      {submittingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Submit Completion Evidence</h3>
            <p className="text-xs text-slate-500 mt-1">
              Task: <strong className="text-slate-800">{submittingTask.title}</strong>
            </p>

            <form onSubmit={handleSubmitWork} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Completion Notes & Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="Detail the work performed, findings, or system configurations completed..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Evidence Link or Verification Doc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={evidenceLink}
                  onChange={(e) => setEvidenceLink(e.target.value)}
                  placeholder="e.g. https://apex.edu/proofs/test-audit.pdf or Google Drive link"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Required Criteria: {submittingTask.evidenceCriteria}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
