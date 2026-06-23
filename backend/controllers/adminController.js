import { getDB } from '../config/db.js';

export async function getAdminAnalytics(req, res) {
  try {
    const db = getDB();
    const stats = {};

    const active = await db.get(
      'SELECT COUNT(*) as count FROM appointments WHERE check_in_time IS NOT NULL AND check_out_time IS NULL'
    );
    stats.activeVisitors = active.count;

    const pending = await db.get("SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'");
    stats.pendingApprovals = pending.count;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = await db.get(
      'SELECT COUNT(*) as count FROM appointments WHERE check_in_time >= ?',
      [startOfToday.toISOString()]
    );
    stats.todayCheckIns = today.count;

    const hosts = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'host'");
    stats.totalHosts = hosts.count;

    const visitors = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'visitor'");
    stats.totalRegisteredVisitors = visitors.count;

    const recentLogs = await db.all(`
      SELECT a.*, h.name as host_name 
      FROM appointments a 
      JOIN users h ON a.host_id = h.id 
      ORDER BY a.created_at DESC LIMIT 10
    `);
    stats.recentLogs = recentLogs;

    // Last 7 days statistics
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
}
