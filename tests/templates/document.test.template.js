const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const fs = require('fs');
const { seedDatabase } = require('../src/shared/db/seeder');

let studentToken;
const testFilesDir = path.join(__dirname, 'test-assets');

beforeAll(async () => {
  seedDatabase();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@placeco.edu', password: 'Password123' });
  studentToken = res.body.data.token;

  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
  }

  // Create valid PDF mock file
  fs.writeFileSync(path.join(testFilesDir, 'sample_resume.pdf'), '%PDF-1.4 Mock resume content for testing PlaceCo');

  // Create invalid file type (e.g. .exe / .sh)
  fs.writeFileSync(path.join(testFilesDir, 'malicious_script.exe'), 'MZ999 mock executable');

  // Create file exceeding 5MB
  const bigBuffer = Buffer.alloc(5.5 * 1024 * 1024, 'a');
  fs.writeFileSync(path.join(testFilesDir, 'oversized_document.pdf'), bigBuffer);
});

afterAll(() => {
  if (fs.existsSync(testFilesDir)) {
    fs.rmSync(testFilesDir, { recursive: true, force: true });
  }
});

describe('MODULE 2 – Document Management', () => {
  // TC-DOC-01: Upload valid document
  test('TC-DOC-01: Upload valid document succeeds', async () => {
    const res = await request(app)
      .post('/api/student/documents')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('documentType', 'resume')
      .attach('document', path.join(testFilesDir, 'sample_resume.pdf'));

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('fileName', 'sample_resume.pdf');
    expect(res.body.data).toHaveProperty('documentType', 'resume');
    expect(res.body.data).toHaveProperty('filePath');

    // Verify it appears in documents list
    const listRes = await request(app)
      .get('/api/student/documents')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // TC-DOC-02: Invalid file type
  test('TC-DOC-02: Invalid file type (.exe) is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/student/documents')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('documentType', 'resume')
      .attach('document', path.join(testFilesDir, 'malicious_script.exe'));

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/file type not supported/i);
  });

  // TC-DOC-03: File exceeds size limit
  test('TC-DOC-03: File exceeding 5MB limit is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/student/documents')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('documentType', 'resume')
      .attach('document', path.join(testFilesDir, 'oversized_document.pdf'));

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/file size exceeds/i);
  });
});
