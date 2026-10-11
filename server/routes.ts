import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db.js';
import type {
  User,
  StudentTask,
  Election,
  Complaint,
  GovernanceRequest,
  CollegeEvent,
  Notice,
  GovernanceRule,
  Candidate,
} from '../src/types/index.js';
import {
  askGovernanceAssistant,
  categorizeComplaint,
  checkDuplicateComplaint,
  summarizeTasksProgress,
  draftOfficialNotice,
} from './gemini.js';

export const apiRouter = Router();

// Middleware to resolve requesting user
function getActor(req: Request): User {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'usr_student';
  const users = db.get('users');
  const found = users.find((u) => u.id === userId);
  return (
    found || {
      id: userId,
      name: 'Priya Patel',
      email: 'priya.patel@student.apex.edu',
      role: 'student',
      department: 'Computer Science',
      status: 'active',
    }
  );
}

// ----------------------------------------------------
// Users & Auth
// ----------------------------------------------------
apiRouter.get('/me', (req: Request, res: Response) => {
  const actor = getActor(req);
  res.json({ user: actor });
});

apiRouter.get('/users', (req: Request, res: Response) => {
  const users = db.get('users');
  const role = req.query.role as string;
  const dept = req.query.department as string;

  let filtered = [...users];
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (dept) filtered = filtered.filter((u) => u.department === dept);

  res.json({ users: filtered });
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Super Admin can provision new accounts.' });
  }

  const { name, email, role, department, semester, section, rollNumber, phone } = req.body;
  if (!name || !email || !role || !department) {
    return res.status(400).json({ error: 'Name, email, role, and department are required.' });
  }

  const users = db.get('users');
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Account with this email already exists.' });
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    email,
    role,
    department,
    semester: semester ? Number(semester) : undefined,
    section,
    rollNumber,
    phone,
    status: 'active',
  };

  users.push(newUser);
  db.update('users', users);
  db.logAudit(actor, 'USER_CREATED', 'Users', `Created user account ${name} (${role}, ${department})`);

  res.status(201).json({ user: newUser });
});

apiRouter.patch('/users/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Unauthorized to modify user attributes.' });
  }

  const users = db.get('users');
  const index = users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found.' });

  const target = users[index];
  const { role, status, department } = req.body;

  // Prevent self-role modification / privilege escalation
  if (target.id === actor.id && role && role !== actor.role) {
    return res.status(403).json({ error: 'Self-modification of administrative role is forbidden.' });
  }

  if (role && actor.role === 'super_admin') target.role = role;
  if (status) target.status = status;
  if (department && actor.role === 'super_admin') target.department = department;

  users[index] = target;
  db.update('users', users);
  db.logAudit(actor, 'USER_UPDATED', 'Users', `Updated attributes for ${target.name}`);

  res.json({ user: target });
});

// ----------------------------------------------------
// Institution Configuration
// ----------------------------------------------------
apiRouter.get('/institution', (_req: Request, res: Response) => {
  res.json({ institution: db.get('institution') });
});

apiRouter.patch('/institution', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Super Admin can update institution configuration.' });
  }

  const current = db.get('institution');
  const updated = { ...current, ...req.body };
  db.update('institution', updated);
  db.logAudit(actor, 'INSTITUTION_CONFIG_UPDATED', 'System', 'Updated institutional configuration parameters.');

  res.json({ institution: updated });
});

// ----------------------------------------------------
// Notices & Announcements
// ----------------------------------------------------
apiRouter.get('/notices', (_req: Request, res: Response) => {
  res.json({ notices: db.get('notices') });
});

apiRouter.post('/notices', (req: Request, res: Response) => {
  const actor = getActor(req);
  const authorizedRoles = ['super_admin', 'hod', 'faculty', 'election_officer', 'sports_coordinator', 'coordinator'];
  if (!authorizedRoles.includes(actor.role)) {
    return res.status(403).json({ error: 'Unauthorized to publish official notices.' });
  }

  const { title, content, category, targetAudience, isPinned, expiryDate } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required.' });
  }

  const newNotice: Notice = {
    id: `not_${Date.now()}`,
    title,
    content,
    category,
    targetAudience: targetAudience || { type: 'all' },
    authorName: actor.name,
    authorRole: actor.role.replace('_', ' ').toUpperCase(),
    publishedAt: new Date().toISOString(),
    expiryDate,
    isPinned: !!isPinned,
  };

  const notices = db.get('notices');
  notices.unshift(newNotice);
  db.update('notices', notices);
  db.logAudit(actor, 'NOTICE_PUBLISHED', 'Notices', `Published circular: "${title}" [${category}]`);

  // Broadcast in-app notification to all active students
  const users = db.get('users');
  for (const u of users) {
    if (u.id !== actor.id) {
      db.addNotification(u.id, `New Notice: ${title}`, content.slice(0, 80) + '...', 'notices', newNotice.id);
    }
  }

  res.status(201).json({ notice: newNotice });
});

apiRouter.patch('/notices/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  const authorizedRoles = ['super_admin', 'hod', 'faculty', 'election_officer', 'sports_coordinator', 'coordinator'];
  if (!authorizedRoles.includes(actor.role)) {
    return res.status(403).json({ error: 'Unauthorized to edit notices.' });
  }

  const notices = db.get('notices');
  const notice = notices.find((n) => n.id === req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found.' });

  const { title, content, category, targetAudience, isPinned, expiryDate } = req.body;
  if (title) notice.title = title;
  if (content) notice.content = content;
  if (category) notice.category = category;
  if (targetAudience) notice.targetAudience = targetAudience;
  if (typeof isPinned === 'boolean') notice.isPinned = isPinned;
  if (expiryDate !== undefined) notice.expiryDate = expiryDate;

  db.update('notices', notices);
  db.logAudit(actor, 'NOTICE_UPDATED', 'Notices', `Updated notice "${notice.title}"`);

  res.json({ notice });
});

apiRouter.delete('/notices/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Only administrators can delete notices.' });
  }

  let notices = db.get('notices');
  notices = notices.filter((n) => n.id !== req.params.id);
  db.update('notices', notices);
  db.logAudit(actor, 'NOTICE_DELETED', 'Notices', `Deleted notice id ${req.params.id}`);

  res.json({ success: true });
});

// ----------------------------------------------------
// In-App Notifications
// ----------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const actor = getActor(req);
  const allNotifs = db.get('notifications');
  const userNotifs = allNotifs.filter((n) => n.userId === actor.id);
  res.json({ notifications: userNotifs });
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const actor = getActor(req);
  const notifs = db.get('notifications');
  const target = notifs.find((n) => n.id === req.params.id && n.userId === actor.id);
  if (target) {
    target.isRead = true;
    db.update('notifications', notifs);
  }
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const actor = getActor(req);
  const notifs = db.get('notifications');
  for (const n of notifs) {
    if (n.userId === actor.id) n.isRead = true;
  }
  db.update('notifications', notifs);
  res.json({ success: true });
});

