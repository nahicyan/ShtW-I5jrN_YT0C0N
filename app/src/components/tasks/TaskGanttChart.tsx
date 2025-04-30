import React, { useRef, useEffect } from 'react';
import { Gantt, Willow } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import { Task, TaskStatus } from '@/types/task';

interface TaskGanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, startDate: Date, endDate: Date) => void;
  onDependencyAdd?: (sourceId: string, targetId: string, type: string) => void;
  onDependencyRemove?: (sourceId: string, targetId: string) => void;
  projectStartDate?: string;
  projectEndDate?: string;
}

const TaskGanttChart: React.FC<TaskGanttChartProps> = ({ 
  tasks, 
  onTaskUpdate,
  onDependencyAdd,
  onDependencyRemove,
  projectStartDate,
  projectEndDate
}) => {
  const apiRef = useRef(null);
  const linkMapRef = useRef<Record<string, {source: string, target: string, type: string}>>({});
  const isUpdatingRef = useRef(false);
  
  // Convert tasks to wx-react-gantt format
  const formattedTasks = tasks.map(task => ({
    id: task._id,
    text: task.name,
    start: new Date(task.startDate),
    end: new Date(task.endDate),
    duration: Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)),
    progress: task.status === TaskStatus.COMPLETED ? 100 : 
              task.status === TaskStatus.IN_PROGRESS ? 50 : 
              task.status === TaskStatus.ON_HOLD ? 25 : 0,
    type: "task"
  }));

  // Format dependencies as links
  const formattedLinks = tasks.flatMap(task => 
    task.dependencies.map(depId => ({
      id: `link-${depId}-${task._id}`,
      source: depId,
      target: task._id,
      type: "e2s" // Default to end-to-start
    }))
  );

  // Update the linkMap whenever the formatted links change
  useEffect(() => {
    const newLinkMap: Record<string, {source: string, target: string, type: string}> = {};
    formattedLinks.forEach(link => {
      newLinkMap[link.id] = {
        source: link.source,
        target: link.target,
        type: link.type
      };
    });
    linkMapRef.current = newLinkMap;
  }, [formattedLinks]);

  // Calculate date range for scales
  const startDate = projectStartDate 
    ? new Date(projectStartDate) 
    : tasks.length > 0 
      ? new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime())))
      : new Date();

  const endDate = projectEndDate 
    ? new Date(projectEndDate) 
    : tasks.length > 0 
      ? new Date(Math.max(...tasks.map(t => new Date(t.endDate).getTime())))
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 day span

  // Add padding to date range
  const paddedStartDate = new Date(startDate);
  paddedStartDate.setDate(paddedStartDate.getDate() - 5);
  const paddedEndDate = new Date(endDate);
  paddedEndDate.setDate(paddedEndDate.getDate() + 5);

  // Configure time scales
  const scales = [
    { unit: "month", step: 1, format: "MMMM yyyy" },
    { unit: "day", step: 1, format: "d" }
  ];
  
  // Safe function to update task
  const safeUpdateTask = (taskId: string) => {
    if (isUpdatingRef.current) return;
    if (!apiRef.current) return;
    
    try {
      // Get the task with updated dates
      const task = apiRef.current.getTask(taskId);
      if (!task) {
        console.error("Task not found:", taskId);
        return;
      }
      
      // Convert dates properly
      const startDate = new Date(task.start);
      const endDate = new Date(task.end);
      
      console.log(`Updating task ${taskId} with:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      // Flag to prevent duplicate updates
      isUpdatingRef.current = true;
      
      // Call the update handler
      if (onTaskUpdate) {
        onTaskUpdate(taskId, startDate, endDate);
      }
      
      // Reset flag after a short delay to allow other events to complete
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 500);
    } catch (err) {
      console.error("Error updating task:", err);
      isUpdatingRef.current = false;
    }
  };

  // Initialize and set up event listeners
  const init = (api) => {
    apiRef.current = api;

    // Listen for drag events
    api.on("drag-task", (ev) => {
      // Only update when the drag is complete
      if (ev.inProgress === false && (ev.left !== undefined || ev.width !== undefined)) {
        safeUpdateTask(ev.id);
      }
    });
    
    // Listen for update events
    api.on("update-task", (ev) => {
      if (ev.id && (ev.task?.start || ev.task?.end)) {
        safeUpdateTask(ev.id);
      }
    });

    // Handle link events
    api.on("add-link", (ev) => {
      if (ev.link && onDependencyAdd) {
        const { source, target, type } = ev.link;
        onDependencyAdd(source, target, type);
        linkMapRef.current[ev.id] = { source, target, type };
      }
    });

    api.on("delete-link", (ev) => {
      const linkInfo = linkMapRef.current[ev.id];
      if (linkInfo && onDependencyRemove) {
        const { source, target } = linkInfo;
        onDependencyRemove(source, target);
        delete linkMapRef.current[ev.id];
      }
    });

    api.on("update-link", (ev) => {
      if (ev.id && ev.link && onDependencyRemove && onDependencyAdd) {
        const oldLink = linkMapRef.current[ev.id];
        if (oldLink) {
          onDependencyRemove(oldLink.source, oldLink.target);
        }
        
        const { source, target, type } = ev.link;
        onDependencyAdd(source, target, type);
        linkMapRef.current[ev.id] = { source, target, type };
      }
    });
  };

  // Handle task drag end - direct callback from the component
  const handleTaskDragEnd = (taskId, newStart, newEnd) => {
    if (isUpdatingRef.current) return;
    
    console.log(`Task ${taskId} dragged to:`, { newStart, newEnd });
    
    const startDate = new Date(newStart);
    const endDate = new Date(newEnd);
    
    // Set flag to prevent duplicate updates
    isUpdatingRef.current = true;
    
    if (onTaskUpdate && typeof taskId === 'string') {
      onTaskUpdate(taskId, startDate, endDate);
    }
    
    // Reset flag after a delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 500);
  };

  return (
    <div className="h-full w-full">
      <Willow>
        <Gantt 
          tasks={formattedTasks} 
          links={formattedLinks}
          scales={scales}
          start={paddedStartDate}
          end={paddedEndDate}
          init={init}
          onTaskDragEnd={handleTaskDragEnd}
          cellWidth={80}
          readonly={false}
        />
      </Willow>
    </div>
  );
};

export default TaskGanttChart;