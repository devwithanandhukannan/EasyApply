import type { Request, Response } from 'express';
import fs from 'fs';
import { prisma } from '../utils/prisma.ts';
import { extractText } from '../utils/textExtractor.ts';
import { analyzeResume, generateFreshCV, convertToHTML, optimizeForJD, suggestKeywords } from '../services/groq.service.ts';

const getProfileId = async (userId: string) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
};

const readContent = (resume: any) => (resume.content as any) ?? {};
const readAI = (resume: any) => (resume.aiSuggestions as any) ?? {};

const pushVersion = (contentData: any, label?: string) => {
  const versions: any[] = contentData.versions ?? [];
  if (contentData.htmlContent) {
    versions.push({
      id: Date.now().toString(),
      label: label ?? `Version ${versions.length + 1}`,
      htmlContent: contentData.htmlContent,
      savedAt: new Date().toISOString(),
    });
    if (versions.length > 20) versions.shift();
  }
  contentData.versions = versions;
};

export const uploadAndAnalyze = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Job seeker profile not found' });
    }

    const { name, jobDescription } = req.body;
    const rawText = await extractText(req.file.path, req.file.mimetype);

    if (!rawText || rawText.length < 50) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(422).json({ success: false, message: 'Could not extract text — is it a scanned PDF?' });
    }

    const analysis = await analyzeResume(rawText, jobDescription);

    const contentData = {
      rawText,
      parsedData: analysis.parsedData ?? {},
      atsBreakdown: analysis.atsBreakdown ?? {},
      autoCorrectedText: analysis.autoCorrectedText ?? null,
      htmlContent: null, 
      margins: { top: 60, right: 72, bottom: 60, left: 72 },
      template: 'default',
      versions: [],
    };

    const aiData = {
      scores: analysis.scores ?? {},
      strengths: analysis.strengths ?? [],
      improvements: analysis.improvements ?? {},
      missingSections: analysis.missingSections ?? [],
      keywordGaps: analysis.keywordGaps ?? [],
      jdOptimizationNotes: analysis.jdOptimizationNotes ?? '',
    };

    const atsScore = analysis.scores?.ats ?? null;

    const resume = await prisma.resume.create({
      data: {
        jobSeekerProfileId: profileId,
        name: name?.trim() || req.file.originalname.replace(/\.[^.]+$/, ''),
        source: 'uploaded',
        filePath: req.file.path,
        atsScore,
        content: contentData,
        aiSuggestions: aiData,
        isPrimary: false,
      },
    });

    return res.status(201).json({ success: true, data: resume });
  } catch (err) {
    console.error('uploadAndAnalyze error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to process resume' });
  }
};