// ----------------------------------------------------
// Student Tasks & Responsibility Management
// ----------------------------------------------------
apiRouter.get('/tasks', (req: Request, res: Response) => {
  const actor = getActor(req);
  const allTasks = db.get('tasks');

  // Students see tasks assigned to them
  if (actor.role === 'student') {
    const studentTasks = allTasks.filter((t) => t.assigneeId === actor.id);
    return res.json({ tasks: studentTasks });
  }

  // Coordinators see their own and department tasks
  if (actor.role === 'coordinator') {
    const coordTasks = allTasks.filter((t) => t.assigneeId === actor.id || t.department === actor.department);
    return res.json({ tasks: coordTasks });
  }

  // Faculty see tasks they created/review or their department
  if (actor.role === 'faculty') {
    const facultyTasks = allTasks.filter((t) => t.reviewerId === actor.id || t.department === actor.department);
    return res.json({ tasks: facultyTasks });
  }

  // HOD & Admin see all
  res.json({ tasks: allTasks });
});

apiRouter.post('/tasks', (req: Request, res: Response) => {
  const actor = getActor(req);
  const allowed = ['super_admin', 'hod', 'faculty', 'coordinator', 'sports_coordinator'];
  if (!allowed.includes(actor.role)) {
    return res.status(403).json({ error: 'Students cannot assign tasks to others.' });
  }

  const {
    title,
    instructions,
    department,
    targetGroup,
    priority,
    startDate,
    dueDate,
    expectedOutcome,
    evidenceCriteria,
    assigneeId,
  } = req.body;

  if (!title || !instructions || !assigneeId || !dueDate) {
    return res.status(400).json({ error: 'Title, instructions, assignee, and due date are required.' });
  }

  const users = db.get('users');
  const assignee = users.find((u) => u.id === assigneeId);
  if (!assignee) return res.status(400).json({ error: 'Assignee not found.' });

  const newTask: StudentTask = {
    id: `tsk_${Date.now()}`,
    title,
    instructions,
    department: department || actor.department,
    targetGroup: targetGroup || 'General Assignees',
    priority: priority || 'medium',
    startDate: startDate || new Date().toISOString(),
    dueDate,
    expectedOutcome: expectedOutcome || 'Standard task completion criteria',
    evidenceCriteria: evidenceCriteria || 'Submission evidence required',
    reviewerId: actor.id,
    reviewerName: actor.name,
    reviewerRole: actor.role.replace('_', ' ').toUpperCase(),
    assigneeId: assignee.id,
    assigneeName: assignee.name,
    assigneeRole: assignee.role.replace('_', ' ').toUpperCase(),
    status: 'assigned',
    activityHistory: [
      {
        id: `act_${Date.now()}`,
        action: 'Task Assigned',
        byName: actor.name,
        byRole: actor.role,
        timestamp: new Date().toISOString(),
        notes: `Assigned to ${assignee.name} with deadline ${new Date(dueDate).toLocaleDateString()}`,
      },
    ],
  };

  const tasks = db.get('tasks');
  tasks.unshift(newTask);
  db.update('tasks', tasks);
  db.logAudit(actor, 'TASK_ASSIGNED', 'Tasks', `Assigned task "${title}" to ${assignee.name}`);

  // Send notification to assignee
  db.addNotification(
    assignee.id,
    'New Responsibility Assigned',
    `You were assigned: "${title}". Due date: ${new Date(dueDate).toLocaleDateString()}`,
    'tasks',
    newTask.id
  );

  res.status(201).json({ task: newTask });
});

apiRouter.patch('/tasks/:id/status', (req: Request, res: Response) => {
  const actor = getActor(req);
  const tasks = db.get('tasks');
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  if (task.assigneeId !== actor.id && task.reviewerId !== actor.id && actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Unauthorized to change task status.' });
  }

  const { status, notes } = req.body;
  if (!['in_progress'].includes(status)) {
    return res.status(400).json({ error: 'Invalid direct status transition. Use submit or verify endpoints.' });
  }

  task.status = status;
  task.activityHistory.push({
    id: `act_${Date.now()}`,
    action: `Status transitioned to ${status.replace('_', ' ')}`,
    byName: actor.name,
    byRole: actor.role,
    timestamp: new Date().toISOString(),
    notes: notes || undefined,
  });

  db.update('tasks', tasks);
  res.json({ task });
});

apiRouter.post('/tasks/:id/submit', (req: Request, res: Response) => {
  const actor = getActor(req);
  const tasks = db.get('tasks');
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  if (task.assigneeId !== actor.id) {
    return res.status(403).json({ error: 'Only the assigned owner can submit work.' });
  }

  if (task.status === 'verified') {
    return res.status(400).json({ error: 'Verified tasks cannot be resubmitted.' });
  }

  const { notes, evidenceLink } = req.body;
  if (!notes || !evidenceLink) {
    return res.status(400).json({ error: 'Submission notes and evidence link/proof are required.' });
  }

  task.status = 'submitted';
  task.submission = {
    submittedAt: new Date().toISOString(),
    notes,
    evidenceLink,
  };
  task.activityHistory.push({
    id: `act_${Date.now()}`,
    action: 'Proof Submitted for Verification',
    byName: actor.name,
    byRole: actor.role,
    timestamp: new Date().toISOString(),
    notes: `Submission notes: ${notes}`,
  });

  db.update('tasks', tasks);
  db.logAudit(actor, 'TASK_SUBMITTED', 'Tasks', `Student ${actor.name} submitted task "${task.title}"`);

  // Notify Reviewer
  db.addNotification(
    task.reviewerId,
    'Task Evidence Submitted',
    `${actor.name} submitted completion evidence for "${task.title}". Verification pending.`,
    'tasks',
    task.id
  );

  res.json({ task });
});

apiRouter.post('/tasks/:id/verify', (req: Request, res: Response) => {
  const actor = getActor(req);
  const tasks = db.get('tasks');
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const isReviewer = task.reviewerId === actor.id;
  const isSuper = actor.role === 'super_admin' || actor.role === 'hod';
  if (!isReviewer && !isSuper) {
    return res.status(403).json({ error: 'Only the assigned reviewer or HOD can verify tasks.' });
  }

  if (task.status !== 'submitted') {
    return res.status(400).json({ error: 'Only submitted tasks can be reviewed and verified.' });
  }

  const { approved, feedback, rating, returnReason } = req.body;

  if (approved) {
    task.status = 'verified';
    task.verification = {
      verifiedAt: new Date().toISOString(),
      feedback: feedback || 'Verification criteria met in full.',
      approved: true,
      rating: rating ? Number(rating) : 5,
    };
    task.returnedReason = undefined;
    task.escalated = false;
    task.activityHistory.push({
      id: `act_${Date.now()}`,
      action: 'Task Verified & Approved',
      byName: actor.name,
      byRole: actor.role,
      timestamp: new Date().toISOString(),
      notes: feedback || 'Approved.',
    });

    db.addNotification(
      task.assigneeId,
      'Task Verified & Completed',
      `Your submission for "${task.title}" was verified and approved by ${actor.name}.`,
      'tasks',
      task.id
    );
  } else {
    // Return for corrections
    task.status = 'returned';
    task.returnedReason = returnReason || feedback || 'Changes requested by reviewer.';
    task.activityHistory.push({
      id: `act_${Date.now()}`,
      action: 'Returned for Revision',
      byName: actor.name,
      byRole: actor.role,
      timestamp: new Date().toISOString(),
      notes: task.returnedReason,
    });

    db.addNotification(
      task.assigneeId,
      'Task Returned for Revision',
      `Reviewer ${actor.name} requested changes on "${task.title}": ${task.returnedReason}`,
      'tasks',
      task.id
    );
  }

  db.update('tasks', tasks);
  db.logAudit(
    actor,
    approved ? 'TASK_VERIFIED' : 'TASK_RETURNED',
    'Tasks',
    `Decision rendered on task "${task.title}": ${approved ? 'Verified' : 'Returned'}`
  );

  res.json({ task });
});

