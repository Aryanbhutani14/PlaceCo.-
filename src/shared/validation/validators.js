/**
 * Validation logic for PlaceCo
 */

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Allows 10-digit numbers, optional country code prefix
  const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
  return phoneRegex.test(phone.trim().replace(/\s+/g, ''));
}

function isBmuEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith('@bmu.edu.in');
}

function validateLoginInput(body) {
  const errors = [];
  const { email, password } = body || {};

  if (!email || !email.toString().trim()) {
    errors.push('Email is required.');
  } else if (!isValidEmail(email)) {
    errors.push('Please enter a valid email address.');
  } else if (!isBmuEmail(email)) {
    errors.push('Access restricted: Only official @bmu.edu.in email addresses are permitted.');
  }

  if (!password || !password.toString().trim()) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateStudentProfile(body) {
  const errors = [];
  const { studentId, phone, course, branch, year, cgpa, skills, graduationYear } = body || {};

  if (!studentId || !studentId.toString().trim()) {
    errors.push('Student ID / Enrollment Number is required.');
  }

  if (!phone || !phone.toString().trim()) {
    errors.push('Phone number is required.');
  } else if (!isValidPhone(phone)) {
    errors.push('Please enter a valid 10-digit phone number.');
  }

  if (!course || !course.toString().trim()) {
    errors.push('Course / Degree is required.');
  }

  if (!branch || !branch.toString().trim()) {
    errors.push('Branch / Department is required.');
  }

  if (year === undefined || year === null || year === '') {
    errors.push('Current year is required.');
  } else {
    const numYear = parseInt(year, 10);
    if (isNaN(numYear) || numYear < 1 || numYear > 6) {
      errors.push('Year must be an integer between 1 and 6.');
    }
  }

  if (cgpa === undefined || cgpa === null || cgpa === '') {
    errors.push('Please enter your CGPA.');
  } else {
    const numCgpa = parseFloat(cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      errors.push('CGPA must be a number between 0 and 10.');
    }
  }

  if (!skills || !skills.toString().trim()) {
    errors.push('Skills are required.');
  }

  if (graduationYear === undefined || graduationYear === null || graduationYear === '') {
    errors.push('Graduation year is required.');
  } else {
    const numGrad = parseInt(graduationYear, 10);
    if (isNaN(numGrad) || numGrad < 2020 || numGrad > 2040) {
      errors.push('Graduation year must be a valid year between 2020 and 2040.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateOpportunity(body) {
  const errors = [];
  const {
    title,
    description,
    skills,
    minimumCgpa,
    eligibleBranch,
    location,
    employmentType,
    deadline,
    openings
  } = body || {};

  if (!title || !title.toString().trim()) {
    errors.push('Opportunity Title is required.');
  }

  if (!description || !description.toString().trim()) {
    errors.push('Job Description is required.');
  }

  if (!skills || !skills.toString().trim()) {
    errors.push('Required skills are required.');
  }

  if (minimumCgpa === undefined || minimumCgpa === null || minimumCgpa === '') {
    errors.push('Minimum CGPA is required.');
  } else {
    const numCgpa = parseFloat(minimumCgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      errors.push('Minimum CGPA must be a number between 0 and 10.');
    }
  }

  if (!eligibleBranch || !eligibleBranch.toString().trim()) {
    errors.push('Eligible branch is required.');
  }

  if (!location || !location.toString().trim()) {
    errors.push('Location is required.');
  }

  if (!employmentType || !employmentType.toString().trim()) {
    errors.push('Employment type is required.');
  }

  if (!deadline || !deadline.toString().trim()) {
    errors.push('Application deadline is required.');
  } else {
    const parsedDate = new Date(deadline);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid deadline date format.');
    }
  }

  if (openings !== undefined && openings !== null && openings !== '') {
    const numOpenings = parseInt(openings, 10);
    if (isNaN(numOpenings) || numOpenings < 1) {
      errors.push('Number of openings must be at least 1.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function checkStudentEligibility(studentProfile, opportunity) {
  const reasons = [];

  if (!studentProfile) {
    return {
      isEligible: false,
      reasons: ['Student profile is incomplete or not found. Please complete your profile first.']
    };
  }

  // 1. CGPA check
  const studentCgpa = parseFloat(studentProfile.cgpa || 0);
  const requiredCgpa = parseFloat(opportunity.minimumCgpa || 0);
  if (studentCgpa < requiredCgpa) {
    reasons.push(`Your CGPA (${studentCgpa.toFixed(2)}) is below the minimum required CGPA (${requiredCgpa.toFixed(2)}).`);
  }

  // 2. Branch check
  const studentBranch = (studentProfile.branch || '').toUpperCase().trim();
  const eligibleBranches = (opportunity.eligibleBranch || '')
    .toUpperCase()
    .split(/[,/|]+/)
    .map(b => b.trim())
    .filter(Boolean);

  if (eligibleBranches.length > 0 && !eligibleBranches.includes('ALL') && !eligibleBranches.includes('ANY')) {
    const matchesBranch = eligibleBranches.some(b => studentBranch.includes(b) || b.includes(studentBranch));
    if (!matchesBranch) {
      reasons.push(`Your branch (${studentProfile.branch}) is not in the eligible branches list: ${opportunity.eligibleBranch}.`);
    }
  }

  // 3. Deadline check
  const now = new Date();
  // Normalize deadline to end of day if given as YYYY-MM-DD
  const deadlineStr = opportunity.deadline.includes('T') ? opportunity.deadline : `${opportunity.deadline}T23:59:59`;
  const deadlineDate = new Date(deadlineStr);
  if (isNaN(deadlineDate.getTime()) || deadlineDate < now) {
    reasons.push('The application deadline for this opportunity has passed.');
  }

  // 4. Status check
  if (opportunity.status !== 'open') {
    reasons.push('This opportunity is closed and is no longer accepting applications.');
  }

  return {
    isEligible: reasons.length === 0,
    reasons
  };
}

module.exports = {
  isValidEmail,
  isBmuEmail,
  isValidPhone,
  validateLoginInput,
  validateStudentProfile,
  validateOpportunity,
  checkStudentEligibility
};
