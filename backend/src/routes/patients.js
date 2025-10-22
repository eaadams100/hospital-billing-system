import express from 'express';
import { 
  getPatients, 
  getPatient, 
  createPatient, 
  updatePatient, 
  deletePatient 
} from '../controllers/patientController.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validatePatient } from '../middleware/validation.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireStaff);

router.get('/', getPatients);
router.get('/:id', getPatient);
router.post('/', requireRole(['admin', 'accountant']), validatePatient, createPatient);
router.put('/:id', requireRole(['admin', 'accountant']), validatePatient, updatePatient);
router.delete('/:id', requireRole(['admin']), deletePatient);

export default router;