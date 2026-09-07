"use client";

import { useEffect, useState } from "react";
import type { ProfileTheme } from "./theme";

interface MenuCategoryNavProps {
  categories: { id: string; name: string }[];
  theme: ProfileTheme;
}

/**
 * A sticky, horizontally scrollable pill nav that tracks the active menu
 * category as the guest scrolls and smooth-scrolls to a section on tap —
 * the kind of quick jump a long restaurant menu needs.
 */
export function MenuCategoryNav({ categories, theme }: MenuCategoryNavProps) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`category-${c.id}`))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id.replace("category-", ""));
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  const handleClick = (id: string) => {
    const el = document.getElementById(`category-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-3 z-20 -mx-5 px-5">
      <div className={`flex gap-2 overflow-x-auto rounded-full p-1.5 ${theme.panelStrong} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        {categories.map((category) => {
          const isActive = category.id === activeId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleClick(category.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 font-body text-xs font-semibold transition-colors ${
                isActive ? "" : theme.subtext
              }`}
              style={
                isActive
                  ? { backgroundColor: theme.accent, color: theme.onAccent }
                  : undefined
              }
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
