import { Router } from 'express';
import { authenticateCompany, authenticateToken, optionalAuth } from '../middleware/auth.middleware.ts';
import {
  createWalkInRoom, listWalkInRooms, getWalkInRoomByCode,
  joinWalkInQueue, getQueueByRoom, callNextCandidate,
  updateQueueEntryStatus, batchUpdateQueueEntryStatus, updateRoomStatus, getSeekerQueuePosition,
  listActiveWalkInRooms, getMyWalkInQueues, leaveWalkInQueue,
  updateRoomSettings, updateQueueEntryPriority
} from '../controllers/walkIn.controller.ts';
import {
  listDiscoverableSeekers, getDiscoverableSeekerProfile
} from '../controllers/seekerDiscovery.controller.ts';

import multer from 'multer';

const router = Router();

const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid CV file format. Please upload a PDF, DOCX, DOC, or Image file.'));
    }
  },
});

const handleCvUpload = (req: any, res: any, next: any) => {
  cvUpload.single('cv')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    next();
  });
};

import { requirePermission } from '../middleware/permission.middleware.ts';

// ─── WALK-IN ROOMS ────────────────────────────────────────────────────────────

// Public / Seeker — list open & paused walk-in rooms
router.get('/active-rooms', optionalAuth, listActiveWalkInRooms);

// Public / Seeker — look up a specific room by code
router.get('/rooms/:code/info', optionalAuth, getWalkInRoomByCode);

// Company — manage rooms
router.post('/rooms', authenticateCompany, requirePermission('walkin', 'create'), createWalkInRoom);
router.get('/rooms', authenticateCompany, requirePermission('walkin', 'read'), listWalkInRooms);
router.get('/rooms/:code/queue', authenticateCompany, requirePermission('walkin', 'read'), getQueueByRoom);
router.post('/rooms/:code/call-next', authenticateCompany, requirePermission('walkin', 'manage'), callNextCandidate);
router.put('/rooms/:code/status', authenticateCompany, requirePermission('walkin', 'manage'), updateRoomStatus);
router.put('/rooms/:code/settings', authenticateCompany, requirePermission('walkin', 'manage'), updateRoomSettings);
router.put('/queue/batch-status', authenticateCompany, requirePermission('walkin', 'manage'), batchUpdateQueueEntryStatus);
router.put('/queue/:entryId/status', authenticateCompany, requirePermission('walkin', 'manage'), updateQueueEntryStatus);
router.put('/queue/:entryId/priority', authenticateCompany, requirePermission('walkin', 'manage'), updateQueueEntryPriority);

// Seeker — join, check position, list my queues, leave queue
router.get('/my-queues', authenticateToken, getMyWalkInQueues);
router.post('/rooms/:code/join', authenticateToken, handleCvUpload, joinWalkInQueue);
router.get('/rooms/:code/position', authenticateToken, getSeekerQueuePosition);
router.post('/rooms/:code/leave', authenticateToken, leaveWalkInQueue);

// ─── SEEKER DISCOVERY ─────────────────────────────────────────────────────────

router.get('/discovery/seekers', authenticateCompany, requirePermission('discovery', 'read'), listDiscoverableSeekers);
router.get('/discovery/seekers/:profileId', authenticateCompany, requirePermission('discovery', 'read'), getDiscoverableSeekerProfile);

export default router;
