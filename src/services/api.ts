import type {
  User,
  Notice,
  NotificationItem,
  StudentTask,
  Election,
  Candidate,
  Complaint,
  GovernanceRequest,
  CollegeEvent,
  GovernanceRule,
  AuditLog,
  InstitutionConfig,
} from '../types/index.js';

class ApiService {
  private currentUserId: string = 'usr_student';

  public setUserId(id: string) {
    this.currentUserId = id;
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  private async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('x-user-id', this.currentUserId);

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errMsg = `Request failed: ${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data.error) errMsg = data.error;
      } catch (_) {}
      throw new Error(errMsg);
    }
    return res.json();
  }

  // Users & Me
  async getMe(): Promise<{ user: User }> {
    return this.fetchJson<{ user: User }>('/api/me');
  }

  async getUsers(role?: string, department?: string): Promise<{ users: User[] }> {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (department) params.set('department', department);
    return this.fetchJson<{ users: User[] }>(`/api/users?${params.toString()}`);
  }

  async createUser(payload: Partial<User>): Promise<{ user: User }> {
    return this.fetchJson<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUser(id: string, payload: Partial<User>): Promise<{ user: User }> {
    return this.fetchJson<{ user: User }>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Institution
  async getInstitution(): Promise<{ institution: InstitutionConfig }> {
    return this.fetchJson<{ institution: InstitutionConfig }>('/api/institution');
  }

  async updateInstitution(payload: Partial<InstitutionConfig>): Promise<{ institution: InstitutionConfig }> {
    return this.fetchJson<{ institution: InstitutionConfig }>('/api/institution', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Notices
  async getNotices(): Promise<{ notices: Notice[] }> {
    return this.fetchJson<{ notices: Notice[] }>('/api/notices');
  }

  async createNotice(payload: Partial<Notice>): Promise<{ notice: Notice }> {
    return this.fetchJson<{ notice: Notice }>('/api/notices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteNotice(id: string): Promise<{ success: boolean }> {
    return this.fetchJson<{ success: boolean }>(`/api/notices/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return this.fetchJson<{ notifications: NotificationItem[] }>('/api/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.fetchJson<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.fetchJson<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    });
  }

  // Tasks
  async getTasks(): Promise<{ tasks: StudentTask[] }> {
    return this.fetchJson<{ tasks: StudentTask[] }>('/api/tasks');
  }

  async createTask(payload: any): Promise<{ task: StudentTask }> {
    return this.fetchJson<{ task: StudentTask }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTaskStatus(id: string, status: string, notes?: string): Promise<{ task: StudentTask }> {
    return this.fetchJson<{ task: StudentTask }>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async submitTask(id: string, notes: string, evidenceLink: string): Promise<{ task: StudentTask }> {
    return this.fetchJson<{ task: StudentTask }>(`/api/tasks/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ notes, evidenceLink }),
    });
  }

  async verifyTask(
    id: string,
    approved: boolean,
    feedback?: string,
    rating?: number,
    returnReason?: string
  ): Promise<{ task: StudentTask }> {
    return this.fetchJson<{ task: StudentTask }>(`/api/tasks/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ approved, feedback, rating, returnReason }),
    });
  }

