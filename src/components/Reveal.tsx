'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  style?: CSSProperties
}

/** Scroll-triggered entrance for below-the-fold sections. */
export function Reveal({ children, delay = 0, y = 20, className, style }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Mount-triggered entrance for above-the-fold content (hero). */
export function FadeIn({ children, delay = 0, y = 16, className, style }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
