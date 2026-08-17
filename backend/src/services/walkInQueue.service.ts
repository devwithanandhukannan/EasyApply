import { prisma } from '../utils/prisma.ts';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';
import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const MODEL = 'llama-3.3-70b-versatile';

// ─── 1. EXTRACT RAW TEXT FROM CV BUFFER ──────────────────────────────────────

export const extractTextFromCvBuffer = (buffer: Buffer, mimetype: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (mimetype === 'application/pdf') {
        const pdfParser = new (PDFParser as any)(null, 1);
        pdfParser.on('pdfParser_dataError', (err: any) => {
          console.warn('[PDF Parse Error]', err?.parserError);
          resolve('');
        });
        pdfParser.on('pdfParser_dataReady', () => {
          try {
            const raw = (pdfParser as any).getRawTextContent();
            // Clean up PDF escape codes and uri components if any
            const cleaned = decodeURIComponent(raw || '').replace(/\r\n/g, '\n');
            resolve(cleaned);
          } catch {
            const fallback = (pdfParser as any).getRawTextContent() || '';
            resolve(fallback);
          }
        });
        pdfParser.parseBuffer(buffer);
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        resolve(result.value || '');
      } else {
        // Fallback UTF-8 string
        resolve(buffer.toString('utf-8'));
      }
    } catch (err) {
      console.warn('[CV Text Extract Error]', err);
      resolve('');
    }
  });
};

// ─── 2. AI EVALUATION & SCORE MATRIX GENERATION ─────────────────────────────

export interface CvScoreMatrix {
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  strengths: string[];
  missingSkills: string[];
  matchedSkills: string[];
  summary: string;
  recommendation: 'STRONG_MATCH' | 'GOOD_MATCH' | 'MODERATE_MATCH' | 'POOR_MATCH';
}

