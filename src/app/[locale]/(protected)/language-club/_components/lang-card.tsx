"use client";
import React, {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  IconCalendar,
  IconCancel,
  IconChevronRight,
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
  IconX,
} from "@tabler/icons-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {useTranslations} from "next-intl";
import {bookEventDirect} from "@/actions/stripe-actions";
import SuccessDialog from "./success-dialog";
import {toast} from "sonner";
import {localeType} from "@/i18n/routing";
import {LangEvent} from "@/types/interfaces";
import {cn} from "@/lib/utils";
import {useIsMobile} from "@/hooks/use-mobile";

const LangCard = ({locale, event}: {locale: localeType, event: LangEvent}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookedEvent, setBookedEvent] = useState(null);
  const t = useTranslations("dashboard.events");
  const isMobile = useIsMobile();
  const spotsLeft = event.maxBooked - event.peopleBooked;
  const price = parseFloat(event.price.toString());

  const eventDate = new Date(event.date);
  const isFull = spotsLeft <= 0;

  const handleDirectBooking = async () => {
    setIsLoading(true);
    setShowBookingDialog(false);
    try {
      const result = await bookEventDirect(event.id.toString());
      if (!result.success) throw new Error(result.error);
      setBookedEvent(result.event);
      setShowSuccessDialog(true);
      toast.success("Your language club session has been booked.");
    } catch (error) {
      toast.error("Booking error: " + error.message || "Failed to book appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const BookingOptions = () => (
    <div className="space-y-3">
      {/* Free / Reserve Option */}
      <button
        onClick={handleDirectBooking}
        className="w-full flex items-start gap-3.5 p-4 rounded-xl border border-border hover:border-green-500/40 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all duration-150 cursor-pointer text-left group"
      >
        <div className="w-9 h-9 bg-green-50 dark:bg-green-950/60 rounded-lg flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-green-100 dark:group-hover:bg-green-950/80 transition-colors">
          <IconRosetteDiscountCheck className="w-5 h-5 text-green-600 dark:text-green-400"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {t("dialog.free-card.title")}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t("dialog.free-card.desc")}
          </p>
          <div className="mt-2.5 space-y-1.5">
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <IconRosetteDiscountCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-500"/>
              {t("dialog.free-card.l1")}
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <IconCoinEuro className="h-3.5 w-3.5 shrink-0 mt-0.5"/>
              {t("dialog.free-card.l2")}{" "}
              <span className="italic opacity-70">{t("dialog.free-card.l2-add")}</span>
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <IconCancel className="h-3.5 w-3.5 shrink-0 mt-0.5"/>
              {t("dialog.free-card.l3")}
            </p>
          </div>
        </div>
        <IconChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-green-500 shrink-0 mt-1 transition-colors"/>
      </button>

      {/* Paid Stripe Option — disabled / coming soon */}
      <div className="w-full flex items-start gap-3.5 p-4 rounded-xl border border-border opacity-50 text-left cursor-not-allowed">
        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/60 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <IconCreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {t("dialog.pay-card.title")}
            </p>
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 rounded-full">
              {t("dialog.disabled-title")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t("dialog.pay-card.desc")}
          </p>
          <div className="mt-2.5 space-y-1.5">
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <IconWorld className="h-3.5 w-3.5 shrink-0 mt-0.5"/>
              {t("dialog.pay-card.l1")}
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <IconCreditCardRefund className="h-3.5 w-3.5 shrink-0 mt-0.5"/>
              {t("dialog.pay-card.l2")}{" "}
              <span className="italic opacity-70">{t("dialog.pay-card.l2-add", {hours: 48})}</span>
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <IconReceiptRefund className="h-3.5 w-3.5 shrink-0 mt-0.5"/>
              {t("dialog.pay-card.l3")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Card ── */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden transition-colors hover:border-border/80 hover:shadow-sm">
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

      {/* ── Booking Dialog (desktop) ── */}
      {!isMobile && (
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent
            showCloseButton={false}
            className="p-0 gap-0 border-0 shadow-2xl rounded-2xl overflow-hidden flex flex-row w-[calc(100vw-2rem)] sm:max-w-[620px]"
          >
            <DialogTitle className="sr-only">{t("dialog.title")}</DialogTitle>
            <DialogDescription className="sr-only">{t("dialog.subtitle")}</DialogDescription>

            {/* Left gradient panel */}
            <div
              className="w-[190px] shrink-0 flex flex-col"
              style={{background: "linear-gradient(170deg, #2563eb 0%, #7c3aed 55%, #6d28d9 100%)"}}
            >
              <div className="px-5 pt-6 pb-4">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                  <IconCalendar className="h-5 w-5 text-white"/>
                </div>
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">
                  {t("dialog.title")}
                </p>
                <h2 className="text-white text-lg font-bold leading-snug">
                  Book<br/>Your Spot
                </h2>
              </div>

              <div className="mx-5 h-px bg-white/10"/>

              <div className="px-5 py-4 flex-1 space-y-3.5">
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">
                    Topic
                  </p>
                  <p className="text-white text-sm font-semibold leading-snug line-clamp-3">
                    {event.theme}
                  </p>
                </div>

                <div className="h-px bg-white/10"/>

                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                    Date & Time
                  </p>
                  <p className="text-white text-sm font-semibold tabular-nums">
                    {eventDate.toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5 tabular-nums flex items-center gap-1">
                    <IconClock className="h-3 w-3"/>
                    {eventDate.toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </div>

                <div className="h-px bg-white/10"/>

                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">
                    Price
                  </p>
                  <p className="text-white text-2xl font-extrabold tabular-nums leading-none">
                    €{price.toFixed(2)}
                  </p>
                </div>

                <div className="h-px bg-white/10"/>

                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">
                    Spots Left
                  </p>
                  <p className={cn(
                    "text-sm font-semibold",
                    spotsLeft <= 2 ? "text-amber-300" : "text-white"
                  )}>
                    {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col min-h-0 bg-background dark:bg-sidebar">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{t("dialog.title")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("dialog.subtitle")}</p>
                </div>
                <DialogClose className="cursor-pointer p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <IconX className="h-4 w-4"/>
                </DialogClose>
              </div>

              {/* Options */}
              <div className="flex-1 px-5 py-5">
                <BookingOptions/>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Booking Drawer (mobile) ── */}
      {isMobile && (
        <Drawer open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DrawerContent>
            <DrawerTitle className="sr-only">{t("dialog.title")}</DrawerTitle>
            <DrawerDescription className="sr-only">{t("dialog.subtitle")}</DrawerDescription>

            {/* Gradient header */}
            <div
              className="px-5 py-4 flex items-center justify-between shrink-0"
              style={{background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"}}
            >
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">
                  {t("dialog.title")}
                </p>
                <p className="text-white font-bold text-base leading-snug truncate">
                  {event.theme}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-[11px] font-mono font-bold bg-white/15 text-white px-2 py-1 rounded-lg">
                  €{price.toFixed(2)}
                </span>
                <DrawerClose className="cursor-pointer p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors">
                  <IconX className="h-4 w-4"/>
                </DrawerClose>
              </div>
            </div>

            {/* Options */}
            <div className="px-4 py-5">
              <BookingOptions/>
            </div>

            {/* Subtitle */}
            <div className="px-4 pb-8 text-center">
              <p className="text-xs text-muted-foreground">{t("dialog.subtitle")}</p>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* ── Success Dialog ── */}
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
