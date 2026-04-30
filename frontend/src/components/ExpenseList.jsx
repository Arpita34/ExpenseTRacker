export default function ExpenseList({ expenses, onEdit, onDelete }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="empty-state">
        <h3>No expenses found</h3>
        <p>Add some expenses to see them here.</p>
      </div>
    );
  }

  const formatAmount = (cents) => {
    return (cents / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR'
    });
  };

  const getCategoryEmoji = (cat) => {
    const emojis = {
      Food: '🍔', Travel: '✈️', Shopping: '🛍️', Health: '🏥',
      Entertainment: '🎬', Utilities: '⚡', Other: '📦'
    };
    return emojis[cat] || '💸';
  };

  return (
    <div className="expense-list">
      {expenses.map((expense, i) => (
        <div 
          key={expense.id} 
          className="expense-item animate-fade-in"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="expense-info">
            <div className="expense-category-icon">
              {getCategoryEmoji(expense.category)}
            </div>
            <div className="expense-details">
              <h4>{expense.description}</h4>
              <p>{new Date(expense.date).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}</p>
              <span className="category-tag">{expense.category}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="expense-amount">
              {formatAmount(expense.amount)}
            </div>
            <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => onEdit(expense)} className="btn-icon" title="Edit">✏️</button>
              <button onClick={() => onDelete(expense.id)} className="btn-icon delete" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
