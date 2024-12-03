import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Database } from '../types'

type Task = Database['public']['Tables']['tasks']['Row']

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // جلب المهام
  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  // إضافة مهمة جديدة
  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً')
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTaskTitle,
            user_id: user.id,
            is_complete: false
          }
        ])
        .select()

      if (error) throw error
      
      if (data) {
        setTasks([...tasks, ...data])
        setNewTaskTitle('')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'حدث خطأ في إضافة المهمة')
    }
  }

  // تحديث حالة المهمة
  async function toggleTaskComplete(task: Task) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_complete: !task.is_complete })
        .eq('id', task.id)

      if (error) throw error
      
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, is_complete: !t.is_complete } : t
      ))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'حدث خطأ في تحديث المهمة')
    }
  }

  // حذف مهمة
  async function deleteTask(taskId: number) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      
      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'حدث خطأ في حذف المهمة')
    }
  }

  if (loading) return <div>جاري التحميل...</div>
  if (error) return <div>خطأ: {error}</div>

  return (
    <div className="task-manager">
      <h2>قائمة المهام</h2>
      
      <form onSubmit={addTask} className="add-task-form">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="أدخل مهمة جديدة"
        />
        <button type="submit">إضافة</button>
      </form>

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={task.is_complete ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={task.is_complete}
              onChange={() => toggleTaskComplete(task)}
            />
            <span>{task.title}</span>
            <button onClick={() => deleteTask(task.id)}>حذف</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
