// app/src/components/projectTemplates/ProjectTemplateList.tsx
import React from 'react';
import { ProjectTemplate } from '@/types/projectTemplate';
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
  FileText,
  Layers
} from 'lucide-react';

interface ProjectTemplateListProps {
  projectTemplates: ProjectTemplate[];
  onEditProjectTemplate: (template: ProjectTemplate) => void;
  onDeleteProjectTemplate: (templateId: string) => void;
  onViewProjectTemplate: (template: ProjectTemplate) => void;
  onAddProjectTemplate?: () => void;
}

const ProjectTemplateList: React.FC<ProjectTemplateListProps> = ({
  projectTemplates,
  onEditProjectTemplate,
  onDeleteProjectTemplate,
  onViewProjectTemplate,
  onAddProjectTemplate
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Templates</CardTitle>
        {onAddProjectTemplate && (
          <Button onClick={onAddProjectTemplate} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Template
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {projectTemplates.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-4">No project templates found.</p>
            {onAddProjectTemplate && (
              <Button onClick={onAddProjectTemplate}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Project Template
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Questionnaire</TableHead>
                <TableHead>Task Set</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectTemplates.map((template) => (
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
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>
                        {typeof template.questionnaireId === 'string' 
                          ? template.questionnaireId 
                          : template.questionnaireId.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      <span>
                        {typeof template.taskSetId === 'string' 
                          ? template.taskSetId 
                          : template.taskSetId.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewProjectTemplate(template)}
                        title="View Template"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditProjectTemplate(template)}
                        title="Edit Template"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteProjectTemplate(template._id)}
                        title="Delete Template"
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

export default ProjectTemplateList;