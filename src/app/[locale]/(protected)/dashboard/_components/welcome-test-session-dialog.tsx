"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconCalendarEvent, IconCheck, IconSparkles } from "@tabler/icons-react";
import { dismissWelcomeDialog } from "@/actions/user-actions";

interface WelcomeTestSessionDialogProps {
  open: boolean;
}

export default function WelcomeTestSessionDialog({ open }: WelcomeTestSessionDialogProps) {
  const [isOpen, setIsOpen] = useState(open);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.welcome-dialog");

  const handleBookSession = async () => {
    setIsOpen(false);
    await dismissWelcomeDialog();
    router.push("/calendar", { locale });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md p-0 rounded-2xl gap-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header gradient */}
        <div className="relative h-32 bg-gradient-to-br from-[var(--sl-purple)]/40 via-[var(--sl-blue)]/20 to-transparent -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--sl-purple)]/20 border border-[var(--sl-purple)]/30 flex items-center justify-center backdrop-blur-sm">
              <IconSparkles className="h-8 w-8 text-[var(--sl-purple)]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 -mt-4">
          <DialogTitle className="text-xl font-bold text-center mb-1">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center mb-6">
            {t("description")}
          </DialogDescription>

          {/* Test session highlight card */}
          <div className="bg-[var(--sl-blue)]/5 dark:bg-[var(--sl-blue)]/10 border border-[var(--sl-blue)]/20 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--sl-purple)]/15 flex items-center justify-center flex-shrink-0">
                <IconCalendarEvent className="h-4 w-4 text-[var(--sl-purple)]" />
              </div>
              <p className="font-semibold text-sm text-foreground">
                {t("test-session-title")}
              </p>
              <span className="ml-auto text-xs font-bold text-[var(--sl-blue)] bg-[var(--sl-blue)]/10 px-2 py-0.5 rounded-full">
                FREE
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("test-session-desc")}
            </p>
            <ul className="space-y-1.5">
              {[t("benefit-1"), t("benefit-2"), t("benefit-3")].map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <IconCheck className="h-3.5 w-3.5 text-[var(--sl-purple)] flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Action */}
          <Button
            onClick={handleBookSession}
            className="w-full bg-gradient-to-r from-[var(--sl-purple)] to-[var(--sl-blue)] hover:opacity-90 text-white shadow-sm"
          >
            <IconCalendarEvent className="h-4 w-4 mr-2" />
            {t("cta-button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
