import React from "react";

import AboutPage from "../pages/AboutPage";
import FretboardPage from "../pages/FretboardPage";
import HomePage from "../pages/HomePage";
import ManagePage from "../pages/ManagePage";
import PracticePage from "../pages/PracticePage";
import RiffPage from "../pages/RiffPage";

export type AppRoute = {
  path: string;
  label: string;
  description?: string;
  nav?: boolean;
  element: React.ReactElement;
};

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="text-slate-100">{children}</span>
);

const DashboardIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 13.5V20a1 1 0 0 0 1 1h5v-7.5H4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3h5a1 1 0 0 1 1 1v7.5h-6V3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4 3h6v7.5H4V3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 13.5h6V20a1 1 0 0 1-1 1h-5v-7.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  </Icon>
);

const PlayIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 7.5v9l8-4.5-8-4.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  </Icon>
);

const SlidersIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h10M4 18h10M4 12h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 6h4M16 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 6a2 2 0 1 0 0 .001ZM14 18a2 2 0 1 0 0 .001ZM10 12a2 2 0 1 0 0 .001Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  </Icon>
);

const NeckIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 4h12v16H6V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 4v16M14 4v16M6 8h12M6 12h12M6 16h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  </Icon>
);

const InfoIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 10v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 7h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  </Icon>
);

const MusicIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18a3 3 0 1 0 0 .001V6l12-2v12a3 3 0 1 0 0 .001V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  </Icon>
);

export const routes: AppRoute[] = [
  {
    path: "/",
    label: "Dashboard",
    description: "Quick start, active routine, and shortcuts.",
    nav: true,
    element: <HomePage />,
  },
  {
    path: "/practice",
    label: "Practice",
    description: "Random notes, key filters, and scale view.",
    nav: true,
    element: <PracticePage />,
  },
  {
    path: "/riff",
    label: "Riff",
    description: "Click notes and generate sheet music.",
    nav: true,
    element: <RiffPage />,
  },
  {
    path: "/manage",
    label: "Manage",
    description: "Routines + default practice options.",
    nav: true,
    element: <ManagePage />,
  },
  {
    path: "/fretboard",
    label: "Fretboard",
    description: "Interactive neck with chord buttons.",
    nav: true,
    element: <FretboardPage />,
  },
  {
    path: "/about",
    label: "About",
    description: "What this app is and how to use it.",
    nav: true,
    element: <AboutPage />,
  },
];

export const navItems = [
  {
    path: "/",
    label: "Dashboard",
    description: "Overview & shortcuts",
    icon: <DashboardIcon />,
  },
  { path: "/practice", label: "Practice", description: "Trainer & drills", icon: <PlayIcon /> },
  { path: "/riff", label: "Riff", description: "Build a lick", icon: <MusicIcon /> },
  { path: "/manage", label: "Manage", description: "Defaults & routines", icon: <SlidersIcon /> },
  { path: "/fretboard", label: "Fretboard", description: "Interactive neck", icon: <NeckIcon /> },
  { path: "/about", label: "About", description: "Tips & info", icon: <InfoIcon /> },
];

export default routes;
