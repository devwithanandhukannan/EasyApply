import type { Request, Response } from 'express';
import {prisma} from '../utils/prisma.ts';

interface AuthRequest extends Request {
  user?: { id: string; mobileNumber: string; role: string };
}

// Helper: convert buffer to base64
const bufferToBase64 = (buffer: Buffer, mimeType: string): string => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

// GET /api/jobseeker/profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeekerProfile: true,
        skills: true,
        education: true,
        experience: true,
        projects: true,
        certifications: true,
        languages: true,
        achievements: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profileData = {
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.jobSeekerProfile?.phone || '',
      location: user.jobSeekerProfile?.location || '',
      linkedin: user.jobSeekerProfile?.linkedin || '',
      github: user.jobSeekerProfile?.github || '',
      portfolio: user.jobSeekerProfile?.portfolio || '',
      bio: user.jobSeekerProfile?.bio || '',
      profilePic: user.jobSeekerProfile?.profilePic || null,
      preferences: {
        roles: user.jobSeekerProfile?.preferredRoles || [],
        industries: user.jobSeekerProfile?.preferredIndustries || [],
        jobType: user.jobSeekerProfile?.jobType || '',
        experience: user.jobSeekerProfile?.experienceLevel || '',
        expectedSalary: user.jobSeekerProfile?.expectedSalary || '',
        workLocationPreference: user.jobSeekerProfile?.workLocationPreference || '',
      },
      skills: user.skills.map(s => s.name),
      education: user.education.map(edu => ({
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
      experience: user.experience.map(exp => ({
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
      projects: user.projects.map(proj => ({
        id: proj.id,
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies,
        githubLink: proj.githubLink || '',
        liveLink: proj.liveLink || '',
        startDate: proj.startDate || '',
        endDate: proj.endDate || '',
      })),
      certifications: user.certifications.map(cert => ({
        id: cert.id,
        name: cert.name,
        organization: cert.organization,
        issueDate: cert.issueDate || '',
        credentialUrl: cert.credentialUrl || '',
      })),
      languages: user.languages.map(lang => ({
        id: lang.id,
        language: lang.language,
        proficiency: lang.proficiency,
      })),
      achievements: user.achievements.map(ach => ({
        id: ach.id,
        title: ach.title,
        description: ach.description || '',
        year: ach.year || '',
      })),
    };

    res.json(profileData);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/jobseeker/profile
// PUT /api/jobseeker/profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  console.log('Received updateProfile request with body:', req.body);
  try {
    // 1. FIXED: Extract the raw string ID property directly from the object
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.body.profileData) {
      return res.status(400).json({ error: 'Missing profileData key in request body' });
    }

    // Parse the profile data from form-data
    const profileData = JSON.parse(req.body.profileData);
    let profilePicBase64: string | null = profileData.profilePic || null;

    // If a file was uploaded, convert to base64
    if (req.file) {
      profilePicBase64 = bufferToBase64(req.file.buffer, req.file.mimetype);
    }

    // Helper: normalizes empty frontend string submissions into database nulls safely
    const cleanStr = (val: any) => (val && val.trim() !== '' ? val.trim() : null);

    await prisma.$transaction(async (tx) => {
      // Update User
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: cleanStr(profileData.fullName),
          email: cleanStr(profileData.email),
        },
      });

      // Upsert JobSeekerProfile
      await tx.jobSeekerProfile.upsert({
        where: { userId },
        update: {
          phone: cleanStr(profileData.phone),
          location: cleanStr(profileData.location),
          linkedin: cleanStr(profileData.linkedin),
          github: cleanStr(profileData.github),
          portfolio: cleanStr(profileData.portfolio),
          bio: cleanStr(profileData.bio),
          profilePic: profilePicBase64,
          preferredRoles: profileData.preferences?.roles || [],
          preferredIndustries: profileData.preferences?.industries || [],
          jobType: cleanStr(profileData.preferences?.jobType),
          experienceLevel: cleanStr(profileData.preferences?.experience),
          expectedSalary: cleanStr(profileData.preferences?.expectedSalary),
          workLocationPreference: cleanStr(profileData.preferences?.workLocationPreference),
        },
        create: {
          userId,
          phone: cleanStr(profileData.phone),
          location: cleanStr(profileData.location),
          linkedin: cleanStr(profileData.linkedin),
          github: cleanStr(profileData.github),
          portfolio: cleanStr(profileData.portfolio),
          bio: cleanStr(profileData.bio),
          profilePic: profilePicBase64,
          preferredRoles: profileData.preferences?.roles || [],
          preferredIndustries: profileData.preferences?.industries || [],
          jobType: cleanStr(profileData.preferences?.jobType),
          experienceLevel: cleanStr(profileData.preferences?.experience),
          expectedSalary: cleanStr(profileData.preferences?.expectedSalary),
          workLocationPreference: cleanStr(profileData.preferences?.workLocationPreference),
        },
      });

      // Skills: Filter out empty array items
      await tx.skill.deleteMany({ where: { userId } });
      const validSkills = (profileData.skills || []).filter((name: string) => name && name.trim() !== '');
      if (validSkills.length > 0) {
        await tx.skill.createMany({
          data: validSkills.map((name: string) => ({ name: name.trim(), userId })),
        });
      }

      // Education: Save rows that have an institutional name
      await tx.education.deleteMany({ where: { userId } });
      const validEdu = (profileData.education || []).filter((edu: any) => edu.institution && edu.institution.trim() !== '');
      if (validEdu.length > 0) {
        await tx.education.createMany({
          data: validEdu.map((edu: any) => ({
            userId,
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

      // Experience: Save rows that have a company name
      await tx.experience.deleteMany({ where: { userId } });
      const validExp = (profileData.experience || []).filter((exp: any) => exp.company && exp.company.trim() !== '');
      if (validExp.length > 0) {
        await tx.experience.createMany({
          data: validExp.map((exp: any) => ({
            userId,
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

      // Projects: Save rows that have a name
      await tx.project.deleteMany({ where: { userId } });
      const validProjects = (profileData.projects || []).filter((p: any) => p.name && p.name.trim() !== '');
      if (validProjects.length > 0) {
        await tx.project.createMany({
          data: validProjects.map((proj: any) => ({
            userId,
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
      await tx.certification.deleteMany({ where: { userId } });
      const validCerts = (profileData.certifications || []).filter((c: any) => c.name && c.name.trim() !== '');
      if (validCerts.length > 0) {
        await tx.certification.createMany({
          data: validCerts.map((cert: any) => ({
            userId,
            name: cert.name.trim(),
            organization: cert.organization ? cert.organization.trim() : '',
            issueDate: cleanStr(cert.issueDate),
            credentialUrl: cleanStr(cert.credentialUrl),
          })),
        });
      }

      // Languages
      await tx.language.deleteMany({ where: { userId } });
      const validLangs = (profileData.languages || []).filter((l: any) => l.language && l.language.trim() !== '');
      if (validLangs.length > 0) {
        await tx.language.createMany({
          data: validLangs.map((lang: any) => ({
            userId,
            language: lang.language.trim(),
            proficiency: lang.proficiency || 'Beginner',
          })),
        });
      }

      // Achievements
      await tx.achievement.deleteMany({ where: { userId } });
      const validAchievements = (profileData.achievements || []).filter((a: any) => a.title && a.title.trim() !== '');
      if (validAchievements.length > 0) {
        await tx.achievement.createMany({
          data: validAchievements.map((ach: any) => ({
            userId,
            title: ach.title.trim(),
            description: cleanStr(ach.description),
            year: cleanStr(ach.year),
          })),
        });
      }
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};