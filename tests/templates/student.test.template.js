const request = require('supertest');
const app = require('../src/app');
const { seedDatabase } = require('../src/shared/db/seeder');

let studentToken;

beforeAll(async () => {
  seedDatabase();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@placeco.edu', password: 'Password123' });
  studentToken = res.body.data.token;
});

describe('MODULE 2 – Student Profile Management', () => {
  // TC-STU-01: View profile
  test('TC-STU-01: View student profile', async () => {
    const res = await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('studentId', 'STU2026001');
    expect(res.body.data).toHaveProperty('cgpa', 8.75);
    expect(res.body.data).toHaveProperty('branch', 'CSE');
  });

  // TC-STU-02: Update profile
  test('TC-STU-02: Update student profile with valid data', async () => {
    const updatePayload = {
      name: 'Aryan Bhutani Updated',
      studentId: 'STU2026001',
      phone: '9876543211',
      course: 'B.Tech',
      branch: 'CSE',
      year: 4,
      cgpa: 8.95,
      skills: 'Java, Python, SQL, React, Node.js, DSA, System Design',
      graduationYear: 2026
    };

    const res = await request(app)
      .put('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(updatePayload);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cgpa).toBe(8.95);
    expect(res.body.data.phone).toBe('9876543211');
    expect(res.body.data.skills).toContain('System Design');
  });

  // TC-STU-03: Invalid CGPA
  test('TC-STU-03: Invalid CGPA (> 10 or < 0) rejected with 400', async () => {
    // CGPA > 10
    const resHigh = await request(app)
      .put('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'STU2026001',
        phone: '9876543210',
        course: 'B.Tech',
        branch: 'CSE',
        year: 4,
        cgpa: 11.5,
        skills: 'Java',
        graduationYear: 2026
      });

    expect(resHigh.statusCode).toBe(400);
    expect(resHigh.body.success).toBe(false);
    expect(resHigh.body.message).toMatch(/cgpa must be a number between 0 and 10/i);

    // Negative CGPA
    const resLow = await request(app)
      .put('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'STU2026001',
        phone: '9876543210',
        course: 'B.Tech',
        branch: 'CSE',
        year: 4,
        cgpa: -2.0,
        skills: 'Java',
        graduationYear: 2026
      });

    expect(resLow.statusCode).toBe(400);
    expect(resLow.body.success).toBe(false);
  });

  // TC-STU-04: Missing required field
  test('TC-STU-04: Missing required field rejected with 400', async () => {
    // Missing branch
    const res = await request(app)
      .put('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'STU2026001',
        phone: '9876543210',
        course: 'B.Tech',
        branch: '',
        year: 4,
        cgpa: 8.5,
        skills: 'Java',
        graduationYear: 2026
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/branch \/ department is required/i);
  });
});
