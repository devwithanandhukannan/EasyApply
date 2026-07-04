interface EmailAttachment {
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
}
interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
}
/**
 * Shared wrapper layout to fire SMTP transactional emails safely
 */
export declare const sendEmail: ({ to, subject, html, attachments }: SendEmailOptions) => Promise<void>;
/**
 * Legacy wrapper for backwards compatibility
 */
export declare const sendMail: ({ to, subject, html, attachments }: SendEmailOptions) => Promise<void>;
/**
 * Explicit helper to format and dispatch the unique registration/verification token link
 */
export declare const sendVerificationEmail: (email: string, token: string) => Promise<void>;
export declare const sendTeamInviteEmail: (email: string, inviteLink: string, role: string, companyName: string) => Promise<void>;
/**
 * 🎯 NEW: Send offer letter email with PDF attachment and tracking pixel
 */
export declare const sendOfferLetterEmail: (candidateEmail: string, candidateName: string, position: string, companyName: string, companyLogoUrl: string | null, offerId: string, pdfPath: string) => Promise<void>;
/**
 * 🎯 NEW: Notify company when candidate responds to offer
 */
export declare const sendOfferResponseNotification: (companyEmail: string, candidateName: string, position: string, response: "accept" | "decline" | "negotiate", negotiationNote?: string) => Promise<void>;
export {};
//# sourceMappingURL=email.d.ts.map