"use client";

import { useState } from "react";

type Role = "student" | "teacher" | "admin";

const roleCopy: Record<Role, { title: string; detail: string; actions: string[] }> = {
  student: {
    title: "Make the next correct move.",
    detail: "Your practice adapts to what you know, what you miss, and what you should see next.",
    actions: ["Continue adaptive set", "Review missed questions", "Open study plan"],
  },
  teacher: {
    title: "See where the class needs you.",
    detail: "Assign focused practice, spot domain gaps, and coach with evidence instead of guesswork.",
    actions: ["Create assignment", "Review class signal", "Open roster"],
  },
  admin: {
    title: "Keep the whole school moving.",
    detail: "Manage people, content, permissions, and a trustworthy view of progress across cohorts.",
    actions: ["Manage school", "Review audit log", "Publish content"],
  },
};

export default function HomePage() {
  const [role, setRole] = useState<Role>("student");
  const copy = roleCopy[role];

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-10 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-signal text-xl text-white">✦</div>
            <div>
              <div className="display text-2xl font-semibold">northstar</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">adaptive practice</div>
            </div>
          </div>
          <nav className="flex items-center gap-2" aria-label="Role preview">
            {(Object.keys(roleCopy) as Role[]).map((item) => (
              <button
                key={item}
                onClick={() => setRole(item)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${role === item ? "bg-ink text-white" : "text-slate-500 hover:bg-blue-50"}`}
              >
                {item}
              </button>
            ))}
            <button className="ml-4 rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink">Sign in</button>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1360px] grid-cols-[250px_1fr] gap-8 px-10 py-10">
        <aside className="rounded-2xl bg-ink p-5 text-white">
          <p className="text-[10px] uppercase tracking-[0.18em] text-blue-200">Workspace</p>
          <p className="display mt-3 text-2xl">{roleCopy[role].title}</p>
          <div className="mt-8 grid gap-2 text-sm text-blue-100">
            {["Overview", "Practice", "Progress", "Assignments", "School settings"].map((item, index) => (
              <button key={item} className={`rounded-lg px-3 py-2 text-left ${index === 0 ? "bg-white text-ink" : "hover:bg-white/10"}`}>{item}</button>
            ))}
          </div>
          <div className="mt-12 rounded-xl bg-white/10 p-4 text-xs leading-5 text-blue-100">
            Every view is scoped to your school. Progress stays useful because the data stays accountable.
          </div>
        </aside>

        <section>
          <div className="grid grid-cols-[1.35fr_.65fr] gap-5">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-line">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-signal">{role} workspace</p>
              <h1 className="display mt-4 max-w-2xl text-5xl font-semibold leading-[0.98]">{copy.title}</h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-600">{copy.detail}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {copy.actions.map((action, index) => <button key={action} className={`rounded-lg px-4 py-3 text-xs font-bold ${index === 0 ? "bg-signal text-white" : "border border-line text-ink hover:bg-blue-50"}`}>{action} →</button>)}
              </div>
            </div>
            <div className="rounded-2xl bg-blue-50 p-7 ring-1 ring-blue-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Signal</p>
              <div className="display mt-6 text-6xl font-semibold">76</div>
              <p className="mt-1 text-xs text-slate-600">route confidence</p>
              <div className="mt-7 h-2 rounded-full bg-white"><div className="h-full w-[76%] rounded-full bg-signal" /></div>
              <p className="mt-4 text-xs leading-5 text-slate-600">Strong evidence in algebra. Keep building reading stamina.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-5">
            {["Adaptive queue", "Mastery map", "Coach notes"].map((title, index) => (
              <article key={title} className="rounded-2xl bg-white p-6 ring-1 ring-line">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{title}</p>
                <h2 className="display mt-4 text-2xl font-semibold">{index === 0 ? "8 questions ready" : index === 1 ? "Algebra · 82%" : "2 notes to read"}</h2>
                <p className="mt-3 text-xs leading-5 text-slate-600">{index === 0 ? "Selected from your latest attempts." : index === 1 ? <span>Try <span dangerouslySetInnerHTML={{ __html: "x^2 + 5x + 6 = 0" }} /> next.</span> : "Your teacher marked a useful pattern in your errors."}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
