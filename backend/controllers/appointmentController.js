import { getDB } from '../config/db.js';

export async function createAppointment(req, res) {
  try {
    const db = getDB();
    const { hostId, purpose, scheduledStart, visitorName, visitorEmail, visitorPhone, visitorCompany } = req.body;

    if (!hostId || !purpose || !scheduledStart) {
      return res.status(400).json({ message: 'Host ID, purpose, and scheduled start time are required' });
    }

    const host = await db.get('SELECT name FROM users WHERE id = ? AND role = "host"', [hostId]);
    if (!host) {
      return res.status(400).json({ message: 'Selected host not found or invalid' });
    }

    let finalVisitorId = null;
    let finalVisitorName = visitorName;
    let finalVisitorEmail = visitorEmail;
    let finalVisitorPhone = visitorPhone;
    let finalVisitorCompany = visitorCompany;

    if (req.user.role === 'visitor') {
      finalVisitorId = req.user.id;
      const visitorProfile = await db.get('SELECT name, email, phone, company FROM users WHERE id = ?', [req.user.id]);
      finalVisitorName = visitorProfile.name;
      finalVisitorEmail = visitorProfile.email;
      finalVisitorPhone = visitorProfile.phone;
      finalVisitorCompany = visitorProfile.company;
    } else {
      if (!finalVisitorName || !finalVisitorEmail) {
        return res.status(400).json({ message: 'Visitor name and email are required for manual booking' });
      }
    }

    const qrToken = `VMS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
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

    // Notify Host
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
}

export async function getAppointments(req, res) {
  try {
    const db = getDB();
    let appointments;

    if (req.user.role === 'admin') {
      appointments = await db.all('SELECT * FROM appointments ORDER BY scheduled_start DESC');
    } else if (req.user.role === 'host') {
      appointments = await db.all(
        'SELECT * FROM appointments WHERE host_id = ? ORDER BY scheduled_start DESC',
        [req.user.id]
      );
    } else {
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
}

export async function updateAppointmentStatus(req, res) {
  try {
    const db = getDB();
    const { status } = req.body;
    const { id } = req.params;

    if (!['approved', 'declined', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (req.user.role === 'host' && appointment.host_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: not your appointment' });
    }
    if (req.user.role === 'visitor' && appointment.visitor_id !== req.user.id && status !== 'cancelled') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);

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
}

export async function scanQrCode(req, res) {
  try {
    const db = getDB();
    const { qrToken, action } = req.body;

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

      await db.run(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          appointment.host_id,
          '🔔 Visitor Arrived!',
          `Your visitor, ${appointment.visitor_name} (${appointment.visitor_company || 'No Company'}), has checked in.`
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
}

export async function checkInAppointment(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const now = new Date().toISOString();
    await db.run('UPDATE appointments SET check_in_time = ?, status = "approved" WHERE id = ?', [now, id]);

    await db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        appointment.host_id,
        '🔔 Visitor Arrived!',
        `Your visitor, ${appointment.visitor_name} (${appointment.visitor_company || 'No Company'}), has checked in.`
      ]
    );

    res.json({ message: 'Check-in recorded successfully' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function checkOutAppointment(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const now = new Date().toISOString();
    await db.run('UPDATE appointments SET check_out_time = ? WHERE id = ?', [now, id]);

    await db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        appointment.host_id,
        '👋 Visitor Departed',
        `Your visitor, ${appointment.visitor_name}, has checked out.`
      ]
    );

    res.json({ message: 'Check-out recorded successfully' });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
