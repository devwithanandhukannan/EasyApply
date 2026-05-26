import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.ts';
import { sendTeamInviteEmail } from '../utils/email.ts';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

// Helper: Check if current user is admin of the company
const isCompanyAdmin = async (userId: string, companyId: string): Promise<boolean> => {
  const member = await prisma.teamMember.findFirst({
    where: { userId, companyId, role: 'admin', status: 'active' }
  });
  return !!member;
};

// ─────────────────────────────────────────────────────────────
// 1. Invite a new team member
// POST /api/company/team/invite
// ─────────────────────────────────────────────────────────────
export const inviteTeamMember = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const currentUserId = req.user?.userId;

    if (!companyId || !currentUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized access: Missing required token parameters.' });
    }

    // Only admin can invite
    const isAdmin = await isCompanyAdmin(currentUserId, companyId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only company administrators can invite new members.' });
    }

    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role parameters are mandatory.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const allowedRoles = ['hr_manager', 'interviewer', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid target role assignment specified.' });
    }

    // Lookup user using email string as mobileNumber identifier mapping index
    let user = await prisma.user.findFirst({
      where: { mobileNumber: normalizedEmail }
    });

    // Check if already an active member of this company workspace block
    if (user) {
      const existingMembership = await prisma.teamMember.findFirst({
        where: { userId: user.id, companyId, status: 'active' }
      });
      if (existingMembership) {
        return res.status(400).json({ success: false, message: 'Target profile user already belongs to your company team.' });
      }
    }

    // Generate workspace invite token (expires cleanly in 7 days)
    const inviteToken = jwt.sign(
      { email: normalizedEmail, companyId, role, invitedBy: currentUserId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Compute absolute destination client layout entry target URL
    const clientAppUrl = process.env.FRONTEND_URL_FOREMAIL;
    const inviteLink = `${clientAppUrl}/accept-invite?token=${inviteToken}`;
    
    // Dispatch structural transactional email template safely
    await sendTeamInviteEmail(
      normalizedEmail, 
      inviteLink, 
      role, 
      req.company?.companyName || 'Our Organization'
    );

    return res.status(200).json({
      success: true,
      message: `Invitation email dispatched successfully to: ${normalizedEmail}`
    });

  } catch (error: any) {
    console.error('Invite engine processing fault trace:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete corporate invitation pipeline routing.' });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. List all team members
// GET /api/company/team
// ─────────────────────────────────────────────────────────────
export const listTeamMembers = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const currentUserId = req.user?.userId;

    if (!companyId || !currentUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized session trace context.' });
    }

    const members = await prisma.teamMember.findMany({
      where: { companyId, status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            mobileNumber: true,
            role: true,
            jobSeekerProfile: {
              select: { fullName: true, email: true, profilePhotoUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = members.map(m => ({
      id: m.id,
      userId: m.userId,
      name: m.user.jobSeekerProfile?.fullName || m.user.mobileNumber,
      email: m.user.jobSeekerProfile?.email || m.user.mobileNumber,
      role: m.role,
      status: m.status,
      joinedAt: m.createdAt,
      avatar: m.user.jobSeekerProfile?.profilePhotoUrl || null
    }));

    return res.status(200).json({ success: true, team: formatted });
  } catch (error) {
    console.error('List team compilation fault:', error);
    return res.status(500).json({ success: false, message: 'Failed to extract organization team members layout.' });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. Update team member role (FIXED: Added global UserRole Sync)
// PUT /api/company/team/:memberId/role
// ─────────────────────────────────────────────────────────────
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const currentUserId = req.user?.userId;
    const { memberId } = req.params;
    const { role } = req.body;

    if (!companyId || !currentUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized credentials scope configuration context.' });
    }

    const isAdmin = await isCompanyAdmin(currentUserId, companyId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only admin accounts can adjust permission parameters.' });
    }

    const allowedRoles = ['hr_manager', 'interviewer', 'viewer', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid target role profile passed.' });
    }

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, companyId }
    });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Target workspace reference member could not be tracked.' });
    }

    // Fix: Execute as database transaction to update role constraints across BOTH maps cleanly
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.update({
        where: { id: memberId },
        data: { role }
      });

      let newUserRole = UserRole.company_hr;
      if (role === 'admin') newUserRole = UserRole.company_admin;

      await tx.user.update({
        where: { id: member.userId },
        data: { role: newUserRole }
      });
    });

    return res.status(200).json({ success: true, message: 'Team workspace and global system profile roles synced modified successfully.' });
  } catch (error) {
    console.error('Update role error trace handling fault:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign target role modifications.' });
  }
};

