import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Building, 
  Calendar, 
  DollarSign, 
  Loader2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { projectService, taskService } from '@/services/api';
import { ProjectStatus } from '@/types/project';
import { TaskStatus } from '@/types/task';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

const Dashboard: React.FC = () => {
  // Get current week start date (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    now.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    now.setHours(0, 0, 0, 0);
    return now;
  });
  
  // Function to navigate to previous/next week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };
  
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };
  
  // Format week range for display
  const formatWeekRange = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };
  
  // Fetch projects
  const { 
    data: projects, 
    isLoading: isLoadingProjects,
    isError: isProjectsError
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });
  
  // Fetch tasks
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    isError: isTasksError
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskService.getTasks,
  });
  
  // Calculate project stats
  const projectStats = {
    total: projects?.length || 0,
    planning: projects?.filter(p => p.status === ProjectStatus.PLANNING).length || 0,
    inProgress: projects?.filter(p => p.status === ProjectStatus.IN_PROGRESS).length || 0,
    onHold: projects?.filter(p => p.status === ProjectStatus.ON_HOLD).length || 0,
    completed: projects?.filter(p => p.status === ProjectStatus.COMPLETED).length || 0,
  };
  
  // Calculate total forecasted cost (from all projects' estimated budgets)
  const totalForecastCost = projects?.reduce((sum, project) => 
    sum + (project.estimatedBudget || 0), 0) || 0;
  
  // Calculate total actual cost (from all projects' actual budgets)
  const totalActualCost = projects?.reduce((sum, project) => 
    sum + (project.actualBudget || 0), 0) || 0;
  
  // Filter tasks for the current week
  const weeklyTasks = tasks?.filter(task => {
    const taskStartDate = new Date(task.startDate);
    const taskEndDate = new Date(task.endDate);
    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    // Check if task dates overlap with current week
    return (
      (taskStartDate <= weekEndDate && taskEndDate >= currentWeekStart) ||
      (taskStartDate >= currentWeekStart && taskStartDate <= weekEndDate)
    );
  }) || [];
  
  // Calculate task costs for the current week
  const weeklyTaskCosts = weeklyTasks.reduce((sum, task) => sum + (task.estimatedBudget || 0), 0);
  
  // Calculate task actual costs for the current week
  const weeklyTaskActualCosts = weeklyTasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);
  
  // Group projects by status for chart
  const projectStatusData = [
    { name: 'Planning', value: projectStats.planning, color: '#6B7280' },
    { name: 'In Progress', value: projectStats.inProgress, color: '#3B82F6' },
    { name: 'On Hold', value: projectStats.onHold, color: '#F59E0B' },
    { name: 'Completed', value: projectStats.completed, color: '#10B981' },
  ].filter(item => item.value > 0);
  
  // Group tasks by status for chart
  const taskStatusCounts = weeklyTasks.reduce((counts: Record<string, number>, task) => {
    counts[task.status] = (counts[task.status] || 0) + 1;
    return counts;
  }, {});
  
  const taskStatusColors: Record<string, string> = {
    not_started: '#6B7280',
    in_progress: '#3B82F6',
    completed: '#10B981',
    on_hold: '#F59E0B'
  };
  
  const taskStatusMap: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold'
  };
  
  const taskStatusData = Object.entries(taskStatusCounts).map(([status, count]) => ({
    name: taskStatusMap[status] || status,
    value: count,
    color: taskStatusColors[status] || '#000000'
  }));
  
  // Prepare project budget data for chart - top 5 projects by budget
  const projectBudgetData = projects
    ?.slice()
    .sort((a, b) => (b.estimatedBudget || 0) - (a.estimatedBudget || 0))
    .slice(0, 5)
    .map(project => ({
      name: project.name,
      estimated: project.estimatedBudget || 0,
      actual: project.actualBudget || 0
    })) || [];
  
  if (isLoadingProjects || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }
  
  if (isProjectsError || isTasksError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading data. Please refresh the page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-medium px-2">
            {formatWeekRange(currentWeekStart)}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Project Costs</CardDescription>
            <CardTitle className="text-4xl">
              {formatCurrency(totalForecastCost)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Total estimated budget across all projects</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Week Tasks Cost</CardDescription>
            <CardTitle className="text-4xl">
              {formatCurrency(weeklyTaskCosts)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Estimated cost of tasks scheduled this week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className="text-4xl">{projectStats.inProgress}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-1" />
              <span>Currently in progress</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Week Tasks</CardDescription>
            <CardTitle className="text-4xl">
              {weeklyTasks.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Tasks scheduled this week</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Budget Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Project Budgets
            </CardTitle>
            <CardDescription>
              Estimated vs. actual costs for top projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectBudgetData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="estimated" name="Estimated" fill="var(--chart-1)" />
                  <Bar dataKey="actual" name="Actual" fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Task Status
            </CardTitle>
            <CardDescription>
              Distribution of task statuses for the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Weekly Task Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Task Summary</CardTitle>
            <Link to="/schedule" className="text-sm text-primary flex items-center">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <CardDescription>
            Tasks scheduled for week of {formatDate(currentWeekStart)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyTasks.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="px-4 py-3 text-left">Task</th>
                    <th className="px-4 py-3 text-left">Project</th>
                    <th className="px-4 py-3 text-left">Timeline</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyTasks.slice(0, 5).map((task) => {
                    const project = projects?.find(p => p._id === task.projectId);
                    return (
                      <tr key={task._id} className="border-b">
                        <td className="px-4 py-3 font-medium">{task.name}</td>
                        <td className="px-4 py-3">{project?.name || 'Unknown Project'}</td>
                        <td className="px-4 py-3">{formatDate(task.startDate)} - {formatDate(task.endDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === TaskStatus.COMPLETED 
                              ? 'bg-green-100 text-green-800' 
                              : task.status === TaskStatus.IN_PROGRESS 
                              ? 'bg-blue-100 text-blue-800' 
                              : task.status === TaskStatus.ON_HOLD 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status
                              .split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(task.estimatedBudget)}</td>
                      </tr>
                    );
                  })}
                  {weeklyTasks.length > 5 && (
                    <tr className="bg-muted">
                      <td colSpan={5} className="px-4 py-2 text-center">
                        <Link to="/schedule" className="text-sm text-primary">
                          View {weeklyTasks.length - 5} more tasks...
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-medium">
                    <td colSpan={4} className="px-4 py-3 text-right">Total Estimated Cost:</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(weeklyTaskCosts)}</td>
                  </tr>
                  {weeklyTaskActualCosts > 0 && (
                    <tr className="bg-muted font-medium">
                      <td colSpan={4} className="px-4 py-3 text-right">Total Actual Cost:</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(weeklyTaskActualCosts)}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No tasks scheduled for this week.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;