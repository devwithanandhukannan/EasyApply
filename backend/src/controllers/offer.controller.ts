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
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `offer-${offer.id}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    return new Promise((resolve, reject) => {
        // Strict formal layout boundaries
        const doc = new PDFDocument({ 
            margin: 54, 
            size: 'A4',
            bufferPages: true
        });
        
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        const companyName = offer.application.jobPosting.company.name;
        const logoUrl = offer.application.jobPosting.company.logoUrl;
        const pageWidth = doc.page.width - 108; 

        // ─── WATERMARK ─────────────────────────────────────────
        doc.save();
        doc.fontSize(50)
           .font('Helvetica-Bold')
           .fillColor('#000000', 0.02)
           .text(companyName.toUpperCase(), 54, 380, { 
               align: 'center',
               width: pageWidth
           });
        doc.restore();

        // ─── HEADER COMPANY BRANDING ───────────────────────────
        let headerY = 54;
        if (logoUrl && fs.existsSync(logoUrl)) {
            try {
                doc.image(logoUrl, 54, headerY, { width: 60 });
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#111111').text(companyName, 130, headerY + 5);
                doc.font('Helvetica').fontSize(8.5).fillColor('#555555')
                   .text(offer.location || 'Corporate Office', 130, headerY + 20)
                   .text(offer.application.jobPosting.company.email || '', 130, headerY + 32);
            } catch (e) {
                renderTextHeader(doc, companyName, offer, pageWidth);
            }
        } else {
            renderTextHeader(doc, companyName, offer, pageWidth);
        }

        // Horizontal Hairline Divider
        doc.moveTo(54, 105)
           .lineTo(54 + pageWidth, 105)
           .strokeColor('#e5e7eb')
           .lineWidth(1)
           .stroke();

        // ─── DOCUMENT METADATA BLOCK ───────────────────────────
        doc.font('Helvetica').fontSize(9).fillColor('#4b5563');
        doc.text(`Offer Ref: ${offer.id.substring(0, 8).toUpperCase()}`, 54, 115);
        doc.text(`Date: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        })}`, 54, 115, { align: 'right', width: pageWidth });

        // ─── RECIPIENT INFORMATION ────────────────────────────
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#1f2937').text('TO:', 54, 135);
        
        const profile = offer.application.jobSeekerProfile;
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text(profile.fullName, 54, 148);
        
        doc.font('Helvetica').fontSize(9).fillColor('#4b5563')
           .text(profile.email, 54, 161)
           .text(profile.phone || '', 54, 172);

        // ─── SALUTATION & OPENING ──────────────────────────────
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#111111').text(`Dear ${profile.fullName},`, 54, 195);
        
        doc.font('Helvetica').fontSize(9.5).fillColor('#374151').text(
            `We are pleased to extend this formal offer of employment for the position of ${offer.position} with ${companyName}. ` +
            `We were incredibly impressed by your qualifications and technical profile during our review cycles, and we believe your skills will make an excellent addition to our team.`,
            54, 210, { align: 'justify', width: pageWidth, lineGap: 2 }
        );

        // ─── STRUCTURED COMPENSATION & DETAILS GRID ───────────
        const tableTop = 260;
        const tableData = [
            ['Position Title', offer.position],
            ['Department', offer.department || 'Operations / Core Engineering'],
            ['Employment Type', offer.employmentType.replace('_', ' ').toUpperCase()],
            ['Compensation Base', new Intl.NumberFormat('en-US', { style: 'currency', currency: offer.currency }).format(Number(offer.salary))],
            ['Official Commencement Date', new Date(offer.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            ['Primary Deployment Location', offer.location || 'As specified by HR rules']
        ];

        // Header Label Panel
        doc.rect(54, tableTop, pageWidth, 18).fill('#f9fafb');
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#374151').text('OFFER SUMMARY & PARAMETERS', 62, tableTop + 5);
        
        let currentY = tableTop + 18;
        tableData.forEach((row) => {
            doc.moveTo(54, currentY + 18)
               .lineTo(54 + pageWidth, currentY + 18)
               .strokeColor('#f3f4f6')
               .lineWidth(1)
               .stroke();

            doc.font('Helvetica').fontSize(8.5).fillColor('#6b7280').text(row[0], 64, currentY + 5);
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#111111').text(row[1], 240, currentY + 5, { width: pageWidth - 200, align: 'left' });
            
            currentY += 18;
        });

        // ─── TERMS AND CONDITIONS SECTION (FIXED MARGIN BUG) ───
        let termsTop = currentY + 15;
        // FIXED: Added absolute X value (54) so text doesn't flow on the right margin side!
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1f2937').text('Standard Employment Contingencies:', 54, termsTop);
        
        const terms = [
            'This execution offer remains highly contingent on clear backgrounds, records, and verification passes.',
            'You will be bound to fulfill responsibilities under corporate non-disclosure agreements.',
            'Standard statutory performance appraisals, protection policies, and perks scale inline with company rules.',
            'This offer is dynamically active and must be processed within 7 sequential calendar days from issuance.'
        ];

        let termY = termsTop + 14;
        terms.forEach((term, idx) => {
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#4b5563').text(`${idx + 1}.`, 54, termY, { width: 15 });
            doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563').text(term, 70, termY, { width: pageWidth - 20, align: 'justify' });
            termY += 13;
        });

        // Closing Statement
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#374151').text(
            'To indicate formal confirmation of acceptance, please digitally execute your authorization signature below.',
            54, termY + 8, { width: pageWidth }
        );

        // ─── SIGNATURE HANDLING BLOCK (FIXED BLANK PAGE JUMPS) ───
        const signatureBlockY = doc.page.height - 115; 

        // Left Alignment: Company Sign-off Block
        doc.font('Helvetica').fontSize(8.5).fillColor('#111111').text('Sincerely,', 54, signatureBlockY - 15);
        
        // FIXED: Extract image signatures checking for raw buffers, files, or base64 strings safely
        if (offer.companySignature?.signature) {
            try {
                const compImg = parseSignatureImage(offer.companySignature.signature);
                if (compImg) doc.image(compImg, 54, signatureBlockY - 3, { width: 100, height: 30 });
            } catch (e) { console.error("Company sign rendering error: ", e); }
        }
        doc.moveTo(54, signatureBlockY + 30).lineTo(194, signatureBlockY + 30).strokeColor('#9ca3af').lineWidth(1).stroke();
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1f2937').text('Authorized Signatory', 54, signatureBlockY + 36);
        doc.font('Helvetica').fontSize(7.5).fillColor('#6b7280').text(
            offer.companySignature ? `Verified: ${new Date(offer.companySignature.signedAt).toLocaleDateString()}` : 'Awaiting Corporate Stamp',
            54, signatureBlockY + 46
        );

        // Right Alignment: Candidate Acceptance Block
        const rightSignX = 54 + pageWidth - 140;
        if (offer.candidateSignature?.signature) {
            try {
                const candImg = parseSignatureImage(offer.candidateSignature.signature);
                if (candImg) doc.image(candImg, rightSignX, signatureBlockY - 3, { width: 100, height: 30 });
            } catch (e) { console.error("Candidate sign rendering error: ", e); }
        }
        doc.moveTo(rightSignX, signatureBlockY + 30).lineTo(54 + pageWidth, signatureBlockY + 30).strokeColor('#9ca3af').lineWidth(1).stroke();
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1f2937').text('Candidate Acceptance Signature', rightSignX, signatureBlockY + 36);
        doc.font('Helvetica').fontSize(7.5).fillColor('#6b7280').text(
            offer.candidateSignature ? `Digitally Signed: ${new Date(offer.candidateSignature.signedAt).toLocaleDateString()}` : 'Awaiting Signatures',
            rightSignX, signatureBlockY + 46
        );

        // ─── FOOTER METRIC WRAPPER ─────────────────────────────
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.font('Helvetica').fontSize(7.5).fillColor('#9ca3af');
            doc.moveTo(54, doc.page.height - 40).lineTo(54 + pageWidth, doc.page.height - 40).strokeColor('#f3f4f6').stroke();
            doc.text(`${companyName} • Private & Confidential Employment Proposal`, 54, doc.page.height - 32);
            doc.text(`Page ${i + 1} of ${pageCount}`, 54, doc.page.height - 32, { align: 'right', width: pageWidth });
        }

        doc.end();
        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
    });
};

// HELPER: Base64/Buffer/Path string normalizer for raw schema image data mapping
const parseSignatureImage = (sigData: any): Buffer | string | null => {
    if (typeof sigData === 'string') {
        if (sigData.startsWith('data:image')) {
            const base64Data = sigData.split(';base64,').pop();
            return Buffer.from(base64Data || '', 'base64');
        }
        if (fs.existsSync(sigData)) {
            return sigData;
        }
    }
    if (Buffer.isBuffer(sigData)) return sigData;
    return null;
};

const renderTextHeader = (doc: any, companyName: string, offer: any, pageWidth: number) => {
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111').text(companyName.toUpperCase(), 54, 54);
    doc.font('Helvetica').fontSize(8.5).fillColor('#6b7280')
       .text(`${offer.location || 'Corporate Office'}`, 54, 70)
       .text(`${offer.application.jobPosting.company.email || ''}`, 54, 80);
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


// ... existing imports ...

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