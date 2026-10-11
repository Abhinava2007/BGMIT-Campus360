import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { StudentTask, User, TaskStatus, TaskPriority } from '../../types/index.js';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  UploadCloud,
  FileCheck2,
  Calendar,
  Search,
  Filter,
  History,
  ExternalLink,
  Star,
  X,
  Edit3,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { currentUser, allUsers, addToast } = useAuth();
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<StudentTask | null>(null);
  const [verifyingTask, setVerifyingTask] = useState<StudentTask | null>(null);
  const [historyTask, setHistoryTask] = useState<StudentTask | null>(null);

  // Edit / Reassign / Deadline Modal State
  const [editingTask, setEditingTask] = useState<StudentTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editTargetGroup, setEditTargetGroup] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editReassignReason, setEditReassignReason] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDeadlineReason, setEditDeadlineReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Cancel / Delete Modal State
  const [cancellingTask, setCancellingTask] = useState<StudentTask | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [forceDelete, setForceDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Assign Form State
  const [newTitle, setNewTitle] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTargetGroup, setNewTargetGroup] = useState('Year 3 Students');
  const [newOutcome, setNewOutcome] = useState('');
  const [newCriteria, setNewCriteria] = useState('');
  const [creating, setCreating] = useState(false);

  // Submit Form State
  const [submitNotes, setSubmitNotes] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verify Form State
  const [verifyApproved, setVerifyApproved] = useState(true);
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [verifyRating, setVerifyRating] = useState(5);
  const [returnReason, setReturnReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  const isStaffOrCoord = ['super_admin', 'hod', 'faculty', 'coordinator', 'sports_coordinator'].includes(
    currentUser.role
  );

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks();
      setTasks(res.tasks);
    } catch (err: any) {
      addToast('error', 'Error loading tasks', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [currentUser.id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newInstructions || !newAssigneeId || !newDueDate) {
      addToast('error', 'Incomplete Form', 'Please provide title, instructions, assignee, and due date.');
      return;
    }

    setCreating(true);
    try {
      await api.createTask({
        title: newTitle,
        instructions: newInstructions,
        assigneeId: newAssigneeId,
        priority: newPriority,
        dueDate: new Date(newDueDate).toISOString(),
        targetGroup: newTargetGroup,
        expectedOutcome: newOutcome,
        evidenceCriteria: newCriteria,
        department: currentUser.department,
      });
      addToast('success', 'Task Created', 'Student responsibility assigned and logged into audit trail.');
      setShowAssignModal(false);
      setNewTitle('');
      setNewInstructions('');
      setNewAssigneeId('');
      setNewDueDate('');
      loadTasks();
    } catch (err: any) {
      addToast('error', 'Failed creating task', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;
    if (!submitNotes || !evidenceLink) {
      addToast('error', 'Missing Data', 'Please fill in notes and document link.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitTask(submittingTask.id, submitNotes, evidenceLink);
      addToast('success', 'Proof Submitted', 'Task transitioned to submitted for faculty verification.');
      setSubmittingTask(null);
      setSubmitNotes('');
      setEvidenceLink('');
      loadTasks();
    } catch (err: any) {
      addToast('error', 'Submission error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingTask) return;

    setVerifying(true);
    try {
      await api.verifyTask(verifyingTask.id, verifyApproved, verifyFeedback, verifyRating, returnReason);
      addToast(
        'success',
        verifyApproved ? 'Task Approved & Verified' : 'Returned for Revision',
        `Decision recorded on task ${verifyingTask.id}`
      );
      setVerifyingTask(null);
      setVerifyFeedback('');
      setReturnReason('');
      loadTasks();
    } catch (err: any) {
      addToast('error', 'Verification error', err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await api.updateTaskStatus(taskId, 'in_progress', 'Student started working on task deliverables');
      addToast('info', 'Status Updated', 'Task marked as In Progress.');
      loadTasks();
    } catch (err: any) {
      addToast('error', 'Update error', err.message);
    }
  };

  const handleOpenEdit = (task: StudentTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditInstructions(task.instructions);
    setEditPriority(task.priority);
    setEditTargetGroup(task.targetGroup);
    setEditDepartment(task.department);
    setEditAssigneeId(task.assigneeId);
    setEditReassignReason('');
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
    setEditDeadlineReason('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    if (editAssigneeId !== editingTask.assigneeId && !editReassignReason.trim()) {
      addToast('error', 'Reason Required', 'Please record a reason for reassigning responsibility.');
      return;
    }

    const originalDueStr = new Date(editingTask.dueDate).toISOString().slice(0, 10);
    if (editDueDate && editDueDate !== originalDueStr && !editDeadlineReason.trim()) {
      addToast('error', 'Reason Required', 'Please record a reason for modifying task deadline.');
      return;
    }

    setSavingEdit(true);
    try {
      await api.updateTask(editingTask.id, {
        title: editTitle,
        instructions: editInstructions,
        priority: editPriority,
        targetGroup: editTargetGroup,
        department: editDepartment,
        assigneeId: editAssigneeId,
        reassignReason: editReassignReason || undefined,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
        deadlineReason: editDeadlineReason || undefined,
      });

      addToast('success', 'Task Updated', 'Responsibility parameters and audit trail updated successfully.');
      setEditingTask(null);
      loadTasks();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenCancel = (task: StudentTask) => {
    setCancellingTask(task);
    setCancelReason('');
    setForceDelete(false);
  };

  const handleConfirmDelete = async () => {
    if (!cancellingTask) return;
    setDeleting(true);
    try {
      await api.deleteTask(cancellingTask.id, cancelReason, forceDelete);
      addToast('success', 'Task Removed', `Task "${cancellingTask.title}" has been removed.`);
      setCancellingTask(null);
      loadTasks();
    } catch (err: any) {
      addToast('error', 'Deletion Error', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Task ID', 'Title', 'Assignee', 'Assignee Role', 'Department', 'Priority', 'Status', 'Due Date', 'Reviewer'];
    const rows = filtered.map((t) => [
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
    link.setAttribute('download', `bgmit_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Exported tasks ledger to CSV.');
  };

  // Filter tasks
  const filtered = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.instructions.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (deptFilter !== 'all' && t.department !== deptFilter) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        const isOverdue = t.escalated || (new Date(t.dueDate) < new Date() && t.status !== 'verified');
        if (!isOverdue) return false;
      } else if (t.status !== statusFilter) {
        return false;
      }
    }

    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedTasks = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Responsibilities Ledger</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Accountability Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            "Every responsibility has an owner, every task has a deadline, and every approval has an authorized reviewer."
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition shadow-xs cursor-pointer"
            title="Export filtered tasks to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {isStaffOrCoord && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Responsibility</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search responsibility, owner, or criteria..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics & Comm.">Electronics</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Mechanical Eng.">Mechanical Eng.</option>
            <option value="Physical Education">Physical Education</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All States ({tasks.length})</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue / Escalated</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task Cards Listing */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading responsibilities...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No responsibilities found</h3>
          <p className="text-xs text-slate-400">Try adjusting your search criteria or assign a new task.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedTasks.map((task) => {
            const isOverdue =
              task.escalated || (new Date(task.dueDate) < new Date() && task.status !== 'verified');
            const canSubmit = task.assigneeId === currentUser.id && ['assigned', 'in_progress', 'returned'].includes(task.status);
            const canVerify =
              ['submitted'].includes(task.status) &&
              (task.reviewerId === currentUser.id || currentUser.role === 'super_admin' || currentUser.role === 'hod');

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{task.id}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
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
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Overdue SLA</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{task.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{task.instructions}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      onClick={() => setHistoryTask(task)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                      title="View Activity Audit Timeline"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    {/* Edit Details / Reassign / Extend Deadline button */}
                    {isStaffOrCoord && (
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Edit Details, Reassign, or Extend Deadline"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete or Cancel task for HOD / Super Admin */}
                    {(currentUser.role === 'super_admin' || currentUser.role === 'hod') && (
                      <button
                        onClick={() => handleOpenCancel(task)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Cancel or Remove Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {task.status === 'assigned' && task.assigneeId === currentUser.id && (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="px-3 py-1.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-xs transition cursor-pointer"
                      >
                        Start Work
                      </button>
                    )}

                    {canSubmit && (
                      <button
                        onClick={() => setSubmittingTask(task)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Submit Proof</span>
                      </button>
                    )}

                    {canVerify && (
                      <button
                        onClick={() => {
                          setVerifyingTask(task);
                          setVerifyApproved(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Review & Verify</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Submissions & Return Notice Callout */}
                {task.submission && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                      <span>Submitted Proof & Notes:</span>
                      <span className="font-normal text-amber-700">
                        {new Date(task.submission.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700">{task.submission.notes}</p>
                    <a
                      href={task.submission.evidenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold text-[11px] pt-0.5"
                    >
                      <span>Open verification document link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {task.returnedReason && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                    <span className="font-bold">Returned for Changes: </span>
                    <span>{task.returnedReason}</span>
                  </div>
                )}

                {task.verification && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start justify-between">
                    <div>
                      <span className="font-bold">Verified Complete: </span>
                      <span>{task.verification.feedback}</span>
                    </div>
                    {task.verification.rating && (
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{task.verification.rating}/5</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer metadata */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span>
                      Owner: <strong className="text-slate-800">{task.assigneeName}</strong> ({task.assigneeRole})
                    </span>
                    <span>•</span>
                    <span>
                      Reviewer: <strong className="text-slate-800">{task.reviewerName}</strong>
                    </span>
                    <span>•</span>
                    <span>Dept: {task.department}</span>
                  </div>

                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">
                Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({filtered.length} total records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Assign Student Responsibility</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Systems Lab Workstation Benchmark & Kernel Audit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Detailed Instructions & Scope <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain exactly what steps must be performed..."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Responsible Assignee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                  >
                    <option value="">Select Student / Staff Member</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role} - {u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Priority Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Due Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Group</label>
                  <input
                    type="text"
                    value={newTargetGroup}
                    onChange={(e) => setNewTargetGroup(e.target.value)}
                    placeholder="e.g. Lab Assistants / Student Committee"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expected Outcome</label>
                <input
                  type="text"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  placeholder="e.g. Signed physical hardware checklist and PDF summary"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification Criteria</label>
                <input
                  type="text"
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  placeholder="e.g. Verification link with serial numbers tested by student"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {creating ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {submittingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Submit Completion Evidence</h3>
            <p className="text-xs text-slate-500 mt-1">
              Task: <strong className="text-slate-800">{submittingTask.title}</strong>
            </p>

            <form onSubmit={handleSubmitProof} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Completion Summary & Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="Detail the work completed, challenges resolved, or findings..."
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Evidence Document Link <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={evidenceLink}
                  onChange={(e) => setEvidenceLink(e.target.value)}
                  placeholder="e.g. https://apex.edu/proofs/test-audit.pdf"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Criteria: {submittingTask.evidenceCriteria}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Verify Modal */}
      {verifyingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Review & Verify Responsibility</h3>
            <p className="text-xs text-slate-500 mt-1">
              Task: <strong className="text-slate-800">{verifyingTask.title}</strong>
            </p>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-700">Submitted by {verifyingTask.assigneeName}:</span>
              <p className="text-slate-600">{verifyingTask.submission?.notes}</p>
              {verifyingTask.submission?.evidenceLink && (
                <a
                  href={verifyingTask.submission.evidenceLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-bold underline inline-flex items-center gap-1 mt-1"
                >
                  <span>Inspect Submitted Document</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <form onSubmit={handleVerify} className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyApproved(true)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    verifyApproved
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Verify</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyApproved(false)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    !verifyApproved
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return for Revisions</span>
                </button>
              </div>

              {verifyApproved ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Faculty Feedback & Sign-Off
                    </label>
                    <textarea
                      rows={2}
                      value={verifyFeedback}
                      onChange={(e) => setVerifyFeedback(e.target.value)}
                      placeholder="e.g. Work inspected and verified in accordance with departmental standards."
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quality Score (1-5)</label>
                    <select
                      value={verifyRating}
                      onChange={(e) => setVerifyRating(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                    >
                      <option value={5}>5 - Outstanding Excellence</option>
                      <option value={4}>4 - Meets All Criteria</option>
                      <option value={3}>3 - Acceptable Completion</option>
                      <option value={2}>2 - Marginal</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-bold text-rose-700 mb-1">
                    Specific Revision Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Clearly specify which benchmarks or sections need correction..."
                    className="w-full p-2.5 rounded-xl border border-rose-300 outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyingTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className={`px-4 py-2 rounded-xl text-white font-bold disabled:opacity-50 ${
                    verifyApproved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {verifying ? 'Recording...' : verifyApproved ? 'Sign & Approve' : 'Return Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Audit History Modal */}
      {historyTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Task Activity History</h3>
              <button
                onClick={() => setHistoryTask(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="border-l-2 border-blue-500 pl-4 space-y-3.5">
                {historyTask.activityHistory.map((act) => (
                  <div key={act.id} className="relative text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1 border-2 border-white ring-1 ring-blue-400" />
                    <p className="font-bold text-slate-900">{act.action}</p>
                    <p className="text-[11px] text-slate-500">
                      By <span className="font-semibold text-slate-700">{act.byName}</span> ({act.byRole}) • {new Date(act.timestamp).toLocaleString()}
                    </p>
                    {act.notes && (
                      <p className="mt-1 p-2 bg-slate-50 rounded-lg text-slate-600 text-[11px] border border-slate-100">
                        {act.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end">
              <button
                onClick={() => setHistoryTask(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details, Reassign, or Extend Deadline Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Task & Reassign Responsibility</h3>
                <p className="text-xs text-slate-500">ID: {editingTask.id} • Assigned to: {editingTask.assigneeName}</p>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions & Deliverables</label>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Group</label>
                  <input
                    type="text"
                    value={editTargetGroup}
                    onChange={(e) => setEditTargetGroup(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 font-medium outline-none"
                  />
                </div>
              </div>

              {/* Reassignment Section */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reassign Student Responsibility</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Select New Assignee</label>
                    <select
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none"
                    >
                      {allUsers
                        .filter((u) => u.role === 'student' || u.role === 'coordinator')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.department})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Reason for Reassignment {editAssigneeId !== editingTask.assigneeId && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Workload reallocation, leave"
                      value={editReassignReason}
                      onChange={(e) => setEditReassignReason(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Deadline Adjustment Section */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Adjust Deadline & Due Date</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">New Due Date</label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Reason for Deadline Change {editDueDate !== new Date(editingTask.dueDate).toISOString().slice(0, 10) && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Extension approved by HOD"
                      value={editDeadlineReason}
                      onChange={(e) => setEditDeadlineReason(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Saving...' : 'Save & Record Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel / Delete Task Confirmation Modal */}
      {cancellingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Cancel or Remove Responsibility?</h3>
            <p className="text-xs text-slate-600 mt-1">
              You are removing task <strong className="text-slate-900">"{cancellingTask.title}"</strong> assigned to{' '}
              <strong className="text-slate-900">{cancellingTask.assigneeName}</strong>.
            </p>

            {cancellingTask.status === 'verified' && (
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">Compliance Warning: </span>
                This task was already verified and approved. Deleting it requires Super Admin override policy.
                <label className="flex items-center gap-2 mt-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    className="rounded text-rose-600"
                  />
                  <span>Confirm policy override deletion</span>
                </label>
              </div>
            )}

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation / Removal (Recorded in Audit Log)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter justification for canceling this responsibility..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingTask(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting || (cancellingTask.status === 'verified' && !forceDelete)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm shadow-rose-600/30"
              >
                {deleting ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
