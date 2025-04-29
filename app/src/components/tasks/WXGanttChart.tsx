import React, { useRef, useEffect } from 'react';
import { Gantt, Willow } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import { Task, TaskStatus } from '@/types/task';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, startDate: Date, endDate: Date) => void;
  onLinkCreate?: (sourceId: string, targetId: string, type: string) => void;
  onLinkDelete?: (linkId: string) => void;
}

const WXGanttChart: React.FC<GanttChartProps> = ({ 
  tasks, 
  onTaskUpdate,
  onLinkCreate,
  onLinkDelete
}) => {
  const apiRef = useRef(null);

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

  // Format dependencies as links - default to "e2s" (end-to-start) which is most common
  const links = tasks.flatMap(task => 
    task.dependencies?.map(depId => ({
      id: `${depId}-${task._id}`,
      source: depId,
      target: task._id,
      type: "e2s" // Default to end-to-start, the most common type
    })) || []
  );

  // Configure time scales
  const scales = [
    { unit: "month", step: 1, format: "MMMM yyyy" },
    { unit: "day", step: 1, format: "d" }
  ];

  // Initialize the API
  const init = (api) => {
    apiRef.current = api;
    
    // Handle task drag/resize in real-time
    api.on("drag-task", (event) => {
      const { id, inProgress } = event;
      
      // Only process when the drag operation is completed
      if (!inProgress) {
        const task = api.getTask(id);
        if (task && onTaskUpdate) {
          // Ensure we're working with dates, not strings
          const startDate = new Date(task.start);
          const endDate = new Date(task.end);
          onTaskUpdate(id, startDate, endDate);
        }
      }
    });
    
    // Handle link creation with the specific type selected by user
    api.on("add-link", (event) => {
      const { link } = event;
      if (link && onLinkCreate) {
        // The type comes from the user's selection in the UI
        // Types in wx-react-gantt: "e2s" = end-to-start, "s2s" = start-to-start, 
        // "e2e" = end-to-end, "s2e" = start-to-end
        onLinkCreate(link.source, link.target, link.type);
      }
    });
    
    // Handle link deletion
    api.on("delete-link", (event) => {
      const { id } = event;
      if (id && onLinkDelete) {
        onLinkDelete(id);
      }
    });
  };

  return (
    <Willow>
      <Gantt 
        tasks={formattedTasks} 
        links={links}
        scales={scales}
        init={init}
        onTaskDragEnd={(taskId, newStart, newEnd) => {
          if (onTaskUpdate && typeof taskId === 'string') {
            // Ensure we're working with Date objects, not strings
            const startDate = new Date(newStart);
            const endDate = new Date(newEnd);
            onTaskUpdate(taskId, startDate, endDate);
          }
        }}
      />
    </Willow>
  );
};

export default WXGanttChart;