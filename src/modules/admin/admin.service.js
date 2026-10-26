const { db } = require('../../shared/db/connection');

class AdminService {
  getDashboardStats() {
    const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const totalStudents = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get().count;
    const totalRecruiters = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'recruiter'").get().count;
    const totalOpportunities = db.prepare('SELECT COUNT(*) AS count FROM opportunities').get().count;
    const totalApplications = db.prepare('SELECT COUNT(*) AS count FROM applications').get().count;
    const totalDocuments = db.prepare('SELECT COUNT(*) AS count FROM documents').get().count;

    const recentUsers = db.prepare(`
      SELECT id, name, email, role, status, createdAt
      FROM users
      ORDER BY createdAt DESC
      LIMIT 10
    `).all();

    const recentOpportunities = db.prepare(`
      SELECT o.id, o.title, o.status, o.deadline, r.companyName
      FROM opportunities o
      JOIN recruiter_profiles r ON o.recruiterId = r.id
      ORDER BY o.createdAt DESC
      LIMIT 10
    `).all();

    return {
      totalUsers,
      totalStudents,
      totalRecruiters,
      totalOpportunities,
      totalApplications,
      totalDocuments,
      recentUsers,
      recentOpportunities,
      systemStatus: 'Operational'
    };
  }
}

module.exports = new AdminService();
