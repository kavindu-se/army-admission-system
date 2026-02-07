import React from "react";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "side-icon"
};

export default function SidebarIcon({ name }) {
  switch (name) {
    case "dashboard":
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...iconProps}>
          <path d="M4 13l2-6h12l2 6" />
          <path d="M4 13v6h16v-6" />
          <path d="M4 13h4l2 3h4l2-3h4" />
        </svg>
      );
    case "progress":
      return (
        <svg {...iconProps}>
          <path d="M6 3h12" />
          <path d="M6 21h12" />
          <path d="M8 3c0 5 8 5 8 10s-8 5-8 10" />
        </svg>
      );
    case "approved":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l2.5 2.5L16 9" />
        </svg>
      );
    case "rejected":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6" />
          <path d="M15 9l-6 6" />
        </svg>
      );
    case "users":
      return (
        <svg {...iconProps}>
          <path d="M8 11a4 4 0 1 1 8 0" />
          <path d="M4 20c2-3 6-4 8-4s6 1 8 4" />
        </svg>
      );
    case "create":
      return (
        <svg {...iconProps}>
          <path d="M9 7a4 4 0 1 1 8 0" />
          <path d="M3 20c2-3 6-4 8-4" />
          <path d="M16 11h6" />
          <path d="M19 8v6" />
        </svg>
      );
    case "pdf":
      return (
        <svg {...iconProps}>
          <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
          <path d="M14 2v5h5" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
        </svg>
      );
    case "schools":
      return (
        <svg {...iconProps}>
          <path d="M3 10l9-6 9 6" />
          <path d="M5 10v8h14v-8" />
          <path d="M9 18v-4h6v4" />
        </svg>
      );
    case "applications":
      return (
        <svg {...iconProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h8" />
        </svg>
      );
    case "notice":
      return (
        <svg {...iconProps}>
          <path d="M18 8a6 6 0 1 0-12 0c0 7-2 7-2 7h16s-2 0-2-7" />
          <path d="M13.5 21a2 2 0 0 1-3 0" />
        </svg>
      );
    default:
      return null;
  }
}
