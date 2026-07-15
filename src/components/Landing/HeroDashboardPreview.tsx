import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  Sparkles,
  TrendingUp,
} from "lucide-react";

/**
 * Non-interactive mock of the product dashboard, shown through the hero spotlight.
 * Purely presentational (static demo values, no real names) so the spotlight
 * "reveals the platform" underneath the beauty-center photo. Styled with the same
 * dark-glass language as the real app. If a real screenshot is dropped at
 * public/images/dashboard-preview.png, the hero uses that instead of this component.
 */
const NAV_ITEMS = [
  { label: "Dashboard", Icon: LayoutDashboard, active: true },
  { label: "Agenda", Icon: CalendarDays, active: false },
  { label: "Servizi", Icon: Scissors, active: false },
  { label: "Community", Icon: Users, active: false },
  { label: "Assistente AI", Icon: Sparkles, active: false },
];

const KPIS = [
  { label: "Fatturato del mese", value: "€ 8.240", delta: "+12%" },
  { label: "Appuntamenti oggi", value: "14", delta: "+3" },
  { label: "Scontrino medio", value: "€ 68", delta: "+6%" },
  { label: "Clienti attive", value: "312", delta: "+18" },
];

const BARS = [42, 58, 51, 70, 64, 82, 76];

const AGENDA = [
  { time: "09:00", service: "Pulizia viso", tag: "Cabina 1" },
  { time: "10:30", service: "Massaggio relax", tag: "Cabina 2" },
  { time: "12:00", service: "Manicure gel", tag: "Postazione A" },
  { time: "14:30", service: "Trattamento corpo", tag: "Cabina 1" },
];

const HeroDashboardPreview = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-6 sm:p-10">
      <div
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#bfeeff]/20 bg-[#070707] shadow-[0_40px_120px_rgba(0,0,0,0.6),0_0_80px_rgba(191,238,255,0.12)]"
        style={{ transform: "perspective(1800px) rotateY(-7deg) rotateX(3deg) scale(1.04)" }}
      >
        <div className="grid grid-cols-[132px_1fr] sm:grid-cols-[180px_1fr]">
          {/* Sidebar */}
          <aside className="hidden flex-col gap-1 border-r border-white/10 bg-white/[0.02] p-4 sm:flex">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#bfeeff]/15 text-sm font-bold text-[#bfeeff]">
                4E
              </span>
              <span className="text-xs font-semibold text-white/80">4 Elementi</span>
            </div>
            {NAV_ITEMS.map(({ label, Icon, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                  active ? "bg-white/10 text-white" : "text-white/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </aside>

          {/* Main */}
          <div className="p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#bfeeff]">Panoramica</p>
                <p className="mt-1 font-playfair text-2xl italic text-white">Buongiorno</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#bfeeff]/60 to-white/20" />
                <span className="text-xs text-white/70">Il tuo centro</span>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {KPIS.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <p className="text-[10px] uppercase tracking-wide text-white/45">{kpi.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{kpi.value}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#bfeeff]">
                    <TrendingUp className="h-3 w-3" />
                    {kpi.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart + agenda */}
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-medium text-white/70">Incassi ultimi 7 giorni</p>
                <div className="mt-4 flex h-24 items-end gap-2">
                  {BARS.map((h, i) => (
                    <div key={i} className="flex-1 overflow-hidden rounded-t-md bg-white/5">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-[#bfeeff]/40 to-[#bfeeff]"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-medium text-white/70">Agenda di oggi</p>
                <div className="mt-3 space-y-2.5">
                  {AGENDA.map((row) => (
                    <div key={row.time} className="flex items-center gap-3">
                      <span className="w-10 text-[11px] font-semibold text-[#bfeeff]">{row.time}</span>
                      <span className="flex-1 truncate text-xs text-white/80">{row.service}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/50">
                        {row.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroDashboardPreview;
