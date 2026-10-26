import DetailsPageHero from "@/components/content/details-page";
import Carousel from "@/components/content/testimonials";
import Hero from "@/components/content/hero-section";
import Stats from "@/components/content/stats";
import { getTranslations } from "next-intl/server";
import { reviews, siteNumbers } from "@/lib/docs";
import SectionTitle from "@/components/content/titles/section-title";
import BentoGridWrapper from "@/components/content/bento-grid-wrapper";
import {Metadata} from "next";
import { getAlternates } from "@/lib/seo";

export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  return {
    title: t("title"),
    description: t("description", { members: siteNumbers.members }),
    alternates: getAlternates("/", locale),
  };
}

export default function Home() {
  return (
    <>
      <div className="overflow-hidden">
        <Hero />
        <DetailsPageHero />
        <div className="relative isolate overflow-hidden flex py-24 sm:py-32 w-full items-center justify-center">
          <div className="absolute inset-0 -z-10 gradient-primary-subtle opacity-60 dark:opacity-40" />
          <SectionTitle
            translations={"root.features"}
            id="why-us"
            header={"title"}
            paragraph={"subtitle"}
          >
            <BentoGridWrapper />
          </SectionTitle>
        </div>
        <div className="relative isolate overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 gradient-primary-subtle-reversed opacity-60 dark:opacity-40" />
          <SectionTitle
            translations={"root.stats"}
            id="statistics"
            header={"subtitle"}
            paragraph={"title"}
          >
            <div className="flex justify-center items-center">
              <Stats />
            </div>
          </SectionTitle>
        </div>
        <div className="relative isolate overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 gradient-primary-subtle opacity-60 dark:opacity-40" />
          <SectionTitle
            translations={"root.testimonials"}
            id="testimonials"
            header={"subtitle"}
            paragraph={"title"}
          />
          <div className="w-full flex justify-center items-center">
            <div className="max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-5xl">
              <Carousel data={reviews} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
