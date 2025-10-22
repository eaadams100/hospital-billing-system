import express from 'express';
import multer from 'multer';
import { 
  getScheduledChanges, 
  createScheduledChange, 
  cancelScheduledChange,
  processBulkPriceUpdate,
  confirmBulkPriceUpdate
} from '../controllers/priceController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);
router.use(requireRole(['admin']));

// Scheduled price changes
router.get('/scheduled', getScheduledChanges);
router.post('/scheduled', createScheduledChange);
router.delete('/scheduled/:id', cancelScheduledChange);

// Bulk price updates
router.post('/bulk-upload', upload.single('csvFile'), processBulkPriceUpdate);
router.post('/bulk-confirm', confirmBulkPriceUpdate);

export default router;