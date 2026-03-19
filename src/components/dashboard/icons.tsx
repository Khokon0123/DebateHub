"use client";

import * as React from "react";

export function Icon({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden>
      {children}
      {title ? <span className="sr-only">{title}</span> : null}
    </span>
  );
}

export function HomeIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-8.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  );
}

export function ListIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M8 6h12M8 12h12M8 18h12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </Icon>
  );
}

export function PlusIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </Icon>
  );
}

export function SlotsIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M5 8h14M5 16h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7 8v8M12 8v8M17 8v8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </Icon>
  );
}

export function UserIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M20 21a8 8 0 0 0-16 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  );
}

