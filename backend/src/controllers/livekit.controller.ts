import type { Request, Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { prisma } from '../utils/prisma.ts';


const generateLiveKitToken = async (roomName: string, participantIdentity: string, participantName: string): Promise<string> => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,       
    canSubscribe: true,     
    canPublishData: true,   
  });

  return await token.toJwt();
};

const getCloudflareTurnCredentials = async () => {
  const turnKeyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!turnKeyId || !apiToken) return null;

  try {
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ttl: 86400 })
    });

    if (!response.ok) {
      console.error(`Cloudflare TURN API error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = (await response.json()) as any;
    
    if (data.iceServers) {
      return [data.iceServers];
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch Cloudflare TURN credentials:", e);
    return null;
  }
};

export const getCompanyToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const companyId = req.company?.companyId; 
    const { id: interviewId } = req.params;
    console.log(interviewId);
    console.log('userid ->',userId);
    console.log('companyId->', companyId);
    
    
    if (!userId || !companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized profile parameters tracking.' });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: { include: { jobPosting: true } } }
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not tracked.' });
    }

    if (interview.application.jobPosting.companyId !== companyId) {
      return res.status(403).json({ success: false, message: 'Access denied: Workspace alignment mismatch.' });
    }

    const userProfile = await prisma.user.findUnique({ where: { id: userId } });
    const hostLabel = userProfile?.name || req.company?.companyName || 'Interviewer Host';
    
    let roomName = interview.livekitRoomName;
    
    console.log(roomName, `member_${userId}`, hostLabel);
    
    const tokenString = await generateLiveKitToken(roomName, `member_${userId}`, hostLabel);
    const iceServers = await getCloudflareTurnCredentials();
    
    return res.status(200).json({
      success: true,
      token: tokenString,
      roomName,
      livekitUrl: process.env.LIVEKIT_API_URL || 'http://localhost:7880',
      iceServers: iceServers || undefined
    });
  } catch (error) {
    console.error('getCompanyToken exception trace:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error processing host session.' });
  }
};

export const getJobSeekerToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: interviewId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized credentials trace context.' });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { 
        application: {
          include: {
            jobSeekerProfile: true
          }
        } 
      }
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not tracked.' });
    }

    const applicationOwnerUserId = interview.application?.jobSeekerProfile?.userId;

    if (!applicationOwnerUserId || applicationOwnerUserId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You are not authorized to join this specific room entity.' 
      });
    }

    const userProfile = await prisma.user.findUnique({ where: { id: userId } });
    const candidateLabel = interview.application?.jobSeekerProfile?.fullName || userProfile?.name || 'Candidate';
    
    let roomName = interview.livekitRoomName || `room_${interviewId}`;
    if (!interview.livekitRoomName) {
      await prisma.interview.update({
        where: { id: interviewId },
        data: { livekitRoomName: roomName }
      });
    }

    const tokenString = await generateLiveKitToken(roomName, `candidate_${userId}`, candidateLabel);
    const iceServers = await getCloudflareTurnCredentials();

    return res.status(200).json({
      success: true,
      token: tokenString, 
      roomName,
      livekitUrl: process.env.LIVEKIT_API_URL,
      iceServers: iceServers || undefined
    });
  } catch (error) {
    console.error('getJobSeekerToken exception trace:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error routing candidate media bridge.' });
  }
};