// ─────────────────────────────────────────────────────────────
// 4. Remove team member (FIXED: Added global role reset demotion)
// DELETE /api/company/team/:memberId
// ─────────────────────────────────────────────────────────────
export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const currentUserId = req.user?.userId;
    const { memberId } = req.params;

    if (!companyId || !currentUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized parameter tracking context detected.' });
    }

    const isAdmin = await isCompanyAdmin(currentUserId, companyId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin authorization verification validation failed.' });
    }

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, companyId }
    });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Target profile team record reference not found.' });
    }

    if (member.userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Self-removal restricted. Request action from alternate administrator profiles.' });
    }

    // Fix: Deactivate workspace entry AND demote user role back down to base job_seeker safely
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.update({
        where: { id: memberId },
        data: { status: 'deactivated' }
      });

      await tx.user.update({
        where: { id: member.userId },
        data: { role: UserRole.job_seeker }
      });
    });

    return res.status(200).json({ success: true, message: 'Team member deactivated and corporate permissions revoked successfully.' });
  } catch (error) {
    console.error('Remove member processing execution fault:', error);
    return res.status(500).json({ success: false, message: 'Failed to execute workspace removal transformation.' });
  }
};

// ─────────────────────────────────────────────────────────────
// 5. Accept Invite (Public Workflow Endpoint Validation)
// GET /api/company/team/accept-invite
// ─────────────────────────────────────────────────────────────
export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Bad Request: Invalid transaction authorization token link format.' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Unauthorized: Verification authorization parameter has expired or is invalid.' });
    }

    const { email, companyId, role } = decoded;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Not Found: The inviting corporate organization workspace target no longer exists.' });
    }

    const finalUser = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({
        where: { mobileNumber: email }
      });

      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        user = await tx.user.create({
          data: {
            mobileNumber: email,
            role: UserRole.job_seeker, 
            isVerified: true,
            password: '', 
            jobSeekerProfile: {
              create: {
                fullName: email.split('@')[0],
                email: email,
                phone: ''
              }
            }
          }
        });
      } else {
        if (!user.password) {
          isNewUser = true;
        }

        const existingGlobalRecord = await tx.teamMember.findFirst({
          where: { userId: user.id }
        });

        if (existingGlobalRecord) {
          // If already active in the target company layout, flag it cleanly
          if (existingGlobalRecord.companyId === companyId && existingGlobalRecord.status === 'active') {
            return { user, alreadyMember: true, isNewUser: false, finalRole: user.role };
          }
        }
      }

      await tx.teamMember.upsert({
        where: { userId: user.id },
        update: {
          companyId,
          role: role,
          status: 'active'
        },
        create: {
          userId: user.id,
          companyId,
          role: role,
          status: 'active'
        }
      });

      let newUserRole = UserRole.company_hr;
      if (role === 'admin') newUserRole = UserRole.company_admin;

      await tx.user.update({
        where: { id: user.id },
        data: { role: newUserRole }
      });

      return { user, finalRole: newUserRole, alreadyMember: false, isNewUser };
    });

    // ─── FIX: REMOVED RES.REDIRECT — SEND CLEAN JSON METADATA INSTEAD ───
    if (finalUser.alreadyMember) {
      return res.status(200).json({ 
        success: true, 
        alreadyMember: true, 
        message: 'User is already an active member of this workspace.' 
      });
    }

    const { issueSessionCookies } = await import('../utils/cookie.ts');
    issueSessionCookies(res, { userId: finalUser.user.id, role: finalUser.finalRole });

    return res.status(200).json({
      success: true,
      isNewUser: finalUser.isNewUser,
      alreadyMember: false,
      email: email,
      message: 'Workspace credentials verified successfully.'
    });

  } catch (error) {
    console.error('Accept invite lifecycle pipeline implementation crashed:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error: Failed validating active entry conditions.' });
  }
};

// ─────────────────────────────────────────────────────────────
// 6. Set Password for New Invited Team Members
// POST /api/company/team/set-password
// ─────────────────────────────────────────────────────────────

export const setPasswordForInvite = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bad Request: Token identifier and password strings are mandatory parameters.' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Security Violation: Password must meet the baseline threshold of 8 characters.' 
      });
    }

    // Decode and validate token integrity metrics
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unauthorized: Setup link token has expired or is invalid.' 
      });
    }

    const { email, companyId } = decoded;

    // Track the target user by their email string index mapper
    const user = await prisma.user.findFirst({
      where: { mobileNumber: email },
      include: { teamMemberships: true } // Correct relation field name
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Not Found: No authentication profile matches the token verification criteria.' 
      });
    }

    // FIX: Read from teamMemberships instead of the undefined teamMembers field
    const targetWorkspaceMember = user.teamMemberships.find(m => m.companyId === companyId);
    if (!targetWorkspaceMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Profile access scope is mismatched from target company workspace mappings.' 
      });
    }

    // Hash the password safely using bcryptjs salt generations
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save password hash and enforce user configuration visibility parameters concurrently
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isVerified: true
      }
    });

    // Fetch company configuration context to populate auth context session payload requirements cleanly
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    // Issue updated operational security context logging cookies for seamless instant dashboard routing
    const { issueSessionCookies } = await import('../utils/cookie.ts');
    issueSessionCookies(res, { userId: updatedUser.id, role: updatedUser.role });

    return res.status(200).json({
      success: true,
      message: 'Account authentication payload initialized successfully.',
      user: {
        id: updatedUser.id,
        mobileNumber: updatedUser.mobileNumber,
        role: updatedUser.role
      },
      company
    });

  } catch (error) {
    console.error('Password provisioning pipeline crashed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error: Execution failure writing structural security credentials.' 
    });
  }
};