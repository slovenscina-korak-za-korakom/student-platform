"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IconLoader2 } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { studentCancelSession } from "@/actions/regulars";

interface CancelRegularSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: number;
  sessionDate: Date;
  tutorName: string;
  locale: string;
}

export default function CancelRegularSessionDialog({
  open,
  onOpenChange,
  invitationId,
  sessionDate,
  tutorName,
  locale,
}: CancelRegularSessionDialogProps) {
  const [reason, setReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const tCancel = useTranslations("dashboard.cancel-regular-session-dialog");
  const tButtons = useTranslations("common.buttons");
  const router = useRouter();

  const formattedDate = new Date(sessionDate).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await studentCancelSession(invitationId, sessionDate, reason || undefined);

      if (response?.success) {
        router.refresh();
        toast.success(response.message || "Session cancelled successfully");
        onOpenChange(false);
        setReason("");
      } else {
        toast.error(response?.message || "Failed to cancel session");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel session");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-[#1e1e1e] border-red-500 dark:border-red-500/30 border-2 rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{tCancel("title")}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">{tCancel("description")}</span>
            <span className="block font-medium text-foreground">
              {formattedDate}
            </span>
            <span className="block text-muted-foreground">
              {tCancel("with-tutor", { tutor: tutorName })}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="reason" className="text-sm font-medium">
            {tCancel("reason-label")}
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={tCancel("reason-placeholder")}
            className="mt-2 resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {tCancel("reason-hint")}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>
            {tButtons("go-back")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            variant="destructive"
            disabled={isCancelling}
            className={buttonVariants({ variant: "destructive" })}
          >
            {isCancelling ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                {tButtons("cancelling")}
              </>
            ) : (
              tCancel("confirm-cancel")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
