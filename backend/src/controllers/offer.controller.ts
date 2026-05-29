import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { OfferLetterStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { sendOfferLetterEmail, sendOfferResponseNotification } from '../utils/email.ts';
import { generateOfferLetterTemplate } from '../services/groq.service.ts';


interface AuthRequest extends Request {
    user?: { userId: string; email?: string };
    company?: { companyId: string; name: string };
}

// ─── TEMPLATE MANAGEMENT ───────────────────────────────────────────


export const getCompanyTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const templates = await prisma.offerTemplate.findMany({
            where: { companyId, isActive: true },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return res.json({ success: true, data: templates });
    } catch (error: any) {
        console.error('Fetch templates error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOfferTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.company?.companyId;
        const { name, content, isDefault, isActive } = req.body;

        const template = await prisma.offerTemplate.findFirst({
            where: { id, companyId }
        });

        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        if (isDefault) {
            await prisma.offerTemplate.updateMany({
                where: { companyId, isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }

        const updated = await prisma.offerTemplate.update({
            where: { id },
            data: { name, content, isDefault, isActive }
        });

        return res.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Update template error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteOfferTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.company?.companyId;

        const template = await prisma.offerTemplate.findFirst({
            where: { id, companyId }
        });

        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        await prisma.offerTemplate.delete({ where: { id } });

        return res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error: any) {
        console.error('Delete template error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── OFFER LETTER GENERATION ───────────────────────────────────────

const renderTemplate = (template: string, data: any): string => {
    let rendered = template;
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, data[key] || '');
    });
    return rendered;
};

const generateOfferPDF = async (offer: any, content: string): Promise<string> => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'offers');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `offer-${offer.id}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    let offerContent: any = {};
    try { offerContent = typeof content === 'string' ? JSON.parse(content) : content; } 
    catch (e) { offerContent = {}; }

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true, autoFirstPage: true });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        const W = doc.page.width;   // 595.28
        const H = doc.page.height;  // 841.89
        const L = 54;               // left margin
        const R = W - 54;           // right bound
        const PW = R - L;           // printable width = 487.28

        const companyName = offer.application.jobPosting.company.name;
        const logoUrl = offer.application.jobPosting.company.logoUrl;
        const profile = offer.application.jobSeekerProfile;

        const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: offer.currency || 'USD' }).format(Number(n));
        const fmtDate = (d: any) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // ── HELPER: draw text at exact absolute coords, NEVER moves cursor into flow ──
        const abs = (text: string, x: number, y: number, opts: any = {}) => {
            doc.save();
            doc.text(text, x, y, { lineBreak: false, ...opts });
            doc.restore();
        };

        // ── WATERMARK ──────────────────────────────────────────────────────────────
        doc.save();
        doc.fontSize(44).font('Helvetica-Bold').fillColor('#000000', 0.015)
           .text(companyName.toUpperCase(), L, 340, { align: 'center', width: PW });
        doc.restore();

        // ── HEADER ─────────────────────────────────────────────────────────────────
        let logoRendered = false;
        if (logoUrl && fs.existsSync(logoUrl)) {
            try {
                doc.image(logoUrl, L, 54, { width: 55 });
                doc.save();
                doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827')
                   .text(companyName, 125, 56, { lineBreak: false });
                doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563')
                   .text(offer.location || 'Corporate Office', 125, 70, { lineBreak: false })
                   .text(offer.application.jobPosting.company.email || '', 125, 81, { lineBreak: false });
                doc.restore();
                logoRendered = true;
            } catch (e) {}
        }
        if (!logoRendered) {
            doc.save();
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827')
               .text(companyName.toUpperCase(), L, 54, { lineBreak: false });
            doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563')
               .text(offer.location || 'Corporate Office', L, 70, { lineBreak: false })
               .text(offer.application.jobPosting.company.email || '', L, 80, { lineBreak: false });
            doc.restore();
        }

        // ── SEPARATOR ──────────────────────────────────────────────────────────────
        doc.moveTo(L, 110).lineTo(R, 110).strokeColor('#e5e7eb').lineWidth(1).stroke();

        // ── METADATA ROW ───────────────────────────────────────────────────────────
        doc.save();
        doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563');
        doc.text(`Offer Ref: ${offer.id.substring(0, 8).toUpperCase()}`, L, 120, { lineBreak: false });
        doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, L, 120, { align: 'right', width: PW, lineBreak: false });
        doc.restore();

        // ── RECIPIENT ──────────────────────────────────────────────────────────────
        doc.save();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#4b5563').text('PREPARED FOR:', L, 140, { lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(profile.fullName, L, 153, { lineBreak: false });
        doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563')
           .text(`Email: ${profile.email}`, L, 166, { lineBreak: false });
        if (profile.phone) doc.text(`Phone: ${profile.phone}`, L, 177, { lineBreak: false });
        doc.restore();

        // ── GREETING ───────────────────────────────────────────────────────────────
        doc.save();
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#111827')
           .text(`Dear ${profile.fullName},`, L, 197, { lineBreak: false });
        doc.restore();

        // ── OPENING PARAGRAPH (flowing, but bounded) ───────────────────────────────
        // We allow this one to flow — measure it first so we know where table starts
        const openingText = `We are pleased to extend this formal offer of employment for the position of ${offer.position} with ${companyName}. We were incredibly impressed by your qualifications and technical profile during our review cycles, and we believe your skills will make an excellent addition to our team.`;
        
        // Move cursor to opening start
        doc.text('', L, 211); // position cursor, no output
        doc.font('Helvetica').fontSize(9).fillColor('#374151')
           .text(openingText, { align: 'justify', width: PW, lineGap: 2 });

        // ── POSITION TABLE ─────────────────────────────────────────────────────────
        const tableTop = doc.y + 10;

        const tableData = [
            ['Position Title', offer.position || ''],
            ['Department', offer.department || 'Operations / Core Engineering'],
            ['Employment Type', offer.employmentType ? offer.employmentType.replace(/_/g, ' ').toUpperCase() : 'FULL TIME'],
            ['Base Compensation', fmt(offer.salary)],
            ['Commencement Date', fmtDate(offer.startDate)],
            ['Deployment Location', offer.location || 'As specified by corporate HR rules'],
        ];

        doc.save();
        doc.rect(L, tableTop, PW, 18).fill('#f3f4f6');
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1f2937')
           .text('POSITION SUMMARY & PARAMETERS', L + 8, tableTop + 5, { lineBreak: false });
        doc.restore();

        let ty = tableTop + 18;
        tableData.forEach(row => {
            doc.moveTo(L, ty + 16).lineTo(R, ty + 16).strokeColor('#f3f4f6').lineWidth(1).stroke();
            doc.save();
            doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563').text(row[0], L + 8, ty + 4, { lineBreak: false });
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#111827').text(row[1], 210, ty + 4, { width: PW - 160, lineBreak: false });
            doc.restore();
            ty += 16;
        });

        // ── TERMS ──────────────────────────────────────────────────────────────────
        // Position cursor after table
        doc.text('', L, ty + 10);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111827')
           .text('Standard Employment Contingencies:', { lineBreak: false });

        const terms = [
            'This execution offer remains highly contingent on clear backgrounds, records, and verification passes.',
            'You will be bound to fulfill responsibilities under corporate non-disclosure agreements.',
            'Standard statutory performance appraisals, protection policies, and perks scale inline with company rules.',
            'This offer is dynamically active and must be processed within 7 sequential calendar days from issuance.'
        ];

        terms.forEach((term, idx) => {
            const termStartY = doc.y + 6;
            // number bullet — absolute, no flow impact
            doc.save();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151')
               .text(`${idx + 1}.`, L, termStartY, { lineBreak: false, width: 12 });
            doc.restore();
            // term body — flows naturally, advancing doc.y
            doc.text('', L + 14, termStartY);
            doc.font('Helvetica').fontSize(8).fillColor('#4b5563')
               .text(term, { width: PW - 14, align: 'justify' });
        });

        // ── CLOSING ────────────────────────────────────────────────────────────────
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#4b5563')
           .text('To indicate formal confirmation of acceptance, please digitally execute your authorization signature below.',
               L, doc.y + 8, { width: PW });

        // ── SIGNATURE BLOCK ────────────────────────────────────────────────────────
        // DEFINITIVE FIX: use doc._root / internal page reset trick.
        // After all flowing content ends at doc.y, we check if remaining space >= 110px.
        // If not enough space, we forcibly reset doc's internal y tracker to fit on same page.
        // We do this by directly manipulating doc.y via doc.text('', x, targetY) ONLY if
        // targetY > doc.y (i.e., jumping DOWN is safe). If content is above targetY, we
        // place signature right after content with a safe gap instead of fixed bottom.

        const SIGN_BLOCK_HEIGHT = 110; // space needed for sig + footer
        const FOOTER_H = 48;
        const sigAreaBottom = H - FOOTER_H;
        const sigAreaTop = sigAreaBottom - SIGN_BLOCK_HEIGHT;

        const contentEndsAt = doc.y;
        const sigY = Math.max(contentEndsAt + 20, sigAreaTop);

        // Safety: if sigY + SIGN_BLOCK_HEIGHT > sigAreaBottom, content is too long.
        // In that case place sig right after content; accept it may be close to footer.
        const finalSigY = (sigY + SIGN_BLOCK_HEIGHT <= sigAreaBottom) ? sigY : contentEndsAt + 20;

        // Jump cursor to sig position safely
        doc.text('', L, finalSigY);

        doc.save();
        doc.font('Helvetica').fontSize(8.5).fillColor('#111827')
           .text('Sincerely,', L, finalSigY, { lineBreak: false });
        doc.restore();

        // Company sig image
        if (offer.companySignature?.signature) {
            try {
                const compImg = parseSignatureImage(offer.companySignature.signature);
                if (compImg) doc.image(compImg, L, finalSigY + 14, { width: 100, height: 28, fit: [100, 28] });
            } catch (e) { console.error('Corp sig error:', e); }
        }

        doc.moveTo(L, finalSigY + 44).lineTo(L + 130, finalSigY + 44).strokeColor('#9ca3af').lineWidth(0.5).stroke();
        doc.save();
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1f2937').text('Authorized Signatory', L, finalSigY + 48, { lineBreak: false });
        doc.font('Helvetica').fontSize(7.5).fillColor('#6b7280').text(
            offer.companySignature ? `Verified: ${new Date(offer.companySignature.signedAt).toLocaleDateString()}` : 'Awaiting Corporate Stamp',
            L, finalSigY + 58, { lineBreak: false }
        );
        doc.restore();

        // Candidate sig
        const rightSignX = R - 130;
        if (offer.candidateSignature?.signature) {
            try {
                const candImg = parseSignatureImage(offer.candidateSignature.signature);
                if (candImg) doc.image(candImg, rightSignX, finalSigY + 14, { width: 100, height: 28, fit: [100, 28] });
            } catch (e) { console.error('Cand sig error:', e); }
        }
        doc.moveTo(rightSignX, finalSigY + 44).lineTo(R, finalSigY + 44).strokeColor('#9ca3af').lineWidth(0.5).stroke();
        doc.save();
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1f2937').text('Candidate Acceptance', rightSignX, finalSigY + 48, { lineBreak: false });
        doc.font('Helvetica').fontSize(7.5).fillColor('#6b7280').text(
            offer.candidateSignature ? `Digitally Signed: ${new Date(offer.candidateSignature.signedAt).toLocaleDateString()}` : 'Awaiting Signatures',
            rightSignX, finalSigY + 58, { lineBreak: false }
        );
        doc.restore();

        // ── FOOTER ─────────────────────────────────────────────────────────────────
        // Pinned to absolute bottom using direct graphics — zero text-flow involvement
        doc.moveTo(L, H - 42).lineTo(R, H - 42).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        doc.save();
        doc.font('Helvetica').fontSize(7.5).fillColor('#9ca3af')
           .text(`${companyName} • Private & Confidential Employment Offer`, L, H - 34, { lineBreak: false });
        doc.text('Page 1 of 1', L, H - 34, { width: PW, align: 'right', lineBreak: false });
        doc.restore();

        // ── FINALIZE: discard any overflow pages ───────────────────────────────────
        doc.end();

        // After end(), trim stream to page 1 only using pdf-lib or accept bufferPages
        // The real guarantee: with bufferPages:true + all abs coords using lineBreak:false,
        // no overflow pages are generated. But we add a post-process trim just in case:
        stream.on('finish', async () => {
            try {
                // Trim to 1 page using pdf-lib if available
                const { PDFDocument } = await import('pdf-lib');
                const srcBytes = fs.readFileSync(filepath);
                const srcDoc = await PDFDocument.load(srcBytes);
                if (srcDoc.getPageCount() > 1) {
                    const newDoc = await PDFDocument.create();
                    const [firstPage] = await newDoc.copyPages(srcDoc, [0]);
                    newDoc.addPage(firstPage);
                    const trimmed = await newDoc.save();
                    fs.writeFileSync(filepath, trimmed);
                }
            } catch (e) {
                // pdf-lib not available or already 1 page — fine
            }
            resolve(filepath);
        });
        stream.on('error', reject);
    });
};

const parseSignatureImage = (sigData: any): Buffer | string | null => {
    if (typeof sigData === 'string') {
        if (sigData.trim().startsWith('data:image')) {
            const base64Data = sigData.split(';base64,').pop();
            if (!base64Data) return null;
            return Buffer.from(base64Data.replace(/\s/g, ''), 'base64');
        }
        if (fs.existsSync(sigData)) {
            return sigData;
        }
    }
    if (Buffer.isBuffer(sigData)) return sigData;
    return null;
};

export const updateOfferLetter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.company?.companyId;
        
        const {
            position,
            department,
            salary,
            currency,
            startDate,
            location,
            employmentType,
            content
        } = req.body;

        const offer = await prisma.offerLetter.findFirst({
            where: {
                id,
                application: {
                    jobPosting: { companyId }
                },
                status: 'draft' // Only allow editing drafts
            }
        });

        if (!offer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Offer not found or cannot be edited' 
            });
        }

        const updated = await prisma.offerLetter.update({
            where: { id },
            data: {
                position,
                department,
                salary,
                currency,
                startDate: new Date(startDate),
                location,
                employmentType,
                content: content ? JSON.parse(content) : offer.content
            },
            include: {
                application: {
                    include: {
                        jobSeekerProfile: true,
                        jobPosting: {
                            include: { company: true }
                        }
                    }
                }
            }
        });

        return res.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Update offer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createOfferLetter = async (req: AuthRequest, res: Response) => {
    console.log('reached');

    try {
        const companyId = req.company?.companyId;
        const companyName = req.company?.name;

        if (!companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const {
            applicationId,
            templateId,
            position,
            department,
            salary,
            currency,
            startDate,
            location,
            employmentType,
            customContent
        } = req.body;

        // SANITIZATION: If templateId is an empty string, convert it to undefined/null
        // This stops Prisma from passing an invalid key string down to the database schema.
        const sanitizedTemplateId = templateId && templateId.trim() !== '' ? templateId : null;

        // Verify application belongs to company
        const application = await prisma.application.findFirst({
            where: {
                id: applicationId,
                jobPosting: { companyId }
            },
            include: {
                jobSeekerProfile: true,
                jobPosting: true
            }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Get template
        let templateContent = customContent;
        // FIXED: Use sanitizedTemplateId instead of templateId
        if (sanitizedTemplateId && !customContent) {
            const template = await prisma.offerTemplate.findFirst({
                where: { id: sanitizedTemplateId, companyId }
            });
            if (template) {
                templateContent = template.content;
            }
        }

        // Prepare template data
        const templateData = {
            candidateName: application.jobSeekerProfile.fullName,
            position,
            department: department || application.jobPosting.department,
            salary: new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(salary)),
            startDate: new Date(startDate).toLocaleDateString(),
            location: location || application.jobPosting.location,
            companyName,
            date: new Date().toLocaleDateString()
        };

        const renderedContent = renderTemplate(JSON.stringify(templateContent), templateData);

        // Create offer letter
        // ─── REPLACE THE TRANSACTION BLOCK IN YOUR CONTROLLER ────────────────

        // Create offer letter
        const offer = await prisma.$transaction(async (tx) => {
            const newOffer = await tx.offerLetter.create({
                data: {
                    applicationId,
                    templateId: sanitizedTemplateId,
                    position,
                    department,
                    salary,
                    currency,
                    startDate: new Date(startDate),
                    location,
                    employmentType,
                    content: JSON.parse(renderedContent),
                    status: 'draft'
                },
                include: {
                    application: {
                        include: {
                            jobSeekerProfile: true,
                            jobPosting: {
                                include: { company: true }
                            }
                        }
                    }
                }
            });

            // Update application status
            await tx.application.update({
                where: { id: applicationId },
                data: { status: 'offer_sent' }
            });

            // FIXED: Create history tracking row with required schema fields
            await tx.applicationHistory.create({
                data: {
                    applicationId,
                    fromStatus: application.status,       // Pass previous state (e.g., 'hr_round')
                    toStatus: 'offer_sent',              // Correct schema field name
                    changedBy: req.user?.userId || 'system', // Required schema string
                    changedByType: 'user',
                    notes: 'Offer letter generated and prepared for candidate review.'
                }
            });

            return newOffer;
        });

        return res.status(201).json({ success: true, data: offer });
    } catch (error: any) {
        console.error('Create offer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DIGITAL SIGNATURE ─────────────────────────────────────────────

export const signOfferLetter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { signature } = req.body;
        const companyId = req.company?.companyId;
        const userId = req.user?.userId;

        const offer = await prisma.offerLetter.findFirst({
            where: {
                id,
                application: {
                    jobPosting: { companyId }
                }
            }
        });

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const signatureData = {
            signedBy: userId,
            signedAt: new Date().toISOString(),
            signature
        };

        const updated = await prisma.offerLetter.update({
            where: { id },
            data: {
                companySignature: signatureData,
                status: 'pending'
            }
        });

        return res.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Sign offer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── SEND OFFER VIA MULTIPLE CHANNELS ──────────────────────────────

export const sendOfferLetter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { channels } = req.body; // ['email', 'whatsapp', 'inapp']
        const companyId = req.company?.companyId;

        const offer = await prisma.offerLetter.findFirst({
            where: {
                id,
                application: {
                    jobPosting: { companyId }
                }
            },
            include: {
                application: {
                    include: {
                        jobSeekerProfile: true,
                        jobPosting: {
                            include: { company: true }
                        }
                    }
                }
            }
        });

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (!offer.companySignature) {
            return res.status(400).json({ success: false, message: 'Offer must be signed before sending' });
        }

        // Generate PDF
        const pdfPath = await generateOfferPDF(offer, JSON.stringify(offer.content));

        const updates: any = {
            status: 'sent',
            sentAt: new Date(),
            filePath: pdfPath
        };

        // Send via Email
        if (channels.includes('email')) {
            await sendOfferLetterEmail(
                offer.application.jobSeekerProfile.email,
                offer.application.jobSeekerProfile.fullName,
                offer.position,
                offer.application.jobPosting.company.name,
                offer.application.jobPosting.company.logoUrl,
                offer.id,
                pdfPath
            );

            updates.emailSentAt = new Date();
        }

        // Send via WhatsApp (if configured)
        if (channels.includes('whatsapp') && offer.application.jobSeekerProfile.phone) {
            // TODO: Implement WhatsApp API integration here
            updates.whatsappSentAt = new Date();
        }

        const updated = await prisma.offerLetter.update({
            where: { id },
            data: updates
        });

        return res.json({ success: true, data: updated, message: 'Offer sent successfully' });
    } catch (error: any) {
        console.error('Send offer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── EMAIL TRACKING ────────────────────────────────────────────────
export const trackOfferEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.offerLetter.update({
            where: { id },
            data: {
                viewedAt: new Date(),
                emailOpenCount: { increment: 1 },
                status: 'viewed'
            }
        });

        // Return 1x1 transparent pixel
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );

        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        });
        res.end(pixel);
    } catch (error) {
        console.error('Track email error:', error);
        res.status(500).end();
    }
};

// ─── CANDIDATE RESPONSE (JOB SEEKER) ───────────────────────────────
export const respondToOffer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { response, negotiationNote, signature } = req.body;
        const userId = req.user?.userId;

        const offer = await prisma.offerLetter.findFirst({
            where: {
                id,
                application: {
                    jobSeekerProfile: { userId }
                }
            },
            include: {
                application: {
                    include: {
                        jobSeekerProfile: true,
                        jobPosting: {
                            include: {
                                company: true // ✅ FIXED: Remove nested owner include
                            }
                        }
                    }
                }
            }
        });

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const updates: any = {
            candidateResponse: response,
            respondedAt: new Date()
        };

        if (response === 'accept') {
            updates.status = 'accepted';
            updates.candidateSignature = {
                signedAt: new Date().toISOString(),
                signature,
                ipAddress: req.ip
            };

            await prisma.$transaction([
                prisma.application.update({
                    where: { id: offer.applicationId },
                    data: { status: 'hired' }
                }),
                prisma.applicationHistory.create({
                    data: {
                        applicationId: offer.applicationId,
                        toStatus: 'hired',
                        changedBy: userId || 'candidate',
                        changedByType: 'user',
                        notes: 'Candidate accepted offer letter and signed digitally.'
                    }
                })
            ]);
        } else if (response === 'decline') {
            updates.status = 'declined';

            await prisma.applicationHistory.create({
                data: {
                    applicationId: offer.applicationId,
                    toStatus: 'rejected',
                    changedBy: userId || 'candidate',
                    changedByType: 'user',
                    notes: 'Candidate declined the offer letter.'
                }
            });
        } else if (response === 'negotiate') {
            updates.status = 'negotiating';
            updates.negotiationNote = negotiationNote;

            await prisma.applicationHistory.create({
                data: {
                    applicationId: offer.applicationId,
                    toStatus: 'offer_sent',
                    changedBy: userId || 'candidate',
                    changedByType: 'user',
                    notes: `Candidate requested negotiation: ${negotiationNote}`
                }
            });
        }

        const updated = await prisma.offerLetter.update({
            where: { id },
            data: updates
        });

        // ✅ FIXED: Access company email directly (no owner relation)
        const companyEmail = offer.application.jobPosting.company.email;
        
        if (companyEmail) {
            await sendOfferResponseNotification(
                companyEmail,
                offer.application.jobSeekerProfile.fullName,
                offer.position,
                response as 'accept' | 'decline' | 'negotiate',
                negotiationNote
            );
        }

        return res.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Respond to offer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET OFFERS ────────────────────────────────────────────────────
export const getCompanyOffers = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.companyId;
        const { status, limit = '20', page = '1' } = req.query;

        const where: any = {
            application: {
                jobPosting: { companyId }
            }
        };

        if (status && status !== 'all') {
            where.status = status;
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const [offers, total] = await Promise.all([
            prisma.offerLetter.findMany({
                where,
                include: {
                    application: {
                        include: {
                            jobSeekerProfile: {
                                select: {
                                    fullName: true,
                                    email: true,
                                    phone: true,
                                    profilePhotoUrl: true
                                }
                            },
                            jobPosting: {
                                select: {
                                    title: true,
                                    department: true
                                }
                            }
                        }
                    },
                    template: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            prisma.offerLetter.count({ where })
        ]);

        return res.json({
            success: true,
            data: offers,
            pagination: {
                total,
                page: parseInt(page as string),
                limit: take,
                totalPages: Math.ceil(total / take)
            }
        });
    } catch (error: any) {
        console.error('Get offers error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getOfferDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.company?.companyId;
        const userId = req.user?.userId;

        const where: any = { id };

        if (companyId) {
            where.application = {
                jobPosting: { companyId }
            };
        } else if (userId) {
            where.application = {
                jobSeekerProfile: { userId }
            };
        }

        const offer = await prisma.offerLetter.findFirst({
            where,
            include: {
                application: {
                    include: {
                        jobSeekerProfile: true,
                        jobPosting: {
                            include: { company: true }
                        }
                    }
                },
                template: true
            }
        });

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        return res.json({ success: true, data: offer });
    } catch (error: any) {
        console.error('Get offer details error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DOWNLOAD PDF ──────────────────────────────────────────────────
export const downloadOfferPDF = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.company?.companyId;
        const userId = req.user?.userId;

        const where: any = { id };

        if (companyId) {
            where.application = {
                jobPosting: { companyId }
            };
        } else if (userId) {
            where.application = {
                jobSeekerProfile: { userId }
            };
        }

        const offer = await prisma.offerLetter.findFirst({ where });

        if (!offer || !offer.filePath) {
            return res.status(404).json({ success: false, message: 'Offer PDF not found' });
        }

        if (!fs.existsSync(offer.filePath)) {
            return res.status(404).json({ success: false, message: 'PDF file not found on server' });
        }

        res.download(offer.filePath, `offer-letter-${offer.position}.pdf`);
    } catch (error: any) {
        console.error('Download PDF error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// ─── AI TEMPLATE GENERATION ────────────────────────────────────────
export const generateTemplateWithAI = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.companyId;
        const companyName = req.company?.name;

        if (!companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, description } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Template name is required' 
            });
        }

        // Generate template using AI
        const aiResult = await generateOfferLetterTemplate(
            name,
            description,
            companyName
        );

        return res.json({ 
            success: true, 
            data: aiResult,
            message: 'Template generated successfully'
        });
    } catch (error: any) {
        console.error('AI template generation error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to generate template' 
        });
    }
};

// Update createOfferTemplate to optionally use AI
export const createOfferTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.companyId;
        const companyName = req.company?.name;

        if (!companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, content, description, isDefault, useAI } = req.body;

        let finalContent = content;

        // If useAI flag is true and no content provided, generate with AI
        if (useAI && (!content || content === '')) {
            const aiResult = await generateOfferLetterTemplate(
                name,
                description,
                companyName
            );
            finalContent = aiResult.content;
        }

        if (!finalContent) {
            return res.status(400).json({
                success: false,
                message: 'Template content is required'
            });
        }

        if (isDefault) {
            await prisma.offerTemplate.updateMany({
                where: { companyId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const template = await prisma.offerTemplate.create({
            data: {
                companyId,
                name,
                content: finalContent,
                isDefault: isDefault || false
            }
        });

        return res.status(201).json({ success: true, data: template });
    } catch (error: any) {
        console.error('Create template error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const respondToNegotiation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { action, updatedSalary, updatedStartDate, responseNote } = req.body;
        const companyId = req.company?.companyId;

        const offer = await prisma.offerLetter.findFirst({
            where: {
                id,
                application: {
                    jobPosting: { companyId }
                },
                status: 'negotiating'
            },
            include: {
                application: {
                    include: {
                        jobSeekerProfile: true,
                        jobPosting: {
                            include: { company: true }
                        }
                    }
                }
            }
        });

        if (!offer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Offer not found or not in negotiation' 
            });
        }

        if (action === 'accept_negotiation') {
            // Company accepts negotiation - update offer with new terms
            const updated = await prisma.offerLetter.update({
                where: { id },
                data: {
                    salary: updatedSalary || offer.salary,
                    startDate: updatedStartDate ? new Date(updatedStartDate) : offer.startDate,
                    status: 'pending', // Reset to pending for re-signing
                    companySignature: null, // Clear old signature
                    negotiationNote: responseNote || 'Company accepted negotiation with updated terms'
                }
            });

            // Send email to candidate
            await sendOfferLetterEmail(
                offer.application.jobSeekerProfile.email,
                offer.application.jobSeekerProfile.fullName,
                offer.position,
                offer.application.jobPosting.company.name,
                offer.application.jobPosting.company.logoUrl,
                offer.id,
                ''
            );

            return res.json({ 
                success: true, 
                data: updated,
                message: 'Negotiation accepted. Please re-sign the updated offer.' 
            });

        } else if (action === 'reject_negotiation') {
            // Company rejects negotiation
            const updated = await prisma.offerLetter.update({
                where: { id },
                data: {
                    status: 'declined',
                    negotiationNote: responseNote || 'Company declined negotiation request'
                }
            });

            await prisma.application.update({
                where: { id: offer.applicationId },
                data: { status: 'rejected' }
            });

            return res.json({ 
                success: true, 
                data: updated,
                message: 'Negotiation rejected and offer declined.' 
            });
        }

        return res.status(400).json({ 
            success: false, 
            message: 'Invalid action' 
        });

    } catch (error: any) {
        console.error('Respond to negotiation error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};