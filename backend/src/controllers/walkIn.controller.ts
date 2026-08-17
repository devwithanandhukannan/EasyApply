import type { Request, Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { prisma } from '../utils/prisma.ts';
import {
  computeSkillScore,
  computePriorityScore,
  ensureAgingRunning,
  stopAging,
  extractTextFromCvBuffer,
  evaluateCandidateCvAgainstRoom,
  calculateRealTimeAging
} from '../services/walkInQueue.service.ts';
import { getWalkInQueueMax } from '../services/platformSettings.service.ts';

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function generateLiveKitToken(roomName: string, identity: string, name: string): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  const token = new AccessToken(apiKey, apiSecret, { identity, name });
  token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });
  return await token.toJwt();
}

// ─── COMPANY: CREATE ROOM ─────────────────────────────────────────────────────

export const createWalkInRoom = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const {
      title,
      description,
      requiredSkills,
      minExperience,
      priorityThreshold,
      evaluationCriteria,
      maxQueue
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    const globalMax = await getWalkInQueueMax();
    const roomMaxQueue = Math.min(maxQueue ?? 50, globalMax);

    let roomCode: string;
    let attempts = 0;
    do {
      roomCode = generateRoomCode();
      attempts++;
      if (attempts > 10) return res.status(500).json({ success: false, message: 'Could not generate unique room code' });
    } while (await prisma.walkInRoom.findUnique({ where: { roomCode } }));

    const livekitRoom = `walkin-${roomCode}-${Date.now()}`;

    const room = await prisma.walkInRoom.create({
      data: {
        companyId,
        title,
        description: description ?? null,
        requiredSkills: requiredSkills ?? [],
        minExperience: minExperience ? String(minExperience).trim() : null,
        priorityThreshold: priorityThreshold ? parseInt(String(priorityThreshold), 10) : 70,
        evaluationCriteria: evaluationCriteria ? String(evaluationCriteria).trim() : null,
        roomCode,
        livekitRoom,
        maxQueue: roomMaxQueue,
        status: 'OPEN',
      }
    });

    ensureAgingRunning(room.id);
    return res.status(201).json({ success: true, room });
  } catch (err) {
    console.error('[WalkIn] createRoom', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: LIST ROOMS ──────────────────────────────────────────────────────

export const listWalkInRooms = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const rooms = await prisma.walkInRoom.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { queue: true } } }
    });
    return res.json({ success: true, rooms });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── PUBLIC: GET ROOM BY CODE ─────────────────────────────────────────────────

export const getWalkInRoomByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const userId = req.user?.userId;

    const room = await prisma.walkInRoom.findUnique({
      where: { roomCode: code.toUpperCase() },
      include: {
        company: { select: { name: true, logoUrl: true, industry: true } },
        _count: { select: { queue: true } }
      }
    });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    let myEntry: any = null;
    let hasApplied = false;
    let queuePosition = null;

    if (userId) {
      const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
      if (profile) {
        myEntry = await prisma.walkInQueueEntry.findUnique({
          where: { roomId_jobSeekerProfileId: { roomId: room.id, jobSeekerProfileId: profile.id } },
          include: {
            resume: { select: { id: true, name: true, filePath: true, atsScore: true } }
          }
        });
        if (myEntry) {
          hasApplied = true;
          const { minutesWaiting, agingBonus, priorityScore } = calculateRealTimeAging(myEntry.waitingSince, myEntry.skillScore);
          myEntry = {
            ...myEntry,
            minutesWaiting,
            agingBonus: myEntry.status === 'priority' ? myEntry.agingBonus : agingBonus,
            effectivePriority: myEntry.status === 'priority' ? myEntry.priorityScore : priorityScore,
          };

          const ahead = await prisma.walkInQueueEntry.count({
            where: { roomId: room.id, status: 'waiting', priorityScore: { gt: myEntry.priorityScore } }
          });
          queuePosition = ahead + 1;
        }
      }
    }

    return res.json({ success: true, room, myEntry, hasApplied, queuePosition });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── SEEKER: JOIN QUEUE ───────────────────────────────────────────────────────