  async updateTask(id: string, payload: any): Promise<{ task: StudentTask }> {
    return this.fetchJson<{ task: StudentTask }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteTask(id: string, reason?: string, forceDelete?: boolean): Promise<{ success: boolean; message: string }> {
    return this.fetchJson<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, forceDelete }),
    });
  }

  // Notices update
  async updateNotice(id: string, payload: Partial<Notice>): Promise<{ notice: Notice }> {
    return this.fetchJson<{ notice: Notice }>(`/api/notices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Elections
  async getElections(): Promise<{ elections: Election[] }> {
    return this.fetchJson<{ elections: Election[] }>('/api/elections');
  }

  async createElection(payload: any): Promise<{ election: Election }> {
    return this.fetchJson<{ election: Election }>('/api/elections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateElectionStatus(id: string, status: string): Promise<{ election: Election }> {
    return this.fetchJson<{ election: Election }>(`/api/elections/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async nominateCandidate(electionId: string, manifesto: string, photoUrl?: string): Promise<{ candidate: Candidate }> {
    return this.fetchJson<{ candidate: Candidate }>(`/api/elections/${electionId}/nominate`, {
      method: 'POST',
      body: JSON.stringify({ manifesto, photoUrl }),
    });
  }

  async verifyCandidate(electionId: string, candId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
    return this.fetchJson<{ candidate: Candidate }>(`/api/elections/${electionId}/candidate/${candId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  async castVote(electionId: string, candidateId: string): Promise<{ success: boolean; message: string; ballotReceipt: string }> {
    return this.fetchJson<{ success: boolean; message: string; ballotReceipt: string }>(`/api/elections/${electionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ candidateId }),
    });
  }

  async checkVoterStatus(electionId: string): Promise<{ hasVoted: boolean }> {
    return this.fetchJson<{ hasVoted: boolean }>(`/api/elections/${electionId}/voter-status`);
  }

  async updateElection(id: string, payload: any): Promise<{ election: Election }> {
    return this.fetchJson<{ election: Election }>(`/api/elections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async cancelElection(id: string, cancelReason?: string): Promise<{ election: Election; message: string }> {
    return this.fetchJson<{ election: Election; message: string }>(`/api/elections/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason }),
    });
  }

  async deleteElection(id: string): Promise<{ success: boolean; message: string }> {
    return this.fetchJson<{ success: boolean; message: string }>(`/api/elections/${id}`, {
      method: 'DELETE',
    });
  }

  // Complaints
  async getComplaints(): Promise<{ complaints: Complaint[] }> {
    return this.fetchJson<{ complaints: Complaint[] }>('/api/complaints');
  }

  async createComplaint(payload: any): Promise<{ complaint: Complaint }> {
    return this.fetchJson<{ complaint: Complaint }>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateComplaintStatus(id: string, status: string, resolutionNotes?: string, assigneeId?: string) {
    return this.fetchJson<{ complaint: Complaint }>(`/api/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNotes, assigneeId }),
    });
  }

  async respondToComplaint(id: string, message: string) {
    return this.fetchJson<{ complaint: Complaint }>(`/api/complaints/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async escalateComplaint(id: string, escalationReason?: string): Promise<{ complaint: Complaint }> {
    return this.fetchJson<{ complaint: Complaint }>(`/api/complaints/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ escalationReason }),
    });
  }

  async deleteComplaint(id: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.fetchJson<{ success: boolean; message: string }>(`/api/complaints/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // Requests
  async getRequests(): Promise<{ requests: GovernanceRequest[] }> {
    return this.fetchJson<{ requests: GovernanceRequest[] }>('/api/requests');
  }

  async createRequest(payload: any): Promise<{ request: GovernanceRequest }> {
    return this.fetchJson<{ request: GovernanceRequest }>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async decideRequest(id: string, status: string, decisionNotes?: string) {
    return this.fetchJson<{ request: GovernanceRequest }>(`/api/requests/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ status, decisionNotes }),
    });
  }

  async cancelRequest(id: string, cancelReason?: string): Promise<{ request: GovernanceRequest }> {
    return this.fetchJson<{ request: GovernanceRequest }>(`/api/requests/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason }),
    });
  }

  async deleteRequest(id: string): Promise<{ success: boolean; message: string }> {
    return this.fetchJson<{ success: boolean; message: string }>(`/api/requests/${id}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents(): Promise<{ events: CollegeEvent[] }> {
    return this.fetchJson<{ events: CollegeEvent[] }>('/api/events');
  }

  async createEvent(payload: any): Promise<{ event: CollegeEvent }> {
    return this.fetchJson<{ event: CollegeEvent }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEvent(id: string, payload: any): Promise<{ event: CollegeEvent }> {
    return this.fetchJson<{ event: CollegeEvent }>(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async cancelEvent(id: string, cancelReason?: string): Promise<{ event: CollegeEvent; message: string }> {
    return this.fetchJson<{ event: CollegeEvent; message: string }>(`/api/events/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason }),
    });
  }

  async deleteEvent(id: string): Promise<{ success: boolean; message: string }> {
    return this.fetchJson<{ success: boolean; message: string }>(`/api/events/${id}`, {
      method: 'DELETE',
    });
  }

  async registerEvent(id: string, teamName?: string) {
    return this.fetchJson<{ event: CollegeEvent }>(`/api/events/${id}/register`, {
      method: 'POST',
      body: JSON.stringify({ teamName }),
    });
  }

  async volunteerDuty(id: string, dutyTitle: string, dutyDescription?: string) {
    return this.fetchJson<{ event: CollegeEvent }>(`/api/events/${id}/volunteer`, {
      method: 'POST',
      body: JSON.stringify({ dutyTitle, dutyDescription }),
    });
  }

  // Global Search
  async globalSearch(query: string): Promise<{
    results: Array<{
      id: string;
      type: 'user' | 'task' | 'complaint' | 'request' | 'event' | 'election' | 'notice';
      title: string;
      subtitle: string;
      status?: string;
      badge?: string;
      linkModule: string;
    }>;
  }> {
    const params = new URLSearchParams({ q: query });
    return this.fetchJson(`/api/search?${params.toString()}`);
  }

  // Rules
  async getRules(): Promise<{ rules: GovernanceRule[] }> {
    return this.fetchJson<{ rules: GovernanceRule[] }>('/api/rules');
  }

  async createRule(payload: any): Promise<{ rule: GovernanceRule }> {
    return this.fetchJson<{ rule: GovernanceRule }>('/api/rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async toggleRule(id: string): Promise<{ rule: GovernanceRule }> {
    return this.fetchJson<{ rule: GovernanceRule }>(`/api/rules/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  // Audit Logs
  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return this.fetchJson<{ auditLogs: AuditLog[] }>('/api/audit-logs');
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<{ metrics: any; departmentStats: any }> {
    return this.fetchJson<{ metrics: any; departmentStats: any }>('/api/dashboard/stats');
  }

  // AI Endpoints
  async askAI(query: string): Promise<{ answer: string }> {
    return this.fetchJson<{ answer: string }>('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async categorizeComplaintAI(title: string, description: string): Promise<{ category: string; priority: string; reason: string }> {
    return this.fetchJson<{ category: string; priority: string; reason: string }>('/api/ai/categorize-complaint', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  async checkDuplicateComplaintAI(title: string, description: string) {
    return this.fetchJson<{ isDuplicate: boolean; similarTrackingId?: string; similarityScore: number; reason?: string }>(
      '/api/ai/check-duplicate-complaint',
      {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      }
    );
  }

  async summarizeTasksAI(): Promise<{ summary: string }> {
    return this.fetchJson<{ summary: string }>('/api/ai/summarize-tasks', {
      method: 'POST',
    });
  }

  async draftNoticeAI(topic: string, audience: string, keyPoints: string): Promise<{ title: string; content: string }> {
    return this.fetchJson<{ title: string; content: string }>('/api/ai/draft-notice', {
      method: 'POST',
      body: JSON.stringify({ topic, audience, keyPoints }),
    });
  }
}

export const api = new ApiService();
