
import React, { useState } from 'react';
import { X, Trophy, CheckCircle, XCircle, Zap, ArrowRight, BrainCircuit } from 'lucide-react';
import { awardBonusPoints } from '../services/auth';

interface TriviaModalProps {
  onClose: () => void;
}

const TRIVIA_QUESTIONS = [
  {
    id: 1,
    question: "Which of these is considered the first feature-length animated film?",
    options: ["Fantasia", "Snow White and the Seven Dwarfs", "Steamboat Willie", "Toy Story"],
    answer: "Snow White and the Seven Dwarfs"
  },
  {
    id: 2,
    question: "What is the standard frame rate for cinema?",
    options: ["60 fps", "30 fps", "24 fps", "48 fps"],
    answer: "24 fps"
  },
  {
    id: 3,
    question: "In film editing, what is a 'Jump Cut'?",
    options: ["A transition between two different locations", "A cut that breaks temporal continuity", "A fade to black", "A fast-paced montage"],
    answer: "A cut that breaks temporal continuity"
  },
  {
    id: 4,
    question: "Who directed 'The Silent Glaciers'?",
    options: ["Marcus Chen", "Elena Rossi", "Aris Thorne", "Sarah Al-Fayed"],
    answer: "Elena Rossi" // Tied to mock data
  },
  {
    id: 5,
    question: "Which aspect ratio is standard for modern widescreen cinema?",
    options: ["4:3", "16:9", "2.39:1", "1:1"],
    answer: "2.39:1"
  }
];

const TriviaModal: React.FC<TriviaModalProps> = ({ onClose }) => {
  const [questions] = useState(() => TRIVIA_QUESTIONS.sort(() => 0.5 - Math.random()).slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQuestion.answer) {
      setScore(prev => prev + 1);
    }

    // Auto advance after short delay
    setTimeout(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            finishGame(option === currentQuestion.answer ? score + 1 : score);
        }
    }, 1200);
  };

  const finishGame = async (finalScore: number) => {
      setShowResult(true);
      if (finalScore > 0) {
          const points = finalScore * 10; // 10 pts per correct answer
          await awardBonusPoints(points);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden relative shadow-2xl animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
          <X size={24} />
        </button>

        {!showResult ? (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
                    <span className="bg-brand-50 text-brand-600 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                        <Zap size={12} fill="currentColor"/> {score * 10} pts
                    </span>
                </div>

                <div className="mb-8 min-h-[80px]">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {currentQuestion.question}
                    </h3>
                </div>

                <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                        let btnClass = "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100";
                        
                        if (isAnswered) {
                            if (option === currentQuestion.answer) {
                                btnClass = "bg-green-100 border-green-200 text-green-700";
                            } else if (option === selectedOption) {
                                btnClass = "bg-red-50 border-red-100 text-red-600";
                            } else {
                                btnClass = "opacity-50 bg-slate-50";
                            }
                        }

                        return (
                            <button
                                key={option}
                                onClick={() => handleOptionClick(option)}
                                disabled={isAnswered}
                                className={`w-full p-4 rounded-xl border-2 text-left font-bold text-sm transition-all flex justify-between items-center ${btnClass}`}
                            >
                                {option}
                                {isAnswered && option === currentQuestion.answer && <CheckCircle size={18} />}
                                {isAnswered && option === selectedOption && option !== currentQuestion.answer && <XCircle size={18} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        ) : (
            <div className="p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
                    <Trophy size={40} fill="currentColor" />
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2">Quiz Complete!</h2>
                <p className="text-slate-500 font-medium mb-6">
                    You got <span className="text-brand-600 font-bold">{score} out of {questions.length}</span> correct.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Reward</p>
                    <p className="text-3xl font-black text-slate-900">+{score * 10} Points</p>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                    Collect Points <ArrowRight size={18} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TriviaModal;
