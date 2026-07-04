import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

interface AuthRequest extends Request {
  user?: { userId: string; mobileNumber: string; role: string };
}

const calculateCompletionScore = (profile: any): number => {
  let score = 0;

  // 1. Core Profile Details (Max 30%)
  if (profile.fullName?.trim()) score += 3;
  if (profile.email?.trim()) score += 6;
  if (profile.phone?.trim()) score += 10;

  // 2. Personal & Professional Base (Max 35%)
  if (profile.bio?.trim()) score += 10;
  if (profile.location?.trim()) score += 10;
  if (profile.skills && profile.skills.length > 0) {
    score += profile.skills.length >= 3 ? 15 : profile.skills.length * 5;
  }

  // 3. Experience, Education & Credentials (Max 35%)
  if (profile.education && profile.education.length > 0) score += 15;
  if ((profile.experience && profile.experience.length > 0) || (profile.projects && profile.projects.length > 0)) {
    score += 15;
  }
  if ((profile.certifications && profile.certifications.length > 0) || profile.linkedin?.trim() || profile.github?.trim()) {
    score += 5;
  }

  return Math.min(score, 100);
};

const bufferToBase64 = (buffer: Buffer, mimeType: string): string => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Received getProfile request for userId:', req.user?.userId);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        education: true,
        experience: true,
        projects: true,
        certifications: true,
        languages: true,
        achievements: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Job Seeker profile not found' });
    }

    const completionScore = calculateCompletionScore(profile);
    const preferences = (profile.jobPreferences as any) || {};

    const profileData = {
      completionScore,
      availabilityStatus: profile.availabilityStatus || 'available', // ✅ FIXED: Added this field
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      linkedin: profile.linkedin || '',
      github: profile.github || '',
      portfolio: profile.portfolio || '',
      bio: profile.bio || '',
      profilePic: profile.profilePhotoUrl || null, // ✅ FIXED: Correct field name
      preferences: {
        roles: preferences.roles || [],
        industries: preferences.industries || [],
        jobType: preferences.jobType || '',
        experience: preferences.experienceLevel || '',
        expectedSalary: preferences.expectedSalary || '',
        workLocationPreference: preferences.workLocationPreference || '',
      },
      skills: profile.skills.map(s => s.name),
      education: profile.education.map(edu => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        location: edu.location || '',
        startMonth: edu.startMonth || '',
        startYear: edu.startYear || '',
        endMonth: edu.endMonth || '',
        endYear: edu.endYear || '',
        cgpa: edu.cgpa || '',
        description: edu.description || '',
      })),
      experience: profile.experience.map(exp => ({
        id: exp.id,
        company: exp.company,
        role: exp.role,
        location: exp.location || '',
        startMonth: exp.startMonth || '',
        startYear: exp.startYear || '',
        endMonth: exp.endMonth || '',
        endYear: exp.endYear || '',
        current: exp.current,
        description: exp.description || '',
        skills: exp.skillsUsed,
      })),
      projects: profile.projects.map(proj => ({
        id: proj.id,
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies,
        githubLink: proj.githubLink || '',
        liveLink: proj.liveLink || '',
        startDate: proj.startDate || '',
        endDate: proj.endDate || '',
      })),
      certifications: profile.certifications.map(cert => ({
        id: cert.id,
        name: cert.name,
        organization: cert.organization,
        issueDate: cert.issueDate || '',
        credentialUrl: cert.credentialUrl || '',
      })),
      languages: profile.languages.map(lang => ({
        id: lang.id,
        language: lang.language,
        proficiency: lang.proficiency,
      })),
      achievements: profile.achievements.map(ach => ({
        id: ach.id,
        title: ach.title,
        description: ach.description || '',
        year: ach.year || '',
      })),
    };

    // ✅ FIXED: Wrap response in success format for consistency
    return res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  console.log('Received updateProfile request with body:', req.body);
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.body.availabilityStatus !== undefined && !req.body.profileData) {
      const inputStatus = String(req.body.availabilityStatus).trim().toLowerCase();
      
      let cleanStatus: 'available' | 'not_available' | 'spot_available' = 'available';
      if (inputStatus === 'spot_available') {
        cleanStatus = 'spot_available';
      } else if (inputStatus === 'not_available' || inputStatus === 'unavailable') {
        cleanStatus = 'not_available';
      }

      // Check if profile exists first to avoid duplicate email issues
      const existingProfile = await prisma.jobSeekerProfile.findUnique({
        where: { userId }
      });

      const updatedProfile = await prisma.jobSeekerProfile.upsert({
        where: { userId },
        update: { availabilityStatus: cleanStatus },
        create: {
          userId,
          availabilityStatus: cleanStatus,
          fullName: 'Candidate',
          email: existingProfile?.email || `candidate-${userId}@temp-internal.local`
        }
      });

      return res.json({
        success: true,
        message: 'Availability status updated successfully',
        data: { availabilityStatus: updatedProfile.availabilityStatus }
      });
    }

    // ✅ STANDARD WORKFLOW: Full profile update
    if (!req.body.profileData) {
      return res.status(400).json({ error: 'Missing profileData key in request body' });
    }

    const profileData = JSON.parse(req.body.profileData);
    const targetEmail = profileData.email?.trim() || '';

    // 🛑 EMAIL CHECK RULE: Verify if email is already taken by another account
    if (targetEmail) {
      const emailConflict = await prisma.jobSeekerProfile.findFirst({
        where: {
          email: targetEmail,
          NOT: { userId: userId } // Exclude current user checking their own profile
        }
      });

      if (emailConflict) {
        return res.status(400).json({ 
          success: false, 
          message: 'email already existed' 
        });
      }
    }

    let profilePicBase64: string | null = profileData.profilePic || null;

    if (req.file) {
      profilePicBase64 = bufferToBase64(req.file.buffer, req.file.mimetype);
    }

    const cleanStr = (val: any) => (val && val.trim() !== '' ? val.trim() : null);

    const jobPreferencesJson = {
      roles: profileData.preferences?.roles || [],
      industries: profileData.preferences?.industries || [],
      jobType: cleanStr(profileData.preferences?.jobType),
      experienceLevel: cleanStr(profileData.preferences?.experience),
      expectedSalary: cleanStr(profileData.preferences?.expectedSalary),
      workLocationPreference: cleanStr(profileData.preferences?.workLocationPreference),
    };

    await prisma.$transaction(async (tx) => {
      const seekerProfile = await tx.jobSeekerProfile.upsert({
        where: { userId },
        update: {
          fullName: profileData.fullName?.trim() || 'Candidate',
          email: targetEmail,
          phone: cleanStr(profileData.phone),
          location: cleanStr(profileData.location),
          linkedin: cleanStr(profileData.linkedin),
          github: cleanStr(profileData.github),
          portfolio: cleanStr(profileData.portfolio),
          bio: cleanStr(profileData.bio),
          profilePhotoUrl: profilePicBase64, 
          jobPreferences: jobPreferencesJson,
        },
        create: {
          userId,
          fullName: profileData.fullName?.trim() || 'Candidate',
          email: targetEmail,
          phone: cleanStr(profileData.phone),
          location: cleanStr(profileData.location),
          linkedin: cleanStr(profileData.linkedin),
          github: cleanStr(profileData.github),
          portfolio: cleanStr(profileData.portfolio),
          bio: cleanStr(profileData.bio),
          profilePhotoUrl: profilePicBase64, 
          jobPreferences: jobPreferencesJson,
        },
      });

      const profileId = seekerProfile.id;

      // Skills
      await tx.skill.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validSkills = (profileData.skills || []).filter((name: string) => name && name.trim() !== '');
      if (validSkills.length > 0) {
        await tx.skill.createMany({
          data: validSkills.map((name: string) => ({ name: name.trim(), jobSeekerProfileId: profileId })),
        });
      }

      // Education
      await tx.education.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validEdu = (profileData.education || []).filter((edu: any) => edu.institution && edu.institution.trim() !== '');
      if (validEdu.length > 0) {
        await tx.education.createMany({
          data: validEdu.map((edu: any) => ({
            jobSeekerProfileId: profileId,
            institution: edu.institution.trim(),
            degree: edu.degree ? edu.degree.trim() : '',
            field: edu.field ? edu.field.trim() : '',
            location: cleanStr(edu.location),
            startMonth: cleanStr(edu.startMonth),
            startYear: cleanStr(edu.startYear),
            endMonth: cleanStr(edu.endMonth),
            endYear: cleanStr(edu.endYear),
            cgpa: cleanStr(edu.cgpa),
            description: cleanStr(edu.description),
          })),
        });
      }

      // Experience
      await tx.experience.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validExp = (profileData.experience || []).filter((exp: any) => exp.company && exp.company.trim() !== '');
      if (validExp.length > 0) {
        await tx.experience.createMany({
          data: validExp.map((exp: any) => ({
            jobSeekerProfileId: profileId,
            company: exp.company.trim(),
            role: exp.role ? exp.role.trim() : '',
            location: cleanStr(exp.location),
            startMonth: cleanStr(exp.startMonth),
            startYear: cleanStr(exp.startYear),
            endMonth: cleanStr(exp.endMonth),
            endYear: cleanStr(exp.endYear),
            current: Boolean(exp.current),
            description: cleanStr(exp.description),
            skillsUsed: exp.skills || [],
          })),
        });
      }

      // Projects
      await tx.project.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validProjects = (profileData.projects || []).filter((p: any) => p.name && p.name.trim() !== '');
      if (validProjects.length > 0) {
        await tx.project.createMany({
          data: validProjects.map((proj: any) => ({
            jobSeekerProfileId: profileId,
            name: proj.name.trim(),
            description: proj.description ? proj.description.trim() : '',
            technologies: proj.technologies || [],
            githubLink: cleanStr(proj.githubLink),
            liveLink: cleanStr(proj.liveLink),
            startDate: cleanStr(proj.startDate),
            endDate: cleanStr(proj.endDate),
          })),
        });
      }

      // Certifications
      await tx.certification.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validCerts = (profileData.certifications || []).filter((c: any) => c.name && c.name.trim() !== '');
      if (validCerts.length > 0) {
        await tx.certification.createMany({
          data: validCerts.map((cert: any) => ({
            jobSeekerProfileId: profileId,
            name: cert.name.trim(),
            organization: cert.organization ? cert.organization.trim() : '',
            issueDate: cleanStr(cert.issueDate),
            credentialUrl: cleanStr(cert.credentialUrl),
          })),
        });
      }

      // Languages
      await tx.language.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validLangs = (profileData.languages || []).filter((l: any) => l.language && l.language.trim() !== '');
      if (validLangs.length > 0) {
        await tx.language.createMany({
          data: validLangs.map((lang: any) => ({
            jobSeekerProfileId: profileId,
            language: lang.language.trim(),
            proficiency: lang.proficiency || 'Beginner',
          })),
        });
      }

      // Achievements
      await tx.achievement.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validAchievements = (profileData.achievements || []).filter((a: any) => a.title && a.title.trim() !== '');
      if (validAchievements.length > 0) {
        await tx.achievement.createMany({
          data: validAchievements.map((ach: any) => ({
            jobSeekerProfileId: profileId,
            title: ach.title.trim(),
            description: cleanStr(ach.description),
            year: cleanStr(ach.year),
          })),
        });
      }
    });

    return res.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};