import express from 'express';
import { 
  getPharmacyItems, 
  getPharmacyItem, 
  getLowStockItems,
  createPharmacyItem, 
  updatePharmacyItem,
  updateStock,
  updatePharmacyPrice,
  getPharmacyPriceHistory
} from '../controllers/pharmacyController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validatePharmacyItem } from '../middleware/validation.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole(['admin', 'staff', 'pharmacist', 'accountant']), getPharmacyItems);
router.get('/low-stock', requireRole(['admin', 'pharmacist']), getLowStockItems);
router.get('/:id', requireRole(['admin', 'staff', 'pharmacist', 'accountant']), getPharmacyItem);
router.get('/:id/price-history', requireRole(['admin', 'pharmacist']), getPharmacyPriceHistory);
router.post('/', requireRole(['admin', 'pharmacist']), validatePharmacyItem, createPharmacyItem);
router.put('/:id', requireRole(['admin', 'pharmacist']), validatePharmacyItem, updatePharmacyItem);
router.patch('/:id/stock', requireRole(['admin', 'pharmacist']), updateStock);
router.patch('/:id/price', requireRole(['admin', 'pharmacist']), updatePharmacyPrice);

export default router;