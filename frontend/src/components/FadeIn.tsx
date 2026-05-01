import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer";
  threshold?: number;
}

export function FadeIn({ children, delay = 0, className = "", as = "div", threshold = 0.12 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [delay, threshold]);

  const Tag = as as any;
  return (
    <Tag ref={ref} className={`fade-on-enter ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </Tag>
  );
}