// Admin task modification: edit details, reassign, or change deadline with recorded reason
apiRouter.patch('/tasks/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  const allowed = ['super_admin', 'hod', 'faculty', 'coordinator', 'sports_coordinator'];
  if (!allowed.includes(actor.role)) {
    return res.status(403).json({ error: 'Unauthorized to modify student task details.' });
  }

  const tasks = db.get('tasks');
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  // Coordinator can only edit tasks in their department
  if (actor.role === 'coordinator' && task.department !== actor.department) {
    return res.status(403).json({ error: 'Coordinators can only modify tasks in their department.' });
  }

  const {
    title,
    instructions,
    targetGroup,
    priority,
    department,
    expectedOutcome,
    evidenceCriteria,
    assigneeId,
    reassignReason,
    dueDate,
    deadlineReason,
  } = req.body;

  let detailsChanged = false;

  if (title) { task.title = title; detailsChanged = true; }
  if (instructions) { task.instructions = instructions; detailsChanged = true; }
  if (targetGroup) { task.targetGroup = targetGroup; detailsChanged = true; }
  if (priority) { task.priority = priority; detailsChanged = true; }
  if (department) { task.department = department; detailsChanged = true; }
  if (expectedOutcome) { task.expectedOutcome = expectedOutcome; detailsChanged = true; }
  if (evidenceCriteria) { task.evidenceCriteria = evidenceCriteria; detailsChanged = true; }

  // Reassignment handling
  if (assigneeId && assigneeId !== task.assigneeId) {
    const users = db.get('users');
    const newAssignee = users.find((u) => u.id === assigneeId);
    if (!newAssignee) return res.status(400).json({ error: 'New assignee user not found.' });

    const previousName = task.assigneeName;
    const oldAssigneeId = task.assigneeId;

    task.assigneeId = newAssignee.id;
    task.assigneeName = newAssignee.name;
    task.assigneeRole = newAssignee.role.replace('_', ' ').toUpperCase();

    task.activityHistory.push({
      id: `act_${Date.now()}`,
      action: 'Task Reassigned',
      byName: actor.name,
      byRole: actor.role,
      timestamp: new Date().toISOString(),
      notes: `Reassigned from ${previousName} to ${newAssignee.name}. Reason: ${reassignReason || 'Administrative reassignment'}`,
    });

    db.addNotification(
      newAssignee.id,
      'Responsibility Reassigned to You',
      `You were reassigned responsibility for "${task.title}". Deadline: ${new Date(task.dueDate).toLocaleDateString()}`,
      'tasks',
      task.id
    );

    db.addNotification(
      oldAssigneeId,
      'Responsibility Transferred',
      `Your responsibility for "${task.title}" was transferred to ${newAssignee.name}.`,
      'tasks',
      task.id
    );

    db.logAudit(
      actor,
      'TASK_REASSIGNED',
      'Tasks',
      `Reassigned task "${task.title}" to ${newAssignee.name}. Reason: ${reassignReason || 'Admin reassignment'}`
    );
  }

  // Deadline change handling
  if (dueDate && dueDate !== task.dueDate) {
    const oldDeadline = new Date(task.dueDate).toLocaleDateString();
    const newDeadline = new Date(dueDate).toLocaleDateString();
    task.dueDate = dueDate;

    task.activityHistory.push({
      id: `act_${Date.now()}_dl`,
      action: 'Deadline Extended / Adjusted',
      byName: actor.name,
      byRole: actor.role,
      timestamp: new Date().toISOString(),
      notes: `Deadline updated from ${oldDeadline} to ${newDeadline}. Reason: ${deadlineReason || 'Official schedule adjustment'}`,
    });

    db.addNotification(
      task.assigneeId,
      'Task Deadline Updated',
      `Deadline for "${task.title}" has been updated to ${newDeadline}. Reason: ${deadlineReason || 'Schedule adjustment'}`,
      'tasks',
      task.id
    );

    db.logAudit(
      actor,
      'TASK_DEADLINE_CHANGED',
      'Tasks',
      `Changed deadline for "${task.title}" to ${newDeadline}. Reason: ${deadlineReason || 'Schedule adjustment'}`
    );
  } else if (detailsChanged) {
    task.activityHistory.push({
      id: `act_${Date.now()}_mod`,
      action: 'Task Details Modified',
      byName: actor.name,
      byRole: actor.role,
      timestamp: new Date().toISOString(),
      notes: 'Task instructions or parameters updated by administrator.',
    });

    db.logAudit(actor, 'TASK_MODIFIED', 'Tasks', `Updated parameters for task "${task.title}"`);
  }

  db.update('tasks', tasks);
  res.json({ task });
});

// Admin Task Deletion / Cancellation
apiRouter.delete('/tasks/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Only HOD or Super Admin can delete or cancel tasks.' });
  }

  const tasks = db.get('tasks');
  const taskIndex = tasks.findIndex((t) => t.id === req.params.id);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found.' });

  const targetTask = tasks[taskIndex];
  const { reason, forceDelete } = req.body || {};

  // If verified, disallow permanent deletion without explicit Super Admin force policy
  if (targetTask.status === 'verified' && !forceDelete) {
    return res.status(400).json({
      error: 'Cannot permanently delete completed & verified tasks due to institutional audit compliance policy.',
    });
  }

  tasks.splice(taskIndex, 1);
  db.update('tasks', tasks);

  db.logAudit(
    actor,
    'TASK_DELETED',
    'Tasks',
    `Permanently deleted task "${targetTask.title}" (Assignee: ${targetTask.assigneeName}). Reason: ${reason || 'Administrative removal'}`
  );

  db.addNotification(
    targetTask.assigneeId,
    'Task Cancelled / Removed',
    `Responsibility "${targetTask.title}" has been revoked or removed from your obligations.`,
    'tasks'
  );

  res.json({ success: true, message: `Task "${targetTask.title}" removed.` });
});

// ----------------------------------------------------
// College Elections & Democratic Voting Engine
// ----------------------------------------------------
apiRouter.get('/elections', (_req: Request, res: Response) => {
  res.json({ elections: db.get('elections') });
});

apiRouter.post('/elections', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'election_officer' && actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Election Officers can create official elections.' });
  }

  const {
    title,
    position,
    description,
    academicYear,
    nominationStart,
    nominationEnd,
    votingStart,
    votingEnd,
    eligibleDepartments,
    eligibleSemesters,
    minGpa,
  } = req.body;

  if (!title || !position || !votingStart || !votingEnd) {
    return res.status(400).json({ error: 'Title, position, and voting window are required.' });
  }

  const newElection: Election = {
    id: `elec_${Date.now()}`,
    title,
    position,
    description: description || '',
    academicYear: academicYear || '2026-2027',
    nominationStart: nominationStart || new Date().toISOString(),
    nominationEnd: nominationEnd || new Date(Date.now() + 7 * 86400000).toISOString(),
    votingStart,
    votingEnd,
    status: 'nomination_open',
    eligibleDepartments: eligibleDepartments || ['Computer Science', 'Electronics & Comm.', 'Mechanical Eng.'],
    eligibleSemesters: eligibleSemesters || [4, 5, 6, 7, 8],
    minGpa: minGpa ? Number(minGpa) : 3.0,
    candidates: [],
    totalBallotsCast: 0,
  };

  const elections = db.get('elections');
  elections.push(newElection);
  db.update('elections', elections);
  db.logAudit(actor, 'ELECTION_CREATED', 'Elections', `Configured election "${title}" for position ${position}`);

  res.status(201).json({ election: newElection });
});

