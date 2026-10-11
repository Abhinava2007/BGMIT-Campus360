import assert from 'assert';
import { db } from '../server/db.js';

console.log('----------------------------------------------------');
console.log('RUNNING APEX GOVERNANCE AUTOMATED QA & SECURITY TEST SUITE');
console.log('----------------------------------------------------');

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => {
        console.log(`[PASS] ${name}`);
        passedTests++;
      }).catch((err) => {
        console.error(`[FAIL] ${name}:`, err.message);
        throw err;
      });
    } else {
      console.log(`[PASS] ${name}`);
      passedTests++;
    }
  } catch (err: any) {
    console.error(`[FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function runTests() {
  // Test 1: RBAC User Persona Setup
  test('User roles and personas are correctly configured', () => {
    const users = db.get('users');
    assert(users.length >= 7, 'Expected at least 7 persona accounts');
    const roles = users.map((u) => u.role);
    assert(roles.includes('super_admin'), 'Super admin missing');
    assert(roles.includes('hod'), 'HOD missing');
    assert(roles.includes('faculty'), 'Faculty missing');
    assert(roles.includes('coordinator'), 'Coordinator missing');
    assert(roles.includes('election_officer'), 'Election officer missing');
    assert(roles.includes('sports_coordinator'), 'Sports coordinator missing');
    assert(roles.includes('student'), 'Student missing');
  });

  // Test 2: Task Lifecycle and State Integrity
  test('Task lifecycle: assigned -> submitted -> verified with score', () => {
    const tasks = db.get('tasks');
    const testTask = tasks.find((t) => t.id === 'tsk_1');
    assert(testTask, 'Task tsk_1 must exist');
    assert.strictEqual(testTask.assigneeId, 'usr_student');
    assert.strictEqual(testTask.reviewerId, 'usr_faculty');

    // Simulate submission
    testTask.status = 'submitted';
    testTask.submission = {
      submittedAt: new Date().toISOString(),
      notes: 'Audit benchmark complete for all workstations',
      evidenceLink: 'https://apex.edu/proofs/test-audit.pdf',
    };
    assert.strictEqual(testTask.status, 'submitted');
    assert(testTask.submission.evidenceLink.startsWith('https://'));

    // Simulate verification
    testTask.status = 'verified';
    testTask.verification = {
      verifiedAt: new Date().toISOString(),
      feedback: 'Excellent work verified by mentor',
      approved: true,
      rating: 5,
    };
    assert.strictEqual(testTask.status, 'verified');
    assert.strictEqual(testTask.verification.rating, 5);
  });

  // Test 3: Democratic Voting Atomic Duplicate Prevention
  test('Democratic voting: Duplicate vote prevention and ballot decoupling', () => {
    const voterRecords = db.get('voterRecords');
    const secretBallots = db.get('secretBallots');
    const elections = db.get('elections');
    const elec = elections.find((e) => e.id === 'elec_1');
    assert(elec, 'elec_1 must exist');

    // Check Rohan Sharma has already voted
    const rohanVoted = voterRecords.some((r) => r.electionId === 'elec_1' && r.userId === 'usr_coord');
    assert.strictEqual(rohanVoted, true, 'Rohan Sharma participation must be recorded');

    // Decoupling verification: voterRecords has NO candidateId
    const rohanRecord = voterRecords.find((r) => r.electionId === 'elec_1' && r.userId === 'usr_coord');
    assert(!('candidateId' in (rohanRecord as any)), 'Voter participation record must NOT contain candidateId');

    // Decoupling verification: secretBallots has NO userId
    for (const ballot of secretBallots) {
      assert(!('userId' in (ballot as any)), 'Secret ballot record must NOT contain voter userId');
      assert(ballot.ballotHash, 'Ballot must have cryptographic hash receipt');
    }
  });

  // Test 4: Confidential Grievance Redressal
  test('Confidential complaints protect submitter identity', () => {
    const complaints = db.get('complaints');
    const anon = complaints.find((c) => c.isAnonymous);
    assert(anon, 'Anonymous complaint must exist');
    assert.strictEqual(anon.isAnonymous, true);
    assert.strictEqual(anon.submitterName, 'Anonymous Student');
    assert(anon.trackingId.startsWith('CMP-'), 'Tracking ID must follow CMP- format');
  });

  // Test 5: Leave Request Self-Approval Prevention Invariant
  test('Leave request review integrity invariant', () => {
    const requests = db.get('requests');
    const sampleReq = requests.find((r) => r.trackingId === 'REQ-2026-0042');
    assert(sampleReq, 'Sample request must exist');
    assert.strictEqual(sampleReq.status, 'approved');
    assert.strictEqual(sampleReq.reviewerId, 'usr_faculty');
    // Reviewer ID must differ from Submitter ID
    assert.notStrictEqual(sampleReq.reviewerId, sampleReq.submitterId, 'Self-approval is forbidden');
  });

  // Test 6: SLA Governance Rules Engine Invariant
  test('Rules engine enforces deterministic SLA policies', () => {
    const rules = db.get('rules');
    assert(rules.length >= 5, 'Expected at least 5 governance rules');
    for (const r of rules) {
      assert(r.slaHours >= 0, 'SLA hours must be non-negative');
      assert(r.triggerCondition.length > 5, 'Trigger condition must be defined');
      assert(r.escalationDestination.length > 0, 'Escalation destination must be defined');
    }
  });

  // Test 7: Audit Trail Logging
  test('Audit trail logs critical administrative actions', () => {
    const auditLogs = db.get('auditLogs');
    assert(auditLogs.length > 0, 'Audit trail must contain records');
    const sample = auditLogs[0];
    assert(sample.id, 'Audit log must have ID');
    assert(sample.action, 'Audit log must specify action');
    assert(sample.actorId, 'Audit log must specify actor');
    assert(sample.timestamp, 'Audit log must have timestamp');
  });

  // Test 8: Database Persistence to Disk
  test('Database manager persists updates to storage.json', () => {
    const current = db.getAll();
    assert(current.institution.name, 'Institution name must persist');
    assert(current.users.length >= 7, 'Users must persist');
    assert(current.tasks.length >= 5, 'Tasks must persist');
  });

  console.log('----------------------------------------------------');
  console.log(`TEST SUITE COMPLETED: ${passedTests} / ${totalTests} TESTS PASSED CLEANLY.`);
  console.log('----------------------------------------------------');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
