import { ThemeToggle } from "@/components/theme-toggle";
import { WallCalendar } from "@/components/wall-calendar";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <ThemeToggle />
      <section className="mx-auto w-full max-w-5xl px-4 pt-8 text-center sm:px-8">
        <h1 className="font-wallcal text-6xl leading-none text-[color:var(--brand-ink)] drop-shadow-[0_2px_4px_rgba(15,47,76,0.18)] sm:text-7xl">
          WallCal
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[color:var(--foreground)]/78">Interactive Calendar Experience</p>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-[color:var(--foreground)]/86 sm:text-base">
          A tactile calendar interface inspired by physical wall designs with animated month transitions,
          date-range selection, and persistent notes.
        </p>
      </section>

      <WallCalendar />
    </main>
  );
}
