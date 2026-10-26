const request = require('supertest');
const app = require('../src/app');
const { seedDatabase } = require('../src/shared/db/seeder');

let recruiterToken;
let createdOppId;

beforeAll(async () => {
  seedDatabase();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'recruiter@placeco.edu', password: 'Password123' });
  recruiterToken = res.body.data.token;
});

describe('MODULE 3 – Recruiter & Placement Opportunity Management', () => {
  // TC-REC-01: Create opportunity
  test('TC-REC-01: Create valid placement opportunity', async () => {
    const newOpportunity = {
      title: 'Cloud DevOps Engineer',
      description: 'Design and automate scalable cloud infrastructure and CI/CD pipelines.',
      skills: 'Docker, Kubernetes, AWS, Terraform, Linux',
      minimumCgpa: 7.5,
      eligibleBranch: 'CSE, IT, ECE',
      location: 'Hyderabad, India',
      employmentType: 'Full-Time',
      deadline: '2026-12-31',
      ctc: '14 LPA',
      openings: 4
    };

    const res = await request(app)
      .post('/api/recruiter/opportunities')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(newOpportunity);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Cloud DevOps Engineer');
    expect(res.body.data.minimumCgpa).toBe(7.5);
    expect(res.body.data.status).toBe('open');

    createdOppId = res.body.data.id;
  });

  // TC-REC-02: Missing required field
  test('TC-REC-02: Missing required title returns 400', async () => {
    const invalidOpp = {
      title: '',
      description: 'Valid description here',
      skills: 'Python, SQL',
      minimumCgpa: 7.0,
      eligibleBranch: 'CSE',
      location: 'Pune',
      employmentType: 'Full-Time',
      deadline: '2026-12-31',
      openings: 2
    };

    const res = await request(app)
      .post('/api/recruiter/opportunities')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(invalidOpp);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/opportunity title is required/i);
  });

  // TC-REC-03: Invalid CGPA
  test('TC-REC-03: Invalid CGPA (> 10 or < 0) returns 400', async () => {
    const invalidCgpaOpp = {
      title: 'QA Automation Engineer',
      description: 'Quality assurance and automated testing.',
      skills: 'Selenium, Java',
      minimumCgpa: 12.0, // Invalid!
      eligibleBranch: 'CSE',
      location: 'Noida',
      employmentType: 'Full-Time',
      deadline: '2026-12-31',
      openings: 2
    };

    const res = await request(app)
      .post('/api/recruiter/opportunities')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(invalidCgpaOpp);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/minimum cgpa must be a number between 0 and 10/i);
  });

  // TC-REC-04: Edit opportunity
  test('TC-REC-04: Edit existing opportunity', async () => {
    const updateData = {
      title: 'Cloud DevOps Engineer (Senior)',
      description: 'Updated description for senior DevOps role.',
      skills: 'Docker, Kubernetes, AWS, Terraform, Linux, Prometheus',
      minimumCgpa: 8.0,
      eligibleBranch: 'CSE, IT',
      location: 'Hyderabad (Hybrid)',
      employmentType: 'Full-Time',
      deadline: '2026-12-31',
      ctc: '16 LPA',
      openings: 6,
      status: 'open'
    };

    const res = await request(app)
      .put(`/api/recruiter/opportunities/${createdOppId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(updateData);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Cloud DevOps Engineer (Senior)');
    expect(res.body.data.ctc).toBe('16 LPA');
  });

  // TC-REC-05: Delete/close opportunity
  test('TC-REC-05: Delete/close opportunity', async () => {
    const res = await request(app)
      .delete(`/api/recruiter/opportunities/${createdOppId}`)
      .set('Authorization', `Bearer ${recruiterToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is removed
    const verifyRes = await request(app)
      .get(`/api/recruiter/opportunities/${createdOppId}`)
      .set('Authorization', `Bearer ${recruiterToken}`);

    expect(verifyRes.statusCode).toBe(404);
  });
});
