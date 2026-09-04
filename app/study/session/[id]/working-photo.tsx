'use client';

import { useRef, useState, useTransition } from 'react';
import { captureWorking, readWorking, type ReadResult } from './capture';
import type { CaptureResult } from './mark-working';
import { WorkingRead } from './working-read';
import { MAX_TAKES, type TranscriptionResult } from '@/lib/grade/transcribe';

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

type Marked = Pick<CaptureResult, 'method' | 'marksAdded'> & { transcriptionId?: string; rejected?: number[] };

export function WorkingPhoto({
  sessionId,
  questionIndex,
  attemptId,
  marks,
  initial,
  onRead,
  onBusy,
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
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [read, setRead] = useState<TranscriptionResult | null>(initial?.transcription ?? null);
  const [readId, setReadId] = useState<string | null>(initial?.transcriptionId ?? null);
  const [takesLeft, setTakesLeft] = useState(initial?.takesLeft ?? MAX_TAKES);
  const [marked, setMarked] = useState<Marked>(
    initial && 'method' in initial
      ? { method: initial.method, marksAdded: initial.marksAdded, transcriptionId: initial.transcriptionId, rejected: initial.rejected }
      : { method: [], marksAdded: 0, rejected: initial && 'rejected' in initial ? (initial as { rejected?: number[] }).rejected : undefined },
  );
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const send = (file: File) => {
    setError(null);
    setPreview(URL.createObjectURL(file));
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
        if ('method' in res) setMarked({ method: res.method, marksAdded: res.marksAdded, transcriptionId: res.transcriptionId, rejected: res.rejected });
        if ('prefill' in res) onRead?.(res.prefill);
      } catch {
        setError('That photo could not be prepared on this device.');
      } finally {
        setPreview((url) => {
          if (url) URL.revokeObjectURL(url);
          return null;
        });
        onBusy?.(false);
      }
    });
  };

  return (
    <div className={attemptId ? 'mt-4 border-t-[1.5px] border-rule pt-4' : 'mt-4 border-l-3 border-margin bg-[#FFFDF6] py-2 pl-3'}>
      <div className="section-label">Your working on paper</div>

      {!read && (
        <p className="mt-1 text-[12px] leading-snug text-dim">
          {attemptId
            ? `There ${marks === 1 ? 'is 1 mark' : `are ${marks} marks`} here for the method, and we cannot see your working. Photograph what you wrote and we will type it up beside the mark scheme. Nothing you have already earned can change.`
            : 'Work it on paper, then photograph the page. We fill in the boxes from what we read — check them, change anything we got wrong, and submit.'}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) send(file);
          e.target.value = '';
        }}
      />

      {/* The page, small, in the place the read will appear — never a modal. */}
      {pending && preview && (
        <div className="mt-2 flex items-center gap-3" aria-live="polite">
          <img src={preview} alt="" className="h-16 w-16 border-[1.5px] border-ink object-cover" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-dim">Reading your page…</span>
        </div>
      )}

      {takesLeft > 0 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="mt-2 min-h-11 w-full border-[1.5px] border-ink bg-white p-3 font-mono text-xs uppercase tracking-widest disabled:opacity-60"
        >
          {pending ? 'Reading…' : read ? 'Take it again' : 'Photograph your working'}
        </button>
      )}

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
          method={marked.method}
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
            takesLeft > 0
              ? 'If that is not what you wrote, take it again once.'
              : 'That is the second photograph, so it stands.'
          }
        />
      )}
    </div>
  );
}
