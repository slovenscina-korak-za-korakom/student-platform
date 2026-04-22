import People from "@/components/about/people";
import Carousel from "@/components/content/testimonials";
import Stats from "@/components/content/stats";
import SectionTitle from "@/components/content/titles/section-title";
import { Button } from "@/components/ui/button";

import { people, reviews } from "@/lib/docs";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import {Metadata} from "next";
import { getAlternates } from "@/lib/seo";

export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.about" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: getAlternates("/about-us", locale),
  };
}

export default function MeetTheTeamPage() {
  const t = useTranslations("about");
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 gradient-primary-subtle-reversed opacity-60 dark:opacity-40" />
      <div className="py-32 md:py-48 lg:pt-20 lg:pb-20 px-5 lg:px-20">
        <div className="flex flex-col text-center lg:text-start lg:flex-row mx-auto w-full justify-center items-center gap-8 lg:gap-12 max-w-7xl">
          <div className="max-w-2xl mb-10 lg:mb-0">
            <h1 className="text-balance text-5xl font-bold tracking-tighter text-sl-primary sm:text-6xl lg:text-7xl">
              {t("hero.title")}
            </h1>
            <h2 className="mt-6 text-pretty text-lg font-medium tracking-tight text-sl-secondary sm:text-xl/8 lg:text-2xl">
              {t("hero.subtitle")}
            </h2>
            <div className="mt-8 text-sl-secondary text-base/7 space-y-4">
              <p>{t("hero.text1")}</p>
            </div>
          </div>
          <div className="">
            <div className="hidden lg:grid grid-cols-3 grid-rows-4 gap-y-4 gap-x-5">
              <div className="h-24 w-10 col-span-1 row-span-1 bg-transparent"></div>
              <div className="h-24 w-10 col-span-1 row-span-1 bg-transparent"></div>
              <div className="h-80 w-56 col-span-1 row-span-3 rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50 hover:shadow-2xl transition-shadow duration-300">
                <a href="#">
                  <Image
                    width={224}
                    height={320}
                    className="w-full h-full object-cover"
                    src="https://images.pexels.com/photos/2472854/pexels-photo-2472854.jpeg?"
                    alt="Slovene Beach"
                  />
                </a>
              </div>
              <div className="h-24 w-10 col-span-1 row-span-1 bg-transparent"></div>
              <div className="h-24 w-10 col-span-1 row-span-1 bg-transparent"></div>
              <div className="h-24 w-10 col-span-1 row-span-1 bg-transparent"></div>
              <div className="h-80 w-56 col-span-1 row-span-3 rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50 hover:shadow-2xl transition-shadow duration-300">
                <a href="#">
                  <Image
                    width={224}
                    height={320}
                    className="w-full h-full object-cover"
                    src="https://images.pexels.com/photos/3312569/pexels-photo-3312569.jpeg?"
                    alt="Slovene Mountains"
                  />
                </a>
              </div>
              <div className="h-24 w-10 col-span-1 row-span-1 bg-transparent"></div>
              <div className="h-80 w-56 col-span-1 row-span-3 rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50 hover:shadow-2xl transition-shadow duration-300">
                <a href="#">
                  <Image
                    width={224}
                    height={320}
                    className="w-full h-full object-cover"
                    src="https://images.pexels.com/photos/3389508/pexels-photo-3389508.jpeg?"
                    alt="Snowy Slovene Mountains"
                  />
                </a>
              </div>
              <div className="h-80 w-56 col-span-1 row-span-3 rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50 hover:shadow-2xl transition-shadow duration-300">
                <a href="#">
                  <Image
                    width={224}
                    height={320}
                    className="w-full h-full object-cover"
                    src="https://images.pexels.com/photos/3214968/pexels-photo-3214968.jpeg?"
                    alt="Island Bled Slovenia"
                  />
                </a>
              </div>
              <div className="h-80 w-56 col-span-1 row-span-3 rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50 hover:shadow-2xl transition-shadow duration-300">
                <Image
                  width={224}
                  height={320}
                  className="w-full h-full object-cover"
                  src="https://images.pexels.com/photos/30206761/pexels-photo-30206761/free-photo-of-bled-castle-on-cliff-in-autumn-slovenia.jpeg?"
                  alt="Bled Castle On Cliff In Autumn, Slovenia"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl lg:px-8">
        <SectionTitle
          header={t("mission.subtitle")}
          paragraph={t("mission.title")}
          textOrientation="text-start"
        >
          <div className="text-start text-pretty text-lg/7 space-y-6 text-sl-secondary">
            <p>{t("mission.text1")}</p>
            <p>{t("mission.text2")}</p>
            <p>{t("mission.text3")}</p>
            <p>{t("mission.text4")}</p>
            <p>{t("mission.text5")}</p>
            <p>{t("mission.text6")}</p>
            <p>{t("mission.text7")}</p>
            <p>{t("mission.text8")}</p>
            <p>{t("mission.text9")}</p>
          </div>
        </SectionTitle>
        <div className="mx-auto mt-20 lg:mt-40">
          {/* <img className="aspect-video object-cover rounded-none lg:rounded-3xl" src="https://images.pexels.com/photos/25053927/pexels-photo-25053927/free-photo-of-a-river-runs-through-a-city-with-buildings-on-both-sides.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Transition photo" /> */}
          <div className="relative">
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-2xl opacity-20" />
            <Image
              width={1200}
              height={800}
              className="relative object-cover rounded-none lg:rounded-3xl shadow-2xl ring-1 ring-border/50"
              src="https://images.pexels.com/photos/7919/pexels-photo.jpg"
              alt="Transition photo"
            />
          </div>
          <Button
            variant={"link"}
            asChild
            className="text-xs/3 flex items-center justify-end text-gray-600"
          >
            <a
              target="_blank"
              href="https://www.pexels.com/photo/aerial-photography-of-cloudy-mountain-7919/"
            >
              Bled Slovenia: Pixels.com
            </a>
          </Button>
        </div>
        <SectionTitle
          header={t("built.subtitle")}
          paragraph={t("built.title")}
          textOrientation="text-start"
        >
          <div className="flex w-full gap-10 flex-row justify-between">
            <div className="text-start text-pretty text-lg/7 space-y-6 text-sl-secondary">
              <p>{t("built.text1")}</p>
              <p>{t("built.text2")}</p>
              <p>{t("built.text3")}</p>
              <p>{t("built.text4")}</p>
              <p>{t("built.text5")}</p>
              <p>{t("built.text6")}</p>
              <p>{t("built.text7")}</p>
              <p>{t("built.text8")}</p>
              <p>{t("built.text9")}</p>
              <p>{t("built.text10")}</p>
              <p>{t("built.text11")}</p>
            </div>
            <div className="hidden lg:block w-full">
              <Stats vertical size={{ text: "text-3xl", space: "px-6 py-4" }} />
            </div>
          </div>
        </SectionTitle>
        <SectionTitle
          paragraph={t("team.title")}
          header={t("team.subtitle")}
          textOrientation="text-center"
        >
          <div className="flex items-center justify-center">
            <div className="max-w-5xl text-center space-y-4">
              <p className="text-lg">{t("team.text1")}</p>
            </div>
          </div>
        </SectionTitle>
        <div className="w-full mt-10">
          <People people={people} />
        </div>
        <SectionTitle
          header={t("testimonials.subtitle")}
          paragraph={t("testimonials.title")}
          textOrientation="text-center lg:text-start"
        />
        <div className="w-full flex justify-center items-center mb-20">
          <div className="max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-5xl">
            <Carousel data={reviews} />
          </div>
        </div>
      </div>
    </section>
  );
}
