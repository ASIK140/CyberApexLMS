'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/VideoPlayer';
import { apiFetch } from '@/utils/api';
import { useAuthStore } from '@/stores/auth.store';

interface Block {
  id: string;
  type: string;
  title: string;
  content_json: Record<string, any>;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf_notes' | 'quiz' | 'assessment';
  videoUrl: string | null;
  notesUrl: string | null;
  duration: string | null;
  blocks: Block[];
  isMandatory: boolean;
  quiz: { id: string; title: string; pass_mark?: number; questions?: any[] } | null;
  progress: { status: string; videoPosition?: number } | null;
}

interface Module {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  progressPercent: number;
  status: string;
  modules: Module[];
}

function ContentBlock({ block }: { block: Block }) {
  const t = (block.type ?? '').toLowerCase();
  const text = block.content_json?.text ?? '';

  if (t === 'key_tip' || t === 'tip') {
    return (
      <div className="relative pl-4 border-l-2 border-cyan-500 bg-cyan-50 p-4 rounded-r-lg">
        <p className="font-bold text-cyan-600 mb-1.5 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {block.title || 'Key Tip'}
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
      </div>
    );
  }

  if (t === 'warning' || t === 'security_warning') {
    return (
      <div className="relative pl-4 border-l-2 border-red-500 bg-red-50 p-4 rounded-r-lg">
        <p className="font-bold text-red-600 mb-1.5 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {block.title || 'Security Warning'}
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
      </div>
    );
  }

  if (t === 'case_study' || t === 'real_world') {
    return (
      <div className="relative pl-4 border-l-2 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
        <p className="font-bold text-amber-600 mb-1.5 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {block.title || 'Real World Case Study'}
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
      </div>
    );
  }

  if (t === 'important') {
    return (
      <div className="relative pl-4 border-l-2 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
        <p className="font-bold text-orange-600 mb-1.5 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {block.title || 'Important'}
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
      </div>
    );
  }

  // Default: notes / text block
  if (!text) return null;
  return (
    <div>
      {block.title && <h4 className="font-semibold text-slate-800 mb-1 text-sm">{block.title}</h4>}
      <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

export default function StudentCoursePlayerPage() {
  const params   = useParams();
  const courseId = params.courseId as string;
  const router   = useRouter();

  const [course,          setCourse]          = useState<CourseData | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [activeLesson,    setActiveLesson]    = useState<Lesson | null>(null);
  const [completedIds,    setCompletedIds]    = useState<Set<string>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);

  const authCheckedRef = useRef(false);

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      router.push('/login');
    } else {
      authCheckedRef.current = true;
    }
  }, [router]);

  const fetchCourse = useCallback(async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      // Use legacy student API only — v1 endpoints require RS256 tokens
      const res        = await apiFetch(`/student/courses/${courseId}`);
      const legacyJson = await res.json();

      if (legacyJson.success || legacyJson.data) {
        const data = legacyJson.data ?? legacyJson;

        const modules: Module[] = (data.curriculum ?? data.modules ?? []).map((m: any) => ({
          id:         m.id ?? String(Math.random()),
          title:      m.title ?? 'Module',
          orderIndex: m.order ?? m.order_index ?? m.orderIndex ?? 0,
          lessons:    (m.lessons ?? []).map((l: any) => {
            const allBlocks: Block[]  = l.blocks ?? [];
            const videoBlock          = allBlocks.find((b) => b.type === 'video');
            const contentBlocks       = allBlocks.filter((b) => b.type !== 'video');

            return {
              id:          l.id ?? String(Math.random()),
              title:       l.title ?? 'Lesson',
              type:        l.type ?? (videoBlock ? 'video' : 'pdf_notes'),
              videoUrl:    l.videoUrl ?? l.video_url ?? videoBlock?.content_json?.url ?? null,
              notesUrl:    l.notesUrl ?? l.notes_url ?? null,
              duration:    videoBlock?.content_json?.duration ?? null,
              blocks:      contentBlocks,
              isMandatory: l.isMandatory ?? l.is_mandatory ?? true,
              quiz:        l.quiz ?? (l.quizzes?.length > 0 ? l.quizzes[0] : null),
              progress:    l.progress ?? null,
            };
          }),
        }));

        const done = new Set<string>();
        modules.forEach((m) => m.lessons.forEach((l) => {
          if (l.progress?.status === 'completed') done.add(l.id);
        }));
        setCompletedIds(done);

        setCourse({
          id:              courseId,
          title:           data.title ?? data.course_title ?? 'Course',
          progressPercent: data.progress ?? 0,
          status:          data.status ?? 'in_progress',
          modules,
        });

        if (modules[0]?.lessons[0]) setActiveLesson(modules[0].lessons[0]);
      }
    } catch (err) {
      console.error('Failed to load course', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const allLessons      = course?.modules.flatMap((m) => m.lessons) ?? [];
  const totalLessons    = allLessons.length;
  const progressPercent = totalLessons > 0
    ? Math.round((completedIds.size / totalLessons) * 100)
    : course?.progressPercent ?? 0;

  // A lesson is accessible if every preceding mandatory lesson is completed
  const isAccessible = useCallback((globalIdx: number): boolean => {
    for (let i = 0; i < globalIdx; i++) {
      if (allLessons[i].isMandatory && !completedIds.has(allLessons[i].id)) return false;
    }
    return true;
  }, [allLessons, completedIds]);

  const activeLessonIndex = activeLesson
    ? allLessons.findIndex((l) => l.id === activeLesson.id)
    : -1;

  const handleLessonComplete = useCallback(async () => {
    if (!activeLesson || !course || markingComplete) return;
    setMarkingComplete(true);

    const newCompleted = new Set([...completedIds, activeLesson.id]);
    setCompletedIds(newCompleted);

    const pct = Math.round((newCompleted.size / totalLessons) * 100);
    try {
      await apiFetch('/student/progress', {
        method: 'PATCH',
        body:   JSON.stringify({ course_id: courseId, progress: pct }),
      });
    } catch { /* Non-fatal — progress already updated in UI */ }

    const idx = allLessons.findIndex((l) => l.id === activeLesson.id);
    if (idx >= 0 && idx < allLessons.length - 1) {
      setTimeout(() => { setActiveLesson(allLessons[idx + 1]); setMarkingComplete(false); }, 600);
    } else {
      setMarkingComplete(false);
    }
  }, [activeLesson, completedIds, course, courseId, totalLessons, allLessons, markingComplete]);

  const handleSelectLesson = (lesson: Lesson, accessible: boolean) => {
    if (!accessible) return;
    setActiveLesson(lesson);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-16 rounded-2xl bg-white border border-dashed border-slate-300 text-center">
        <p className="text-5xl mb-4">🚫</p>
        <h3 className="text-xl font-bold text-slate-700">Course Not Found</h3>
        <p className="text-slate-500 mt-2">This course does not exist or you do not have access to it.</p>
        <button onClick={() => router.push('/student/courses')} className="mt-6 px-6 py-2 bg-cyan-600 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  const isCompleted = completedIds.has(activeLesson?.id ?? '');
  const hasQuiz     = !!activeLesson?.quiz;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">

      {/* ── LEFT: Video + Notes ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button onClick={() => router.push('/student/courses')} className="hover:text-cyan-600 transition-colors font-medium">
            My Courses
          </button>
          <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-slate-700 truncate">{course.title}</span>
          {activeLesson && (
            <>
              <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-cyan-600 font-semibold truncate">{activeLesson.title}</span>
            </>
          )}
        </div>

        {/* ── Video Player ────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-lg relative group border border-slate-200">
          {activeLesson?.videoUrl ? (
            <VideoPlayer
              src={activeLesson.videoUrl}
              enrollmentId=""
              lessonId={activeLesson.id}
              onComplete={handleLessonComplete}
            />
          ) : (
            <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 to-blue-900/10" />
              {/* Center play button */}
              <div className="text-center z-10">
                <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(6,182,212,0.4)] cursor-pointer hover:scale-105 transition-transform">
                  <svg className="w-10 h-10 ml-1 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-white font-semibold text-lg tracking-wide">
                  {activeLesson?.title ?? 'Select a Lesson'}
                </p>
                {activeLesson?.duration && (
                  <p className="text-slate-400 text-sm mt-1">{activeLesson.duration} • Video Lesson</p>
                )}
              </div>
              {/* Hover video controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-slate-400 tabular-nums">00:00</span>
                  <div className="flex-1 h-1.5 bg-slate-600 rounded-full cursor-pointer relative">
                    <div className="h-full bg-cyan-500 rounded-full w-0" />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums">{activeLesson?.duration ?? '00:00'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-3">
                    <button className="hover:text-cyan-400 transition-colors p-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="hover:text-cyan-400 transition-colors p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 text-xs font-medium cursor-pointer">
                      <span className="text-slate-500">0.75x</span>
                      <span className="text-white">1x</span>
                      <span className="text-slate-500">1.5x</span>
                      <span className="text-slate-500">2x</span>
                    </div>
                    <button className="hover:text-cyan-400 transition-colors p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lesson navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => activeLessonIndex > 0 && setActiveLesson(allLessons[activeLessonIndex - 1])}
            disabled={activeLessonIndex <= 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeLessonIndex <= 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <span className="text-xs text-slate-400 font-medium tabular-nums">
            {activeLessonIndex + 1} / {totalLessons}
          </span>
          <button
            onClick={() => activeLessonIndex < totalLessons - 1 && setActiveLesson(allLessons[activeLessonIndex + 1])}
            disabled={activeLessonIndex >= totalLessons - 1}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeLessonIndex >= totalLessons - 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200'
            }`}
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ── Lesson Notes ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-5 border-b border-slate-200">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  activeLesson?.type === 'video'       ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  activeLesson?.type === 'quiz'        ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  activeLesson?.type === 'assessment'  ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                         'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {(activeLesson?.type ?? 'video').replace('_', ' ')}
                </span>
                {activeLesson?.isMandatory && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-200">
                    Mandatory
                  </span>
                )}
                {activeLesson?.duration && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activeLesson.duration}
                  </span>
                )}
                {isCompleted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Completed
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {activeLesson?.title ?? 'Select a Lesson'}
              </h3>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeLesson?.notesUrl && (
                <a
                  href={activeLesson.notesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Notes PDF
                </a>
              )}
              {hasQuiz && (
                <button
                  onClick={() => router.push(`/student/courses/${courseId}/quiz?lessonId=${activeLesson!.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg shadow-md shadow-cyan-500/20 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Take Quiz
                </button>
              )}
              {!hasQuiz && !isCompleted && (
                <button
                  onClick={handleLessonComplete}
                  disabled={markingComplete}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {markingComplete ? 'Saving…' : 'Mark Complete'}
                </button>
              )}
            </div>
          </div>

          {/* Content blocks */}
          <div className="space-y-5">
            {activeLesson?.blocks?.length ? (
              activeLesson.blocks.map((b) => <ContentBlock key={b.id} block={b} />)
            ) : (
              <p className="text-slate-500 text-sm">
                {activeLesson
                  ? 'No additional notes for this lesson. Watch the video to complete it.'
                  : 'Select a lesson from the curriculum to view its content.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Progress + Curriculum ─────────────────────────────────── */}
      <div className="lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-5">

        {/* Progress card */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Course Progress</h3>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-700">
              {completedIds.size} / {totalLessons} lessons complete
            </span>
            <span className="text-sm font-bold text-cyan-600">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressPercent >= 100 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="text-green-700 text-sm font-semibold">Course Completed!</p>
            </div>
          )}
        </div>

        {/* Curriculum card */}
        <div
          className="rounded-2xl bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 340px)' }}
        >
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Curriculum</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{course.title}</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {course.modules.map((mod, mIdx) => {
              const flatOffset = course.modules
                .slice(0, mIdx)
                .reduce((acc, m) => acc + m.lessons.length, 0);

              return (
                <div key={mod.id}>
                  {/* Module header */}
                  <div className="px-4 py-2.5 bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Module {mIdx + 1}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 truncate">{mod.title}</p>
                  </div>

                  {mod.lessons.map((lesson, lIdx) => {
                    const globalIdx   = flatOffset + lIdx;
                    const isActive    = activeLesson?.id === lesson.id;
                    const isDone      = completedIds.has(lesson.id);
                    const accessible  = isAccessible(globalIdx);

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => handleSelectLesson(lesson, accessible)}
                        className={`flex items-start gap-3 p-4 border-l-2 transition-all ${
                          !accessible
                            ? 'opacity-40 cursor-not-allowed border-transparent'
                            : isActive
                              ? 'bg-cyan-50 border-cyan-500 cursor-pointer'
                              : isDone
                                ? 'bg-green-50/60 border-green-400 cursor-pointer hover:bg-green-50'
                                : 'border-transparent cursor-pointer hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {/* Status icon */}
                        <div className="mt-0.5 flex-shrink-0">
                          {!accessible ? (
                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          ) : isDone ? (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.35)]">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : isActive ? (
                            <div className="relative w-5 h-5">
                              <div className="absolute inset-0 bg-cyan-500 rounded-full opacity-30 animate-ping" />
                              <div className="relative w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                                <svg className="w-2.5 h-2.5 ml-0.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full" />
                            </div>
                          )}
                        </div>

                        {/* Lesson info */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${
                            isActive     ? 'text-cyan-700 font-semibold' :
                            !accessible  ? 'text-slate-400' :
                                           'text-slate-700'
                          }`}>
                            {lIdx + 1}. {lesson.title}
                          </p>
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                            isActive ? 'text-cyan-500 font-medium' : 'text-slate-400'
                          }`}>
                            {isActive ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block animate-pulse" />
                                Currently Viewing
                              </>
                            ) : (
                              <>
                                {lesson.duration && `${lesson.duration} • `}
                                {lesson.type === 'video'      ? 'Video' :
                                 lesson.type === 'pdf_notes'  ? 'Notes' :
                                 lesson.type === 'quiz'       ? 'Quiz'  : 'Lesson'}
                                {lesson.quiz ? ' · Has Quiz' : ''}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Bottom action panel */}
          <div className="border-t border-slate-200 bg-slate-50 p-4 flex-shrink-0">
            {hasQuiz ? (
              <>
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Chapter Quiz
                  </h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-600 font-medium">
                      {activeLesson!.quiz!.questions?.length ?? '?'} questions
                    </span>
                    <span className="text-xs font-bold text-cyan-600">
                      Pass: {activeLesson!.quiz!.pass_mark ?? 70}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/student/courses/${courseId}/quiz?lessonId=${activeLesson!.id}`)}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Take Chapter Quiz
                </button>
              </>
            ) : isCompleted ? (
              <div className="flex items-center justify-center gap-2 py-1">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold text-green-600">Lesson completed</p>
              </div>
            ) : (
              <button
                onClick={handleLessonComplete}
                disabled={markingComplete}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {markingComplete ? 'Saving…' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
