import { DigestPayload } from "@repo/shared-types/globals";
import {
  Mail,
  Calendar,
  //   MessageSquare,
  GitBranch,
  Figma,
  Zap,
  Shield,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Combine,
  VolumeX,
} from "lucide-react";

export const mockDigest: DigestPayload = {
  period: "daily",
  plan: "pro",

  summary: {
    totalItems: 4,
    bySource: {
      gmail: 1,
      calendar: 1,
      github: 1,
      figma: 1,
      slack: 0,
    },
    byPriority: {
      high: 2,
      medium: 1,
      low: 1,
    },
    integrations: ["gmail", "calendar", "github", "figma"],
  },

  items: [
    {
      source: "gmail",
      priority: "high",
      title: "Google: Someone's in your account",
      description:
        "Unrecognized login from Lagos. Change password NOW if not you.",
      count: 1,
      actions: [{ url: "#", label: "View email" }],
    },
    {
      source: "github",
      priority: "high",
      title: "Security Alert in brevpulse/web",
      description: "Critical vulnerability found. Fix required immediately.",
      count: 1,
      actions: [{ url: "#", label: "View Alert" }],
    },
    {
      source: "calendar",
      priority: "medium",
      title: "Client Demo — Rescheduled to 2 PM",
      description: "Acme Corp moved the call. Be ready.",
      count: 1,
      actions: [{ url: "#", label: "Open Calendar" }],
    },
    {
      source: "figma",
      priority: "low",
      title: "New Comments on Dashboard v2",
      description: "Product team left 3 quick notes.",
      count: 1,
      actions: [{ url: "#", label: "Open Figma" }],
    },
  ],
};

export const badgesArray = [
  { name: "email", icon: Mail },
  { name: "calendar", icon: Calendar },
  //   { name: "slack", icon: MessageSquare },
  { name: "github", icon: GitBranch },
  { name: "figma", icon: Figma },
];

export const featureCardArray = [
  {
    icon: Zap,
    title: "Smart Priorities",
    description:
      "AI identifies what actually needs your attention. Skip the noise, focus on impact.",
    accentColor: "text-primary",
  },
  {
    icon: Clock,
    title: "Save 2+ Hours Daily",
    description:
      "One email. One glance. Everything you need to know. No app-switching marathon.",
    accentColor: "text-priority-amber",
  },
  {
    icon: Shield,
    title: "Privacy-First",
    description:
      "Your data stays yours. E2E encryption, zero data selling. Open-source roadmap.",
    accentColor: "text-success-green",
  },
];

export const brevpulseFeatures = [
  {
    icon: Zap,
    title: "AI-Powered Prioritization",
    description:
      "Intelligently sorts notifications from high to low priority across all apps, so you see what's urgent first.",
  },
  {
    icon: Layers,
    title: "Smart Grouping",
    description:
      "Groups related items—like email threads or PR comments—into single, clean entries to reduce clutter.",
  },
  {
    icon: Sparkles,
    title: "Actionable Summaries",
    description:
      "Rewrites headlines to be punchy and provides clear, concise descriptions of what you need to know.",
  },
  {
    icon: ArrowRight,
    title: "One-Click Actions",
    description:
      "Jump straight to the source. Every digest item includes a direct link to the email, PR, or calendar event.",
  },
  {
    icon: Combine,
    title: "Cross-App Synthesis",
    description:
      "Get a unified view from Gmail, Calendar, GitHub, Slack, and Figma, bringing everything together in one place.",
  },
  {
    icon: VolumeX,
    title: "Noise Cancellation",
    description:
      "Filters out the junk—promotional emails, bot spam, and low-priority noise—so you can focus on what matters.",
  },
];
