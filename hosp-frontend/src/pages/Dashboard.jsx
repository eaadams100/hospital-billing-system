import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const [kpis, setKpis] = useState({
    todayRevenue: 0,
    outstandingBalance: 0,
    lowStockItems: 0,
    pendingInvoices: 0
  });

  const [recentInvoices, setRecentInvoices] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch real data from API
      const [invoicesResponse, pharmacyResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/invoices?page=1&limit=5'),
        axios.get('http://localhost:5000/api/pharmacy/low-stock')
      ]);

      // Calculate KPIs from real data
      const invoices = invoicesResponse.data.invoices || [];
      const lowStockItems = pharmacyResponse.data.length || 0;
      
      const todayRevenue = invoices
        .filter(inv => new Date(inv.issued_at).toDateString() === new Date().toDateString())
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);

      const outstandingBalance = invoices
        .filter(inv => inv.payment_status !== 'paid')
        .reduce((sum, inv) => sum + (parseFloat(inv.total_amount) - parseFloat(inv.paid_amount)), 0);

      setKpis({
        todayRevenue,
        outstandingBalance,
        lowStockItems,
        pendingInvoices: invoices.filter(inv => inv.payment_status === 'pending').length
      });

      setRecentInvoices(invoices.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data if API fails
      setKpis({
        todayRevenue: 12540.00,
        outstandingBalance: 45230.00,
        lowStockItems: 8,
        pendingInvoices: 12
      });

      setRecentInvoices([
        {
          id: 1,
          invoice_number: 'HOSP-202401-0001',
          patient_name: 'Kwame Mensah',
          amount: 450.00,
          status: 'paid',
          issued_at: '2024-01-15'
        },
        {
          id: 2,
          invoice_number: 'HOSP-202401-0002',
          patient_name: 'Ama Serwaa',
          amount: 320.00,
          status: 'pending',
          issued_at: '2024-01-15'
        }
      ]);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GH');
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: '#7f8c8d' }}>
          Welcome back, <strong>{user?.full_name}</strong>! 
          You are logged in as <strong>{user?.role}</strong>.
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Today's Revenue</div>
          <div className="kpi-value" style={{ color: '#27ae60' }}>
            {formatCurrency(kpis.todayRevenue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-label">Outstanding Balance</div>
          <div className="kpi-value" style={{ color: '#e74c3c' }}>
            {formatCurrency(kpis.outstandingBalance)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
            {kpis.pendingInvoices} pending invoices
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-label">Low Stock Items</div>
          <div className="kpi-value" style={{ color: '#f39c12' }}>
            {kpis.lowStockItems}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
            Needs immediate attention
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-label">Pending Invoices</div>
          <div className="kpi-value" style={{ color: '#3498db' }}>
            {kpis.pendingInvoices}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
            Awaiting payment
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="data-table" style={{ marginTop: '2rem' }}>
        <div className="table-header">
          <h3>Recent Invoices</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.invoice_number}</td>
                  <td>{invoice.patient_name || `${invoice.first_name} ${invoice.last_name}`}</td>
                  <td>{formatCurrency(invoice.amount || invoice.total_amount)}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      background: invoice.status === 'paid' ? '#d4edda' : 
                                  invoice.status === 'partial' ? '#fff3cd' : '#f8d7da',
                      color: invoice.status === 'paid' ? '#155724' : 
                            invoice.status === 'partial' ? '#856404' : '#721c24'
                    }}>
                      {invoice.payment_status || invoice.status}
                    </span>
                  </td>
                  <td>{formatDate(invoice.issued_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;