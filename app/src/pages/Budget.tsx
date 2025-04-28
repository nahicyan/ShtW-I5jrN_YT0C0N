import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Loader2, 
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BudgetEntry, BudgetEntryFormData, BudgetEntryType } from '@/types/budget';
import { Project } from '@/types/project';
import { budgetService, projectService } from '@/services/api';
import { formatCurrency, formatDate, parseDateForInput } from '@/lib/utils';

const Budget: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    // Set to Monday of current week
    now.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    now.setHours(0, 0, 0, 0);
    return now;
  });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetEntry | null>(null);
  const [formData, setFormData] = useState<BudgetEntryFormData>({
    projectId: projectId || '',
    description: '',
    amount: 0,
    type: BudgetEntryType.FORECAST,
    weekStart: parseDateForInput(currentWeekStart.toISOString()),
  });
  
  // Fetch projects for dropdown
  const { 
    data: projects,
    isLoading: isLoadingProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });
  
  // Fetch budget entries for the current week
  const { 
    data: budgetEntries, 
    isLoading: isLoadingBudget,
    isError: isBudgetError,
    refetch: refetchBudget,
  } = useQuery({
    queryKey: ['budgets', currentWeekStart.toISOString()],
    queryFn: () => budgetService.getBudgetEntries({ 
      weekStart: currentWeekStart.toISOString(),
      projectId: projectId || undefined,
    }),
  });
  
  // Fetch budget summary for the current week
  const { 
    data: budgetSummary, 
    isLoading: isLoadingSummary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['budget-summary', currentWeekStart.toISOString()],
    queryFn: () => budgetService.getBudgetSummary(currentWeekStart.toISOString()),
  });
  
  // Create budget entry mutation
  const createBudgetMutation = useMutation({
    mutationFn: (data: BudgetEntryFormData) => budgetService.createBudgetEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['budgets', currentWeekStart.toISOString()]
      });
      queryClient.invalidateQueries({ 
        queryKey: ['budget-summary', currentWeekStart.toISOString()]
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });
  
  // Update budget entry mutation
  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetEntryFormData> }) => 
      budgetService.updateBudgetEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['budgets', currentWeekStart.toISOString()]
      });
      queryClient.invalidateQueries({ 
        queryKey: ['budget-summary', currentWeekStart.toISOString()]
      });
      setEditingBudget(null);
      resetForm();
    },
  });
  
  // Delete budget entry mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => budgetService.deleteBudgetEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['budgets', currentWeekStart.toISOString()]
      });
      queryClient.invalidateQueries({ 
        queryKey: ['budget-summary', currentWeekStart.toISOString()]
      });
    },
  });
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      projectId: projectId || '',
      description: '',
      amount: 0,
      type: BudgetEntryType.FORECAST,
      weekStart: parseDateForInput(currentWeekStart.toISOString()),
    });
  };
  
  // Initialize form data when editing
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        projectId: editingBudget.projectId,
        taskId: editingBudget.taskId,
        description: editingBudget.description,
        amount: editingBudget.amount,
        type: editingBudget.type,
        weekStart: parseDateForInput(editingBudget.weekStart),
      });
    }
  }, [editingBudget]);
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };
  
  // Form change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Select change handler
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget._id, data: formData });
    } else {
      createBudgetMutation.mutate(formData);
    }
  };
  
  // Delete handler
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget entry?')) {
      deleteBudgetMutation.mutate(id);
    }
  };
  
  // Format week range for display
  const formatWeekRange = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };
  
  // Find project name by ID
  const getProjectName = (id: string) => {
    if (!projects) return id;
    const project = projects.find(p => p._id === id);
    return project ? project.name : id;
  };
  
  if (isLoadingProjects || isLoadingBudget || isLoadingSummary) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading budget data...</span>
      </div>
    );
  }
  
  if (isBudgetError || isSummaryError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading budget data. Please try again.</p>
        </div>
        <Button variant="outline" onClick={() => {
          refetchBudget();
          refetchSummary();
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(projectId ? `/projects/${projectId}` : '/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {projectId ? 'Back to Project' : 'Back to Projects'}
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {projectId ? `Budget for ${getProjectName(projectId)}` : 'Budget Dashboard'}
          </h1>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Budget Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <Select 
                  value={formData.projectId} 
                  onValueChange={(value) => handleSelectChange('projectId', value)}
                  disabled={!!projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BudgetEntryType.FORECAST}>Forecast</SelectItem>
                    <SelectItem value={BudgetEntryType.ACTUAL}>Actual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weekStart">Week Starting</Label>
                <Input
                  id="weekStart"
                  name="weekStart"
                  type="date"
                  value={formData.weekStart}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createBudgetMutation.isPending}
                >
                  {createBudgetMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Entry
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Week Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Week
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-medium">{formatWeekRange(currentWeekStart)}</div>
              <div className="text-sm text-muted-foreground">Week Budget Summary</div>
            </div>
            
            <Button variant="outline" onClick={goToNextWeek}>
              Next Week
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly Budget Summary */}
      {budgetSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
      
      {/* Budget Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          {!budgetEntries || budgetEntries.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-4">No budget entries found for this week.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>Add Budget Entry</Button>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="px-4 py-3 text-left">Project</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetEntries.map((entry) => (
                    <tr key={entry._id} className="border-b">
                      <td className="px-4 py-3">{getProjectName(entry.projectId)}</td>
                      <td className="px-4 py-3">{entry.description}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.type === BudgetEntryType.FORECAST 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {entry.type === BudgetEntryType.FORECAST ? 'Forecast' : 'Actual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(entry.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingBudget(entry)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive" 
                            onClick={() => handleDelete(entry._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Budget Dialog */}
      {editingBudget && (
        <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Budget Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-projectId">Project</Label>
                <Select 
                  value={formData.projectId} 
                  onValueChange={(value) => handleSelectChange('projectId', value)}
                  disabled={!!projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BudgetEntryType.FORECAST}>Forecast</SelectItem>
                    <SelectItem value={BudgetEntryType.ACTUAL}>Actual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount ($)</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-weekStart">Week Starting</Label>
                <Input
                  id="edit-weekStart"
                  name="weekStart"
                  type="date"
                  value={formData.weekStart}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingBudget(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateBudgetMutation.isPending}
                >
                  {updateBudgetMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Entry
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Budget;