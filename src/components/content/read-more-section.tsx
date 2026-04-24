"use client";

import { useState, Children } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

interface ReadMoreSectionProps {
  children: React.ReactNode;
  visibleCount?: number;
  readMoreLabel?: string;
  showLessLabel?: string;
  className?: string;
}

export default function ReadMoreSection({
  children,
  visibleCount = 3,
  readMoreLabel = "Read more",
  showLessLabel = "Show less",
  className = "text-start text-pretty text-lg/7 space-y-6 text-sl-secondary",
}: ReadMoreSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const childArray = Children.toArray(children);

  if (childArray.length <= visibleCount) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {childArray.slice(0, visibleCount)}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="hidden-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-6 pt-6">
              {childArray.slice(visibleCount)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 text-sm font-medium text-sl-primary hover:text-sl-primary/80 transition-colors mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-primary rounded"
        aria-expanded={expanded}
      >
        <span>{expanded ? showLessLabel : readMoreLabel}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="inline-flex"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
    </div>
  );
}
