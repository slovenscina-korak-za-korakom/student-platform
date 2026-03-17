"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedIcon } from "lucide-react";
import { IconMail } from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {useLocale, useTranslations} from "next-intl";

const EmailCard = () => {
  const { user, isLoaded } = useUser();
  const locale = useLocale()
  const t = useTranslations("settings.account.email-address");

  return (
    <Card className="w-full max-w-4xl rounded-2xl p-1 bg-accent border-none">
      <CardHeader className="pt-5">
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="bg-white dark:bg-background border border-foreground/10 rounded-2xl p-4">
        {!isLoaded ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <ul className="space-y-4">
            {user.emailAddresses.map((email) => {
              const isPrimary = email.id === user.primaryEmailAddressId;
              const isVerified = email.verification?.status === "verified";

              return (
                <li
                  key={email.id}
                  className="flex flex-wrap justify-between items-center gap-y-1"
                >
                  <div className="flex text-foreground/50 gap-3 flex-row justify-start items-center flex-wrap min-w-0">
                    <IconMail size={16} className="shrink-0" />
                    <span className="text-sm break-all">{email.emailAddress}</span>
                    {isVerified ? (
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer">
                          <VerifiedIcon
                            size={16}
                            className="text-emerald-500"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("verified-text")}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {t("unverified-badge")}
                      </Badge>
                    )}
                    {isPrimary && (
                      <Badge
                        variant="outline"
                        className="text-emerald-500 text-xs"
                      >
                        {t("primary-badge")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-foreground/50 text-nowrap">
                    {t("added-text",{ date : new Date(user.createdAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailCard;
