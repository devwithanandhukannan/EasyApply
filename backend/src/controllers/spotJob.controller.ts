import type { Request, Response } from "express";
import { SpotJobStatus, SpotBookingStatus, AvailabilityStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.ts";
import { NotificationService } from '../services/notification.service.ts';

interface MapLogLine {
  "Candidate Name": string;
  "Current Status": string;
  "Status Check": string;
  "Candidate Skills": string;
  "Strategy Match": string;
  "Passed Matrix": string;
}

export const SpotJobController = {

  /**
   * 1. POST /spot-jobs
   */
  createSpotJob: async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = req.company?.companyId;
      if (!companyId) {
        res.status(403).json({ success: false, message: 'Access denied. Active company workspace context required.' });
        return;
      }

      const { title, description, requiredSkills, rate, rateType, currency, startTime, endTime, location, coordinates } = req.body;

      if (!title || !rate || !rateType || !startTime || !endTime || !location) {
        res.status(400).json({ success: false, message: 'Missing required configuration indices.' });
        return;
      }

      // Create the Spot Job record
      const spotJob = await prisma.spotJob.create({
        data: {
          companyId,
          title,
          description,
          requiredSkills: requiredSkills || [],
          rate,
          rateType,
          currency: currency || 'INR',
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          location,
          coordinates: coordinates || null,
          status: SpotJobStatus.POSTED
        }
      });

      // Normalize and prepare required target skills for matching
      const normalizedRequiredSkills = (requiredSkills || [])
        .filter((skill: string) => skill && skill.trim() !== '')
        .map((skill: string) => skill.trim().toLowerCase());

      console.log("\n==========================================================================================");
      console.log(`🚀 [SPOT GIG MATCHING ENGINE ACTIVATED]`);
      console.log(`📋 Job Title: "${title}"`);
      console.log(`🎯 Target Skills Needed: [ ${normalizedRequiredSkills.join(" | ").toUpperCase()} ]`);
      console.log("==========================================================================================\n");

      // Pull every registered profile entry to calculate tracking matrix table variables
      const totalCandidatesInDB = await prisma.jobSeekerProfile.findMany({
        select: {
          id: true,
          userId: true,
          fullName: true,
          availabilityStatus: true,
          skills: {
            select: { name: true }
          }
        }
      });

      console.log(`🔍 [Stage 1 Database Scan] Total profiles registered inside database: ${totalCandidatesInDB.length}`);

      const engineMetricsLogTable: MapLogLine[] = [];
      let eligibleCandidates: any[] = [];

      // Evaluate every candidate sequentially through the criteria array matrix
      totalCandidatesInDB.forEach(candidate => {
        const candidateName = candidate.fullName || "Unnamed Candidate";
        const rawStatus = candidate.availabilityStatus;
        
        // Step A: Evaluate Open Availability Gate
        const isOpen = rawStatus === AvailabilityStatus.spot_available;
        const statusCheckText = isOpen ? "🟢 OPEN (spot_available)" : `❌ MUTED (${rawStatus})`;

        // Extract skills
        const candidateSkillsArray = (candidate.skills || []).map(s => s.name.trim().toLowerCase());
        const displaySkills = (candidate.skills || []).map(s => s.name.trim()).join(", ") || "None";

        let strategyMatchText = "❌ No Match";
        let isPass = false;

        if (isOpen) {
          if (normalizedRequiredSkills.length === 0) {
            strategyMatchText = "⭐ Match (No Skill Filter Req)";
            isPass = true;
          } else {
            // Check Exact Match Intersections
            const exactMatches = normalizedRequiredSkills.filter(reqSkill => 
              candidateSkillsArray.includes(reqSkill)
            );

            if (exactMatches.length > 0) {
              strategyMatchText = `🎯 Exact Match (${exactMatches.length} skill(s))`;
              isPass = true;
            } else {
              // Check Partial / Fuzzy Fallback Match Intersections
              const hasPartial = normalizedRequiredSkills.some(reqSkill => 
                candidateSkillsArray.some(candSkill => 
                  candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
                )
              );
              if (hasPartial) {
                strategyMatchText = "⚠️ Partial / Fuzzy Match";
                isPass = true;
              }
            }
          }
        }

        // Push data row into the visual table array
        engineMetricsLogTable.push({
          "Candidate Name": candidateName.substring(0, 20),
          "Current Status": rawStatus,
          "Status Check": statusCheckText,
          "Candidate Skills": displaySkills.substring(0, 30),
          "Strategy Match": strategyMatchText,
          "Passed Matrix": isPass ? "✅ MATCHED" : "❌ DROPPED"
        });

        if (isPass) {
          // Add candidate object data payload to processing array
          eligibleCandidates.push({
            id: candidate.id,
            userId: candidate.userId,
            fullName: candidateName,
            skills: candidate.skills
          });
        }
      });

      // 📊 Print out the structured logging summary results directly to console
      console.table(engineMetricsLogTable);

      // Rank candidate entries if multi-skill weights are active
      if (normalizedRequiredSkills.length > 0 && eligibleCandidates.length > 0) {
        eligibleCandidates = eligibleCandidates.map(c => {
          const cSkills = c.skills.map((s: any) => s.name.toLowerCase());
          const score = normalizedRequiredSkills.filter(s => cSkills.includes(s)).length;
          return { ...c, matchScore: score };
        }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }

      console.log(`\n🏁 [Engine Assessment Terminated] Final Candidate Pool Selected: ${eligibleCandidates.length} profiles.\n`);

      let createdBookings: any[] = [];
      
      if (eligibleCandidates.length > 0) {
        await prisma.spotJob.update({
          where: { id: spotJob.id },
          data: { status: SpotJobStatus.SEARCHING }
        });

        const bookingData = eligibleCandidates.map(candidate => ({
          spotJobId: spotJob.id,
          jobSeekerProfileId: candidate.id,
          status: SpotBookingStatus.PENDING_RESPONSE
        }));

        await prisma.spotJobBooking.createMany({
          data: bookingData,
          skipDuplicates: true
        });

        createdBookings = await prisma.spotJobBooking.findMany({
          where: { spotJobId: spotJob.id }
        });

        console.log(`[Database Sync] Created ${createdBookings.length} booking invitations inside storage vectors.`);

        // Dispatch notifications in background channels safely
        const notificationPromises = eligibleCandidates.map(candidate => 
          NotificationService.sendToUser(
            candidate.userId,
            `🔥 Immediate Spot Gig Match!`,
            `Hi ${candidate.fullName}, a spot job matching your profile has just opened up: "${title}". Rate: ${rate} ${currency}/${rateType}`,
            `http://localhost:3000/dashboard/spot-jobs`
          ).catch((err) => {
            console.error(`[FCM Error] Failed to notify user ${candidate.userId}:`, err.message);
            return null;
          })
        );

        Promise.allSettled(notificationPromises).then(results => {
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          console.log(`[Notifications Channel] Successfully distributed ${successCount}/${eligibleCandidates.length} instant pings.`);
        });

      } else {
        console.log('⚠️ [Warning] No qualifying candidate flags matched this lifecycle layout routing.');
      }

      res.status(201).json({
        success: true,
        message: eligibleCandidates.length > 0 
          ? 'Spot job created and broadcast matching process initialized.'
          : 'Spot job created. No matching candidates found at this time.',
        data: { 
          spotJob, 
          matchesFound: eligibleCandidates.length, 
          bookings: createdBookings,
          searchCriteria: {
            requiredSkills: normalizedRequiredSkills,
            matchingStrategy: normalizedRequiredSkills.length > 0 
              ? (eligibleCandidates.length > 0 ? 'skill-based-ranked' : 'partial-match')
              : 'all-available'
          }
        }
      });

    } catch (error: any) {
      console.error("❌ Error creating Spot Job:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 2. GET /spot-jobs/invitations
   */
  getJobSeekerInvitations: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized. Identity mismatch.' });
        return;
      }

      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          availabilityStatus: true
        }
      });

      if (!profile) {
        res.status(404).json({ success: false, message: 'Job seeker profile record not registered.' });
        return;
      }

      const invitations = await prisma.spotJobBooking.findMany({
        where: {
          jobSeekerProfileId: profile.id,
          status: SpotBookingStatus.PENDING_RESPONSE,
          spotJob: {
            status: { in: [SpotJobStatus.POSTED, SpotJobStatus.SEARCHING] }
          }
        },
        include: {
          spotJob: {
            include: { 
              company: { 
                select: { id: true, name: true, logoUrl: true, industry: true } 
              } 
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const isSpotJobEnabled = profile.availabilityStatus === AvailabilityStatus.spot_available;

      res.status(200).json({ 
        success: true, 
        isSpotJobEnabled, 
        data: invitations 
      });
    } catch (error: any) {
      console.error("Error fetching job seeker invitations:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 3. PATCH /spot-jobs/respond/:bookingId
   */
  respondToBooking: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized.' });
        return;
      }

      const { bookingId } = req.params;
      const { action } = req.body;

      if (!['ACCEPT', 'DECLINE'].includes(action)) {
        res.status(400).json({ success: false, message: 'Invalid parameter payload action context.' });
        return;
      }

      const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
      if (!profile) {
        res.status(404).json({ success: false, message: 'Profile workspace link not found.' });
        return;
      }

      const booking = await prisma.spotJobBooking.findUnique({
        where: { id: bookingId },
        include: { spotJob: true }
      });

      if (!booking || booking.jobSeekerProfileId !== profile.id) {
        res.status(404).json({ success: false, message: 'Booking invitation node not discovered.' });
        return;
      }

      if (booking.status !== SpotBookingStatus.PENDING_RESPONSE || booking.spotJob.status === SpotJobStatus.CONFIRMED) {
        res.status(400).json({ success: false, message: 'This gig position has closed, expired, or been filled.' });
        return;
      }

      if (action === 'DECLINE') {
        const updatedBooking = await prisma.spotJobBooking.update({
          where: { id: bookingId },
          data: { status: SpotBookingStatus.DECLINED, respondedAt: new Date() }
        });
        res.status(200).json({ success: true, message: 'Spot request successfully declined.', data: updatedBooking });
        return;
      }

      const transactionResult = await prisma.$transaction(async (tx) => {
        const gigVerification = await tx.spotJob.findUnique({ where: { id: booking.spotJobId } });
        if (gigVerification?.status === SpotJobStatus.CONFIRMED) {
          throw new Error("Gig capacity already populated by a concurrent candidate match request.");
        }

        const acceptedBooking = await tx.spotJobBooking.update({
          where: { id: bookingId },
          data: { status: SpotBookingStatus.ACCEPTED, respondedAt: new Date() }
        });

        await tx.spotJob.update({
          where: { id: booking.spotJobId },
          data: { status: SpotJobStatus.CONFIRMED }
        });

        await tx.spotJobBooking.updateMany({
          where: {
            spotJobId: booking.spotJobId,
            id: { not: bookingId },
            status: SpotBookingStatus.PENDING_RESPONSE
          },
          data: { status: SpotBookingStatus.TIMED_OUT }
        });

        return acceptedBooking;
      });

      res.status(200).json({
        success: true,
        message: 'Spot booking assignment locked and synced smoothly.',
        data: transactionResult
      });

    } catch (error: any) {
      console.error("Error modifying booking node resolution status:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 4. GET /spot-jobs/company-dashboard
   */
  getCompanySpotDashboard: async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = req.company?.companyId;
      if (!companyId) {
        res.status(403).json({ success: false, message: 'Access denied. Active workspace context missing.' });
        return;
      }

      const dashboardMetrics = await prisma.spotJob.findMany({
        where: { companyId },
        include: {
          bookings: {
            include: {
              jobSeekerProfile: {
                select: { fullName: true, phone: true, email: true, location: true, profilePhotoUrl: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: dashboardMetrics });
    } catch (error: any) {
      console.error("Error accessing company analytical workspace dashboard:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 5. GET /spot-jobs/:id/bookings
   */
  getSpotJobBookings: async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = req.company?.companyId;
      const { id } = req.params;

      if (!companyId) {
        res.status(403).json({ success: false, message: 'Access denied. Workspace token required.' });
        return;
      }

      const spotJob = await prisma.spotJob.findUnique({
        where: { id }
      });

      if (!spotJob) {
        res.status(404).json({ success: false, message: 'Spot Job record vector not found.' });
        return;
      }

      if (spotJob.companyId !== companyId) {
        res.status(403).json({ success: false, message: 'Security Exception: Access denied to foreign workspace resources.' });
        return;
      }

      const trackingBookings = await prisma.spotJobBooking.findMany({
        where: { spotJobId: id },
        include: {
          jobSeekerProfile: {
            select: { fullName: true, email: true, phone: true, profilePhotoUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: { spotJob, bookings: trackingBookings } });

    } catch (error: any) {
      console.error("Error gathering specific sub-gigs monitoring tracks:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 6. PATCH /spot-jobs/:id/status
   */
  updateSpotStatusByCompany: async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = req.company?.companyId;
      const { id } = req.params;
      const { status } = req.body;

      if (!companyId) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }

      const targetJob = await prisma.spotJob.findUnique({
        where: { id }
      });

      if (!targetJob) {
        res.status(404).json({ success: false, message: 'Spot job tracking target index not found.' });
        return;
      }

      if (targetJob.companyId !== companyId) {
        res.status(403).json({ success: false, message: 'Security Exception: Modifications to foreign workspace indexes prohibited.' });
        return;
      }

      const updatedJob = await prisma.spotJob.update({
        where: { id },
        data: { status: status as SpotJobStatus }
      });

      res.status(200).json({ success: true, message: 'Spot job state index adjusted safely.', data: updatedJob });

    } catch (error: any) {
      console.error("Error setting spot tracking index modifications manually:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 7. GET /spot-jobs/toggle-status
   */
  getSpotToggleStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized.' });
        return;
      }

      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId },
        select: { availabilityStatus: true }
      });

      if (!profile) {
        res.status(404).json({ success: false, message: 'Profile workspace link not found.' });
        return;
      }

      const isSpotJobEnabled = profile.availabilityStatus === AvailabilityStatus.spot_available;

      res.status(200).json({
        success: true,
        isSpotJobEnabled
      });
    } catch (error: any) {
      console.error("Error checking spot toggle status:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 8. PATCH /spot-jobs/toggle-status
   */
  updateSpotToggleStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized.' });
        return;
      }

      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        res.status(400).json({ success: false, message: 'Invalid payload state format. Boolean expected.' });
        return;
      }

      const targetStatus = enabled 
        ? AvailabilityStatus.spot_available 
        : AvailabilityStatus.immutable; 

      const updatedProfile = await prisma.jobSeekerProfile.update({
        where: { userId },
        data: { availabilityStatus: targetStatus },
        select: { availabilityStatus: true }
      });

      res.status(200).json({
        success: true,
        message: 'Spot job matching engine status successfully adjusted.',
        isSpotJobEnabled: updatedProfile.availabilityStatus === AvailabilityStatus.spot_available
      });
    } catch (error: any) {
      console.error("Error mutating spot toggle target:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};