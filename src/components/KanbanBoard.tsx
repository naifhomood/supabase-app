import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';

interface Column {
  id: string;
  title: string;
  color: string;
  position: number;
}

interface Task {
  id: string;
  title: string;
  column_id: string;
  position: number;
}

interface Props {
  defaultColumnColor: string;
}

const KanbanBoard: React.FC<Props> = ({ defaultColumnColor }) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#e2e8f0');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColumns();
    fetchTasks();
  }, []);

  const fetchColumns = async () => {
    try {
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('position');

      if (error) {
        console.error('Error fetching columns:', error);
        setError('حدث خطأ أثناء جلب الأعمدة');
        return;
      }

      console.log('Fetched columns:', data);
      setColumns(data || []);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position');

      if (error) {
        console.error('Error fetching tasks:', error);
        setError('حدث خطأ أثناء جلب المهام');
        return;
      }

      console.log('Fetched tasks:', data);
      setTasks(data || []);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ غير متوقع');
    }
  };

  const addColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    try {
      const newPosition = columns.length;
      const { data: newColumn, error } = await supabase
        .from('kanban_columns')
        .insert([
          {
            title: newColumnTitle.trim(),
            color: newColumnColor || defaultColumnColor,
            position: newPosition,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding column:', error);
        setError('حدث خطأ أثناء إضافة العمود');
        return;
      }

      console.log('Added new column:', newColumn);
      setColumns([...columns, newColumn]);
      setNewColumnTitle('');
      setNewColumnColor('#e2e8f0');
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ غير متوقع');
    }
  };

  const addTask = async (columnId: string) => {
    const taskTitle = window.prompt('أدخل عنوان المهمة:');
    if (!taskTitle?.trim()) return;

    try {
      const columnTasks = tasks.filter(task => task.column_id === columnId);
      const newPosition = columnTasks.length;
      const user = await supabase.auth.getUser();

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: taskTitle.trim(),
            column_id: columnId,
            position: newPosition,
            user_id: user.data.user?.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        setError('حدث خطأ أثناء إضافة المهمة');
        return;
      }

      console.log('Added new task:', newTask);
      setTasks([...tasks, newTask]);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ غير متوقع');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        setError('حدث خطأ أثناء حذف المهمة');
        return;
      }

      setTasks(tasks.filter(t => t.id !== taskId));
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ غير متوقع');
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العمود وجميع مهامه؟')) return;

    try {
      // First delete all tasks in the column
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('column_id', columnId);

      if (tasksError) {
        console.error('Error deleting column tasks:', tasksError);
        setError('حدث خطأ أثناء حذف مهام العمود');
        return;
      }

      // Then delete the column
      const { error: columnError } = await supabase
        .from('kanban_columns')
        .delete()
        .eq('id', columnId);

      if (columnError) {
        console.error('Error deleting column:', columnError);
        setError('حدث خطأ أثناء حذف العمود');
        return;
      }

      setTasks(tasks.filter(t => t.column_id !== columnId));
      setColumns(columns.filter(c => c.id !== columnId));
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ غير متوقع');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    console.log('Drag end result:', result);
    const { source, destination, draggableId } = result;
    
    if (!destination) return;

    try {
      const task = tasks.find(t => t.id === draggableId);
      if (!task) {
        console.error('Task not found:', draggableId);
        return;
      }

      // Get tasks in source and destination columns
      const sourceColumnTasks = tasks
        .filter(t => t.column_id === source.droppableId)
        .sort((a, b) => a.position - b.position);

      const destinationColumnTasks = source.droppableId === destination.droppableId
        ? sourceColumnTasks
        : tasks
            .filter(t => t.column_id === destination.droppableId)
            .sort((a, b) => a.position - b.position);

      // Remove task from source column
      const newSourceTasks = [...sourceColumnTasks];
      newSourceTasks.splice(source.index, 1);

      // Add task to destination column
      const newDestTasks = source.droppableId === destination.droppableId
        ? newSourceTasks
        : [...destinationColumnTasks];
      
      const updatedTask = {
        ...task,
        column_id: destination.droppableId,
        position: destination.index
      };

      newDestTasks.splice(destination.index, 0, updatedTask);

      // Update positions for all affected tasks
      const tasksToUpdate = [];

      // Update source column positions
      if (source.droppableId === destination.droppableId) {
        // Same column - just update positions in this column
        tasksToUpdate.push(
          ...newDestTasks.map((t, index) => ({
            ...t,
            position: index
          }))
        );
      } else {
        // Different columns - update positions in both columns
        tasksToUpdate.push(
          ...newSourceTasks.map((t, index) => ({
            ...t,
            position: index
          })),
          ...newDestTasks.map((t, index) => ({
            ...t,
            position: index
          }))
        );
      }

      console.log('Updating tasks:', tasksToUpdate);

      // Update state optimistically
      const newTasks = tasks.map(t => {
        const updatedTaskData = tasksToUpdate.find(ut => ut.id === t.id);
        return updatedTaskData || t;
      });
      setTasks(newTasks);

      // Update database
      const { error } = await supabase
        .from('tasks')
        .upsert(tasksToUpdate, { onConflict: 'id' });

      if (error) throw error;

      // Fetch fresh data to ensure consistency
      fetchTasks();

      setError(null);
    } catch (err) {
      console.error('Error during drag and drop:', err);
      setError('حدث خطأ أثناء تحريك العنصر');
      // Refresh the board to ensure consistent state
      fetchTasks();
    }
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="kanban-board">
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#ffe6e6',
          color: '#ff0000',
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={addColumn} className="add-column-form">
        <input
          type="text"
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          placeholder="عنوان العمود الجديد"
          required
        />
        <input
          type="color"
          value={newColumnColor}
          onChange={(e) => setNewColumnColor(e.target.value)}
          title="اختر لون العمود"
        />
        <button type="submit">إضافة عمود</button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns-container">
          {columns.map((column) => (
            <div
              key={column.id}
              className="column"
              style={{ backgroundColor: column.color }}
            >
              <div className="column-header">
                <h3>{column.title}</h3>
                <button
                  onClick={() => deleteColumn(column.id)}
                  className="delete-column-button"
                  title="حذف العمود"
                >
                  ×
                </button>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="task-list"
                  >
                    {tasks
                      .filter(task => task.column_id === column.id)
                      .sort((a, b) => a.position - b.position)
                      .map((task, taskIndex) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={taskIndex}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <div className="task-content">
                                {task.title}
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="delete-task-button"
                                  title="حذف المهمة"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <button
                onClick={() => addTask(column.id)}
                className="add-task-button"
              >
                + إضافة مهمة
              </button>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
