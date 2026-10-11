import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { GovernanceRule } from '../../types/index.js';
import {
  Sliders,
  Plus,
  Clock,
  ShieldCheck,
  AlertTriangle,
  History,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  X,
  FileCheck2,
} from 'lucide-react';

export const RulesView: React.FC = () => {
  const { currentUser, addToast } = useAuth();
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [historyRule, setHistoryRule] = useState<GovernanceRule | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newModule, setNewModule] = useState<GovernanceRule['module']>('tasks');
  const [newTrigger, setNewTrigger] = useState('');
  const [newRole, setNewRole] = useState('Faculty');
  const [newAction, setNewAction] = useState('');
  const [newSlaHours, setNewSlaHours] = useState(24);
  const [newEscalation, setNewEscalation] = useState('HOD');
  const [creating, setCreating] = useState(false);

  const canConfigure = currentUser.role === 'super_admin' || currentUser.role === 'hod';

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.getRules();
      setRules(res.rules);
    } catch (err: any) {
      addToast('error', 'Error loading rules', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [currentUser.id]);

  const handleToggleRule = async (id: string) => {
    if (!canConfigure) {
      addToast('error', 'Unauthorized', 'Only HOD and Super Admin can toggle governance rules.');
      return;
    }
    try {
      const res = await api.toggleRule(id);
      addToast('info', 'Rule Toggled', `${res.rule.title} is now ${res.rule.active ? 'ACTIVE' : 'INACTIVE'}`);
      loadRules();
    } catch (err: any) {
      addToast('error', 'Toggle error', err.message);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTrigger || !newAction) return;

    setCreating(true);
    try {
      await api.createRule({
        title: newTitle,
        description: newDescription,
        module: newModule,
        triggerCondition: newTrigger,
        responsibleRole: newRole,
        requiredAction: newAction,
        slaHours: newSlaHours,
        escalationDestination: newEscalation,
      });
      addToast('success', 'Rule Created', 'Governance SLA policy active and registered in engine.');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewTrigger('');
      setNewAction('');
      loadRules();
    } catch (err: any) {
      addToast('error', 'Creation error', err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rules & Accountability Engine</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Deterministic SLA Policies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            "Every responsibility has an owner, every task has a deadline, every approval has an authorized decision-maker, and every SLA breach has a deterministic escalation target."
          </p>
        </div>

        {canConfigure && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Governance Rule</span>
          </button>
        )}
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading accountability rules...</div>
      ) : rules.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Sliders className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No active governance rules</h3>
          <p className="text-xs text-slate-400">Configure SLA guidelines and automated escalation targets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`p-6 rounded-3xl border transition space-y-4 flex flex-col justify-between ${
                  rule.active
                    ? 'bg-white border-slate-200/90 shadow-xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        rule.module === 'tasks'
                          ? 'bg-blue-100 text-blue-800'
                          : rule.module === 'complaints'
                          ? 'bg-purple-100 text-purple-800'
                          : rule.module === 'approvals'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rule.module} SLA Policy
                    </span>

                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      disabled={!canConfigure}
                      className="cursor-pointer text-slate-500 hover:text-slate-900 transition flex items-center gap-1 text-xs font-bold"
                    >
                      {rule.active ? (
                        <>
                          <span className="text-emerald-700 text-[10px]">ACTIVE</span>
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 text-[10px]">INACTIVE</span>
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{rule.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rule.description}</p>
                  </div>

                  {/* Conditions & Actions Matrix */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">
                        Triggering Event / Condition
                      </span>
                      <span className="font-mono text-slate-800 text-[11px] font-semibold">{rule.triggerCondition}</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">
                        Mandated Action & Role
                      </span>
                      <span className="font-medium text-slate-800 text-[11px]">
                        <strong className="text-blue-700">{rule.responsibleRole}</strong>: {rule.requiredAction}
                      </span>
                    </div>
                  </div>

                  {/* SLA & Escalation Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>SLA: <strong>{rule.slaHours} Hours</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Escalate: <strong>{rule.escalationDestination}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer History */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Last updated: {new Date(rule.lastUpdated).toLocaleDateString()}</span>
                  <button
                    onClick={() => setHistoryRule(rule)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit History ({rule.approvalHistory.length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {historyRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Rule Enactment History</h3>
              <button onClick={() => setHistoryRule(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <p className="font-bold text-slate-800">{historyRule.title}</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                {historyRule.approvalHistory.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryRule(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Configure Institutional SLA Rule</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Grievance 6-Hour Acknowledgment SLA"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Intent</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="State the institutional policy rationale..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Module</label>
                  <select
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value as GovernanceRule['module'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="tasks">Tasks & Responsibilities</option>
                    <option value="complaints">Student Complaints</option>
                    <option value="approvals">Leave Approvals</option>
                    <option value="elections">Council Elections</option>
                    <option value="events">Sports & Events</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsible Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty Mentor</option>
                    <option value="HOD">HOD</option>
                    <option value="Coordinator">Student Coordinator</option>
                    <option value="Election Officer">Election Officer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trigger Condition *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Task past due date AND status != verified"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandated Action *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intervene with student, verify circumstances, or grant extension"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SLA Target (Hours)</label>
                  <input
                    type="number"
                    value={newSlaHours}
                    onChange={(e) => setNewSlaHours(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Escalation Destination</label>
                  <input
                    type="text"
                    value={newEscalation}
                    onChange={(e) => setNewEscalation(e.target.value)}
                    placeholder="e.g. HOD & Director of Governance"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {creating ? 'Enacting...' : 'Enact Rule Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
