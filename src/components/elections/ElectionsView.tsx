import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { Election, Candidate, ElectionStatus } from '../../types/index.js';
import {
  Vote,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Award,
  AlertTriangle,
  X,
  FileCheck,
  Calendar,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const ElectionsView: React.FC = () => {
  const { currentUser, addToast } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votingElection, setVotingElection] = useState<Election | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [ballotReceipt, setBallotReceipt] = useState<string | null>(null);
  const [castingVote, setCastingVote] = useState(false);

  // Nominate Modal
  const [nominatingElection, setNominatingElection] = useState<Election | null>(null);
  const [manifesto, setManifesto] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [nominating, setNominating] = useState(false);

  // New Election Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newNominationStart, setNewNominationStart] = useState('');
  const [newNominationEnd, setNewNominationEnd] = useState('');
  const [newVotingStart, setNewVotingStart] = useState('');
  const [newVotingEnd, setNewVotingEnd] = useState('');
  const [creating, setCreating] = useState(false);

  // Voter status map { [electionId]: boolean }
  const [voterStatusMap, setVoterStatusMap] = useState<Record<string, boolean>>({});

  const isOfficerOrAdmin = currentUser.role === 'election_officer' || currentUser.role === 'super_admin';

  const loadElections = async () => {
    setLoading(true);
    try {
      const res = await api.getElections();
      setElections(res.elections);

      // Check voting status for current user across all voting_open elections
      const statusMap: Record<string, boolean> = {};
      for (const e of res.elections) {
        if (e.status === 'voting_open' || e.status === 'voting_closed' || e.status === 'results_published') {
          try {
            const vRes = await api.checkVoterStatus(e.id);
            statusMap[e.id] = vRes.hasVoted;
          } catch (_) {}
        }
      }
      setVoterStatusMap(statusMap);
    } catch (err: any) {
      addToast('error', 'Error loading elections', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
  }, [currentUser.id]);

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPosition || !newVotingStart || !newVotingEnd) {
      addToast('error', 'Missing fields', 'Title, position, and voting window are required.');
      return;
    }

    setCreating(true);
    try {
      await api.createElection({
        title: newTitle,
        position: newPosition,
        description: newDescription,
        nominationStart: newNominationStart || new Date().toISOString(),
        nominationEnd: newNominationEnd || new Date(Date.now() + 7 * 86400000).toISOString(),
        votingStart: newVotingStart,
        votingEnd: newVotingEnd,
      });
      addToast('success', 'Election Scheduled', 'Election created and logged into Commission ledger.');
      setShowCreateModal(false);
      setNewTitle('');
      setNewPosition('');
      setNewDescription('');
      loadElections();
    } catch (err: any) {
      addToast('error', 'Creation error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCastVote = async () => {
    if (!votingElection || !selectedCandidateId) {
      addToast('error', 'Select Candidate', 'Please select a candidate on the ballot.');
      return;
    }

    setCastingVote(true);
    try {
      const res = await api.castVote(votingElection.id, selectedCandidateId);
      setBallotReceipt(res.ballotReceipt);
      addToast('success', 'Secret Ballot Cast', res.message);
      loadElections();
    } catch (err: any) {
      addToast('error', 'Vote Rejected', err.message);
    } finally {
      setCastingVote(false);
    }
  };

  const handleNominate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominatingElection || !manifesto) return;

    setNominating(true);
    try {
      await api.nominateCandidate(nominatingElection.id, manifesto, photoUrl);
      addToast('success', 'Nomination Submitted', 'Your candidacy is pending Election Officer verification.');
      setNominatingElection(null);
      setManifesto('');
      setPhotoUrl('');
      loadElections();
    } catch (err: any) {
      addToast('error', 'Nomination Error', err.message);
    } finally {
      setNominating(false);
    }
  };

  const handleUpdateStatus = async (electionId: string, status: ElectionStatus) => {
    try {
      await api.updateElectionStatus(electionId, status);
      addToast('info', 'Status Updated', `Election transitioned to ${status.replace('_', ' ').toUpperCase()}`);
      loadElections();
    } catch (err: any) {
      addToast('error', 'Update failed', err.message);
    }
  };

  const handleCandidateVerify = async (
    electionId: string,
    candId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      await api.verifyCandidate(electionId, candId, status);
      addToast('success', 'Candidate Verified', `Nomination marked ${status.toUpperCase()}`);
      loadElections();
    } catch (err: any) {
      addToast('error', 'Verification error', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Council Election Commission</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secret Ballot Ledger</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cryptographically decoupled voter participation ledger preventing duplicate ballots with absolute voter privacy.
          </p>
        </div>

        {isOfficerOrAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configure New Election</span>
          </button>
        )}
      </div>

      {/* Elections Listing */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading electoral registry...</div>
      ) : elections.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Vote className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No scheduled elections</h3>
          <p className="text-xs text-slate-400">The Election Commission has not declared any active ballots.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {elections.map((elec) => {
            const hasVoted = voterStatusMap[elec.id];
            const isVotingOpen = elec.status === 'voting_open';
            const isNominationOpen = elec.status === 'nomination_open';
            const isResultsPublished = elec.status === 'results_published';

            // Find winner if results published
            const sortedCandidates = [...elec.candidates].sort((a, b) => b.votesCount - a.votesCount);
            const winner = isResultsPublished && sortedCandidates.length > 0 ? sortedCandidates[0] : null;

            return (
              <div
                key={elec.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5"
              >
                {/* Election Title & Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{elec.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isVotingOpen
                            ? 'bg-emerald-100 text-emerald-800'
                            : isNominationOpen
                            ? 'bg-blue-100 text-blue-800'
                            : isResultsPublished
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {elec.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        AY {elec.academicYear}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">{elec.title}</h2>
                    <p className="text-xs text-slate-500 max-w-2xl">{elec.description}</p>
                  </div>

                  {/* Top Right Action & Officer State Transition controls */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      {isVotingOpen && (
                        <button
                          onClick={() => {
                            setVotingElection(elec);
                            setSelectedCandidateId('');
                            setBallotReceipt(null);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                            hasVoted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <Vote className="w-4 h-4" />
                          <span>{hasVoted ? 'Ballot Already Recorded' : 'Enter Secret Voting Booth'}</span>
                        </button>
                      )}

                      {isNominationOpen && (
                        <button
                          onClick={() => {
                            setNominatingElection(elec);
                            setManifesto('');
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Submit Candidacy Nomination</span>
                        </button>
                      )}
                    </div>

                    {/* Officer Status Transition Controls */}
                    {isOfficerOrAdmin && (
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Commission Action:</span>
                        {elec.status === 'nomination_open' && (
                          <button
                            onClick={() => handleUpdateStatus(elec.id, 'campaign_period')}
                            className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-slate-100 rounded-lg text-slate-700 shadow-xs cursor-pointer"
                          >
                            Close Nominations & Start Campaign
                          </button>
                        )}
                        {elec.status === 'campaign_period' && (
                          <button
                            onClick={() => handleUpdateStatus(elec.id, 'voting_open')}
                            className="text-[10px] font-bold px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
                          >
                            Open Polling Booths
                          </button>
                        )}
                        {elec.status === 'voting_open' && (
                          <button
                            onClick={() => handleUpdateStatus(elec.id, 'voting_closed')}
                            className="text-[10px] font-bold px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs cursor-pointer"
                          >
                            Close Polling
                          </button>
                        )}
                        {elec.status === 'voting_closed' && (
                          <button
                            onClick={() => handleUpdateStatus(elec.id, 'results_published')}
                            className="text-[10px] font-bold px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs cursor-pointer"
                          >
                            Publish Official Tally
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Turnout Statistics & Winner Announcement */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Verified Ballots Cast</span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{elec.totalBallotsCast} Votes</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Electoral Window</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {new Date(elec.votingStart).toLocaleDateString()} to {new Date(elec.votingEnd).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Voter Eligibility</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      Active Status • Semesters {elec.eligibleSemesters.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Published Winner Callout */}
                {winner && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-300 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                          Official Election Winner Declared
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{winner.name} ({winner.department})</h4>
                        <p className="text-xs text-slate-600">
                          Secured victory with <strong className="text-slate-900">{winner.votesCount} votes</strong> (
                          {Math.round((winner.votesCount / (elec.totalBallotsCast || 1)) * 100)}% of total electorate).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Candidates Slate */}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Candidate Slate & Manifestos ({elec.candidates.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {elec.candidates.map((cand) => {
                      const votePct = elec.totalBallotsCast > 0 ? Math.round((cand.votesCount / elec.totalBallotsCast) * 100) : 0;
                      return (
                        <div
                          key={cand.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-600 font-bold text-sm">
                                {cand.photoUrl ? (
                                  <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                                ) : (
                                  cand.name.substring(0, 2)
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-slate-900 truncate">{cand.name}</h4>
                                <p className="text-xs text-slate-500">
                                  {cand.department} • Roll {cand.rollNumber}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                cand.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : cand.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {cand.status}
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed italic">
                            "{cand.manifesto}"
                          </div>

                          {/* Live Tally Bar (Shown if voting closed, results published, or officer) */}
                          {(isResultsPublished || isOfficerOrAdmin) && (
                            <div className="space-y-1 pt-1 border-t border-slate-100">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-600">Recorded Ballots</span>
                                <span className="text-slate-900 font-bold">
                                  {cand.votesCount} ({votePct}%)
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                  style={{ width: `${votePct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Candidate Verification Actions for Officer */}
                          {isOfficerOrAdmin && cand.status === 'pending' && (
                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                              <button
                                onClick={() => handleCandidateVerify(elec.id, cand.id, 'rejected')}
                                className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                Disqualify
                              </button>
                              <button
                                onClick={() => handleCandidateVerify(elec.id, cand.id, 'approved')}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer shadow-xs"
                              >
                                Approve Nomination
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Secret Voting Booth Modal */}
      {votingElection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Encrypted Secret Ballot Booth</h3>
              </div>
              <button
                onClick={() => setVotingElection(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {ballotReceipt ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Ballot Successfully Sealed & Tallied</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your participation has been verified in the voter registry. Your secret candidate selection has been decoupled and recorded anonymously into the immutable election tally.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Encrypted Ballot Hash Receipt</span>
                  <span className="font-bold text-emerald-700">{ballotReceipt}</span>
                </div>
                <button
                  onClick={() => setVotingElection(null)}
                  className="mt-4 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Return to Elections
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Single-Vote Guarantee Enforced</span>
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Voter: {currentUser.name} ({currentUser.department}). Duplicate votes will be rejected by server-side atomic checks.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">
                    Select Your Candidate for {votingElection.position}:
                  </label>
                  {votingElection.candidates
                    .filter((c) => c.status === 'approved')
                    .map((cand) => (
                      <label
                        key={cand.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                          selectedCandidateId === cand.id
                            ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="candidateRadio"
                          value={cand.id}
                          checked={selectedCandidateId === cand.id}
                          onChange={() => setSelectedCandidateId(cand.id)}
                          className="mt-1 accent-emerald-600"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{cand.name}</p>
                          <p className="text-[11px] text-slate-500">{cand.department}</p>
                          <p className="text-[11px] text-slate-600 italic mt-1 leading-snug">
                            "{cand.manifesto}"
                          </p>
                        </div>
                      </label>
                    ))}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVotingElection(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCastVote}
                    disabled={!selectedCandidateId || castingVote}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 shadow-sm"
                  >
                    {castingVote ? 'Encrypting & Casting...' : 'Seal & Submit Ballot'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nomination Form Modal */}
      {nominatingElection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Submit Nomination for {nominatingElection.position}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Candidate: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.department}, Semester {currentUser.semester})
            </p>

            <form onSubmit={handleNominate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Candidate Manifesto & Pledges <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  placeholder="Outline your primary governance proposals, welfare initiatives, and student advocacy commitments..."
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Photo URL (Optional)</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNominatingElection(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={nominating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {nominating ? 'Submitting...' : 'Submit Nomination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Election Configuration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Configure Council Election</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateElection} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Election Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Secretary - Student Council 2026-2027"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Position <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Secretary / Department Representative"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Eligibility</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Role responsibilities and eligibility criteria..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Voting Start Timestamp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newVotingStart}
                    onChange={(e) => setNewVotingStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Voting End Timestamp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newVotingEnd}
                    onChange={(e) => setNewVotingEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {creating ? 'Scheduling...' : 'Schedule Election'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
