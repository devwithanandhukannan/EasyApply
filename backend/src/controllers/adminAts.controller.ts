import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { processApplicationMatchAsync } from '../services/applicationProcessor.service.ts';

// In-memory job tracker
const runningJobs: Map<string, { status: string; total: number; done: number; startedAt: Date }> = new Map();

export const triggerBatchRecalculation = async (req: Request, res: Response) => {
  try {
    const { jobPostingId } = req.params;

    if (runningJobs.has(jobPostingId)) {
      const job = runningJobs.get(jobPostingId)!;
      if (job.status === 'running')
        return res.json({ success: false, message: 'A recalculation is already running for this job', job });
    }

    const applications = await prisma.application.findMany({
      where: { jobPostingId, isWithdrawn: false },
      select: { id: true, resumeId: true, jobPostingId: true }
    });

    if (!applications.length)
      return res.status(404).json({ success: false, message: 'No applications found for this job posting' });

    const job = { status: 'running', total: applications.length, done: 0, startedAt: new Date() };
    runningJobs.set(jobPostingId, job);

    // Respond immediately, process in background
    res.json({ success: true, message: `Batch recalculation started for ${applications.length} applications`, job });

    // Process in batches of 5 with 3s delay to respect Groq rate limits
    const BATCH_SIZE = 5;
    const DELAY_MS = 3000;

    (async () => {
      for (let i = 0; i < applications.length; i += BATCH_SIZE) {
        const batch = applications.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(app => processApplicationMatchAsync(app.id, app.resumeId, app.jobPostingId))
        );
        runningJobs.get(jobPostingId)!.done += batch.length;
        if (i + BATCH_SIZE < applications.length) {
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      }
      runningJobs.get(jobPostingId)!.status = 'completed';
      console.log(`[ATS Batch] Recalculation completed for job ${jobPostingId}`);
    })();

  } catch (err) {
    console.error('[ATS Batch]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getBatchJobs = async (_req: Request, res: Response) => {
  const jobs = Array.from(runningJobs.entries()).map(([jobPostingId, job]) => ({
    jobPostingId, ...job
  }));
  return res.json({ success: true, jobs });
};
