import express from 'express';
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;