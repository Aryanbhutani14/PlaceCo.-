const { db } = require('../../shared/db/connection');

class RecruiterService {
  getProfile(userId) {
    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(userId);
    if (!user) {
      const error = new Error('Recruiter not found.');
      error.statusCode = 404;
      throw error;
    }

    let profile = db.prepare('SELECT * FROM recruiter_profiles WHERE userId = ?').get(userId);
    if (!profile) {
      db.prepare(`
        INSERT INTO recruiter_profiles (userId, companyName, recruiterName, email, phone, description)
        VALUES (?, 'Company Name', ?, ?, '', '')
      `).run(userId, user.name, user.email);
      profile = db.prepare('SELECT * FROM recruiter_profiles WHERE userId = ?').get(userId);
    }

    return profile;
  }

  updateProfile(userId, profileData) {
    const { companyName, recruiterName, phone, description } = profileData;

    const profile = this.getProfile(userId);

    db.prepare(`
      UPDATE recruiter_profiles
      SET companyName = ?, recruiterName = ?, phone = ?, description = ?
      WHERE id = ?
    `).run(
      companyName ? companyName.trim() : profile.companyName,
      recruiterName ? recruiterName.trim() : profile.recruiterName,
      phone ? phone.trim() : '',
      description ? description.trim() : '',
      profile.id
    );

    if (recruiterName && recruiterName.trim()) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(recruiterName.trim(), userId);
    }

    return this.getProfile(userId);
  }

  createOpportunity(userId, oppData) {
    const profile = this.getProfile(userId);

    const {
      title,
      description,
      skills,
      minimumCgpa,
      eligibleBranch,
      location,
      employmentType,
      deadline,
      ctc,
      openings
    } = oppData;

    const insert = db.prepare(`
      INSERT INTO opportunities (
        recruiterId, title, description, skills, minimumCgpa, eligibleBranch,
        location, employmentType, deadline, ctc, openings, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `);

    const result = insert.run(
      profile.id,
      title.trim(),
      description.trim(),
      skills.trim(),
      parseFloat(minimumCgpa),
      eligibleBranch.trim(),
      location.trim(),
      employmentType.trim(),
      deadline.trim(),
      ctc ? ctc.trim() : 'As per industry standards',
      openings ? parseInt(openings, 10) : 1
    );

    return this.getOpportunityById(result.lastInsertRowid, userId);
  }

  getOpportunities(userId) {
    const profile = this.getProfile(userId);

    return db.prepare(`
      SELECT o.*,
             (SELECT COUNT(*) FROM applications WHERE opportunityId = o.id) AS totalApplicants
      FROM opportunities o
      WHERE o.recruiterId = ?
      ORDER BY o.createdAt DESC
    `).all(profile.id);
  }

  getOpportunityById(opportunityId, userId = null) {
    const opp = db.prepare(`
      SELECT o.*, r.companyName, r.recruiterName, r.email AS recruiterEmail,
             (SELECT COUNT(*) FROM applications WHERE opportunityId = o.id) AS totalApplicants
      FROM opportunities o
      JOIN recruiter_profiles r ON o.recruiterId = r.id
      WHERE o.id = ?
    `).get(opportunityId);

    if (!opp) {
      const error = new Error('Placement opportunity not found.');
      error.statusCode = 404;
      throw error;
    }

    if (userId) {
      const profile = this.getProfile(userId);
      if (opp.recruiterId !== profile.id) {
        const error = new Error('You do not have permission to view or modify this opportunity.');
        error.statusCode = 403;
        throw error;
      }
    }

    return opp;
  }

  updateOpportunity(userId, opportunityId, updateData) {
    // Check ownership
    this.getOpportunityById(opportunityId, userId);

    const {
      title,
      description,
      skills,
      minimumCgpa,
      eligibleBranch,
      location,
      employmentType,
      deadline,
      ctc,
      openings,
      status
    } = updateData;

    db.prepare(`
      UPDATE opportunities
      SET title = ?, description = ?, skills = ?, minimumCgpa = ?, eligibleBranch = ?,
          location = ?, employmentType = ?, deadline = ?, ctc = ?, openings = ?, status = ?
      WHERE id = ?
    `).run(
      title.trim(),
      description.trim(),
      skills.trim(),
      parseFloat(minimumCgpa),
      eligibleBranch.trim(),
      location.trim(),
      employmentType.trim(),
      deadline.trim(),
      ctc ? ctc.trim() : 'As per industry standards',
      openings ? parseInt(openings, 10) : 1,
      status || 'open',
      opportunityId
    );

    return this.getOpportunityById(opportunityId, userId);
  }

  deleteOpportunity(userId, opportunityId) {
    this.getOpportunityById(opportunityId, userId);

    db.prepare('DELETE FROM opportunities WHERE id = ?').run(opportunityId);
    return true;
  }

  getApplicantsForOpportunity(userId, opportunityId) {
    this.getOpportunityById(opportunityId, userId);

    return db.prepare(`
      SELECT a.id AS applicationId, a.status AS applicationStatus, a.applicationDate,
             s.id AS studentProfileId, s.studentId, s.phone, s.course, s.branch, s.year, s.cgpa, s.skills, s.graduationYear,
             u.name AS studentName, u.email AS studentEmail,
             (SELECT filePath FROM documents WHERE studentId = s.id AND documentType = 'resume' ORDER BY uploadedAt DESC LIMIT 1) AS resumePath
      FROM applications a
      JOIN student_profiles s ON a.studentId = s.id
      JOIN users u ON s.userId = u.id
      WHERE a.opportunityId = ?
      ORDER BY a.applicationDate DESC
    `).all(opportunityId);
  }

  getAllApplicants(userId) {
    const profile = this.getProfile(userId);

    return db.prepare(`
      SELECT a.id AS applicationId, a.status AS applicationStatus, a.applicationDate,
             o.id AS opportunityId, o.title AS opportunityTitle,
             s.id AS studentProfileId, s.studentId, s.phone, s.course, s.branch, s.year, s.cgpa, s.skills, s.graduationYear,
             u.name AS studentName, u.email AS studentEmail,
             (SELECT filePath FROM documents WHERE studentId = s.id AND documentType = 'resume' ORDER BY uploadedAt DESC LIMIT 1) AS resumePath
      FROM applications a
      JOIN opportunities o ON a.opportunityId = o.id
      JOIN student_profiles s ON a.studentId = s.id
      JOIN users u ON s.userId = u.id
      WHERE o.recruiterId = ?
      ORDER BY a.applicationDate DESC
    `).all(profile.id);
  }

  getDashboardStats(userId) {
    const profile = this.getProfile(userId);
    const opportunities = this.getOpportunities(userId);
    const applicants = this.getAllApplicants(userId);

    const activeOpportunities = opportunities.filter(o => o.status === 'open').length;

    return {
      profile,
      totalOpportunities: opportunities.length,
      activeOpportunities,
      totalApplicants: applicants.length,
      recentOpportunities: opportunities.slice(0, 5),
      recentApplicants: applicants.slice(0, 5)
    };
  }
}

module.exports = new RecruiterService();
