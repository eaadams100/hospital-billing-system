import { query } from '../config/database.js';

export async function runMigrations() {
  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) CHECK (role IN ('admin', 'staff', 'pharmacist', 'accountant')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `);

  // Patients table
  await query(`
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      dob DATE NOT NULL,
      gender VARCHAR(20) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(255),
      address TEXT,
      insurance_provider VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Services table
  await query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) CHECK (category IN ('lab', 'consultation', 'procedure')) NOT NULL,
      base_price NUMERIC(10,2) NOT NULL,
      cost_price NUMERIC(10,2),
      duration_minutes INTEGER,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Pharmacy items table
  await query(`
    CREATE TABLE IF NOT EXISTS pharmacy_items (
      id SERIAL PRIMARY KEY,
      sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      cost_price NUMERIC(10,2),
      stock_quantity INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 10,
      supplier_id INTEGER,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Accounts table
  await query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id),
      created_by INTEGER REFERENCES users(id),
      status VARCHAR(20) CHECK (status IN ('open', 'settled', 'cancelled')) DEFAULT 'open',
      total_amount NUMERIC(10,2) DEFAULT 0,
      balance NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      settled_at TIMESTAMP
    )
  `);

  // Invoices table
  await query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      account_id INTEGER REFERENCES accounts(id),
      invoice_number VARCHAR(100) UNIQUE NOT NULL,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      due_date DATE NOT NULL,
      subtotal NUMERIC(10,2) NOT NULL,
      discount NUMERIC(10,2) DEFAULT 0,
      total_amount NUMERIC(10,2) NOT NULL,
      paid_amount NUMERIC(10,2) DEFAULT 0,
      payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'partial')) DEFAULT 'pending',
      qr_code_data TEXT,
      pdf_path VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Invoice items table
  await query(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
      item_type VARCHAR(20) CHECK (item_type IN ('service', 'pharmacy')) NOT NULL,
      item_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL,
      line_total NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Payments table
  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER REFERENCES invoices(id),
      paid_by INTEGER REFERENCES users(id),
      amount NUMERIC(10,2) NOT NULL,
      method VARCHAR(20) CHECK (method IN ('cash', 'card', 'insurance')) NOT NULL,
      transaction_ref VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Price history table
  await query(`
    CREATE TABLE IF NOT EXISTS price_history (
      id SERIAL PRIMARY KEY,
      entity_type VARCHAR(20) CHECK (entity_type IN ('service', 'pharmacy')) NOT NULL,
      entity_id INTEGER NOT NULL,
      old_price NUMERIC(10,2) NOT NULL,
      new_price NUMERIC(10,2) NOT NULL,
      changed_by INTEGER REFERENCES users(id),
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reason TEXT NOT NULL,
      effective_date DATE
    )
  `);

  // Scheduled price changes table
  await query(`
    CREATE TABLE IF NOT EXISTS scheduled_price_changes (
      id SERIAL PRIMARY KEY,
      entity_type VARCHAR(20) NOT NULL,
      entity_id INTEGER NOT NULL,
      new_price NUMERIC(10,2) NOT NULL,
      scheduled_for DATE NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      applied_at TIMESTAMP,
      status VARCHAR(20) CHECK (status IN ('pending', 'applied', 'cancelled')) DEFAULT 'pending'
    )
  `);

  // Audit logs table
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(50) NOT NULL,
      target_table VARCHAR(100) NOT NULL,
      target_id INTEGER,
      changes JSONB,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45)
    )
  `);

  // Create indexes
  await query('CREATE INDEX IF NOT EXISTS idx_invoice_number ON invoices(invoice_number)');
  await query('CREATE INDEX IF NOT EXISTS idx_service_code ON services(code)');
  await query('CREATE INDEX IF NOT EXISTS idx_pharmacy_sku ON pharmacy_items(sku)');
  await query('CREATE INDEX IF NOT EXISTS idx_patient_name ON patients(first_name, last_name)');
  await query('CREATE INDEX IF NOT EXISTS idx_scheduled_changes ON scheduled_price_changes(scheduled_for, status)');

  console.log('All migrations completed successfully');
}

// Seed data
export async function seedData() {
  console.log('🌱 Seeding database...');

  // Create users with different roles
  await query(`
    INSERT INTO users (email, password_hash, full_name, role) 
    VALUES 
    ('admin@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin'),
    ('pharmacist@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pharmacy Manager', 'pharmacist'),
    ('accountant@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Chief Accountant', 'accountant'),
    ('staff@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Medical Staff', 'staff')
    ON CONFLICT (email) DO NOTHING
  `);

  // Create sample patients
  await query(`
    INSERT INTO patients (first_name, last_name, dob, gender, phone, email, address, insurance_provider) 
    VALUES 
    ('Kwame', 'Mensah', '1985-03-15', 'Male', '+233201234567', 'kwame.mensah@email.com', '123 Main St, Accra', 'NHIS'),
    ('Ama', 'Serwaa', '1990-07-22', 'Female', '+233244567890', 'ama.serwaa@email.com', '456 Oak Ave, Kumasi', 'Private'),
    ('Kofi', 'Asante', '1978-11-30', 'Male', '+233277890123', 'kofi.asante@email.com', '789 Pine Rd, Takoradi', 'NHIS'),
    ('Esi', 'Bonsu', '1995-12-10', 'Female', '+233254321098', 'esi.bonsu@email.com', '321 Cedar Ln, Tamale', 'Private'),
    ('Yaw', 'Owusu', '1982-06-25', 'Male', '+233287654321', 'yaw.owusu@email.com', '654 Birch St, Cape Coast', 'NHIS')
    ON CONFLICT DO NOTHING
  `);

  // Create sample services
  await query(`
    INSERT INTO services (code, name, description, category, base_price, cost_price, duration_minutes) 
    VALUES 
    ('CONS-001', 'General Consultation', 'Routine doctor consultation', 'consultation', 50.00, 20.00, 30),
    ('CONS-002', 'Specialist Consultation', 'Specialist doctor consultation', 'consultation', 100.00, 40.00, 45),
    ('LAB-001', 'Blood Test', 'Complete blood count test', 'lab', 25.00, 10.00, 15),
    ('LAB-002', 'Urine Test', 'Complete urine analysis', 'lab', 20.00, 8.00, 10),
    ('LAB-003', 'Malaria Test', 'Rapid diagnostic test for malaria', 'lab', 15.00, 5.00, 5),
    ('PROC-001', 'Minor Surgery', 'Minor surgical procedure', 'procedure', 200.00, 80.00, 60),
    ('PROC-002', 'Dressing Change', 'Wound dressing change', 'procedure', 30.00, 12.00, 15),
    ('PROC-003', 'Injection', 'Therapeutic injection', 'procedure', 10.00, 3.00, 5)
    ON CONFLICT (code) DO NOTHING
  `);

  // Create sample pharmacy items
  await query(`
    INSERT INTO pharmacy_items (sku, name, unit, description, price, cost_price, stock_quantity, reorder_level) 
    VALUES 
    ('MED-001', 'Paracetamol 500mg', 'tablets', 'Pain relief tablets', 5.00, 2.00, 100, 20),
    ('MED-002', 'Amoxicillin 250mg', 'capsules', 'Antibiotic capsules', 15.00, 6.00, 50, 10),
    ('MED-003', 'Vitamin C 1000mg', 'tablets', 'Immune booster tablets', 8.00, 3.00, 75, 15),
    ('MED-004', 'Ibuprofen 400mg', 'tablets', 'Anti-inflammatory tablets', 7.00, 2.50, 60, 12),
    ('MED-005', 'Cetirizine 10mg', 'tablets', 'Antihistamine tablets', 6.00, 2.00, 80, 16),
    ('MED-006', 'Metformin 500mg', 'tablets', 'Diabetes medication', 12.00, 4.00, 40, 8),
    ('MED-007', 'Amlodipine 5mg', 'tablets', 'Blood pressure medication', 10.00, 3.50, 35, 7),
    ('MED-008', 'Salbutamol Inhaler', 'puffs', 'Asthma relief inhaler', 25.00, 10.00, 20, 5)
    ON CONFLICT (sku) DO NOTHING
  `);

  console.log('✅ Database seeded successfully');
}