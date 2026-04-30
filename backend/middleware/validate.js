/**
 * Validate incoming POST /expenses body.
 * Amounts come in as rupees (decimal string or number).
 * We convert to integer cents here and attach to req.body.
 */

const VALID_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Other'];

function validateExpense(req, res, next) {
  const { amount, category, description, date, client_request_id } = req.body;

  const errors = [];

  // ── amount ──────────────────────────────────────────────────
  if (amount === undefined || amount === null || amount === '') {
    errors.push('amount is required');
  } else {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      errors.push('amount must be a positive number');
    } else if (parsed > 99999.99) {
      errors.push('amount cannot exceed 99,999.99 (5 digits)');
    } else {
      // Convert rupees → cents (integer), avoids float bugs
      req.body.amountCents = Math.round(parsed * 100);
    }
  }

  // ── category ─────────────────────────────────────────────────
  if (!category || typeof category !== 'string' || category.trim() === '') {
    errors.push('category is required');
  } else if (!VALID_CATEGORIES.includes(category.trim())) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // ── description ──────────────────────────────────────────────
  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.push('description is required');
  } else {
    const trimmedDesc = description.trim();
    if (trimmedDesc.length > 255) {
      errors.push('description must be 255 characters or fewer');
    }
    if (trimmedDesc.split(/\s+/).length > 20) {
      errors.push('description cannot exceed 20 words');
    }
  }

  // ── date ─────────────────────────────────────────────────────
  if (!date || typeof date !== 'string') {
    errors.push('date is required (YYYY-MM-DD)');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('date must be in YYYY-MM-DD format');
  } else {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      errors.push('date is invalid');
    } else {
      // Prevent future dates
      const today = new Date();
      // Reset today's time to midnight for accurate day comparison
      today.setHours(0, 0, 0, 0);
      
      const inputDate = new Date(d);
      inputDate.setHours(0, 0, 0, 0);

      if (inputDate > today) {
        errors.push('date cannot be in the future');
      }
    }
  }

  // ── client_request_id ────────────────────────────────────────
  if (req.method !== 'PUT') {
    if (!client_request_id || typeof client_request_id !== 'string' || client_request_id.trim() === '') {
      errors.push('client_request_id is required (UUID)');
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(client_request_id.trim())) {
      errors.push('client_request_id must be a valid UUID v4');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

module.exports = { validateExpense, VALID_CATEGORIES };
