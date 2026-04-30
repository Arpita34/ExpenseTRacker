const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { validateExpense } = require('../middleware/validate');

// ─────────────────────────────────────────────────────────────────────────────
// POST /expenses  — Create a new expense (idempotent via client_request_id)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', validateExpense, async (req, res) => {
  const { amountCents, category, description, date, client_request_id } = req.body;

  try {
    // Idempotency check: if same client_request_id exists, return existing record
    const { data: existing, error: findErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('client_request_id', client_request_id.trim())
      .maybeSingle();

    if (findErr) throw findErr;

    if (existing) {
      return res.status(200).json(formatExpense(existing));
    }

    // Insert new expense
    const { data: created, error: insertErr } = await supabase
      .from('expenses')
      .insert({
        amount: amountCents,
        category: category.trim(),
        description: description.trim(),
        date: date.trim(),
        client_request_id: client_request_id.trim(),
      })
      .select('*')
      .single();

    if (insertErr) {
      // UNIQUE constraint hit (race condition) — return existing
      if (insertErr.code === '23505') {
        const { data: dup } = await supabase
          .from('expenses')
          .select('*')
          .eq('client_request_id', client_request_id.trim())
          .single();
        return res.status(200).json(formatExpense(dup));
      }
      throw insertErr;
    }

    return res.status(201).json(formatExpense(created));
  } catch (err) {
    console.error('POST /expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /expenses  — List expenses with optional filtering + sorting
// Query params: ?category=Food&sort=date_desc|date_asc|amount_desc|amount_asc
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { category, sort } = req.query;

  try {
    // Build the select query
    let query = supabase.from('expenses').select('*');

    // Category filter
    if (category && category.trim() !== '' && category.trim() !== 'All') {
      query = query.eq('category', category.trim());
    }

    // Sort options
    switch (sort) {
      case 'date_asc':
        query = query.order('date', { ascending: true }).order('created_at', { ascending: true });
        break;
      case 'amount_desc':
        query = query.order('amount', { ascending: false }).order('date', { ascending: false });
        break;
      case 'amount_asc':
        query = query.order('amount', { ascending: true }).order('date', { ascending: false });
        break;
      case 'date_desc':
      default:
        query = query.order('date', { ascending: false }).order('created_at', { ascending: false });
        break;
    }

    const { data: expenses, error } = await query;
    if (error) throw error;

    // Aggregate total in cents
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return res.status(200).json({
      expenses: expenses.map(formatExpense),
      total,       // still in cents — let frontend format
    });
  } catch (err) {
    console.error('GET /expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /expenses/:id  — Update an existing expense
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', validateExpense, async (req, res) => {
  const { amountCents, category, description, date } = req.body;
  const { id } = req.params;

  try {
    // Check if exists
    const { data: existing, error: findErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('expenses')
      .update({
        amount: amountCents,
        category: category.trim(),
        description: description.trim(),
        date: date.trim(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    return res.status(200).json(formatExpense(updated));
  } catch (err) {
    console.error('PUT /expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /expenses/:id  — Delete an existing expense
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: deleted, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw error;

    if (!deleted || deleted.length === 0) {
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