export async function evaluateCandidateCvAgainstRoom(
  cvText: string,
  candidateSkills: string[],
  candidateExperienceText: string,
  room: {
    title: string;
    description?: string | null;
    requiredSkills: string[];
    minExperience?: string | null;
    evaluationCriteria?: string | null;
  }
): Promise<CvScoreMatrix> {
  const reqSkills = room.requiredSkills || [];
  const reqExp = room.minExperience || 'Not explicitly specified';
  const evalCriteria = room.evaluationCriteria || room.description || 'Evaluate overall role alignment';

  // Fast heuristic fallback first
  const normalizedReq = reqSkills.map(s => s.trim().toLowerCase()).filter(Boolean);
  const normalizedCand = [
    ...candidateSkills.map(s => s.toLowerCase()),
    ...(cvText.toLowerCase().match(/\b[a-z0-9+#.]{2,20}\b/g) || [])
  ];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const r of reqSkills) {
    const rLow = r.trim().toLowerCase();
    if (normalizedCand.some(c => c.includes(rLow) || rLow.includes(c))) {
      matchedSkills.push(r.trim());
    } else {
      missingSkills.push(r.trim());
    }
  }

  let heuristicSkillScore = reqSkills.length > 0
    ? Math.round((matchedSkills.length / reqSkills.length) * 100)
    : 60;
  let heuristicExpScore = 60;
  let heuristicOverall = Math.round((heuristicSkillScore * 0.7) + (heuristicExpScore * 0.3));

  if (!groq || (!cvText.trim() && candidateSkills.length === 0)) {
    return {
      overallScore: Math.max(10, Math.min(100, heuristicOverall)),
      skillScore: heuristicSkillScore,
      experienceScore: heuristicExpScore,
      strengths: matchedSkills.length > 0 ? [`Matches required skills: ${matchedSkills.join(', ')}`] : ['General profile submitted'],
      missingSkills: missingSkills,
      matchedSkills: matchedSkills,
      summary: `Candidate matches ${matchedSkills.length} of ${reqSkills.length} required skills.`,
      recommendation: heuristicOverall >= 75 ? 'STRONG_MATCH' : heuristicOverall >= 55 ? 'GOOD_MATCH' : heuristicOverall >= 40 ? 'MODERATE_MATCH' : 'POOR_MATCH'
    };
  }

  try {
    const trimmedCv = (cvText || '').slice(0, 4500);
    const prompt = `You are a precision technical recruiter and candidate screening engine.
Evaluate this candidate's CV against the Walk-In Room requirements and produce a structured Score Matrix (0 to 100 scale).

WALK-IN ROOM REQUIREMENTS:
- Role Title: ${room.title}
- Required Skills: ${reqSkills.join(', ') || 'General Engineering'}
- Experience Level Required: ${reqExp}
- Special Criteria / Context: ${evalCriteria}

CANDIDATE PROFILE & CV CONTENT:
- Explicit Profile Skills: ${candidateSkills.join(', ')}
- Work History Summary: ${candidateExperienceText || 'From CV'}
- CV Text Content:
${trimmedCv || 'No raw CV text provided; evaluate based on Profile skills and history.'}

CRITERIA FOR SCORING (0-100):
1. skillScore: How accurately candidate skills cover required room skills (0-100).
2. experienceScore: Seniority and project relevance against role requirement (0-100).
3. overallScore: Weighted overall fit (0-100).
4. strengths: 2-3 key bullet points on what makes them a good fit.
5. missingSkills: List of any missing mandatory skills or experience gaps.
6. matchedSkills: List of required skills successfully found in their profile/CV.
7. recommendation: One of ["STRONG_MATCH", "GOOD_MATCH", "MODERATE_MATCH", "POOR_MATCH"].
8. summary: 2-sentence concise executive summary.

Return ONLY a valid JSON object matching this structure:
{
  "overallScore": 85,
  "skillScore": 90,
  "experienceScore": 80,
  "strengths": ["Strong React and TypeScript project background", "3+ years building REST APIs"],
  "missingSkills": ["Docker containerization"],
  "matchedSkills": ["React", "TypeScript", "Node.js"],
  "recommendation": "STRONG_MATCH",
  "summary": "Candidate shows strong expertise in required web technologies with relevant production experience."
}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        overallScore: Math.min(100, Math.max(0, Math.round(parsed.overallScore ?? heuristicOverall))),
        skillScore: Math.min(100, Math.max(0, Math.round(parsed.skillScore ?? heuristicSkillScore))),
        experienceScore: Math.min(100, Math.max(0, Math.round(parsed.experienceScore ?? heuristicExpScore))),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [`Strong background in ${matchedSkills.join(', ')}`],
        missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : missingSkills,
        matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : matchedSkills,
        summary: parsed.summary || `Evaluated against ${room.title} criteria.`,
        recommendation: parsed.recommendation || (parsed.overallScore >= 75 ? 'STRONG_MATCH' : 'GOOD_MATCH')
      };
    }
  } catch (aiErr) {
    console.error('[AI Walk-In Evaluation Error]', aiErr);
  }

  // Fallback if AI fails
  return {
    overallScore: heuristicOverall,
    skillScore: heuristicSkillScore,
    experienceScore: heuristicExpScore,
    strengths: matchedSkills.length > 0 ? [`Demonstrates knowledge of ${matchedSkills.join(', ')}`] : ['Submitted profile'],
    missingSkills: missingSkills,
    matchedSkills: matchedSkills,
    summary: `Candidate matches ${matchedSkills.length} of ${reqSkills.length} required skills.`,
    recommendation: heuristicOverall >= 75 ? 'STRONG_MATCH' : heuristicOverall >= 55 ? 'GOOD_MATCH' : heuristicOverall >= 40 ? 'MODERATE_MATCH' : 'POOR_MATCH'
  };
}

// ─── 3. DYNAMIC QUEUE AGING & ANTI-STARVATION CALCULATION ─────────────────────

/**
 * Dynamic aging rate: +0.75 points per minute waiting.
 * Max aging bonus: 50 points.
 * Ensures a candidate with 34.5% score who waits 40m gets +30pts -> 64.5 priority.
 */
export const AGING_RATE_PER_MINUTE = 0.75;
export const MAX_AGING_BONUS = 50.0;

export function calculateRealTimeAging(waitingSince: Date | string, baseScore: number) {
  const waitingDate = new Date(waitingSince);
  const now = new Date();
  const minutesWaiting = Math.max(0, (now.getTime() - waitingDate.getTime()) / 60000);
  const agingBonus = Math.min(minutesWaiting * AGING_RATE_PER_MINUTE, MAX_AGING_BONUS);
  const priorityScore = Math.round((baseScore + agingBonus) * 10) / 10;

  return {
    minutesWaiting: Math.round(minutesWaiting),
    agingBonus: Math.round(agingBonus * 10) / 10,
    priorityScore
  };
}

export function computeSkillScore(candidateSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills.length) return 50;
  const normalizedReq = requiredSkills.map(s => s.trim().toLowerCase());
  const normalizedCand = candidateSkills.map(s => s.trim().toLowerCase());
  let matches = 0;
  for (const req of normalizedReq) {
    if (normalizedCand.some(c => c.includes(req) || req.includes(c))) matches++;
  }
  return Math.round((matches / normalizedReq.length) * 100);
}

export function computePriorityScore(skillScore: number, agingBonus: number): number {
  return Math.round((skillScore + Math.min(agingBonus, MAX_AGING_BONUS)) * 10) / 10;
}

/**
 * Apply aging to all "waiting" entries in a room.
 * Called periodically (every 60s) to prevent starvation.
 */
export async function applyAgingToQueue(roomId: string): Promise<void> {
  const waitingEntries = await prisma.walkInQueueEntry.findMany({
    where: { roomId, status: 'waiting' },
    select: { id: true, waitingSince: true, skillScore: true }
  });

  const updates = waitingEntries.map(entry => {
    const { agingBonus, priorityScore } = calculateRealTimeAging(entry.waitingSince, entry.skillScore);
    return prisma.walkInQueueEntry.update({
      where: { id: entry.id },
      data: { agingBonus, priorityScore }
    });
  });

  await Promise.allSettled(updates);
}

/**
 * Start the aging interval for a room (called when room is created/opened).
 */
export function startAgingInterval(roomId: string): ReturnType<typeof setInterval> {
  return setInterval(() => applyAgingToQueue(roomId), 45_000);
}

const agingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

export function ensureAgingRunning(roomId: string): void {
  if (!agingIntervals.has(roomId)) {
    const interval = startAgingInterval(roomId);
    agingIntervals.set(roomId, interval);
  }
}

export function stopAging(roomId: string): void {
  const interval = agingIntervals.get(roomId);
  if (interval) {
    clearInterval(interval);
    agingIntervals.delete(roomId);
  }
}

