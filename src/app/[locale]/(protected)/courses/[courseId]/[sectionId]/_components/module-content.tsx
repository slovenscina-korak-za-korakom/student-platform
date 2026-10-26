import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconFileText,
  IconPlayerPlayFilled,
  IconSparkles,
} from "@tabler/icons-react"
import CompleteToggle from "./complete-toggle"
import VideoFrame from "./video-frame"
import SecureVideoPlayer from "./secure-video-player"
import { cn } from "@/lib/utils"
import type { ModuleContentVM, ModuleItemVM } from "@/actions/course-actions"

type Props = {
  module: ModuleContentVM
  locale: string
}

const ModuleContent = async ({ module: mod, locale }: Props) => {
  const t = await getTranslations("courses.test")
  const base = `/${locale}/courses/${mod.course.slug}/${mod.slug}`

  // Only when the module LEADS with a video: hoist it into a full-width hero
  // player (see skeleton in loading.tsx). Otherwise every item — videos
  // included — renders in the centered max-w-4xl column so they share one width.
  const first = mod.items[0]
  const heroVideo = first?.type === "video" && first.video ? first : undefined
  const restItems = heroVideo ? mod.items.slice(1) : mod.items

  return (
    <div className="flex flex-col pb-8 md:pb-10">
      {/* Back to course */}
      <div className="px-5 pt-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={`/${locale}/courses/${mod.course.slug}`}>
            <IconChevronLeft className="h-4 w-4" />
            {mod.course.title}
          </Link>
        </Button>
      </div>

      {/* Full-width hero video */}
      {heroVideo?.video && (
        <div className="p-5 pt-3">
          <ModuleVideo
            itemId={heroVideo.id}
            video={heroVideo.video}
            className="mx-auto w-full aspect-video max-h-[80vh]"
          />
          <div className="mx-auto w-full max-w-4xl flex justify-end pt-3">
            <CompleteToggle itemId={heroVideo.id} completed={heroVideo.completed} />
          </div>
        </div>
      )}

      {/* Everything else, single consistent width */}
      <div className="mx-auto w-full max-w-4xl px-5 md:px-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{mod.title}</h1>
          {mod.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
          )}
        </div>

        {/* Ordered content items */}
        {mod.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("items.empty")}</p>
        ) : restItems.length > 0 ? (
          <div className="space-y-4">
            {restItems.map((item) => (
              <ItemRow key={item.id} item={item} base={base} t={t} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** One content item, rendered by type. `t` is the `courses.test` translator. */
function ItemRow({
  item,
  base,
  t,
}: {
  item: ModuleItemVM
  base: string
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  // Test: a Duolingo-style launcher (completion happens by finishing the test).
  if (item.type === "test") {
    if (!item.test) return null
    return (
      <Link
        href={`${base}/test/${item.test.slug}`}
        className="group flex items-center gap-4 rounded-2xl border-2 border-sl-accent/20 bg-gradient-to-r from-sl-blue/5 via-sl-purple/5 to-sl-pink/5 p-4 shadow-[0_3px_0_0] shadow-sl-accent/20 transition-colors hover:border-sl-accent/40"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sl-blue to-sl-pink text-white">
          <IconSparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{item.test.title ?? item.title ?? t("launcher.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("launcher.count", { count: item.test.exerciseCount })}
          </p>
        </div>
        {item.completed ? (
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {t("items.completed")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-xl bg-sl-accent px-4 py-2 text-sm font-semibold text-white transition-transform group-hover:translate-x-0.5">
            {t("launcher.start")}
            <IconChevronRight className="h-4 w-4" />
          </span>
        )}
      </Link>
    )
  }

  // Non-test items: a card with type-specific body + a complete toggle.
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {item.type === "video" && <IconPlayerPlayFilled className="h-4 w-4" />}
          {item.type === "pdf" && <IconFileText className="h-4 w-4" />}
          {item.type === "link" && <IconExternalLink className="h-4 w-4" />}
          {item.type === "text" && <IconFileText className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">
            {item.title ?? t(`items.${item.type}`)}
          </h3>

          {item.type === "video" && item.video && (
            <ModuleVideo itemId={item.id} video={item.video} className="mt-3 aspect-video w-full" />
          )}

          {item.type === "text" && item.text && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {item.text.body}
            </p>
          )}

          {item.type === "link" && item.link && (
            <a
              href={item.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-sl-accent hover:underline"
            >
              {item.link.url}
              <IconExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {item.type === "pdf" && (
            // TODO: stream via the generalized secure/watermarked asset route
            // (see docs/future-asset-security.md); placeholder until then.
            <p className="mt-2 text-sm text-muted-foreground">{t("items.pdf")}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <CompleteToggle itemId={item.id} completed={item.completed} />
      </div>
    </div>
  )
}

/**
 * Picks the right player for a video item. `s3hls` (Rung-3 encrypted stream)
 * uses the gated SecureVideoPlayer; a `processing` asset shows a placeholder
 * until packaging finishes. Everything else (YouTube/public) keeps the
 * lightweight iframe VideoFrame.
 */
function ModuleVideo({
  itemId,
  video,
  className,
}: {
  itemId: number
  video: NonNullable<ModuleItemVM["video"]>
  className?: string
}) {
  if (video.provider === "s3hls") {
    if (video.status !== "ready") {
      return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />
    }
    return (
      <SecureVideoPlayer itemId={itemId} lastPositionSec={video.lastPositionSec} className={className} />
    )
  }
  return <VideoFrame url={video.url ?? ""} className={className} />
}

export default ModuleContent
