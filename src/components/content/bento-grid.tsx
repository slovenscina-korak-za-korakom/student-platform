/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Lottie from "lottie-react";
import teacherAnimation from "@/animations/teacher-animation.json";
import personalizedLearningAnimation from "@/animations/personalized-learning.json";
import videoCallAnimation from "@/animations/video-call.json";
import {useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {useGSAP} from "@gsap/react";
import gsap, {ScrollTrigger} from "gsap/all";
import Image from "next/image";
import {IconLogo} from "../icons/icon-logo";
import {useTheme} from "next-themes";

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export default function BentoGrid() {
  const teacherA = useRef<any>(null);
  const personalizedA = useRef<any>(null);
  const videoCallA = useRef<any>(null);
  const {theme} = useTheme()
  const [phoneView, setPhoneView] = useState<"ig" | "tel">("tel")

  useGSAP(() => {
    gsap.from("#card1", {
      opacity: 0,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#card1-start",
        start: "bottom bottom",
        end: "top 50%",
        scrub: true,
      },
    });
    gsap.from("#card2", {
      opacity: 0,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#card2-start",
        start: "bottom bottom",
        end: "top 50%",
        scrub: true,
      },
    });
    gsap.from("#card3", {
      opacity: 0,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#card3-start",
        start: "bottom bottom",
        end: "top 50%",
        scrub: true,
      },
    });
    gsap.from("#card4", {
      opacity: 0,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#card4-start",
        start: "bottom bottom",
        end: "top 50%",
        scrub: true,
      },
    });
  });

  const t = useTranslations("root.features.cards");

  // 3D Card Effect Hook
  const use3DCard = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const shineRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
      const root = rootRef.current;
      const card = cardRef.current;
      const shine = shineRef.current;

      if (!root || !card || !shine) return;

      gsap.set(card, {
        transformStyle: "preserve-3d",
        transformPerspective: 900,
      });

      const setRX = gsap.quickSetter(card, "rotationX", "deg");
      const setRY = gsap.quickSetter(card, "rotationY", "deg");
      const setShineOpacity = gsap.quickSetter(shine, "opacity");

      const setShineBg = (x: number, y: number) => {
        shine.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(255,255,255,0.25), rgba(255,255,255,0.0) 40%)`;
      };

      let raf = 0;
      let targetRX = 0,
        targetRY = 0;
      const maxRot = 1.5;

      const animate = () => {
        const currentRX = (gsap.getProperty(card, "rotationX") as number) || 0;
        const currentRY = (gsap.getProperty(card, "rotationY") as number) || 0;
        const nextRX = currentRX + (targetRX - currentRX) * 0.12;
        const nextRY = currentRY + (targetRY - currentRY) * 0.12;
        setRX(nextRX);
        setRY(nextRY);
        raf = requestAnimationFrame(animate);
      };

      const onEnter = () => {
        cancelAnimationFrame(raf);
        setShineOpacity(1);
        raf = requestAnimationFrame(animate);
      };

      const onMove = (e: MouseEvent) => {
        const rect = root.getBoundingClientRect();
        const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const py = clamp((e.clientY - rect.top) / rect.height, 0, 1);
        targetRY = gsap.utils.mapRange(0, 1, -maxRot, maxRot)(px);
        targetRX = gsap.utils.mapRange(0, 1, maxRot, -maxRot)(py);
        setShineBg(e.clientX - rect.left, e.clientY - rect.top);
      };

      const onLeave = () => {
        targetRX = 0;
        targetRY = 0;
        setShineOpacity(0);
        cancelAnimationFrame(raf);
        gsap.to(card, {
          rotationX: 0,
          rotationY: 0,
          duration: 0.6,
          ease: "power3.out",
        });
      };

      root.addEventListener("mouseenter", onEnter);
      root.addEventListener("mousemove", onMove);
      root.addEventListener("mouseleave", onLeave);

      return () => {
        root.removeEventListener("mouseenter", onEnter);
        root.removeEventListener("mousemove", onMove);
        root.removeEventListener("mouseleave", onLeave);
        cancelAnimationFrame(raf);
      };
    }, []);

    return {rootRef, cardRef, shineRef};
  };

  const card1Refs = use3DCard();
  const card2Refs = use3DCard();
  const card3Refs = use3DCard();
  const card4Refs = use3DCard();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (phoneView === "tel") setPhoneView("ig" as "ig" | "tel");
      else setPhoneView("tel" as "ig" | "tel");
    }, 5000)

    return () => {
      clearTimeout(timeout);
    }

  }, [phoneView])

  return (
    <>
      <div className="mt-10 flex flex-col lg:grid gap-8 sm:mt-16 lg:grid-cols-10 lg:grid-rows-5">
        <div
          id="card1"
          ref={card1Refs.rootRef}
          className="relative group lg:col-span-6 lg:row-span-3 [perspective:1000px]"
        >
          <div
            ref={card1Refs.cardRef}
            className="relative h-full px-8 py-8 gap-8 flex flex-col justify-around items-center rounded-3xl will-change-transform transition-[box-shadow] duration-300 shadow-2xl hover:shadow-[0_25px_50px_-12px] hover:shadow-indigo-300/50 bg-gradient-primary border border-border/50 dark:border-border/30 backdrop-blur-xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-transparent"/>
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-indigo-500 dark:ring-indigo-300"/>
            <div
              ref={card1Refs.shineRef}
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 mix-blend-screen"
            />
            <div className="relative z-10 w-full flex flex-col lg:flex-row items-center">
              <div>
                <h2
                  id="card2-start"
                  className="mt-2 text-lg font-semibold tracking-tight text-sl-primary dark:text-white max-lg:text-center"
                >
                  {t("online-lessons.title")}
                </h2>
                <p className="mt-2 max-w-lg text-sm/6 text-sl-secondary dark:text-white/90 max-lg:text-center">
                  {t("online-lessons.description")}
                </p>
              </div>
              <Lottie
                className="hidden lg:flex"
                lottieRef={videoCallA}
                animationData={videoCallAnimation}
                loop={false}
              />
            </div>
            <div
              id="card1-start"
              className="relative z-10 flex flex-col lg:flex-row items-center gap-5"
            >
              <Lottie lottieRef={teacherA} animationData={teacherAnimation}/>
              <div>
                <h2
                  className="mt-2 text-lg font-semibold tracking-tight text-sl-primary dark:text-white max-lg:text-center">
                  {t("trial-lesson.title")}
                </h2>
                <p className="mt-2 max-w-lg text-sm/6 text-sl-secondary dark:text-white/90 max-lg:text-center">
                  {t("trial-lesson.description")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          id="card2"
          ref={card2Refs.rootRef}
          className="relative group lg:col-span-4 lg:row-span-3 [perspective:1000px]"
        >
          <div
            ref={card2Refs.cardRef}
            className="relative h-full px-8 py-8 flex flex-col justify-center items-center rounded-3xl will-change-transform transition-[box-shadow] duration-300 shadow-2xl hover:shadow-[0_25px_50px_-12px] hover:shadow-sl-purple/50 bg-gradient-primary-subtle border border-border/50 dark:border-border/30 backdrop-blur-xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-transparent"/>
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-indigo-500 dark:ring-indigo-300"/>
            <div
              ref={card2Refs.shineRef}
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 mix-blend-screen"
            />
            <div className="relative z-10 w-full">
              <h2
                className="mt-2 text-lg font-semibold tracking-tight text-sl-primary dark:text-white max-lg:text-center">
                {t("community.title")}
              </h2>
              <p className="mt-2 max-w-lg text-sm/6 text-sl-secondary dark:text-white/90 max-lg:text-center">
                {t("community.description", {members: 1800})}
              </p>
              <div
                className="relative min-h-[20rem] w-full grow mt-6 [container-type:inline-size] max-lg:mx-auto max-lg:max-w-sm">
                <div className="absolute inset-x-1 sm:inset-x-4 md:inset-x-8">
                  <Image
                    width={720}
                    height={1280}
                    className="size-full object-cover bg-transparent object-top transition-opacity duration-700 ease-in-out"
                    style={{opacity: phoneView === "tel" ? 1 : 0}}
                    src={theme === "light" ? "/telegram-mockup-light.png" : "/telegram-mockup-dark.png"}
                    alt="phone demo"
                  />
                  <Image
                    width={720}
                    height={1280}
                    className="absolute inset-0 size-full object-cover bg-transparent object-top transition-opacity duration-700 ease-in-out"
                    style={{opacity: phoneView === "ig" ? 1 : 0}}
                    src={theme === "light" ? "/instagram-mockup-light.png" : "/instagram-mockup-dark.png"}
                    alt="phone demo"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          id="card3"
          ref={card3Refs.rootRef}
          className="relative group lg:col-span-4 lg:row-span-2 [perspective:1000px]"
        >
          <div
            ref={card3Refs.cardRef}
            className="relative h-full px-8 py-8 flex flex-col justify-center items-center rounded-3xl will-change-transform transition-[box-shadow] duration-300 shadow-2xl hover:shadow-[0_25px_50px_-12px] hover:shadow-sl-pink/50 bg-gradient-primary border border-border/50 dark:border-border/30 backdrop-blur-xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-transparent"/>
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-indigo-500 dark:ring-indigo-300"/>
            <div
              ref={card3Refs.shineRef}
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 mix-blend-screen"
            />
            <div className="relative z-10 text-center">
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-sl-primary dark:text-white">
                {t("support.title")}
              </h2>
              <p className="mt-2 max-w-lg text-sm/6 text-sl-secondary dark:text-white/90 mx-auto">
                {t("support.description")}
              </p>
            </div>
          </div>
        </div>

        {/* <div className="hidden lg:gap-3 lg:px-8 lg:py-8 lg:col-span-2 lg:row-span-1 lg:flex flex-col justify-center items-center shadow-lg dark:border-[1px] dark:border-gray-700 border rounded-3xl"> */}
        <div className="hidden">
          <IconLogo className="size-10"/>
          <h1 className="uppercase text-center text-[0.590rem] text-sl-accent font-bold">
            Slovenščina Korak za Korkom
          </h1>
        </div>

        <div
          id="card4"
          ref={card4Refs.rootRef}
          className="relative group lg:col-span-6 lg:row-span-2 [perspective:1000px]"
        >
          <div
            ref={card4Refs.cardRef}
            className="relative h-full px-8 py-8 flex flex-col lg:flex-row justify-center items-center rounded-3xl will-change-transform transition-[box-shadow] duration-300 shadow-2xl hover:shadow-[0_25px_50px_-12px] hover:shadow-sl-accent/50 bg-gradient-primary-subtle border border-border/50 dark:border-border/30 backdrop-blur-xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-transparent"/>
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-indigo-500 dark:ring-indigo-300"/>
            <div
              ref={card4Refs.shineRef}
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 mix-blend-screen"
            />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-8 w-full">
              <div>
                <h2
                  className="mt-2 text-lg font-semibold tracking-tight text-sl-primary dark:text-white max-lg:text-center">
                  {t("personalized.title")}
                </h2>
                <p
                  id="card3-start"
                  className="mt-2 max-w-lg text-sm/6 text-sl-secondary dark:text-white/90 max-lg:text-center"
                >
                  {t("personalized.description")}
                </p>
              </div>
              <Lottie
                className="size-7/12 lg:size-auto"
                lottieRef={personalizedA}
                animationData={personalizedLearningAnimation}
                onComplete={() => {
                  personalizedA.current.playSegments([25, 75], false);
                }}
                loop={false}
              />
            </div>
          </div>
        </div>
      </div>
      <div id="card4-start"></div>
    </>
  );
}
