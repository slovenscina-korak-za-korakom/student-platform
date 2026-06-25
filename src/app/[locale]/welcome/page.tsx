"use client";

import {useEffect, useState} from "react";
import {useUser} from "@clerk/nextjs";
import {Button} from "@/components/ui/button";
import {
  IconCheck,
  IconChevronRight,
  IconCircleDashedCheck,
  IconInfoCircle,
  IconLoader2,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import {redirect} from "@/i18n/routing";
import {useLocale, useTranslations} from "next-intl";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {getTutors, updateLanguageLevel, updateUserPreferences, UserPreferences} from "@/actions/user-actions";
import {toast} from "sonner";
import {learningGoals} from "@/lib/docs";
import {clearPlacementTestState, PlacementTest} from "@/components/welcome/placement-test";
import {cn} from "@/lib/utils";
import {Dialog, DialogClose, DialogContent, DialogTitle,} from "@/components/ui/dialog";
import {fetchTutors} from "@/app/[locale]/(protected)/settings/_components/preferences-form";

const WelcomePage = () => {
  const {user, isLoaded} = useUser();
  const locale = useLocale();
  const t = useTranslations("welcome");
  const t1 = useTranslations("common.buttons");
  const [currentStep, setCurrentStep] = useState(1);
  const [preferences, setPreferences] = useState<UserPreferences>({
    languageLevel: "",
    preferredTutor: 0,
    learningGoals: [],
    preferredSchedule: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutors, setTutors] = useState<Awaited<ReturnType<typeof getTutors>>>([]);
  const [bioDialogTutor, setBioDialogTutor] = useState<Awaited<ReturnType<typeof getTutors>>[0] | null>(null);

  useEffect(() => {
    fetchTutors().then(setTutors);
  }, []);

  const totalSteps = 3;

  const handlePreferenceChange = (
    key: keyof UserPreferences,
    value: string | string[] | number
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGoalToggle = (goal: string) => {
    setPreferences((prev) => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goal)
        ? prev.learningGoals.filter((g) => g !== goal)
        : [...prev.learningGoals, goal],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return preferences.languageLevel !== "";
      case 2:
        return preferences.preferredTutor !== 0;
      case 3:
        return preferences.learningGoals.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Save preferences and language level
      await updateUserPreferences(preferences);
      await updateLanguageLevel(preferences.languageLevel);

      // Mark onboarding as completed
      const isNewUser = await user.unsafeMetadata.showWelcomeDialog ?? true
      if (isNewUser) {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboardingCompleted: true,
            welcome: false,
            showWelcomeDialog: true,
          },
        });
      } else {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboardingCompleted: true,
          },
        });
      }

      // Clear placement test state from localStorage
      clearPlacementTestState();
    } catch (error) {
      toast.error("Error saving preferences: " + error);
      setIsSubmitting(false);
      return;
    }

    redirect({href: "/dashboard", locale: locale});
  };

  const handlePlacementTestComplete = (level: string) => {
    setPreferences((prev) => ({
      ...prev,
      languageLevel: level,
    }));

    // Auto-advance to the next step
    setTimeout(() => {
      setCurrentStep(2);
    }, 500);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PlacementTest onComplete={handlePlacementTestComplete}/>;


      case 2:
        return (
          <div className="flex flex-col h-full w-full justify-between">
            {/* Header */}
            <div className="space-y-10">
              <div className="text-center space-y-3 mb-8">
                <h2 className="text-3xl font-semibold tracking-tight">{t("par2.title")}</h2>
                <p className="text-base text-muted-foreground">{t("par2.description")}</p>
              </div>

              {/* Tutor Grid - Clean Minimal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mx-auto">
                {tutors.map((tutor) => {
                  const isSelected = preferences.preferredTutor === tutor.id;
                  return (
                    <button
                      key={tutor.id}
                      onClick={() => handlePreferenceChange("preferredTutor", tutor.id)}
                      className={cn(
                        "relative w-full p-6 rounded-xl border cursor-pointer transition-all duration-200",
                        "hover:border-foreground/20 hover:bg-foreground/[0.02]",
                        "dark:hover:bg-foreground/[0.05] text-left",
                        isSelected
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-border/50"
                      )}
                    >
                      <div className="flex flex-col items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="w-24 h-24">
                          <AvatarImage className="aspect-square object-cover" src={tutor.avatar} alt={tutor.name}/>
                          <AvatarFallback>
                            <IconUser className="h-12 w-12 text-foreground/40"/>
                          </AvatarFallback>
                        </Avatar>

                        {/* Name & Features */}
                        <div className="flex flex-col items-center gap-3 w-full">
                          <h3 className="font-semibold text-lg">{tutor.name}</h3>
                          <p className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                            <IconCircleDashedCheck className="h-4 w-4 text-primary shrink-0"/>
                            {tutor.level === "senior" ? "Senior Tutor" : "Junior Tutor"}
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div
                            className="absolute top-3 left-3 flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                            <IconCheck className="h-3.5 w-3.5 text-white"/>
                          </div>
                        )}

                        {/* View Bio Icon */}
                        {tutor.bio && tutor.bio !== "No bio" && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setBioDialogTutor(tutor);
                            }}
                            aria-label={t("par2.view-bio")}
                            className="absolute cursor-pointer top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-foreground/5 hover:bg-foreground/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
                          >
                            <IconInfoCircle className="h-4 w-4 text-muted-foreground"/>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info Message */}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <IconInfoCircle className="h-4 w-4 text-primary shrink-0"/>
              <p>{t("par2.info-message")}</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col h-full w-full justify-between">
            {/* Header */}
            <div className="space-y-10">
              <div className="text-center space-y-3 mb-8">
                <h2 className="text-3xl font-semibold tracking-tight">{t("par3.title")}</h2>
                <p className="text-base text-muted-foreground">{t("par3.description")}</p>
              </div>

              {/* Learning Goals Grid - Clean Minimal Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
                {learningGoals.map((goal) => {
                  const isSelected = preferences.learningGoals.includes(goal.value);
                  return (
                    <button
                      key={goal.value}
                      onClick={() => handleGoalToggle(goal.value)}
                      className={cn(
                        "relative w-full p-6 rounded-xl border transition-all duration-200",
                        "hover:border-foreground/20 hover:bg-foreground/[0.02]",
                        "dark:hover:bg-foreground/[0.05] text-center",
                        isSelected
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-border/50"
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        {/* Icon */}
                        <div className="text-4xl mb-2">{goal.icon}</div>

                        {/* Label & Description */}
                        <h3 className="font-semibold text-base">
                          {goal.label[locale]}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {goal.description[locale]}
                        </p>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-5 right-5">
                            <IconCheck className="h-4 w-4 text-primary"/>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center min-h-screen w-full h-full">
        <div className="text-center space-y-4">
          <IconLoader2 className="h-8 w-8 animate-spin mx-auto"/>
          <p>{t1("loading")}</p>
        </div>
      </div>
    );
  }

  if (user?.unsafeMetadata?.onboardingCompleted) {
    redirect({href: "/dashboard", locale: locale});
    return null;
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Subtle Background Gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950"/>

      {/* Main Container - No Scroll on Desktop */}
      <div className="relative h-full flex flex-col max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Clean Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-2">
            {t("title")} <span className="text-primary">Slovenščina Korak za Korakom</span>
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground">{t("description")}</p>
        </div>

        {/* Minimal Progress Indicator */}
        {currentStep > 1 && (
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-3 text-sm">
            <span className="font-medium text-foreground">
              Step {currentStep} of {totalSteps}
            </span>
              <span className="text-muted-foreground">
              {(((currentStep - 1) / totalSteps) * 100).toFixed(0)}% Complete
            </span>
            </div>
            {/* Clean Progress Bar */}
            <div className="relative h-[2px] bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
                style={{width: `${((currentStep - 1) / totalSteps) * 100}%`}}
              />
            </div>
          </div>
        )}

        {/* Main Content Area - Flex Grows to Fill Space */}
        <div className="flex-1 flex flex-col min-h-0 mb-6 lg:mb-8">
          {/* All Steps - No Card, Direct Full Width Layout */}
          <div className="flex-1 flex flex-col">
            {renderStepContent()}
          </div>
        </div>

        {/* Clean Navigation Footer */}
        {currentStep > 1 && (
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="hover:bg-foreground/5 disabled:opacity-30"
              size="lg"
            >
              {t("navigation.back")}
            </Button>

            <div className="flex gap-3">
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 disabled:opacity-40 shadow-sm"
                >
                  {t("navigation.next")}
                  <IconChevronRight className="w-4 h-4 ml-1"/>
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed() || isSubmitting}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 disabled:opacity-40 shadow-sm"
                >
                  {isSubmitting
                    ? t("navigation.completing")
                    : t("navigation.complete")}
                  {!isSubmitting && <IconCheck className="w-4 h-4 ml-1"/>}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tutor Bio Dialog */}
      <Dialog open={!!bioDialogTutor} onOpenChange={(open) => !open && setBioDialogTutor(null)}>
        <DialogContent showCloseButton={false}
                       className="max-w-md p-0 rounded-2xl gap-0 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Gradient header */}
          <div className="relative h-28 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60"/>
            <DialogClose asChild>
              <button
                className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-background/60 hover:bg-background/80 backdrop-blur-sm transition-colors border border-border/30">
                <IconX className="h-3.5 w-3.5 text-foreground/70"/>
              </button>
            </DialogClose>
          </div>

          {/* Profile body — avatar overlaps header via negative margin */}
          <div className="flex flex-col items-center text-center px-6 pb-6 -mt-14 overflow-y-auto">
            <Avatar className="w-24 h-24 ring-4 ring-background shadow-md shrink-0">
              <AvatarImage className="object-cover" src={bioDialogTutor?.avatar} alt={bioDialogTutor?.name}/>
              <AvatarFallback className="bg-muted">
                <IconUser className="h-10 w-10 text-foreground/30"/>
              </AvatarFallback>
            </Avatar>

            <DialogTitle className="mt-3 text-lg font-bold tracking-tight">
              {bioDialogTutor?.name}
            </DialogTitle>
            {bioDialogTutor && (
              <p className="text-xs font-medium text-primary mt-0.5 uppercase tracking-wider">
                {bioDialogTutor.level === "senior" ? "Senior Tutor" : "Junior Tutor"}
              </p>
            )}

            <div className="w-full h-px bg-border/60 my-4"/>

            <div className="w-full text-left">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {bioDialogTutor?.bio}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WelcomePage;
