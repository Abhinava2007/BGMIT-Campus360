import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../types/index.js';
import {
  AlertCircle,
  Plus,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
  Filter,
  EyeOff,
  X,
  AlertTriangle,
  Download,
  Trash2,
  ShieldAlert,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const ComplaintsView: React.FC = () => {
  const { currentUser, allUsers, addToast } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // New Complaint Form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<ComplaintCategory>('infrastructure');
  const [newPriority, setNewPriority] = useState<ComplaintPriority>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Assist on form
  const [aiChecking, setAiChecking] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Response Form
  const [responseMsg, setResponseMsg] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  // Resolution Form
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  // Assign Staff Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Escalate Modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalating, setEscalating] = useState(false);

  // Delete / Archive Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isStaff = ['faculty', 'hod', 'super_admin', 'sports_coordinator'].includes(currentUser.role);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.getComplaints();
      setComplaints(res.complaints);
      if (selectedComplaint) {
        const updated = res.complaints.find((c) => c.trackingId === selectedComplaint.trackingId);
        if (updated) setSelectedComplaint(updated);
      }
    } catch (err: any) {
      addToast('error', 'Error loading grievances', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [currentUser.id]);

  const handleAiClassify = async () => {
    if (!newTitle && !newDescription) {
      addToast('warning', 'Need Text', 'Enter title and description to classify.');
      return;
    }
    setAiChecking(true);
    setDuplicateWarning(null);
    try {
      const [catRes, dupRes] = await Promise.all([
        api.categorizeComplaintAI(newTitle, newDescription),
        api.checkDuplicateComplaintAI(newTitle, newDescription),
      ]);
      setNewCategory(catRes.category as ComplaintCategory);
      setNewPriority(catRes.priority as ComplaintPriority);
      if (dupRes.isDuplicate) {
        setDuplicateWarning(dupRes.reason || `Possible duplicate of ${dupRes.similarTrackingId}`);
      }
      addToast('info', 'AI Categorized', `Assigned: ${catRes.category} [${catRes.priority}]`);
    } catch (err: any) {
      addToast('error', 'AI Assistant error', err.message);
    } finally {
      setAiChecking(false);
    }
  };

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) {
      addToast('error', 'Incomplete', 'Please provide title and description.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createComplaint({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
        isAnonymous,
        department: currentUser.department,
      });
      addToast('success', 'Grievance Registered', `Tracking ID: ${res.complaint.trackingId}`);
      setShowFileModal(false);
      setNewTitle('');
      setNewDescription('');
      setIsAnonymous(false);
      setDuplicateWarning(null);
      loadComplaints();
    } catch (err: any) {
      addToast('error', 'Failed to lodge grievance', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !responseMsg.trim()) return;

    setSendingResponse(true);
    try {
      await api.respondToComplaint(selectedComplaint.trackingId, responseMsg);
      addToast('success', 'Response Logged', 'Message added to official response ledger.');
      setResponseMsg('');
      loadComplaints();
    } catch (err: any) {
      addToast('error', 'Failed sending response', err.message);
    } finally {
      setSendingResponse(false);
    }
  };

  const handleUpdateStatus = async (status: ComplaintStatus) => {
    if (!selectedComplaint) return;
    try {
      await api.updateComplaintStatus(selectedComplaint.trackingId, status);
      addToast('info', 'Status Updated', `Grievance status changed to ${status.toUpperCase()}`);
      loadComplaints();
    } catch (err: any) {
      addToast('error', 'Status update failed', err.message);
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint) return;
    try {
      await api.updateComplaintStatus(selectedComplaint.trackingId, 'resolved', resolveNotes);
      addToast('success', 'Grievance Resolved', 'Case marked resolved with official explanation.');
      setShowResolveModal(false);
      setResolveNotes('');
      loadComplaints();
    } catch (err: any) {
      addToast('error', 'Resolution error', err.message);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedComplaint || !assignStaffId) return;
    setAssigning(true);
    try {
      await api.updateComplaintStatus(selectedComplaint.trackingId, 'assigned', undefined, assignStaffId);
      addToast('success', 'Staff Assigned', 'Grievance reassigned to specified faculty/coordinator.');
      setShowAssignModal(false);
      setAssignStaffId('');
      loadComplaints();
    } catch (err: any) {
      addToast('error', 'Assignment failed', err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedComplaint || !escalateReason.trim()) {
      addToast('error', 'Reason Required', 'Please provide a justification for escalating to HOD.');
      return;
    }
    setEscalating(true);
    try {
      await api.escalateComplaint(selectedComplaint.trackingId, escalateReason);
      addToast('warning', 'Escalated to HOD', `Case ${selectedComplaint.trackingId} escalated to Head of Department.`);
      setShowEscalateModal(false);
      setEscalateReason('');
      loadComplaints();
    } catch (err: any) {
      addToast('error', 'Escalation failed', err.message);
    } finally {
      setEscalating(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;
    setDeleting(true);
    try {
      await api.deleteComplaint(selectedComplaint.trackingId, deleteReason);
      addToast('info', 'Grievance Removed', `Grievance ${selectedComplaint.trackingId} archived/deleted.`);
      setShowDeleteModal(false);
      setDeleteReason('');
      setSelectedComplaint(null);
      loadComplaints();
    } catch (err: any) {
      addToast('error', 'Deletion error', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Tracking ID', 'Title', 'Category', 'Priority', 'Status', 'Submitter', 'Department', 'Assignee', 'Created At'];
    const rows = filtered.map((c) => [
      c.trackingId,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.priority,
      c.status,
      `"${c.isAnonymous && currentUser.role !== 'super_admin' ? 'Confidential' : c.submitterName.replace(/"/g, '""')}"`,
      c.department,
      `"${c.assigneeName || 'Unassigned'}"`,
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bgmit_grievances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Downloaded grievances report to CSV.');
  };

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedComplaints = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Grievance Redressal Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
              6h SLA Acknowledgment
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official institutional grievance management with confidential submission options and auditable resolution trails.
          </p>
        </div>

        <button
          onClick={() => {
            setShowFileModal(true);
            setDuplicateWarning(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lodge Grievance</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Tracking ID, title, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="academic">Academic</option>
            <option value="laboratory">Laboratory</option>
            <option value="sports">Sports</option>
            <option value="administrative">Administrative</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Complaints Grid and Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Listing */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">Loading grievance records...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700">No grievances matching criteria</h3>
              <p className="text-xs text-slate-400">All student issues have been processed or none match the filter.</p>
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = selectedComplaint?.trackingId === c.trackingId;
              return (
                <div
                  key={c.trackingId}
                  onClick={() => setSelectedComplaint(c)}
                  className={`p-5 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/20 ring-2 ring-purple-600/10 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">{c.trackingId}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            c.category === 'infrastructure'
                              ? 'bg-blue-100 text-blue-800'
                              : c.category === 'academic'
                              ? 'bg-amber-100 text-amber-800'
                              : c.category === 'laboratory'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.category}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            c.priority === 'critical'
                              ? 'bg-rose-600 text-white'
                              : c.priority === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.priority}
                        </span>
                        {c.isAnonymous && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            <span>Confidential</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 pt-1 leading-snug">{c.title}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${
                        c.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : c.status === 'acknowledged'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Filed by: <strong className="text-slate-700">{c.submitterName}</strong> ({c.department})
                    </span>
                    <span>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Selected Complaint Details & Official Thread */}
        <div className="space-y-4">
          {selectedComplaint ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 sticky top-20">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">{selectedComplaint.trackingId}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      selectedComplaint.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {selectedComplaint.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-1">{selectedComplaint.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: <strong className="text-slate-800 capitalize">{selectedComplaint.category}</strong> • Priority: {selectedComplaint.priority}
                </p>
              </div>

              {/* Status Progression Bar */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Redressal Workflow</p>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span className={selectedComplaint.status !== 'submitted' ? 'text-blue-600' : 'text-slate-900'}>Submitted</span>
                  <span>→</span>
                  <span className={selectedComplaint.status === 'acknowledged' ? 'text-blue-600' : ''}>Acknowledged</span>
                  <span>→</span>
                  <span className={selectedComplaint.status === 'in_progress' ? 'text-blue-600' : ''}>In Progress</span>
                  <span>→</span>
                  <span className={selectedComplaint.status === 'resolved' ? 'text-emerald-600' : ''}>Resolved</span>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900 mb-1">Issue Details:</p>
                <p>{selectedComplaint.description}</p>
              </div>

              {/* Resolution Note if resolved */}
              {selectedComplaint.resolutionNotes && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Official Resolution Note</span>
                  </p>
                  <p className="mt-1">{selectedComplaint.resolutionNotes}</p>
                </div>
              )}

              {/* Staff Status Action Controls */}
              {isStaff && selectedComplaint.status !== 'closed' && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staff Decision Action</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedComplaint.status === 'submitted' && (
                      <button
                        onClick={() => handleUpdateStatus('acknowledged')}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Acknowledge (SLA)
                      </button>
                    )}
                    {selectedComplaint.status === 'acknowledged' && (
                      <button
                        onClick={() => handleUpdateStatus('in_progress')}
                        className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {selectedComplaint.status !== 'resolved' && (
                      <button
                        onClick={() => setShowResolveModal(true)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                      >
                        Resolve Grievance
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Response Log Thread */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-900">Official Communication Thread ({selectedComplaint.responses.length})</p>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {selectedComplaint.responses.length === 0 ? (
                    <p className="text-slate-400 text-[11px] italic">No responses logged yet.</p>
                  ) : (
                    selectedComplaint.responses.map((resp) => (
                      <div
                        key={resp.id}
                        className={`p-2.5 rounded-xl text-xs space-y-0.5 ${
                          resp.isOfficial ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-800">
                            {resp.byName} ({resp.byRole})
                          </span>
                          <span className="text-slate-400">{new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-700 text-xs">{resp.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Response Input */}
                <form onSubmit={handleSendResponse} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Type an official remark or student inquiry..."
                    value={responseMsg}
                    onChange={(e) => setResponseMsg(e.target.value)}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingResponse}
                    className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Select a grievance from the ledger to inspect details, review responses, and manage resolution.
            </div>
          )}
        </div>
      </div>

      {/* Lodge Grievance Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Lodge Official Student Grievance</h3>
              <button onClick={() => setShowFileModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFileComplaint} className="mt-4 space-y-3.5 text-xs">
              {/* Duplicate Warning Callout */}
              {duplicateWarning && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Notice: Similar Complaint Detected</span>
                    <p className="text-[11px] mt-0.5">{duplicateWarning}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Grievance Summary / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Systems Lab GPU Workstations Overheating & Fan Noise"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Comprehensive Description <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAiClassify}
                    disabled={aiChecking}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{aiChecking ? 'Classifying...' : 'AI Auto-Categorize & Duplicate Check'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="State the location, date, nature of difficulty, and impact on academics or student life..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ComplaintCategory)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="infrastructure">Infrastructure & Facilities</option>
                    <option value="academic">Academic & Classroom</option>
                    <option value="laboratory">Laboratory & Equipment</option>
                    <option value="sports">Sports & Extracurricular</option>
                    <option value="administrative">Administrative Services</option>
                    <option value="other">Other Campus Concerns</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as ComplaintPriority)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (6h SLA Acknowledgment)</option>
                    <option value="critical">Critical (Immediate Escalation)</option>
                  </select>
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="accent-purple-600 w-4 h-4 rounded"
                />
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Confidential / Anonymous Submission</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Your student name and identity will be masked and hidden from ordinary mentors and departmental staff.
                  </p>
                </div>
              </label>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Lodge Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900">Resolve Grievance Redressal Case</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide official resolution notes explaining what actions were taken to fix the issue.
            </p>

            <div className="mt-4 space-y-3">
              <textarea
                rows={3}
                required
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Detail resolution measures taken by facilities / faculty..."
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
