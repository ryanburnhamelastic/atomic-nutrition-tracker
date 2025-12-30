/**
 * Floating Action Button for AI Meal Planner
 * Globally accessible button to open the meal planning modal
 */

interface MealPlannerFABProps {
  onClick: () => void;
}

export default function MealPlannerFAB({ onClick }: MealPlannerFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-50
        bg-gradient-to-r from-purple-600 to-indigo-600
        text-white p-4 rounded-full shadow-lg
        hover:shadow-xl transition-all hover:scale-110 active:scale-95
        md:bottom-8 md:right-8"
      aria-label="AI Meal Planner"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {/* Sparkles/magic wand icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    </button>
  );
}