apiRouter.patch('/elections/:id/status', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'election_officer' && actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Election Officers can modify election states.' });
  }

  const elections = db.get('elections');
  const election = elections.find((e) => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found.' });

  const { status } = req.body;
  const valid = [
    'draft',
    'nomination_open',
    'under_review',
    'campaign_period',
    'voting_open',
    'voting_closed',
    'results_published',
    'archived',
  ];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid election status.' });
  }

  election.status = status;
  if (status === 'results_published') {
    election.resultsDeclaredAt = new Date().toISOString();
  }

  db.update('elections', elections);
  db.logAudit(actor, 'ELECTION_STATUS_CHANGE', 'Elections', `Status changed to ${status} for "${election.title}"`);

  res.json({ election });
});

// Candidate Nomination
apiRouter.post('/elections/:id/nominate', (req: Request, res: Response) => {
  const actor = getActor(req);
  const elections = db.get('elections');
  const election = elections.find((e) => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found.' });

  if (election.status !== 'nomination_open') {
    return res.status(400).json({ error: 'Nomination period is not open for this election.' });
  }

  if (election.candidates.some((c) => c.userId === actor.id)) {
    return res.status(400).json({ error: 'You have already submitted a nomination for this position.' });
  }

  const { manifesto, photoUrl } = req.body;
  if (!manifesto || manifesto.length < 20) {
    return res.status(400).json({ error: 'Manifesto must be at least 20 characters.' });
  }

  const newCand: Candidate = {
    id: `cand_${Date.now()}`,
    userId: actor.id,
    name: actor.name,
    department: actor.department,
    semester: actor.semester || 6,
    rollNumber: actor.rollNumber || 'STU-000',
    manifesto,
    photoUrl,
    status: 'pending',
    votesCount: 0,
  };

  election.candidates.push(newCand);
  db.update('elections', elections);
  db.logAudit(actor, 'NOMINATION_SUBMITTED', 'Elections', `${actor.name} submitted nomination for "${election.title}"`);

  res.status(201).json({ candidate: newCand });
});

// Verify Candidate Nomination
apiRouter.patch('/elections/:id/candidate/:candId', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'election_officer' && actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Election Officers can review candidate nominations.' });
  }

  const elections = db.get('elections');
  const election = elections.find((e) => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found.' });

  const cand = election.candidates.find((c) => c.id === req.params.candId);
  if (!cand) return res.status(404).json({ error: 'Candidate not found.' });

  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }

  cand.status = status;
  if (status === 'rejected') cand.rejectionReason = rejectionReason || 'Criteria not met';

  db.update('elections', elections);
  db.logAudit(
    actor,
    'CANDIDATE_VERIFICATION',
    'Elections',
    `Candidate ${cand.name} marked ${status} for "${election.title}"`
  );

  res.json({ candidate: cand });
});

// Cast Secret Ballot with Atomic Duplicate Voting Protection
apiRouter.post('/elections/:id/vote', (req: Request, res: Response) => {
  const actor = getActor(req);
  const electionId = req.params.id;
  const { candidateId } = req.body;

  if (!candidateId) {
    return res.status(400).json({ error: 'Candidate selection is required.' });
  }

  const elections = db.get('elections');
  const election = elections.find((e) => e.id === electionId);
  if (!election) return res.status(404).json({ error: 'Election not found.' });

  if (election.status !== 'voting_open') {
    return res.status(400).json({ error: 'Voting is not currently open for this election.' });
  }

  // Voter Eligibility checks
  if (actor.status !== 'active') {
    return res.status(403).json({ error: 'Suspended student accounts are not eligible to vote.' });
  }

  if (election.eligibleDepartments.length && !election.eligibleDepartments.includes(actor.department)) {
    return res.status(403).json({ error: `Students from ${actor.department} are not eligible for this departmental ballot.` });
  }

  // ATOMIC DUPLICATE VOTE CHECK:
  // Check if voter already in voterRecords for this election
  const voterRecords = db.get('voterRecords');
  const hasVoted = voterRecords.some((r) => r.electionId === electionId && r.userId === actor.id);
  if (hasVoted) {
    return res.status(409).json({ error: 'Duplicate vote rejected. Voter has already participated in this election.' });
  }

  // Verify candidate exists and is approved
  const candidate = election.candidates.find((c) => c.id === candidateId && c.status === 'approved');
  if (!candidate) {
    return res.status(400).json({ error: 'Selected candidate is not an approved contender in this election.' });
  }

  // Record participation in voter records (proves student voted, without revealing choice)
  voterRecords.push({
    electionId,
    userId: actor.id,
    votedAt: new Date().toISOString(),
  });
  db.update('voterRecords', voterRecords);

  // Record decoupled secret ballot
  const secretBallots = db.get('secretBallots');
  const ballotHash = crypto.createHash('sha256').update(`${electionId}-${Date.now()}-${Math.random()}`).digest('hex');
  secretBallots.push({
    id: `blt_${Date.now()}`,
    electionId,
    candidateId,
    ballotHash,
    timestamp: new Date().toISOString(),
  });
  db.update('secretBallots', secretBallots);

  // Increment tally
  candidate.votesCount += 1;
  election.totalBallotsCast += 1;
  db.update('elections', elections);

  // Audit log records that user participated, without candidateId
  db.logAudit(
    actor,
    'BALLOT_CAST',
    'Elections',
    `Voter recorded in participation ledger for election "${election.title}". Secret ballot encrypted and queued.`
  );

  res.json({
    success: true,
    message: 'Your vote has been securely recorded and verified in the secret ballot ledger.',
    ballotReceipt: ballotHash.substring(0, 16),
  });
});

apiRouter.get('/elections/:id/voter-status', (req: Request, res: Response) => {
  const actor = getActor(req);
  const voterRecords = db.get('voterRecords');
  const hasVoted = voterRecords.some((r) => r.electionId === req.params.id && r.userId === actor.id);
  res.json({ hasVoted });
});

