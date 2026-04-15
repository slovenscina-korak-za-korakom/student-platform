"use client";
import { useGSAP } from "@gsap/react";
import {
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
} from "@heroicons/react/20/solid";
import gsap, { ScrollTrigger } from "gsap/all";
import { useTranslations } from "next-intl";
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
      <div className="absolute inset-0 -z-10 gradient-primary-subtle-reversed opacity-60 dark:opacity-40" />
      <div className="mx-auto sm:mx-8 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-auto lg:max-w-7xl lg:grid-cols-2 lg:items-start lg:gap-y-10">
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-12 lg:px-8">
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
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-2xl opacity-20" />
            <Image
              width={1280}
              height={720}
              alt="Details picture"
              src="/details-picture.png"
              className="relative w-full aspect-[16/11] object-cover max-w-none rounded-3xl shadow-2xl ring-1 ring-border/50 sm:w-[57rem]"
            />
          </div>
        </div>
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-12 lg:px-8">
          <div className="lg:pr-4 lg:block sm:flex sm:justify-center">
            <div className="max-w-xl text-base/7 text-primary lg:max-w-lg">
              <ul role="list" className="space-y-6">
                <li
                  id="point1"
                  className="group relative flex gap-x-4 p-5 rounded-2xl bg-gradient-primary-subtle border border-border/50 hover:border-sl-accent/30 transition-all duration-300"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-foreground bg-background shadow-lg">
                      <RocketLaunchIcon aria-hidden="true" className="size-5" />
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-foreground bg-background shadow-lg">
                      <ChatBubbleLeftRightIcon
                        aria-hidden="true"
                        className="size-5"
                      />
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-foreground bg-background shadow-lg">
                      <BookOpenIcon aria-hidden="true" className="size-5" />
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
