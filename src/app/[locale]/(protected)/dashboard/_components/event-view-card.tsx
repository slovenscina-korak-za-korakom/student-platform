import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import {
  IconCalendarSearch,
  IconRosetteDiscountCheck,
  IconLoader2,
  IconTrash,
  IconMapPin,
  IconClock,
  IconLanguage,
} from "@tabler/icons-react";
import RescheduleDialog from "./reschedule-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { cancelBooking } from "@/actions/stripe-actions";
import { useRouter } from "@/i18n/routing";

const EventViewCalendar = ({ event, locale }) => {
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const t = useTranslations("common.buttons");
  const d = useTranslations("dashboard.all-scheduled-events.event-view-card");
  const d2 = useTranslations("dashboard.cancel-booking-dialog");
  const router = useRouter();
  const handleCancel = async () => {
    setIsCancelling(true);

    try {
      const response = await cancelBooking(event.bookingId);

      if (response.status === 200) {
        router.refresh();
        toast.success(response.message || "Booking cancelled successfully");
      } else {
        toast.error(response.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };
  return (
    <>
      <Card key={event.id} className="gap-2">
        <CardHeader>
          <CardTitle className="font-medium">{event.theme}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {event.tutor}
          </CardDescription>
          <CardAction className="text-sm text-muted-foreground">
            {new Date(event.date).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-5">
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <div className="flex flex-row gap-2 justify-center items-center w-full">
                <Badge variant="secondary" className="w-2/5 md:w-auto">
                  <IconLanguage className="w-4 h-4" />
                  {event.level}
                </Badge>
                <Badge variant="secondary" className="w-2/5 md:w-auto">
                  <IconClock className="w-4 h-4" />
                  {event.duration}
                </Badge>
              </div>
              <div className="flex flex-row gap-2 justify-center items-center w-full">
                <Badge variant="secondary" className="w-2/5 md:w-auto">
                  <IconMapPin className="w-4 h-4" />
                  {event.location}
                </Badge>
                <Badge
                  variant={event.bookingStatus === "paid" ? "paid" : "success"}
                  className="w-2/5 md:w-auto"
                >
                  <IconRosetteDiscountCheck className="w-4 h-4" />
                  {d("status", {
                    status: event.bookingStatus,
                  })}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 w-full justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="cursor-pointer w-1/2 md:w-auto"
                    variant="destructive"
                    size="sm"
                  >
                    <IconTrash className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-background border-red-500 dark:border-red-500/30 border-2">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{d2("title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {d2("description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        toast.promise(handleCancel, {
                          loading: t("cancelling"),
                        })
                      }
                      disabled={isCancelling}
                      className={buttonVariants({ variant: "destructive" })}
                    >
                      {isCancelling ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("cancelling")}
                        </>
                      ) : (
                        t("cancel-booking")
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                className="cursor-pointer w-1/2 md:w-auto"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowRescheduleDialog(true);
                }}
              >
                <IconCalendarSearch className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        currentEvent={event}
        bookingId={event.bookingId}
        locale={locale}
      />
    </>
  );
};

export default EventViewCalendar;