apiRouter.patch('/elections/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'election_officer' && actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Election Officers can modify election parameters.' });
  }

  const elections = db.get('elections');
  const election = elections.find((e) => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found.' });

  // Prevent modifying critical rules once voting is open or closed
  if (['voting_open', 'voting_closed', 'results_published'].includes(election.status)) {
    return res.status(400).json({ error: 'Cannot modify election parameters while voting is live or completed.' });
  }

  const { title, position, description, academicYear, nominationStart, nominationEnd, votingStart, votingEnd, eligibleDepartments, eligibleSemesters, minGpa } = req.body;
  if (title) election.title = title;
  if (position) election.position = position;
  if (description !== undefined) election.description = description;
  if (academicYear) election.academicYear = academicYear;
  if (nominationStart) election.nominationStart = nominationStart;
  if (nominationEnd) election.nominationEnd = nominationEnd;
  if (votingStart) election.votingStart = votingStart;
  if (votingEnd) election.votingEnd = votingEnd;
  if (eligibleDepartments) election.eligibleDepartments = eligibleDepartments;
  if (eligibleSemesters) election.eligibleSemesters = eligibleSemesters;
  if (minGpa !== undefined) election.minGpa = Number(minGpa);

  db.update('elections', elections);
  db.logAudit(actor, 'ELECTION_MODIFIED', 'Elections', `Updated configuration for "${election.title}"`);

  res.json({ election });
});

apiRouter.post('/elections/:id/cancel', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'election_officer' && actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Election Officers can cancel an election.' });
  }

  const elections = db.get('elections');
  const election = elections.find((e) => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found.' });

  const { cancelReason } = req.body;
  election.status = 'archived';

  db.update('elections', elections);
  db.logAudit(actor, 'ELECTION_CANCELLED', 'Elections', `Cancelled election "${election.title}". Reason: ${cancelReason || 'Administrative cancellation'}`);

  res.json({ election, message: `Election "${election.title}" has been cancelled and archived.` });
});

apiRouter.delete('/elections/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Super Admin can permanently remove an election record.' });
  }

  const elections = db.get('elections');
  const index = elections.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Election not found.' });

  const target = elections[index];
  if (target.totalBallotsCast > 0) {
    return res.status(400).json({ error: 'Cannot delete an election where votes were already cast. Archive instead.' });
  }

  elections.splice(index, 1);
  db.update('elections', elections);
  db.logAudit(actor, 'ELECTION_DELETED', 'Elections', `Permanently removed election "${target.title}"`);

  res.json({ success: true, message: `Election "${target.title}" deleted.` });
});

// ----------------------------------------------------
// Student Complaints & Grievance Redressal
// ----------------------------------------------------
apiRouter.get('/complaints', (req: Request, res: Response) => {
  const actor = getActor(req);
  const complaints = db.get('complaints');

  // Students and coordinators only see their own complaints
  if (actor.role === 'student' || actor.role === 'coordinator') {
    const studentComplaints = complaints.filter((c) => c.submitterId === actor.id);
    return res.json({ complaints: studentComplaints });
  }

  // Staff and Admins see complaints, but anonymous complaints mask the submitter
  const sanitized = complaints.map((c) => {
    if (c.isAnonymous && actor.role !== 'super_admin') {
      return {
        ...c,
        submitterName: 'Confidential / Anonymous Student',
        submitterId: 'masked',
      };
    }
    return c;
  });

  res.json({ complaints: sanitized });
});

