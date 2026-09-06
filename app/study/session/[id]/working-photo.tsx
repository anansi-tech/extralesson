'use client';

import { useRef, useState, useTransition } from 'react';
import { captureWorking, readWorking, type ReadResult } from './capture';
import type { CaptureResult } from './mark-working';
import { WorkingRead } from './working-read';
import { MAX_TAKES, type TranscriptionResult } from '@/lib/grade/transcribe';
import { LANDING } from '@/lib/landing-content';

/**
 * PHOTO FIRST (ROUND_4 Task 1): before submit the page is read and the boxes
 * are filled from the read, which the student checks and hands in; the read
 * becomes the answer only when they do. After submit the same control reads
 * and marks, for a student who typed instead. Scaled down on the device, to
 * spend less of a student's data.
 */
const LONG_EDGE = 1400;
const QUALITY = 0.75;

async function scaleDown(file: File): Promise<{ data: string; contentType: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL('image/jpeg', QUALITY);
  return { data: url.slice(url.indexOf(',') + 1), contentType: 'image/jpeg' };
}

type Marked = Pick<CaptureResult, 'method' | 'marksAdded'> & { transcriptionId?: string; rejected?: number[]; failed?: boolean };

export function WorkingPhoto({
  sessionId,
  questionIndex,
  attemptId,
  marks,
  initial,
  onRead,
  onBusy,
  onMarked,
  hideRows,
  className,
}: {
  sessionId: string;
  questionIndex: number;
  /** Set once the answers are in: reads are then marked as well as read. */
  attemptId?: string;
  /** Method marks still on offer; the post-submit copy names them. */
  marks?: number;
  /** A read already taken, so a reload or a submit does not lose it. */
  initial?: (ReadResult | CaptureResult) | null;
  /** The boxes to fill from a read; only ever called before submit. */
  onRead?: (prefill: Record<string, string>) => void;
  /** While a page is being read the answers cannot be handed in. */
  onBusy?: (busy: boolean) => void;
  /** After submit, the marking of a read: the card shows the rows beside the parts. */
  onMarked?: (result: CaptureResult) => void;
  /** Rows the card already shows under their parts, kept out of the read's own list. */
  hideRows?: Set<string>;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [read, setRead] = useState<TranscriptionResult | null>(initial?.transcription ?? null);
  const [readId, setReadId] = useState<string | null>(initial?.transcriptionId ?? null);
  const [takesLeft, setTakesLeft] = useState(initial?.takesLeft ?? MAX_TAKES);
  const [marked, setMarked] = useState<Marked>(
    initial && 'method' in initial
      ? { method: initial.method, marksAdded: initial.marksAdded, transcriptionId: initial.transcriptionId, rejected: initial.rejected, failed: !initial.marked }
      : { method: [], marksAdded: 0, rejected: initial && 'rejected' in initial ? (initial as { rejected?: number[] }).rejected : undefined },
  );
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  /** The page as photographed, kept while this page is open so the read can be checked against it. */
  const [thumb, setThumb] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const send = (file: File) => {
    setError(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setThumb((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
    onBusy?.(true);
    start(async () => {
      try {
        const image = await scaleDown(file);
        const res = attemptId
          ? await captureWorking({ attemptId, ...image })
          : await readWorking({ sessionId, questionIndex, ...image });
        if ('error' in res) {
          setError(res.error);
          return;
        }
        setRead(res.transcription);
        setReadId(res.transcriptionId);
        setTakesLeft(res.takesLeft);
        if ('method' in res) {
          setMarked({ method: res.method, marksAdded: res.marksAdded, transcriptionId: res.transcriptionId, rejected: res.rejected, failed: !res.marked });
          onMarked?.(res);
        }
        if ('prefill' in res) onRead?.(res.prefill);
      } catch {
        setError('That photo could not be prepared on this device.');
      } finally {
        setPreview(null);
        onBusy?.(false);
      }
    });
  };

  const pick = (className: string) => (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      disabled={pending}
      className={`${className} min-h-11 border-[1.5px] border-ink bg-white font-mono uppercase tracking-[0.1em] disabled:opacity-60`}
    >
      {pending ? 'Reading…' : read ? 'Take it again' : 'Photograph your working'}
    </button>
  );

  return (
    <CameraBox
      post={!!attemptId}
      className={className}
      heading={read ? undefined : 'Your working on paper'}
      intro={
        read
          ? undefined
          : attemptId
            ? `There ${marks === 1 ? 'is 1 mark' : `are ${marks} marks`} here for the method, and we cannot see your working. Photograph what you wrote and we will type it up beside the mark scheme. Nothing you have already earned can change.`
            : 'Work it on paper, then photograph the page. We type up what we read and fill in the single-answer boxes; you check them, fill in the rest, and hand in.'
      }
      preview={preview}
      pending={pending}
      pick={!read && takesLeft > 0 ? pick('mt-2.5 w-full p-3 text-xs') : undefined}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) send(file);
          e.target.value = '';
        }}
      />

      {error && (
        <p className="mt-2 border-l-3 border-red-pen bg-[#FDF1F0] p-2 text-[12px] leading-snug">
          {error}
        </p>
      )}

      {read && (
        <WorkingRead
          lines={read.lines}
          legible={read.legible}
          notes={read.notes}
          method={marked.method.filter((m) => !hideRows?.has(m.code))}
          rejected={marked.rejected}
          reject={!attemptId && readId ? { transcriptionId: readId } : undefined}
          dispute={
            attemptId && marked.transcriptionId
              ? { attemptId, transcriptionId: marked.transcriptionId, disputed: [] }
              : undefined
          }
          earnedLabel={
            marked.marksAdded > 0
              ? `Your working earned ${marked.marksAdded} more mark${marked.marksAdded === 1 ? '' : 's'}`
              : 'What your working earned'
          }
          footer={
            attemptId && marked.failed
              ? 'The read is kept. Only the marking has to run again.'
              : takesLeft > 0
                ? undefined
                : `No retakes left for this question. Check the answer boxes below. If we misread your working, tell us: ${LANDING.contactEmail}`
          }
        />
      )}

      {thumb && !pending && (
        <details className="mt-2">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-dim">Your photograph</summary>
          <img src={thumb} alt="The page you photographed" className="mt-1 max-h-64 border-[1.5px] border-ink object-contain" />
        </details>
      )}

      {/* The way to another take sits under what this one read, with the count beside it. */}
      {read && takesLeft > 0 && (
        <div className="mt-2.5 flex items-center gap-2.5">
          {pick('flex-1 p-2.5 text-[11px]')}
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
            {takesLeft} retake{takesLeft === 1 ? '' : 's'} left
          </span>
        </div>
      )}
    </CameraBox>
  );
}

/**
 * The box above the answer boxes: what to do, the page while it is read, and
 * the one control. Exported so the reading state can be rendered on its own.
 */
export function CameraBox({
  post,
  className,
  heading,
  intro,
  preview,
  pending,
  pick,
  children,
}: {
  /** After submit the box is a section under the marking, not the panel above the boxes. */
  post: boolean;
  className?: string;
  /** Once a page is read, what was read is the heading. */
  heading?: string;
  intro?: string;
  /** The page as chosen, shown small while it is read. */
  preview?: string | null;
  pending: boolean;
  pick?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      id="camera-box"
      className={`${post ? 'mt-5 border-t-[1.5px] border-rule pt-3.5 lg:mt-0 lg:border-l-3 lg:border-t-0 lg:border-margin lg:bg-[#FFFDF6] lg:p-3' : 'mt-4 border-l-3 border-margin bg-[#FFFDF6] px-3 py-2 lg:mt-0 lg:py-2.5'} ${className ?? ''}`}
    >
      {heading && <div className="section-label">{heading}</div>}
      {intro && <p className="mt-1.5 text-xs leading-snug text-dim">{intro}</p>}

      {/* The page, small, in the place the read will appear — never a modal. */}
      {pending && preview && (
        <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
          <img src={preview} alt="" className="h-16 w-16 border-[1.5px] border-ink object-cover" />
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-dim">Reading your page…</span>
        </div>
      )}
      {pick}
      {children}
    </div>
  );
}
