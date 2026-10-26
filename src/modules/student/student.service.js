const { db } = require('../../shared/db/connection');
const { checkStudentEligibility } = require('../../shared/validation/validators');
const path = require('path');
const fs = require('fs');

class StudentService {
  getProfile(userId) {
    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(userId);
    if (!user) {
      const error = new Error('Student user not found.');
      error.statusCode = 404;
      throw error;
    }

    let profile = db.prepare('SELECT * FROM student_profiles WHERE userId = ?').get(userId);
    if (!profile) {
      db.prepare(`
        INSERT INTO student_profiles (userId, studentId, phone, course, branch, year, cgpa, skills, graduationYear)
        VALUES (?, '', '', 'B.Tech', 'CSE', 1, 0.0, '', 2026)
      `).run(userId);
      profile = db.prepare('SELECT * FROM student_profiles WHERE userId = ?').get(userId);
    }

    return {
      ...profile,
      name: user.name,
      email: user.email
    };
  }

  updateProfile(userId, updateData) {
    const { name, studentId, phone, course, branch, year, cgpa, skills, graduationYear } = updateData;

    if (studentId) {
      const existing = db.prepare(`
        SELECT id FROM student_profiles WHERE studentId = ? AND userId != ?
      `).get(studentId.trim(), userId);

      if (existing) {
        const error = new Error('Student ID / Enrollment Number is already taken by another student.');
        error.statusCode = 409;
        throw error;
      }
    }

    const transaction = db.transaction(() => {
      if (name && name.trim()) {
        db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), userId);
      }

      const profile = db.prepare('SELECT id FROM student_profiles WHERE userId = ?').get(userId);

      if (profile) {
        db.prepare(`
          UPDATE student_profiles
          SET studentId = ?, phone = ?, course = ?, branch = ?, year = ?, cgpa = ?, skills = ?, graduationYear = ?
          WHERE userId = ?
        `).run(
          studentId ? studentId.trim() : '',
          phone ? phone.trim() : '',
          course ? course.trim() : '',
          branch ? branch.trim() : '',
          parseInt(year, 10),
          parseFloat(cgpa),
          skills ? skills.trim() : '',
          parseInt(graduationYear, 10),
          userId
        );
      } else {
        db.prepare(`
          INSERT INTO student_profiles (userId, studentId, phone, course, branch, year, cgpa, skills, graduationYear)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          studentId ? studentId.trim() : '',
          phone ? phone.trim() : '',
          course ? course.trim() : '',
          branch ? branch.trim() : '',
          parseInt(year, 10),
          parseFloat(cgpa),
          skills ? skills.trim() : '',
          parseInt(graduationYear, 10)
        );
      }
    });

    transaction();
    return this.getProfile(userId);
  }

  getDocuments(userId) {
    const profile = db.prepare('SELECT id FROM student_profiles WHERE userId = ?').get(userId);
    if (!profile) return [];

    return db.prepare(`
      SELECT id, studentId, documentType, fileName, filePath, fileSize, uploadedAt
      FROM documents
      WHERE studentId = ?
      ORDER BY uploadedAt DESC
    `).all(profile.id);
  }

  addDocument(userId, documentType, file) {
    let profile = db.prepare('SELECT id FROM student_profiles WHERE userId = ?').get(userId);
    if (!profile) {
      db.prepare(`
        INSERT INTO student_profiles (userId, studentId, course, branch, year, cgpa, skills, graduationYear)
        VALUES (?, '', 'B.Tech', 'CSE', 1, 0.0, '', 2026)
      `).run(userId);
      profile = db.prepare('SELECT id FROM student_profiles WHERE userId = ?').get(userId);
    }

    const relativePath = `/uploads/${path.basename(file.path)}`;

    const insertDoc = db.prepare(`
      INSERT INTO documents (studentId, documentType, fileName, filePath, fileSize)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertDoc.run(
      profile.id,
      documentType || 'other',
      file.originalname,
      relativePath,
      file.size
    );

    return db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
  }

  deleteDocument(userId, documentId) {
    const profile = db.prepare('SELECT id FROM student_profiles WHERE userId = ?').get(userId);
    if (!profile) {
      const error = new Error('Student profile not found.');
      error.statusCode = 404;
      throw error;
    }

    const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND studentId = ?').get(documentId, profile.id);
    if (!doc) {
      const error = new Error('Document not found or does not belong to you.');
      error.statusCode = 404;
      throw error;
    }

    const absolutePath = path.join(__dirname, '../../../public', doc.filePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.warn('Could not delete physical file:', err.message);
      }
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
    return true;
  }

  // --- Module 4: Opportunities & Application ---

  getOpportunities(userId) {
    const studentProfile = this.getProfile(userId);

    const opportunities = db.prepare(`
      SELECT o.*, r.companyName, r.recruiterName, r.email AS recruiterEmail,
             (SELECT a.id FROM applications a WHERE a.opportunityId = o.id AND a.studentId = ?) AS appliedApplicationId,
             (SELECT a.status FROM applications a WHERE a.opportunityId = o.id AND a.studentId = ?) AS applicationStatus,
             (SELECT a.applicationDate FROM applications a WHERE a.opportunityId = o.id AND a.studentId = ?) AS appliedAt
      FROM opportunities o
      JOIN recruiter_profiles r ON o.recruiterId = r.id
      ORDER BY o.createdAt DESC
    `).all(studentProfile.id, studentProfile.id, studentProfile.id);

    return opportunities.map(opp => {
      const eligibility = checkStudentEligibility(studentProfile, opp);
      return {
        ...opp,
        hasApplied: Boolean(opp.appliedApplicationId),
        isEligible: eligibility.isEligible,
        ineligibilityReasons: eligibility.reasons
      };
    });
  }

  getOpportunityById(userId, opportunityId) {
    const studentProfile = this.getProfile(userId);

    const opp = db.prepare(`
      SELECT o.*, r.companyName, r.recruiterName, r.email AS recruiterEmail,
             (SELECT a.id FROM applications a WHERE a.opportunityId = o.id AND a.studentId = ?) AS appliedApplicationId,
             (SELECT a.status FROM applications a WHERE a.opportunityId = o.id AND a.studentId = ?) AS applicationStatus,
             (SELECT a.applicationDate FROM applications a WHERE a.opportunityId = o.id AND a.studentId = ?) AS appliedAt
      FROM opportunities o
      JOIN recruiter_profiles r ON o.recruiterId = r.id
      WHERE o.id = ?
    `).get(studentProfile.id, studentProfile.id, studentProfile.id, opportunityId);

    if (!opp) {
      const error = new Error('Placement opportunity not found.');
      error.statusCode = 404;
      throw error;
    }

    const eligibility = checkStudentEligibility(studentProfile, opp);
    return {
      ...opp,
      hasApplied: Boolean(opp.appliedApplicationId),
      isEligible: eligibility.isEligible,
      ineligibilityReasons: eligibility.reasons
    };
  }

  applyForOpportunity(userId, opportunityId) {
    const studentProfile = this.getProfile(userId);

    const opportunity = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(opportunityId);
    if (!opportunity) {
      const error = new Error('Placement opportunity not found.');
      error.statusCode = 404;
      throw error;
    }

    // Check if opportunity is closed
    if (opportunity.status !== 'open') {
      const error = new Error('This opportunity is no longer accepting applications.');
      error.statusCode = 400;
      throw error;
    }

    // Check deadline
    const now = new Date();
    const deadlineStr = opportunity.deadline.includes('T') ? opportunity.deadline : `${opportunity.deadline}T23:59:59`;
    const deadlineDate = new Date(deadlineStr);
    if (isNaN(deadlineDate.getTime()) || deadlineDate < now) {
      const error = new Error('This opportunity is no longer accepting applications (deadline passed).');
      error.statusCode = 400;
      throw error;
    }

    // Check duplicate application
    const existingApp = db.prepare(`
      SELECT id FROM applications WHERE studentId = ? AND opportunityId = ?
    `).get(studentProfile.id, opportunityId);

    if (existingApp) {
      const error = new Error('You have already applied for this opportunity.');
      error.statusCode = 400;
      throw error;
    }

    // Check eligibility
    const eligibility = checkStudentEligibility(studentProfile, opportunity);
    if (!eligibility.isEligible) {
      const error = new Error(`You are not eligible for this opportunity: ${eligibility.reasons.join(' ')}`);
      error.statusCode = 400;
      error.reasons = eligibility.reasons;
      throw error;
    }

    // Insert Application
    const insert = db.prepare(`
      INSERT INTO applications (studentId, opportunityId, status)
      VALUES (?, ?, 'Applied')
    `);

    const result = insert.run(studentProfile.id, opportunityId);

    return db.prepare(`
      SELECT a.*, o.title AS opportunityTitle, r.companyName
      FROM applications a
      JOIN opportunities o ON a.opportunityId = o.id
      JOIN recruiter_profiles r ON o.recruiterId = r.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);
  }

  getApplications(userId) {
    const studentProfile = this.getProfile(userId);

    return db.prepare(`
      SELECT a.id, a.status, a.applicationDate,
             o.id AS opportunityId, o.title, o.minimumCgpa, o.eligibleBranch, o.location, o.ctc, o.deadline, o.status AS opportunityStatus,
             r.companyName, r.recruiterName
      FROM applications a
      JOIN opportunities o ON a.opportunityId = o.id
      JOIN recruiter_profiles r ON o.recruiterId = r.id
      WHERE a.studentId = ?
      ORDER BY a.applicationDate DESC
    `).all(studentProfile.id);
  }

  getDashboardStats(userId) {
    const profile = this.getProfile(userId);
    const documents = this.getDocuments(userId);
    const applications = this.getApplications(userId);
    const opportunities = this.getOpportunities(userId);

    const eligibleOpportunities = opportunities.filter(o => o.isEligible && o.status === 'open').length;

    return {
      profile,
      totalDocuments: documents.length,
      totalApplications: applications.length,
      totalOpportunities: opportunities.length,
      eligibleOpportunities,
      recentApplications: applications.slice(0, 5),
      recentOpportunities: opportunities.slice(0, 5)
    };
  }
}

module.exports = new StudentService();
