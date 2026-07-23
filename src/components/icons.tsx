import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function Mark({ className = "", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`size-7 ${className}`}
      {...props}
    >
      <path
        d="M16 2.5 20.2 12 29.5 16l-9.3 4L16 29.5 11.8 20 2.5 16l9.3-4L16 2.5Z"
        fill="currentColor"
      />
      <circle cx="16" cy="16" r="3.2" fill="var(--color-paper, #f5f1e8)" />
    </svg>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" {...props}>
      <path d="M5 15 15 5m-7 0h7v7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" {...props}>
      <path d="m12 5-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Eye(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" {...props}>
      <path d="M2.5 10s2.7-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.7 4.5-7.5 4.5S2.5 10 2.5 10Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" {...props}>
      <path d="M10 3v14M3 10h14" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function More(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5" {...props}>
      <circle cx="4" cy="10" r="1.3" fill="currentColor" />
      <circle cx="10" cy="10" r="1.3" fill="currentColor" />
      <circle cx="16" cy="10" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function Check({ className = "", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`size-5 ${className}`} {...props}>
      <path d="m4 10 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
