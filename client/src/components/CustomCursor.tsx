import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const pos = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const loop = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    const onHoverStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a") ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select") ||
        target.closest("[role='button']")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", onHoverStart, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", onHoverStart);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999] will-change-transform"
      style={{
        width: 0,
        height: 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s",
      }}
    >
      <img
        src="/materialized-cursor.png"
        alt=""
        draggable={false}
        style={{
          width: isHovering ? 56 : 44,
          height: isHovering ? 56 : 44,
          marginLeft: isHovering ? -28 : -22,
          marginTop: isHovering ? -28 : -22,
          transition: "width 0.18s ease, height 0.18s ease, margin 0.18s ease",
          userSelect: "none",
          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
        }}
      />
    </div>
  );
}
