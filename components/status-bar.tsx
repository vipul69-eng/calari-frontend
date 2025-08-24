"use client";
import { useEffect } from "react";

export default function StatusBarUpdater({ transparent = false }: { transparent?: boolean }) {
  useEffect(() => {
    const color = transparent ? "rgba(0,0,0,0)" : "#ffffff";
    let meta = document.querySelector<HTMLMetaElement>("meta[name=theme-color]");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [transparent]);

  return null;
}
