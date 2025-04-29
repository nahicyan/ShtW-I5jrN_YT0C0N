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
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Sector 
} from 'recharts';
import { projectService, taskService, budgetService } from '@/services/api';
import { ProjectStatus } from '@/types/project';
import { TaskStatus } from '@/types/task';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

const Dashboard: React.FC = () => {
  // Get current week start date (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    // Set to Monday of current week
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
  
  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading: isLoadingDashboard,
    isError: isDashboardError,
  } = useQuery({
    queryKey: ['dashboard', currentWeekStart.toISOString()],
    queryFn: () => budgetService.getDashboardWeekly(currentWeekStart.toISOString()),
  });
  
  // Fetch projects for additional stats
  const { 
    data: projects, 
    isLoading: isLoadingProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });
  
  // Calculate project stats
  const projectStats = {
    total: projects?.length || 0,
    planning: projects?.filter(p => p.status === ProjectStatus.PLANNING).length || 0,
    inProgress: projects?.filter(p => p.status === ProjectStatus.IN_PROGRESS).length || 0,
    onHold: projects?.filter(p => p.status === ProjectStatus.ON_HOLD).length || 0,
    completed: projects?.filter(p => p.status === ProjectStatus.COMPLETED).length || 0,
  };
  
  // Prepare data for charts
  const budgetChartData = dashboardData?.budgetData.map((item: any) => ({
    name: item.projectName,
    forecast: item.forecast,
    actual: item.actual,
    variance: item.forecast - item.actual
  })) || [];
  
  // Task completion pie chart data
  const taskStatusMap: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold'
  };
  
  const taskStatusColors: Record<string, string> = {
    not_started: '#6B7280',
    in_progress: '#3B82F6',
    completed: '#10B981',
    on_hold: '#F59E0B'
  };
  
  const taskPieData = dashboardData?.taskStats.map((item: any) => ({
    name: taskStatusMap[item._id] || item._id,
    value: item.count,
    color: taskStatusColors[item._id] || '#000000'
  })) || [];
  
  if (isLoadingDashboard || isLoadingProjects) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }
  
  if (isDashboardError) {
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
            <CardDescription>Total Forecast</CardDescription>
            <CardTitle className="text-4xl">
              {dashboardData ? formatCurrency(dashboardData.budgetTotals.forecast) : '$0.00'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Projected spend for this week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Actual</CardDescription>
            <CardTitle className="text-4xl">
              {dashboardData ? formatCurrency(dashboardData.budgetTotals.actual) : '$0.00'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Actual spend for this week</span>
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
              {dashboardData?.taskStats.reduce((sum: number, item: any) => sum + item.count, 0) || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Tasks due this week</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Forecast vs Actual Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Budget Comparison
            </CardTitle>
            <CardDescription>
              Forecast vs. actual spending by project for the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="forecast" name="Forecast" fill="var(--chart-1)" />
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
                    data={taskPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskPieData.map((entry, index) => (
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
      
      {/* Weekly Budget Detail */}
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
          {dashboardData && dashboardData.budgetData.length > 0 ? (
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
                  {dashboardData.budgetData.map((item: any) => (
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
                    <td className="px-4 py-3 text-right">{formatCurrency(dashboardData.budgetTotals.forecast)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(dashboardData.budgetTotals.actual)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={
                        dashboardData.budgetTotals.actual > dashboardData.budgetTotals.forecast 
                          ? 'text-destructive' 
                          : 'text-green-600'
                      }>
                        {formatCurrency(dashboardData.budgetTotals.forecast - dashboardData.budgetTotals.actual)}
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
    </div>
  );
};

export default Dashboard;