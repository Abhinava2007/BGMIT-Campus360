import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getSystemKnowledge(): string {
  const kb = db.get('knowledgeBase');
  const rules = db.get('rules');
  const institution = db.get('institution');

  let text = `Institution: ${institution.name} (Academic Year: ${institution.academicYear})\n`;
  text += `Departments: ${institution.departments.join(', ')}\n\n`;
  text += `Official Policies & By-Laws:\n`;
  for (const doc of kb) {
    text += `[${doc.category}] ${doc.title}: ${doc.content}\n`;
  }
  text += `\nAccountability & Governance SLA Rules:\n`;
  for (const rule of rules) {
    text += `- ${rule.title} (${rule.module}): Trigger: ${rule.triggerCondition} | SLA: ${rule.slaHours}h | Escalation: ${rule.escalationDestination}\n`;
  }
  return text;
}

export async function askGovernanceAssistant(query: string, userRole: string): Promise<string> {
  const context = getSystemKnowledge();

  if (!ai) {
    // Intelligent rule-based fallback when GEMINI_API_KEY is not configured
    const lower = query.toLowerCase();
    if (lower.includes('leave') || lower.includes('attendance') || lower.includes('on-duty')) {
      return `According to the Apex Institute Academic Regulations, leave requests must be submitted at least 24 hours in advance via the Requests portal. In medical cases, a doctor certificate must be uploaded within 48 hours. On-duty attendance for hackathons or sports requires endorsement from your HOD.`;
    }
    if (lower.includes('vote') || lower.includes('election') || lower.includes('nomination')) {
      return `Under the Student Council Election Regulations, elections are conducted strictly by secret ballot with one vote per student. Eligible voters must have active status. Candidates must maintain a minimum 3.0 GPA and clear disciplinary standing.`;
    }
    if (lower.includes('complaint') || lower.includes('grievance')) {
      return `Grievances can be lodged under Infrastructure, Academic, Sports, Labs, or Administrative categories. High/Critical grievances have a mandatory 6-hour acknowledgment SLA. You may also opt for Anonymous submission to protect your privacy.`;
    }
    if (lower.includes('task') || lower.includes('responsibility') || lower.includes('deadline')) {
      return `Every assigned responsibility has an owner, deadline, and verification criteria. If a deadline passes without submission, an automated SLA reminder is sent and escalated to the Faculty Mentor and HOD within 12 hours.`;
    }
    return `Based on Apex Institute of Technology Governance Charter, every responsibility has an assigned owner and verified workflow. For specific questions, consult your Department Faculty Mentor or browse the Knowledge Base. (Note: Gemini API key not provided in environment; serving institutional offline guide).`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are the official College Governance AI Assistant for Apex Institute of Technology & Governance.
Role of requesting user: ${userRole}.
Grounding institutional policy:
${context}

User question: "${query}"

Guidelines:
1. Ground answers strictly in the institution's policies, SLAs, and governance rules.
2. If the user asks about deadlines, complaints, elections, or tasks, cite the official rules.
3. If an answer cannot be verified from the provided documents, state clearly that official departmental guidance should be sought.
4. Keep answers professional, concise, respectful, and actionable.`,
    });

    return response.text || 'Unable to generate response from the model.';
  } catch (err: any) {
    console.error('Gemini ask error:', err);
    // Graceful fallback to offline institutional grounding
    const lower = query.toLowerCase();
    if (lower.includes('leave') || lower.includes('attendance') || lower.includes('on-duty')) {
      return `According to the Apex Institute Academic Regulations, leave requests must be submitted at least 24 hours in advance via the Requests portal. In medical cases, a physician certificate must be uploaded within 48 hours. On-duty attendance for hackathons or sports requires endorsement from your HOD.`;
    }
    if (lower.includes('vote') || lower.includes('election') || lower.includes('nomination')) {
      return `Under the Student Council Election Regulations, elections are conducted strictly by secret ballot with one vote per student. Eligible voters must have active status. Candidates must maintain a minimum 3.0 GPA and clear disciplinary standing.`;
    }
    if (lower.includes('complaint') || lower.includes('grievance')) {
      return `Grievances can be lodged under Infrastructure, Academic, Sports, Labs, or Administrative categories. High/Critical grievances have a mandatory 6-hour acknowledgment SLA. You may also opt for Anonymous submission to protect your privacy.`;
    }
    if (lower.includes('task') || lower.includes('responsibility') || lower.includes('deadline')) {
      return `Every assigned responsibility has an owner, deadline, and verification criteria. If a deadline passes without submission, an automated SLA reminder is sent and escalated to the Faculty Mentor and HOD within 12 hours.`;
    }
    return `Based on Apex Institute Governance Charter: Every responsibility has an assigned owner, clear deadline, and verifiable outcome. For specific inquiries, submit a ticket in the Complaints portal or consult your Department Faculty Mentor.`;
  }
}

export async function categorizeComplaint(title: string, description: string): Promise<{ category: string; priority: string; reason: string }> {
  if (!ai) {
    const text = `${title} ${description}`.toLowerCase();
    let category = 'other';
    let priority = 'medium';

    if (text.includes('lab') || text.includes('gpu') || text.includes('workstation') || text.includes('server')) {
      category = 'laboratory';
      priority = 'high';
    } else if (text.includes('exam') || text.includes('syllabus') || text.includes('lecture') || text.includes('grade')) {
      category = 'academic';
      priority = 'medium';
    } else if (text.includes('water') || text.includes('ac') || text.includes('fan') || text.includes('bench') || text.includes('restroom')) {
      category = 'infrastructure';
      priority = 'high';
    } else if (text.includes('court') || text.includes('ball') || text.includes('sports') || text.includes('ground')) {
      category = 'sports';
      priority = 'medium';
    }
    return { category, priority, reason: 'Categorized via institutional keyword classification engine.' };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Analyze the student grievance below and categorize it:
Title: "${title}"
Description: "${description}"

Valid categories: "infrastructure", "academic", "sports", "laboratory", "administrative", "other"
Valid priorities: "low", "medium", "high", "critical"

Respond strictly in JSON format with keys:
{
  "category": "infrastructure" | "academic" | "sports" | "laboratory" | "administrative" | "other",
  "priority": "low" | "medium" | "high" | "critical",
  "reason": "short explanation"
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return {
      category: parsed.category || 'other',
      priority: parsed.priority || 'medium',
      reason: parsed.reason || 'AI categorized',
    };
  } catch (err) {
    return { category: 'other', priority: 'medium', reason: 'Automatic fallback category.' };
  }
}

export async function checkDuplicateComplaint(
  newTitle: string,
  newDesc: string,
  existingList: { trackingId: string; title: string; description: string; status: string }[]
): Promise<{ isDuplicate: boolean; similarTrackingId?: string; similarityScore: number; reason?: string }> {
  if (!existingList.length) {
    return { isDuplicate: false, similarityScore: 0 };
  }

  if (!ai) {
    const words = newTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    for (const item of existingList) {
      const itemTitle = item.title.toLowerCase();
      const matchCount = words.filter((w) => itemTitle.includes(w)).length;
      if (matchCount >= 2) {
        return {
          isDuplicate: true,
          similarTrackingId: item.trackingId,
          similarityScore: 0.85,
          reason: `Potential match found with open grievance ${item.trackingId}: "${item.title}".`,
        };
      }
    }
    return { isDuplicate: false, similarityScore: 0 };
  }

  try {
    const prompt = `Assess if this new student complaint is a duplicate of any existing complaint:
New Complaint:
Title: "${newTitle}"
Description: "${newDesc}"

Existing Complaints:
${JSON.stringify(existingList.slice(0, 10))}

Return JSON:
{
  "isDuplicate": boolean,
  "similarTrackingId": string or null,
  "similarityScore": number between 0 and 1,
  "reason": "brief explanation"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return {
      isDuplicate: !!parsed.isDuplicate,
      similarTrackingId: parsed.similarTrackingId || undefined,
      similarityScore: parsed.similarityScore || 0,
      reason: parsed.reason,
    };
  } catch (err) {
    return { isDuplicate: false, similarityScore: 0 };
  }
}

export async function summarizeTasksProgress(): Promise<string> {
  const tasks = db.get('tasks');
  const verified = tasks.filter((t) => t.status === 'verified').length;
  const submitted = tasks.filter((t) => t.status === 'submitted').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const overdue = tasks.filter((t) => t.escalated || (new Date(t.dueDate) < new Date() && t.status !== 'verified')).length;

  if (!ai) {
    return `Executive Task Accountability Summary: Total responsibilities: ${tasks.length}. Verified: ${verified}, Awaiting faculty verification: ${submitted}, In progress: ${inProgress}, Overdue/Escalated: ${overdue}. Recommended focus: prioritize reviewing pending submissions and follow-up on overdue lab/symposium deliverables.`;
  }

  try {
    const summaryData = tasks.map((t) => ({
      title: t.title,
      assignee: t.assigneeName,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      escalated: t.escalated,
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide a concise, high-level executive briefing for the HOD and College Dean based on student responsibilities:
${JSON.stringify(summaryData)}

Requirements:
- Highlight progress rate, overdue liabilities, and immediate faculty review actions.
- Keep tone official, objective, and executive.
- Limit to 3 concise paragraphs with bullet points where appropriate.`,
    });

    return response.text || 'Unable to generate summary.';
  } catch (err: any) {
    return `Executive task summary: Total: ${tasks.length}, Verified: ${verified}, Pending: ${submitted}, Overdue: ${overdue}.`;
  }
}

export async function draftOfficialNotice(topic: string, audience: string, keyPoints: string): Promise<{ title: string; content: string }> {
  if (!ai) {
    return {
      title: `Official Notification: ${topic}`,
      content: `This is an official communication addressed to ${audience}.\n\nKey Information:\n${keyPoints}\n\nAll concerned students and staff are requested to adhere to the aforementioned guidelines. For inquiries, contact the Department Office.`,
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Draft an official college circular/notice based on:
Topic: "${topic}"
Target Audience: "${audience}"
Key Points: "${keyPoints}"
Institution: "Apex Institute of Technology & Governance"

Return strictly in JSON format:
{
  "title": "Clear, professional circular title",
  "content": "Official announcement text with proper institutional greeting, structured bullet points, instructions, and signing authority sign-off."
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return {
      title: parsed.title || `Official Notice: ${topic}`,
      content: parsed.content || keyPoints,
    };
  } catch (err) {
    return {
      title: `Notice: ${topic}`,
      content: `Notice for ${audience}: ${keyPoints}`,
    };
  }
}
