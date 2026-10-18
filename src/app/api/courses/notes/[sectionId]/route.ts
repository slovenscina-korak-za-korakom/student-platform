import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  mockAnswersSource,
  mockNotesSource,
} from "@/app/[locale]/(protected)/courses/[courseId]/_components/mock";

/**
 * Auth-gated stream for a module's PDFs (lecture notes or the written answers).
 *
 * The client requests /api/courses/notes/<sectionId>?kind=<notes|answers> and
 * never sees the real file location — we verify the Clerk session, resolve the
 * (access-controlled) source server-side, and pipe the bytes through with
 * inline, no-store headers. No Content-Disposition: attachment, so browsers
 * won't offer a "Save as".
 */

type NotesKind = "notes" | "answers";

// TODO: resolve the real per-section source (DB lookup + signed/short-lived URL).
async function resolveNotesSource(
  sectionId: string,
  kind: NotesKind
): Promise<string | null> {
  void sectionId; // placeholder — every module uses the mock sources for now
  return kind === "answers" ? mockAnswersSource : mockNotesSource;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId } = await params;
  const kind: NotesKind =
    request.nextUrl.searchParams.get("kind") === "answers" ? "answers" : "notes";
  const source = await resolveNotesSource(sectionId, kind);
  if (!source) {
    return NextResponse.json({ error: "Notes not found" }, { status: 404 });
  }

  try {
    const upstream = await fetch(source, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Notes not found" }, { status: 404 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to stream lecture notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
