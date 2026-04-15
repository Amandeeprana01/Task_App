import { useState, useEffect, useCallback } from 'react'
import { taskApi } from './api/tasks'
import { useWebSocket } from './hooks/useWebSocket'
import TaskCard from './components/TaskCard'
import TaskModal from './components/TaskModal'
import StatsBar from './components/StatsBar'
import LiveIndicator from './components/LiveIndicator'

const FILTERS = ['All', 'Pending', 'Completed']
const PRIORITIES = ['All', 'high', 'medium', 'low']

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadTasks = useCallback(async () => {
    try {
      setError(null)
      const data = await taskApi.getAll()
      setTasks(data)
    } catch (e) {
      setError('Could not connect to API. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  // WebSocket real-time handler
  const handleWsMessage = useCallback(({ event, data }) => {
    setWsConnected(true)
    setLastEvent(event.replace('_', ' '))

    if (event === 'task_created') {
      setTasks(prev => {
        if (prev.find(t => t.id === data.id)) return prev
        return [data, ...prev]
      })
      showToast(`New task: "${data.title}"`, 'success')
    } else if (event === 'task_updated') {
      setTasks(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t))
    } else if (event === 'task_deleted') {
      setTasks(prev => prev.filter(t => t.id !== data.id))
      showToast('Task removed', 'info')
    }
  }, [])

  useWebSocket(handleWsMessage)

  // Optimistic CRUD
  const handleCreate = async (formData) => {
    const task = await taskApi.create(formData)
    setTasks(prev => [task, ...prev.filter(t => t.id !== task.id)])
    showToast('Task created!', 'success')
  }

  const handleUpdate = async (formData) => {
    const task = await taskApi.update(editTask.id, formData)
    setTasks(prev => prev.map(t => t.id === task.id ? task : t))
    showToast('Task updated', 'success')
  }

  const handleToggle = async (id, completed) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
    await taskApi.toggleComplete(id, completed)
  }

  const handleDelete = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await taskApi.delete(id)
  }

  const handleEdit = (task) => {
    setEditTask(task)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditTask(null)
  }

  // Filtering
  const filtered = tasks
    .filter(t => {
      if (filter === 'Completed') return t.completed
      if (filter === 'Pending') return !t.completed
      return true
    })
    .filter(t => priorityFilter === 'All' || t.priority === priorityFilter)
    .filter(t =>
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border transition-all
          ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">⚡ TaskFlow</h1>
            <p className="text-xs text-gray-500">Real-time Task Manager</p>
          </div>
          <div className="flex items-center gap-4">
            <LiveIndicator connected={wsConnected} lastEvent={lastEvent} />
            <button
              onClick={() => { setEditTask(null); setShowModal(true) }}
              className="btn-primary text-sm"
            >
              + New Task
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsBar tasks={tasks} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="🔍 Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            className="input sm:w-36"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p === 'All' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 text-sm">Loading tasks...</p>
            </div>
          </div>
        ) : error ? (
          <div className="card border-red-800 bg-red-900/20 text-center py-10">
            <p className="text-red-400 font-medium">⚠️ {error}</p>
            <button onClick={loadTasks} className="btn-secondary mt-4 text-sm">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 font-medium">No tasks found</p>
            <p className="text-gray-600 text-sm mt-1">
              {tasks.length === 0 ? 'Create your first task to get started' : 'Try adjusting your filters'}
            </p>
            {tasks.length === 0 && (
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
                + Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          onClose={handleCloseModal}
          onSave={editTask ? handleUpdate : handleCreate}
        />
      )}
    </div>
  )
}
