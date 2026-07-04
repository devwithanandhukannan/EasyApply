import type { Request, Response } from "express";
export declare const SpotJobController: {
    /**
     * 1. POST /spot-jobs
     */
    createSpotJob: (req: Request, res: Response) => Promise<void>;
    /**
     * 2. GET /spot-jobs/invitations
     */
    getJobSeekerInvitations: (req: Request, res: Response) => Promise<void>;
    /**
     * 3. PATCH /spot-jobs/respond/:bookingId
     */
    respondToBooking: (req: Request, res: Response) => Promise<void>;
    /**
     * 4. GET /spot-jobs/company-dashboard
     */
    getCompanySpotDashboard: (req: Request, res: Response) => Promise<void>;
    /**
     * 5. GET /spot-jobs/:id/bookings
     */
    getSpotJobBookings: (req: Request, res: Response) => Promise<void>;
    /**
     * 6. PATCH /spot-jobs/:id/status
     */
    updateSpotStatusByCompany: (req: Request, res: Response) => Promise<void>;
    /**
     * 7. GET /spot-jobs/toggle-status
     */
    getSpotToggleStatus: (req: Request, res: Response) => Promise<void>;
    /**
     * 8. PATCH /spot-jobs/toggle-status
     */
    updateSpotToggleStatus: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=spotJob.controller.d.ts.map