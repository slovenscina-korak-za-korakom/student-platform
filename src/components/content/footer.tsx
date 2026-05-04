/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { usePathname } from "next/navigation";
import { footerLinks } from "@/lib/docs";
import { SocialLinks } from "../ui/social-links";
import { useTranslations } from "next-intl";
import { IconLogo } from "../icons/icon-logo";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("footer");

  const pathname = usePathname();
  if (pathname.includes("/auth") || pathname.includes("/legal")) {
    return null;
  }

  const socialLinkSize = "26";

  return (
    <footer className="relative isolate overflow-hidden border-t border-border/50">
      <div className="absolute inset-0 -z-10 gradient-primary-subtle-reversed opacity-60 dark:opacity-40" />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col lg:flex-row justify-between gap-12">
          <div className="flex flex-col gap-6 max-w-md">
            <div className="size-10">
              <span className="sr-only">Slovenščina Korak za Korkom</span>
              <IconLogo />
            </div>
            <p className="text-sl-secondary text-lg leading-relaxed">
              {t("title")}
            </p>
            <div className="flex flex-row items-center gap-x-4">
              <SocialLinks
                href={"https://t.me/slovenscina_korak_za_korakom"}
                srOnly={"Slovenščina Korak za Korkom | Telegram"}
              >
                <svg
                  width={socialLinkSize}
                  height={socialLinkSize}
                  viewBox="0 0 48 48"
                  className="fill-sl-secondary hover:fill-sl-accent transition-colors duration-200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24ZM24.8601 17.7179C22.5257 18.6888 17.8603 20.6984 10.8638 23.7466C9.72766 24.1984 9.13251 24.6404 9.07834 25.0726C8.98677 25.803 9.90142 26.0906 11.1469 26.4822C11.3164 26.5355 11.4919 26.5907 11.6719 26.6492C12.8973 27.0475 14.5457 27.5135 15.4026 27.5321C16.1799 27.5489 17.0475 27.2284 18.0053 26.5707C24.5423 22.158 27.9168 19.9276 28.1286 19.8795C28.2781 19.8456 28.4852 19.803 28.6255 19.9277C28.7659 20.0524 28.7521 20.2886 28.7372 20.352C28.6466 20.7383 25.0562 24.0762 23.1982 25.8036C22.619 26.3421 22.2081 26.724 22.1242 26.8113C21.936 27.0067 21.7443 27.1915 21.56 27.3692C20.4215 28.4667 19.5678 29.2896 21.6072 30.6336C22.5873 31.2794 23.3715 31.8135 24.1539 32.3463C25.0084 32.9282 25.8606 33.5085 26.9632 34.2313C27.2442 34.4155 27.5125 34.6068 27.7738 34.7931C28.7681 35.5019 29.6615 36.1388 30.7652 36.0373C31.4065 35.9782 32.0689 35.3752 32.4053 33.5767C33.2004 29.3263 34.7633 20.1169 35.1244 16.3219C35.1561 15.9895 35.1163 15.5639 35.0843 15.3771C35.0523 15.1904 34.9855 14.9242 34.7427 14.7272C34.4552 14.4939 34.0113 14.4447 33.8127 14.4482C32.91 14.4641 31.5251 14.9456 24.8601 17.7179Z"
                    fill="current"
                  />
                </svg>
              </SocialLinks>
              <SocialLinks
                href={"https://www.instagram.com/slovenscina_korakzakorakom/"}
                srOnly={"Slovenščina Korak za Korkom | Instagram"}
              >
                <svg
                  width={socialLinkSize}
                  height={socialLinkSize}
                  viewBox="0 0 48 48"
                  className="fill-sl-secondary hover:fill-sl-accent transition-colors duration-200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_17_63)">
                    <path
                      d="M24 4.32187C30.4125 4.32187 31.1719 4.35 33.6938 4.4625C36.0375 4.56562 37.3031 4.95938 38.1469 5.2875C39.2625 5.71875 40.0688 6.24375 40.9031 7.07812C41.7469 7.92188 42.2625 8.71875 42.6938 9.83438C43.0219 10.6781 43.4156 11.9531 43.5188 14.2875C43.6313 16.8187 43.6594 17.5781 43.6594 23.9813C43.6594 30.3938 43.6313 31.1531 43.5188 33.675C43.4156 36.0188 43.0219 37.2844 42.6938 38.1281C42.2625 39.2438 41.7375 40.05 40.9031 40.8844C40.0594 41.7281 39.2625 42.2438 38.1469 42.675C37.3031 43.0031 36.0281 43.3969 33.6938 43.5C31.1625 43.6125 30.4031 43.6406 24 43.6406C17.5875 43.6406 16.8281 43.6125 14.3063 43.5C11.9625 43.3969 10.6969 43.0031 9.85313 42.675C8.7375 42.2438 7.93125 41.7188 7.09688 40.8844C6.25313 40.0406 5.7375 39.2438 5.30625 38.1281C4.97813 37.2844 4.58438 36.0094 4.48125 33.675C4.36875 31.1438 4.34063 30.3844 4.34063 23.9813C4.34063 17.5688 4.36875 16.8094 4.48125 14.2875C4.58438 11.9437 4.97813 10.6781 5.30625 9.83438C5.7375 8.71875 6.2625 7.9125 7.09688 7.07812C7.94063 6.23438 8.7375 5.71875 9.85313 5.2875C10.6969 4.95938 11.9719 4.56562 14.3063 4.4625C16.8281 4.35 17.5875 4.32187 24 4.32187ZM24 0C17.4844 0 16.6688 0.028125 14.1094 0.140625C11.5594 0.253125 9.80625 0.665625 8.2875 1.25625C6.70312 1.875 5.3625 2.69062 4.03125 4.03125C2.69063 5.3625 1.875 6.70313 1.25625 8.27813C0.665625 9.80625 0.253125 11.55 0.140625 14.1C0.028125 16.6687 0 17.4844 0 24C0 30.5156 0.028125 31.3312 0.140625 33.8906C0.253125 36.4406 0.665625 38.1938 1.25625 39.7125C1.875 41.2969 2.69063 42.6375 4.03125 43.9688C5.3625 45.3 6.70313 46.125 8.27813 46.7344C9.80625 47.325 11.55 47.7375 14.1 47.85C16.6594 47.9625 17.475 47.9906 23.9906 47.9906C30.5063 47.9906 31.3219 47.9625 33.8813 47.85C36.4313 47.7375 38.1844 47.325 39.7031 46.7344C41.2781 46.125 42.6188 45.3 43.95 43.9688C45.2812 42.6375 46.1063 41.2969 46.7156 39.7219C47.3063 38.1938 47.7188 36.45 47.8313 33.9C47.9438 31.3406 47.9719 30.525 47.9719 24.0094C47.9719 17.4938 47.9438 16.6781 47.8313 14.1188C47.7188 11.5688 47.3063 9.81563 46.7156 8.29688C46.125 6.70312 45.3094 5.3625 43.9688 4.03125C42.6375 2.7 41.2969 1.875 39.7219 1.26562C38.1938 0.675 36.45 0.2625 33.9 0.15C31.3313 0.028125 30.5156 0 24 0Z"
                      fill="current"
                    />
                    <path
                      d="M24 11.6719C17.1938 11.6719 11.6719 17.1938 11.6719 24C11.6719 30.8062 17.1938 36.3281 24 36.3281C30.8062 36.3281 36.3281 30.8062 36.3281 24C36.3281 17.1938 30.8062 11.6719 24 11.6719ZM24 31.9969C19.5844 31.9969 16.0031 28.4156 16.0031 24C16.0031 19.5844 19.5844 16.0031 24 16.0031C28.4156 16.0031 31.9969 19.5844 31.9969 24C31.9969 28.4156 28.4156 31.9969 24 31.9969Z"
                      fill="current"
                    />
                    <path
                      d="M39.6937 11.1843C39.6937 12.778 38.4 14.0624 36.8156 14.0624C35.2219 14.0624 33.9375 12.7687 33.9375 11.1843C33.9375 9.59053 35.2313 8.30615 36.8156 8.30615C38.4 8.30615 39.6937 9.5999 39.6937 11.1843Z"
                      fill="current"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_17_63">
                      <rect width="48" height="48" fill="current" />
                    </clipPath>
                  </defs>
                </svg>
              </SocialLinks>
              {/* <SocialLinks href={"#"} srOnly={"Slovenščina Korak za Korkom | Facebook"}>
                        <svg
                            width={socialLinkSize}
                            height={socialLinkSize}
                            viewBox="0 0 48 48"
                            className="fill-sl-secondary hover:fill-sl-accent transition-colors duration-200"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <g clipPath="url(#clip0_17_61)">
                                <path
                                    d="M24 0C10.7453 0 0 10.7453 0 24C0 35.255 7.74912 44.6995 18.2026 47.2934V31.3344H13.2538V24H18.2026V20.8397C18.2026 12.671 21.8995 8.8848 29.9194 8.8848C31.44 8.8848 34.0637 9.18336 35.137 9.48096V16.129C34.5706 16.0694 33.5866 16.0397 32.3645 16.0397C28.4294 16.0397 26.9088 17.5306 26.9088 21.4061V24H34.7482L33.4013 31.3344H26.9088V47.8243C38.7926 46.3891 48.001 36.2707 48.001 24C48 10.7453 37.2547 0 24 0Z"
                                    fill="current"
                                />
                            </g>
                            <defs>
                                <clipPath id="clip0_17_61">
                                    <rect width="48" height="48" fill="current" />
                                </clipPath>
                            </defs>
                        </svg>
                    </SocialLinks> */}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="flex flex-col">
              <h2 className="mb-4 text-sl-primary font-semibold text-sm uppercase tracking-wider">
                {t("personal.title")}
              </h2>
              <div className="flex flex-col gap-3">
                {footerLinks.Personal.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-sl-secondary hover:text-sl-accent transition-colors duration-200 text-sm"
                  >
                    {t(`personal.${item.name}`)}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="mb-4 text-sl-primary font-semibold text-sm uppercase tracking-wider">
                {t("links.title")}
              </h2>
              <div className="flex flex-col gap-3">
                {footerLinks.QuickLinks.map((item) => (
                  <div key={item.name}>
                    {item.server ||
                    item.href.startsWith("mailto:") ||
                    item.href.includes("#") ? (
                      <a
                        href={item.href}
                        className="text-sl-secondary hover:text-sl-accent transition-colors duration-200 text-sm"
                      >
                        {t(`links.${item.name}`)}
                      </a>
                    ) : (
                      <Link
                        href={item.href as any}
                        className="text-sl-secondary hover:text-sl-accent transition-colors duration-200 text-sm"
                      >
                        {t(`links.${item.name}`)}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="mb-4 text-sl-primary font-semibold text-sm uppercase tracking-wider">
                {t("company.title")}
              </h2>
              <div className="flex flex-col gap-3">
                {footerLinks.Company.map((item) => (
                  <div key={item.name}>
                    {item.href.startsWith("mailto:") ||
                    item.href.includes("#") ? (
                      <a
                        href={item.href}
                        className="text-sl-secondary hover:text-sl-accent transition-colors duration-200 text-sm"
                      >
                        {t(`company.${item.name}`)}
                      </a>
                    ) : (
                      <Link
                        href={item.href as any}
                        className="text-sl-secondary hover:text-sl-accent transition-colors duration-200 text-sm"
                      >
                        {t(`company.${item.name}`)}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="mb-4 text-sl-primary font-semibold text-sm uppercase tracking-wider">
                {t("legal.title")}
              </h2>
              <div className="flex flex-col gap-3">
                {footerLinks.Legal.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href as any}
                    className="text-sl-secondary hover:text-sl-accent transition-colors duration-200 text-sm"
                  >
                    {t(`legal.${item.name}`)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sl-secondary text-sm">
            &copy;
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
