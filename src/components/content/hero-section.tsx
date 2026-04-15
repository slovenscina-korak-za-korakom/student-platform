"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap/all";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "../ui/button";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const t = useTranslations("root.hero");
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonRef = useRef(null);
  const chars = useRef([]);

  useGSAP(() => {
    const tl = gsap.timeline();
    const title = titleRef.current;

    const fullText = `${t("title.part1")} ${t("title.strong")} ${t(
      "title.part2",
    )}`;
    const strongWord = t("title.strong").trim();
    title.innerHTML = "";

    const container = document.createElement("div");
    container.className = "justify-center sm:justify-start";
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "0.25em";

    // Filter out empty strings and trim whitespace
    const words = fullText.split(" ").filter((word) => word.trim().length > 0);

    words.forEach((word) => {
      const wordContainer = document.createElement("div");
      wordContainer.style.display = "inline-flex";

      // Single color comparison
      if (word.trim() === strongWord) {
        wordContainer.className = "text-sl-accent";
      }

      word.split("").forEach((char) => {
        const span = document.createElement("span");
        span.textContent = char;
        span.style.display = "inline-block";
        wordContainer.appendChild(span);
        chars.current.push(span);
      });

      container.appendChild(wordContainer);
    });

    title.appendChild(container);

    // Animations remain the same
    tl.from(chars.current, {
      duration: 0.8,
      y: 100,
      rotationX: -90,
      stagger: 0.02,
      opacity: 0,
      ease: "back.out(1.7)",
    })
      .from(
        subtitleRef.current,
        {
          y: 20,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.5",
      )
      .from(
        buttonRef.current,
        {
          scale: 0.8,
          opacity: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        "-=0.5",
      );
  });

  return (
    <>
      <div className="relative isolate overflow-visible py-24 min-h-screen">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 gradient-primary-subtle opacity-60 dark:opacity-40" />
        <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        <div className="flex sm:hidden absolute h-screen w-full flex-col-reverse">
          <div>
            <Image
              width={1080}
              height={1080}
              className="aspect-[9/16] w-full h-[70vh] object-cover sm:rounded-full"
              src="/herro-picture.png"
              alt=""
              loading="eager"
            />
          </div>
        </div>

        <div className="flex justify-center items-center">
          <div className="relative h-screen sm:h-fit flex flex-row-reverse mx-8 gap-x-8 lg:gap-x-24 lg:max-w-7xl">
            <div className="hidden sm:block relative aspect-square sm:h-56 sm:mt-60 md:h-64 lg:h-[32rem] lg:mt-40">
              <div className="absolute inset-0 gradient-primary rounded-3xl blur-2xl opacity-30 animate-pulse" />
              <Image
                height={400}
                width={400}
                className="relative aspect-square w-auto sm:h-56 md:h-64 lg:h-[32rem] object-cover rounded-3xl bg-gradient-primary-subtle shadow-2xl ring-1 ring-border/50"
                src="/herro-picture.png"
                alt=""
                loading="eager"
              />
            </div>
            <div className="w-full py-[calc(100vh-90vh)] sm:py-32 lg:py-40">
              <div className="mb-8 flex justify-center sm:justify-start">
                <div className="hidden">
                  {t("announcement")}{" "}
                  <Link href={"#"} className="font-semibold">
                    <span aria-hidden="true" className="absolute inset-0" />
                    {t.has("announcement-link") && t("announcement-link")}{" "}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
              <div className="text-center sm:text-start">
                <h1
                  ref={titleRef}
                  className="text-balance text-5xl font-bold tracking-[-0.06em] text-sl-primary md:text-6xl lg:text-7xl"
                >
                  <div>
                    {t("title.part1")}{" "}
                    <strong className="gradient-text">
                      {t("title.strong")}
                    </strong>
                    {t("title.part2")}
                  </div>
                </h1>
                <p
                  ref={subtitleRef}
                  className="mt-6 text-pretty text-lg font-medium tracking-tight text-sl-secondary sm:text-xl lg:text-2xl max-w-2xl mx-auto sm:mx-0"
                >
                  {t("subtitle")}
                </p>
                <div
                  ref={buttonRef}
                  className="mt-10 flex items-center justify-center sm:justify-start gap-x-4"
                >
                  <Button variant={"mine"} asChild>
                    <a href={"/dashboard"}>
                      <span className="relative z-10">{t("cta.primary")}</span>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