apiRouter.post('/complaints', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { title, description, category, priority, isAnonymous, department } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description, and category are required.' });
  }

  const trackingId = `CMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newComplaint: Complaint = {
    trackingId,
    category,
    title,
    description,
    isAnonymous: !!isAnonymous,
    submitterId: actor.id,
    submitterName: isAnonymous ? 'Anonymous Student' : actor.name,
    department: department || actor.department,
    priority: priority || 'medium',
    status: 'submitted',
    responses: [],
    escalated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const complaints = db.get('complaints');
  complaints.unshift(newComplaint);
  db.update('complaints', complaints);
  db.logAudit(
    actor,
    'COMPLAINT_FILED',
    'Complaints',
    `Grievance ${trackingId} filed in category ${category} (Anonymous: ${!!isAnonymous})`
  );

  // Notify HOD if high/critical
  if (priority === 'high' || priority === 'critical') {
    const users = db.get('users');
    const hod = users.find((u) => u.role === 'hod');
    if (hod) {
      db.addNotification(
        hod.id,
        `High Priority Grievance ${trackingId}`,
        `New ${category} grievance filed requiring 6-hour acknowledgment SLA.`,
        'complaints',
        trackingId
      );
    }
  }

  res.status(201).json({ complaint: newComplaint });
});

apiRouter.patch('/complaints/:id/status', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (['student'].includes(actor.role)) {
    return res.status(403).json({ error: 'Students cannot alter grievance official status.' });
  }

  const complaints = db.get('complaints');
  const complaint = complaints.find((c) => c.trackingId === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  const { status, resolutionNotes, assigneeId } = req.body;
  const valid = ['submitted', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'closed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid complaint status.' });

  complaint.status = status;
  complaint.updatedAt = new Date().toISOString();

  if (assigneeId) {
    const users = db.get('users');
    const assignee = users.find((u) => u.id === assigneeId);
    if (assignee) {
      complaint.assigneeId = assignee.id;
      complaint.assigneeName = assignee.name;
      complaint.assigneeRole = assignee.role;
    }
  }

  if (status === 'resolved' || status === 'closed') {
    complaint.resolutionNotes = resolutionNotes || 'Grievance redressed by department administration.';
    complaint.resolvedAt = new Date().toISOString();
  }

  db.update('complaints', complaints);
  db.logAudit(actor, 'COMPLAINT_STATUS_UPDATE', 'Complaints', `Grievance ${complaint.trackingId} transitioned to ${status}`);

  // Notify original submitter
  db.addNotification(
    complaint.submitterId,
    `Grievance Update: ${complaint.trackingId}`,
    `Status updated to "${status.replace('_', ' ').toUpperCase()}".`,
    'complaints',
    complaint.trackingId
  );

  res.json({ complaint });
});

apiRouter.post('/complaints/:id/respond', (req: Request, res: Response) => {
  const actor = getActor(req);
  const complaints = db.get('complaints');
  const complaint = complaints.find((c) => c.trackingId === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Response message cannot be empty.' });

  const isStaff = ['faculty', 'hod', 'super_admin', 'sports_coordinator'].includes(actor.role);

  complaint.responses.push({
    id: `resp_${Date.now()}`,
    byId: actor.id,
    byName: actor.name,
    byRole: actor.role.replace('_', ' ').toUpperCase(),
    message,
    timestamp: new Date().toISOString(),
    isOfficial: isStaff,
  });
  complaint.updatedAt = new Date().toISOString();

  db.update('complaints', complaints);

  // If staff responded, notify student
  if (isStaff && complaint.submitterId !== actor.id) {
    db.addNotification(
      complaint.submitterId,
      `Official Response on ${complaint.trackingId}`,
      `${actor.name} added an official note: "${message.slice(0, 70)}..."`,
      'complaints',
      complaint.trackingId
    );
  }

  res.json({ complaint });
});

apiRouter.post('/complaints/:id/escalate', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role === 'student') {
    return res.status(403).json({ error: 'Direct manual escalation restricted to staff.' });
  }

  const complaints = db.get('complaints');
  const complaint = complaints.find((c) => c.trackingId === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  const { escalationReason } = req.body;
  complaint.escalated = true;
  complaint.escalationReason = escalationReason || 'Escalated to Head of Department for expedited intervention.';
  complaint.updatedAt = new Date().toISOString();

  // Notify HOD
  const users = db.get('users');
  const hod = users.find((u) => u.role === 'hod');
  if (hod) {
    db.addNotification(
      hod.id,
      `Escalated Grievance: ${complaint.trackingId}`,
      `Grievance escalated by ${actor.name}: ${complaint.escalationReason}`,
      'complaints',
      complaint.trackingId
    );
  }

  db.update('complaints', complaints);
  db.logAudit(actor, 'COMPLAINT_ESCALATED', 'Complaints', `Escalated grievance ${complaint.trackingId} to HOD. Reason: ${complaint.escalationReason}`);

  res.json({ complaint });
});

apiRouter.delete('/complaints/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Only HOD or Super Admin can remove or archive grievance records.' });
  }

  const complaints = db.get('complaints');
  const index = complaints.findIndex((c) => c.trackingId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Complaint not found.' });

  const target = complaints[index];
  const { reason } = req.body || {};

  complaints.splice(index, 1);
  db.update('complaints', complaints);
  db.logAudit(actor, 'COMPLAINT_DELETED', 'Complaints', `Deleted grievance ${target.trackingId}. Reason: ${reason || 'Administrative archiving'}`);

  res.json({ success: true, message: `Grievance ${target.trackingId} removed.` });
});

// ----------------------------------------------------
// Requests & Approvals Workflow
// ----------------------------------------------------
apiRouter.get('/requests', (req: Request, res: Response) => {
  const actor = getActor(req);
  const requests = db.get('requests');

  if (actor.role === 'student') {
    return res.json({ requests: requests.filter((r) => r.submitterId === actor.id) });
  }

  res.json({ requests });
});

apiRouter.post('/requests', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { type, title, reason, startDate, endDate, reviewerRole } = req.body;

  if (!type || !title || !reason || !startDate || !endDate) {
    return res.status(400).json({ error: 'Type, title, reason, and date duration are required.' });
  }

  const trackingId = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newReq: GovernanceRequest = {
    trackingId,
    type,
    title,
    reason,
    startDate,
    endDate,
    submitterId: actor.id,
    submitterName: actor.name,
    department: actor.department,
    reviewerRole: reviewerRole || 'Faculty',
    status: 'submitted',
    createdAt: new Date().toISOString(),
  };

  const requests = db.get('requests');
  requests.unshift(newReq);
  db.update('requests', requests);
  db.logAudit(actor, 'REQUEST_SUBMITTED', 'Requests', `Submitted request ${trackingId}: "${title}" [${type}]`);

  res.status(201).json({ request: newReq });
});

apiRouter.patch('/requests/:id/decision', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role === 'student' || actor.role === 'coordinator') {
    return res.status(403).json({ error: 'Students and coordinators cannot decide on approval requests.' });
  }

  const requests = db.get('requests');
  const item = requests.find((r) => r.trackingId === req.params.id);
  if (!item) return res.status(404).json({ error: 'Request not found.' });

  // Prevent self-approval
  if (item.submitterId === actor.id) {
    return res.status(403).json({ error: 'Reviewers cannot approve or decide on their own requests.' });
  }

  const { status, decisionNotes } = req.body;
  if (!['approved', 'rejected', 'under_review'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved, rejected, or under_review.' });
  }

  item.status = status;
  item.decisionNotes = decisionNotes || '';
  item.decisionAt = new Date().toISOString();
  item.reviewerId = actor.id;
  item.reviewerName = actor.name;

  db.update('requests', requests);
  db.logAudit(actor, 'REQUEST_DECISION', 'Requests', `Request ${item.trackingId} decision: ${status}`);

  // Notify student
  db.addNotification(
    item.submitterId,
    `Request Decision: ${item.trackingId}`,
    `Your request "${item.title}" was ${status.toUpperCase()} by ${actor.name}.`,
    'requests',
    item.trackingId
  );

  res.json({ request: item });
});

apiRouter.post('/requests/:id/cancel', (req: Request, res: Response) => {
  const actor = getActor(req);
  const requests = db.get('requests');
  const item = requests.find((r) => r.trackingId === req.params.id);
  if (!item) return res.status(404).json({ error: 'Request not found.' });

  const isOwner = item.submitterId === actor.id;
  const isAdmin = actor.role === 'super_admin' || actor.role === 'hod';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Only the submitter or an administrator can cancel this request.' });
  }

  const { cancelReason } = req.body;
  item.status = 'rejected';
  item.decisionNotes = `CANCELLED: ${cancelReason || 'Cancelled by applicant/admin'}`;
  item.decisionAt = new Date().toISOString();
  item.reviewerId = actor.id;
  item.reviewerName = actor.name;

  db.update('requests', requests);
  db.logAudit(actor, 'REQUEST_CANCELLED', 'Requests', `Cancelled request ${item.trackingId}. Reason: ${cancelReason || 'Cancelled'}`);

  res.json({ request: item });
});

apiRouter.delete('/requests/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Only administrators can delete approval requests.' });
  }

  const requests = db.get('requests');
  const index = requests.findIndex((r) => r.trackingId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Request not found.' });

  const target = requests[index];
  requests.splice(index, 1);
  db.update('requests', requests);
  db.logAudit(actor, 'REQUEST_DELETED', 'Requests', `Deleted request record ${target.trackingId}`);

  res.json({ success: true, message: `Request ${target.trackingId} deleted.` });
});

// ----------------------------------------------------
// Sports & College Events Management
// ----------------------------------------------------
apiRouter.get('/events', (_req: Request, res: Response) => {
  res.json({ events: db.get('events') });
});

apiRouter.post('/events', (req: Request, res: Response) => {
  const actor = getActor(req);
  const allowed = ['sports_coordinator', 'coordinator', 'faculty', 'hod', 'super_admin'];
  if (!allowed.includes(actor.role)) {
    return res.status(403).json({ error: 'Unauthorized to schedule official events.' });
  }

  const { title, type, description, venue, date, time, capacity, registrationDeadline } = req.body;
  if (!title || !type || !venue || !date || !time) {
    return res.status(400).json({ error: 'Title, type, venue, date, and time are required.' });
  }

  const newEvent: CollegeEvent = {
    id: `evt_${Date.now()}`,
    title,
    type,
    description: description || '',
    venue,
    date,
    time,
    capacity: capacity ? Number(capacity) : 100,
    registrationDeadline: registrationDeadline || date,
    organizerId: actor.id,
    organizerName: actor.name,
    status: 'upcoming',
    participants: [],
    volunteerDuties: [],
  };

  const events = db.get('events');
  events.push(newEvent);
  db.update('events', events);
  db.logAudit(actor, 'EVENT_CREATED', 'Events', `Created ${type} event: "${title}" on ${date}`);

  res.status(201).json({ event: newEvent });
});

apiRouter.post('/events/:id/register', (req: Request, res: Response) => {
  const actor = getActor(req);
  const events = db.get('events');
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  if (event.participants.some((p) => p.userId === actor.id)) {
    return res.status(400).json({ error: 'You are already registered for this event.' });
  }

  if (event.participants.length >= event.capacity) {
    return res.status(400).json({ error: 'Event has reached full capacity limit.' });
  }

  const { teamName } = req.body;
  event.participants.push({
    userId: actor.id,
    name: actor.name,
    department: actor.department,
    registeredAt: new Date().toISOString(),
    attended: false,
    teamName,
  });

  db.update('events', events);
  db.logAudit(actor, 'EVENT_REGISTRATION', 'Events', `${actor.name} registered for "${event.title}"`);

  res.json({ event });
});

apiRouter.post('/events/:id/volunteer', (req: Request, res: Response) => {
  const actor = getActor(req);
  const events = db.get('events');
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  const { dutyTitle, dutyDescription } = req.body;
  if (!dutyTitle) return res.status(400).json({ error: 'Duty title is required.' });

  const dutyId = `vdt_${Date.now()}`;
  event.volunteerDuties.push({
    id: dutyId,
    title: dutyTitle,
    description: dutyDescription || '',
    assignedUserId: actor.id,
    assignedUserName: actor.name,
    status: 'assigned',
  });

  db.update('events', events);
  db.logAudit(actor, 'VOLUNTEER_DUTY_ASSIGNED', 'Events', `${actor.name} enlisted for volunteer duty "${dutyTitle}"`);

  res.json({ event });
});

apiRouter.patch('/events/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  const allowed = ['sports_coordinator', 'coordinator', 'faculty', 'hod', 'super_admin'];
  if (!allowed.includes(actor.role)) {
    return res.status(403).json({ error: 'Unauthorized to edit event specifications.' });
  }

  const events = db.get('events');
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  const { title, type, description, venue, date, time, capacity, registrationDeadline, status } = req.body;
  if (title) event.title = title;
  if (type) event.type = type;
  if (description) event.description = description;
  if (venue) event.venue = venue;
  if (date) event.date = date;
  if (time) event.time = time;
  if (capacity) event.capacity = Number(capacity);
  if (registrationDeadline) event.registrationDeadline = registrationDeadline;
  if (status && ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) event.status = status;

  db.update('events', events);
  db.logAudit(actor, 'EVENT_MODIFIED', 'Events', `Updated parameters for event "${event.title}"`);

  res.json({ event });
});

apiRouter.post('/events/:id/cancel', (req: Request, res: Response) => {
  const actor = getActor(req);
  const allowed = ['sports_coordinator', 'coordinator', 'faculty', 'hod', 'super_admin'];
  if (!allowed.includes(actor.role)) {
    return res.status(403).json({ error: 'Unauthorized to cancel official events.' });
  }

  const events = db.get('events');
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  const { cancelReason } = req.body;
  event.status = 'cancelled';

  db.update('events', events);
  db.logAudit(actor, 'EVENT_CANCELLED', 'Events', `Cancelled event "${event.title}". Reason: ${cancelReason || 'Administrative cancellation'}`);

  // Notify all registered participants
  for (const p of event.participants) {
    db.addNotification(
      p.userId,
      `Event Cancelled: ${event.title}`,
      `The scheduled event "${event.title}" has been cancelled. Reason: ${cancelReason || 'Administrative cancellation'}.`,
      'events',
      event.id
    );
  }

  res.json({ event, message: `Event "${event.title}" cancelled. Notified ${event.participants.length} registered participants.` });
});

apiRouter.delete('/events/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Only HOD or Super Admin can delete college events.' });
  }

  const events = db.get('events');
  const index = events.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found.' });

  const target = events[index];
  events.splice(index, 1);
  db.update('events', events);
  db.logAudit(actor, 'EVENT_DELETED', 'Events', `Deleted event "${target.title}"`);

  res.json({ success: true, message: `Event "${target.title}" deleted.` });
});

// ----------------------------------------------------
// Governance Rules & Accountability Engine
// ----------------------------------------------------
apiRouter.get('/rules', (_req: Request, res: Response) => {
  res.json({ rules: db.get('rules') });
});

apiRouter.post('/rules', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Only HOD or Super Admin can create institutional rules.' });
  }

  const { title, description, module, triggerCondition, responsibleRole, requiredAction, slaHours, escalationDestination } = req.body;

  const newRule: GovernanceRule = {
    id: `rul_${Date.now()}`,
    title,
    description,
    module,
    triggerCondition,
    responsibleRole,
    requiredAction,
    slaHours: slaHours ? Number(slaHours) : 24,
    reminderSchedule: 'T-24h, T-6h',
    escalationDestination: escalationDestination || 'HOD',
    active: true,
    lastUpdated: new Date().toISOString(),
    approvalHistory: [`Created by ${actor.name} (${actor.role})`],
  };

  const rules = db.get('rules');
  rules.push(newRule);
  db.update('rules', rules);
  db.logAudit(actor, 'RULE_CREATED', 'Rules', `Configured SLA rule "${title}"`);

  res.status(201).json({ rule: newRule });
});

apiRouter.patch('/rules/:id/toggle', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Unauthorized to toggle governance rules.' });
  }

  const rules = db.get('rules');
  const rule = rules.find((r) => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found.' });

  rule.active = !rule.active;
  rule.lastUpdated = new Date().toISOString();
  rule.approvalHistory.push(`Toggled to ${rule.active ? 'ACTIVE' : 'INACTIVE'} by ${actor.name}`);

  db.update('rules', rules);
  db.logAudit(actor, 'RULE_TOGGLED', 'Rules', `Toggled rule "${rule.title}" to ${rule.active}`);

  res.json({ rule });
});

// ----------------------------------------------------
// Audit Logs
// ----------------------------------------------------
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'super_admin' && actor.role !== 'hod') {
    return res.status(403).json({ error: 'Audit trail restricted to Administrators and HOD.' });
  }

  res.json({ auditLogs: db.get('auditLogs') });
});

// ----------------------------------------------------
// Master Dashboard Statistics (Real Database Records)
// ----------------------------------------------------
apiRouter.get('/dashboard/stats', (_req: Request, res: Response) => {
  const users = db.get('users');
  const tasks = db.get('tasks');
  const complaints = db.get('complaints');
  const requests = db.get('requests');
  const elections = db.get('elections');
  const events = db.get('events');
  const rules = db.get('rules');
  const notices = db.get('notices');
  const auditLogs = db.get('auditLogs');

  const now = new Date();

  const totalStudents = users.filter((u) => u.role === 'student' || u.role === 'coordinator').length;
  const totalFaculty = users.filter((u) => u.role === 'faculty').length;
  const totalStaff = users.filter((u) => u.role !== 'student').length;

  const pendingRequests = requests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length;
  const pendingNominations = elections.reduce((acc, e) => acc + e.candidates.filter((c) => c.status === 'pending').length, 0);
  const pendingApprovals = pendingRequests + pendingNominations;

  const openTasks = tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length;
  const submittedTasks = tasks.filter((t) => t.status === 'submitted').length;
  const verifiedTasks = tasks.filter((t) => t.status === 'verified').length;
  const overdueTasks = tasks.filter(
    (t) => t.escalated || (new Date(t.dueDate) < now && t.status !== 'verified')
  ).length;

  const openComplaints = complaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed').length;
  const resolvedComplaints = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const escalatedComplaints = complaints.filter((c) => c.escalated || c.priority === 'critical').length;

  const upcomingEvents = events.filter((e) => e.status === 'upcoming').length;
  const sportsEvents = events.filter((e) => e.type === 'sports').length;
  const totalEventRegistrations = events.reduce((acc, e) => acc + (e.participants?.length || 0), 0);
  const totalVolunteerDuties = events.reduce((acc, e) => acc + (e.volunteerDuties?.length || 0), 0);

  const activeElections = elections.filter((e) => ['voting_open', 'nomination_open', 'campaign_period'].includes(e.status)).length;
  const completedElections = elections.filter((e) => ['results_published', 'archived'].includes(e.status)).length;

  const totalNotices = notices.length;
  const totalAuditActivities = auditLogs.length;

  // Department statistics
  const deptMap: Record<string, { tasks: number; complaints: number; requests: number }> = {};
  for (const t of tasks) {
    if (!deptMap[t.department]) deptMap[t.department] = { tasks: 0, complaints: 0, requests: 0 };
    deptMap[t.department].tasks += 1;
  }
  for (const c of complaints) {
    if (!deptMap[c.department]) deptMap[c.department] = { tasks: 0, complaints: 0, requests: 0 };
    deptMap[c.department].complaints += 1;
  }
  for (const r of requests) {
    if (!deptMap[r.department]) deptMap[r.department] = { tasks: 0, complaints: 0, requests: 0 };
    deptMap[r.department].requests += 1;
  }

  res.json({
    metrics: {
      totalStudents,
      totalFaculty,
      totalStaff,
      totalTasks: tasks.length,
      openTasks,
      activeTasks: openTasks,
      submittedTasks,
      verifiedTasks,
      overdueTasks,
      pendingRequests,
      pendingNominations,
      pendingApprovals,
      openComplaints,
      resolvedComplaints,
      escalatedComplaints,
      upcomingEvents,
      sportsEvents,
      totalEventRegistrations,
      totalVolunteerDuties,
      activeElections,
      completedElections,
      totalNotices,
      totalAuditActivities,
      activeRules: rules.filter((r) => r.active).length,
    },
    recentAudits: auditLogs.slice(0, 8),
    departmentStats: deptMap,
  });
});

// ----------------------------------------------------
// Global Search (Role-Aware Across Real Records)
// ----------------------------------------------------
apiRouter.get('/search', (req: Request, res: Response) => {
  const actor = getActor(req);
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  if (!q) {
    return res.json({ results: [] });
  }

  const results: Array<{
    id: string;
    type: 'user' | 'task' | 'complaint' | 'request' | 'event' | 'election' | 'notice';
    title: string;
    subtitle: string;
    status?: string;
    badge?: string;
    linkModule: string;
  }> = [];

  // Users (for staff and super_admin, or name match)
  const users = db.get('users');
  for (const u of users) {
    if (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
      u.department.toLowerCase().includes(q)
    ) {
      results.push({
        id: u.id,
        type: 'user',
        title: u.name,
        subtitle: `${u.role.replace('_', ' ').toUpperCase()} • ${u.department}${u.rollNumber ? ` • ${u.rollNumber}` : ''}`,
        status: u.status,
        badge: u.role,
        linkModule: 'users',
      });
    }
  }

  // Tasks
  const tasks = db.get('tasks');
  for (const t of tasks) {
    // If student, only own tasks
    if (actor.role === 'student' && t.assigneeId !== actor.id) continue;
    if (
      t.title.toLowerCase().includes(q) ||
      t.instructions.toLowerCase().includes(q) ||
      t.assigneeName.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q)
    ) {
      results.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: `Assigned: ${t.assigneeName} • Due: ${new Date(t.dueDate).toLocaleDateString()}`,
        status: t.status,
        badge: t.priority,
        linkModule: 'tasks',
      });
    }
  }

  // Complaints
  const complaints = db.get('complaints');
  for (const c of complaints) {
    if ((actor.role === 'student' || actor.role === 'coordinator') && c.submitterId !== actor.id) continue;
    if (
      c.trackingId.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    ) {
      results.push({
        id: c.trackingId,
        type: 'complaint',
        title: `${c.trackingId}: ${c.title}`,
        subtitle: `Category: ${c.category} • Dept: ${c.department}`,
        status: c.status,
        badge: c.priority,
        linkModule: 'complaints',
      });
    }
  }

  // Requests
  const requests = db.get('requests');
  for (const r of requests) {
    if (actor.role === 'student' && r.submitterId !== actor.id) continue;
    if (
      r.trackingId.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q)
    ) {
      results.push({
        id: r.trackingId,
        type: 'request',
        title: `${r.trackingId}: ${r.title}`,
        subtitle: `Applicant: ${r.submitterName} • ${r.type.replace('_', ' ').toUpperCase()}`,
        status: r.status,
        badge: r.status,
        linkModule: 'requests',
      });
    }
  }

  // Events
  const events = db.get('events');
  for (const e of events) {
    if (
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
    ) {
      results.push({
        id: e.id,
        type: 'event',
        title: e.title,
        subtitle: `${e.type.toUpperCase()} • ${e.venue} • ${e.date}`,
        status: e.status,
        badge: `${e.participants.length}/${e.capacity} Enrolled`,
        linkModule: 'events',
      });
    }
  }

  // Elections
  const elections = db.get('elections');
  for (const el of elections) {
    if (
      el.title.toLowerCase().includes(q) ||
      el.position.toLowerCase().includes(q) ||
      el.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: el.id,
        type: 'election',
        title: el.title,
        subtitle: `Position: ${el.position} • Status: ${el.status.replace('_', ' ').toUpperCase()}`,
        status: el.status,
        badge: `${el.totalBallotsCast} Ballots Cast`,
        linkModule: 'elections',
      });
    }
  }

  // Notices
  const notices = db.get('notices');
  for (const n of notices) {
    if (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q)
    ) {
      results.push({
        id: n.id,
        type: 'notice',
        title: n.title,
        subtitle: `Published by: ${n.authorName} (${n.authorRole}) • ${new Date(n.publishedAt).toLocaleDateString()}`,
        badge: n.category,
        linkModule: 'notices',
      });
    }
  }

  res.json({ results: results.slice(0, 30) });
});

// ----------------------------------------------------
// AI Integration Endpoints (Server-Side)
// ----------------------------------------------------
apiRouter.post('/ai/ask', async (req: Request, res: Response) => {
  const actor = getActor(req);
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required.' });

  try {
    const answer = await askGovernanceAssistant(query, actor.role);
    res.json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI processing error.' });
  }
});

apiRouter.post('/ai/categorize-complaint', async (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const result = await categorizeComplaint(title, description);
  res.json(result);
});

apiRouter.post('/ai/check-duplicate-complaint', async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const complaints = db.get('complaints');
  const openList = complaints
    .filter((c) => c.status !== 'resolved' && c.status !== 'closed')
    .map((c) => ({
      trackingId: c.trackingId,
      title: c.title,
      description: c.description,
      status: c.status,
    }));

  const result = await checkDuplicateComplaint(title || '', description || '', openList);
  res.json(result);
});

apiRouter.post('/ai/summarize-tasks', async (_req: Request, res: Response) => {
  const summary = await summarizeTasksProgress();
  res.json({ summary });
});

apiRouter.post('/ai/draft-notice', async (req: Request, res: Response) => {
  const actor = getActor(req);
  if (['student'].includes(actor.role)) {
    return res.status(403).json({ error: 'Students cannot draft administrative circulars.' });
  }

  const { topic, audience, keyPoints } = req.body;
  const draft = await draftOfficialNotice(topic || 'Campus Update', audience || 'All Students', keyPoints || '');
  res.json(draft);
});
