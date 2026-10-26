const request = require('supertest');
const app = require('../src/app');
const { seedDatabase } = require('../src/shared/db/seeder');

beforeAll(() => {
  seedDatabase();
});

describe('MODULE 1 - Authentication & Role-Based Login', () => {
  // TC-LOGIN-01: Valid login for student, recruiter, admin with @bmu.edu.in emails
  test('TC-LOGIN-01: Valid login returns token, role and proper redirectUrl for @bmu.edu.in users', async () => {
    // Student login
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@bmu.edu.in', password: 'Password123' });

    expect(studentRes.statusCode).toBe(200);
    expect(studentRes.body.success).toBe(true);
    expect(studentRes.body.data).toHaveProperty('token');
    expect(studentRes.body.data.user.role).toBe('student');
    expect(studentRes.body.data.redirectUrl).toBe('/student/dashboard.html');

    // Recruiter login
    const recruiterRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'recruiter@bmu.edu.in', password: 'Password123' });

    expect(recruiterRes.statusCode).toBe(200);
    expect(recruiterRes.body.data.user.role).toBe('recruiter');
    expect(recruiterRes.body.data.redirectUrl).toBe('/recruiter/dashboard.html');

    // Admin login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bmu.edu.in', password: 'Password123' });

    expect(adminRes.statusCode).toBe(200);
    expect(adminRes.body.data.user.role).toBe('admin');
    expect(adminRes.body.data.redirectUrl).toBe('/admin/dashboard.html');
  });

  // TC-LOGIN-02: Invalid password
  test('TC-LOGIN-02: Invalid password returns 401 with meaningful message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@bmu.edu.in', password: 'WrongPassword999' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  // TC-LOGIN-03: Empty credentials
  test('TC-LOGIN-03: Empty credentials return 400 validation error', async () => {
    // Empty email
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: '', password: 'Password123' });

    expect(res1.statusCode).toBe(400);
    expect(res1.body.success).toBe(false);

    // Empty password
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@bmu.edu.in', password: '' });

    expect(res2.statusCode).toBe(400);
    expect(res2.body.success).toBe(false);
  });

  // TC-LOGIN-04: Role-based access control (RBAC)
  test('TC-LOGIN-04: Role-based access prevents unauthorized cross-role access', async () => {
    // 1. Get student token
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@bmu.edu.in', password: 'Password123' });
    const studentToken = studentLogin.body.data.token;

    // 2. Student tries to access recruiter-only endpoint
    const studentToRecruiter = await request(app)
      .get('/api/recruiter/opportunities')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(studentToRecruiter.statusCode).toBe(403);
    expect(studentToRecruiter.body.success).toBe(false);
    expect(studentToRecruiter.body.message).toMatch(/access denied/i);

    // 3. Get recruiter token
    const recruiterLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'recruiter@bmu.edu.in', password: 'Password123' });
    const recruiterToken = recruiterLogin.body.data.token;

    // 4. Recruiter tries to access student-only endpoint
    const recruiterToStudent = await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${recruiterToken}`);

    expect(recruiterToStudent.statusCode).toBe(403);
    expect(recruiterToStudent.body.success).toBe(false);

    // 5. Unauthenticated request to protected route
    const unauth = await request(app).get('/api/student/profile');
    expect(unauth.statusCode).toBe(401);
  });

  // TC-LOGIN-05: Strict @bmu.edu.in institutional domain restriction
  test('TC-LOGIN-05: Non-BMU email domains are strictly rejected with 400', async () => {
    // Login with external domain
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@gmail.com', password: 'Password123' });

    expect(loginRes.statusCode).toBe(400);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toMatch(/only official @bmu\.edu\.in/i);

    // Register with external domain
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'External User',
        email: 'user@yahoo.com',
        password: 'Password123',
        role: 'student'
      });

    expect(registerRes.statusCode).toBe(400);
    expect(registerRes.body.success).toBe(false);
    expect(registerRes.body.message).toMatch(/@bmu\.edu\.in/i);
  });
});
