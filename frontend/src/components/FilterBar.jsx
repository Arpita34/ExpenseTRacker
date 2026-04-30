const CATEGORIES = ['All', 'Food', 'Travel', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Other'];
const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date (Newest First)' },
  { value: 'date_asc', label: 'Date (Oldest First)' },
  { value: 'amount_desc', label: 'Amount (Highest First)' },
  { value: 'amount_asc', label: 'Amount (Lowest First)' },
];

export default function FilterBar({ filter, setFilter }) {
  const handleCategoryChange = (e) => {
    setFilter(prev => ({ ...prev, category: e.target.value }));
  };

  const handleSortChange = (e) => {
    setFilter(prev => ({ ...prev, sort: e.target.value }));
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="form-group" style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Category</label>
        <select 
          className="form-control" 
          value={filter.category} 
          onChange={handleCategoryChange}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="form-group" style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Sort By</label>
        <select 
          className="form-control" 
          value={filter.sort} 
          onChange={handleSortChange}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
