export type UserRole =
  | 'super_admin'
  | 'hod'
  | 'faculty'
  | 'coordinator'
  | 'election_officer'
  | 'sports_coordinator'
  | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  semester?: number;
  section?: string;
  rollNumber?: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'suspended';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'Academic' | 'Exam' | 'Sports' | 'Election' | 'Administrative' | 'Urgent';
  targetAudience: {
    type: 'all' | 'department' | 'class';
    department?: string;
    semester?: number;
  };
  authorName: string;
  authorRole: string;
  publishedAt: string;
  expiryDate?: string;
  isPinned: boolean;
  attachments?: string[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  linkModule: 'tasks' | 'elections' | 'complaints' | 'requests' | 'events' | 'notices';
  linkId?: string;
  isRead: boolean;
  createdAt: string;
}

export type TaskStatus = 'draft' | 'assigned' | 'in_progress' | 'submitted' | 'verified' | 'returned';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskActivity {
  id: string;
  action: string;
  byName: string;
  byRole: string;
  timestamp: string;
  notes?: string;
}

export interface StudentTask {
  id: string;
  title: string;
  instructions: string;
  department: string;
  targetGroup: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  expectedOutcome: string;
  evidenceCriteria: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  assigneeId: string;
  assigneeName: string;
  assigneeRole: string;
  status: TaskStatus;
  submission?: {
    submittedAt: string;
    notes: string;
    evidenceLink: string;
  };
  verification?: {
    verifiedAt: string;
    feedback: string;
    approved: boolean;
    rating?: number;
  };
  returnedReason?: string;
  escalated?: boolean;
  activityHistory: TaskActivity[];
}

export type ElectionStatus =
  | 'draft'
  | 'nomination_open'
  | 'under_review'
  | 'campaign_period'
  | 'voting_open'
  | 'voting_closed'
  | 'results_published'
  | 'archived';

export interface Candidate {
  id: string;
  userId: string;
  name: string;
  department: string;
  semester: number;
  rollNumber: string;
  manifesto: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  votesCount: number;
}

export interface Election {
  id: string;
  title: string;
  position: string;
  description: string;
  academicYear: string;
  nominationStart: string;
  nominationEnd: string;
  votingStart: string;
  votingEnd: string;
  status: ElectionStatus;
  eligibleDepartments: string[];
  eligibleSemesters: number[];
  minGpa?: number;
  candidates: Candidate[];
  totalBallotsCast: number;
  resultsDeclaredAt?: string;
}

export type ComplaintCategory =
  | 'infrastructure'
  | 'academic'
  | 'sports'
  | 'laboratory'
  | 'administrative'
  | 'other';

export type ComplaintStatus =
  | 'submitted'
  | 'acknowledged'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ComplaintResponse {
  id: string;
  byId: string;
  byName: string;
  byRole: string;
  message: string;
  timestamp: string;
  isOfficial: boolean;
}

export interface Complaint {
  trackingId: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  isAnonymous: boolean;
  submitterId: string;
  submitterName: string;
  department: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: string;
  responses: ComplaintResponse[];
  resolutionNotes?: string;
  resolvedAt?: string;
  escalated: boolean;
  escalationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestType =
  | 'leave'
  | 'event_participation'
  | 'council_duty'
  | 'lab_access'
  | 'hall_booking'
  | 'other';

export type RequestStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';

export interface GovernanceRequest {
  trackingId: string;
  type: RequestType;
  title: string;
  reason: string;
  startDate: string;
  endDate: string;
  submitterId: string;
  submitterName: string;
  department: string;
  reviewerRole: string;
  reviewerId?: string;
  reviewerName?: string;
  status: RequestStatus;
  decisionNotes?: string;
  decisionAt?: string;
  appealNotes?: string;
  createdAt: string;
}

export interface VolunteerDuty {
  id: string;
  title: string;
  description: string;
  assignedUserId?: string;
  assignedUserName?: string;
  status: 'open' | 'assigned' | 'completed';
}

export interface EventParticipant {
  userId: string;
  name: string;
  department: string;
  registeredAt: string;
  attended: boolean;
  teamName?: string;
}

export interface CollegeEvent {
  id: string;
  title: string;
  type: 'sports' | 'cultural' | 'technical' | 'workshop' | 'fest' | 'club';
  description: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  registrationDeadline: string;
  organizerId: string;
  organizerName: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  participants: EventParticipant[];
  volunteerDuties: VolunteerDuty[];
}

export interface GovernanceRule {
  id: string;
  title: string;
  description: string;
  module: 'tasks' | 'complaints' | 'approvals' | 'elections' | 'events';
  triggerCondition: string;
  responsibleRole: string;
  requiredAction: string;
  slaHours: number;
  reminderSchedule: string;
  escalationDestination: string;
  active: boolean;
  lastUpdated: string;
  approvalHistory: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  details: string;
  timestamp: string;
}

export interface InstitutionConfig {
  name: string;
  shortName: string;
  management: string;
  affiliation: string;
  approval: string;
  academicYear: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  googleMapsUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  website: string;
  email: string;
  admissionEmail?: string;
  phone: string;
  principalPhone: string;
  principalName: string;
  departments: string[];
  semesters: number[];
  sections: string[];
  campusImageUrl?: string;
  logoUrl?: string;
}
