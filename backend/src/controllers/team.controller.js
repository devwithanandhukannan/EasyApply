import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // Ensure bcrypt is imported
import { prisma } from '../utils/prisma.ts';
import { sendTeamInviteEmail } from '../utils/email.ts';
import { ROLES, ALL_COMPANY_BITS } from '../constants/roles.ts';
import { issueSessionCookies } from '../utils/cookie.ts';
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';
// Helper: Check if current user has Company Admin bit mask active inside this company workspace
const isCompanyAdmin = async (userId, companyId) => {
    const member = await prisma.teamMember.findFirst({
        where: { userId, companyId, status: 'active' }
    });
    if (!member)
        return false;
    return (member.roles & ROLES.COMPANY_ADMIN) === ROLES.COMPANY_ADMIN;
};
// ─────────────────────────────────────────────────────────────
// 1. Invite a new team member
// ─────────────────────────────────────────────────────────────
export const inviteTeamMember = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const currentUserId = req.user?.userId;
        if (!companyId || !currentUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access: Missing parameters.' });
        }
        const isAdmin = await isCompanyAdmin(currentUserId, companyId);
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin access verification failed.' });
        }
        const { email, roleType } = req.body;
        if (!email || !roleType) {
            return res.status(400).json({ success: false, message: 'Email and roleType parameters are mandatory.' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        let bitwiseRoleValue = ROLES.COMPANY_VIEWER;
        if (roleType === 'hr')
            bitwiseRoleValue = ROLES.COMPANY_HR;
        else if (roleType === 'interviewer')
            bitwiseRoleValue = ROLES.COMPANY_INTERVIEWER;
        else if (roleType === 'admin')
            bitwiseRoleValue = ROLES.COMPANY_ADMIN;
        let user = await prisma.user.findFirst({
            where: { mobileNumber: normalizedEmail }
        });
        if (user) {
            const existingMembership = await prisma.teamMember.findFirst({
                where: { userId: user.id, companyId, status: 'active' }
            });
            if (existingMembership) {
                return res.status(400).json({ success: false, message: 'Target profile user already belongs to your company team.' });
            }
        }
        const inviteToken = jwt.sign({ email: normalizedEmail, companyId, targetRoles: bitwiseRoleValue, invitedBy: currentUserId }, JWT_SECRET, { expiresIn: '7d' });
        const clientAppUrl = process.env.FRONTEND_URL_FOREMAIL || 'http://localhost:3001';
        const inviteLink = `${clientAppUrl}/accept-invite?token=${inviteToken}`;
        await sendTeamInviteEmail(normalizedEmail, inviteLink, roleType, req.company?.companyName || 'Our Organization');
        return res.status(200).json({
            success: true,
            message: `Invitation email dispatched successfully to: ${normalizedEmail}`
        });
    }
    catch (error) {
        console.error('Invite engine fault trace:', error);
        return res.status(500).json({ success: false, message: 'Failed to complete invitation pipeline routing.' });
    }
};
// ─────────────────────────────────────────────────────────────
// 2. List all team members
// ─────────────────────────────────────────────────────────────
export const listTeamMembers = async (req, res) => {
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
                        globalRoles: true,
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
            rolesMask: m.roles,
            globalRolesMask: m.user.globalRoles,
            status: m.status,
            joinedAt: m.createdAt,
            avatar: m.user.jobSeekerProfile?.profilePhotoUrl || null
        }));
        return res.status(200).json({ success: true, team: formatted });
    }
    catch (error) {
        console.error('List team compilation fault:', error);
        return res.status(500).json({ success: false, message: 'Failed to extract team members layout.' });
    }
};
// ─────────────────────────────────────────────────────────────
// 3. Update team member roles
// ─────────────────────────────────────────────────────────────
export const updateMemberRole = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const currentUserId = req.user?.userId;
        const { memberId } = req.params;
        const { newRolesMask } = req.body;
        if (!companyId || !currentUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized structural setup context.' });
        }
        const isAdmin = await isCompanyAdmin(currentUserId, companyId);
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Restricted admin operation context.' });
        }
        const member = await prisma.teamMember.findFirst({
            where: { id: memberId, companyId }
        });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Target workspace reference member could not be tracked.' });
        }
        await prisma.$transaction(async (tx) => {
            await tx.teamMember.update({
                where: { id: memberId },
                data: { roles: newRolesMask }
            });
            const targetUser = await tx.user.findUnique({ where: { id: member.userId } });
            if (targetUser) {
                let updatedGlobal = targetUser.globalRoles & ~ALL_COMPANY_BITS;
                updatedGlobal |= newRolesMask;
                await tx.user.update({
                    where: { id: targetUser.id },
                    data: { globalRoles: updatedGlobal }
                });
            }
        });
        return res.status(200).json({ success: true, message: 'Roles synced successfully.' });
    }
    catch (error) {
        console.error('Update role fault handling processing trace:', error);
        return res.status(500).json({ success: false, message: 'Failed to assign target role modifications.' });
    }
};
// ─────────────────────────────────────────────────────────────
// 4. Remove team member
// ─────────────────────────────────────────────────────────────
export const removeTeamMember = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const currentUserId = req.user?.userId;
        const { memberId } = req.params;
        if (!companyId || !currentUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized parameter validation tracking context.' });
        }
        const isAdmin = await isCompanyAdmin(currentUserId, companyId);
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin access confirmation verification failed.' });
        }
        const member = await prisma.teamMember.findFirst({
            where: { id: memberId, companyId }
        });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Target profile team record reference not found.' });
        }
        if (member.userId === currentUserId) {
            return res.status(400).json({ success: false, message: 'Self-removal restricted.' });
        }
        await prisma.$transaction(async (tx) => {
            await tx.teamMember.update({
                where: { id: memberId },
                data: { status: 'deactivated' }
            });
            const userRecord = await tx.user.findUnique({ where: { id: member.userId } });
            if (userRecord) {
                const cleanedGlobalRoles = userRecord.globalRoles & ~ALL_COMPANY_BITS;
                await tx.user.update({
                    where: { id: userRecord.id },
                    data: { globalRoles: cleanedGlobalRoles || ROLES.JOB_SEEKER }
                });
            }
        });
        return res.status(200).json({ success: true, message: 'Team member deactivated and corporate bits stripped.' });
    }
    catch (error) {
        console.error('Remove member processing execution fault:', error);
        return res.status(500).json({ success: false, message: 'Failed to execute workspace removal transformation.' });
    }
};
// ─────────────────────────────────────────────────────────────
// 5. Accept Invite (Validates invitation status token parameters)
// ─────────────────────────────────────────────────────────────
export const acceptInvite = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ success: false, message: 'Bad Request: Invalid token link format.' });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        }
        catch (err) {
            return res.status(400).json({ success: false, message: 'Unauthorized: Link verification token expired or invalid.' });
        }
        const { email, companyId } = decoded;
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Not Found: Corporate organization workspace no longer exists.' });
        }
        // Look up core user node identity
        const user = await prisma.user.findFirst({ where: { mobileNumber: email } });
        if (user) {
            const existingRecord = await prisma.teamMember.findFirst({ where: { userId: user.id, companyId } });
            // User exists and already has password set up inside this mapping container context
            if (existingRecord && existingRecord.status === 'active' && existingRecord.password) {
                return res.status(200).json({ success: true, alreadyMember: true, message: 'User is already an active member.' });
            }
        }
        return res.status(200).json({
            success: true,
            isNewUser: true, // Force credential collection setup window render phase
            email: email,
            message: 'Invitation context parsed successfully. Proceed to password creation phase.'
        });
    }
    catch (error) {
        console.error('Accept invite lifecycle trace exception crash:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error: Failed validating active entry conditions.' });
    }
};
// ─────────────────────────────────────────────────────────────
// 6. Set Password (Creates/Updates User Identity and sets password into TeamMember)
// POST /api/company/team/set-password
// ─────────────────────────────────────────────────────────────
export const setTeamMemberPassword = async (req, res) => {
    console.log('hacker');
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and password parameters are both mandatory.' });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        }
        catch (err) {
            return res.status(400).json({ success: false, message: 'Invalid or expired invitation validation token context.' });
        }
        const { email, companyId, targetRoles } = decoded;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const transactionData = await prisma.$transaction(async (tx) => {
            let user = await tx.user.findFirst({ where: { mobileNumber: email } });
            if (!user) {
                user = await tx.user.create({
                    data: {
                        mobileNumber: email,
                        globalRoles: ROLES.JOB_SEEKER,
                        isVerified: true,
                        jobSeekerProfile: {
                            create: {
                                fullName: email.split('@')[0],
                                email: email,
                                phone: ''
                            }
                        }
                    }
                });
            }
            // Sync workspace profile registration entries mask mappings with password assignment appended safely
            const updatedMember = await tx.teamMember.upsert({
                where: { companyId_userId: { companyId, userId: user.id } },
                update: { roles: targetRoles, status: 'active', password: hashedPassword },
                create: { userId: user.id, companyId, roles: targetRoles, status: 'active', password: hashedPassword }
            });
            // Overlay user's global structural permissions bits mapping safely
            let updatedGlobalRoles = user.globalRoles | targetRoles;
            await tx.user.update({
                where: { id: user.id },
                data: { globalRoles: updatedGlobalRoles }
            });
            const companyContext = await tx.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true, email: true }
            });
            return { user, company: companyContext, finalRole: updatedGlobalRoles };
        });
        // Issue authentication state cookies injection directly layout configuration
        const { issueSessionCookies } = await import('../utils/cookie.ts');
        const accessToken = issueSessionCookies(res, { userId: transactionData.user.id, globalRoles: transactionData.finalRole });
        return res.status(200).json({
            success: true,
            accessToken,
            user: { id: transactionData.user.id, email: transactionData.user.mobileNumber },
            company: transactionData.company,
            message: 'Corporate access configured and password set cleanly inside target team layer profile.'
        });
    }
    catch (error) {
        console.error('Password provisioning infrastructure execution error tracking:', error);
        return res.status(500).json({ success: false, message: 'Failed to serialize structural user membership password setup configuration.' });
    }
};
// Login: Invited Team Member Access Route
// POST /api/company/team/login
// ─────────────────────────────────────────────────────────────
export const teamMemberLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password fields are strictly mandatory.'
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        // 1. Scan for the user profile container
        // Matches where mobileNumber or an explicit email column stores the target address
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { mobileNumber: normalizedEmail },
                    // Handles cases where an explicit email column is exposed on the User model
                    ...('email' in prisma.user.fields ? [{ email: normalizedEmail }] : [])
                ]
            },
            include: {
                jobSeekerProfile: {
                    select: { fullName: true, email: true }
                }
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials provided.'
            });
        }
        // 2. Fetch the corresponding workspace row linkage containing corporate roles
        const memberProfile = await prisma.teamMember.findFirst({
            where: {
                userId: user.id,
                status: 'active'
            },
            include: {
                company: {
                    select: { id: true, name: true, email: true, isVerified: true, logoUrl: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        if (!memberProfile) {
            return res.status(401).json({
                success: false,
                message: 'No active corporate workspace linkage identified for this profile.'
            });
        }
        // 3. Fallback Password Resolution Check
        // Extracts the password string regardless of whether it resides on the TeamMember row or the parent User record
        const targetPasswordHash = memberProfile.password || user.password;
        if (!targetPasswordHash) {
            return res.status(401).json({
                success: false,
                message: 'Account password parameters have not been initialized. Please use your invite link.'
            });
        }
        // 4. Run bcrypt timing-safe match validation
        const isPasswordValid = await bcrypt.compare(password, targetPasswordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials provided.'
            });
        }
        // 5. Verify the hosting company's active status
        if (!memberProfile.company.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Access restricted: Your company workspace is currently awaiting verification.'
            });
        }
        const accessToken = issueSessionCookies(res, {
            userId: user.id,
            globalRoles: user.globalRoles
        });
        return res.status(200).json({
            success: true,
            accessToken,
            message: 'Team authentication successful.',
            user: {
                id: user.id,
                email: user.jobSeekerProfile?.email || (user.mobileNumber.includes('@') ? user.mobileNumber : memberProfile.company.email),
                name: user.jobSeekerProfile?.fullName || (user.mobileNumber.includes('@') ? user.mobileNumber.split('@')[0] : 'Admin'),
                globalRoles: user.globalRoles,
                companyRoles: memberProfile.roles
            },
            company: {
                id: memberProfile.company.id,
                name: memberProfile.company.name,
                email: memberProfile.company.email,
                logoUrl: memberProfile.company.logoUrl || null
            }
        });
    }
    catch (error) {
        console.error('teamMemberLogin pipeline trace failure:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server failure handling team workspace login routing.',
            error: error.message
        });
    }
};
//# sourceMappingURL=team.controller.js.map