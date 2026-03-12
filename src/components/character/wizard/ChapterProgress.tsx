'use client'

import type { WizardChapter } from './types'

type ChapterProgressProps = {
  chapters: WizardChapter[]
  currentChapterIndex: number
  currentSubStepIndex: number
}

export function ChapterProgress({ chapters, currentChapterIndex, currentSubStepIndex }: ChapterProgressProps) {
  const chapter = chapters[currentChapterIndex]
  const isMultiStep = chapter.steps.length > 1

  return (
    <div className="text-center mb-6">
      {/* Chapter number in small caps */}
      <p className="font-ui text-xs tracking-[0.2em] text-vellum-400 uppercase mb-1">
        Chapter {chapter.number}
      </p>
      {/* Chapter title */}
      <h2 className="font-heading text-2xl text-vellum-50 mb-4">
        {chapter.title}
      </h2>
      {/* Dot row */}
      <div className="flex items-center justify-center gap-2">
        {chapters.map((ch, idx) => (
          <div
            key={idx}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx < currentChapterIndex
                ? 'bg-bronze-muted'
                : idx === currentChapterIndex
                  ? 'bg-bronze-muted shadow-[0_0_6px_rgba(201,166,107,0.5)]'
                  : 'bg-sepia-800/50'
            }`}
          />
        ))}
      </div>
      {/* Sub-step indicator for multi-step chapters */}
      {isMultiStep && (
        <p className="text-xs text-vellum-500 mt-2">
          Step {currentSubStepIndex + 1} of {chapter.steps.length}
        </p>
      )}
      {/* Gradient divider */}
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-sepia-700/50 to-transparent" />
    </div>
  )
}
