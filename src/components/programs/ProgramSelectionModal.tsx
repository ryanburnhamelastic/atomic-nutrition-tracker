import { useState, useEffect } from 'react';
import { PROGRAM_TEMPLATES, calculateMacrosFromTemplate, UserStats as ProgramUserStats } from '../../lib/programTemplates';
import { userProgramsApi, geminiApi } from '../../lib/api';
import { GoalGenerationInput } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProgramSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentWeight?: number;
}

export default function ProgramSelectionModal({ isOpen, onClose, onSuccess }: ProgramSelectionModalProps) {
  const [step, setStep] = useState<'select' | 'configure'>(('select'));
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetWeight, setTargetWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [userStats, setUserStats] = useState<ProgramUserStats>({
    age: 30,
    sex: 'male',
    weightKg: 80,
    heightCm: 175,
    activityLevel: 'moderate',
  });
  const [loading, setLoading] = useState(false);

  // Custom program macros (used when selectedTemplateId === 'custom')
  const [customMacros, setCustomMacros] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });
  const [autoCalcCalories, setAutoCalcCalories] = useState(false);

  // AI goal generation state
  const [aiLoading, setAILoading] = useState(false);
  const [aiGenerated, setAIGenerated] = useState(false);
  const [aiForm, setAIForm] = useState<GoalGenerationInput>({
    age: 30,
    sex: 'male',
    heightCm: 175,
    weightKg: 75,
    activityLevel: 'moderate',
    goal: 'maintain',
  });
  const [aiMacros, setAIMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Auto-calculate calories from macros when enabled
  useEffect(() => {
    if (autoCalcCalories && selectedTemplateId === 'custom') {
      const calculatedCalories = (customMacros.protein * 4) + (customMacros.carbs * 4) + (customMacros.fat * 9);
      setCustomMacros(prev => ({ ...prev, calories: Math.round(calculatedCalories) }));
    }
  }, [customMacros.protein, customMacros.carbs, customMacros.fat, autoCalcCalories, selectedTemplateId]);

  if (!isOpen) return null;

  const selectedTemplate = PROGRAM_TEMPLATES.find(t => t.id === selectedTemplateId);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setStep('configure');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedTemplateId(null);
  };

  const handleGenerateAI = async () => {
    setAILoading(true);
    const response = await geminiApi.generateGoals(aiForm);
    setAILoading(false);

    if (response.data) {
      setAIMacros({
        calories: response.data.calorieTarget,
        protein: response.data.proteinTarget,
        carbs: response.data.carbsTarget,
        fat: response.data.fatTarget,
      });
      setAIGenerated(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      // Determine which macros to use based on template type
      let macros;
      let startingWeight = userStats.weightKg;

      if (selectedTemplate.id === 'custom') {
        macros = customMacros;
      } else if (selectedTemplate.id === 'ai_generated') {
        macros = aiMacros;
        startingWeight = aiForm.weightKg;
      } else {
        macros = calculateMacrosFromTemplate(userStats, selectedTemplate);
      }

      await userProgramsApi.create({
        programId: selectedTemplate.id,
        startDate,
        durationWeeks,
        startingWeightKg: startingWeight,
        targetWeightKg: targetWeight ? Number(targetWeight) : undefined,
        calorieTarget: macros.calories,
        proteinTarget: macros.protein,
        carbsTarget: macros.carbs,
        fatTarget: macros.fat,
        notes,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to create program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedTemplateId(null);
    setDurationWeeks(8);
    setTargetWeight('');
    setNotes('');
    onClose();
  };

  const macros = selectedTemplate ? calculateMacrosFromTemplate(userStats, selectedTemplate) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'select' ? 'Choose Your Program' : selectedTemplate?.name}
          </h2>
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
        <div className="p-6">
          {step === 'select' ? (
            /* Template Selection */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROGRAM_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg text-left hover:shadow-lg transition-all border-2 border-transparent hover:border-indigo-500"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                          {template.calorieModifier > 0 ? '+' : ''}{(template.calorieModifier * 100).toFixed(0)}% calories
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                          {template.proteinPerKg}g protein/kg
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Configuration */
            <div className="space-y-6">
              {selectedTemplate?.id === 'custom' ? (
                /* Custom Macros Input */
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Set Your Macros</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enter your custom calorie and macro targets for this program.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label">Calories</label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <input
                            type="checkbox"
                            checked={autoCalcCalories}
                            onChange={(e) => setAutoCalcCalories(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                          />
                          Auto-calc
                        </label>
                      </div>
                      <input
                        type="number"
                        value={customMacros.calories}
                        onChange={(e) => setCustomMacros({ ...customMacros, calories: Number(e.target.value) })}
                        className={`input ${autoCalcCalories ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                        min="0"
                        disabled={autoCalcCalories}
                      />
                      {autoCalcCalories && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          = ({customMacros.protein}g × 4) + ({customMacros.carbs}g × 4) + ({customMacros.fat}g × 9)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label">Protein (g)</label>
                      <input
                        type="number"
                        value={customMacros.protein}
                        onChange={(e) => setCustomMacros({ ...customMacros, protein: Number(e.target.value) })}
                        className="input"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="label">Carbs (g)</label>
                      <input
                        type="number"
                        value={customMacros.carbs}
                        onChange={(e) => setCustomMacros({ ...customMacros, carbs: Number(e.target.value) })}
                        className="input"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="label">Fat (g)</label>
                      <input
                        type="number"
                        value={customMacros.fat}
                        onChange={(e) => setCustomMacros({ ...customMacros, fat: Number(e.target.value) })}
                        className="input"
                        min="0"
                      />
                    </div>
                  </div>
                  {/* Only need weight for custom program */}
                  <div className="mt-4 max-w-xs">
                    <label className="label">Your Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={userStats.weightKg}
                      onChange={(e) => setUserStats({ ...userStats, weightKg: Number(e.target.value) })}
                      className="input"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Used for tracking weight progress
                    </p>
                  </div>
                </div>
              ) : selectedTemplate?.id === 'ai_generated' ? (
                /* AI Goal Generation */
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {aiGenerated ? 'AI Generated Targets' : 'Tell Us About Yourself'}
                  </h3>
                  {!aiGenerated ? (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Enter your details and let AI calculate personalized nutrition goals based on evidence-based formulas.
                      </p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="label">Age</label>
                          <input
                            type="number"
                            className="input"
                            value={aiForm.age}
                            onChange={(e) => setAIForm({ ...aiForm, age: Number(e.target.value) })}
                            min="13"
                            max="120"
                          />
                        </div>
                        <div>
                          <label className="label">Sex</label>
                          <select
                            className="input"
                            value={aiForm.sex}
                            onChange={(e) => setAIForm({ ...aiForm, sex: e.target.value as 'male' | 'female' })}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Height (cm)</label>
                          <input
                            type="number"
                            className="input"
                            value={aiForm.heightCm}
                            onChange={(e) => setAIForm({ ...aiForm, heightCm: Number(e.target.value) })}
                            min="100"
                            max="250"
                          />
                        </div>
                        <div>
                          <label className="label">Weight (kg)</label>
                          <input
                            type="number"
                            className="input"
                            value={aiForm.weightKg}
                            onChange={(e) => setAIForm({ ...aiForm, weightKg: Number(e.target.value) })}
                            min="30"
                            max="300"
                            step="0.1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="label">Activity Level</label>
                          <select
                            className="input"
                            value={aiForm.activityLevel}
                            onChange={(e) => setAIForm({ ...aiForm, activityLevel: e.target.value as GoalGenerationInput['activityLevel'] })}
                          >
                            <option value="sedentary">Sedentary</option>
                            <option value="light">Lightly Active</option>
                            <option value="moderate">Moderately Active</option>
                            <option value="active">Active</option>
                            <option value="very_active">Very Active</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Goal</label>
                          <select
                            className="input"
                            value={aiForm.goal}
                            onChange={(e) => setAIForm({ ...aiForm, goal: e.target.value as GoalGenerationInput['goal'] })}
                          >
                            <option value="lose_weight">Lose Weight</option>
                            <option value="maintain">Maintain Weight</option>
                            <option value="gain_muscle">Build Muscle</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={handleGenerateAI}
                        disabled={aiLoading}
                        className="btn btn-primary w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {aiLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            Generating...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            ✨ Generate My Targets
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    /* AI Generated Results */
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="grid grid-cols-4 gap-4 text-center mb-4">
                        <div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{aiMacros.calories}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Calories</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{aiMacros.protein}g</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Protein</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{aiMacros.carbs}g</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Carbs</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{aiMacros.fat}g</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Fat</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setAIGenerated(false)}
                        className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        ← Regenerate with different inputs
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* User Stats Input */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Age</label>
                        <input
                          type="number"
                          value={userStats.age}
                          onChange={(e) => setUserStats({ ...userStats, age: Number(e.target.value) })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Sex</label>
                        <select
                          value={userStats.sex}
                          onChange={(e) => setUserStats({ ...userStats, sex: e.target.value as 'male' | 'female' })}
                          className="input"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={userStats.weightKg}
                          onChange={(e) => setUserStats({ ...userStats, weightKg: Number(e.target.value) })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Height (cm)</label>
                        <input
                          type="number"
                          value={userStats.heightCm}
                          onChange={(e) => setUserStats({ ...userStats, heightCm: Number(e.target.value) })}
                          className="input"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Activity Level</label>
                        <select
                          value={userStats.activityLevel}
                          onChange={(e) => setUserStats({ ...userStats, activityLevel: e.target.value as any })}
                          className="input"
                        >
                          <option value="sedentary">Sedentary (little/no exercise)</option>
                          <option value="light">Light (1-3 days/week)</option>
                          <option value="moderate">Moderate (3-5 days/week)</option>
                          <option value="active">Active (6-7 days/week)</option>
                          <option value="very_active">Very Active (physical job + exercise)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Macros Preview */}
                  {macros && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Calculated Targets</h4>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{macros.calories}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Calories</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{macros.protein}g</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Protein</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{macros.carbs}g</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Carbs</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{macros.fat}g</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Fat</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Program Config */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Program Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Duration</label>
                    <select
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(Number(e.target.value))}
                      className="input"
                    >
                      <option value={4}>4 weeks</option>
                      <option value={6}>6 weeks</option>
                      <option value={8}>8 weeks</option>
                      <option value={12}>12 weeks</option>
                      <option value={16}>16 weeks</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Target Weight (kg) - Optional</label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      placeholder="Leave blank to skip"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any goals or notes for this program..."
                  className="input"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Starting Program...' : `Start ${durationWeeks}-Week Program`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
