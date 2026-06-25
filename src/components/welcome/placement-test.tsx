"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  IconBulb,
  IconCheck,
  IconChevronRight,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  determineLevelFromScore,
  levelPoints,
  maxScore,
  placementQuestions,
  type LanguageLevel,
} from "@/lib/placement-test";
import { cn } from "@/lib/utils";
import { PlacementTestState } from "@/types/interfaces";

type PlacementTestProps = {
  onComplete: (level: string) => void;
};

type AnswerState = "idle" | "correct" | "incorrect";

const PLACEMENT_TEST_KEY = "placement_test_state";

export const clearPlacementTestState = () => {
  localStorage.removeItem(PLACEMENT_TEST_KEY);
};

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const PlacementTest: React.FC<PlacementTestProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [totalScore, setTotalScore] = useState(0);
  const [levelResults, setLevelResults] = useState<
    Record<LanguageLevel, { correct: number; total: number }>
  >({
    "A0-A1": { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
  });
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [finalLevel, setFinalLevel] = useState<string>("A0");
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Gap fill state
  const [gapInputs, setGapInputs] = useState<string[]>([]);
  const [wordBankWords, setWordBankWords] = useState<string[]>([]);
  const [wordBankUsed, setWordBankUsed] = useState<boolean[]>([]);
  const [showWordBank, setShowWordBank] = useState(false);

  const currentQuestion = placementQuestions[currentQuestionIndex];
  const questionLevel = currentQuestion.level as LanguageLevel;
  const pointsThisQuestion = levelPoints[questionLevel];
  const overallProgress = (currentQuestionIndex / placementQuestions.length) * 100;
  // Position within the current level section (1-based)
  const levelQuestionNum = levelResults[questionLevel].total + 1;

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(PLACEMENT_TEST_KEY);
    if (savedState) {
      try {
        const parsed: PlacementTestState = JSON.parse(savedState);
        setCurrentQuestionIndex(parsed.currentQuestionIndex);
        setTotalScore(parsed.totalScore);
        setLevelResults(parsed.levelResults);
        setIsTestComplete(parsed.isTestComplete);
        setFinalLevel(parsed.finalLevel);
        setAnsweredQuestions(parsed.answeredQuestions);
      } catch (error) {
        console.error("Failed to load placement test state:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave: PlacementTestState = {
      currentQuestionIndex,
      totalScore,
      levelResults,
      isTestComplete,
      finalLevel,
      answeredQuestions,
    };
    localStorage.setItem(PLACEMENT_TEST_KEY, JSON.stringify(stateToSave));
  }, [currentQuestionIndex, totalScore, levelResults, isTestComplete, finalLevel, answeredQuestions, isLoaded]);

  // Reset answer state and init gap fill when question changes
  useEffect(() => {
    if (!isLoaded) return;
    const q = placementQuestions[currentQuestionIndex];
    if (!q) return;

    setSelectedAnswer(null);
    setAnswerState("idle");

    if (q.type === "gap_fill") {
      const answers = q.correctAnswer.split(",");
      setGapInputs(new Array(answers.length).fill(""));
      setWordBankWords(shuffleArray(answers.map((a) => a.split("|")[0].trim())));
      setWordBankUsed(new Array(answers.length).fill(false));
      setShowWordBank(false);
    }
  }, [currentQuestionIndex, isLoaded]);

  const handleAnswerSelect = useCallback(
    (answerId: string) => {
      if (answerState !== "idle") return;
      setSelectedAnswer(answerId);
    },
    [answerState]
  );

  const handleGapInput = useCallback((index: number, value: string) => {
    setGapInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleWordBankClick = useCallback(
    (bankIndex: number, word: string) => {
      if (wordBankUsed[bankIndex] || answerState !== "idle") return;
      const targetIndex = gapInputs.findIndex((v) => v === "");
      if (targetIndex === -1) return;

      setGapInputs((prev) => {
        const next = [...prev];
        next[targetIndex] = word;
        return next;
      });
      setWordBankUsed((prev) => {
        const next = [...prev];
        next[bankIndex] = true;
        return next;
      });
    },
    [wordBankUsed, answerState, gapInputs]
  );

  const checkSingleGap = useCallback(
    (index: number): boolean => {
      const accepted = (currentQuestion.correctAnswer.split(",")[index] ?? "")
        .split("|")
        .map((a) => a.trim().toLowerCase());
      return accepted.includes((gapInputs[index] ?? "").trim().toLowerCase());
    },
    [currentQuestion, gapInputs]
  );

  const handleCheckAnswer = useCallback(() => {
    if (answeredQuestions.includes(currentQuestionIndex)) return;

    let isCorrect: boolean;

    if (currentQuestion.type === "gap_fill") {
      if (gapInputs.some((v) => !v.trim())) return;
      isCorrect = gapInputs.every((_, i) => checkSingleGap(i));
    } else {
      if (!selectedAnswer) return;
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }

    setAnswerState(isCorrect ? "correct" : "incorrect");

    const earned = isCorrect ? pointsThisQuestion : 0;
    const newScore = totalScore + earned;
    setTotalScore(newScore);

    const newResults = { ...levelResults };
    newResults[questionLevel].total += 1;
    if (isCorrect) newResults[questionLevel].correct += 1;
    setLevelResults(newResults);
    setAnsweredQuestions([...answeredQuestions, currentQuestionIndex]);

    const isLastQuestion = currentQuestionIndex + 1 >= placementQuestions.length;

    setTimeout(() => {
      if (isLastQuestion) {
        setFinalLevel(determineLevelFromScore(newScore));
        setIsTestComplete(true);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }, 1500);
  }, [
    selectedAnswer,
    gapInputs,
    answeredQuestions,
    currentQuestionIndex,
    currentQuestion,
    levelResults,
    questionLevel,
    totalScore,
    pointsThisQuestion,
    checkSingleGap,
  ]);

  // Keyboard shortcuts – multiple choice only
  useEffect(() => {
    if (currentQuestion.type !== "multiple_choice") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (answerState !== "idle" || isTestComplete) return;
      const numberToLetter: Record<string, string> = { "1": "a", "2": "b", "3": "c", "4": "d" };
      const key = e.key.toLowerCase();

      let optionId: string | null = null;
      if (/^[a-d]$/.test(key)) optionId = key;
      else if (/^[1-4]$/.test(e.key)) optionId = numberToLetter[e.key];

      if (optionId && currentQuestion.options?.some((o) => o.id === optionId)) {
        handleAnswerSelect(optionId);
      }
      if (e.key === "Enter" && selectedAnswer) handleCheckAnswer();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answerState, isTestComplete, selectedAnswer, currentQuestion, handleAnswerSelect, handleCheckAnswer]);

  const canCheck =
    currentQuestion.type === "gap_fill"
      ? gapInputs.length > 0 && gapInputs.every((v) => v.trim() !== "")
      : !!selectedAnswer;

  // Gap fill renderer

  const renderGapFill = () => {
    const hasInlineGaps = currentQuestion.question.includes("_______");

    const styledInput = (index: number, className?: string) => {
      const checked = answerState !== "idle";
      const correct = checked && checkSingleGap(index);
      const incorrect = checked && !checkSingleGap(index);
      return (
        <input
          key={index}
          type="text"
          value={gapInputs[index] ?? ""}
          onChange={(e) => handleGapInput(index, e.target.value)}
          disabled={checked}
          className={cn(
            "border-b-2 bg-transparent px-1 text-center focus:outline-none transition-colors",
            !checked && "border-primary/50 focus:border-primary",
            correct && "border-green-500 text-green-700 dark:text-green-400",
            incorrect && "border-red-500 text-red-700 dark:text-red-400",
            className
          )}
        />
      );
    };

    return (
      <div className="space-y-8">
        {hasInlineGaps ? (
          <div className="text-xl font-semibold leading-loose">
            {currentQuestion.question.split("_______").map((part, i, arr) => (
              <React.Fragment key={i}>
                <span className="whitespace-pre-wrap">{part}</span>
                {i < arr.length - 1 && styledInput(i, "w-24 inline-block")}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <h3 className="text-2xl font-semibold leading-relaxed whitespace-pre-line">
              {currentQuestion.question}
            </h3>
            <div className="space-y-3">
              {gapInputs.map((_, i) => {
                const checked = answerState !== "idle";
                const correct = checked && checkSingleGap(i);
                const incorrect = checked && !checkSingleGap(i);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <input
                      type="text"
                      value={gapInputs[i] ?? ""}
                      onChange={(e) => handleGapInput(i, e.target.value)}
                      disabled={checked}
                      placeholder={`Answer ${i + 1}`}
                      className={cn(
                        "flex-1 border-b-2 bg-transparent px-2 py-1 focus:outline-none transition-colors",
                        !checked && "border-primary/50 focus:border-primary",
                        correct && "border-green-500 text-green-700 dark:text-green-400",
                        incorrect && "border-red-500 text-red-700 dark:text-red-400"
                      )}
                    />
                    {checked && (
                      correct
                        ? <IconCheck className="w-4 h-4 text-green-600 shrink-0" />
                        : <IconX className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Word bank */}
        {/* TODO: Disabled and hidden for now */}
        <div className="space-y-3">
          <button
            onClick={() => setShowWordBank((v) => !v)}
            disabled
            // disabled={answerState !== "idle"}
            className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <IconBulb className="w-4 h-4" />
            {showWordBank ? "Hide word bank" : "Show word bank"}
          </button>

          <AnimatePresence>
            {showWordBank && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 overflow-hidden"
              >
                {wordBankWords.map((word, i) => (
                  <button
                    key={i}
                    onClick={() => handleWordBankClick(i, word)}
                    disabled={wordBankUsed[i] || answerState !== "idle"}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                      wordBankUsed[i]
                        ? "border-border/20 text-muted-foreground/40 cursor-not-allowed line-through"
                        : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 cursor-pointer"
                    )}
                  >
                    {word}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // Completion screen
  if (isTestComplete) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-8">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <IconTrophy className="w-6 h-6 text-primary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Test Complete</h2>
            <p className="text-muted-foreground">Your language level has been determined</p>
          </div>

          {/* Level + score */}
          <div className="py-6 space-y-3">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-b from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
              <span className="text-5xl font-semibold text-primary">{finalLevel}</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {totalScore} / {maxScore} points
            </p>
            <p className="text-xs text-muted-foreground">Based on your performance</p>
          </div>

          {/* Per-level breakdown */}
          <div className="space-y-2 text-left">
            {(Object.entries(levelResults) as [LanguageLevel, { correct: number; total: number }][])
              .filter(([, r]) => r.total > 0)
              .map(([level, r]) => {
                const pts = r.correct * levelPoints[level];
                const maxPts = 5 * levelPoints[level];
                return (
                  <div
                    key={level}
                    className="flex items-center justify-between py-3 border-b border-border/40 last:border-0"
                  >
                    <span className="text-sm font-medium text-foreground/70">{level}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {r.correct}/{r.total}
                      </span>
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {pts}/{maxPts} pts
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          <Button
            onClick={() => onComplete(finalLevel)}
            size="lg"
            className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            Continue
            <IconChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // Question screen

  return (
    <div className="flex flex-col h-full w-full">
      {/* Progress header */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">{questionLevel}</span>
          <span className="text-muted-foreground">
            {levelQuestionNum} of 5
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>Q {currentQuestionIndex + 1}/{placementQuestions.length}</span>
          <span className="font-medium text-foreground">{totalScore} pts</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-[2px] bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-8">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Question content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col justify-between"
        >
          <div className="space-y-8">
            {currentQuestion.type === "gap_fill" ? (
              renderGapFill()
            ) : (
              <>
                <div>
                  <h3 className="text-2xl font-semibold leading-relaxed whitespace-pre-line text-foreground">
                    {currentQuestion.question}
                  </h3>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => {
                    const isSelected = selectedAnswer === option.id;
                    const isCorrect = option.id === currentQuestion.correctAnswer;
                    const showResult = answerState !== "idle";

                    let buttonClasses =
                      "border-border/50 hover:border-foreground/20 hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.05]";
                    let icon = null;

                    if (showResult) {
                      if (isCorrect) {
                        buttonClasses = "border-green-500/50 bg-green-50/50 dark:bg-green-950/20";
                        if (isSelected)
                          icon = <IconCheck className="w-5 h-5 text-green-600 dark:text-green-500" />;
                      } else if (isSelected) {
                        buttonClasses = "border-red-500/50 bg-red-50/50 dark:bg-red-950/20";
                        icon = <IconX className="w-5 h-5 text-red-600 dark:text-red-500" />;
                      }
                    } else if (isSelected) {
                      buttonClasses = "border-primary bg-primary/5 dark:bg-primary/10";
                    }

                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        disabled={answerState !== "idle"}
                        whileHover={{ scale: answerState === "idle" ? 1.005 : 1 }}
                        whileTap={{ scale: answerState === "idle" ? 0.995 : 1 }}
                        className={cn(
                          "w-full p-4 text-left border rounded-xl transition-all duration-200",
                          "disabled:cursor-not-allowed flex items-center justify-between",
                          buttonClasses
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                              "text-sm font-medium transition-all",
                              isSelected && answerState === "idle"
                                ? "bg-primary text-primary-foreground"
                                : "bg-foreground/5 dark:bg-foreground/10 text-foreground/60"
                            )}
                          >
                            {option.id.toUpperCase()}
                          </span>
                          <span className="font-medium text-base">{option.text}</span>
                        </div>
                        {icon}
                      </motion.button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Bottom section */}
          <div className="space-y-4 mt-8">
            <AnimatePresence>
              {answerState !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div
                    className={cn(
                      "px-4 py-3 rounded-lg text-center text-sm font-medium",
                      answerState === "correct"
                        ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                        : "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400"
                    )}
                  >
                    {answerState === "correct"
                      ? `Correct! +${pointsThisQuestion} pts`
                      : "Keep going!"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleCheckAnswer}
              disabled={!canCheck || answerState !== "idle"}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 shadow-sm"
            >
              Check Answer
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
