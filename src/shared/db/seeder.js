const bcrypt = require('bcryptjs');
const { db } = require('./connection');

function seedDatabase(customDb = null) {
  const targetDb = customDb || db;

  // Clear existing data safely
  targetDb.exec(`
    DELETE FROM applications;
    DELETE FROM documents;
    DELETE FROM opportunities;
    DELETE FROM student_profiles;
    DELETE FROM recruiter_profiles;
    DELETE FROM users;
  `);

  const saltRounds = 10;
  const commonPasswordHash = bcrypt.hashSync('Password123', saltRounds);

  // 1. Insert Users
  const insertUser = targetDb.prepare(`
    INSERT INTO users (id, name, email, password, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(1, 'Admin Ramesh', 'admin@bmu.edu.in', commonPasswordHash, 'admin', 'active');
  insertUser.run(2, 'Aryan Bhutani', 'student@bmu.edu.in', commonPasswordHash, 'student', 'active');
  insertUser.run(3, 'Priya Sharma', 'priya.sharma@bmu.edu.in', commonPasswordHash, 'student', 'active');
  insertUser.run(4, 'Vikram Malhotra', 'recruiter@bmu.edu.in', commonPasswordHash, 'recruiter', 'active');
  insertUser.run(5, 'Ananya Roy', 'corporate.relations@bmu.edu.in', commonPasswordHash, 'recruiter', 'active');

  // 2. Insert Student Profiles
  const insertStudent = targetDb.prepare(`
    INSERT INTO student_profiles (id, userId, studentId, phone, course, branch, year, cgpa, skills, graduationYear)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Student 1: Eligible for 8.0+ CSE opportunities
  insertStudent.run(
    1,
    2,
    'STU2026001',
    '9876543210',
    'B.Tech',
    'CSE',
    4,
    8.75,
    'Java, Python, SQL, React, Node.js, DSA',
    2026
  );

  // Student 2: ECE with 7.20 CGPA (used to test eligibility boundaries)
  insertStudent.run(
    2,
    3,
    'STU2026002',
    '9812345678',
    'B.Tech',
    'ECE',
    4,
    7.20,
    'C++, Embedded Systems, IoT, Python',
    2026
  );

  // 3. Insert Recruiter Profiles
  const insertRecruiter = targetDb.prepare(`
    INSERT INTO recruiter_profiles (id, userId, companyName, recruiterName, email, phone, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertRecruiter.run(
    1,
    4,
    'ABC Technologies',
    'Vikram Malhotra',
    'recruiter@bmu.edu.in',
    '9123456780',
    'Global leader in enterprise cloud applications and AI-driven platforms.'
  );

  insertRecruiter.run(
    2,
    5,
    'Nova Solutions',
    'Ananya Roy',
    'corporate.relations@bmu.edu.in',
    '9234567891',
    'Next-generation fintech software solutions provider.'
  );

  // 4. Insert Placement Opportunities
  const insertOpp = targetDb.prepare(`
    INSERT INTO opportunities (
      id, recruiterId, title, description, skills, minimumCgpa, eligibleBranch,
      location, employmentType, deadline, ctc, openings, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Open opportunity requiring CGPA 8.0 and CSE branch
  insertOpp.run(
    1,
    1,
    'Software Developer',
    'Seeking passionate software engineers to develop robust backend microservices and modern APIs.',
    'Java, SQL, DSA, Spring Boot',
    8.0,
    'CSE',
    'Gurugram, India',
    'Full-Time',
    '2026-11-20',
    '12 LPA',
    10,
    'open'
  );

  // Open opportunity eligible for CSE, IT, ECE with CGPA 7.0
  insertOpp.run(
    2,
    2,
    'Frontend Engineer',
    'Build responsive, high-performance web applications with modern design systems and web tech.',
    'JavaScript, HTML5, CSS3, React',
    7.0,
    'CSE, IT, ECE',
    'Bengaluru, India',
    'Full-Time',
    '2026-12-15',
    '9 LPA',
    5,
    'open'
  );

  // Open opportunity requiring CGPA 7.5
  insertOpp.run(
    3,
    1,
    'Data Analyst',
    'Extract actionable business insights, create dashboards, and optimize relational data pipelines.',
    'Python, SQL, Pandas, Tableau',
    7.5,
    'CSE, IT',
    'Remote / Hybrid',
    'Full-Time',
    '2026-12-30',
    '8.5 LPA',
    4,
    'open'
  );

  // Expired / closed opportunity for testing deadline/status prevention
  insertOpp.run(
    4,
    1,
    'Systems Engineer (Closed)',
    'Low-level systems and networking position (application window closed).',
    'C++, Linux, Networking',
    6.5,
    'CSE, ECE',
    'Noida, India',
    'Full-Time',
    '2024-01-01',
    '6 LPA',
    2,
    'closed'
  );

  console.log('Database seeded successfully with demo users and opportunities.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
