import React from "react";
import { TabType } from "@/hooks/useUserBookings";

interface BookingTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: TabType[] = ["all", "upcoming", "past", "cancelled"];

export const BookingTabs: React.FC<BookingTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="mb-7 inline-flex max-w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.035] p-1 backdrop-blur-xl">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            id={`tab-${tab}`}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`whitespace-nowrap rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-yellow-400/10 text-yellow-400 shadow-sm"
                : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        );
      })}
    </div>
  );
};

export default BookingTabs;
