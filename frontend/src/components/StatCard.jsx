import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, onClick, valueClassName = 'text-4xl' }) => (
  <div
    onClick={onClick}
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
    className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 relative overflow-hidden group cursor-pointer focus:outline-none h-full flex flex-col justify-between"
  >
    {/* Decorative corner background tint */}
    <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>

    <div className="flex items-center justify-between relative z-10">
      <div className="flex-1 pr-3">
        {/* Card Title (e.g. STEPS TODAY) */}
        {title && <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">{title}</p>}
        {/* Big Metric Value (e.g. 0, 65, 8h) */}
        <h3 className={`font-extrabold text-gray-900 dark:text-gray-100 tracking-tight ${valueClassName}`}>{value}</h3>
      </div>

      {/* Top Right Rounded Icon Container */}
      <div className={`p-4 ${colorClass} bg-opacity-10 dark:bg-opacity-20 rounded-2xl shadow-sm transition-transform duration-300 ease-out group-hover:scale-125 shrink-0`}>
        {Icon && <Icon className="w-7 h-7" style={{ color: 'currentColor' }} />}
      </div>
    </div>

    {/* Bottom Subtitle Pill (e.g. Goal: 2,500, Kcal active) */}
    <div className="mt-5 flex items-center text-sm">
      <span className="font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full">
        {subtitle}
      </span>
    </div>
  </div>
);

export default StatCard;
