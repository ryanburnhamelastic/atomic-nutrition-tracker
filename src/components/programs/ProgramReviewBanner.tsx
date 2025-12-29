import { ProgramReview } from '../../types';

interface ProgramReviewBannerProps {
  review: ProgramReview;
  onViewAnalysis: () => void;
  onDismiss: () => void;
}

export default function ProgramReviewBanner({ review, onViewAnalysis, onDismiss }: ProgramReviewBannerProps) {
  return (
    <div className="card bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="text-5xl flex-shrink-0">🤖</div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1">
            Your Week {review.review_week} Review is Ready!
          </h3>
          <p className="text-emerald-50 text-sm">
            AI has analyzed your progress and has recommendations for you
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onViewAnalysis}
            className="px-6 py-2 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
          >
            View Analysis
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-emerald-50 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
