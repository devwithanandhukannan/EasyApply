// PATH: src/controllers/resumeParser.controller.ts
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';
import { analyzeResume } from '../services/groq.service.ts';
const extractPdfText = (buffer) => {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on('pdfParser_dataError', (err) => {
            reject(new Error(err?.parserError || 'PDF parse failed'));
        });
        pdfParser.on('pdfParser_dataReady', () => {
            try {
                const text = pdfParser.getRawTextContent();
                resolve(text);
            }
            catch (e) {
                reject(e);
            }
        });
        pdfParser.parseBuffer(buffer);
    });
};
export const parseAndLoadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        const { mimetype, buffer } = req.file;
        let rawText = '';
        if (mimetype === 'application/pdf') {
            rawText = await extractPdfText(buffer);
        }
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimetype === 'application/msword') {
            const result = await mammoth.extractRawText({ buffer });
            rawText = result.value;
        }
        else {
            return res.status(400).json({ success: false, error: 'Only PDF or DOCX files are supported' });
        }
        if (!rawText || rawText.trim().length < 50) {
            return res.status(400).json({
                success: false,
                error: 'Could not extract text. Make sure the file is not a scanned image.',
            });
        }
        const trimmedText = rawText.trim().slice(0, 6000);
        const aiResult = await analyzeResume(trimmedText);
        const parsed = aiResult?.parsedData;
        if (!parsed) {
            return res.status(500).json({ success: false, error: 'AI failed to parse resume content' });
        }
        const profilePayload = {
            basicInfo: {
                fullName: parsed.name || '',
                email: parsed.email || '',
                phone: parsed.phone || '',
                location: parsed.location || '',
                linkedin: parsed.linkedin || '',
                github: parsed.github || '',
                portfolio: parsed.portfolio || '',
                bio: parsed.summary || '',
            },
            skills: (parsed.skills || []).filter(Boolean),
            education: (parsed.education || []).map((edu, i) => ({
                id: Date.now() + i,
                institution: edu.institution || '',
                degree: edu.degree || '',
                field: edu.field || '',
                location: edu.location || '',
                startMonth: '',
                startYear: edu.startYear || '',
                endMonth: '',
                endYear: edu.endYear || '',
                cgpa: edu.cgpa || '',
                description: '',
            })),
            experience: (parsed.experience || []).map((exp, i) => ({
                id: Date.now() + i + 100,
                company: exp.company || '',
                role: exp.role || '',
                location: exp.location || '',
                startMonth: '',
                startYear: exp.startDate || '',
                endMonth: '',
                endYear: exp.endDate || '',
                current: exp.current || false,
                description: [exp.description, ...(exp.achievements || [])].filter(Boolean).join('\n'),
                skills: [],
            })),
            projects: (parsed.projects || []).map((proj, i) => ({
                id: Date.now() + i + 200,
                name: proj.name || '',
                description: proj.description || '',
                technologies: proj.technologies || [],
                githubLink: proj.githubLink || '',
                liveLink: proj.liveLink || '',
                startDate: '',
                endDate: '',
            })),
            certifications: (parsed.certifications || []).map((cert, i) => ({
                id: Date.now() + i + 300,
                name: cert.name || '',
                organization: cert.organization || '',
                issueDate: cert.issueDate || '',
                credentialUrl: cert.credentialUrl || '',
            })),
            languages: (parsed.languages || []).map((lang, i) => ({
                id: Date.now() + i + 400,
                language: lang.language || '',
                proficiency: lang.proficiency || 'Beginner',
            })),
            achievements: (parsed.achievements || []).map((ach, i) => typeof ach === 'string'
                ? { id: Date.now() + i + 500, title: ach, description: '', year: '' }
                : { id: Date.now() + i + 500, title: ach.title || '', description: ach.description || '', year: ach.year || '' }),
            scores: aiResult?.scores || {},
        };
        return res.json({ success: true, data: profilePayload });
    }
    catch (error) {
        console.error('Resume parse error:', error);
        return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
    }
};
//# sourceMappingURL=resumeParser.controller.js.map