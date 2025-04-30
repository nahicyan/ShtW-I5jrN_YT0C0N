import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Questionnaire, QuestionnaireFormData, Question } from '@/types/questionnaire';
import { questionnaireService, questionService } from '@/services/api';
import QuestionnaireForm from '@/components/questionnaires/QuestionnaireForm';
import QuestionList from '@/components/questions/QuestionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  FileText,
  Eye,
  Search,
  X,
  Check
} from 'lucide-react';

const Questionnaires: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [viewingQuestionnaire, setViewingQuestionnaire] = useState<Questionnaire | null>(null);
  const [isAddingQuestions, setIsAddingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch questionnaires
  const { 
    data: questionnaires, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['questionnaires'],
    queryFn: questionnaireService.getQuestionnaires,
  });
  
  // Fetch detailed questionnaire when viewing
  const { 
    data: detailedQuestionnaire,
    isLoading: isLoadingDetails,
    isError: isDetailsError
  } = useQuery({
    queryKey: ['questionnaire', viewingQuestionnaire?._id],
    queryFn: () => questionnaireService.getQuestionnaire(viewingQuestionnaire?._id || ''),
    enabled: !!viewingQuestionnaire,
  });

  // Fetch all questions for adding to questionnaire
  const {
    data: allQuestions,
    isLoading: isLoadingQuestions,
  } = useQuery({
    queryKey: ['questions'],
    queryFn: questionService.getQuestions,
    enabled: isAddingQuestions,
  });
  
  // Create questionnaire mutation
  const createQuestionnaireMutation = useMutation({
    mutationFn: (data: QuestionnaireFormData) => questionnaireService.createQuestionnaire(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      setIsAddDialogOpen(false);
      toast.success('Questionnaire created successfully');
    },
    onError: (error) => {
      console.error('Error creating questionnaire:', error);
      toast.error('Failed to create questionnaire');
    },
  });
  
  // Update questionnaire mutation
  const updateQuestionnaireMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QuestionnaireFormData> }) => 
      questionnaireService.updateQuestionnaire(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      setEditingQuestionnaire(null);
      toast.success('Questionnaire updated successfully');
    },
    onError: (error) => {
      console.error('Error updating questionnaire:', error);
      toast.error('Failed to update questionnaire');
    },
  });
  
  // Delete questionnaire mutation
  const deleteQuestionnaireMutation = useMutation({
    mutationFn: (id: string) => questionnaireService.deleteQuestionnaire(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      toast.success('Questionnaire deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting questionnaire:', error);
      toast.error('Failed to delete questionnaire');
    },
  });
  
  // Update question order mutation
  const updateQuestionOrderMutation = useMutation({
    mutationFn: ({ questionnaireId, questions }: { questionnaireId: string; questions: string[] }) => 
      questionnaireService.updateQuestionOrder(questionnaireId, questions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire', variables.questionnaireId] });
      toast.success('Question order updated');
    },
    onError: (error) => {
      console.error('Error updating question order:', error);
      toast.error('Failed to update question order');
    },
  });
  
  // Add question to questionnaire mutation
  const addQuestionMutation = useMutation({
    mutationFn: ({ questionnaireId, questionId }: { questionnaireId: string; questionId: string }) => 
      questionnaireService.addQuestionToQuestionnaire(questionnaireId, questionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire', variables.questionnaireId] });
      toast.success('Question added to questionnaire');
    },
    onError: (error) => {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
    },
  });

  // Remove question from questionnaire mutation
  const removeQuestionMutation = useMutation({
    mutationFn: ({ questionnaireId, questionId }: { questionnaireId: string; questionId: string }) => 
      questionnaireService.removeQuestionFromQuestionnaire(questionnaireId, questionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire', variables.questionnaireId] });
      toast.success('Question removed from questionnaire');
    },
    onError: (error) => {
      console.error('Error removing question:', error);
      toast.error('Failed to remove question');
    },
  });
  
  const handleCreateQuestionnaire = (data: QuestionnaireFormData) => {
    createQuestionnaireMutation.mutate(data);
  };
  
  const handleUpdateQuestionnaire = (data: QuestionnaireFormData) => {
    if (editingQuestionnaire) {
      updateQuestionnaireMutation.mutate({ id: editingQuestionnaire._id, data });
    }
  };
  
  const handleDeleteQuestionnaire = (id: string) => {
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      deleteQuestionnaireMutation.mutate(id);
    }
  };
  
  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire);
  };
  
  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingQuestionnaire(null);
  };
  
  const handleViewQuestionnaire = (questionnaire: Questionnaire) => {
    setViewingQuestionnaire(questionnaire);
    setIsAddingQuestions(false);
    setSearchTerm('');
  };
  
  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    if (!detailedQuestionnaire) return;
    
    const questions = detailedQuestionnaire.questions as Question[];
    const questionIds = questions.map(q => q._id);
    const currentIndex = questionIds.indexOf(questionId);
    
    if (currentIndex === -1) return;
    
    const newQuestionIds = [...questionIds];
    
    if (direction === 'up' && currentIndex > 0) {
      // Swap with the previous item
      [newQuestionIds[currentIndex], newQuestionIds[currentIndex - 1]] = 
      [newQuestionIds[currentIndex - 1], newQuestionIds[currentIndex]];
    } else if (direction === 'down' && currentIndex < questionIds.length - 1) {
      // Swap with the next item
      [newQuestionIds[currentIndex], newQuestionIds[currentIndex + 1]] = 
      [newQuestionIds[currentIndex + 1], newQuestionIds[currentIndex]];
    } else {
      return; // No change needed
    }
    
    updateQuestionOrderMutation.mutate({
      questionnaireId: detailedQuestionnaire._id,
      questions: newQuestionIds,
    });
  };
  
  const handleRemoveQuestion = (questionId: string) => {
    if (!viewingQuestionnaire) return;
    
    if (window.confirm('Are you sure you want to remove this question from the questionnaire?')) {
      removeQuestionMutation.mutate({
        questionnaireId: viewingQuestionnaire._id,
        questionId,
      });
    }
  };

  const handleAddQuestion = (questionId: string) => {
    if (!viewingQuestionnaire) return;
    
    addQuestionMutation.mutate({
      questionnaireId: viewingQuestionnaire._id,
      questionId,
    });
  };

  const toggleAddQuestions = () => {
    setIsAddingQuestions(!isAddingQuestions);
    setSearchTerm('');
  };

  // Filter available questions based on search term
  const filteredQuestions = allQuestions?.filter(question => {
    // Filter out questions that are already in the questionnaire
    const isAlreadyAdded = detailedQuestionnaire?.questions.some(q => {
      return typeof q === 'string' 
        ? q === question._id 
        : q._id === question._id;
    });
    
    // Filter by search term
    const matchesSearch = !searchTerm || 
      question.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    return !isAlreadyAdded && matchesSearch;
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading questionnaires...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading questionnaires. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Questionnaires</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Questionnaire
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Questionnaire List</CardTitle>
        </CardHeader>
        <CardContent>
          {questionnaires && questionnaires.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionnaires.map((questionnaire) => (
                  <TableRow key={questionnaire._id}>
                    <TableCell className="font-medium">{questionnaire.name}</TableCell>
                    <TableCell>
                      {questionnaire.description ? (
                        <span className="line-clamp-2">{questionnaire.description}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell>{Array.isArray(questionnaire.questions) ? questionnaire.questions.length : 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewQuestionnaire(questionnaire)}
                          title="View Questions"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditQuestionnaire(questionnaire)}
                          title="Edit Questionnaire"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteQuestionnaire(questionnaire._id)}
                          title="Delete Questionnaire"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-6">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No questionnaires found.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Questionnaire
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create/Edit Questionnaire Dialog */}
      <Dialog 
        open={isAddDialogOpen || !!editingQuestionnaire} 
        onOpenChange={handleCloseDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionnaire ? 'Edit Questionnaire' : 'Create Questionnaire'}
            </DialogTitle>
          </DialogHeader>
          <QuestionnaireForm
            initialData={editingQuestionnaire || undefined}
            onSubmit={editingQuestionnaire ? handleUpdateQuestionnaire : handleCreateQuestionnaire}
            onCancel={handleCloseDialog}
            isSubmitting={createQuestionnaireMutation.isPending || updateQuestionnaireMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Questionnaire Dialog */}
      <Dialog 
        open={!!viewingQuestionnaire} 
        onOpenChange={(open) => {
          if (!open) {
            setViewingQuestionnaire(null);
            setIsAddingQuestions(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex-1">
              {viewingQuestionnaire?.name} - Questions
            </DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant={isAddingQuestions ? "default" : "outline"} 
                onClick={toggleAddQuestions}
              >
                {isAddingQuestions ? 'Cancel' : 'Add Questions'}
              </Button>
            </div>
          </DialogHeader>
          
          {/* Questions List */}
          {isLoadingDetails ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : isDetailsError ? (
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">
              <AlertTriangle className="h-5 w-5 inline mr-2" />
              <span>Error loading questions. Please try again.</span>
            </div>
          ) : (
            <div className="py-4">
              {detailedQuestionnaire && (
                <>
                  {/* Current Questions */}
                  {Array.isArray(detailedQuestionnaire.questions) && detailedQuestionnaire.questions.length > 0 ? (
                    <QuestionList
                      questions={detailedQuestionnaire.questions as Question[]}
                      onEditQuestion={() => {}} // Not implemented for questions in questionnaire view
                      onDeleteQuestion={handleRemoveQuestion}
                      onMoveQuestion={handleMoveQuestion}
                      isOrdering={true}
                    />
                  ) : (
                    <div className="text-center p-6 bg-muted rounded-md">
                      <p className="text-muted-foreground mb-4">This questionnaire has no questions.</p>
                      <Button onClick={toggleAddQuestions}>
                        <Plus className="h-4 w-4 mr-2" /> Add Questions
                      </Button>
                    </div>
                  )}
                  
                  {/* Add Questions Panel */}
                  {isAddingQuestions && (
                    <div className="mt-4 p-4 border rounded-md">
                      <h3 className="text-lg font-medium mb-4">Add Questions</h3>
                      
                      <div className="relative mb-4">
                        <Input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search questions..."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {searchTerm ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSearchTerm('')}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Search className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      {isLoadingQuestions ? (
                        <div className="flex justify-center items-center h-20">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="ml-2">Loading available questions...</span>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
                          {filteredQuestions && filteredQuestions.length > 0 ? (
                            filteredQuestions.map(question => (
                              <div key={question._id} className="flex justify-between items-center p-3 hover:bg-muted">
                                <div className="line-clamp-2">{question.text}</div>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddQuestion(question._id)}
                                  className="ml-2 shrink-0"
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              {searchTerm ? 'No matching questions found.' : 'No available questions. Create some first!'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setViewingQuestionnaire(null);
                setIsAddingQuestions(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Questionnaires;