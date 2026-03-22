"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BookingSuccess from "./booking-success";
import {useTranslations} from "next-intl";
import {localeType} from "@/i18n/routing";
import {LangEvent} from "@/types/interfaces";

interface SuccessDialogProps {
  event: LangEvent;
  locale: localeType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "stripe" | "direct";
}

const SuccessDialog = ({
  event,
  locale,
  open,
  type = "stripe",
  onOpenChange,
}: SuccessDialogProps) => {
  const t = useTranslations("dashboard.events.success-dialog")
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open && type === "stripe") {
          // Remove ?success and any query params, redirect to clean /language-club
          window.location.replace(`/${locale}/language-club`);
        }
      }}
    >
      <DialogContent className="border-none m-0 w-fit p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <BookingSuccess event={event} locale={locale} />
      </DialogContent>
    </Dialog>
  );
};

export default SuccessDialog;
