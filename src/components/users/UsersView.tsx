import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { User, UserRole } from '../../types/index.js';
import {
  Users,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building,
  GraduationCap,
  X,
  Lock,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { currentUser, allUsers, switchUser, addToast } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // New User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newSemester, setNewSemester] = useState<number>(6);
  const [newSection, setNewSection] = useState('A');
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err: any) {
      addToast('error', 'Error loading directory', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser.id]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newRole || !newDept) {
      addToast('error', 'Missing Fields', 'Name, email, role, and department are required.');
      return;
    }

    setCreating(true);
    try {
      await api.createUser({
        name: newName,
        email: newEmail,
        role: newRole,
        department: newDept,
        semester: newRole === 'student' || newRole === 'coordinator' ? newSemester : undefined,
        section: newRole === 'student' || newRole === 'coordinator' ? newSection : undefined,
        rollNumber: newRollNumber || undefined,
        phone: newPhone || undefined,
      });
      addToast('success', 'User Account Created', `Provisioned ${newName} as ${newRole.toUpperCase()}`);
      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewRollNumber('');
      setNewPhone('');
      loadUsers();
    } catch (err: any) {
      addToast('error', 'Failed creating user', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUser(user.id, { status: nextStatus });
      addToast('info', 'Status Updated', `${user.name} is now ${nextStatus.toUpperCase()}`);
      loadUsers();
    } catch (err: any) {
      addToast('error', 'Status error', err.message);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    if (!isSuperAdmin) {
      addToast('error', 'Unauthorized', 'Only Super Admin can change user roles.');
      return;
    }
    try {
      await api.updateUser(userId, { role: targetRole });
      addToast('success', 'Role Updated', `Assigned role ${targetRole.toUpperCase()}`);
      loadUsers();
    } catch (err: any) {
      addToast('error', 'Role update error', err.message);
    }
  };

  // Filter users
  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (deptFilter !== 'all' && u.department !== deptFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional User Directory & Access Control</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC Authority</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage student registrations, authorized administrative roles, account statuses, and institutional access.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New User</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, roll number, or institutional email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="super_admin">Super Admin</option>
            <option value="hod">HOD</option>
            <option value="faculty">Faculty</option>
            <option value="coordinator">Student Coordinator</option>
            <option value="election_officer">Election Officer</option>
            <option value="sports_coordinator">Sports Coordinator</option>
            <option value="student">Student</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics & Comm.">Electronics</option>
            <option value="Physical Education & Athletics">Physical Education</option>
            <option value="Administration">Administration</option>
          </select>
        </div>
      </div>

      {/* Directory Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading user registry...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No matching user accounts</h3>
          <p className="text-xs text-slate-400">Try adjusting search or role filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => {
            const isSelf = user.id === currentUser.id;
            const isSuspended = user.status === 'suspended';

            return (
              <div
                key={user.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition flex flex-col justify-between ${
                  isSuspended ? 'border-rose-200 bg-rose-50/20 opacity-70' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-slate-900 truncate">{user.name}</h3>
                          {isSelf && (
                            <span className="text-[9px] font-bold px-1 rounded bg-blue-100 text-blue-800">YOU</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                        isSuspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Department</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">{user.department}</span>
                    </div>
                    {user.rollNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Roll Number</span>
                        <span className="font-mono text-slate-800 font-semibold">{user.rollNumber}</span>
                      </div>
                    )}
                    {user.semester && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Semester / Section</span>
                        <span className="font-semibold text-slate-800">
                          Sem {user.semester} • Sec {user.section || 'A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Role Switch */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isSuperAdmin && !isSelf ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className="text-[11px] font-bold p-1 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="student">Student</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="faculty">Faculty Mentor</option>
                      <option value="election_officer">Election Officer</option>
                      <option value="sports_coordinator">Sports Coordinator</option>
                      <option value="hod">HOD</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {user.role.replace('_', ' ')}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {/* Switch Persona directly */}
                    <button
                      onClick={() => switchUser(user.id)}
                      className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
                      title="Test as this persona"
                    >
                      Login As
                    </button>

                    {isSuperAdmin && !isSelf && (
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-1 rounded-lg transition cursor-pointer ${
                          isSuspended
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-rose-600 hover:bg-rose-50'
                        }`}
                        title={isSuspended ? 'Activate Account' : 'Suspend Account'}
                      >
                        {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Provision New User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Provision User Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.lin@student.apex.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Permission *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="coordinator">Student Coordinator</option>
                    <option value="faculty">Faculty Mentor</option>
                    <option value="election_officer">Election Officer</option>
                    <option value="sports_coordinator">Sports Coordinator</option>
                    <option value="hod">HOD</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Comm.">Electronics & Comm.</option>
                    <option value="Mechanical Eng.">Mechanical Eng.</option>
                    <option value="Civil Eng.">Civil Eng.</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Physical Education & Athletics">Physical Education</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              {(newRole === 'student' || newRole === 'coordinator') && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Semester</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={newSemester}
                      onChange={(e) => setNewSemester(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      placeholder="CS23-102"
                      value={newRollNumber}
                      onChange={(e) => setNewRollNumber(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 outline-none text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {creating ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
