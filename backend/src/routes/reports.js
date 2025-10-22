import express from 'express';
import { generateRevenueReport, generateStockReport, generateUtilizationReport } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['admin', 'accountant']));

router.get('/revenue', generateRevenueReport);
router.get('/stock', generateStockReport);
router.get('/utilization', generateUtilizationReport);

export default router;