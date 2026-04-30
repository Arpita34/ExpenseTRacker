import { useState, useEffect, useCallback } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import FilterBar from './components/FilterBar';
import ExpenseChart from './components/ExpenseChart';
import { fetchExpenses } from './api';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]); // ALWAYS contains unfiltered expenses
  const [totalCents, setTotalCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  
  const BUDGET_LIMIT_CENTS = 20000 * 100; // ₹20,000
  
  const [filter, setFilter] = useState({
    category: 'All',
    sort: 'date_desc'
  });

  const loadAllExpenses = useCallback(async () => {
    try {
      const data = await fetchExpenses('All', 'date_desc');
      setAllExpenses(data.expenses);
    } catch (err) {
      console.error("Failed to load all expenses for chart", err);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchExpenses(filter.category, filter.sort);
      setExpenses(data.expenses);
      setTotalCents(data.total);
      setError(null);
      
      // Also update the unfiltered list for the chart
      loadAllExpenses();
    } catch (err) {
      setError('Failed to load expenses. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [filter.category, filter.sort, loadAllExpenses]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const formatTotal = (cents) => {
    return (cents / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR'
    });
  };

  return (
    <div className="page-wrapper">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">▲</div>
            <div>
              <h1>Expense Tracker</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="app-container">
        <main className="form-section">
          <ExpenseForm 
            onExpenseAdded={loadExpenses} 
            expenseToEdit={expenseToEdit}
            onCancelEdit={() => setExpenseToEdit(null)}
          />
          <div style={{ marginTop: '2rem' }}>
            <ExpenseChart expenses={allExpenses} />
          </div>
        </main>

        <aside className="list-section">
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Overview & History</h2>
            </div>
            
            {totalCents > BUDGET_LIMIT_CENTS && (
              <div className="error-msg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', animation: 'fadeIn 0.5s ease' }}>
                <strong>⚠️ Budget Exceeded!</strong> You have spent over ₹20,000.
              </div>
            )}

            <div className="stats-card">
              <div>
                <h3>Total Expenses</h3>
                <p style={{fontSize: '0.85rem', opacity: 0.8}}>{filter.category !== 'All' ? `in ${filter.category}` : 'All time'}</p>
              </div>
              <div className="amount" style={{ color: totalCents > BUDGET_LIMIT_CENTS ? 'var(--danger)' : 'var(--text-primary)' }}>
                {formatTotal(totalCents)}
              </div>
            </div>

            <FilterBar filter={filter} setFilter={setFilter} />

            {error && <div className="error-msg">{error}</div>}
            
            {loading ? (
              <div className="loading">Loading expenses...</div>
            ) : (
              <ExpenseList 
                expenses={expenses} 
                onEdit={setExpenseToEdit} 
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
