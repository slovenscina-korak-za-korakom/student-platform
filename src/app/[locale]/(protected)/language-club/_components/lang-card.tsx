"use client";
import React, {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {
  IconCalendar,
  IconCancel,
  IconClock,
  IconCoinEuro,
  IconCreditCard,
  IconCreditCardRefund,
  IconLanguage,
  IconLoader2,
  IconMapPin,
  IconReceiptRefund,
  IconRosetteDiscountCheck,
  IconStopwatch,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import {Tooltip, TooltipContent, TooltipTrigger,} from "@/components/ui/tooltip";
import {useTranslations} from "next-intl";
import {bookEventDirect, createCheckoutSession,} from "@/actions/stripe-actions";
import SuccessDialog from "./success-dialog";
import {toast} from "sonner";
import {Card} from "@/components/ui/card";
import {localeType} from "@/i18n/routing";
import {LangEvent} from "@/types/interfaces";

const LangCard = ({locale, event}: {locale: localeType, event: LangEvent}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookedEvent, setBookedEvent] = useState(null);
  const t = useTranslations("dashboard.events");
  const spotsLeft = event.maxBooked - event.peopleBooked
  const price = parseFloat(event.price.toString())

  const eventDate = new Date(event.date);
  const isFull = spotsLeft <= 0;

  const handleStripeBooking = async () => {
    setIsLoading(true);
    setShowBookingDialog(false);
    try {
      const result = await createCheckoutSession(event.id.toString(), locale);
      if (result.error) throw new Error(result.error)
      window.location.href = result.url;
    } catch (error) {
      toast.error("Booking error: " + error.message || "Failed to book appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectBooking = async () => {
    setIsLoading(true);
    setShowBookingDialog(false);
    try {
      const result = await bookEventDirect(event.id.toString());
      if (!result.success) throw new Error(result.error)
      // Show success dialog
      setBookedEvent(result.event);
      setShowSuccessDialog(true);
      toast.success("Your language club session has been booked.");
    } catch (error) {
      toast.error("Booking error: " + error.message || "Failed to book appointment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="rounded-xl border border-border/50 bg-card overflow-hidden transition-colors hover:border-border/80 hover:shadow-sm">
        {/* Gradient accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-blue-500 to-violet-500"/>

        <div className="p-4 space-y-3">
          {/* Header: theme + date/time */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground leading-snug truncate">
                {event.theme}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{event.tutor}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium text-foreground tabular-nums">
                {eventDate.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5 tabular-nums">
                <IconClock className="h-3 w-3"/>
                {eventDate.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs font-normal">
                  <IconLanguage className="h-3 w-3 mr-1"/>
                  {event.level}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {t("tooltip.level", {level: event.level})}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`text-xs font-normal ${
                    isFull
                      ? "text-red-500 border-red-200 dark:border-red-900"
                      : spotsLeft <= 2
                        ? "text-amber-600 border-amber-200 dark:border-amber-900"
                        : ""
                  }`}
                >
                  <IconUsers className="h-3 w-3 mr-1"/>
                  {isFull ? t("tooltip.spots.no-spots") : spotsLeft}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isFull
                  ? t("tooltip.spots.no-spots")
                  : t("tooltip.spots.spots-left", {spots: spotsLeft})}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs font-normal">
                  <IconStopwatch className="h-3 w-3 mr-1"/>
                  {event.duration}m
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {t("tooltip.duration", {duration: event.duration})}
              </TooltipContent>
            </Tooltip>

            <Badge variant="outline" className="text-xs font-normal">
              <IconMapPin className="h-3 w-3 mr-1"/>
              {event.location}
            </Badge>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="leading-none">
              <span className="text-2xl font-bold text-foreground tabular-nums">
                €{price.toFixed(2).split(".")[0]}
              </span>
              <span className="text-base font-medium text-foreground/70 tabular-nums">
                .{price.toFixed(2).split(".")[1]}
              </span>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white border-0 shadow-none"
              onClick={() => setShowBookingDialog(true)}
              disabled={isLoading || isFull}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/>
                  {t("processing")}
                </>
              ) : (
                <>
                  <IconCalendar className="mr-1.5 h-3.5 w-3.5"/>
                  {t("book-now")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Options Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-3xl w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{t("dialog.title")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("dialog.subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-3 mt-2">
            {/* Free / Reserve Option */}
            <div className="flex-1 rounded-xl border border-border/60 p-5 flex flex-col">
              <div
                className="w-9 h-9 bg-green-50 dark:bg-green-950/60 rounded-lg flex items-center justify-center mb-3">
                <IconRosetteDiscountCheck className="w-5 h-5 text-green-600 dark:text-green-400"/>
              </div>
              <h3 className="font-semibold mb-1">{t("dialog.free-card.title")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dialog.free-card.desc")}
              </p>
              <div className="space-y-2.5 text-sm text-muted-foreground mb-6 flex-1">
                <p className="flex items-start gap-2">
                  <IconRosetteDiscountCheck className="h-4 w-4 shrink-0 mt-0.5"/>
                  {t("dialog.free-card.l1")}
                </p>
                <p className="flex items-start gap-2">
                  <IconCoinEuro className="h-4 w-4 shrink-0 mt-0.5"/>
                  <span>
                    {t("dialog.free-card.l2")}{" "}
                    <span className="text-xs italic opacity-70">
                      {t("dialog.free-card.l2-add")}
                    </span>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <IconCancel className="h-4 w-4 shrink-0 mt-0.5"/>
                  {t("dialog.free-card.l3")}
                </p>
              </div>
              <Button variant="outline" onClick={handleDirectBooking} className="w-full">
                <IconCalendar className="mr-2 h-4 w-4"/>
                {t("dialog.free-card.button")}
              </Button>
            </div>

            {/* Paid Stripe Option */}
            <Card
              className="flex-1 rounded-xl p-5 flex flex-col"
              disabled
              disabledTitle={t("dialog.disabled-title")}
              disabledText={t("dialog.disabled-text")}
            >
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/60 rounded-lg flex items-center justify-center mb-3">
                <IconCreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
              </div>
              <h3 className="font-semibold mb-1">{t("dialog.pay-card.title")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dialog.pay-card.desc")}
              </p>
              <div className="space-y-2.5 text-sm text-muted-foreground mb-6 flex-1">
                <p className="flex items-start gap-2">
                  <IconWorld className="h-4 w-4 shrink-0 mt-0.5"/>
                  {t("dialog.pay-card.l1")}
                </p>
                <p className="flex items-start gap-2">
                  <IconCreditCardRefund className="h-4 w-4 shrink-0 mt-0.5"/>
                  <span>
                    {t("dialog.pay-card.l2")}{" "}
                    <span className="text-xs italic opacity-70">
                      {t("dialog.pay-card.l2-add", {hours: 48})}
                    </span>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <IconReceiptRefund className="h-4 w-4 shrink-0 mt-0.5"/>
                  {t("dialog.pay-card.l3")}
                </p>
              </div>
              <Button disabled onClick={handleStripeBooking} className="w-full">
                <IconCreditCard className="mr-2 h-4 w-4"/>
                {t("dialog.pay-card.button", {price: price.toFixed(2)})}
              </Button>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      {showSuccessDialog && bookedEvent && (
        <SuccessDialog
          type="direct"
          event={bookedEvent}
          locale={locale}
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
        />
      )}
    </>
  );
};

export default LangCard;
