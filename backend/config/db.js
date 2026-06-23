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

  // Seed default users if empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const salt = await bcrypt.genSalt(10);
    
    const adminPassword = await bcrypt.hash('admin123', salt);
    const hostPassword = await bcrypt.hash('host123', salt);
    const visitorPassword = await bcrypt.hash('visitor123', salt);

    await db.run(
      'INSERT INTO users (name, email, password, role, phone, company) VALUES (?, ?, ?, ?, ?, ?)',
      ['System Administrator', 'admin@vms.com', adminPassword, 'admin', '+1234567890', 'VMS HQ']
    );

    await db.run(
      'INSERT INTO users (name, email, password, role, phone, company, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Sarah Jenkins', 'sarah@vms.com', hostPassword, 'host', '+1987654321', 'VMS HQ', 'Human Resources']
    );

    await db.run(
      'INSERT INTO users (name, email, password, role, phone, company, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['David Miller', 'david@vms.com', hostPassword, 'host', '+1122334455', 'VMS HQ', 'Engineering']
    );

    await db.run(
      'INSERT INTO users (name, email, password, role, phone, company) VALUES (?, ?, ?, ?, ?, ?)',
      ['John Doe', 'visitor@vms.com', visitorPassword, 'visitor', '+15550199', 'Tech Corp']
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
