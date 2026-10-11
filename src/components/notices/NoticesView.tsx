import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { Notice } from '../../types/index.js';
import {
  Megaphone,
  Plus,
  Pin,
  Calendar,
  Sparkles,
  Trash2,
  X,
  Filter,
  Search,
} from 'lucide-react';

export const NoticesView: React.FC = () => {
  const { currentUser, addToast } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // New Notice Modal
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Notice['category']>('Academic');
  const [isPinned, setIsPinned] = useState(false);
  const [creating, setCreating] = useState(false);

  // AI Draft Assistance State
  const [aiDraftTopic, setAiDraftTopic] = useState('');
  const [aiDraftAudience, setAiDraftAudience] = useState('All Undergraduate Students');
  const [aiDraftKeyPoints, setAiDraftKeyPoints] = useState('');
  const [draftingAi, setDraftingAi] = useState(false);

  const canPublish = ['super_admin', 'hod', 'faculty', 'election_officer', 'sports_coordinator', 'coordinator'].includes(
    currentUser.role
  );

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await api.getNotices();
      setNotices(res.notices);
    } catch (err: any) {
      addToast('error', 'Error loading notices', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [currentUser.id]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    setCreating(true);
    try {
      await api.createNotice({
        title: newTitle,
        content: newContent,
        category: newCategory,
        isPinned,
      });
      addToast('success', 'Circular Published', 'Notice dispatched and notifications broadcast to students.');
      setShowModal(false);
      setNewTitle('');
      setNewContent('');
      setIsPinned(false);
      loadNotices();
    } catch (err: any) {
      addToast('error', 'Publication failed', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDraftWithAI = async () => {
    if (!aiDraftTopic) {
      addToast('warning', 'Topic Needed', 'Enter a topic for the AI draft.');
      return;
    }
    setDraftingAi(true);
    try {
      const res = await api.draftNoticeAI(aiDraftTopic, aiDraftAudience, aiDraftKeyPoints);
      setNewTitle(res.title);
      setNewContent(res.content);
      addToast('success', 'Draft Generated', 'AI generated official circular text. You may review and edit.');
    } catch (err: any) {
      addToast('error', 'AI draft error', err.message);
    } finally {
      setDraftingAi(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await api.deleteNotice(id);
      addToast('info', 'Notice Removed', 'Circular deleted from bulletin.');
      loadNotices();
    } catch (err: any) {
      addToast('error', 'Deletion failed', err.message);
    }
  };

  // Filter notices
  const filtered = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">College Notice & Communication Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Official Circulars
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official institutional announcements, departmental directives, examination bulletins, and academic schedules.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Circular</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search circulars, directives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Exam">Exam Schedule</option>
            <option value="Election">Elections</option>
            <option value="Sports">Sports</option>
            <option value="Administrative">Administrative</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Notices Board */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading circulars...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">No circulars matching criteria</h3>
          <p className="text-xs text-slate-400">All announcements are up to date.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((notice) => {
            return (
              <div
                key={notice.id}
                className={`p-6 rounded-3xl border transition space-y-3 ${
                  notice.isPinned
                    ? 'border-blue-300 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase">
                          <Pin className="w-3 h-3" />
                          <span>Pinned Bulletin</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          notice.category === 'Election'
                            ? 'bg-emerald-100 text-emerald-800'
                            : notice.category === 'Academic'
                            ? 'bg-blue-100 text-blue-800'
                            : notice.category === 'Sports'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {notice.category}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 leading-snug">{notice.title}</h2>
                  </div>

                  {(currentUser.role === 'super_admin' || currentUser.role === 'hod') && (
                    <button
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                  {notice.content}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{notice.authorName}</span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-500">{notice.authorRole}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(notice.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Publish Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Publish Official Notice</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Drafting Accordion */}
            <div className="mt-3 p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Gemini AI Announcement Drafter</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-snug">
                Draft an institutional announcement in standard administrative phrasing:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Topic (e.g. Midterm lab schedule)"
                  value={aiDraftTopic}
                  onChange={(e) => setAiDraftTopic(e.target.value)}
                  className="p-2 rounded-xl border border-indigo-200 bg-white text-xs outline-none"
                />
                <input
                  type="text"
                  placeholder="Target Audience (e.g. Year 3 CSE)"
                  value={aiDraftAudience}
                  onChange={(e) => setAiDraftAudience(e.target.value)}
                  className="p-2 rounded-xl border border-indigo-200 bg-white text-xs outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Key points (e.g. Mandatory attendance, upload before Oct 25)"
                value={aiDraftKeyPoints}
                onChange={(e) => setAiDraftKeyPoints(e.target.value)}
                className="w-full p-2 rounded-xl border border-indigo-200 bg-white text-xs outline-none"
              />

              <button
                type="button"
                onClick={handleDraftWithAI}
                disabled={draftingAi}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{draftingAi ? 'Drafting Circular...' : 'Generate Draft with AI'}</span>
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Lab Verification Schedule - AY 2026-2027"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Circular Content *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Full circular announcement body..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Notice['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Exam">Examination</option>
                    <option value="Election">Election</option>
                    <option value="Sports">Sports</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Urgent">Urgent Circular</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="accent-blue-600 w-4 h-4 rounded"
                    />
                    <span>Pin to top of bulletin</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {creating ? 'Publishing...' : 'Publish Official Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
