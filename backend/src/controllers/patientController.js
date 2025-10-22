import { Patient, AuditLog } from '../models/index.js';

export const getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await Patient.findAll(parseInt(page), parseInt(limit), search);
    
    res.json(result);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(parseInt(req.params.id));
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

export const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      target_table: 'patients',
      target_id: patient.id,
      changes: req.body,
      ip_address: req.ip
    });
    
    res.status(201).json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Patient with similar details already exists' });
    }
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.update(parseInt(req.params.id), req.body);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'patients',
      target_id: patient.id,
      changes: req.body,
      ip_address: req.ip
    });
    
    res.json(patient);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(parseInt(req.params.id));
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    await Patient.delete(parseInt(req.params.id));
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'DELETE',
      target_table: 'patients',
      target_id: parseInt(req.params.id),
      changes: { deleted_patient: patient },
      ip_address: req.ip
    });
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};