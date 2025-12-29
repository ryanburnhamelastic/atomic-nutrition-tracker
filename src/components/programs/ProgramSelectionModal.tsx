import { useState } from 'react';
import { PROGRAM_TEMPLATES, calculateMacrosFromTemplate, UserStats as ProgramUserStats } from '../../lib/programTemplates';
import { userProgramsApi } from '../../lib/api';

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

  const handleSubmit = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      // Use custom macros if custom template, otherwise calculate from template
      const macros = selectedTemplate.id === 'custom'
        ? customMacros
        : calculateMacrosFromTemplate(userStats, selectedTemplate);

      await userProgramsApi.create({
        programId: selectedTemplate.id,
        startDate,
        durationWeeks,
        startingWeightKg: userStats.weightKg,
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
                      <label className="label">Calories</label>
                      <input
                        type="number"
                        value={customMacros.calories}
                        onChange={(e) => setCustomMacros({ ...customMacros, calories: Number(e.target.value) })}
                        className="input"
                        min="0"
                      />
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
