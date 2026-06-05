"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";

export function GlobalSearch() {
  const { groups, students } = useEduGenie();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const normalized = query.toLowerCase();
    return [
      ...students
        .filter((student) => student.fullName.toLowerCase().includes(normalized))
        .slice(0, 4)
        .map((student) => ({ label: student.fullName, type: "Student", href: "/students" })),
      ...groups
        .filter((group) => group.name.toLowerCase().includes(normalized))
        .slice(0, 4)
        .map((group) => ({ label: group.name, type: "Group", href: "/groups" })),
    ];
  }, [groups, query, students]);

  return (
    <div className="relative hidden md:block">
      <label className="focus-within:ring-ring flex h-10 min-w-64 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground shadow-sm focus-within:ring-2">
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-64 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Search students or groups"
        />
        <kbd className="ml-auto rounded border px-1.5 py-0.5 text-[11px]">K</kbd>
      </label>
      {results.length > 0 ? (
        <div className="absolute right-0 top-12 z-40 w-full overflow-hidden rounded-lg border bg-card shadow-soft">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.label}`}
              href={result.href}
              className="block border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted"
              onClick={() => setQuery("")}
            >
              <span className="font-medium">{result.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">{result.type}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
