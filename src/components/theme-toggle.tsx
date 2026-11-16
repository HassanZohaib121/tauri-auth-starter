"use client";

import { flushSync } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const THEME_TRANSITION_DURATION = 500;
const THEME_TRANSITION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

type ThemeMode = "light" | "dark";

type NativeViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    finished: Promise<void>;
  };
};

function getRevealGeometry(button: HTMLButtonElement) {
  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const radius =
    Math.ceil(
      Math.max(
        Math.hypot(x, y),
        Math.hypot(width - x, y),
        Math.hypot(x, height - y),
        Math.hypot(width - x, height - y),
      ),
    ) + 2;

  return { x, y, radius };
}

function syncSnapshotState(source: HTMLElement, snapshot: HTMLElement) {
  const sourceNodes = [source, ...source.querySelectorAll("*")];
  const snapshotNodes = [snapshot, ...snapshot.querySelectorAll("*")];

  sourceNodes.forEach((sourceNode, index) => {
    const snapshotNode = snapshotNodes[index];
    if (!snapshotNode) return;

    snapshotNode.scrollTop = sourceNode.scrollTop;
    snapshotNode.scrollLeft = sourceNode.scrollLeft;

    if (
      sourceNode instanceof HTMLInputElement &&
      snapshotNode instanceof HTMLInputElement
    ) {
      snapshotNode.value = sourceNode.value;
      snapshotNode.checked = sourceNode.checked;
    } else if (
      sourceNode instanceof HTMLTextAreaElement &&
      snapshotNode instanceof HTMLTextAreaElement
    ) {
      snapshotNode.value = sourceNode.value;
    } else if (
      sourceNode instanceof HTMLSelectElement &&
      snapshotNode instanceof HTMLSelectElement
    ) {
      snapshotNode.selectedIndex = sourceNode.selectedIndex;
    }
  });
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const transitionActive = useRef(false);
  const iconTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [iconTransition, setIconTransition] = useState<ThemeMode | null>(null);

  useEffect(
    () => () => {
      if (iconTimeout.current) clearTimeout(iconTimeout.current);
    },
    [],
  );

  const handleThemeToggle = (button: HTMLButtonElement) => {
    if (transitionActive.current) return;

    const currentTheme: ThemeMode =
      resolvedTheme === "dark" ||
      (!resolvedTheme && document.documentElement.classList.contains("dark"))
        ? "dark"
        : "light";
    const nextTheme: ThemeMode = currentTheme === "dark" ? "light" : "dark";
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setTheme(nextTheme);
      return;
    }

    transitionActive.current = true;
    setIconTransition(nextTheme);
    if (iconTimeout.current) clearTimeout(iconTimeout.current);
    iconTimeout.current = setTimeout(() => setIconTransition(null), 240);

    const { x, y, radius } = getRevealGeometry(button);
    const root = document.documentElement;
    const previousRootClassName = root.className;
    const previousTransitionValues = {
      x: root.style.getPropertyValue("--theme-reveal-x"),
      y: root.style.getPropertyValue("--theme-reveal-y"),
      radius: root.style.getPropertyValue("--theme-reveal-radius"),
    };

    const finishTransition = () => {
      root.style.removeProperty("--theme-reveal-x");
      root.style.removeProperty("--theme-reveal-y");
      root.style.removeProperty("--theme-reveal-radius");

      if (previousTransitionValues.x) {
        root.style.setProperty("--theme-reveal-x", previousTransitionValues.x);
      }
      if (previousTransitionValues.y) {
        root.style.setProperty("--theme-reveal-y", previousTransitionValues.y);
      }
      if (previousTransitionValues.radius) {
        root.style.setProperty(
          "--theme-reveal-radius",
          previousTransitionValues.radius,
        );
      }

      transitionActive.current = false;
    };

    const nativeDocument = document as NativeViewTransitionDocument;
    if (nativeDocument.startViewTransition) {
      root.style.setProperty("--theme-reveal-x", `${x}px`);
      root.style.setProperty("--theme-reveal-y", `${y}px`);
      root.style.setProperty("--theme-reveal-radius", `${radius}px`);

      try {
        const transition = nativeDocument.startViewTransition(() => {
          flushSync(() => setTheme(nextTheme));
        });

        void transition.finished.then(finishTransition, finishTransition);
        return;
      } catch (error) {
        console.error("Failed to start the native theme transition:", error);
      }
    }

    let overlay: HTMLDivElement | null = null;
    try {
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);

      const targetRootStyle = window.getComputedStyle(root);
      const targetColorScheme = targetRootStyle.colorScheme;
      const themeVariables = Array.from(targetRootStyle)
        .filter((property) => property.startsWith("--"))
        .map(
          (property) =>
            [property, targetRootStyle.getPropertyValue(property)] as const,
        );
      const snapshot = document.body.cloneNode(true) as HTMLBodyElement;
      syncSnapshotState(document.body, snapshot);
      snapshot.querySelectorAll("script").forEach((script) => script.remove());
      root.className = previousRootClassName;

      const overlayElement = document.createElement("div");
      overlay = overlayElement;
      overlayElement.className = previousRootClassName;
      overlayElement.classList.remove("light", "dark");
      overlayElement.classList.add(nextTheme, "theme-transition-snapshot");
      overlayElement.setAttribute("aria-hidden", "true");
      overlayElement.setAttribute("inert", "");
      overlayElement.style.position = "fixed";
      overlayElement.style.inset = "0";
      overlayElement.style.zIndex = "2147483647";
      overlayElement.style.width = "100vw";
      overlayElement.style.height = "100dvh";
      overlayElement.style.overflow = "hidden";
      overlayElement.style.pointerEvents = "none";
      overlayElement.style.colorScheme = targetColorScheme;
      themeVariables.forEach(([property, value]) => {
        overlayElement.style.setProperty(property, value);
      });

      snapshot.style.position = "absolute";
      snapshot.style.inset = "0";
      snapshot.style.width = "100%";
      snapshot.style.height = "100%";
      snapshot.style.margin = "0";
      snapshot.style.pointerEvents = "none";
      overlayElement.append(snapshot);
      document.body.append(overlayElement);

      const animation = overlayElement.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
        ],
        {
          duration: THEME_TRANSITION_DURATION,
          easing: THEME_TRANSITION_EASING,
          fill: "both",
        },
      );

      void animation.finished.then(
        () => {
          flushSync(() => setTheme(nextTheme));
          overlay?.remove();
          finishTransition();
        },
        () => {
          flushSync(() => setTheme(nextTheme));
          overlay?.remove();
          finishTransition();
        },
      );
    } catch (error) {
      root.className = previousRootClassName;
      overlay?.remove();
      console.error("Failed to animate the theme transition:", error);
      flushSync(() => setTheme(nextTheme));
      finishTransition();
    }
  };

  const sunAnimationClass = iconTransition
    ? iconTransition === "dark"
      ? "theme-icon-exit"
      : "theme-icon-enter"
    : "";
  const moonAnimationClass = iconTransition
    ? iconTransition === "dark"
      ? "theme-icon-enter"
      : "theme-icon-exit"
    : "";

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className="relative size-11 p-0"
      onClick={(event) => handleThemeToggle(event.currentTarget)}
      aria-label="Toggle light or dark mode"
    >
      <Sun
        className={`theme-toggle-icon theme-toggle-sun absolute left-1/2 top-1/2 size-5 ${sunAnimationClass}`}
        aria-hidden="true"
      />

      <Moon
        className={`theme-toggle-icon theme-toggle-moon absolute left-1/2 top-1/2 size-5 ${moonAnimationClass}`}
        aria-hidden="true"
      />
    </Button>
  );
}
