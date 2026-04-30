import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ExpenseChart({ expenses }) {
  if (!expenses || expenses.length === 0) return null;

  // Aggregate expenses by category
  const aggregated = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (exp.amount / 100);
    return acc;
  }, {});

  const data = Object.keys(aggregated).map(key => ({
    name: key,
    value: aggregated[key]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#1e293b', '#10b981', '#b45309', '#3b82f6', '#ea580c', '#9ca3af'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>{payload[0].name}</p>
          <p style={{ margin: 0, color: payload[0].payload.fill }}>
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem', height: '350px' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Spending by Category</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
