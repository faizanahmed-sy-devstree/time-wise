"use client";

import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";

interface ProductTourProps {
  onStart?: () => void;
  onComplete?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductTour({
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
}: ProductTourProps) {
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage(
    "timewise_tour_completed",
    false
  );
  
  // Internal state if not controlled externally
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen ?? internalIsOpen;
  
  const setIsOpen = (open: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const [currentStep, setCurrentStep] = useState(0);

  // If the tour is opened, ensure we start at step 0 if it was previously finished? 
  // Or just trust the parent.
  useEffect(() => {
    if (isOpen) {
        setCurrentStep(0);
    }
  }, [isOpen]);

  const steps = [
    {
      title: "Welcome to TimeWise 🚀",
      description: (
        <div className="space-y-4 text-left">
          <p>This isn't just another time tracker. It's built for flow.</p>
          <div className="bg-secondary/50 p-3 rounded-lg border border-border">
            <p className="font-bold text-primary mb-1">✨ Automatic Tracking</p>
            <p className="text-sm text-muted-foreground">
              We start tracking the moment you open the site. No need to click "Start" every time. We've got you covered.
            </p>
          </div>
        </div>
      ),
      icon: <Icons.Sparkles className="h-10 w-10 text-yellow-500 mb-2" />,
    },
    {
      title: "Your Command Center ⚡",
      description: "Manage your workday here. Track your active session, punch out when you're done, or take a break to recharge.",
      highlightId: "tour-timer-card",
    },
    {
      title: "Multitasking Mode (PiP) 📺",
      description: (
        <div className="text-left">
            <p>Stay focused without losing track.</p>
            <p className="mt-2 text-sm text-muted-foreground">Click the <strong>Mini Timer</strong> to pop out a floating window. It stays on top of your other apps so you can keep an eye on your time.</p>
        </div>
      ),
      highlightId: "tour-pip-button",
    },
    {
      title: "History & Insights 📊",
      description: "Switch tabs to see your productivity trends and browse past work logs in the calendar. Keep track of your progress over time.",
      highlightId: "tour-analytics-tab",
    },
    {
      title: "You're All Set! 🎉",
      description: "Ready to get to work? Remember to take breaks and stay consistent. You've got this! 💪",
      icon: <Icons.CheckCircle className="h-10 w-10 text-green-500 mb-2" />,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setHasCompletedTour(true);
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const stepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="flex flex-col items-center">
          {stepData.icon}
          <DialogTitle className="text-2xl">{stepData.title}</DialogTitle>
        </DialogHeader>
        
        {/* Fixed height container to prevent resizing */}
        <div className="py-4 text-center text-muted-foreground h-[200px] flex flex-col justify-center items-center">
          {stepData.description}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full sm:justify-between">
           <div className="flex justify-center w-full gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <div className="flex-1"></div>
              
              {currentStep > 0 && (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
              )}
              
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>
           </div>
        </DialogFooter>
        
        <div className="flex justify-center gap-1 mt-2">
            {steps.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1.5 w-1.5 rounded-full ${idx === currentStep ? "bg-primary" : "bg-muted"}`}
                />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
