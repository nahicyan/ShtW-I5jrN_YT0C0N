import React from 'react';
import { TaskSet } from '@/types/taskSet';
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
import { 
  Edit,
  Trash2,
  Plus,
  Eye,
  Layers
} from 'lucide-react';

interface TaskSetListProps {
  taskSets: TaskSet[];
  onEditTaskSet: (taskSet: TaskSet) => void;
  onDeleteTaskSet: (taskSetId: string) => void;
  onViewTaskSet: (taskSet: TaskSet) => void;
  onAddTaskSet?: () => void;
}

const TaskSetList: React.FC<TaskSetListProps> = ({
  taskSets,
  onEditTaskSet,
  onDeleteTaskSet,
  onViewTaskSet,
  onAddTaskSet
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Sets</CardTitle>
        {onAddTaskSet && (
          <Button onClick={onAddTaskSet} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Task Set
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {taskSets.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-4">No task sets found.</p>
            {onAddTaskSet && (
              <Button onClick={onAddTaskSet}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Task Set
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Templates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskSets.map((taskSet) => (
                <TableRow key={taskSet._id}>
                  <TableCell className="font-medium">
                    {taskSet.name}
                    {taskSet.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {taskSet.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 mr-1" />
                      <span>
                        {Array.isArray(taskSet.taskTemplates) ? taskSet.taskTemplates.length : 0} templates
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewTaskSet(taskSet)}
                        title="View Templates"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditTaskSet(taskSet)}
                        title="Edit Task Set"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteTaskSet(taskSet._id)}
                        title="Delete Task Set"
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

export default TaskSetList;