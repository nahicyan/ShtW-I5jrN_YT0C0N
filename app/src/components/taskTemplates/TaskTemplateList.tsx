import React from 'react';
import { TaskTemplate, DurationType } from '@/types/taskTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Edit,
  Trash2,
  Plus,
  Clock,
  CalendarClock
} from 'lucide-react';

interface TaskTemplateListProps {
  taskTemplates: TaskTemplate[];
  onEditTaskTemplate: (taskTemplate: TaskTemplate) => void;
  onDeleteTaskTemplate: (taskTemplateId: string) => void;
  onAddTaskTemplate?: () => void;
}

const TaskTemplateList: React.FC<TaskTemplateListProps> = ({
  taskTemplates,
  onEditTaskTemplate,
  onDeleteTaskTemplate,
  onAddTaskTemplate
}) => {
  const formatDurationType = (type: DurationType): string => {
    switch (type) {
      case DurationType.FROM_PROJECT_START:
        return 'From Project Start';
      case DurationType.FROM_PREVIOUS_TASK:
        return 'After Previous Task';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Templates</CardTitle>
        {onAddTaskTemplate && (
          <Button onClick={onAddTaskTemplate} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Template
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {taskTemplates.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-4">No task templates found.</p>
            {onAddTaskTemplate && (
              <Button onClick={onAddTaskTemplate}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Task Template
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskTemplates.map((template) => (
                <TableRow key={template._id}>
                  <TableCell className="font-medium">
                    {template.name}
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {template.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{template.duration} days</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {formatDurationType(template.durationType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${template.estimatedBudget.toLocaleString()}
                    {template.budgetAdjustments.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (+ adjustments)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditTaskTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteTaskTemplate(template._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskTemplateList;