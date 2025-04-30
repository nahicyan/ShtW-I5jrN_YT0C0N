import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Question, QuestionFormData } from '@/types/questionnaire';
import { questionService } from '@/services/api';
import QuestionForm from '@/components/questions/QuestionForm';
import QuestionList from '@/components/questions/QuestionList';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, AlertTriangle } from 'lucide-react';

const Questions: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Fetch questions
  const { 
    data: questions, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['questions'],
    queryFn: questionService.getQuestions,
  });
  
  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: (data: QuestionFormData) => questionService.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsAddDialogOpen(false);
      toast.success('Question created successfully');
    },
    onError: (error) => {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
    },
  });
  
  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: QuestionFormData }) => 
      questionService.updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setEditingQuestion(null);
      toast.success('Question updated successfully');
    },
    onError: (error) => {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    },
  });
  
  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => questionService.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    },
  });
  
  const handleCreateQuestion = (data: QuestionFormData) => {
    createQuestionMutation.mutate(data);
  };
  
  const handleUpdateQuestion = (data: QuestionFormData) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion._id, data });
    }
  };
  
  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      deleteQuestionMutation.mutate(id);
    }
  };
  
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
  };
  
  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingQuestion(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading questions...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading questions. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Question
        </Button>
      </div>
      
      <QuestionList
        questions={questions || []}
        onEditQuestion={handleEditQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        onAddQuestion={() => setIsAddDialogOpen(true)}
      />
      
      {/* Create/Edit Question Dialog */}
      <Dialog 
        open={isAddDialogOpen || !!editingQuestion} 
        onOpenChange={handleCloseDialog}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Create Question'}</DialogTitle>
          </DialogHeader>
          <QuestionForm
            initialData={editingQuestion || undefined}
            onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
            onCancel={handleCloseDialog}
            isSubmitting={createQuestionMutation.isPending || updateQuestionMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Questions;