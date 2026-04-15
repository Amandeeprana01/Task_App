export default function StatsBar({ tasks }) {
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const pending = total - completed
  const high = tasks.filter(t => t.priority === 'high' && !t.completed).length
  const overdue = tasks.filter(t => t.due_date && !t.completed && new Date(t.due_date) < new Date()).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Total', value: total, color: 'text-gray-300', bg: 'bg-gray-800/50' },
        { label: 'Pending', value: pending, color: 'text-indigo-400', bg: 'bg-indigo-900/20' },
        { label: 'High Priority', value: high, color: 'text-red-400', bg: 'bg-red-900/20' },
        { label: 'Overdue', value: overdue, color: 'text-orange-400', bg: 'bg-orange-900/20' },
      ].map(stat => (
        <div key={stat.label} className={`${stat.bg} border border-gray-800 rounded-xl p-3 text-center`}>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
