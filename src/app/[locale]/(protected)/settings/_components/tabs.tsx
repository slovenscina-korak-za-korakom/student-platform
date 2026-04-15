"use client"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import AccountCard from "@/app/[locale]/(protected)/settings/_components/account-card";
import EmailCard from "@/app/[locale]/(protected)/settings/_components/email-card";
import PasswordCard from "@/app/[locale]/(protected)/settings/_components/password-card";
import PreferencesForm from "@/app/[locale]/(protected)/settings/_components/preferences-form";
import {useTranslations} from "next-intl";

export const SettingTabs = () => {
  const t = useTranslations("settings.tabs");
  return (
  <Tabs defaultValue="account" className="max-w-2xl mx-auto">
    <div className="flex justify-center items-center">
      <TabsList className="hidden">
        <TabsTrigger
          value="account"
          className="data-[state=active]:bg-white"
        >
          {t("account")}
        </TabsTrigger>
        <TabsTrigger
          disabled
          value="billing"
          className="data-[state=active]:bg-white"
        >
          {t("billing")}
        </TabsTrigger>
        <TabsTrigger
          disabled
          value="notifications"
          className="data-[state=active]:bg-white"
        >
          {t("notifications")}
        </TabsTrigger>
      </TabsList>
    </div>
    <TabsContent className="w-full" value="account">
      <div className="space-y-8">
        <AccountCard />
        <EmailCard />
        <PasswordCard />
        <PreferencesForm />
        {/*<DevicesCard />*/}
      </div>
    </TabsContent>
    <TabsContent className="w-full" value="billing">
      Change your billing address here.
    </TabsContent>
    <TabsContent className="w-full" value="notification">
      Manage notifications
    </TabsContent>
  </Tabs>
  );
};
