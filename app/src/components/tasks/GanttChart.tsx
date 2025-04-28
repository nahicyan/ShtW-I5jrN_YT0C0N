import React, { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface GanttChartProps {
  tasks: Task[];
  projectStartDate?: string;
  projectEndDate?: string;
}

const GanttChart: React.FC<GanttChartProps> = ({ 
  tasks, 
  projectStartDate, 
  projectEndDate 
}) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [taskBars, setTaskBars] = useState<{ [key: string]: { left: string; width: string; } }>({});
  
  // Calculate project date range
  useEffect(() => {
    if (tasks.length === 0) return;
    
    // Find the earliest start date and latest end date among all tasks
    let earliest = projectStartDate 
      ? new Date(projectStartDate) 
      : new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime())));
    
    let latest = projectEndDate 
      ? new Date(projectEndDate) 
      : new Date(Math.max(...tasks.map(t => new Date(t.endDate).getTime())));
    
    // Add some padding days
    earliest.setDate(earliest.getDate() - 2);
    latest.setDate(latest.getDate() + 2);
    
    setStartDate(earliest);
    setEndDate(latest);
    
    // Create array of all dates in the range
    const range: Date[] = [];
    const current = new Date(earliest);
    
    while (current <= latest) {
      range.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    setDateRange(range);
  }, [tasks, projectStartDate, projectEndDate]);
  
  // Calculate task positions
  useEffect(() => {
    if (dateRange.length === 0 || tasks.length === 0) return;
    
    const totalDays = dateRange.length;
    const bars: { [key: string]: { left: string; width: string; } } = {};
    
    tasks.forEach(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      
      // Calculate task position and width
      const startDiff = Math.max(0, Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const duration = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      const leftPercent = (startDiff / totalDays) * 100;
      const widthPercent = (duration / totalDays) * 100;
      
      bars[task._id] = {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      };
    });
    
    setTaskBars(bars);
  }, [tasks, dateRange, startDate]);
  
  // Generate week labels
  const generateWeekLabels = () => {
    if (dateRange.length === 0) return [];
    
    const weeks: { start: Date; end: Date }[] = [];
    let weekStart = new Date(dateRange[0]);
    
    // Adjust to start on Monday
    const day = weekStart.getDay();
    if (day !== 1) {
      weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    }
    
    // Generate week ranges
    while (weekStart <= endDate) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeks.push({ start: new Date(weekStart), end: new Date(weekEnd) });
      
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    return weeks;
  };
  
  const weeks = generateWeekLabels();
  
  // Get status-based color
  const getTaskColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-400';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'on_hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-muted-foreground">
            No tasks available to display in the timeline.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Headers */}
            <div className="flex border-b">
              <div className="w-1/4 min-w-[200px] p-2 font-medium">Task</div>
              <div className="w-3/4 flex">
                {weeks.map((week, index) => (
                  <div 
                    key={index}
                    className="flex-1 p-2 text-center text-xs border-l"
                  >
                    {formatDate(week.start)} - {formatDate(week.end)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Gantt Chart Body */}
            <div>
              {tasks.map(task => (
                <div key={task._id} className="flex border-b hover:bg-muted/50">
                  <div className="w-1/4 min-w-[200px] p-2 truncate">
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(task.startDate)} - {formatDate(task.endDate)}
                    </div>
                  </div>
                  <div className="w-3/4 p-2 relative" style={{ height: '60px' }}>
                    {taskBars[task._id] && (
                      <div 
                        className={`absolute top-3 h-8 rounded-md ${getTaskColor(task.status)} opacity-80`}
                        style={{ 
                          left: taskBars[task._id].left, 
                          width: taskBars[task._id].width 
                        }}
                        title={`${task.name}: ${formatDate(task.startDate)} - ${formatDate(task.endDate)}`}
                      >
                        <div className="px-2 py-1 text-xs text-white font-medium truncate">
                          {task.name}
                        </div>
                      </div>
                    )}
                    
                    {/* Dependencies */}
                    {task.dependencies.map(depId => {
                      const dependency = tasks.find(t => t._id === depId);
                      if (!dependency || !taskBars[depId] || !taskBars[task._id]) return null;
                      
                      // Simple way to show dependency - would be better with SVG arrows
                      return (
                        <div 
                          key={`${task._id}-${depId}`}
                          className="absolute top-7 h-0 border-t border-dashed border-gray-400 z-0"
                          style={{
                            left: taskBars[depId].left,
                            width: `calc(${taskBars[task._id].left} - ${taskBars[depId].left})`,
                            transformOrigin: 'left',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 mt-4 justify-end">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gray-400"></div>
                <span className="text-xs">Not Started</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                <span className="text-xs">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                <span className="text-xs">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                <span className="text-xs">On Hold</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;