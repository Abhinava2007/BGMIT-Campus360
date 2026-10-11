import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { GovernanceRequest, RequestType, RequestStatus } from '../../types/index.js';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  X,
  Building,
} from 'lucide-react';

export const RequestsView: React.FC = () => {
  const { currentUser, addToast } = useAuth();
  const [requests, setRequests] = useState<GovernanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Form Modal
  const [showModal, setShowModal] = useState(false);
  const [newType, setNewType] = useState<RequestType>('leave');
  const [newTitle, setNewTitle] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newReviewerRole, setNewReviewerRole] = useState('Faculty');
  const [submitting, setSubmitting] = useState(false);

  // Decision Modal
  const [decidingRequest, setDecidingRequest] = useState<GovernanceRequest | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [deciding, setDeciding] = useState(false);

  const isReviewer = ['faculty', 'hod', 'super_admin'].includes(currentUser.role);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getRequests();
      setRequests(res.requests);
    } catch (err: any) {
      addToast('error', 'Error loading requests', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser.id]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newReason || !newStartDate || !newEndDate) {
      addToast('error', 'Missing Data', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createRequest({
        type: newType,
        title: newTitle,
        reason: newReason,
        startDate: newStartDate,
        endDate: newEndDate,
        reviewerRole: newReviewerRole,
      });
      addToast('success', 'Request Submitted', `Tracking ID: ${res.request.trackingId}`);
      setShowModal(false);
      setNewTitle('');
      setNewReason('');
      setNewStartDate('');
      setNewEndDate('');
      loadRequests();
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecide = async (status: 'approved' | 'rejected') => {
    if (!decidingRequest) return;
    setDeciding(true);
    try {
      await api.decideRequest(decidingRequest.trackingId, status, decisionNotes);
      addToast('success', 'Decision Rendered', `Request marked ${status.toUpperCase()}`);
      setDecidingRequest(null);
      setDecisionNotes('');
      loadRequests();
    } catch (err: any) {
      addToast('error', 'Decision Error', err.message);
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leaves & On-Duty Permissions</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
              48h Review SLA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institutional approval workflow for academic leaves, event participation, lab passes, and campus privileges.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Permission</span>
        </button>
      </div>

      {/* Requests Ledger */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading permission requests...</div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No requests submitted</h3>
          <p className="text-xs text-slate-400">Apply for leaves, hackathon on-duty attendance, or lab access.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const canReview = isReviewer && req.status === 'submitted';
            return (
              <div
                key={req.trackingId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{req.trackingId}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                        {req.type.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{req.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{req.reason}</p>
                  </div>

                  {canReview && (
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDecidingRequest(req);
                          setDecisionNotes('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        Review Decision
                      </button>
                    </div>
                  )}
                </div>

                {/* Decision Notes Callout */}
                {req.decisionNotes && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      req.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <span className="font-bold">Official Decision Note: </span>
                    <span>{req.decisionNotes}</span>
                    {req.reviewerName && <span className="block text-[10px] text-slate-500 mt-0.5">By {req.reviewerName}</span>}
                  </div>
                )}

                {/* Footer metadata */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span>
                      Applicant: <strong className="text-slate-800">{req.submitterName}</strong> ({req.department})
                    </span>
                    <span>•</span>
                    <span>Review Authority: {req.reviewerRole}</span>
                  </div>

                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: {req.startDate} to {req.endDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Submit Permission Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Request Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as RequestType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="leave">Medical / Personal Leave</option>
                    <option value="event_participation">On-Duty Hackathon / Event</option>
                    <option value="council_duty">Student Council Duty</option>
                    <option value="lab_access">Special Lab Access</option>
                    <option value="hall_booking">Seminar Hall Booking</option>
                    <option value="other">Other Official Permission</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reviewing Authority</label>
                  <select
                    value={newReviewerRole}
                    onChange={(e) => setNewReviewerRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="Faculty">Faculty Mentor</option>
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="Super Admin">Dean of Academic Affairs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Purpose / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. On-Duty Attendance for National Hackathon Participation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Justification & Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain reason, event invitation details, or medical context..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Decision Modal */}
      {decidingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900">Review Request Decision</h3>
            <p className="text-xs text-slate-500 mt-1">
              Applicant: <strong className="text-slate-800">{decidingRequest.submitterName}</strong> • {decidingRequest.title}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Decision Justification / Remarks</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Provide decision notes, conditions, or instructions..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setDecidingRequest(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDecide('rejected')}
                  disabled={deciding}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleDecide('approved')}
                  disabled={deciding}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
