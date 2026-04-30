const request = require('supertest');
const app     = require('../index');
const db      = require('../db');

// ── Helpers ───────────────────────────────────────────────────────────────────
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const validPayload = () => ({
  amount:            '123.45',
  category:          'Food',
  description:       'Test lunch',
  date:              '2024-01-15',
  client_request_id: uuidv4(),
});

// ── Setup / Teardown ──────────────────────────────────────────────────────────
beforeEach(() => {
  db.exec('DELETE FROM expenses');
});

afterAll(() => {
  db.close();
});

// =============================================================================
// POST /expenses
// =============================================================================
describe('POST /expenses', () => {

  test('TC-01 · creates expense, returns 201 + correct fields', async () => {
    const payload = validPayload();
    const res = await request(app).post('/expenses').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      amount:   12345,           // 123.45 × 100  (cents, integer)
      category: 'Food',
      description: 'Test lunch',
      date:     '2024-01-15',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
  });

  test('TC-02 · idempotency — same client_request_id returns 200 with same record', async () => {
    const payload = validPayload();

    const first  = await request(app).post('/expenses').send(payload);
    const second = await request(app).post('/expenses').send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    // Only one row should exist
    const rows = db.prepare('SELECT * FROM expenses').all();
    expect(rows).toHaveLength(1);
  });

  test('TC-03 · stores amount as integer cents — avoids 0.1+0.2 float bug', async () => {
    const payload = { ...validPayload(), amount: '0.30' };  // 0.1 + 0.2 in decimal
    const res = await request(app).post('/expenses').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(30);   // exactly 30 cents, not 29.999...
    expect(Number.isInteger(res.body.amount)).toBe(true);
  });

  test('TC-04 · rejects missing amount → 400', async () => {
    const { amount, ...rest } = validPayload();
    const res = await request(app).post('/expenses').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('amount is required');
  });

  test('TC-05 · rejects negative amount → 400', async () => {
    const res = await request(app).post('/expenses').send({ ...validPayload(), amount: '-50' });
    expect(res.status).toBe(400);
  });

  test('TC-06 · rejects invalid category → 400', async () => {
    const res = await request(app).post('/expenses').send({ ...validPayload(), category: 'Nonsense' });
    expect(res.status).toBe(400);
  });

  test('TC-07 · rejects invalid date format → 400', async () => {
    const res = await request(app).post('/expenses').send({ ...validPayload(), date: '15-01-2024' });
    expect(res.status).toBe(400);
  });

  test('TC-08 · rejects malformed client_request_id → 400', async () => {
    const res = await request(app).post('/expenses').send({ ...validPayload(), client_request_id: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  test('TC-09 · rejects missing description → 400', async () => {
    const { description, ...rest } = validPayload();
    const res = await request(app).post('/expenses').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('description is required');
  });
});

// =============================================================================
// GET /expenses
// =============================================================================
describe('GET /expenses', () => {

  beforeEach(async () => {
    // Seed 3 expenses
    await request(app).post('/expenses').send({ ...validPayload(), category: 'Food',   amount: '100' });
    await request(app).post('/expenses').send({ ...validPayload(), category: 'Travel', amount: '200' });
    await request(app).post('/expenses').send({ ...validPayload(), category: 'Food',   amount: '50'  });
  });

  test('TC-10 · returns all expenses when no filter', async () => {
    const res = await request(app).get('/expenses');
    expect(res.status).toBe(200);
    expect(res.body.expenses).toHaveLength(3);
  });

  test('TC-11 · total is correct (sum in cents)', async () => {
    const res = await request(app).get('/expenses');
    expect(res.body.total).toBe(35000);  // 100+200+50 = 350.00 → 35000 cents
  });

  test('TC-12 · filter by category returns only matching rows', async () => {
    const res = await request(app).get('/expenses?category=Food');
    expect(res.status).toBe(200);
    expect(res.body.expenses).toHaveLength(2);
    expect(res.body.total).toBe(15000); // 100+50 = 150 → 15000 cents
    res.body.expenses.forEach(e => expect(e.category).toBe('Food'));
  });

  test('TC-13 · sort=amount_desc returns highest first', async () => {
    const res = await request(app).get('/expenses?sort=amount_desc');
    expect(res.status).toBe(200);
    const amounts = res.body.expenses.map(e => e.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  test('TC-14 · empty list returns expenses:[] and total:0', async () => {
    db.exec('DELETE FROM expenses');
    const res = await request(app).get('/expenses');
    expect(res.body.expenses).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});
