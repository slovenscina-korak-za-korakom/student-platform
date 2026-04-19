"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@clerk/nextjs";
import {
  EmailCodeFactor,
  SessionVerificationLevel,
  SessionVerificationResource,
} from "@clerk/types";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {useTranslations} from "next-intl";

export function VerificationComponent({
  level = "first_factor",
  onComplete,
  onCancel,
}: {
  level: SessionVerificationLevel | undefined;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const t = useTranslations("settings.account.password.dialog.verification")
  const t2 = useTranslations("common.buttons")
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const reverificationRef = useRef<SessionVerificationResource | undefined>(
    undefined
  );
  const [determinedStartingFirstFactor, setDeterminedStartingFirstFactor] =
    useState<EmailCodeFactor | undefined>();

  const prepareEmailVerification = useCallback(
    async (verificationResource: SessionVerificationResource) => {
      // To simplify the example we will only handle the first factor verification
      if (verificationResource.status === "needs_first_factor") {
        // Determine the starting first factor from the supported first factors
        const determinedStartingFirstFactor =
          verificationResource.supportedFirstFactors?.filter(
            (factor) => factor.strategy === "email_code"
          )[0];

        if (determinedStartingFirstFactor) {
          setDeterminedStartingFirstFactor(determinedStartingFirstFactor);
          // Prepare the first factor verification with the determined starting first factor
          await session?.prepareFirstFactorVerification({
            strategy: determinedStartingFirstFactor.strategy,
            emailAddressId: determinedStartingFirstFactor?.emailAddressId,
          });
        }
      }
    },
    [session]
  );

  useEffect(() => {
    if (reverificationRef.current) {
      return;
    }

    session?.startVerification({ level }).then(async (response) => {
      reverificationRef.current =
        response as unknown as SessionVerificationResource;
      await prepareEmailVerification(
        response as unknown as SessionVerificationResource
      );
    });
  }, [level, prepareEmailVerification, session]);

  const handleVerificationAttempt = async () => {
    try {
      // Attempt to verify the session with the provided code
      await session?.attemptFirstFactorVerification({
        strategy: "email_code",
        code,
      });
      onComplete();
    } catch (e) {
      // Any error from the attempt to verify the session can be handled here
      console.error("Error verifying session", e);
    }
  };

  if (!determinedStartingFirstFactor) {
    return null;
  }

  return (
    <div className="flex flex-col justify-center items-center text-center">
      <h1 className="text-lg font-semibold tracking-[-0.001rem] pb-1">
        {t("title")}
      </h1>
      <p className="text-sm text-foreground/60 pb-6">
        {t("subtitle")}<br />{" "}
        {determinedStartingFirstFactor.safeIdentifier || ""}
      </p>
      <InputOTP
        name="code"
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        onChange={(newValue: string) => setCode(newValue)}
      >
        <InputOTPGroup className="space-x-2">
          <InputOTPSlot index={0} className="!rounded-md border-1" />
          <InputOTPSlot index={1} className="!rounded-md border-1" />
          <InputOTPSlot index={2} className="!rounded-md border-1" />
          <InputOTPSlot index={3} className="!rounded-md border-1" />
          <InputOTPSlot index={4} className="!rounded-md border-1" />
          <InputOTPSlot index={5} className="!rounded-md border-1" />
        </InputOTPGroup>
      </InputOTP>
      <div className="inline-flex gap-1 items-center pb-5">
        <p className="text-sm text-foreground/80">
          {t("no-code")}
        </p>
        <Button
          variant="link"
          className="p-0 text-foreground/80 cursor-pointer"
        >
          {t2("resend")}
        </Button>
      </div>
      <div className="space-y-2 w-10/12">
        <Button
          onClick={async () => {
            setIsLoading(true);
            await handleVerificationAttempt();
            setIsLoading(false);
          }}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t2("verifying") : t2("complete")}
        </Button>
        <Button
          onClick={() => onCancel()}
          variant="outline"
          className="w-full rounded-lg cursor-pointer transition-colors duration-200 ease-linear"
        >
          {t2("cancel")}
        </Button>
      </div>
    </div>
  );
}
