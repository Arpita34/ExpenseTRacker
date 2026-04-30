import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createExpense, updateExpense } from '../api';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Other'];

export default function ExpenseForm({ onExpenseAdded, expenseToEdit, onCancelEdit }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: CATEGORIES[0],
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        amount: (expenseToEdit.amount / 100).toFixed(2),
        category: expenseToEdit.category,
        description: expenseToEdit.description,
        date: expenseToEdit.date,
      });
      setError(null);
    } else {
      setFormData({
        amount: '',
        category: CATEGORIES[0],
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [expenseToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.description.trim().split(/\s+/).length > 20) {
        setError('Description cannot exceed 20 words');
        setLoading(false);
        return;
      }

      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, formData);
        onCancelEdit();
      } else {
        const payload = {
          ...formData,
          client_request_id: uuidv4(), // Idempotency key
        };
        await createExpense(payload);
        setFormData({
          amount: '',
          category: CATEGORIES[0],
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
      }
      
      onExpenseAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="glass-panel">
      <h2>{expenseToEdit ? '✏️ Edit Expense' : 'Add New Expense'}</h2>
      {error && <div className="error-msg">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            name="amount"
            className="form-control"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            max="99999.99"
            required
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            className="form-control"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Description <span style={{fontSize: '0.8em', opacity: 0.7}}>(Max 20 words)</span></label>
          <input
            type="text"
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            placeholder="What was this for?"
            maxLength="255"
            required
          />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            className="form-control"
            value={formData.date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
            {loading ? (expenseToEdit ? 'Saving...' : 'Adding...') : (expenseToEdit ? 'Save Changes' : 'Add Expense')}
          </button>
          {expenseToEdit && (
            <button type="button" className="btn" onClick={onCancelEdit} style={{ flex: 1, background: '#475569' }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
