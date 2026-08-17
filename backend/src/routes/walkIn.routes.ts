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

const router = Router();

// ─── WALK-IN ROOMS ────────────────────────────────────────────────────────────

// Public / Seeker — list open & paused walk-in rooms
router.get('/active-rooms', optionalAuth, listActiveWalkInRooms);

// Public / Seeker — look up a specific room by code
router.get('/rooms/:code/info', optionalAuth, getWalkInRoomByCode);

// Company — manage rooms
router.post('/rooms', authenticateCompany, createWalkInRoom);
router.get('/rooms', authenticateCompany, listWalkInRooms);
router.get('/rooms/:code/queue', authenticateCompany, getQueueByRoom);
router.post('/rooms/:code/call-next', authenticateCompany, callNextCandidate);
router.put('/rooms/:code/status', authenticateCompany, updateRoomStatus);
router.put('/rooms/:code/settings', authenticateCompany, updateRoomSettings);
router.put('/queue/batch-status', authenticateCompany, batchUpdateQueueEntryStatus);
router.put('/queue/:entryId/status', authenticateCompany, updateQueueEntryStatus);
router.put('/queue/:entryId/priority', authenticateCompany, updateQueueEntryPriority);

// Seeker — join, check position, list my queues, leave queue
router.get('/my-queues', authenticateToken, getMyWalkInQueues);
router.post('/rooms/:code/join', authenticateToken, joinWalkInQueue);
router.get('/rooms/:code/position', authenticateToken, getSeekerQueuePosition);
router.post('/rooms/:code/leave', authenticateToken, leaveWalkInQueue);

// ─── SEEKER DISCOVERY ─────────────────────────────────────────────────────────

router.get('/discovery/seekers', authenticateCompany, listDiscoverableSeekers);
router.get('/discovery/seekers/:profileId', authenticateCompany, getDiscoverableSeekerProfile);

export default router;
