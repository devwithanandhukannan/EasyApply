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

export const rankCandidates = async (
  jobDescription: string,
  requiredSkills: any,           // Json field from JobPosting (array stored as Prisma Json)
  candidates: Array<{
    applicationId: string;
    candidateName: string;
    skills: string[];
    experience: any[];
    education: any[];
    projects: any[];
    certifications: string[];
    atsScore: number | null;
    resumeContent: any;
  }>,
  topN: number,
) => {
  const skillsList = Array.isArray(requiredSkills)
    ? requiredSkills.join(', ')
    : JSON.stringify(requiredSkills);

  const prompt = `You are a senior technical recruiter and talent acquisition specialist.
Evaluate the following job applicants against the job description and rank them.

Job Description:
"""
${jobDescription}
"""

Required Skills: ${skillsList}

Applicants (${candidates.length} total):
${JSON.stringify(candidates, null, 2)}

Instructions:
- Rank ALL ${candidates.length} candidates by fit for this role
- Return the TOP ${topN} candidates only in the "rankings" array
- Score each candidate 0-100 based on skill match, experience relevance, and overall fit
- Be specific — reference actual skills, companies, and projects from their profiles

Return ONLY valid JSON:
{
  "summary": "2-3 sentence overview of the applicant pool quality",
  "rankings": [
    {
      "rank": 1,
      "applicationId": "<exact applicationId from input>",
      "score": 92,
      "matchReason": "Concise explanation of why this candidate is a strong fit",
      "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
      "gaps": ["missing skill or experience 1", "missing skill 2"],
      "recommendation": "Strongly recommend" | "Recommend" | "Consider" | "Do not recommend"
    }
  ]
}

Rules:
- applicationId must match EXACTLY from the input — do not alter it
- rank starts from 1 (best) to ${topN}
- strengths: 2-4 specific points referencing their actual profile
- gaps: honest assessment of what they lack for this role (empty array if none)
- recommendation must be one of the four exact strings above`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? '{"rankings":[],"summary":""}');
};

export const rankCandidatesAgainstQuery = async (
  queryDescription: string,
  requiredSkills: string[],
  candidates: Array<{
    id: string;
    fullName: string;
    skills: string[];
    experience: any[];
    education: any[];
    projects: any[];
    certifications: string[];
    atsScore: number | null;
  }>,
  topN: number,
) => {
  const skillsStr = requiredSkills.join(', ');
  const prompt = `You are a technical recruiter. Rank the following candidates for the role described below.

Role Description:
"""
${queryDescription}
"""

Required Skills: ${skillsStr}

Candidates:
${JSON.stringify(candidates, null, 2)}

Return ONLY valid JSON:
{
  "summary": "brief overview of the candidate pool",
  "rankings": [
    {
      "rank": 1,
      "candidateId": "exact id from input",
      "score": 92,
      "matchReason": "why this candidate fits",
      "strengths": ["strength1", "strength2"],
      "gaps": ["gap1"],
      "recommendation": "Strongly recommend"
    }
  ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{"rankings":[],"summary":""}');
};

export const generateOfferLetterTemplate = async (
  templateName: string,
  description?: string,
  companyName?: string
) => {
  const descriptionSection = description
    ? `\nAdditional Context/Requirements:\n${description}\n`
    : '';

  const companySection = companyName
    ? `Company Name: ${companyName}\n`
    : '';

  const prompt = `You are an expert legal document writer and HR professional specializing in employment offer letters.

Generate a professional, legally sound offer letter template based on the following:

Template Name: ${templateName}
${companySection}${descriptionSection}

Requirements:
- Create a complete, formal offer letter template
- Use placeholder variables in {{variableName}} format for dynamic content
- Include these REQUIRED placeholders:
  * {{candidateName}} - Recipient's full name
  * {{position}} - Job title
  * {{department}} - Department name
  * {{salary}} - Annual salary with currency
  * {{startDate}} - Employment start date
  * {{location}} - Work location
  * {{companyName}} - Company name
  * {{date}} - Letter date

- Structure:
  1. Professional greeting
  2. Congratulatory opening paragraph
  3. Position details (title, department, reporting structure)
  4. Compensation and benefits overview
  5. Employment terms (full-time/contract, probation period if applicable)
  6. Start date and location
  7. Next steps (acceptance deadline, required documents)
  8. Closing statement with excitement
  9. Professional sign-off

- Tone: Professional, warm, welcoming
- Length: 300-500 words
- Legal considerations: Include standard employment-at-will statement (if applicable)
- Make it ATS-friendly and easy to read

Return ONLY valid JSON:
{
  "content": {
    "greeting": "Dear {{candidateName}},",
    "opening": "We are delighted to...",
    "positionDetails": "You will be joining us as...",
    "compensation": "Your annual salary will be...",
    "benefits": "In addition to your salary...",
    "terms": "This is a {{employmentType}} position...",
    "startDetails": "Your anticipated start date is...",
    "nextSteps": "To accept this offer...",
    "closing": "We are excited to welcome you...",
    "signOff": "Sincerely,"
  },
  "requiredPlaceholders": ["{{candidateName}}", "{{position}}", ...],
  "optionalPlaceholders": ["{{benefits}}", "{{probationPeriod}}", ...],
  "previewText": "Full assembled letter preview with sample values",
  "legalNotes": "Brief notes on customization or legal review needs",
  "industryBestPractices": ["tip1", "tip2", "tip3"]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};