import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle,
  Trophy,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

// Define question types
type QuestionType = 'multiple-choice' | 'single-choice' | 'true-false';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  explanation: string;
  options: QuestionOption[];
}

interface TrainingModuleProps {
  moduleId: string;
  title: string;
  description: string;
  questions: Question[];
  onComplete: (score: number, moduleId: string) => void;
}

const TrainingModule: React.FC<TrainingModuleProps> = ({
  moduleId,
  title,
  description,
  questions,
  onComplete
}) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Handle answer selection
  const handleAnswerSelect = (questionId: string, optionId: string, isMultiple: boolean) => {
    if (isSubmitted) return;
    
    setSelectedAnswers(prev => {
      const currentSelections = prev[questionId] || [];
      
      if (isMultiple) {
        // For multiple choice, toggle selection
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [questionId]: currentSelections.filter(id => id !== optionId)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentSelections, optionId]
          };
        }
      } else {
        // For single choice, replace selection
        return {
          ...prev,
          [questionId]: [optionId]
        };
      }
    });
  };
  
  // Check if answer is selected
  const isAnswerSelected = (questionId: string, optionId: string) => {
    const selections = selectedAnswers[questionId] || [];
    return selections.includes(optionId);
  };
  
  // Move to next question
  const handleNextQuestion = () => {
    if (isLastQuestion) {
      calculateAndShowResults();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsSubmitted(false);
    }
  };
  
  // Move to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setIsSubmitted(false);
    }
  };
  
  // Submit current answer
  const handleSubmitAnswer = () => {
    const questionId = currentQuestion.id;
    const selections = selectedAnswers[questionId] || [];
    
    if (selections.length === 0) {
      toast({
        title: 'Please select an answer',
        description: 'You must select at least one option to continue',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitted(true);
  };
  
  // Calculate final score
  const calculateAndShowResults = () => {
    let correctCount = 0;
    
    questions.forEach(question => {
      const userSelections = selectedAnswers[question.id] || [];
      const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.id);
      
      // For single-choice questions
      if (question.type === 'single-choice' || question.type === 'true-false') {
        if (userSelections.length === 1 && correctOptions.includes(userSelections[0])) {
          correctCount++;
        }
      } 
      // For multiple-choice questions
      else if (question.type === 'multiple-choice') {
        // Check if user selected all correct options and no incorrect ones
        const allCorrectSelected = correctOptions.every(id => userSelections.includes(id));
        const noIncorrectSelected = userSelections.every(id => correctOptions.includes(id));
        
        if (allCorrectSelected && noIncorrectSelected) {
          correctCount++;
        }
      }
    });
    
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    onComplete(finalScore, moduleId);
  };
  
  // Restart the quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setShowResults(false);
  };
  
  // Determine if the current question was answered correctly
  const isCurrentAnswerCorrect = () => {
    if (!isSubmitted) return null;
    
    const question = currentQuestion;
    const userSelections = selectedAnswers[question.id] || [];
    const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.id);
    
    if (question.type === 'single-choice' || question.type === 'true-false') {
      return userSelections.length === 1 && correctOptions.includes(userSelections[0]);
    } else {
      const allCorrectSelected = correctOptions.every(id => userSelections.includes(id));
      const noIncorrectSelected = userSelections.every(id => correctOptions.includes(id));
      return allCorrectSelected && noIncorrectSelected;
    }
  };
  
  // Render results screen
  if (showResults) {
    const isPassing = score !== null && score >= 70;
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title} - Results</CardTitle>
          <CardDescription>
            You've completed the training module!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8">
            {isPassing ? (
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Trophy className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-600">Congratulations!</h3>
                <p className="text-center mt-2">
                  You've passed the training module with a score of {score}%.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-amber-600">Almost There!</h3>
                <p className="text-center mt-2">
                  You scored {score}%. You need at least 70% to pass this module.
                </p>
              </div>
            )}
          </div>
            
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Performance Summary</h4>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-medium">{questions.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Correct Answers:</span>
                <span className="font-medium">{Math.round((score || 0) * questions.length / 100)}</span>
              </li>
              <li className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-medium">{score}%</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleRestartQuiz} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/training'}>
            Back to Training
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-sm font-medium">
            {Math.round(progress)}% Complete
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentQuestion.text}</h3>
          
          {/* Render options based on question type */}
          {currentQuestion.type === 'multiple-choice' && (
            <div className="space-y-3">
              {currentQuestion.options.map(option => (
                <div
                  key={option.id}
                  className={`flex items-start space-x-2 rounded-md border p-3 ${
                    isSubmitted && option.isCorrect ? 'border-green-500 bg-green-50' : 
                    isSubmitted && isAnswerSelected(currentQuestion.id, option.id) && !option.isCorrect ? 'border-red-500 bg-red-50' : ''
                  }`}
                >
                  <Checkbox
                    id={option.id}
                    disabled={isSubmitted}
                    checked={isAnswerSelected(currentQuestion.id, option.id)}
                    onCheckedChange={() => handleAnswerSelect(currentQuestion.id, option.id, true)}
                  />
                  <div className="flex flex-col leading-none">
                    <Label
                      htmlFor={option.id}
                      className={`font-normal ${
                        isSubmitted && option.isCorrect ? 'text-green-700' : 
                        isSubmitted && isAnswerSelected(currentQuestion.id, option.id) && !option.isCorrect ? 'text-red-700' : ''
                      }`}
                    >
                      {option.text}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {(currentQuestion.type === 'single-choice' || currentQuestion.type === 'true-false') && (
            <RadioGroup
              value={selectedAnswers[currentQuestion.id]?.[0] || ''}
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value, false)}
              disabled={isSubmitted}
            >
              {currentQuestion.options.map(option => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-2 rounded-md border p-3 ${
                    isSubmitted && option.isCorrect ? 'border-green-500 bg-green-50' : 
                    isSubmitted && isAnswerSelected(currentQuestion.id, option.id) && !option.isCorrect ? 'border-red-500 bg-red-50' : ''
                  }`}
                >
                  <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitted} />
                  <Label
                    htmlFor={option.id}
                    className={`font-normal ${
                      isSubmitted && option.isCorrect ? 'text-green-700' : 
                      isSubmitted && isAnswerSelected(currentQuestion.id, option.id) && !option.isCorrect ? 'text-red-700' : ''
                    }`}
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
        
        {/* Show explanation after submission */}
        {isSubmitted && (
          <Alert variant={isCurrentAnswerCorrect() ? "default" : "destructive"}>
            {isCurrentAnswerCorrect() 
              ? <Check className="h-4 w-4" /> 
              : <AlertCircle className="h-4 w-4" />
            }
            <AlertTitle>
              {isCurrentAnswerCorrect() ? "Correct!" : "Incorrect"}
            </AlertTitle>
            <AlertDescription>
              {currentQuestion.explanation}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {!isSubmitted ? (
          <Button onClick={handleSubmitAnswer}>
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion}>
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TrainingModule; 