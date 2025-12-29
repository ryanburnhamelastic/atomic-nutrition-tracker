import { useState } from 'react';
import { ProgramReview, UserProgram } from '../../types';
import { programReviewsApi } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProgramReviewModalProps {
  isOpen: boolean;
  review: ProgramReview | null;
  program: UserProgram | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProgramReviewModal({ isOpen, review, program, onClose, onSuccess }: ProgramReviewModalProps) {
  const [action, setAction] = useState<'view' | 'accept' | 'reject'>('view');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !review || !program) return null;

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    const response = await programReviewsApi.accept(review.id, { notes: notes || undefined });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    onSuccess();
    handleClose();
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);

    const response = await programReviewsApi.reject(review.id, { reason: reason || undefined });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setAction('view');
    setNotes('');
    setReason('');
    setError(null);
    onClose();
  };

  // Calculate changes
  const calorieChange = review.recommended_calories - program.calorie_target;
  const proteinChange = review.recommended_protein - program.protein_target;
  const carbsChange = review.recommended_carbs - program.carbs_target;
  const fatChange = review.recommended_fat - program.fat_target;

  const hasChanges = calorieChange !== 0 || proteinChange !== 0 || carbsChange !== 0 || fatChange !== 0;

  const formatChange = (change: number) => {
    if (change === 0) return '—';
    return `${change > 0 ? '+' : ''}${change}`;
  };

  const changeColor = (change: number) => {
    if (change === 0) return 'text-gray-500 dark:text-gray-400';
    return change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Week {review.review_week} Performance Review
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(review.review_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {action === 'view' && (
            <>
              {/* Performance Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Weekly Performance Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Days Tracked</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {review.days_analyzed}/7
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Compliance</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {review.compliance_rate}%
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Calories</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {review.avg_calories}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      vs {program.calorie_target} target
                    </div>
                  </div>
                  {review.weight_change_kg !== null && (
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Weight Change</div>
                      <div className={`text-2xl font-bold ${review.weight_change_kg < 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {review.weight_change_kg > 0 ? '+' : ''}{review.weight_change_kg.toFixed(1)} kg
                      </div>
                    </div>
                  )}
                </div>

                {/* Weekly Macros */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Protein</div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-400">
                      {review.avg_protein}g
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      vs {program.protein_target}g target
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Carbs</div>
                    <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                      {review.avg_carbs}g
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      vs {program.carbs_target}g target
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Fat</div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
                      {review.avg_fat}g
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      vs {program.fat_target}g target
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  AI Coach Analysis
                </h3>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">🤖</div>
                    <div className="flex-1">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {review.ai_analysis}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Confidence:</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          review.confidence_level === 'high'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : review.confidence_level === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {review.confidence_level.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Macro Comparison */}
              {hasChanges && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Recommended Adjustments
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-4">
                      {/* Calories */}
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Calories</div>
                        <div className="text-sm">
                          <div className="text-gray-600 dark:text-gray-400">
                            Current: <span className="font-semibold">{program.calorie_target}</span>
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            New: {review.recommended_calories}
                          </div>
                          <div className={`text-sm font-medium ${changeColor(calorieChange)}`}>
                            {formatChange(calorieChange)}
                          </div>
                        </div>
                      </div>

                      {/* Protein */}
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Protein</div>
                        <div className="text-sm">
                          <div className="text-gray-600 dark:text-gray-400">
                            Current: <span className="font-semibold">{program.protein_target}g</span>
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            New: {review.recommended_protein}g
                          </div>
                          <div className={`text-sm font-medium ${changeColor(proteinChange)}`}>
                            {formatChange(proteinChange)}g
                          </div>
                        </div>
                      </div>

                      {/* Carbs */}
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Carbs</div>
                        <div className="text-sm">
                          <div className="text-gray-600 dark:text-gray-400">
                            Current: <span className="font-semibold">{program.carbs_target}g</span>
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            New: {review.recommended_carbs}g
                          </div>
                          <div className={`text-sm font-medium ${changeColor(carbsChange)}`}>
                            {formatChange(carbsChange)}g
                          </div>
                        </div>
                      </div>

                      {/* Fat */}
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Fat</div>
                        <div className="text-sm">
                          <div className="text-gray-600 dark:text-gray-400">
                            Current: <span className="font-semibold">{program.fat_target}g</span>
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            New: {review.recommended_fat}g
                          </div>
                          <div className={`text-sm font-medium ${changeColor(fatChange)}`}>
                            {formatChange(fatChange)}g
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!hasChanges && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    No macro adjustments needed - keep up the great work!
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="btn-secondary flex-1"
                >
                  Dismiss
                </button>
                {hasChanges && (
                  <>
                    <button
                      onClick={() => setAction('reject')}
                      className="btn-secondary flex-1"
                    >
                      Keep Current Macros
                    </button>
                    <button
                      onClick={() => setAction('accept')}
                      className="btn-primary flex-1"
                    >
                      Accept Recommendations
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {action === 'accept' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Accept Recommendations
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your program macros will be updated to the new recommended targets for the remainder of your program.
                </p>
                <div>
                  <label className="label">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Any thoughts or goals with these new macros..."
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAction('view')}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleAccept}
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Confirm & Update Macros'}
                </button>
              </div>
            </>
          )}

          {action === 'reject' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Keep Current Macros
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You'll continue with your current macro targets. You can always manually adjust them later if needed.
                </p>
                <div>
                  <label className="label">Reason (Optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Why are you keeping your current macros? (optional)"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAction('view')}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleReject}
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Confirm & Keep Current'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
