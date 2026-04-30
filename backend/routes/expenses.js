const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateExpense } = require('../middleware/validate');

// ─────────────────────────────────────────────────────────────────────────────
// POST /expenses  — Create a new expense (idempotent via client_request_id)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', validateExpense, (req, res) => {
  const { amountCents, category, description, date, client_request_id } = req.body;

  // Idempotency check: if same client_request_id exists, return existing record
  const existing = db
    .prepare('SELECT * FROM expenses WHERE client_request_id = ?')
    .get(client_request_id.trim());

  if (existing) {
    return res.status(200).json(formatExpense(existing));
  }

  // Insert new expense
  try {
    const stmt = db.prepare(`
      INSERT INTO expenses (amount, category, description, date, client_request_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(
      amountCents,
      category.trim(),
      description.trim(),
      date.trim(),
      client_request_id.trim()
    );

    const created = db
      .prepare('SELECT * FROM expenses WHERE id = ?')
      .get(result.lastInsertRowid);

    return res.status(201).json(formatExpense(created));
  } catch (err) {
    // UNIQUE constraint hit (race condition) — return existing
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const existing = db
        .prepare('SELECT * FROM expenses WHERE client_request_id = ?')
        .get(client_request_id.trim());
      return res.status(200).json(formatExpense(existing));
    }
    console.error('POST /expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /expenses  — List expenses with optional filtering + sorting
// Query params: ?category=Food&sort=date_desc|date_asc|amount_desc|amount_asc
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { category, sort } = req.query;

  const conditions = [];
  const params = [];

  if (category && category.trim() !== '' && category.trim() !== 'All') {
    conditions.push('category = ?');
    params.push(category.trim());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort options
  const sortMap = {
    date_desc:   'date DESC, created_at DESC',
    date_asc:    'date ASC,  created_at ASC',
    amount_desc: 'amount DESC, date DESC',
    amount_asc:  'amount ASC,  date DESC',
  };
  const orderBy = sortMap[sort] || 'date DESC, created_at DESC';

  try {
    const expenses = db
      .prepare(`SELECT * FROM expenses ${whereClause} ORDER BY ${orderBy}`)
      .all(...params);

    // Aggregate total in cents
    const totalRow = db
      .prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM expenses ${whereClause}`)
      .get(...params);

    return res.status(200).json({
      expenses: expenses.map(formatExpense),
      total: totalRow.total,       // still in cents — let frontend format
    });
  } catch (err) {
    console.error('GET /expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /expenses/:id  — Update an existing expense
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', validateExpense, (req, res) => {
  const { amountCents, category, description, date } = req.body;
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const stmt = db.prepare(`
      UPDATE expenses 
      SET amount = ?, category = ?, description = ?, date = ?
      WHERE id = ?
    `);

    stmt.run(amountCents, category.trim(), description.trim(), date.trim(), id);
    
    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    return res.status(200).json(formatExpense(updated));
  } catch (err) {
    console.error('PUT /expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /expenses/:id  — Delete an existing expense
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: format a DB row for API response
// amount stays in CENTS — client divides by 100 for display
// ─────────────────────────────────────────────────────────────────────────────
function formatExpense(row) {
  return {
    id:                row.id,
    amount:            row.amount,          // integer cents
    category:          row.category,
    description:       row.description,
    date:              row.date,
    client_request_id: row.client_request_id,
    created_at:        row.created_at,
  };
}

module.exports = router;
