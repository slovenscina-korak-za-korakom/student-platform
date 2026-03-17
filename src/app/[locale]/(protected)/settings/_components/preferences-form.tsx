"use client";

import React, {useEffect, useState} from "react";
import {useUser} from "@clerk/nextjs";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {
  IconCheck,
  IconEdit,
  IconInfoCircle,
  IconLanguage,
  IconLoader2,
  IconMail,
  IconSettings,
  IconTarget,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import {toast} from "sonner";
import {
  getTutors,
  getEmailLocale,
  getUserPreferences,
  updateEmailLocale,
  updateUserPreferences,
  UserPreferences,
} from "@/actions/user-actions";
import {Skeleton} from "@/components/ui/skeleton";
import {languageLevels, learningGoals} from "@/lib/docs";
import {useLocale, useTranslations} from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {cn} from "@/lib/utils";

const SectionLabel = ({children}: {children: React.ReactNode}) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="w-[3px] h-3.5 rounded-full gradient-primary shrink-0"/>
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
  </div>
);

const PreferencesForm = () => {
  const {user, isLoaded} = useUser();
  const locale = useLocale();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [emailLocale, setEmailLocale] = useState<string>("en");
  const [tutors, setTutors] = useState<Awaited<ReturnType<typeof getTutors>>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<{preferences: UserPreferences; emailLocale: string} | null>(null);
  const [bioTutor, setBioTutor] = useState<Awaited<ReturnType<typeof getTutors>>[0] | null>(null);

  const t = useTranslations("settings.account.learning-preferences");
  const t2 = useTranslations("common.buttons");
  const t3 = useTranslations("settings.account.email-preferences");

  useEffect(() => {
    const fetchPreferences = async () => {
      if (isLoaded && user) {
        const userPrefs = await getUserPreferences();
        if (userPrefs) setPreferences(userPrefs as UserPreferences);
        const userEmailLocale = await getEmailLocale();
        if (userEmailLocale && typeof userEmailLocale === "string") setEmailLocale(userEmailLocale);
      }
    };
    fetchPreferences();
    getTutors().then(setTutors);
  }, [isLoaded, user]);

  const openDialog = () => {
    if (!preferences) return;
    setDraft({preferences: {...preferences, learningGoals: [...preferences.learningGoals]}, emailLocale});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !draft) return;
    setIsSaving(true);
    try {
      await updateUserPreferences(draft.preferences);
      await updateEmailLocale(draft.emailLocale);
      setPreferences(draft.preferences);
      setEmailLocale(draft.emailLocale);
      toast.success("Preferences updated successfully!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDraftPreference = (key: keyof UserPreferences, value: string | string[] | number) => {
    if (!draft) return;
    setDraft((prev) => ({...prev!, preferences: {...prev!.preferences, [key]: value}}));
  };

  const toggleDraftGoal = (goal: string) => {
    if (!draft) return;
    setDraft((prev) => ({
      ...prev!,
      preferences: {
        ...prev!.preferences,
        learningGoals: prev!.preferences.learningGoals.includes(goal)
          ? prev!.preferences.learningGoals.filter((g) => g !== goal)
          : [...prev!.preferences.learningGoals, goal],
      },
    }));
  };

  const getLevelLabel = (level: string) => level === "senior" ? "Senior Tutor" : "Junior Tutor";

  const currentTutor = tutors.find((t) => t.id === preferences?.preferredTutor);
  const currentLevel = languageLevels.find((l) => l.value === preferences?.languageLevel) ?? languageLevels[0];
  const currentGoals = learningGoals.filter((g) => preferences?.learningGoals.includes(g.value));

  // Live draft-derived values for the left panel
  const draftTutor = tutors.find((t) => t.id === draft?.preferences.preferredTutor);

  const emailLanguageMap: Record<string, string> = {
    en: t3("languages.en"),
    sl: t3("languages.sl"),
    ru: t3("languages.ru"),
    it: t3("languages.it"),
  };

  if (!isLoaded) {
    return (
      <Card className="w-full max-w-4xl rounded-2xl p-1 bg-accent border-none">
        <CardHeader className="pt-5">
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-background border border-foreground/10 rounded-2xl p-4">
          <Skeleton className="h-32 w-full"/>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className="w-full max-w-4xl rounded-2xl p-1 bg-accent border-none">
        <CardHeader className="pt-5">
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-background border border-foreground/10 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">{t("error")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* ── Read view card ── */}
      <Card className="w-full max-w-4xl rounded-2xl p-1 bg-accent border-none">
        <CardHeader className="pt-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{t("title")}</CardTitle>
            <Button variant="outline" size="sm" onClick={openDialog} className="gap-1.5 h-8 text-xs">
              <IconEdit className="h-3.5 w-3.5"/>
              {t2("edit")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-white dark:bg-background border border-foreground/10 rounded-2xl p-0 overflow-hidden">

          {/* Language Level */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sl-blue/10 shrink-0">
                <IconLanguage className="h-4.5 w-4.5 text-sl-blue"/>
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-1">{t("current-lang-level")}</p>
                <p className="text-sm font-medium">{currentLevel.label[locale]}</p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">{currentLevel.value}</Badge>
          </div>

          <Separator/>

          {/* Preferred Tutor */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sl-purple/10 shrink-0">
                <IconUser className="h-4.5 w-4.5 text-sl-purple"/>
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-1">{t("tutor")}</p>
                {currentTutor ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={currentTutor.avatar} className="object-cover"/>
                      <AvatarFallback className="text-[9px] capitalize">{currentTutor.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm capitalize font-medium">{currentTutor.name}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
            {currentTutor && (
              <Badge variant="secondary" className="text-xs">{getLevelLabel(currentTutor.level)}</Badge>
            )}
          </div>

          <Separator/>

          {/* Learning Goals */}
          <div className="flex items-start justify-between px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sl-blue/10 shrink-0">
                <IconTarget className="h-4.5 w-4.5 text-sl-blue"/>
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-2">{t("learning-goals")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {currentGoals.length > 0 ? currentGoals.map((goal) => (
                    <Badge key={goal.value} variant="secondary" className="text-xs">
                      {goal.label[locale]}
                    </Badge>
                  )) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator/>

          {/* Email Language */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sl-purple/10 shrink-0">
                <IconMail className="h-4.5 w-4.5 text-sl-purple"/>
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-1">{t3("title")}</p>
                <p className="text-sm font-medium">{emailLanguageMap[emailLocale]}</p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono text-xs uppercase">{emailLocale}</Badge>
          </div>

        </CardContent>
      </Card>

      {/* ── Edit dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isSaving && setIsDialogOpen(open)}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "p-0 gap-0 border-0 shadow-2xl rounded-2xl overflow-hidden flex flex-col sm:flex-row w-[calc(100vw-2rem)] h-[88vh] sm:h-[620px]",
            bioTutor ? "sm:max-w-[920px]" : "sm:max-w-[700px]"
          )}
        >
          <DialogTitle className="sr-only">Edit Preferences</DialogTitle>
          <DialogDescription className="sr-only">Update your tutor, learning goals and email language</DialogDescription>

          {/* ── LEFT gradient panel (desktop only) ── */}
          <div
            className="hidden sm:flex sm:w-[210px] sm:shrink-0 flex-col"
            style={{background: "linear-gradient(170deg, #2563eb 0%, #7c3aed 55%, #6d28d9 100%)"}}
          >
            {/* Icon + heading */}
            <div className="px-6 pt-7 pb-5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-5">
                <IconSettings className="h-5 w-5 text-white"/>
              </div>
              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
                {t("title")}
              </p>
              <h2 className="text-white text-xl font-bold leading-snug">
                Edit<br/>Preferences
              </h2>
            </div>

            <div className="mx-6 h-px bg-white/10"/>

            {/* Live stats */}
            <div className="px-6 py-5 flex-1 space-y-4">

              {/* Language level — read-only */}
              <div>
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                  {t("current-lang-level")}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-3xl font-extrabold tabular-nums leading-none">
                    {currentLevel.value}
                  </span>
                </div>
                <p className="text-white/50 text-xs mt-1 leading-snug">{currentLevel.label[locale]}</p>
              </div>

              <div className="h-px bg-white/10"/>

              {/* Tutor — live */}
              <div>
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                  {t("tutor")}
                </p>
                {draftTutor ? (
                  <>
                    <p className="text-white capitalize text-sm font-semibold leading-snug">{draftTutor.name}</p>
                    <p className="text-white/50 text-xs mt-0.5">{getLevelLabel(draftTutor.level)}</p>
                  </>
                ) : (
                  <p className="text-white/40 text-sm">—</p>
                )}
              </div>

              <div className="h-px bg-white/10"/>

              {/* Email language — live */}
              <div>
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                  {t3("title")}
                </p>
                <p className="text-white text-sm font-semibold leading-snug">
                  {emailLanguageMap[draft?.emailLocale ?? emailLocale]}
                </p>
                <p className="text-white/50 text-[11px] font-mono uppercase mt-0.5">
                  {draft?.emailLocale ?? emailLocale}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-5 pt-3 space-y-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                type="button"
                className="w-full bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-md"
              >
                {isSaving ? (
                  <><IconLoader2 className="h-4 w-4 animate-spin mr-1.5"/>{t2("loading")}</>
                ) : (
                  <><IconCheck className="h-4 w-4 mr-1.5"/>{t2("save")}</>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                type="button"
                className="w-full cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
              >
                {t2("cancel")}
              </Button>
            </div>
          </div>

          {/* ── RIGHT panel ── */}
          <div className="flex-1 flex flex-col min-h-0 bg-background dark:bg-sidebar">

            {/* Mobile gradient header (mobile only) */}
            <div
              className="sm:hidden flex items-center justify-between px-4 py-4 shrink-0"
              style={{background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"}}
            >
              <div>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">{t("title")}</p>
                <h3 className="text-white font-bold text-base leading-snug">Edit Preferences</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Live stat chips */}
                <span className="text-[11px] font-mono font-bold bg-white/15 text-white px-2 py-1 rounded-lg">
                  {currentLevel.value}
                </span>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                  className="cursor-pointer p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors disabled:opacity-40"
                >
                  <IconX className="h-4 w-4"/>
                </button>
              </div>
            </div>

            {/* Desktop header (desktop only) */}
            <div className="hidden sm:flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{t("title")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("text")}</p>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                className="cursor-pointer p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                <IconX className="h-4 w-4"/>
              </button>
            </div>

            {/* Scrollable sections */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-6">

              {/* Preferred Tutor */}
              <div>
                <SectionLabel>{t("tutor")}</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {tutors.map((tutor) => {
                    const isSelected = draft?.preferences.preferredTutor === tutor.id;
                    return (
                      <div
                        key={tutor.id}
                        onClick={() => updateDraftPreference("preferredTutor", tutor.id)}
                        className={cn(
                          "relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer text-left",
                          isSelected
                            ? "border-sl-purple/50 bg-sl-purple/8 dark:bg-sl-purple/12"
                            : "border-border hover:border-sl-purple/30 hover:bg-muted/40"
                        )}
                      >
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={tutor.avatar} className="object-cover"/>
                          <AvatarFallback className="text-xs capitalize">{tutor.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "text-sm capitalize font-medium truncate leading-tight",
                            isSelected ? "text-sl-purple" : "text-foreground"
                          )}>
                            {tutor.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{getLevelLabel(tutor.level)}</p>
                        </div>
                        {tutor.bio && tutor.bio !== "No bio" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBioTutor(bioTutor?.id === tutor.id ? null : tutor);
                            }}
                            className={cn(
                              "p-1 rounded-lg transition-colors cursor-pointer shrink-0",
                              bioTutor?.id === tutor.id
                                ? "text-sl-purple bg-sl-purple/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <IconInfoCircle className="h-3.5 w-3.5"/>
                          </button>
                        )}
                        {isSelected && (
                          <IconCheck className="h-3.5 w-3.5 text-sl-purple shrink-0"/>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator/>

              {/* Learning Goals */}
              <div>
                <SectionLabel>{t("learning-goals")}</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {learningGoals.map((goal) => {
                    const isSelected = draft?.preferences.learningGoals.includes(goal.value) ?? false;
                    return (
                      <button
                        key={goal.value}
                        onClick={() => toggleDraftGoal(goal.value)}
                        className={cn(
                          "relative flex flex-col p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-left",
                          isSelected
                            ? "border-sl-blue/50 bg-sl-blue/8 dark:bg-sl-blue/12"
                            : "border-border hover:border-sl-blue/30 hover:bg-muted/40"
                        )}
                      >
                        <p className={cn(
                          "text-sm font-semibold leading-snug pr-5",
                          isSelected ? "text-sl-blue" : "text-foreground"
                        )}>
                          {goal.label[locale]}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                          {goal.description[locale]}
                        </p>
                        {isSelected && (
                          <IconCheck className="absolute top-3 right-3 h-3.5 w-3.5 text-sl-blue"/>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator/>

              {/* Email Language */}
              <div>
                <SectionLabel>{t3("title")}</SectionLabel>
                <p className="text-xs text-muted-foreground mb-3 -mt-1">{t3("description")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {code: "en", name: t3("languages.en")},
                    {code: "sl", name: t3("languages.sl")},
                    {code: "ru", name: t3("languages.ru")},
                    {code: "it", name: t3("languages.it")},
                  ].map((lang) => {
                    const isSelected = draft?.emailLocale === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => setDraft((prev) => prev ? {...prev, emailLocale: lang.code} : prev)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer",
                          isSelected
                            ? "border-sl-purple/50 bg-sl-purple/8 dark:bg-sl-purple/12"
                            : "border-border hover:border-sl-purple/30 hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={cn(
                            "text-[11px] font-mono font-bold uppercase px-1.5 py-0.5 rounded",
                            isSelected
                              ? "bg-sl-purple text-white"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {lang.code}
                          </span>
                          <p className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-sl-purple" : "text-foreground"
                          )}>
                            {lang.name}
                          </p>
                        </div>
                        {isSelected && (
                          <IconCheck className="h-3.5 w-3.5 text-sl-purple shrink-0"/>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Mobile sticky footer (mobile only) */}
            <div className="sm:hidden flex gap-3 px-4 py-4 border-t border-border/60 shrink-0 bg-background dark:bg-sidebar">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                type="button"
                className="flex-1"
              >
                {t2("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                type="button"
                className="flex-1 gradient-primary text-white border-0"
              >
                {isSaving ? (
                  <><IconLoader2 className="h-4 w-4 animate-spin mr-1.5"/>{t2("loading")}</>
                ) : (
                  <><IconCheck className="h-4 w-4 mr-1.5"/>{t2("save")}</>
                )}
              </Button>
            </div>
          </div>

          {/* ── BIO panel (third column, desktop only) ── */}
          {bioTutor && (
            <div className="hidden sm:flex sm:w-[220px] sm:shrink-0 flex-col border-l border-border/60 bg-background dark:bg-sidebar">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/60 shrink-0">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Tutor Bio
                  </p>
                  <p className="text-sm font-semibold capitalize text-foreground mt-0.5">{bioTutor.name}</p>
                </div>
                <button
                  onClick={() => setBioTutor(null)}
                  className="p-1.5 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <IconX className="h-3.5 w-3.5"/>
                </button>
              </div>

              {/* Avatar + level */}
              <div className="flex flex-col items-center pt-5 pb-4 px-4 shrink-0">
                <Avatar className="w-16 h-16 mb-3">
                  <AvatarImage src={bioTutor.avatar} className="object-cover"/>
                  <AvatarFallback className="text-sm capitalize">{bioTutor.name[0]}</AvatarFallback>
                </Avatar>
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                >
                  {getLevelLabel(bioTutor.level)}
                </Badge>
              </div>

              <div className="mx-4 h-px bg-border/60"/>

              {/* Bio text */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {bioTutor.bio}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreferencesForm;