const compileResumeHtml = (data: any): string => {
  const headingStyle = "color: #1a1a1a; font-family: 'Georgia, serif'; margin-bottom: 5px;";
  const sectionTitleStyle = "color: #1a1a1a; font-family: 'Georgia, serif'; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 20px;";
  const bodyStyle = "color: #333; font-family: 'Georgia, serif'; font-size: 14px; line-height: 1.5;";
  const subStyle = "color: #555; font-family: Arial, sans-serif; font-size: 13px;";
  const linkStyle = "color: #2563EB; text-decoration: none; margin-right: 10px;";

  let html = `<h1 style="${headingStyle}">${data.fullName || ''}</h1>`;
  
  // Contact Section
  html += `<p style="${bodyStyle}">`;
  if (data.contact?.email) html += `Email: ${data.contact.email} | `;
  if (data.contact?.phone) html += `Phone: ${data.contact.phone} | `;
  if (data.contact?.location) html += `Location: ${data.contact.location}<br>`;
  if (data.contact?.links) {
    html += data.contact.links.map((link: string) => `<a style="${linkStyle}" href="${link}">${link}</a>`).join(' ');
  }
  html += `</p><hr>`;

  // Summary Section
  if (data.summary) {
    html += `<h2 style="${sectionTitleStyle}">Professional Summary</h2>`;
    html += `<p style="${bodyStyle}">${data.summary}</p>`;
  }

  // Skills Section
  if (data.skills?.length) {
    html += `<h2 style="${sectionTitleStyle}">Skills</h2>`;
    html += `<p style="${bodyStyle}"><strong>Core Competencies:</strong> ${data.skills.join(', ')}</p>`;
  }

  // Experience Section
  if (data.experience?.length) {
    html += `<h2 style="${sectionTitleStyle}">Professional Experience</h2>`;
    data.experience.forEach((exp: any) => {
      html += `<p style="${bodyStyle}"><strong>${exp.company}</strong> — <em>${exp.role}</em> <span style="${subStyle}">(${exp.duration || ''})</span></p>`;
      if (exp.bullets?.length) {
        html += `<ul style="${bodyStyle}">`;
        exp.bullets.forEach((b: string) => html += `<li>${b}</li>`);
        html += `</ul>`;
      }
    });
  }

  // Projects Section
  if (data.projects?.length) {
    html += `<h2 style="${sectionTitleStyle}">Key Projects</h2>`;
    data.projects.forEach((proj: any) => {
      html += `<p style="${bodyStyle}"><strong>${proj.name}</strong> ${proj.technologies ? `(${proj.technologies.join(', ')})` : ''}<br>${proj.description}</p>`;
    });
  }

  // Education Section
  if (data.education?.length) {
    html += `<h2 style="${sectionTitleStyle}">Education</h2>`;
    data.education.forEach((edu: any) => {
      html += `<p style="${bodyStyle}"><strong>${edu.institution}</strong> — ${edu.degree} ${edu.field ? `in ${edu.field}` : ''} <span style="${subStyle}">(${edu.duration || ''})</span><br>${edu.details || ''}</p>`;
    });
  }

  // Certifications Section
  if (data.certifications?.length) {
    html += `<h2 style="${sectionTitleStyle}">Certifications</h2>`;
    html += `<ul style="${bodyStyle}">` + data.certifications.map((c: string) => `<li>${c}</li>`).join('') + `</ul>`;
  }

  // Languages Section
  if (data.languages?.length) {
    html += `<h2 style="${sectionTitleStyle}">Languages</h2>`;
    html += `<p style="${bodyStyle}">${data.languages.join(', ')}</p>`;
  }

  // Achievements Section
  if (data.achievements?.length) {
    html += `<h2 style="${sectionTitleStyle}">Key Achievements</h2>`;
    html += `<ul style="${bodyStyle}">` + data.achievements.map((a: string) => `<li>${a}</li>`).join('') + `</ul>`;
  }

  return html;
};
export const generateCV = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { customPrompt, jobDescription } = req.body;

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { skills: true, education: true, experience: true, projects: true, certifications: true, languages: true, achievements: true },
    });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // Call the updated LLM prompt function
    const generated = await generateFreshCV(profile, customPrompt, jobDescription);

    // Render the HTML cleanly on the backend server side 
    const finalHtmlContent = generated.resumeData ? compileResumeHtml(generated.resumeData) : '';

    const contentData = {
      htmlContent: finalHtmlContent,
      atsBreakdown: generated.atsBreakdown ?? {},
      margins: { top: 60, right: 72, bottom: 60, left: 72 },
      template: 'default',
      versions: [],
      customPrompt: customPrompt ?? null,
    };

    const aiData = {
      scores: generated.scores ?? {},
      strengths: generated.strengths ?? [],
      improvements: generated.improvements ?? {},
      missingSections: generated.missingSections ?? [],
      keywordGaps: generated.keywordGaps ?? [],
    };

    const atsScore = generated.scores?.ats ?? null;

    const resume = await prisma.resume.create({
      data: {
        jobSeekerProfileId: profile.id,
        name: `${profile.fullName ?? 'My'} Resume`,
        source: 'built',
        atsScore,
        content: contentData,
        aiSuggestions: aiData,
        isPrimary: false,
      },
    });

    return res.status(201).json({ success: true, data: resume });
  } catch (err) {
    console.error('generateCV error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate CV' });
  }
};

