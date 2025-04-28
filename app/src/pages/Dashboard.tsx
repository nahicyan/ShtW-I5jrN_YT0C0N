import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Building, 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Loader2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { projectService, taskService, budgetService } from '@/services/api';
import { ProjectStatus } from '@/types/project';
import { TaskStatus } from '@/types/task';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

const Dashboard: React.FC = () => {
  // Get current week start date (Monday)
  const [currentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    // Set to Monday of current week
    now.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    now.setHours(0, 0, 0, 0);
    return now;
  });
  
  // Fetch projects
  const { 
    data: projects, 
    isLoading: isLoadingProjects,
    isError: isProjectsError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });
  
  // Fetch tasks for active projects
  const { 
    data: tasks, 
    isLoading: isLoadingTasks,
    isError: isTasksError,
  } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      if (!projects) return [];
      
      // Get active projects
      const activeProjects = projects.filter(p => 
        p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.PLANNING
      );
      
      if (activeProjects.length === 0) return [];
      
      // Fetch tasks for each active project
      const allTasks = await Promise.all(
        activeProjects.map(project => 
          taskService.getTasksByProject(project._id)
        )
      );
      
      // Flatten the array of task arrays
      return allTasks.flat();
    },
    enabled: !!projects,
  });
  
  // Fetch budget summary for current week
  const { 
    data: budgetSummary, 
    isLoading: isLoadingBudget,
    isError: isBudgetError,
  } = useQuery({
    queryKey: ['dashboard-budget-summary', currentWeekStart.toISOString()],
    queryFn: () => budgetService.getBudgetSummary(currentWeekStart.toISOString()),
  });
  
  // Calculate project stats
  const projectStats = {
    total: projects?.length || 0,
    planning: projects?.filter(p => p.status === ProjectStatus.PLANNING).length || 0,
    inProgress: projects?.filter(p => p.status === ProjectStatus.IN_PROGRESS).length || 0,
    onHold: projects?.filter(p => p.status === ProjectStatus.ON_HOLD).length || 0,
    completed: projects?.filter(p => p.status === ProjectStatus.COMPLETED).length || 0,
  };
  
  // Calculate task stats
  const taskStats = {
    total: tasks?.length || 0,
    notStarted: tasks?.filter(t => t.status === TaskStatus.NOT_STARTED).length || 0,
    inProgress: tasks?.filter(t => t.status === TaskStatus.IN_PROGRESS).length || 0,
    onHold: tasks?.filter(t => t.status === TaskStatus.ON_HOLD).length || 0,
    completed: tasks?.filter(t => t.status === TaskStatus.COMPLETED).length || 0,
  };
  
  // Find tasks due this week
  const tasksThisWeek = tasks?.filter(task => {
    const endDate = new Date(task.endDate);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return endDate >= currentWeekStart && endDate <= weekEnd;
  }) || [];
  
  // Sort tasks by end date
  tasksThisWeek.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  
  if (isLoadingProjects || isLoadingTasks || isLoadingBudget) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }
  
  if (isProjectsError || isTasksError || isBudgetError) {
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
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projects</CardDescription>
            <CardTitle className="text-4xl">{projectStats.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>In Progress: {projectStats.inProgress}</span>
              <span>Completed: {projectStats.completed}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link 
              to="/projects" 
              className="text-sm text-primary flex items-center"
            >
              View all projects <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasks</CardDescription>
            <CardTitle className="text-4xl">{taskStats.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>In Progress: {taskStats.inProgress}</span>
              <span>Completed: {taskStats.completed}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link 
              to="/schedule" 
              className="text-sm text-primary flex items-center"
            >
              View schedule <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Week's Budget</CardDescription>
            <CardTitle className="text-4xl">
              {budgetSummary ? formatCurrency(budgetSummary.totals.forecast) : '$0.00'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Actual: {budgetSummary ? formatCurrency(budgetSummary.totals.actual) : '$0.00'}</span>
              <span>Projects: {budgetSummary?.data.length || 0}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link 
              to="/budget" 
              className="text-sm text-primary flex items-center"
            >
              View budget <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasks Due This Week</CardDescription>
            <CardTitle className="text-4xl">{tasksThisWeek.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Week of: {formatDate(currentWeekStart)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-sm text-primary flex items-center">
              {formatDate(currentWeekStart)} - {formatDate(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
            </span>
          </CardFooter>
        </Card>
      </div>
      
      {/* Weekly Budget Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Budget Summary</CardTitle>
            <Link to="/budget" className="text-sm text-primary flex items-center">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <CardDescription>
            Budget forecast and actual spending for week of {formatDate(currentWeekStart)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgetSummary && budgetSummary.data.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="px-4 py-3 text-left">Project</th>
                    <th className="px-4 py-3 text-right">Forecast</th>
                    <th className="px-4 py-3 text-right">Actual</th>
                    <th className="px-4 py-3 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetSummary.data.map((item) => (
                    <tr key={item._id} className="border-b">
                      <td className="px-4 py-3">{item.projectName}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.forecast)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.actual)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={
                          item.actual > item.forecast 
                            ? 'text-destructive' 
                            : 'text-green-600'
                        }>
                          {formatCurrency(item.forecast - item.actual)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted font-medium">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(budgetSummary.totals.forecast)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(budgetSummary.totals.actual)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={
                        budgetSummary.totals.actual > budgetSummary.totals.forecast 
                          ? 'text-destructive' 
                          : 'text-green-600'
                      }>
                        {formatCurrency(budgetSummary.totals.forecast - budgetSummary.totals.actual)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No budget entries found for this week.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tasks Due This Week */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks Due This Week</CardTitle>
            <Link to="/schedule" className="text-sm text-primary flex items-center">
              View schedule <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <CardDescription>
            Tasks with deadlines during the week of {formatDate(currentWeekStart)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksThisWeek.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="px-4 py-3 text-left">Task</th>
                    <th className="px-4 py-3 text-left">Project</th>
                    <th className="px-4 py-3 text-left">Due Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksThisWeek.map((task) => {
                    const project = projects?.find(p => p._id === task.projectId);
                    return (
                      <tr key={task._id} className="border-b">
                        <td className="px-4 py-3 font-medium">{task.name}</td>
                        <td className="px-4 py-3">{project?.name || 'Unknown Project'}</td>
                        <td className="px-4 py-3">{formatDate(task.endDate)}</td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No tasks due this week.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" /> Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/projects/new" 
                  className="text-primary hover:underline"
                >
                  Create New Project
                </Link>
              </li>
              <li>
                <Link 
                  to="/projects" 
                  className="text-primary hover:underline"
                >
                  View All Projects
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/schedule" 
                  className="text-primary hover:underline"
                >
                  View Gantt Chart
                </Link>
              </li>
              {projects && projects.length > 0 && (
                <li>
                  <Link 
                    to={`/tasks/project/${projects[0]._id}`}
                    className="text-primary hover:underline"
                  >
                    Manage Tasks
                  </Link>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/budget" 
                  className="text-primary hover:underline"
                >
                  Weekly Budget Summary
                </Link>
              </li>
              {projects && projects.length > 0 && (
                <li>
                  <Link 
                    to={`/budget?project=${projects[0]._id}`}
                    className="text-primary hover:underline"
                  >
                    Project Budget Details
                  </Link>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;