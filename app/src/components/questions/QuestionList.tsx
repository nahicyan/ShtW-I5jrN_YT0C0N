import React from 'react';
import { Question, QuestionType } from '@/types/questionnaire';
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
  MoveUp,
  MoveDown,
  ListChecks,
  Calendar,
  ToggleLeft,
  Text,
  Hash,
  SlidersHorizontal
} from 'lucide-react';

interface QuestionListProps {
  questions: Question[];
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddQuestion?: () => void;
  onMoveQuestion?: (questionId: string, direction: 'up' | 'down') => void;
  isOrdering?: boolean;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onEditQuestion,
  onDeleteQuestion,
  onAddQuestion,
  onMoveQuestion,
  isOrdering = false
}) => {
  // Get icon based on question type
  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case QuestionType.TEXT:
        return <Text className="h-4 w-4" />;
      case QuestionType.NUMBER:
        return <Hash className="h-4 w-4" />;
      case QuestionType.RANGE:
        return <SlidersHorizontal className="h-4 w-4" />;
      case QuestionType.SELECT:
        return <ListChecks className="h-4 w-4" />;
      case QuestionType.MULTISELECT:
        return <ListChecks className="h-4 w-4" />;
      case QuestionType.DATE:
        return <Calendar className="h-4 w-4" />;
      case QuestionType.BOOLEAN:
        return <ToggleLeft className="h-4 w-4" />;
      default:
        return <Text className="h-4 w-4" />;
    }
  };

  // Get readable question type
  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.TEXT:
        return 'Text';
      case QuestionType.NUMBER:
        return 'Number';
      case QuestionType.RANGE:
        return 'Range';
      case QuestionType.SELECT:
        return 'Select';
      case QuestionType.MULTISELECT:
        return 'Multi-Select';
      case QuestionType.DATE:
        return 'Date';
      case QuestionType.BOOLEAN:
        return 'Yes/No';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Questions</CardTitle>
        {onAddQuestion && (
          <Button onClick={onAddQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Question
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-4">No questions found.</p>
            {onAddQuestion && (
              <Button onClick={onAddQuestion}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Question
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isOrdering && <TableHead>Order</TableHead>}
                <TableHead>Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question, index) => (
                <TableRow key={question._id}>
                  {isOrdering && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onMoveQuestion?.(question._id, 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onMoveQuestion?.(question._id, 'down')}
                          disabled={index === questions.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="font-medium">{question.text}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getQuestionTypeIcon(question.answerType)}
                      {getQuestionTypeLabel(question.answerType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {question.isRequired ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onEditQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onDeleteQuestion(question._id)}
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

export default QuestionList;