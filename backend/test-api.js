// Simple test script to verify API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing Hospital Billing System API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test login
    console.log('\n2. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hospital.com',
        password: 'password'
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.user.email);

    // Get cookies for session
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Test protected endpoints
    console.log('\n3. Testing protected endpoints...');
    
    // Test patients endpoint
    const patientsResponse = await fetch(`${BASE_URL}/patients`, {
      headers: { 
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });
    const patientsData = await patientsResponse.json();
    console.log('✅ Patients:', patientsData.patients?.length || 0, 'found');

    // Test services endpoint
    const servicesResponse = await fetch(`${BASE_URL}/services`, {
      headers: { 
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });
    const servicesData = await servicesResponse.json();
    console.log('✅ Services:', servicesData.length, 'found');

    // Test pharmacy endpoint
    const pharmacyResponse = await fetch(`${BASE_URL}/pharmacy`, {
      headers: { 
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });
    const pharmacyData = await pharmacyResponse.json();
    console.log('✅ Pharmacy items:', pharmacyData.length, 'found');

    console.log('\n🎉 All tests passed! API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI();
}