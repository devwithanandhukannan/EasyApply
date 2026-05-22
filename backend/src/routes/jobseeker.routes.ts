import express from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.ts';
import { 
  authenticateToken
} from '../middleware/auth.middleware.ts';
import { upload } from '../utils/multer.ts';

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', upload.single('profileImage'), authenticateToken, updateProfile);

export default router;