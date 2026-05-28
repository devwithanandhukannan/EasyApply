import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { OfferLetterStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { sendOfferLetterEmail, sendOfferResponseNotification } from '../utils/email.ts';

interface AuthRequest extends Request {
  user?: { userId: string; email?: string };
  company?: { companyId: string; name: string };
}

// ─── TEMPLATE MANAGEMENT ───────────────────────────────────────────

export const createOfferTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, content, isDefault } = req.body;

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
        content,
        isDefault: isDefault || false
      }
    });

    return res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    console.error('Create template error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

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
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('OFFER LETTER', { align: 'center' });
    doc.moveDown();

    // Convert HTML to plain text for PDF (basic implementation)
    const plainText = content.replace(/<[^>]*>/g, '');
    doc.fontSize(11).text(plainText, { align: 'justify' });

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

export const createOfferLetter = async (req: AuthRequest, res: Response) => {
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
    if (templateId && !customContent) {
      const template = await prisma.offerTemplate.findFirst({
        where: { id: templateId, companyId }
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
    const offer = await prisma.$transaction(async (tx) => {
      const newOffer = await tx.offerLetter.create({
        data: {
          applicationId,
          templateId,
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

      // Add to history
      await tx.applicationHistory.create({
        data: {
          applicationId,
          status: 'offer_sent',
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
            jobPosting: {
              include: {
                company: {
                  include: {
                    owner: {
                      select: { email: true }
                    }
                  }
                }
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
            status: 'hired',
            notes: 'Candidate accepted offer letter and signed digitally.'
          }
        })
      ]);
    } else if (response === 'decline') {
      updates.status = 'declined';
      
      await prisma.applicationHistory.create({
        data: {
          applicationId: offer.applicationId,
          status: 'rejected',
          notes: 'Candidate declined the offer letter.'
        }
      });
    } else if (response === 'negotiate') {
      updates.status = 'negotiating';
      updates.negotiationNote = negotiationNote;

      await prisma.applicationHistory.create({
        data: {
          applicationId: offer.applicationId,
          status: 'offer_sent',
          notes: `Candidate requested negotiation: ${negotiationNote}`
        }
      });
    }

    const updated = await prisma.offerLetter.update({
      where: { id },
      data: updates
    });

    // 🎯 NEW: Notify company of candidate response
    const companyEmail = offer.application.jobPosting.company.owner.email;
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