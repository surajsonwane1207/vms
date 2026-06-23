import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function connectDB() {
  if (db) return db;

  db = await open({
    filename: path.join(__dirname, '..', 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Schema check migration: drop tables if schema needs updates (e.g. missing company_id)
  let migrateNeeded = false;
  try {
    await db.get('SELECT company_id FROM users LIMIT 1');
  } catch (e) {
    migrateNeeded = true;
  }

  if (migrateNeeded) {
    console.log('[SQLite DB] Schema upgrade needed. Dropping old tables to recreate multi-tenant structures...');
    await db.exec(`
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS appointments;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS companies;
      DROP TABLE IF EXISTS sms_logs;
    `);
  }

  // Create Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL, -- 'superadmin', 'admin', 'host', 'visitor'
      company_id INTEGER, -- Null for superadmin/visitor
      status TEXT DEFAULT 'active', -- 'active', 'pending_invite', 'rejected'
      invite_token TEXT UNIQUE,
      phone TEXT,
      company TEXT, -- For visitors' company name
      department TEXT, -- For hosts
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
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
      FOREIGN KEY (company_id) REFERENCES companies(id),
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

    CREATE TABLE IF NOT EXISTS sms_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      token TEXT NOT NULL,
      status TEXT DEFAULT 'sent', -- 'sent', 'clicked', 'accepted', 'rejected'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[SQLite DB] Multi-tenant schemas verified.');

  // Seed default values if empty
  const companyCount = await db.get('SELECT COUNT(*) as count FROM companies');
  if (companyCount.count === 0) {
    console.log('[SQLite DB] Seeding multi-tenant test data...');

    // Seed companies
    await db.run("INSERT INTO companies (name, code) VALUES ('VMS HQ', 'vms')"); // ID: 1
    await db.run("INSERT INTO companies (name, code) VALUES ('Google India', 'google')"); // ID: 2
    await db.run("INSERT INTO companies (name, code) VALUES ('Microsoft India', 'msft')"); // ID: 3

    const salt = await bcrypt.genSalt(10);
    const superPassword = await bcrypt.hash('admin123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const hostPassword = await bcrypt.hash('host123', salt);
    const visitorPassword = await bcrypt.hash('visitor123', salt);

    // Root Super Admin (Global scope)
    await db.run(
      'INSERT INTO users (name, email, password, role, company_id, phone) VALUES (?, ?, ?, ?, ?, ?)',
      ['Root Administrator', 'superadmin@vms.com', superPassword, 'superadmin', null, '+100000000']
    );

    // VMS HQ Admin
    await db.run(
      'INSERT INTO users (name, email, password, role, company_id, phone, company) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['VMS HQ Admin', 'admin@vms.com', adminPassword, 'admin', 1, '+111111111', 'VMS HQ']
    );

    // Sarah Jenkins (Host at VMS HQ)
    await db.run(
      'INSERT INTO users (name, email, password, role, company_id, phone, company, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Sarah Jenkins', 'sarah@vms.com', hostPassword, 'host', 1, '+1987654321', 'VMS HQ', 'Human Resources']
    );

    // Google India Admin
    await db.run(
      'INSERT INTO users (name, email, password, role, company_id, phone, company) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Google Admin', 'googleadmin@google.com', adminPassword, 'admin', 2, '+222222222', 'Google India']
    );

    // David Miller (Host at Google India)
    await db.run(
      'INSERT INTO users (name, email, password, role, company_id, phone, company, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['David Miller', 'david@vms.com', hostPassword, 'host', 2, '+1122334455', 'Google India', 'Engineering']
    );

    // Default Visitor
    await db.run(
      'INSERT INTO users (name, email, password, role, company_id, phone, company) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['John Doe', 'visitor@vms.com', visitorPassword, 'visitor', null, '+15550199', 'Tech Corp']
    );

    console.log('[SQLite DB] Seed users inserted successfully.');
  }

  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Please call connectDB first.');
  }
  return db;
}
