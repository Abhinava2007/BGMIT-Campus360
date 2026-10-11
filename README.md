# Apex College Governance & Student Responsibility Management System

> **Governing Principle:** *"Every responsibility has an owner, every task has a deadline, every approval has an authorized decision-maker, every workflow has a clear status, and every important action has an auditable record."*

---

## 1. System Overview & Architecture

Apex GovCampus is a production-grade, full-stack institutional governance and accountability management platform tailored for modern collegiate communities. It replaces scattered spreadsheets, informal chat groups, and fragmented email chains with an auditable, role-governed digital campus workflow.

### Architecture Highlights
- **Frontend SPA**: React 19 + TypeScript + Vite + Tailwind CSS with Lucide icons.
- **Backend Core**: Server-side Node.js Express server running with strict role-based access control (RBAC) middleware.
- **Democratic Voting Engine**: Cryptographically decoupled secret ballot ledger with server-side atomic validation preventing duplicate voting.
- **Grievance Redressal**: Confidential / Anonymous complaint handling with mandatory 6-hour acknowledgment SLA tracking.
- **Rules & Accountability Engine**: Deterministic SLA policies mapping triggering events to mandated roles and automated escalation destinations.
- **AI Intelligence**: Server-side Gemini 3.8 (`@google/genai`) integration with institutional policy document grounding, auto-categorization of grievances, duplicate complaint detection, executive report synthesis, and circular drafting.
- **PWA Ready**: Web App Manifest (`manifest.json`), service worker offline caching (`sw.js`), and mobile-responsive viewport.

---

## 2. User Roles & RBAC Matrix

The system models seven distinct personas with tailored interfaces and server-side authorization:

| Role | Persona Name | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | Dr. Sarah Vance | Institutional parameters, departments, academic years, user accounts provisioning, global audit logs. |
| **HOD** | Prof. Marcus Sterling | Departmental activity matrix, overdue liability alerts, approval escalations, CSV exports, printable report dossier. |
| **Faculty Mentor** | Dr. Elena Rostova | Assign student responsibilities, review submitted proofs, approve/return tasks with feedback, process leave permissions. |
| **Student Coordinator** | Rohan Sharma | Class Representative coordination, event duty delegation, student task tracking, reporting to faculty. |
| **Election Officer** | Prof. Arthur Pendelton | Configure council elections, nomination verification, voting window controls, publish tally, monitor audit logs. |
| **Sports Coordinator** | Coach David Miller | Tournaments, athletic leagues, venue capacity limits, volunteer duties allocation, attendance verification. |
| **Student** | Priya Patel | Track personal responsibilities, upload proof of completion, cast secret ballots, lodge grievances, apply for leaves. |

---

## 3. Core Modules & Workflows

### A. Student Tasks & Responsibility Workflow
```
Draft ──> Assigned ──> In Progress ──> Submitted ──> Verified
                                           │
                                           └──> Returned for Revision
```
- **Assigned Tasks**: Every task contains title, scope, responsible student/staff, department, priority, due date, expected outcome, evidence criteria, and assigned reviewer.
- **Verification**: Reviewer inspects submitted link/notes, scores quality (1–5), or returns for changes with mandatory justification.
- **SLA Escalation**: Tasks past due date without submission trigger automated escalation to Mentor and HOD within 12 hours.

### B. Council Elections & Democratic Secret Ballot
```
Draft ──> Nomination Open ──> Under Review ──> Campaign Period ──> Voting Open ──> Voting Closed ──> Results Published
```
- **Duplicate Vote Prevention**: Atomic server-side check queries the voter participation registry. Any repeat attempt returns `409 Conflict: Duplicate vote rejected`.
- **Secret Ballot Decoupling**: Voter identity is logged in the participation record, while ballot candidate choices are stored in a separate hashed ledger. Ordinary administrators cannot correlate voter identity with ballot choice.

### C. Student Complaints & Grievance Redressal
```
Submitted ──> Acknowledged ──> Assigned ──> In Progress ──> Resolved ──> Closed
```
- **Categories**: Infrastructure, Academic, Laboratory, Sports, Administrative, Other.
- **Confidential Submission**: Anonymous flag completely conceals student identity from ordinary faculty and mentors.
- **AI Classification & Duplicate Detection**: Semantic check suggests category and alerts users if a similar grievance is already open.

### D. Leaves & On-Duty Permissions
```
Submitted ──> Under Review ──> Approved / Rejected ──> Completed
```
- Tracks start date, end date, reason, and reviewing authority (Faculty Mentor / HOD). Decisions include official sign-off notes.

### E. Sports & Campus Events
- Event capacity limits, participant registration, team rosters, and volunteer duty claiming.

### F. Official Bulletins & Circulars
- Pinned circulars, category tags, expiry dates, in-app notification center broadcasting, and Gemini AI circular drafting.

---

## 4. Setup, Execution & Testing

### Running the Applet
```bash
# Start development full-stack server (Port 3000)
npm run dev

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build
```

### Environment Variables
Configure in your environment or `.env`:
```ini
# GEMINI_API_KEY: Server-side Gemini API key for policy assistant & intelligence
GEMINI_API_KEY="your-api-key-here"

# PORT: Server listening port (default 3000)
PORT=3000
```

### How to Test Each Role
Use the **Persona Switcher** in the top navigation bar to test any role:
1. **Student (Priya Patel)**:
   - View assigned responsibilities.
   - Click **Submit Proof** on Task `tsk_1`, attach notes and link.
   - Go to **Council Elections**, enter Secret Ballot Booth, and cast vote.
   - Try voting again to verify the duplicate vote rejection alert.
   - Go to **Grievance Redressal**, file a confidential complaint with AI Auto-Categorize.
2. **Faculty (Dr. Elena Rostova)**:
   - Go to **Responsibilities & Tasks**, review Priya's submitted task, sign and approve with a 5/5 score.
   - Review pending leave requests.
3. **Election Officer (Prof. Arthur Pendelton)**:
   - Go to **Council Elections**, review candidate nominations, toggle polling windows.
4. **HOD (Prof. Marcus Sterling)**:
   - Open **Institutional Master Dashboard**, check overdue liabilities, click **AI Executive Briefing**, export CSV report, or print dossier.

---

## 5. Firebase & Cloud Firestore Integration Guide

If persistent Cloud Firestore and Firebase Authentication are provisioned:
1. Provision Firebase Firestore & Auth via AI Studio Settings.
2. The `firebase-applet-config.json` file will contain credentials.
3. Database Collections Structure:
   - `/institutions/{id}`: Institutional parameters and departments.
   - `/users/{userId}`: User profiles, roles, and status.
   - `/tasks/{taskId}`: Student tasks with activity subcollections.
   - `/elections/{electionId}`: Council elections and candidate profiles.
   - `/voterRecords/{recordId}`: Voter participation logs (`userId`, `electionId`).
   - `/secretBallots/{ballotId}`: Decoupled encrypted secret ballot choices.
   - `/complaints/{complaintId}`: Grievance records and response threads.
   - `/requests/{requestId}`: Permission requests and approval steps.
   - `/rules/{ruleId}`: Configurable accountability SLA rules.
   - `/auditLogs/{logId}`: Immutable administrative audit trail.

---

## 6. Security Assurance & Auditing
- **Zero Client Trust**: All authorization checks, voting deduplication, and role enforcement are validated server-side.
- **Audit Logging**: Sensitive actions (ballots cast, users created, tasks verified, rules toggled) are logged with timestamp and actor attributes.
- **Privacy Protection**: Confidential grievances mask student identity, preventing peer or mentor bias.
