
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
  color: string;
}

const StatCard = ({ title, value, icon, change, color }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold font-playfair">{value}</h3>
          
          {change && (
            <div className="flex items-center mt-2">
              <span
                className={`text-xs font-medium ${
                  change.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {change.isPositive ? "+" : ""}{change.value}
              </span>
              <svg
                className={`w-3 h-3 ml-1 ${
                  change.isPositive ? "text-green-600" : "text-red-600"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {change.isPositive ? (
                  <path
                    d="M18 15L12 9L6 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`${color} p-2 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;
