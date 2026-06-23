import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vms_super_secret_key_123456';

// Middleware
app.use(cors());
app.use(express.json());

// SQLite Database setup
let db;
async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin', 'host', 'visitor'
      phone TEXT,
      company TEXT,
      department TEXT, -- For hosts
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id INTEGER,
      visitor_name TEXT NOT NULL,
      visitor_email TEXT NOT NULL,
      visitor_phone TEXT,
      visitor_company TEXT,
      host_id INTEGER NOT NULL,
      host_name TEXT NOT NULL,
      purpose TEXT NOT NULL,
      scheduled_start DATETIME NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'declined', 'cancelled'
      check_in_time DATETIME,
      check_out_time DATETIME,
      qr_code_token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (visitor_id) REFERENCES users (id),
      FOREIGN KEY (host_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0, -- 0 for false, 1 for true
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  console.log('Database tables verified/created.');

  // Seed default users if empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const salt = await bcrypt.genSalt(10);
    
    const adminPassword = await bcrypt.hash('admin123', salt);
    const hostPassword = await bcrypt.hash('host123', salt);
    const visitorPassword = await bcrypt.hash('visitor123', salt);

    // Add Admin
    await db.run(
      'INSERT INTO users (name, email, password, role, phone, company) VALUES (?, ?, ?, ?, ?, ?)',
      ['System Administrator', 'admin@vms.com', adminPassword, 'admin', '+1234567890', 'VMS HQ']
    );

    // Add Host 1 (HR Manager)
    await db.run(
      'INSERT INTO users (name, email, password, role, phone, company, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Sarah Jenkins', 'sarah@vms.com', hostPassword, 'host', '+1987654321', 'VMS HQ', 'Human Resources']
    );

    // Add Host 2 (Tech Lead)
    await db.run(
      'INSERT INTO users (name, email, password, role, phone, company, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['David Miller', 'david@vms.com', hostPassword, 'host', '+1122334455', 'VMS HQ', 'Engineering']
    );

    // Add Visitor
    await db.run(
      'INSERT INTO users (name, email, password, role, phone, company) VALUES (?, ?, ?, ?, ?, ?)',
      ['John Doe', 'visitor@vms.com', visitorPassword, 'visitor', '+15550199', 'Tech Corp']
    );

    console.log('Default seed users inserted.');
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Check role middleware helper
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, company, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const validRoles = ['admin', 'host', 'visitor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email address already in use' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert User
    const result = await db.run(
      'INSERT INTO users (name, email, password, role, phone, company, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, phone || null, company || null, department || null]
    );

    res.status(201).json({
      message: 'Registration successful',
      userId: result.lastID
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find User
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        company: user.company,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, role, phone, company, department FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get hosts list (for visitor appointments booking screen)
app.get('/api/users/hosts', authenticateToken, async (req, res) => {
  try {
    const hosts = await db.all('SELECT id, name, email, department, phone FROM users WHERE role = "host"');
    res.json(hosts);
  } catch (error) {
    console.error('Fetch hosts list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// APPOINTMENTS ENDPOINTS
// ==========================================

// Create Appointment / Book a Visit
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { hostId, purpose, scheduledStart, visitorName, visitorEmail, visitorPhone, visitorCompany } = req.body;

    if (!hostId || !purpose || !scheduledStart) {
      return res.status(400).json({ message: 'Host ID, purpose, and scheduled start time are required' });
    }

    // Get Host Details
    const host = await db.get('SELECT name FROM users WHERE id = ? AND role = "host"', [hostId]);
    if (!host) {
      return res.status(400).json({ message: 'Selected host not found or invalid' });
    }

    // Set visitor info depending on who is booking
    let finalVisitorId = null;
    let finalVisitorName = visitorName;
    let finalVisitorEmail = visitorEmail;
    let finalVisitorPhone = visitorPhone;
    let finalVisitorCompany = visitorCompany;

    if (req.user.role === 'visitor') {
      finalVisitorId = req.user.id;
      // Get visitor user profile details if not explicitly provided
      const visitorProfile = await db.get('SELECT name, email, phone, company FROM users WHERE id = ?', [req.user.id]);
      finalVisitorName = visitorProfile.name;
      finalVisitorEmail = visitorProfile.email;
      finalVisitorPhone = visitorProfile.phone;
      finalVisitorCompany = visitorProfile.company;
    } else {
      // Admin or Host booking manually for someone
      if (!finalVisitorName || !finalVisitorEmail) {
        return res.status(400).json({ message: 'Visitor name and email are required for manual booking' });
      }
    }

    // Create custom unique QR code token
    const qrToken = `VMS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // Insert Appointment (visitor bookings start as pending, host/admin bookings can be approved immediately)
    const status = req.user.role === 'visitor' ? 'pending' : 'approved';

    const result = await db.run(
      `INSERT INTO appointments 
      (visitor_id, visitor_name, visitor_email, visitor_phone, visitor_company, host_id, host_name, purpose, scheduled_start, status, qr_code_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalVisitorId,
        finalVisitorName,
        finalVisitorEmail,
        finalVisitorPhone || null,
        finalVisitorCompany || null,
        hostId,
        host.name,
        purpose,
        scheduledStart,
        status,
        qrToken
      ]
    );

    // Notify Host of a new pending/approved appointment
    await db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        hostId,
        'New Visit Scheduled',
        `${finalVisitorName} has scheduled a visit with you on ${new Date(scheduledStart).toLocaleString()} (${status}).`
      ]
    );

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointmentId: result.lastID,
      qrToken,
      status
    });
  } catch (error) {
    console.error('Book Appointment Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch Appointments (Filtered by Role)
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    let appointments;

    if (req.user.role === 'admin') {
      appointments = await db.all('SELECT * FROM appointments ORDER BY scheduled_start DESC');
    } else if (req.user.role === 'host') {
      appointments = await db.all(
        'SELECT * FROM appointments WHERE host_id = ? ORDER BY scheduled_start DESC',
        [req.user.id]
      );
    } else {
      // Visitor
      appointments = await db.all(
        'SELECT * FROM appointments WHERE visitor_id = ? OR visitor_email = ? ORDER BY scheduled_start DESC',
        [req.user.id, req.user.email]
      );
    }

    res.json(appointments);
  } catch (error) {
    console.error('Fetch Appointments Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Appointment Status (Approval Workflow)
app.patch('/api/appointments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['approved', 'declined', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Access control: Host can edit their own, Admin can edit any
    if (req.user.role === 'host' && appointment.host_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: not your appointment' });
    }
    if (req.user.role === 'visitor' && appointment.visitor_id !== req.user.id && status !== 'cancelled') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);

    // Send notifications
    if (appointment.visitor_id) {
      await db.run(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          appointment.visitor_id,
          `Appointment ${status.toUpperCase()}`,
          `Your appointment with ${appointment.host_name} has been ${status}.`
        ]
      );
    }

    res.json({ message: `Appointment successfully ${status}` });
  } catch (error) {
    console.error('Update Appointment Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// CHECK-IN / CHECK-OUT (QR CODE VERIFICATION)
// ==========================================

// QR Scan check-in / check-out matching token
app.post('/api/appointments/scan-qr', authenticateToken, async (req, res) => {
  try {
    const { qrToken, action } = req.body; // action: 'check-in' or 'check-out'

    if (!qrToken || !action) {
      return res.status(400).json({ message: 'QR code token and action are required' });
    }

    const appointment = await db.get('SELECT * FROM appointments WHERE qr_code_token = ?', [qrToken]);
    if (!appointment) {
      return res.status(404).json({ message: 'Invalid QR code: Appointment not found' });
    }

    const now = new Date().toISOString();

    if (action === 'check-in') {
      if (appointment.status !== 'approved') {
        return res.status(400).json({ message: `Cannot check-in. Visit status is currently '${appointment.status}'.` });
      }
      if (appointment.check_in_time) {
        return res.status(400).json({ message: 'Visitor is already checked in.' });
      }

      await db.run(
        'UPDATE appointments SET check_in_time = ?, check_out_time = NULL WHERE id = ?',
        [now, appointment.id]
      );

      // Trigger Host Notification
      await db.run(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          appointment.host_id,
          '🔔 Visitor Arrived!',
          `Your visitor, ${appointment.visitor_name} (${appointment.visitor_company || 'No Company'}), has just checked in and is waiting for you.`
        ]
      );

      return res.json({
        message: 'Check-in successful! Host has been notified.',
        appointment: { ...appointment, check_in_time: now }
      });
    } else if (action === 'check-out') {
      if (!appointment.check_in_time) {
        return res.status(400).json({ message: 'Cannot check-out. Visitor has not checked in yet.' });
      }
      if (appointment.check_out_time) {
        return res.status(400).json({ message: 'Visitor is already checked out.' });
      }

      await db.run('UPDATE appointments SET check_out_time = ? WHERE id = ?', [now, appointment.id]);

      // Notify Host
      await db.run(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          appointment.host_id,
          '👋 Visitor Departed',
          `Your visitor, ${appointment.visitor_name}, has checked out.`
        ]
      );

      return res.json({
        message: 'Check-out successful! Thank you for visiting.',
        appointment: { ...appointment, check_out_time: now }
      });
    } else {
      res.status(400).json({ message: 'Invalid scan action' });
    }
  } catch (error) {
    console.error('QR Scan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fast Check-In / Check-Out manually by ID (for reception desk or hosts)
app.post('/api/appointments/:id/check-in', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const now = new Date().toISOString();
    await db.run('UPDATE appointments SET check_in_time = ?, status = "approved" WHERE id = ?', [now, id]);

    // Send host notification
    await db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        appointment.host_id,
        '🔔 Visitor Arrived!',
        `Your visitor, ${appointment.visitor_name} (${appointment.visitor_company || 'No Company'}), has been checked in.`
      ]
    );

    res.json({ message: 'Check-in recorded' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/appointments/:id/check-out', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const now = new Date().toISOString();
    await db.run('UPDATE appointments SET check_out_time = ? WHERE id = ?', [now, id]);

    // Send host notification
    await db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        appointment.host_id,
        '👋 Visitor Departed',
        `Your visitor, ${appointment.visitor_name}, has checked out.`
      ]
    );

    res.json({ message: 'Check-out recorded' });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// NOTIFICATIONS ENDPOINTS
// ==========================================

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all as read
app.post('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// ANALYTICS & DASHBOARD ENDPOINTS
// ==========================================

app.get('/api/admin/analytics', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = {};

    // Total active visitors (checked in, not checked out)
    const active = await db.get(
      'SELECT COUNT(*) as count FROM appointments WHERE check_in_time IS NOT NULL AND check_out_time IS NULL'
    );
    stats.activeVisitors = active.count;

    // Total pending appointments
    const pending = await db.get("SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'");
    stats.pendingApprovals = pending.count;

    // Total check-ins today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = await db.get(
      'SELECT COUNT(*) as count FROM appointments WHERE check_in_time >= ?',
      [startOfToday.toISOString()]
    );
    stats.todayCheckIns = today.count;

    // Total hosts registered
    const hosts = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'host'");
    stats.totalHosts = hosts.count;

    // Total registered visitors
    const visitors = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'visitor'");
    stats.totalRegisteredVisitors = visitors.count;

    // History log: last 10 visits
    const recentLogs = await db.all(`
      SELECT a.*, h.name as host_name 
      FROM appointments a 
      JOIN users h ON a.host_id = h.id 
      ORDER BY a.created_at DESC LIMIT 10
    `);
    stats.recentLogs = recentLogs;

    // Analytics graph data: aggregate by day for the last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const count = await db.get(
        'SELECT COUNT(*) as count FROM appointments WHERE check_in_time BETWEEN ? AND ?',
        [start.toISOString(), end.toISOString()]
      );

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyStats.push({ day: dayName, count: count.count });
    }
    stats.dailyStats = dailyStats;

    res.json(stats);
  } catch (error) {
    console.error('Fetch Admin Analytics Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Startup Server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
