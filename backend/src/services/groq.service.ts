// src/services/groq.service.ts
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

export const analyzeResume = async (rawText: string, jobDescription?: string) => {
  const jdSection = jobDescription
    ? `\nTarget Job Description:\n"""\n${jobDescription}\n"""\n`
    : '';

  const prompt = `You are an expert ATS analyzer and senior resume coach for IT/software engineering roles.
Analyse the resume text below and return ONLY valid JSON.
${jdSection}
Resume Text:
"""
${rawText}
"""

Return EXACTLY this JSON schema:
{
  "parsedData": {
    "name": "", "email": "", "phone": "", "location": "",
    "linkedin": "", "github": "", "portfolio": "", "summary": "",
    "skills": [""],
    "experience": [{ "company":"","role":"","location":"","startDate":"","endDate":"","current":false,"description":"","achievements":[""] }],
    "education": [{ "institution":"","degree":"","field":"","location":"","startYear":"","endYear":"","cgpa":"" }],
    "projects": [{ "name":"","description":"","technologies":[""],"githubLink":"","liveLink":"" }],
    "certifications": [{ "name":"","organization":"","issueDate":"","credentialUrl":"" }],
    "languages": [{ "language":"","proficiency":"" }],
    "achievements": [""]
  },
  "scores": {
    "ats": 0,
    "formatting": 0,
    "keywords": 0,
    "grammar": 0,
    "readability": 0,
    "impact": 0
  },
  "atsBreakdown": {
    "contactInfo": 0, "summary": 0, "skills": 0,
    "experience": 0, "education": 0, "formatting": 0
  },
  "strengths": [""],
  "improvements": { "summary":"", "skills":"", "experience":"", "education":"", "formatting":"" },
  "missingSections": [""],
  "keywordGaps": [""],
  "autoCorrectedText": "",
  "jdOptimizationNotes": ""
}

Rules:
- All score values: integers 0-100
- strengths: 3-5 specific strengths
- improvements: actionable tips (omit key if no issues)
- keywordGaps: important IT keywords missing (docker, kubernetes, ci/cd, agile, etc.)
- autoCorrectedText: full resume text with better grammar, stronger action verbs, quantified achievements
- jdOptimizationNotes: only if job description provided — what to change to match the JD`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const generateFreshCV = async (
  profile: any,
  customPrompt?: string,
  jobDescription?: string,
) => {
  const styleInstructions = customPrompt
    ? `\nStyle/Goal Instructions from user: "${customPrompt}"\n`
    : '';
  const jdSection = jobDescription
    ? `\nOptimize for this Job Description:\n"""\n${jobDescription}\n"""\n`
    : '';

  const prompt = `You are an expert resume writer for software engineers and IT professionals.
Create a professional, ATS-friendly resume in HTML.
${styleInstructions}${jdSection}
User Profile:
${JSON.stringify(profile, null, 2)}

HTML Requirements:
- ONLY inline styles, no <style> tags, no class names
- No <html>, <head>, <body> tags — body content only
- Font: font-family: 'Georgia, serif' (fallback Arial)
- Colors: #1a1a1a headings, #333 body, #555 secondary, #2563EB links
- Section order: Header → Summary → Skills → Experience → Projects → Education → Certifications → Languages → Achievements
- <h1> for name, <h2> for sections, bold company/institution names
- <hr> dividers between sections
- Bullet points for experience achievements
- Skip empty sections entirely
- Strong action verbs, quantified achievements

Return ONLY valid JSON:
{
  "htmlContent": "<full resume HTML>",
  "scores": { "ats":0,"formatting":0,"keywords":0,"grammar":0,"readability":0,"impact":0 },
  "atsBreakdown": { "contactInfo":0,"summary":0,"skills":0,"experience":0,"education":0,"formatting":0 },
  "strengths": [""],
  "improvements": {},
  "missingSections": [""],
  "keywordGaps": [""]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const optimizeForJD = async (htmlContent: string, jobDescription: string) => {
  const prompt = `You are a professional resume optimizer.

Rewrite the resume HTML below to be perfectly optimised for the job description.
Keep ALL inline styles intact. Only change text content.

Job Description:
"""
${jobDescription}
"""

Current Resume HTML:
"""
${htmlContent}
"""

Return ONLY valid JSON:
{
  "htmlContent": "<optimized HTML with same inline styles>",
  "keywordsInserted": ["keyword1", "keyword2"],
  "changedSections": ["experience", "skills"],
  "scores": { "ats":0,"formatting":0,"keywords":0,"grammar":0,"readability":0,"impact":0 },
  "notes": "brief explanation of changes made"
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const suggestKeywords = async (htmlContent: string) => {
  const prompt = `Analyze this resume and return ATS keyword suggestions.
Return ONLY valid JSON.

Resume HTML:
"""
${htmlContent}
"""

{
  "missingKeywords": ["keyword1"],
  "suggestedBySection": {
    "skills": ["keyword"],
    "experience": ["keyword"],
    "summary": ["keyword"]
  }
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const convertToHTML = async (parsedData: any) => {
  const prompt = `Convert this structured resume data into a clean, professional HTML resume.
The layout should closely match the user's original CV style.
Return ONLY valid JSON — no markdown.

Parsed Data:
${JSON.stringify(parsedData, null, 2)}

Same HTML rules: inline styles only, no wrapper tags, Georgia/serif font.
Name as <h1>, section headings as <h2> with border-bottom dividers.
Return: { "htmlContent": "<html>" }`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return result.htmlContent ?? '';
};

export const generateJobDescription = async (
  roughDescription: string,
  title?: string,
  skills?: string[]
) => {
  const skillsList = skills && skills.length > 0 ? skills.join(', ') : 'core technical operations';
  
  const prompt = `You are an expert technical recruiter and senior copywriter. 
Optimize and expand this rough job description into a highly engaging, professional markdown job posting.

Target Job Title: ${title || 'Software Engineer'}
Target Skills: ${skillsList}
Rough Notes/Description: 
"""
${roughDescription}
"""

Create a comprehensive job description with:
1. **Role Overview** - Compelling 2-3 sentence summary
2. **Key Responsibilities** - 5-7 specific, action-oriented bullet points
3. **Required Qualifications** - Must-have skills and experience
4. **Preferred Qualifications** - Nice-to-have skills
5. **What We Offer** - Benefits and perks (if mentioned in rough notes)

Guidelines:
- Use strong action verbs (lead, architect, drive, implement, etc.)
- Quantify where possible (team size, scale, impact)
- Make it ATS-friendly with relevant keywords
- Keep tone professional but engaging
- Use markdown formatting (headers, bullets, bold)
- Output ONLY the formatted job description, no metadata or explanations`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2000,
  });

  return completion.choices[0]?.message?.content || roughDescription;
};