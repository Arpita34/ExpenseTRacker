const API_BASE = 'http://localhost:3001/expenses';

export const fetchExpenses = async (category = '', sort = 'date_desc') => {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (sort) params.append('sort', sort);

  const res = await fetch(`${API_BASE}?${params.toString()}`);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch expenses');
  }
  return data;
};

export const createExpense = async (expenseData) => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create expense');
  }
  return data;
};

export const updateExpense = async (id, expenseData) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to update expense');
  }
  return res.json();
};

export const deleteExpense = async (id) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete expense');
  }
  return true;
};