export const convertResumeToHTML = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const contentData = readContent(resume);
    if (contentData.htmlContent) return res.json({ success: true, data: resume });

    const htmlContent = await convertToHTML(contentData.parsedData ?? {});
    contentData.htmlContent = htmlContent;

    const updated = await prisma.resume.update({ where: { id }, data: { content: contentData } });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('convertResumeToHTML error:', err);
    return res.status(500).json({ success: false, message: 'Failed to convert' });
  }
};

export const optimizeResume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { jobDescription } = req.body;

    if (!jobDescription?.trim()) return res.status(400).json({ success: false, message: 'Job description required' });

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: 'Open resume in editor first to generate HTML' });

    const result = await optimizeForJD(contentData.htmlContent, jobDescription);

    pushVersion(contentData, 'Before JD optimization');
    contentData.htmlContent = result.htmlContent ?? contentData.htmlContent;

    const aiData = readAI(resume);
    aiData.scores = result.scores ?? aiData.scores;
    aiData.jdOptimizationNotes = result.notes ?? '';
    aiData.keywordsInserted = result.keywordsInserted ?? [];

    const atsScore = result.scores?.ats ?? resume.atsScore;

    await prisma.resume.update({
      where: { id },
      data: { content: contentData, aiSuggestions: aiData, atsScore },
    });

    return res.json({ success: true, data: { htmlContent: contentData.htmlContent, notes: result.notes, keywordsInserted: result.keywordsInserted } });
  } catch (err) {
    console.error('optimizeResume error:', err);
    return res.status(500).json({ success: false, message: 'Optimization failed' });
  }
};

export const getKeywordSuggestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });

    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: 'Open in editor first' });

    const suggestions = await suggestKeywords(contentData.htmlContent);
    return res.json({ success: true, data: suggestions });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to suggest keywords' });
  }
};

export const getAllResumes = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resumes = await prisma.resume.findMany({
      where: { jobSeekerProfileId: profileId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        source: true,
        atsScore: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        aiSuggestions: true,
      },
    });
    
    return res.json({ success: true, data: resumes });
  } catch (err) {
    console.error('getAllResumes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch resume index metrics.' });
  }
};

export const getResumeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: resume });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch' });
  }
};

export const updateResume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    const { htmlContent, name, isPrimary, margins, template, versionLabel } = req.body;

    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const existing = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    const contentData = readContent(existing);

    if (versionLabel) pushVersion(contentData, versionLabel);
    if (htmlContent !== undefined) contentData.htmlContent = htmlContent;
    if (margins) contentData.margins = margins;
    if (template) contentData.template = template;

    await prisma.$transaction(async (tx) => {
      if (isPrimary === true) {
        await tx.resume.updateMany({ where: { jobSeekerProfileId: profileId }, data: { isPrimary: false } });
      }
      await tx.resume.update({
        where: { id },
        data: { content: contentData, ...(name && { name }), ...(isPrimary !== undefined && { isPrimary }) },
      });
    });

    return res.json({ success: true, message: 'Updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

export const restoreVersion = async (req: Request, res: Response) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });

    const contentData = readContent(resume);
    const version = (contentData.versions ?? []).find((v: any) => v.id === versionId);
    if (!version) return res.status(404).json({ success: false, message: 'Version not found' });

    pushVersion(contentData, 'Before restore');
    contentData.htmlContent = version.htmlContent;

    await prisma.resume.update({ where: { id }, data: { content: contentData } });
    return res.json({ success: true, data: { htmlContent: version.htmlContent } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to restore' });
  }
};

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });

    if (resume.filePath && fs.existsSync(resume.filePath)) fs.unlinkSync(resume.filePath);
    await prisma.resume.delete({ where: { id } });
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};

export const downloadResume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });
    if (!resume.filePath || !fs.existsSync(resume.filePath)) return res.status(404).json({ success: false, message: 'File not found' });

    res.download(resume.filePath, resume.name + (resume.filePath.endsWith('.pdf') ? '.pdf' : '.docx'));
  } catch (err) {
    console.error('downloadResume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to download' });
  }
};