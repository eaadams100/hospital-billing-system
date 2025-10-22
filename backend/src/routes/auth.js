import express from 'express';
import { 
  login, 
  logout, 
  getCurrentUser, 
  changePassword 
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);
router.post('/change-password', requireAuth, changePassword);

export default router;