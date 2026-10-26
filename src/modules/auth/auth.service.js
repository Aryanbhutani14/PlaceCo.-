const { db } = require('../../shared/db/connection');
const { hashPassword, comparePassword, generateToken } = require('../../shared/utils/auth.util');

class AuthService {
  login(email, password) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    if (user.status !== 'active') {
      const error = new Error('Your account is currently inactive. Please contact administration.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // Role-based target dashboard URL
    let redirectUrl = '/login.html';
    if (user.role === 'student') {
      redirectUrl = '/student/dashboard.html';
    } else if (user.role === 'recruiter') {
      redirectUrl = '/recruiter/dashboard.html';
    } else if (user.role === 'admin') {
      redirectUrl = '/admin/dashboard.html';
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      redirectUrl
    };
  }

  register(userData) {
    const { name, email, password, role } = userData;

    if (!['student', 'recruiter'].includes(role)) {
      const error = new Error('Role must be either student or recruiter.');
      error.statusCode = 400;
      throw error;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = hashPassword(password);

    const transaction = db.transaction(() => {
      const insertUser = db.prepare(`
        INSERT INTO users (name, email, password, role, status)
        VALUES (?, ?, ?, ?, 'active')
      `);
      const result = insertUser.run(name.trim(), email.trim().toLowerCase(), hashedPassword, role);
      const userId = result.lastInsertRowid;

      // Auto-create initial profile row
      if (role === 'student') {
        db.prepare(`
          INSERT INTO student_profiles (userId, studentId, course, branch, year, cgpa, skills, graduationYear)
          VALUES (?, '', 'B.Tech', 'CSE', 1, 0.0, '', 2026)
        `).run(userId);
      } else if (role === 'recruiter') {
        db.prepare(`
          INSERT INTO recruiter_profiles (userId, companyName, recruiterName, email, phone, description)
          VALUES (?, 'Company Name', ?, ?, '', '')
        `).run(userId, name.trim(), email.trim().toLowerCase());
      }

      return userId;
    });

    const newUserId = transaction();
    const newUser = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(newUserId);

    let redirectUrl = role === 'student' ? '/student/dashboard.html' : '/recruiter/dashboard.html';
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    return {
      token,
      user: newUser,
      redirectUrl
    };
  }

  getCurrentUser(userId) {
    const user = db.prepare('SELECT id, name, email, role, status, createdAt FROM users WHERE id = ?').get(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    let profile = null;
    if (user.role === 'student') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE userId = ?').get(userId);
    } else if (user.role === 'recruiter') {
      profile = db.prepare('SELECT * FROM recruiter_profiles WHERE userId = ?').get(userId);
    }

    return {
      ...user,
      profile
    };
  }
}

module.exports = new AuthService();