export const joinWalkInQueue = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { code } = req.params;
    const { resumeId } = req.body;

    const room = await prisma.walkInRoom.findUnique({
      where: { roomCode: code.toUpperCase() },
      include: { _count: { select: { queue: { where: { status: 'waiting' } } } } }
    });

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.status !== 'OPEN') return res.status(400).json({ success: false, message: 'This room is not currently accepting candidates' });
    if (room._count.queue >= room.maxQueue) return res.status(400).json({ success: false, message: 'Queue is full. Please try again later.' });

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        skills: { select: { name: true } },
        experience: { select: { role: true, company: true, description: true } },
        education: { select: { degree: true, institution: true } }
      }
    });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // Check if already applied / in queue
    const existing = await prisma.walkInQueueEntry.findUnique({
      where: { roomId_jobSeekerProfileId: { roomId: room.id, jobSeekerProfileId: profile.id } }
    });
    if (existing) {
      const ahead = await prisma.walkInQueueEntry.count({
        where: { roomId: room.id, status: 'waiting', priorityScore: { gt: existing.priorityScore } }
      });
      return res.status(400).json({
        success: false,
        alreadyApplied: true,
        message: 'You have already applied to this walk-in room.',
        entry: existing,
        queuePosition: ahead + 1,
      });
    }

    let cvText = '';
    let linkedResumeId: string | null = resumeId ?? null;
    let cvFileUrl: string | null = null;

    // 1. If file uploaded directly with request
    if (req.file) {
      cvText = await extractTextFromCvBuffer(req.file.buffer, req.file.mimetype);
      // Create a Resume record for permanence
      try {
        const createdResume = await prisma.resume.create({
          data: {
            jobSeekerProfileId: profile.id,
            name: req.file.originalname || 'Walk-In CV',
            filePath: '',
            source: 'uploaded',
            atsScore: null,
            content: { rawText: cvText.slice(0, 5000), originalName: req.file.originalname }
          }
        });
        linkedResumeId = createdResume.id;
      } catch (resumeErr) {
        console.warn('[WalkIn Resume Save Warning]', resumeErr);
      }
    } else if (linkedResumeId) {
      // 2. If existing resume selected
      const existingResume = await prisma.resume.findUnique({ where: { id: linkedResumeId } });
      if (existingResume) {
        cvFileUrl = existingResume.filePath || null;
        if (typeof existingResume.content === 'object' && existingResume.content) {
          cvText = (existingResume.content as any).rawText || JSON.stringify(existingResume.content);
        }
      }
    }

    // Candidate experience text from profile
    const candidateSkills = profile.skills.map(s => s.name);
    const candidateExpText = profile.experience
      .map(e => `${e.role} at ${e.company}${e.description ? ` (${e.description})` : ''}`)
      .join('; ');

    // 3. AI Validation & Score Matrix Generation
    const cvAnalysis = await evaluateCandidateCvAgainstRoom(
      cvText,
      candidateSkills,
      candidateExpText,
      {
        title: room.title,
        description: room.description,
        requiredSkills: room.requiredSkills,
        minExperience: room.minExperience,
        evaluationCriteria: room.evaluationCriteria
      }
    );

    const overallScore = cvAnalysis.overallScore;
    const isPriority = overallScore >= (room.priorityThreshold ?? 70);
    const initialStatus = isPriority ? 'priority' : 'waiting';

    const entry = await prisma.walkInQueueEntry.create({
      data: {
        roomId: room.id,
        jobSeekerProfileId: profile.id,
        resumeId: linkedResumeId,
        cvFileUrl,
        cvAnalysis: cvAnalysis as any,
        skillScore: overallScore,
        priorityScore: overallScore,
        status: initialStatus,
        waitingSince: new Date(),
      }
    });

    // Queue position
    const ahead = await prisma.walkInQueueEntry.count({
      where: { roomId: room.id, status: 'waiting', priorityScore: { gt: overallScore } }
    });

    return res.status(201).json({
      success: true,
      entry,
      cvAnalysis,
      isPriority,
      queuePosition: ahead + 1,
      message: isPriority
        ? `⭐ Priority Shortlist! You match ${overallScore}% of room criteria.`
        : `You are #${ahead + 1} in the queue with ${overallScore}% score.`
    });
  } catch (err) {
    console.error('[WalkIn] joinQueue', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: VIEW QUEUE (KANBAN BOARD) ───────────────────────────────────────

export const getQueueByRoom = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const { code } = req.params;
    const room = await prisma.walkInRoom.findFirst({
      where: { roomCode: code.toUpperCase(), companyId },
      include: {
        _count: {
          select: { queue: true }
        }
      }
    });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const queue = await prisma.walkInQueueEntry.findMany({
      where: { roomId: room.id },
      orderBy: [
        { priorityScore: 'desc' },
        { waitingSince: 'asc' }
      ],
      include: {
        resume: {
          select: {
            id: true,
            name: true,
            filePath: true,
            atsScore: true,
            content: true,
            aiSuggestions: true,
            createdAt: true,
          }
        },
        jobSeekerProfile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePhotoUrl: true,
            location: true,
            phone: true,
            linkedin: true,
            github: true,
            bio: true,
            skills: { select: { name: true } },
            education: {
              select: { institution: true, degree: true, field: true, startYear: true, endYear: true }
            },
            experience: {
              select: { company: true, role: true, startYear: true, endYear: true, current: true }
            }
          }
        }
      }
    });

    // Calculate real-time dynamic aging for all queue entries
    const enrichedQueue = queue.map((entry) => {
      const { minutesWaiting, agingBonus, priorityScore } = calculateRealTimeAging(entry.waitingSince, entry.skillScore);
      const effectivePriority = entry.status === 'priority'
        ? entry.priorityScore
        : priorityScore;

      return {
        ...entry,
        minutesWaiting,
        agingBonus: entry.status === 'priority' ? entry.agingBonus : agingBonus,
        effectivePriority,
      };
    });

    return res.json({ success: true, room, queue: enrichedQueue });
  } catch (err) {
    console.error('[WalkIn] getQueueByRoom error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: CALL CANDIDATE (SPECIFIC OR NEXT) ───────────────────────────────

export const callNextCandidate = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const { code } = req.params;
    const { entryId } = req.body || {};

    const room = await prisma.walkInRoom.findFirst({ where: { roomCode: code.toUpperCase(), companyId } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    let targetEntry;
    if (entryId) {
      targetEntry = await prisma.walkInQueueEntry.findFirst({
        where: { id: entryId, roomId: room.id },
        include: { jobSeekerProfile: { select: { userId: true, fullName: true, email: true } } }
      });
    } else {
      // Find top waiting or priority candidate
      targetEntry = await prisma.walkInQueueEntry.findFirst({
        where: { roomId: room.id, status: { in: ['priority', 'waiting'] } },
        orderBy: [
          { status: 'asc' }, // 'priority' before 'waiting' alphabetically
          { priorityScore: 'desc' }
        ],
        include: { jobSeekerProfile: { select: { userId: true, fullName: true, email: true } } }
      });
    }

    if (!targetEntry) return res.status(404).json({ success: false, message: 'No candidates available to call' });

    const livekitToken = await generateLiveKitToken(
      room.livekitRoom,
      `seeker-${targetEntry.jobSeekerProfileId}`,
      targetEntry.jobSeekerProfile.fullName
    );

    const recruiterToken = await generateLiveKitToken(
      room.livekitRoom,
      `recruiter-${req.user?.userId || req.company?.companyId}`,
      req.company?.companyName || 'Interviewer'
    );

    const updated = await prisma.walkInQueueEntry.update({
      where: { id: targetEntry.id },
      data: { status: 'interviewing', livekitToken }
    });

    return res.json({
      success: true,
      entry: updated,
      livekitRoom: room.livekitRoom,
      livekitToken,
      recruiterToken
    });
  } catch (err) {
    console.error('[WalkIn] callNext', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: UPDATE ENTRY STATUS / EVALUATION ────────────────────────────────

export const updateQueueEntryStatus = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const { entryId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['waiting', 'priority', 'interviewing', 'accepted', 'done', 'skipped', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const entry = await prisma.walkInQueueEntry.findUnique({
      where: { id: entryId },
      include: {
        room: true,
        jobSeekerProfile: { select: { fullName: true } }
      }
    });

    if (!entry || entry.room.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    let livekitToken = entry.livekitToken;
    if (status === 'interviewing' && !livekitToken) {
      livekitToken = await generateLiveKitToken(
        entry.room.livekitRoom,
        `seeker-${entry.jobSeekerProfileId}`,
        entry.jobSeekerProfile.fullName
      );
    }

    const updated = await prisma.walkInQueueEntry.update({
      where: { id: entryId },
      data: {
        status,
        notes: notes !== undefined ? notes : entry.notes,
        livekitToken,
      }
    });

    return res.json({ success: true, entry: updated });
  } catch (err) {
    console.error('[WalkIn] updateQueueEntryStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: BATCH UPDATE ENTRY STATUS ───────────────────────────────────────

export const batchUpdateQueueEntryStatus = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const { entryIds, status, notes } = req.body;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'entryIds must be a non-empty array of IDs' });
    }

    const validStatuses = ['waiting', 'priority', 'accepted', 'done', 'skipped', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    // Verify all entries belong to rooms owned by this company
    const entries = await prisma.walkInQueueEntry.findMany({
      where: {
        id: { in: entryIds },
        room: { companyId }
      },
      select: { id: true }
    });

    const validEntryIds = entries.map(e => e.id);
    if (validEntryIds.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching queue entries found for this company' });
    }

    const result = await prisma.walkInQueueEntry.updateMany({
      where: {
        id: { in: validEntryIds }
      },
      data: {
        status,
        ...(notes !== undefined ? { notes } : {})
      }
    });

    return res.json({
      success: true,
      count: result.count,
      status,
      message: `Successfully updated ${result.count} candidates to "${status}"`
    });
  } catch (err) {
    console.error('[WalkIn] batchUpdateQueueEntryStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: UPDATE ENTRY PRIORITY SCORE ─────────────────────────────────────

export const updateQueueEntryPriority = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const { entryId } = req.params;
    const { priorityScore, status } = req.body;

    const entry = await prisma.walkInQueueEntry.findUnique({
      where: { id: entryId },
      include: { room: true }
    });

    if (!entry || entry.room.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    const updated = await prisma.walkInQueueEntry.update({
      where: { id: entryId },
      data: {
        priorityScore: priorityScore !== undefined ? Number(priorityScore) : entry.priorityScore,
        status: status || entry.status,
      }
    });

    return res.json({ success: true, entry: updated });
  } catch (err) {
    console.error('[WalkIn] updateQueueEntryPriority error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: UPDATE ROOM SETTINGS (CAPACITY / METADATA) ──────────────────────

export const updateRoomSettings = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const {
      title,
      description,
      requiredSkills,
      minExperience,
      priorityThreshold,
      evaluationCriteria,
      maxQueue,
      status
    } = req.body;

    const room = await prisma.walkInRoom.findFirst({ where: { roomCode: code.toUpperCase(), companyId } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const globalMax = await getWalkInQueueMax();
    const updateData: any = {};

    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (requiredSkills && Array.isArray(requiredSkills)) updateData.requiredSkills = requiredSkills;
    if (minExperience !== undefined) updateData.minExperience = minExperience ? String(minExperience).trim() : null;
    if (priorityThreshold !== undefined) updateData.priorityThreshold = parseInt(String(priorityThreshold), 10) || 70;
    if (evaluationCriteria !== undefined) updateData.evaluationCriteria = evaluationCriteria ? String(evaluationCriteria).trim() : null;
    if (maxQueue !== undefined) updateData.maxQueue = Math.min(Number(maxQueue), globalMax);
    if (status && ['OPEN', 'PAUSED', 'CLOSED'].includes(status)) updateData.status = status;

    const updated = await prisma.walkInRoom.update({
      where: { id: room.id },
      data: updateData
    });

    if (status === 'OPEN') ensureAgingRunning(room.id);
    else if (status === 'CLOSED') stopAging(room.id);

    return res.json({ success: true, room: updated });
  } catch (err) {
    console.error('[WalkIn] updateRoomSettings error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: UPDATE ROOM STATUS ──────────────────────────────────────────────

export const updateRoomStatus = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const { code } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'PAUSED', 'CLOSED'].includes(status))
      return res.status(400).json({ success: false, message: 'status must be OPEN, PAUSED, or CLOSED' });

    const room = await prisma.walkInRoom.findFirst({ where: { roomCode: code.toUpperCase(), companyId } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const updated = await prisma.walkInRoom.update({ where: { id: room.id }, data: { status } });

    if (status === 'OPEN') ensureAgingRunning(room.id);
    if (status === 'CLOSED') stopAging(room.id);

    return res.json({ success: true, room: updated });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── SEEKER: GET QUEUE POSITION ───────────────────────────────────────────────

export const getSeekerQueuePosition = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { code } = req.params;

    const room = await prisma.walkInRoom.findUnique({ where: { roomCode: code.toUpperCase() } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) return res.json({ success: false, inQueue: false, message: 'Profile not found' });

    const entry = await prisma.walkInQueueEntry.findUnique({
      where: { roomId_jobSeekerProfileId: { roomId: room.id, jobSeekerProfileId: profile.id } }
    });

    if (!entry) return res.json({ success: false, inQueue: false, message: 'You are not in this queue' });

    const ahead = await prisma.walkInQueueEntry.count({
      where: { roomId: room.id, status: 'waiting', priorityScore: { gt: entry.priorityScore } }
    });

    return res.json({ success: true, entry, queuePosition: ahead + 1 });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── SEEKER: LIST ACTIVE WALK-IN ROOMS ────────────────────────────────────────

export const listActiveWalkInRooms = async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const userId = req.user?.userId;

    let candidateSkills: string[] = [];
    let seekerProfileId: string | null = null;
    if (userId) {
      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId },
        include: { skills: { select: { name: true } } }
      });
      if (profile) {
        seekerProfileId = profile.id;
        candidateSkills = profile.skills.map(s => s.name);
      }
    }

    const whereClause: any = {
      status: { in: ['OPEN', 'PAUSED'] },
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
        { requiredSkills: { hasSome: [search] } },
      ];
    }

    const rooms = await prisma.walkInRoom.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' }, // OPEN before PAUSED
        { createdAt: 'desc' },
      ],
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
            industry: true,
            isVerified: true,
            verificationBadge: true,
          }
        },
        _count: {
          select: { queue: { where: { status: 'waiting' } } }
        },
        ...(seekerProfileId
          ? {
              queue: {
                where: {
                  jobSeekerProfileId: seekerProfileId,
                },
                select: {
                  id: true,
                  status: true,
                  skillScore: true,
                  priorityScore: true,
                  livekitToken: true,
                  waitingSince: true,
                  createdAt: true,
                }
              }
            }
          : {}),
      }
    });

    let availableRoomsCount = 0;
    let openRoomsCount = 0;
    let pausedRoomsCount = 0;

    const enrichedRooms = rooms.map(room => {
      let mySkillMatch: number | null = null;
      if (candidateSkills.length > 0) {
        mySkillMatch = computeSkillScore(candidateSkills, room.requiredSkills);
      }
      const myEntry = (room as any).queue && (room as any).queue.length > 0 ? (room as any).queue[0] : null;
      const hasApplied = Boolean(myEntry);
      const isFinished = Boolean(myEntry && ['rejected', 'passed', 'hired', 'skipped', 'completed'].includes(myEntry.status.toLowerCase()));
      const isActiveInQueue = Boolean(myEntry && ['waiting', 'interviewing'].includes(myEntry.status.toLowerCase()));
      const canJoin = room.status === 'OPEN' && !hasApplied;

      if (room.status === 'OPEN') {
        openRoomsCount++;
        if (!hasApplied) {
          availableRoomsCount++;
        }
      } else if (room.status === 'PAUSED') {
        pausedRoomsCount++;
      }

      return {
        ...room,
        queue: undefined,
        mySkillMatch,
        myEntry,
        hasApplied,
        isFinished,
        isActiveInQueue,
        canJoin,
      };
    });

    return res.json({ 
      success: true, 
      rooms: enrichedRooms,
      stats: {
        totalActive: rooms.length,
        openRooms: openRoomsCount,
        pausedRooms: pausedRoomsCount,
        availableToJoin: availableRoomsCount,
      }
    });
  } catch (err) {
    console.error('[WalkIn] listActiveRooms', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── SEEKER: GET MY ACTIVE QUEUES ────────────────────────────────────────────

export const getMyWalkInQueues = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) return res.json({ success: true, queues: [] });

    const entries = await prisma.walkInQueueEntry.findMany({
      where: {
        jobSeekerProfileId: profile.id,
        status: { in: ['waiting', 'interviewing'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        room: {
          include: {
            company: {
              select: {
                name: true,
                logoUrl: true,
                industry: true,
                isVerified: true,
                verificationBadge: true,
              }
            },
            _count: { select: { queue: { where: { status: 'waiting' } } } }
          }
        }
      }
    });

    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        let queuePosition = 1;
        if (entry.status === 'waiting') {
          const ahead = await prisma.walkInQueueEntry.count({
            where: {
              roomId: entry.roomId,
              status: 'waiting',
              priorityScore: { gt: entry.priorityScore }
            }
          });
          queuePosition = ahead + 1;
        }
        return {
          ...entry,
          queuePosition,
        };
      })
    );

    return res.json({ success: true, queues: enrichedEntries });
  } catch (err) {
    console.error('[WalkIn] getMyQueues', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── SEEKER: LEAVE QUEUE ──────────────────────────────────────────────────────

export const leaveWalkInQueue = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { code } = req.params;

    const room = await prisma.walkInRoom.findUnique({ where: { roomCode: code.toUpperCase() } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const existing = await prisma.walkInQueueEntry.findUnique({
      where: { roomId_jobSeekerProfileId: { roomId: room.id, jobSeekerProfileId: profile.id } }
    });

    if (!existing || !['waiting', 'interviewing'].includes(existing.status)) {
      return res.status(400).json({ success: false, message: 'You are not in this queue' });
    }

    await prisma.walkInQueueEntry.update({
      where: { id: existing.id },
      data: { status: 'skipped', notes: 'Left queue voluntarily' }
    });

    return res.json({ success: true, message: 'You have left the queue' });
  } catch (err) {
    console.error('[WalkIn] leaveQueue', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
