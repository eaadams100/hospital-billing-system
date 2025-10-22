import express from 'express';
import { 
  getServices, 
  getService, 
  createService, 
  updateService, 
  updateServicePrice,
  getServicePriceHistory
} from '../controllers/serviceController.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateService } from '../middleware/validation.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireStaff);

router.get('/', getServices);
router.get('/:id', getService);
router.get('/:id/price-history', getServicePriceHistory);
router.post('/', requireRole(['admin']), validateService, createService);
router.put('/:id', requireRole(['admin']), validateService, updateService);
router.patch('/:id/price', requireRole(['admin']), updateServicePrice);

export default router;