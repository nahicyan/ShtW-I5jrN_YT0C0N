import React from 'react';
import { Gantt } from "wx-react-gantt";
import { Willow } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import { Task, TaskStatus } from '@/types/task';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, startDate: Date, endDate: Date) => void;
}

const WXGanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskUpdate }) => {
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
  const links = tasks.flatMap(task => 
    task.dependencies.map(depId => ({
      id: `${depId}-${task._id}`,
      source: depId,
      target: task._id,
      type: "e2e"
    }))
  );

  // Configure time scales
  const scales = [
    { unit: "month", step: 1, format: "MMMM yyyy" },
    { unit: "day", step: 1, format: "d" }
  ];

  return (
    <Willow>
      <Gantt 
        tasks={formattedTasks} 
        links={links}
        scales={scales}
        onTaskDragEnd={(taskId, newStart, newEnd) => {
          if (onTaskUpdate && typeof taskId === 'string') {
            onTaskUpdate(taskId, new Date(newStart), new Date(newEnd));
          }
        }}
      />
    </Willow>
  );
};

export default WXGanttChart;