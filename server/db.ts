import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  Notice,
  NotificationItem,
  StudentTask,
  Election,
  Complaint,
  GovernanceRequest,
  CollegeEvent,
  GovernanceRule,
  AuditLog,
  InstitutionConfig,
} from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.resolve(DATA_DIR, 'college_db.json');

export interface VoterRecord {
  electionId: string;
  userId: string;
  votedAt: string;
}

export interface SecretBallot {
  id: string;
  electionId: string;
  candidateId: string;
  ballotHash: string;
  timestamp: string;
}

export interface CollegeDatabase {
  institution: InstitutionConfig;
  users: User[];
  notices: Notice[];
  notifications: NotificationItem[];
  tasks: StudentTask[];
  elections: Election[];
  voterRecords: VoterRecord[];
  secretBallots: SecretBallot[];
  complaints: Complaint[];
  requests: GovernanceRequest[];
  events: CollegeEvent[];
  rules: GovernanceRule[];
  auditLogs: AuditLog[];
  knowledgeBase: { id: string; title: string; category: string; content: string }[];
}

const INITIAL_DATA: CollegeDatabase = {
  institution: {
    name: "B.V.V. Sangha's Biluru Gurubasava Mahaswamiji Institute of Technology (BGMIT)",
    shortName: 'BGMIT Mudhol',
    management: 'Basaveshwar Veerashaiva Vidya Vardhak Sangha (B.V.V. Sangha), Bagalkot',
    affiliation: 'Affiliated to Visvesvaraya Technological University (VTU), Belagavi',
    approval: 'Approved by AICTE, New Delhi & Recognized by Govt. of Karnataka',
    academicYear: '2026-2027',
    address: 'Mantur Road, Mudhol - 587313, Bagalkot District, Karnataka, India',
    city: 'Mudhol',
    district: 'Bagalkot',
    state: 'Karnataka',
    pincode: '587313',
    googleMapsUrl: 'https://maps.app.goo.gl/tuFvXRTYUCLtEhBz8',
    coordinates: {
      lat: 16.3382367,
      lng: 75.2877228,
    },
    website: 'http://www.bgmitm.ac.in',
    email: 'bvvsbgmitm@gmail.com',
    admissionEmail: 'bgmitadmission@gmail.com',
    phone: '08350-454452',
    principalPhone: '+91-9141201838',
    principalName: 'Dr. Shravankumar B. Kerur',
    departments: [
      'Computer Science & Engineering',
      'Artificial Intelligence & Machine Learning',
      'Electronics & Communication Eng.',
      'Civil Engineering',
      'Mechanical Engineering',
      'Management Studies (MBA)',
    ],
    semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    sections: ['A', 'B', 'C'],
    campusImageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80',
    logoUrl: '/bgmit-logo.svg',
  },
  users: [
    {
      id: 'usr_admin',
      name: 'Dr. Shravankumar B. Kerur',
      email: 'principal@bgmitm.ac.in',
      role: 'super_admin',
      department: 'Principal Office & Administration',
      phone: '+91-9141201838',
      status: 'active',
    },
    {
      id: 'usr_hod',
      name: 'Prof. Anand S. (HOD)',
      email: 'hod.cse@bgmitm.ac.in',
      role: 'hod',
      department: 'Computer Science & Engineering',
      phone: '+91 (08350) 454452',
      status: 'active',
    },
    {
      id: 'usr_faculty',
      name: 'Prof. Geeta M.',
      email: 'geeta.m@bgmitm.ac.in',
      role: 'faculty',
      department: 'Computer Science & Engineering',
      phone: '+91 (08350) 454453',
      status: 'active',
    },
    {
      id: 'usr_coord',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@student.bgmitm.ac.in',
      role: 'coordinator',
      department: 'Computer Science & Engineering',
      semester: 6,
      section: 'A',
      rollNumber: '2BG23CS042',
      phone: '+91-9902638673',
      status: 'active',
    },
    {
      id: 'usr_election_officer',
      name: 'Dr. Ramesh K.',
      email: 'electoral.officer@bgmitm.ac.in',
      role: 'election_officer',
      department: 'Electronics & Communication Eng.',
      phone: '+91 (08350) 454454',
      status: 'active',
    },
    {
      id: 'usr_sports_coord',
      name: 'Sri Mallikarjun B.',
      email: 'sports@bgmitm.ac.in',
      role: 'sports_coordinator',
      department: 'Physical Education & Athletics',
      phone: '+91 (08350) 454455',
      status: 'active',
    },
    {
      id: 'usr_student',
      name: 'Priya Patel',
      email: 'priya.patel@student.bgmitm.ac.in',
      role: 'student',
      department: 'Computer Science & Engineering',
      semester: 6,
      section: 'A',
      rollNumber: '2BG23CS088',
      phone: '+91-9845012345',
      status: 'active',
    },
  ],
  notices: [
    {
      id: 'not_1',
      title: 'Mandatory Student Council General Elections 2026-2027 Schedule',
      content:
        'The Election Commission announces the commencement of student council voting. All eligible undergraduate students from CSE, ECE, and Mech are invited to exercise their franchise. Strictly follow the Election Code of Conduct.',
      category: 'Election',
      targetAudience: { type: 'all' },
      authorName: 'Prof. Arthur Pendelton',
      authorRole: 'Chief Electoral Officer',
      publishedAt: '2026-10-10T09:00:00Z',
      isPinned: true,
    },
    {
      id: 'not_2',
      title: 'Mid-Semester Lab Verification & Project Milestone Submissions',
      content:
        'All Year 3 students must complete their assigned laboratory verification tasks and submit proof of system testing before October 25, 2026. Late submissions will trigger automated faculty escalation.',
      category: 'Academic',
      targetAudience: { type: 'department', department: 'Computer Science', semester: 6 },
      authorName: 'Prof. Marcus Sterling',
      authorRole: 'HOD Computer Science',
      publishedAt: '2026-10-08T11:30:00Z',
      isPinned: true,
    },
    {
      id: 'not_3',
      title: 'Annual Inter-Department Athletics & Football League Registrations',
      content:
        'Registration is now open for the Autumn Sports Fest. Department teams must register team rosters and designate student volunteer captains before Friday.',
      category: 'Sports',
      targetAudience: { type: 'all' },
      authorName: 'Coach David Miller',
      authorRole: 'Sports Director',
      publishedAt: '2026-10-05T14:15:00Z',
      isPinned: false,
    },
  ],
  notifications: [
    {
      id: 'ntf_1',
      userId: 'usr_student',
      title: 'Task Assigned',
      message: 'You have been assigned responsibility: Lab Equipment Inventory & Calibration Audit.',
      linkModule: 'tasks',
      linkId: 'tsk_1',
      isRead: false,
      createdAt: '2026-10-09T08:30:00Z',
    },
    {
      id: 'ntf_2',
      userId: 'usr_student',
      title: 'Voting Now Open',
      message: 'General Secretary - Student Council 2026-2027 election is currently accepting ballots.',
      linkModule: 'elections',
      linkId: 'elec_1',
      isRead: false,
      createdAt: '2026-10-11T08:00:00Z',
    },
    {
      id: 'ntf_3',
      userId: 'usr_hod',
      title: 'Escalation Alert',
      message: 'Task tsk_5 (Quarterly Academic Grievance Report) is overdue by 48 hours.',
      linkModule: 'tasks',
      linkId: 'tsk_5',
      isRead: false,
      createdAt: '2026-10-10T17:00:00Z',
    },
  ],
  tasks: [
    {
      id: 'tsk_1',
      title: 'Lab 3 System Calibration & Hardware Audit',
      instructions:
        'Inspect all 40 workstations in Systems Lab 3. Verify Linux kernel installations, benchmark GPU thermals, and note down any missing peripheral devices.',
      department: 'Computer Science',
      targetGroup: 'Year 3 Lab Assistants',
      priority: 'high',
      startDate: '2026-10-08T09:00:00Z',
      dueDate: '2026-10-18T18:00:00Z',
      expectedOutcome: 'Signed audit checklist and hardware diagnostics spreadsheet uploaded.',
      evidenceCriteria: 'Spreadsheet link or PDF audit report with workstation serial numbers.',
      reviewerId: 'usr_faculty',
      reviewerName: 'Dr. Elena Rostova',
      reviewerRole: 'Senior Faculty Mentor',
      assigneeId: 'usr_student',
      assigneeName: 'Priya Patel',
      assigneeRole: 'Student',
      status: 'in_progress',
      activityHistory: [
        {
          id: 'act_101',
          action: 'Task Created & Assigned',
          byName: 'Dr. Elena Rostova',
          byRole: 'Faculty',
          timestamp: '2026-10-08T09:00:00Z',
          notes: 'Task assigned to student Priya Patel with High priority.',
        },
        {
          id: 'act_102',
          action: 'Status updated to In Progress',
          byName: 'Priya Patel',
          byRole: 'Student',
          timestamp: '2026-10-09T10:15:00Z',
          notes: 'Commenced workstation thermal benchmarks for rows 1 to 3.',
        },
      ],
    },
    {
      id: 'tsk_2',
      title: 'Department Seminar Hall AV Setup & Audio Loop Test',
      instructions:
        'Configure the wireless acoustic microphone matrix, calibrate dual projectors, and record a 2-minute test audio stream ahead of the Visiting Professor Lecture.',
      department: 'Computer Science',
      targetGroup: 'Event Technical Crew',
      priority: 'urgent',
      startDate: '2026-10-10T08:00:00Z',
      dueDate: '2026-10-12T12:00:00Z',
      expectedOutcome: 'Verified audio decibel levels and HDMI latency benchmark under 20ms.',
      evidenceCriteria: 'Upload test recording audio link and signed venue checklist.',
      reviewerId: 'usr_faculty',
      reviewerName: 'Dr. Elena Rostova',
      reviewerRole: 'Senior Faculty Mentor',
      assigneeId: 'usr_student',
      assigneeName: 'Priya Patel',
      assigneeRole: 'Student',
      status: 'submitted',
      submission: {
        submittedAt: '2026-10-11T09:30:00Z',
        notes: 'Calibrated both wireless mics to 48kHz. Tested HDMI switchers across all podiums with no jitter.',
        evidenceLink: 'https://docs.apex.edu/av-test-log-seminar-hall-oct11.pdf',
      },
      activityHistory: [
        {
          id: 'act_201',
          action: 'Task Assigned',
          byName: 'Dr. Elena Rostova',
          byRole: 'Faculty',
          timestamp: '2026-10-10T08:00:00Z',
        },
        {
          id: 'act_202',
          action: 'Proof Submitted for Verification',
          byName: 'Priya Patel',
          byRole: 'Student',
          timestamp: '2026-10-11T09:30:00Z',
          notes: 'Submitted test logs for faculty review.',
        },
      ],
    },
    {
      id: 'tsk_3',
      title: 'Annual Tech Symposium Hackathon Code Review Rules Drafting',
      instructions:
        'Draft the official evaluation matrix, anti-plagiarism guidelines, and API access requirements for all 60 hackathon teams.',
      department: 'Computer Science',
      targetGroup: 'Student Council Technical Committee',
      priority: 'medium',
      startDate: '2026-10-05T09:00:00Z',
      dueDate: '2026-10-10T17:00:00Z',
      expectedOutcome: 'Approved code grading rubric endorsed by department committee.',
      evidenceCriteria: 'Google Doc rubric link and faculty approval email attachment.',
      reviewerId: 'usr_hod',
      reviewerName: 'Prof. Marcus Sterling',
      reviewerRole: 'HOD',
      assigneeId: 'usr_coord',
      assigneeName: 'Rohan Sharma',
      assigneeRole: 'Student Coordinator',
      status: 'verified',
      submission: {
        submittedAt: '2026-10-09T16:00:00Z',
        notes: 'Completed all 5 scoring dimensions including architecture, security, and demo.',
        evidenceLink: 'https://apex.edu/symposium-rubric-v2.pdf',
      },
      verification: {
        verifiedAt: '2026-10-10T10:00:00Z',
        feedback: 'Excellent work. The criteria are fair and robust against automated tool assistance.',
        approved: true,
        rating: 5,
      },
      activityHistory: [
        {
          id: 'act_301',
          action: 'Task Assigned',
          byName: 'Prof. Marcus Sterling',
          byRole: 'HOD',
          timestamp: '2026-10-05T09:00:00Z',
        },
        {
          id: 'act_302',
          action: 'Submitted',
          byName: 'Rohan Sharma',
          byRole: 'Coordinator',
          timestamp: '2026-10-09T16:00:00Z',
        },
        {
          id: 'act_303',
          action: 'Verified & Approved',
          byName: 'Prof. Marcus Sterling',
          byRole: 'HOD',
          timestamp: '2026-10-10T10:00:00Z',
          notes: 'Marked as completed and verified.',
        },
      ],
    },
    {
      id: 'tsk_4',
      title: 'Athletics Ground Safety Inspection & First-Aid Box Replenishment',
      instructions:
        'Survey track lanes 1-8 for surface irregularities. Restock ice packs, antiseptics, and compression bandages in the medical dugout.',
      department: 'Physical Education',
      targetGroup: 'Sports Volunteers',
      priority: 'medium',
      startDate: '2026-10-07T08:00:00Z',
      dueDate: '2026-10-15T16:00:00Z',
      expectedOutcome: 'Safety certification signed by Athletic Director.',
      evidenceCriteria: 'Signed checklist with stock receipt.',
      reviewerId: 'usr_sports_coord',
      reviewerName: 'Coach David Miller',
      reviewerRole: 'Sports Director',
      assigneeId: 'usr_coord',
      assigneeName: 'Rohan Sharma',
      assigneeRole: 'Student Coordinator',
      status: 'in_progress',
      activityHistory: [
        {
          id: 'act_401',
          action: 'Assigned',
          byName: 'Coach David Miller',
          byRole: 'Sports Coordinator',
          timestamp: '2026-10-07T08:00:00Z',
        },
      ],
    },
    {
      id: 'tsk_5',
      title: 'Quarterly Academic Grievance Resolution Summary Dossier',
      instructions:
        'Aggregate all closed academic complaints from Q3, synthesize student satisfaction metrics, and prepare executive briefing for the HOD.',
      department: 'Computer Science',
      targetGroup: 'Grievance Taskforce',
      priority: 'high',
      startDate: '2026-10-01T09:00:00Z',
      dueDate: '2026-10-08T17:00:00Z',
      expectedOutcome: 'Executive PDF dossier submitted to the Department Board.',
      evidenceCriteria: 'Signed executive report with SLA analysis.',
      reviewerId: 'usr_hod',
      reviewerName: 'Prof. Marcus Sterling',
      reviewerRole: 'HOD',
      assigneeId: 'usr_coord',
      assigneeName: 'Rohan Sharma',
      assigneeRole: 'Student Coordinator',
      status: 'in_progress',
      escalated: true,
      activityHistory: [
        {
          id: 'act_501',
          action: 'Assigned',
          byName: 'Prof. Marcus Sterling',
          byRole: 'HOD',
          timestamp: '2026-10-01T09:00:00Z',
        },
        {
          id: 'act_502',
          action: 'Automatic SLA Overdue Escalation Triggered',
          byName: 'Governance Accountability Engine',
          byRole: 'System',
          timestamp: '2026-10-09T00:01:00Z',
          notes: 'Task passed SLA deadline (Oct 8). Sent escalation notification to HOD Prof. Marcus Sterling.',
        },
      ],
    },
  ],
  elections: [
    {
      id: 'elec_1',
      title: 'General Secretary - Student Council 2026-2027',
      position: 'General Secretary',
      description:
        'Official democratic election to choose the student representative presiding over the Executive Council, institutional committees, and student welfare.',
      academicYear: '2026-2027',
      nominationStart: '2026-10-01T00:00:00Z',
      nominationEnd: '2026-10-07T23:59:59Z',
      votingStart: '2026-10-10T08:00:00Z',
      votingEnd: '2026-10-14T18:00:00Z',
      status: 'voting_open',
      eligibleDepartments: ['Computer Science', 'Electronics & Comm.', 'Mechanical Eng.', 'Civil Eng.', 'Biotechnology'],
      eligibleSemesters: [4, 5, 6, 7, 8],
      minGpa: 3.2,
      totalBallotsCast: 142,
      candidates: [
        {
          id: 'cand_1',
          userId: 'usr_coord',
          name: 'Rohan Sharma',
          department: 'Computer Science',
          semester: 6,
          rollNumber: 'CS23-042',
          manifesto:
            'Focus on 24/7 lab access, transparent student club budgetary allocations, subsidized technical certification vouchers, and streamlined peer tutoring networks.',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          status: 'approved',
          votesCount: 88,
        },
        {
          id: 'cand_2',
          userId: 'usr_cand2',
          name: 'Ananya Sen',
          department: 'Electronics & Comm.',
          semester: 6,
          rollNumber: 'EC23-019',
          manifesto:
            'Championing interdisciplinary engineering hackathons, mental health awareness resources, greener campus recycling stations, and improved sports ground floodlights.',
          photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          status: 'approved',
          votesCount: 54,
        },
      ],
    },
    {
      id: 'elec_2',
      title: 'Department Representative - Computer Science Year 3',
      position: 'Class Representative / Department Liaison',
      description:
        'Departmental representative responsible for liaising between 3rd-year students, the HOD, and faculty mentors regarding curriculum feedback and schedule adjustments.',
      academicYear: '2026-2027',
      nominationStart: '2026-10-10T00:00:00Z',
      nominationEnd: '2026-10-16T23:59:59Z',
      votingStart: '2026-10-18T08:00:00Z',
      votingEnd: '2026-10-20T18:00:00Z',
      status: 'nomination_open',
      eligibleDepartments: ['Computer Science'],
      eligibleSemesters: [5, 6],
      minGpa: 3.0,
      totalBallotsCast: 0,
      candidates: [
        {
          id: 'cand_3',
          userId: 'usr_student',
          name: 'Priya Patel',
          department: 'Computer Science',
          semester: 6,
          rollNumber: 'CS23-088',
          manifesto:
            'Dedicated to organizing weekly technical doubt-clearing sessions, faster assignment feedback turnaround, and modernizing lab development environments.',
          photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          status: 'pending',
          votesCount: 0,
        },
      ],
    },
  ],
  voterRecords: [
    // Priya has NOT voted in elec_1 yet, so she can test voting!
    {
      electionId: 'elec_1',
      userId: 'usr_coord',
      votedAt: '2026-10-10T09:12:00Z',
    },
  ],
  secretBallots: [
    {
      id: 'blt_1',
      electionId: 'elec_1',
      candidateId: 'cand_1',
      ballotHash: 'a7b8c9d0e1f234567890abcdef123456',
      timestamp: '2026-10-10T09:12:00Z',
    },
  ],
  complaints: [
    {
      trackingId: 'CMP-2026-0104',
      category: 'infrastructure',
      title: 'Lab 3 GPU Workstations Overheating & Intermittent Thermal Throttling',
      description:
        'During the Deep Learning practical sessions on Wednesday afternoon, 4 workstations in Row 3 abruptly shutdown under compute load due to clogged air intakes and failed case fans.',
      isAnonymous: false,
      submitterId: 'usr_student',
      submitterName: 'Priya Patel',
      department: 'Computer Science',
      priority: 'high',
      status: 'in_progress',
      assigneeId: 'usr_faculty',
      assigneeName: 'Dr. Elena Rostova',
      assigneeRole: 'Senior Faculty Mentor',
      responses: [
        {
          id: 'resp_1',
          byId: 'usr_faculty',
          byName: 'Dr. Elena Rostova',
          byRole: 'Faculty',
          message:
            'Technician inspection scheduled with Hardware Maintenance Dept for tomorrow morning 10:00 AM. Thermal paste and intake filters will be serviced.',
          timestamp: '2026-10-10T11:00:00Z',
          isOfficial: true,
        },
      ],
      escalated: false,
      createdAt: '2026-10-09T14:20:00Z',
      updatedAt: '2026-10-10T11:00:00Z',
    },
    {
      trackingId: 'CMP-2026-0109',
      category: 'academic',
      title: 'Delay in Distributed Systems Elective Reference Material Dispatch',
      description:
        'Students have not received the chapter 4 lecture notes and laboratory assignments ahead of next week quiz.',
      isAnonymous: false,
      submitterId: 'usr_coord',
      submitterName: 'Rohan Sharma',
      department: 'Computer Science',
      priority: 'medium',
      status: 'acknowledged',
      assigneeId: 'usr_hod',
      assigneeName: 'Prof. Marcus Sterling',
      assigneeRole: 'HOD',
      responses: [
        {
          id: 'resp_2',
          byId: 'usr_hod',
          byName: 'Prof. Marcus Sterling',
          byRole: 'HOD',
          message:
            'Grievance acknowledged. Course instructor has been instructed to upload digital coursepacks to the student portal by today 5:00 PM.',
          timestamp: '2026-10-10T16:45:00Z',
          isOfficial: true,
        },
      ],
      escalated: false,
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T16:45:00Z',
    },
    {
      trackingId: 'CMP-2026-0098',
      category: 'sports',
      title: 'Badminton Indoor Arena West Bay Floodlight Ballast Failure',
      description:
        'The court 2 lighting flickers intensely creating vision hazard during evening practice sessions.',
      isAnonymous: false,
      submitterId: 'usr_student',
      submitterName: 'Priya Patel',
      department: 'Computer Science',
      priority: 'high',
      status: 'resolved',
      assigneeId: 'usr_sports_coord',
      assigneeName: 'Coach David Miller',
      assigneeRole: 'Sports Director',
      responses: [
        {
          id: 'resp_3',
          byId: 'usr_sports_coord',
          byName: 'Coach David Miller',
          byRole: 'Sports Coordinator',
          message: 'Facilities electrician replaced the faulty LED driver ballast. Court tested and cleared for play.',
          timestamp: '2026-10-06T15:30:00Z',
          isOfficial: true,
        },
      ],
      resolutionNotes: 'Hardware driver replaced under campus facility warranty. Luminance re-verified at 450 lux.',
      resolvedAt: '2026-10-06T15:30:00Z',
      escalated: false,
      createdAt: '2026-10-04T18:00:00Z',
      updatedAt: '2026-10-06T15:30:00Z',
    },
    {
      trackingId: 'CMP-2026-0115',
      category: 'infrastructure',
      title: 'Water Purification Filter Replacement Required at Block B 2nd Floor',
      description:
        'The digital filter indicator on the central RO water dispensing kiosk is showing red service required alert.',
      isAnonymous: true,
      submitterId: 'usr_student',
      submitterName: 'Anonymous Student',
      department: 'Computer Science',
      priority: 'high',
      status: 'submitted',
      responses: [],
      escalated: false,
      createdAt: '2026-10-11T07:45:00Z',
      updatedAt: '2026-10-11T07:45:00Z',
    },
  ],
  requests: [
    {
      trackingId: 'REQ-2026-0042',
      type: 'leave',
      title: 'Medical Absence Leave - 3 Days',
      reason:
        'Viral infection and high fever. Prescribed rest by campus medical clinic physician from Oct 02 to Oct 04.',
      startDate: '2026-10-02',
      endDate: '2026-10-04',
      submitterId: 'usr_student',
      submitterName: 'Priya Patel',
      department: 'Computer Science',
      reviewerRole: 'Faculty',
      reviewerId: 'usr_faculty',
      reviewerName: 'Dr. Elena Rostova',
      status: 'approved',
      decisionNotes: 'Medical certificate reviewed and attendance compensation recorded.',
      decisionAt: '2026-10-04T14:00:00Z',
      createdAt: '2026-10-02T08:00:00Z',
    },
    {
      trackingId: 'REQ-2026-0048',
      type: 'event_participation',
      title: 'On-Duty Attendance Approval for National Inter-College Hackathon',
      reason:
        'Representing the college in the Smart Governance track at the National Tech Innovation Conclave in Bangalore.',
      startDate: '2026-10-16',
      endDate: '2026-10-18',
      submitterId: 'usr_coord',
      submitterName: 'Rohan Sharma',
      department: 'Computer Science',
      reviewerRole: 'HOD',
      reviewerId: 'usr_hod',
      reviewerName: 'Prof. Marcus Sterling',
      status: 'submitted',
      createdAt: '2026-10-10T12:30:00Z',
    },
    {
      trackingId: 'REQ-2026-0051',
      type: 'lab_access',
      title: 'Extended Weekend Robotics & IoT Laboratory Access',
      reason:
        'Need access on Saturday 10:00 AM - 6:00 PM to solder sensor matrices and debug CAN-bus telemetry for campus rover project.',
      startDate: '2026-10-17',
      endDate: '2026-10-17',
      submitterId: 'usr_student',
      submitterName: 'Priya Patel',
      department: 'Computer Science',
      reviewerRole: 'Faculty',
      reviewerId: 'usr_faculty',
      reviewerName: 'Dr. Elena Rostova',
      status: 'under_review',
      createdAt: '2026-10-11T09:15:00Z',
    },
  ],
  events: [
    {
      id: 'evt_1',
      title: 'Autumn Inter-Department Football Championship 2026',
      type: 'sports',
      description:
        'Annual 11-a-side knock-out tournament between engineering departments. Trophies for Champions, Fair Play, and Golden Boot.',
      venue: 'Main Campus Stadium Ground',
      date: '2026-10-24',
      time: '15:30',
      capacity: 120,
      registrationDeadline: '2026-10-20',
      organizerId: 'usr_sports_coord',
      organizerName: 'Coach David Miller',
      status: 'upcoming',
      participants: [
        {
          userId: 'usr_coord',
          name: 'Rohan Sharma',
          department: 'Computer Science',
          registeredAt: '2026-10-06T10:00:00Z',
          attended: false,
          teamName: 'CSE Strikers',
        },
      ],
      volunteerDuties: [
        {
          id: 'vdt_1',
          title: 'Field Line Marking & Goal Post Padding',
          description: 'Ensure boundary chalk lines are clearly visible and corner flags positioned.',
          assignedUserId: 'usr_coord',
          assignedUserName: 'Rohan Sharma',
          status: 'assigned',
        },
        {
          id: 'vdt_2',
          title: 'Medical Tent Water & Electrolyte Station Attendant',
          description: 'Keep fresh water bottles and first aid kits organized during 90-minute matches.',
          status: 'open',
        },
      ],
    },
    {
      id: 'evt_2',
      title: 'Apex InnovateX 24-Hour Hackathon & Tech Showcase',
      type: 'technical',
      description:
        'Flagship software & hardware hackathon focusing on AI for Public Welfare, Climate Tech, and Smart Governance.',
      venue: 'Innovation Hub & Labs 1-4',
      date: '2026-11-06',
      time: '09:00',
      capacity: 80,
      registrationDeadline: '2026-10-30',
      organizerId: 'usr_hod',
      organizerName: 'Prof. Marcus Sterling',
      status: 'upcoming',
      participants: [
        {
          userId: 'usr_student',
          name: 'Priya Patel',
          department: 'Computer Science',
          registeredAt: '2026-10-09T14:00:00Z',
          attended: false,
          teamName: 'ByteBrigade',
        },
      ],
      volunteerDuties: [
        {
          id: 'vdt_3',
          title: 'Participant Check-In & Badge Dispatch',
          description: 'Scan student identity cards and distribute hackathon swag kits.',
          assignedUserId: 'usr_student',
          assignedUserName: 'Priya Patel',
          status: 'assigned',
        },
      ],
    },
  ],
  rules: [
    {
      id: 'rul_1',
      title: 'Student Responsibility Deadline Pre-Alert Notice',
      description: 'Automatically dispatch high-priority in-app reminder to assigned student 24 hours prior to deadline.',
      module: 'tasks',
      triggerCondition: 'Task due date <= 24 hours remaining AND status != verified',
      responsibleRole: 'Student',
      requiredAction: 'Submit completion evidence before cutoff timestamp',
      slaHours: 24,
      reminderSchedule: 'T-24h, T-6h',
      escalationDestination: 'Assigned Faculty Mentor',
      active: true,
      lastUpdated: '2026-09-15T10:00:00Z',
      approvalHistory: ['Approved by Academic Senate Resolution #402', 'Reviewed by HOD Committee'],
    },
    {
      id: 'rul_2',
      title: 'Overdue Responsibility Faculty & HOD Escalation SLA',
      description:
        'When an assigned student task exceeds its deadline without submission, escalate to Mentor and HOD within 12 hours.',
      module: 'tasks',
      triggerCondition: 'Current time > Task Due Date AND status in (assigned, in_progress)',
      responsibleRole: 'Faculty',
      requiredAction: 'Intervene with student, evaluate extenuating circumstances, or grant extension',
      slaHours: 12,
      reminderSchedule: 'Immediate upon breach + Daily at 08:00 AM',
      escalationDestination: 'HOD & Dean of Academic Affairs',
      active: true,
      lastUpdated: '2026-09-15T10:00:00Z',
      approvalHistory: ['Ratified by Institutional Governance Council'],
    },
    {
      id: 'rul_3',
      title: 'Critical Student Grievance Acknowledgment SLA',
      description:
        'All complaints flagged Critical or High Priority must be officially acknowledged by the responsible department head within 6 hours.',
      module: 'complaints',
      triggerCondition: 'Complaint created with priority in (high, critical)',
      responsibleRole: 'HOD / Faculty',
      requiredAction: 'Assign officer and issue initial official acknowledgment',
      slaHours: 6,
      reminderSchedule: 'Hourly until acknowledged',
      escalationDestination: 'Director of Governance & Ombudsman',
      active: true,
      lastUpdated: '2026-09-20T11:00:00Z',
      approvalHistory: ['Apex Student Charter Article IX'],
    },
    {
      id: 'rul_4',
      title: 'Student Leave & Permission Decision SLA',
      description:
        'Faculty mentors and department heads must review and render decision on leave/event permissions within 48 hours.',
      module: 'approvals',
      triggerCondition: 'Request submitted by registered student',
      responsibleRole: 'Faculty / HOD',
      requiredAction: 'Approve, Reject with justification, or request additional verification documents',
      slaHours: 48,
      reminderSchedule: 'T-12h reminder to reviewer',
      escalationDestination: 'Department Head',
      active: true,
      lastUpdated: '2026-09-22T14:30:00Z',
      approvalHistory: ['Academic Regulations 2026 Section 4.3'],
    },
    {
      id: 'rul_5',
      title: 'Democratic Election Single Ballot & Audit Trail Integrity Rule',
      description:
        'Voters can cast precisely one vote per election. Voter identity registration must be strictly decoupled from ballot choice.',
      module: 'elections',
      triggerCondition: 'Vote submission endpoint invocation',
      responsibleRole: 'Election Officer',
      requiredAction: 'Execute atomic verification in voter registry, record secret ballot hash, reject duplicates',
      slaHours: 0,
      reminderSchedule: 'N/A (Real-time atomic enforcement)',
      escalationDestination: 'Chief Electoral Officer & Super Admin',
      active: true,
      lastUpdated: '2026-09-28T09:00:00Z',
      approvalHistory: ['Electoral Statutes 2026 passed by Supreme Campus Council'],
    },
  ],
  auditLogs: [
    {
      id: 'log_1',
      action: 'SYSTEM_INITIALIZATION',
      module: 'System',
      actorId: 'usr_admin',
      actorName: 'Dr. Sarah Vance',
      actorRole: 'Super Admin',
      details: 'Apex Governance Platform configured with Academic Year 2026-2027.',
      timestamp: '2026-10-01T08:00:00Z',
    },
    {
      id: 'log_2',
      action: 'ELECTION_OPENED',
      module: 'Elections',
      actorId: 'usr_election_officer',
      actorName: 'Prof. Arthur Pendelton',
      actorRole: 'Election Officer',
      details: 'Voting commenced for General Secretary Student Council 2026-2027.',
      timestamp: '2026-10-10T08:00:00Z',
    },
    {
      id: 'log_3',
      action: 'TASK_VERIFICATION',
      module: 'Tasks',
      actorId: 'usr_hod',
      actorName: 'Prof. Marcus Sterling',
      actorRole: 'HOD',
      details: 'Task tsk_3 (Tech Symposium Rubric) verified and marked completed with 5/5 score.',
      timestamp: '2026-10-10T10:00:00Z',
    },
  ],
  knowledgeBase: [
    {
      id: 'kb_0',
      title: 'BGMIT Mudhol Institutional Profile & Accreditation',
      category: 'Institution',
      content:
        'Biluru Gurubasava Mahaswamiji Institute of Technology (BGMIT), Mudhol was established under the aegis of Shri B.V.V. Sangha, Bagalkot (Estd. 1906). BGMIT is affiliated to Visvesvaraya Technological University (VTU), Belagavi, approved by AICTE, New Delhi and recognized by the Government of Karnataka. Campus is situated at Mantur Road, Mudhol - 587313, Bagalkot District, Karnataka. Principal: Dr. Shravankumar B. Kerur. Website: http://www.bgmitm.ac.in. Email: bvvsbgmitm@gmail.com.',
    },
    {
      id: 'kb_1',
      title: 'Student Governance Charter & Code of Conduct 2026',
      category: 'Policy',
      content:
        'Every student responsibility has an explicit assignee, due date, and verification criteria. Failure to complete tasks without prior faculty-approved reason will result in escalation. Retaliation against any student submitting an official grievance is strictly prohibited and subject to immediate disciplinary review.',
    },
    {
      id: 'kb_2',
      title: 'Student Council Election Regulations',
      category: 'Elections',
      content:
        'Candidates must hold a minimum cumulative GPA of 3.0 and have no active disciplinary sanctions. Voting is conducted via secret ballot. No candidate or volunteer may solicit votes within 50 meters of official polling terminals or coerce voters. Violations will result in immediate disqualification by the Chief Electoral Officer.',
    },
    {
      id: 'kb_3',
      title: 'Grievance Redressal and Confidentiality Guidelines',
      category: 'Complaints',
      content:
        'Students may lodge grievances under categories: Infrastructure, Academic, Sports, Laboratory, Administrative, or Other. Anonymous complaints protect student identity from faculty and peers. High-priority complaints require official acknowledgment within 6 hours and investigation closure within 5 working days.',
    },
    {
      id: 'kb_4',
      title: 'VTU Academic Attendance & On-Duty Permission Protocols',
      category: 'Attendance',
      content:
        'Under VTU regulations, students must maintain 85% attendance (minimum 75% with approved medical certificate). On-duty attendance for representing BGMIT Mudhol in university sports, technical symposiums, or hackathons must be submitted at least 24 hours in advance and endorsed by the respective Department HOD.',
    },
  ],
};

class DatabaseManager {
  private data: CollegeDatabase;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): CollegeDatabase {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed reading database file, using initial data:', err);
    }
    this.saveData(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  private saveData(data: CollegeDatabase) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed writing to database file:', err);
    }
  }

  public get<K extends keyof CollegeDatabase>(key: K): CollegeDatabase[K] {
    return this.data[key];
  }

  public getAll(): CollegeDatabase {
    return this.data;
  }

  public update<K extends keyof CollegeDatabase>(key: K, value: CollegeDatabase[K]) {
    this.data[key] = value;
    this.saveData(this.data);
  }

  public logAudit(actor: { id: string; name: string; role: string }, action: string, module: string, details: string) {
    const entry: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      module,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    // Keep max 200 audit logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.saveData(this.data);
    return entry;
  }

  public addNotification(userId: string, title: string, message: string, linkModule: NotificationItem['linkModule'], linkId?: string) {
    const notif: NotificationItem = {
      id: `ntf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title,
      message,
      linkModule,
      linkId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.saveData(this.data);
    return notif;
  }
}

export const db = new DatabaseManager();
