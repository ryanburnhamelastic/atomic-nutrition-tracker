import { UserProgram } from '../../types';
import { PROGRAM_TEMPLATES } from '../../lib/programTemplates';

interface ProgramCompletionModalProps {
  isOpen: boolean;
  completedProgram: UserProgram | null;
  onClose: () => void;
  onStartNewProgram: () => void;
}

export default function ProgramCompletionModal({
  isOpen,
  completedProgram,
  onClose,
  onStartNewProgram
}: ProgramCompletionModalProps) {
  if (!isOpen || !completedProgram) return null;

  const template = PROGRAM_TEMPLATES.find(t => t.id === completedProgram.program_id);
  const startWeight = completedProgram.starting_weight_kg ? Number(completedProgram.starting_weight_kg) : null;
  const endWeight = completedProgram.ending_weight_kg ? Number(completedProgram.ending_weight_kg) : null;
  const weightChange = startWeight && endWeight ? endWeight - startWeight : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
        {/* Celebration Header */}
        <div className="p-6 text-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-lg">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Program Complete!
          </h2>
          <p className="text-indigo-100">
            You completed {completedProgram.duration_weeks} weeks of {template?.name}!
          </p>
        </div>

        {/* Results */}
        <div className="p-6 space-y-4">
          {/* Weight Change */}
          {weightChange !== null && (
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Weight Change</div>
              <div className={`text-3xl font-bold ${
                weightChange < 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {startWeight?.toFixed(1)} kg → {endWeight?.toFixed(1)} kg
              </div>
            </div>
          )}

          {/* Program Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Duration</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {completedProgram.duration_weeks} weeks
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Program</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {template?.icon} {template?.name}
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What's Next?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose your next program to continue your fitness journey. Your progress is saved in your program history.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              View History
            </button>
            <button
              onClick={onStartNewProgram}
              className="btn-primary flex-1"
            >
              Start New Program
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
