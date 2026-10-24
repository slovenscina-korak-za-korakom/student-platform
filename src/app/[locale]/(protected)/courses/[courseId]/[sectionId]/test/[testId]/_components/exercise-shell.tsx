"use client"

import { motion } from "framer-motion"

type Props = {
  /** 0–100. */
  progress: number
  children: React.ReactNode
}

/**
 * Top chrome for the exercise flow: a chunky progress bar. There is no exit
 * control on purpose — once a test is started the only way out is to finish it
 * (the completion screen links back to the module).
 */
const ExerciseShell = ({ progress, children }: Props) => {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 md:py-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sl-blue via-sl-purple to-sl-pink"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      {children}
    </div>
  )
}

export default ExerciseShell
