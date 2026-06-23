import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vms_super_secret_key_123456';

// Register User (e.g. self-registering visitors)
export async function registerUser(req, res) {
  try {
    const db = getDB();
    const { name, email, password, role, phone, company, department, companyId } = req.body;

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

    // Insert User (visitors have companyId = null, hosts/admins belong to a company)
    const result = await db.run(
      'INSERT INTO users (name, email, password, role, company_id, phone, company, department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, companyId || null, phone || null, company || null, department || null, 'active']
    );

    res.status(201).json({
      message: 'Registration successful',
      userId: result.lastID
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Login User (with active check)
export async function loginUser(req, res) {
  try {
    const db = getDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find User
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check invitation/activation status
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: `Account is not active. Status: ${user.status}. Please accept your invitation first.` 
      });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, company_id: user.company_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Fetch company name if bound to one
    let companyName = null;
    if (user.company_id) {
      const companyObj = await db.get('SELECT name FROM companies WHERE id = ?', [user.company_id]);
      companyName = companyObj?.name;
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        company: user.company || companyName,
        company_id: user.company_id,
        department: user.department,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get Profile
export async function getMe(req, res) {
  try {
    const db = getDB();
    const user = await db.get(
      'SELECT id, name, email, role, company_id, phone, company, department, status FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get Hosts (filtered by companyId for multi-tenancy)
export async function getHosts(req, res) {
  try {
    const db = getDB();
    const { companyId } = req.query;

    let hosts;
    if (companyId) {
      hosts = await db.all(
        'SELECT id, name, email, department, phone FROM users WHERE role = "host" AND company_id = ? AND status = "active"',
        [companyId]
      );
    } else if (req.user && req.user.company_id) {
      // If logged in, default to the user's company
      hosts = await db.all(
        'SELECT id, name, email, department, phone, status FROM users WHERE role = "host" AND company_id = ?',
        [req.user.company_id]
      );
    } else {
      hosts = await db.all('SELECT id, name, email, department, phone FROM users WHERE role = "host" AND status = "active"');
    }

    res.json(hosts);
  } catch (error) {
    console.error('Fetch hosts list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Bulk Invite Employees (Company Admin only)
export async function bulkInviteEmployees(req, res) {
  try {
    const db = getDB();
    const { employees } = req.body; // Array of { name, email, phone, department }
    const companyId = req.user.company_id;

    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: No company assigned' });
    }

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ message: 'A list of employees is required' });
    }

    const companyObj = await db.get('SELECT name FROM companies WHERE id = ?', [companyId]);
    const companyName = companyObj.name;

    const results = [];
    const dummyPasswordHash = await bcrypt.hash('TEMP_INVITE_PWD_123', 10); // temporary password until accepted

    for (const emp of employees) {
      const { name, email, phone, department } = emp;
      if (!name || !email || !phone) continue;

      // Check if email already in use
      const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        results.push({ email, status: 'failed', reason: 'Email already registered' });
        continue;
      }

      // Generate random invite token
      const inviteToken = `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // Insert user in 'pending_invite' state
      const userRes = await db.run(
        `INSERT INTO users (name, email, password, role, company_id, phone, department, status, invite_token)
         VALUES (?, ?, ?, 'host', ?, ?, ?, 'pending_invite', ?)`,
        [name, email, dummyPasswordHash, companyId, phone, department || null, inviteToken]
      );

      // Create simulated SMS log
      const inviteLink = `http://localhost:5173/invite/${inviteToken}`;
      const message = `Hello ${name}, you've been added as a host at ${companyName}. Click here to accept or reject this invitation: ${inviteLink}`;
      
      await db.run(
        'INSERT INTO sms_logs (phone, message, token, status) VALUES (?, ?, ?, ?)',
        [phone, message, inviteToken, 'sent']
      );

      results.push({ email, status: 'invited', token: inviteToken });
    }

    res.status(200).json({
      message: 'Invitations processed successfully',
      results
    });
  } catch (error) {
    console.error('Bulk Invite Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Fetch Invitation details (public endpoint)
export async function getInvitation(req, res) {
  try {
    const db = getDB();
    const { token } = req.params;

    const user = await db.get(
      `SELECT u.name, u.email, u.phone, u.department, u.status, c.name as company_name 
       FROM users u
       JOIN companies c ON u.company_id = c.id
       WHERE u.invite_token = ?`,
      [token]
    );

    if (!user) {
      return res.status(404).json({ message: 'Invitation not found or invalid token' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get Invitation Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Respond to invitation (public endpoint)
export async function respondInvitation(req, res) {
  try {
    const db = getDB();
    const { token } = req.params;
    const { action, password } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid response action' });
    }

    const user = await db.get('SELECT id, status FROM users WHERE invite_token = ?', [token]);
    if (!user) {
      return res.status(404).json({ message: 'Invitation not found or invalid token' });
    }

    if (user.status !== 'pending_invite') {
      return res.status(400).json({ message: `Invitation has already been responded to. Status: ${user.status}` });
    }

    if (action === 'approve') {
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password is required and must be at least 6 characters' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await db.run(
        "UPDATE users SET password = ?, status = 'active', invite_token = NULL WHERE id = ?",
        [hashedPassword, user.id]
      );
      await db.run("UPDATE sms_logs SET status = 'accepted' WHERE token = ?", [token]);

      res.json({ message: 'Invitation accepted! Your account is now active. You can log in.' });
    } else {
      // Reject invite
      await db.run(
        "UPDATE users SET status = 'rejected' WHERE id = ?",
        [user.id]
      );
      await db.run("UPDATE sms_logs SET status = 'rejected' WHERE token = ?", [token]);

      res.json({ message: 'Invitation declined.' });
    }
  } catch (error) {
    console.error('Respond Invitation Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Fetch Public Company Registry (for visitors selection)
export async function getCompaniesPublic(req, res) {
  try {
    const db = getDB();
    const list = await db.all('SELECT id, name, code FROM companies ORDER BY name ASC');
    res.json(list);
  } catch (error) {
    console.error('Get Companies Public Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Fetch Simulated SMS logs (sandbox environment widget data)
export async function getSmsGatewayLogs(req, res) {
  try {
    const db = getDB();
    const logs = await db.all('SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 50');
    res.json(logs);
  } catch (error) {
    console.error('Fetch SMS Logs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
