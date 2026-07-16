
import { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
}

/** KPI card in the same visual language as the hero dashboard preview:
    eyebrow label, big number, cyan delta. */
const StatCard = ({ title, value, icon, change }: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">{title}</p>
          <h3 className="text-2xl font-semibold text-white">{value}</h3>

          {change && (
            <div className="flex items-center gap-1 mt-2">
              {change.isPositive ? (
                <TrendingUp className="h-3 w-3 text-ice" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-300" aria-hidden="true" />
              )}
              <span
                className={`text-xs font-medium ${
                  change.isPositive ? "text-ice" : "text-red-300"
                }`}
              >
                {change.isPositive ? "+" : ""}{change.value}
              </span>
              <span className="text-xs text-white/45 ml-1">vs mese scorso</span>
            </div>
          )}
        </div>
        <div className="bg-white/5 p-2 rounded-xl border border-white/10">{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;
