-- PlaceCo Relational Database Schema (SQLite)
PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'recruiter', 'admin')),
    status TEXT NOT NULL DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Student Profile Table
CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE NOT NULL,
    studentId TEXT UNIQUE,
    phone TEXT,
    course TEXT,
    branch TEXT,
    year INTEGER,
    cgpa REAL,
    skills TEXT,
    graduationYear INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    documentType TEXT NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileSize INTEGER,
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 4. Recruiter Profile Table
CREATE TABLE IF NOT EXISTS recruiter_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE NOT NULL,
    companyName TEXT NOT NULL,
    recruiterName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    description TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Placement Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recruiterId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    skills TEXT NOT NULL,
    minimumCgpa REAL NOT NULL,
    eligibleBranch TEXT NOT NULL,
    location TEXT NOT NULL,
    employmentType TEXT NOT NULL,
    deadline TEXT NOT NULL,
    ctc TEXT,
    openings INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiterId) REFERENCES recruiter_profiles(id) ON DELETE CASCADE
);

-- 6. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    opportunityId INTEGER NOT NULL,
    applicationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'Applied',
    UNIQUE(studentId, opportunityId),
    FOREIGN KEY (studentId) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (opportunityId) REFERENCES opportunities(id) ON DELETE CASCADE
);

-- Indexes for performance and lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_userId ON student_profiles(userId);
CREATE INDEX IF NOT EXISTS idx_documents_studentId ON documents(studentId);
CREATE INDEX IF NOT EXISTS idx_recruiters_userId ON recruiter_profiles(userId);
CREATE INDEX IF NOT EXISTS idx_opportunities_recruiterId ON opportunities(recruiterId);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_applications_studentId ON applications(studentId);
CREATE INDEX IF NOT EXISTS idx_applications_opportunityId ON applications(opportunityId);
