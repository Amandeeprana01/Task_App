import { useState } from 'react'

const priorityBadge = {
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
}

const priorityIcon = { high: '🔴', medium: '🟡', low: '🟢' }

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    setDeleting(true)
    await onDelete(task.id)
  }

  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date()

  return (
    <div className={`card group transition-all duration-200 hover:border-gray-700
      ${task.completed ? 'opacity-60' : ''}
      ${deleting ? 'opacity-30 scale-95' : ''}
    `}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, !task.completed)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
            ${task.completed
              ? 'bg-indigo-600 border-indigo-600'
              : 'border-gray-600 hover:border-indigo-400'
            }`}
        >
          {task.completed && <span className="text-white text-xs">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-sm leading-snug ${task.completed ? 'line-through text-gray-500' : 'text-gray-100'}`}>
              {task.title}
            </h3>
            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="text-gray-400 hover:text-indigo-400 transition text-sm px-1.5 py-0.5 rounded hover:bg-gray-800"
                title="Edit"
              >✏️</button>
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-400 transition text-sm px-1.5 py-0.5 rounded hover:bg-gray-800"
                title="Delete"
              >🗑️</button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={priorityBadge[task.priority]}>
              {priorityIcon[task.priority]} {task.priority}
            </span>
            {task.category && (
              <span className="bg-indigo-900/40 text-indigo-300 border border-indigo-800 text-xs px-2 py-0.5 rounded-full">
                {task.category}
              </span>
            )}
            {task.due_date && (
              <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                {isOverdue ? '⚠️' : '📅'} {task.due_date}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
