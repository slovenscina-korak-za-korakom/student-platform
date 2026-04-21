"use client";
import {useGSAP} from "@gsap/react";
import gsap, {ScrollTrigger} from "gsap/all";
import {useTranslations} from "next-intl";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

export default function DetailsPageHero() {
  useGSAP(() => {
    const elements = [
      "#subtitle",
      "#title",
      "#text1",
      "#point1",
      "#point2",
      "#point3",
      "#test3",
    ];
    elements.forEach((element) => {
      gsap.from(element, {
        y: "50%",
        opacity: 0,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: element,
          start: "bottom bottom",
          end: "top 50%",
          scrub: true,
        },
      });
    });
    gsap.from("#image", {
      y: "50%",
      opacity: 0,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#text1",
        start: "bottom bottom",
        end: "top 20%",
        scrub: true,
      },
    });
  });

  const t = useTranslations("root.why-slovene");

  return (
    <div className="relative isolate overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10 gradient-primary-subtle-reversed opacity-60 dark:opacity-40"/>
      <div
        className="mx-auto sm:mx-8 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-auto lg:max-w-7xl lg:grid-cols-2 lg:items-start lg:gap-y-10">
        <div
          className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-12 lg:px-8">
          <div className="lg:pr-4">
            <div className="lg:max-w-lg">
              <p
                id="subtitle"
                className="text-sm font-bold uppercase tracking-wider text-sl-accent mb-4"
              >
                {t("subtitle")}
              </p>
              <h1
                id="title"
                className="mt-2 text-pretty text-4xl font-bold tracking-tighter text-sl-primary sm:text-4xl lg:text-5xl"
              >
                {t("title")}
              </h1>
              <p id="text1" className="mt-6 text-lg/8 text-sl-secondary">
                {t("intro")}
              </p>
            </div>
          </div>
        </div>
        <div
          id="image"
          className="hidden lg:block -ml-12 -mt-12 p-12 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <div className="relative">
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-2xl opacity-20"/>
            <Image
              width={1280}
              height={720}
              alt="Details picture"
              src="/details-picture.png"
              className="relative w-full aspect-[16/11] object-cover max-w-none rounded-3xl shadow-2xl ring-1 ring-border/50 sm:w-[57rem]"
            />
          </div>
        </div>
        <div
          className="lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-12 lg:px-8">
          <div className="lg:pr-4 lg:block sm:flex sm:justify-center">
            <div className="max-w-xl text-base/7 text-primary lg:max-w-lg">
              <ul role="list" className="space-y-6">
                <li
                  id="point1"
                  className="group relative flex gap-x-4 p-5 rounded-2xl bg-gradient-primary-subtle border border-border/50 hover:border-sl-accent/30 transition-all duration-300"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-foreground bg-background shadow-lg">
                      <div className="size-5 flex justify-center items-center" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <g fill="currentColor">
                            <path fillRule="evenodd"
                                  d="M9.315 7.584A15.72 15.72 0 0 1 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436q.083.52.084 1.064a6.75 6.75 0 0 1-6.75 6.75a.75.75 0 0 1-.75-.75v-4.131l-.027-.021A15.8 15.8 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75a6.75 6.75 0 0 1 7.815-6.666M15 6.75a2.25 2.25 0 1 0 0 4.5a2.25 2.25 0 0 0 0-4.5"
                                  clipRule="evenodd"/>
                            <path
                              d="M5.26 17.242a.75.75 0 1 0-.897-1.203a5.24 5.24 0 0 0-2.05 5.022a.75.75 0 0 0 .625.627q.398.061.812.062a5.24 5.24 0 0 0 4.21-2.113a.75.75 0 1 0-1.202-.897a3.74 3.74 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <strong className="font-semibold text-sl-primary block mb-1">
                      {t("benefits.career.title")}
                    </strong>
                    <span className="text-sl-secondary text-sm/6">
                      {t("benefits.career.description")}
                    </span>
                  </div>
                </li>
                <li
                  id="point2"
                  className="group relative flex gap-x-4 p-5 rounded-2xl bg-gradient-primary-subtle border border-border/50 hover:border-sl-accent/30 transition-all duration-300"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-foreground bg-background shadow-lg">
                      <div className="size-5 flex justify-center items-center" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <g fill="currentColor">
                            <path
                              d="M4.913 2.658q3.115-.406 6.337-.408c2.147 0 4.262.139 6.337.408c1.922.25 3.291 1.861 3.405 3.727a4.4 4.4 0 0 0-1.032-.211a51 51 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a49 49 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979"/>
                            <path
                              d="M15.75 7.5q-2.065 0-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94q1.865.153 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49 49 0 0 0 15.75 7.5"/>
                          </g>
                        </svg>
                      </div>

                    </div>
                  </div>
                  <div className="flex-1">
                    <strong className="font-semibold text-sl-primary block mb-1">
                      {t("benefits.integration.title")}
                    </strong>
                    <span className="text-sl-secondary text-sm/6">
                      {t("benefits.integration.description")}
                    </span>
                  </div>
                </li>
                <li
                  id="point3"
                  className="group relative flex gap-x-4 p-5 rounded-2xl bg-gradient-primary-subtle border border-border/50 hover:border-sl-accent/30 transition-all duration-300"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-foreground bg-background shadow-lg">
                      <div className="size-5 flex justify-center items-center" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path fill="currentColor"
                                d="M11.25 4.533A9.7 9.7 0 0 0 6 3a9.7 9.7 0 0 0-3.25.555a.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.2 8.2 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886zm1.5 16.103A8.2 8.2 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.7 9.7 0 0 0 18 3a9.7 9.7 0 0 0-5.25 1.533z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <strong className="font-semibold text-sl-primary block mb-1">
                      {t("benefits.education.title")}
                    </strong>
                    <span className="text-sl-secondary text-sm/6">
                      {t("benefits.education.description")}
                    </span>
                  </div>
                </li>
              </ul>
              <p id="test3" className="mt-10 text-lg text-sl-secondary">
                {t("conclusion")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
