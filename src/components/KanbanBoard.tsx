import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';

interface Task {
  id: number;
  title: string;
  position: number;
  column_id: string;
}

interface Column {
  id: string;
  title: string;
  position: number;
  tasks: Task[];
}

interface TaskUpdate {
  id: number;
  position: number;
  column_id: string;
}

interface Props {
  themeSettings: {
    board_bg: string;
    default_column_bg: string;
  };
}

const KanbanBoard: React.FC<Props> = ({ themeSettings }) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('');
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
            color: newColumnColor || themeSettings.default_column_bg,
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
      setColumns([...columns, { ...newColumn, tasks: [] }]);
      setNewColumnTitle('');
      setNewColumnColor('');
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
      setColumns(columns.map(col => col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col));
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

      setTasks(tasks.filter(t => t.id !== parseInt(taskId)));
      setColumns(columns.map(col => ({ ...col, tasks: col.tasks.filter(t => t.id !== parseInt(taskId)) })));
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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (result.type === 'column') {
      const newColumnOrder = Array.from(columns);
      const [removed] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, removed);
      
      setColumns(newColumnOrder);
      
      try {
        for (let i = 0; i < newColumnOrder.length; i++) {
          await supabase
            .from('kanban_columns')
            .update({ position: i })
            .eq('id', newColumnOrder[i].id);
        }
      } catch (error) {
        console.error('Error updating column positions:', error);
      }
    } else {
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);
      
      if (!sourceColumn || !destColumn) return;

      let tasksToUpdate: TaskUpdate[] = [];
      
      if (source.droppableId === destination.droppableId) {
        const newTasks = Array.from(sourceColumn.tasks);
        const [removed] = newTasks.splice(source.index, 1);
        newTasks.splice(destination.index, 0, removed);
        
        setColumns(columns.map(col => 
          col.id === sourceColumn.id ? { ...col, tasks: newTasks } : col
        ));
        
        tasksToUpdate = newTasks.map((task, index) => ({
          id: task.id,
          position: index,
          column_id: sourceColumn.id
        }));
      } else {
        const sourceTasks = Array.from(sourceColumn.tasks);
        const destTasks = Array.from(destColumn.tasks);
        const [removed] = sourceTasks.splice(source.index, 1);
        destTasks.splice(destination.index, 0, removed);
        
        setColumns(columns.map(col => {
          if (col.id === sourceColumn.id) return { ...col, tasks: sourceTasks };
          if (col.id === destColumn.id) return { ...col, tasks: destTasks };
          return col;
        }));
        
        tasksToUpdate = [
          ...sourceTasks.map((task, index) => ({
            id: task.id,
            position: index,
            column_id: sourceColumn.id
          })),
          ...destTasks.map((task, index) => ({
            id: task.id,
            position: index,
            column_id: destColumn.id
          }))
        ];
      }
      
      try {
        for (const task of tasksToUpdate) {
          await supabase
            .from('tasks')
            .update({
              position: task.position,
              column_id: task.column_id
            })
            .eq('id', task.id);
        }
      } catch (error) {
        console.error('Error updating task positions:', error);
      }
    }
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="kanban-board" style={{ backgroundColor: themeSettings.board_bg }}>
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

      <DragDropContext onDragEnd={handleDragEnd}>
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
                    {column.tasks
                      .sort((a, b) => a.position - b.position)
                      .map((task, taskIndex) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id.toString()}
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
                                  onClick={() => deleteTask(task.id.toString())}
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
