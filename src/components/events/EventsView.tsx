import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { CollegeEvent, VolunteerDuty } from '../../types/index.js';
import {
  CalendarDays,
  Plus,
  Trophy,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  HandHelping,
  X,
  Share2,
} from 'lucide-react';

export const EventsView: React.FC = () => {
  const { currentUser, addToast } = useAuth();
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [registeringEvent, setRegisteringEvent] = useState<CollegeEvent | null>(null);
  const [volunteerEvent, setVolunteerEvent] = useState<CollegeEvent | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CollegeEvent['type']>('sports');
  const [newDescription, setNewDescription] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCapacity, setNewCapacity] = useState(100);
  const [creating, setCreating] = useState(false);

  // Register Form State
  const [teamName, setTeamName] = useState('');
  const [registering, setRegistering] = useState(false);

  // Volunteer Duty Form State
  const [dutyTitle, setDutyTitle] = useState('');
  const [dutyDescription, setDutyDescription] = useState('');
  const [enlisting, setEnlisting] = useState(false);

  const canCreate = ['sports_coordinator', 'coordinator', 'faculty', 'hod', 'super_admin'].includes(currentUser.role);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents();
      setEvents(res.events);
    } catch (err: any) {
      addToast('error', 'Error loading events', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentUser.id]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVenue || !newDate || !newTime) return;

    setCreating(true);
    try {
      await api.createEvent({
        title: newTitle,
        type: newType,
        description: newDescription,
        venue: newVenue,
        date: newDate,
        time: newTime,
        capacity: newCapacity,
      });
      addToast('success', 'Event Created', 'Event published to student campus calendar.');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewVenue('');
      setNewDate('');
      setNewTime('');
      loadEvents();
    } catch (err: any) {
      addToast('error', 'Creation error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringEvent) return;

    setRegistering(true);
    try {
      await api.registerEvent(registeringEvent.id, teamName || undefined);
      addToast('success', 'Registration Confirmed', `You are registered for ${registeringEvent.title}`);
      setRegisteringEvent(null);
      setTeamName('');
      loadEvents();
    } catch (err: any) {
      addToast('error', 'Registration error', err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleClaimVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerEvent || !dutyTitle) return;

    setEnlisting(true);
    try {
      await api.volunteerDuty(volunteerEvent.id, dutyTitle, dutyDescription);
      addToast('success', 'Volunteer Duty Enlisted', `Assigned duty: "${dutyTitle}"`);
      setVolunteerEvent(null);
      setDutyTitle('');
      setDutyDescription('');
      loadEvents();
    } catch (err: any) {
      addToast('error', 'Duty error', err.message);
    } finally {
      setEnlisting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sports & Campus Events</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
              Inter-Department Leagues
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tournaments, technical symposia, cultural festivals, team rosters, and volunteer duty management.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Event</span>
          </button>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading campus events...</div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No scheduled events</h3>
          <p className="text-xs text-slate-400">Events scheduled by coordinators will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => {
            const isRegistered = ev.participants.some((p) => p.userId === currentUser.id);
            const myDuty = ev.volunteerDuties.find((v) => v.assignedUserId === currentUser.id);

            return (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        ev.type === 'sports'
                          ? 'bg-orange-100 text-orange-800'
                          : ev.type === 'technical'
                          ? 'bg-blue-100 text-blue-800'
                          : ev.type === 'cultural'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ev.type}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {ev.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{ev.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">{ev.description}</p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{ev.date} at {ev.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{ev.participants.length} / {ev.capacity} Registered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HandHelping className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{ev.volunteerDuties.length} Duties Assigned</span>
                    </div>
                  </div>

                  {/* Volunteer Duties Section */}
                  {ev.volunteerDuties.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                      <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                        Assigned Volunteer Crew
                      </p>
                      <div className="space-y-1">
                        {ev.volunteerDuties.map((vd) => (
                          <div key={vd.id} className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">{vd.title}</span>
                            <span className="text-slate-500 font-semibold">{vd.assignedUserName || 'Open Slot'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setVolunteerEvent(ev)}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <HandHelping className="w-3.5 h-3.5" />
                    <span>Enlist Duty</span>
                  </button>

                  {isRegistered ? (
                    <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Registered</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setRegisteringEvent(ev)}
                      disabled={ev.participants.length >= ev.capacity}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      Register Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register Modal */}
      {registeringEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900">Register for Event</h3>
            <p className="text-xs text-slate-500 mt-1">{registeringEvent.title}</p>

            <form onSubmit={handleRegister} className="mt-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Participant / Team Name (Optional)</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. CSE Warriors or Individual"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRegisteringEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {registering ? 'Confirming...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Volunteer Enlist Duty Modal */}
      {volunteerEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900">Enlist Volunteer Responsibility</h3>
            <p className="text-xs text-slate-500 mt-1">Event: {volunteerEvent.title}</p>

            <form onSubmit={handleClaimVolunteer} className="mt-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Duty Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Registration Desk Lead / Refreshments Coordinator"
                  value={dutyTitle}
                  onChange={(e) => setDutyTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scope & Responsibility Notes</label>
                <textarea
                  rows={2}
                  value={dutyDescription}
                  onChange={(e) => setDutyDescription(e.target.value)}
                  placeholder="Specific tasks to perform during event..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVolunteerEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enlisting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {enlisting ? 'Claiming...' : 'Claim Duty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Campus Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Inter-Department Athletics & Football League"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CollegeEvent['type'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="sports">Sports Tournament</option>
                    <option value="technical">Technical Hackathon</option>
                    <option value="cultural">Cultural Festival</option>
                    <option value="workshop">Academic Workshop</option>
                    <option value="fest">College Fest</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity Limit</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Event agenda, rules, prizes, and guidelines..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Campus Stadium Ground / Seminar Hall 1"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
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
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {creating ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
