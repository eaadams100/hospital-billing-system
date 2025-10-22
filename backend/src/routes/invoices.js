import express from 'express';
import { 
  getInvoices, 
  getInvoice, 
  createInvoice, 
  recordPayment,
  getInvoiceByNumber
} from '../controllers/invoiceController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateInvoice } from '../middleware/validation.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole(['admin', 'accountant', 'staff']), getInvoices);
router.get('/number/:number', requireRole(['admin', 'accountant', 'staff']), getInvoiceByNumber);
router.get('/:id', requireRole(['admin', 'accountant', 'staff']), getInvoice);
router.post('/', requireRole(['admin', 'accountant']), validateInvoice, createInvoice);
router.post('/:id/payments', requireRole(['admin', 'accountant']), recordPayment);

export default router;