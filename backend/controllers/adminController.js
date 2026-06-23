import bcrypt from 'bcryptjs';
import { getDB } from '../config/db.js';

// Get Admin/Superadmin Analytics (multi-tenant isolated)
export async function getAdminAnalytics(req, res) {
  try {
    const db = getDB();
    const stats = {};
    const companyId = req.user.role === 'superadmin' ? null : req.user.company_id;

    // Filters depending on tenant
    const apptFilter = companyId ? 'WHERE company_id = ?' : '';
    const activeFilter = companyId 
      ? 'WHERE company_id = ? AND check_in_time IS NOT NULL AND check_out_time IS NULL'
      : 'WHERE check_in_time IS NOT NULL AND check_out_time IS NULL';
    const pendingFilter = companyId 
      ? "WHERE company_id = ? AND status = 'pending'"
      : "WHERE status = 'pending'";
    const hostsFilter = companyId 
      ? "WHERE company_id = ? AND role = 'host'"
      : "WHERE role = 'host'";
    const visitorsFilter = companyId
      ? "WHERE id IN (SELECT visitor_id FROM appointments WHERE company_id = ?)"
      : "WHERE role = 'visitor'";

    // Param bindings
    const activeParams = companyId ? [companyId] : [];
    const pendingParams = companyId ? [companyId] : [];
    const hostsParams = companyId ? [companyId] : [];
    const visitorsParams = companyId ? [companyId] : [];

    // Total active visitors (checked in, not checked out)
    const active = await db.get(
      `SELECT COUNT(*) as count FROM appointments ${activeFilter}`,
      activeParams
    );
    stats.activeVisitors = active.count;

    // Total pending appointments
    const pending = await db.get(
      `SELECT COUNT(*) as count FROM appointments ${pendingFilter}`,
      pendingParams
    );
    stats.pendingApprovals = pending.count;

    // Total check-ins today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayQuery = companyId 
      ? 'SELECT COUNT(*) as count FROM appointments WHERE company_id = ? AND check_in_time >= ?'
      : 'SELECT COUNT(*) as count FROM appointments WHERE check_in_time >= ?';
    const todayParams = companyId ? [companyId, startOfToday.toISOString()] : [startOfToday.toISOString()];
    const today = await db.get(todayQuery, todayParams);
    stats.todayCheckIns = today.count;

    // Total hosts registered in tenant scope
    const hosts = await db.get(
      `SELECT COUNT(*) as count FROM users ${hostsFilter}`,
      hostsParams
    );
    stats.totalHosts = hosts.count;

    // Total registered visitors in tenant scope
    const visitors = await db.get(
      `SELECT COUNT(*) as count FROM users ${visitorsFilter}`,
      visitorsParams
    );
    stats.totalRegisteredVisitors = visitors.count;

    // History log: last 10 visits
    const recentQuery = companyId
      ? `SELECT a.*, h.name as host_name 
         FROM appointments a 
         JOIN users h ON a.host_id = h.id 
         WHERE a.company_id = ?
         ORDER BY a.created_at DESC LIMIT 10`
      : `SELECT a.*, h.name as host_name 
         FROM appointments a 
         JOIN users h ON a.host_id = h.id 
         ORDER BY a.created_at DESC LIMIT 10`;
    const recentParams = companyId ? [companyId] : [];
    const recentLogs = await db.all(recentQuery, recentParams);
    stats.recentLogs = recentLogs;

    // Analytics graph data: last 7 days checkins
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayQuery = companyId 
        ? 'SELECT COUNT(*) as count FROM appointments WHERE company_id = ? AND check_in_time BETWEEN ? AND ?'
        : 'SELECT COUNT(*) as count FROM appointments WHERE check_in_time BETWEEN ? AND ?';
      const dayParams = companyId ? [companyId, start.toISOString(), end.toISOString()] : [start.toISOString(), end.toISOString()];

      const count = await db.get(dayQuery, dayParams);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyStats.push({ day: dayName, count: count.count });
    }
    stats.dailyStats = dailyStats;

    res.json(stats);
  } catch (error) {
    console.error('Fetch Admin Analytics Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ----------------------------------------------------
// ROOT SUPERADMIN COMPANY MANAGEMENT ACTIONS
// ----------------------------------------------------

// Create Tenant Company & Initial Admin (Superadmin only)
export async function createCompany(req, res) {
  try {
    const db = getDB();
    const { companyName, companyCode, adminName, adminEmail, adminPassword } = req.body;

    if (!companyName || !companyCode || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Company details and admin credentials are required.' });
    }

    // Check if company already exists
    const existingCompany = await db.get(
      'SELECT id FROM companies WHERE name = ? OR code = ?',
      [companyName, companyCode]
    );
    if (existingCompany) {
      return res.status(400).json({ message: 'Company Name or Code already registered.' });
    }

    // Check if admin email already exists
    const existingEmail = await db.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (existingEmail) {
      return res.status(400).json({ message: 'Admin email already registered as user.' });
    }

    // Insert Company
    const compResult = await db.run(
      'INSERT INTO companies (name, code) VALUES (?, ?)',
      [companyName, companyCode.toLowerCase()]
    );
    const newCompanyId = compResult.lastID;

    // Hash Admin Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create Company Admin User
    await db.run(
      `INSERT INTO users (name, email, password, role, company_id, status)
       VALUES (?, ?, ?, 'admin', ?, 'active')`,
      [adminName, adminEmail, hashedPassword, newCompanyId]
    );

    res.status(201).json({
      message: 'Company and Administrator account created successfully!',
      companyId: newCompanyId
    });
  } catch (error) {
    console.error('Create Company Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get All Companies (Superadmin view)
export async function getCompanies(req, res) {
  try {
    const db = getDB();
    
    // Select companies and count their hosts/admins
    const list = await db.all(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'host') as host_count,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'admin') as admin_count
      FROM companies c
      ORDER BY c.created_at DESC
    `);
    
    res.json(list);
  } catch (error) {
    console.error('Fetch Companies Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
