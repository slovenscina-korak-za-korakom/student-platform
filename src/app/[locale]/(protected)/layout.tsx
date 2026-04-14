import { SiteHeader } from "@/components/dashboard/sidebar/app-header";
import AppSidebar from "@/components/dashboard/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { redirect as redirectI18n } from "@/i18n/routing";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

const ProtectedLayout = async ({ children, params }: ProtectedLayoutProps) => {
  const { userId } = await auth();
  const { locale } = await params;

  if (!userId) {
    redirect(`/sign-in?locale=${locale}`);
  }
  const user = await currentUser();

  const hasCompletedOnboarding = user.unsafeMetadata?.onboardingCompleted;
  if (!hasCompletedOnboarding) {
    redirectI18n({ href: "/welcome", locale: locale });
  }

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultSidebarOpen = sidebarCookie !== undefined ? sidebarCookie === "true" : true;

  return (
    <>
      <SidebarProvider
        defaultOpen={defaultSidebarOpen}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" locale={locale} />
        <SidebarInset>
          <SiteHeader />
          <main className="h-full">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};

export default ProtectedLayout;
