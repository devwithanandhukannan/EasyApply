import { prisma } from '../utils/prisma.ts';

/**
 * Compute a skill match score (0-100) between a candidate's skills and required skills.
 * Uses case-insensitive partial matching.
 */
export function computeSkillScore(candidateSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills.length) return 50; // no requirements = neutral score
  const normalizedReq = requiredSkills.map(s => s.trim().toLowerCase());
  const normalizedCand = candidateSkills.map(s => s.trim().toLowerCase());
  let matches = 0;
  for (const req of normalizedReq) {
    if (normalizedCand.some(c => c.includes(req) || req.includes(c))) matches++;
  }
  return Math.round((matches / normalizedReq.length) * 100);
}

/**
 * Compute priority score: skillScore + agingBonus (capped at 30).
 */
export function computePriorityScore(skillScore: number, agingBonus: number): number {
  return skillScore + Math.min(agingBonus, 30);
}

/**
 * Apply aging to all "waiting" entries in a room.
 * Called periodically (every 60s) to prevent starvation.
 * +0.5 points per minute waiting.
 */
export async function applyAgingToQueue(roomId: string): Promise<void> {
  const waitingEntries = await prisma.walkInQueueEntry.findMany({
    where: { roomId, status: 'waiting' },
    select: { id: true, waitingSince: true, skillScore: true, agingBonus: true }
  });

  const now = new Date();
  const updates = waitingEntries.map(entry => {
    const minutesWaiting = (now.getTime() - new Date(entry.waitingSince).getTime()) / 60000;
    const newAgingBonus = minutesWaiting * 0.5;
    const newPriorityScore = computePriorityScore(entry.skillScore, newAgingBonus);
    return prisma.walkInQueueEntry.update({
      where: { id: entry.id },
      data: { agingBonus: newAgingBonus, priorityScore: newPriorityScore }
    });
  });

  await Promise.allSettled(updates);
}

/**
 * Start the aging interval for a room (called when room is created/opened).
 * Returns an interval handle.
 */
export function startAgingInterval(roomId: string): ReturnType<typeof setInterval> {
  return setInterval(() => applyAgingToQueue(roomId), 60_000);
}

// Global map of room aging intervals
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
