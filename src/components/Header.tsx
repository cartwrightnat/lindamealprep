"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  isDisabled: boolean;
}

function NavLink({ href, label, isActive, isDisabled }: NavLinkProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = `tooltip-${label.toLowerCase().replace(/\s+/g, "-")}`;

  if (isDisabled) {
    return (
      <span className="relative">
        <a
          href={href}
          aria-disabled="true"
          aria-describedby={tooltipId}
          onClick={(e) => e.preventDefault()}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className="px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-text-muted cursor-default select-none focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
        >
          {label}
        </a>
        {showTooltip && (
          <span
            id={tooltipId}
            role="tooltip"
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap rounded-md bg-text-primary text-paper text-xs px-2 py-1 z-50 pointer-events-none"
          >
            Select items first
          </span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2 ${
        isActive
          ? "text-spice border-b-2 border-spice"
          : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </Link>
  );
}

interface HeaderProps {
  selectedCount: number;
}

export default function Header({ selectedCount }: HeaderProps) {
  const pathname = usePathname();
  const hasSelection = selectedCount > 0;

  const navLinks = [
    { href: "/", label: "Item Picker" },
    { href: "/shopping-list", label: "Shopping List" },
    { href: "/game-plan", label: "Game Plan" },
  ];

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <span className="font-serif text-base sm:text-lg font-semibold text-spice shrink-0">
            <span className="sm:hidden">Meal Prep</span>
            <span className="hidden sm:inline">Meal Prep Planner</span>
          </span>
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                isActive={pathname === href}
                isDisabled={href !== "/" && !hasSelection}
              />
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
