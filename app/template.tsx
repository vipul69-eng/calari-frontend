"use client"

import type React from "react"

import { motion } from "framer-motion"

export default function Transition({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{
        x: "100%",
        opacity: 0.8,
        scale: 0.95,
      }}
      animate={{
        x: 0,
        opacity: 1,
        scale: 1,
      }}
      exit={{
        x: "-25%",
        opacity: 0.6,
        scale: 0.95,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 300,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94], // iOS-style cubic bezier
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </motion.div>
  )
}
