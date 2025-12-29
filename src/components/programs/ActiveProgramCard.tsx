import { UserProgram } from '../../types';
import { PROGRAM_TEMPLATES } from '../../lib/programTemplates';
import { useAuthContext } from '../../contexts/AuthContext';
import { formatWeight } from '../../lib/units';

interface ActiveProgramCardProps {
  program: UserProgram;
  currentWeight?: number;
  onChangeProgram: () => void;
}

export default function ActiveProgramCard({ program, currentWeight, onChangeProgram }: ActiveProgramCardProps) {
  const { user } = useAuthContext();
  const unitSystem = user?.unit_system || 'metric';
  const template = PROGRAM_TEMPLATES.find(t => t.id === program.program_id);

  // Calculate progress
  const startDate = new Date(program.start_date);
  const endDate = new Date(program.end_date);
  const today = new Date();

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysPassed);

  const weeksPassed = Math.floor(daysPassed / 7);
  const totalWeeks = program.duration_weeks;
  const progressPercent = Math.min(100, Math.round((daysPassed / totalDays) * 100));

  // Calculate weight progress
  const startWeight = program.starting_weight_kg ? Number(program.starting_weight_kg) : null;
  const targetWeight = program.target_weight_kg ? Number(program.target_weight_kg) : null;
  const weightChange = currentWeight && startWeight ? currentWeight - startWeight : null;

  return (
    <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{template?.icon || '📊'}</div>
          <div>
            <h3 className="text-xl font-bold">{template?.name || program.program_id}</h3>
            <p className="text-indigo-100 text-sm">
              Week {weeksPassed + 1} of {totalWeeks}
            </p>
          </div>
        </div>
        <button
          onClick={onChangeProgram}
          className="text-indigo-100 hover:text-white text-sm underline"
        >
          Change Program
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>{progressPercent}% Complete</span>
          <span>{daysRemaining} days left</span>
        </div>
        <div className="w-full bg-indigo-900/50 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-indigo-100 mb-1">Calories</div>
          <div className="text-lg font-bold">{program.calorie_target}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-indigo-100 mb-1">Protein</div>
          <div className="text-lg font-bold">{program.protein_target}g</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-indigo-100 mb-1">Carbs</div>
          <div className="text-lg font-bold">{program.carbs_target}g</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-indigo-100 mb-1">Fat</div>
          <div className="text-lg font-bold">{program.fat_target}g</div>
        </div>
      </div>

      {/* Weight Progress */}
      {startWeight && (
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Weight Progress</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-indigo-100">Start</div>
              <div className="text-lg font-bold">{formatWeight(startWeight, unitSystem)}</div>
            </div>
            {currentWeight && (
              <>
                <div className="flex-1 mx-4">
                  <svg className="w-full h-2" viewBox="0 0 100 8">
                    <line x1="0" y1="4" x2="100" y2="4" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                    <circle cx="50" cy="4" r="4" fill="white" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-indigo-100">Current</div>
                  <div className="text-lg font-bold">
                    {formatWeight(currentWeight, unitSystem)}
                    {weightChange !== null && (
                      <span className={`text-sm ml-2 ${weightChange > 0 ? 'text-amber-200' : 'text-green-200'}`}>
                        {weightChange > 0 ? '+' : ''}{formatWeight(Math.abs(weightChange), unitSystem)}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
            {targetWeight && (
              <>
                <div className="flex-1 mx-4">
                  <svg className="w-full h-2" viewBox="0 0 100 8">
                    <line x1="0" y1="4" x2="100" y2="4" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-indigo-100">Target</div>
                  <div className="text-lg font-bold">{formatWeight(targetWeight, unitSystem)}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {program.notes && (
        <div className="mt-4 text-sm text-indigo-100 italic">
          "{program.notes}"
        </div>
      )}
    </div>
  );
}
