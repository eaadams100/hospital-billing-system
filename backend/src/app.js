import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { runMigrations, seedData } from './utils/database.js';
import { loadUser } from './middleware/auth.js';

// Import all routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import patientRoutes from './routes/patients.js';
import serviceRoutes from './routes/services.js';
import pharmacyRoutes from './routes/pharmacy.js';
import invoiceRoutes from './routes/invoices.js';
import priceRoutes from './routes/prices.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'hospital-billing-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// Load user middleware
app.use(loadUser);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🏥 Hospital Billing System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      services: '/api/services',
      pharmacy: '/api/pharmacy',
      invoices: '/api/invoices',
      prices: '/api/prices',
      reports: '/api/reports',
      users: '/api/users'
    },
    documentation: 'See API docs for available endpoints and usage'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    user: req.user ? req.user.email : 'Not authenticated',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Running database migrations...');
    await runMigrations();
    console.log('🔄 Seeding database...');
    await seedData();
    
    app.listen(PORT, () => {
      console.log('\n🚀 Hospital Billing System Backend Started!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 API Root: http://localhost:${PORT}/`);
      console.log('\n👤 Sample Login Credentials:');
      console.log('   Admin: admin@hospital.com / password');
      console.log('   Pharmacist: pharmacist@hospital.com / password');
      console.log('   Accountant: accountant@hospital.com / password');
      console.log('   Staff: staff@hospital.com / password');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();