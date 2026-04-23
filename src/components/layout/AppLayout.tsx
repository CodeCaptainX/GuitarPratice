import React, { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export type NavItem = {
  path: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

type AppLayoutProps = {
  navItems: NavItem[];
  children: React.ReactNode;
};

const baseLink =
  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors";
const inactiveLink = "text-slate-300 hover:bg-white/5 hover:text-white";
const activeLink =
  "bg-white/10 text-white ring-1 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)]";

export default function AppLayout({ navItems, children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const current = useMemo(() => {
    const match =
      navItems.find((item) => item.path === location.pathname) ??
      navItems.find((item) => item.path !== "/" && location.pathname.startsWith(item.path)) ??
      navItems.find((item) => item.path === "/");
    return match ?? null;
  }, [location.pathname, navItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950 text-slate-100">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
        {/* Mobile top bar */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 ring-1 ring-white/10">
              <span className="text-lg font-bold">🎸</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Guitar Practice</div>
              <div className="text-xs text-slate-400">Control panel</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-xl bg-white/5 px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/10"
          >
            Menu
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside
            className={`${
              mobileOpen ? "block" : "hidden"
            } lg:block rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm`}
          >
            <div className="p-4">
              <div className="hidden items-center gap-3 lg:flex">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 ring-1 ring-white/10">
                  <span className="text-lg font-bold">🎸</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Guitar Practice</div>
                  <div className="text-xs text-slate-400">Control panel</div>
                </div>
              </div>

              <nav className="mt-3 space-y-1 lg:mt-6">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `${baseLink} ${isActive ? activeLink : inactiveLink}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10 group-hover:bg-white/10">
                      {item.icon ?? (
                        <span className="text-[11px] font-semibold text-slate-200">
                          {item.label.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="flex-1">
                      <span className="block">{item.label}</span>
                      {item.description ? (
                        <span className="block text-xs text-slate-400 group-hover:text-slate-300">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                  </NavLink>
                ))}
              </nav>

              <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 ring-1 ring-white/10">
                <div className="text-sm font-semibold">Tip</div>
                <div className="mt-1 text-xs text-slate-300">
                  Set your default practice options in <span className="font-semibold">Manage</span>{" "}
                  and they’ll auto-load in Practice.
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold text-white">
                    {current?.label ?? "Guitar Practice"}
                  </h1>
                  {current?.description ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-300">
                      {current.description}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-slate-400">
                      Build routines, train your ear, and map the fretboard.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

