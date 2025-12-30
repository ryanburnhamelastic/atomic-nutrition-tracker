import { useState, useEffect } from 'react';
import { WeightEntry } from '../../types';
import { weightEntriesApi } from '../../lib/api';
import { useNutrition } from '../../contexts/NutritionContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { formatWeight, convertWeight, toKg, getWeightUnit, getWeightStep } from '../../lib/units';
import LoadingSpinner from '../common/LoadingSpinner';

export default function WeightLogSection() {
  const { selectedDate } = useNutrition();
  const { user } = useAuthContext();
  const unitSystem = user?.unit_system || 'metric';

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [todayEntry, setTodayEntry] = useState<WeightEntry | null>(null);

  // Load recent weight entries
  useEffect(() => {
    loadEntries();
  }, []);

  // Check if today has an entry
  useEffect(() => {
    // Normalize entry dates (they may come as ISO timestamps from the database)
    const today = entries.find(e => e.date.split('T')[0] === selectedDate);
    setTodayEntry(today || null);
    if (today) {
      // Convert to display units
      const displayWeight = convertWeight(today.weight_kg, unitSystem);
      setWeightInput(displayWeight.toFixed(1));
    } else {
      setWeightInput('');
    }
  }, [entries, selectedDate, unitSystem]);

  const loadEntries = async () => {
    setLoading(true);
    const response = await weightEntriesApi.list(undefined, undefined, 7);
    if (response.data) {
      // Convert weight_kg from string to number (PostgreSQL DECIMAL comes as string)
      const normalizedEntries = response.data.map(entry => ({
        ...entry,
        weight_kg: Number(entry.weight_kg),
      }));
      setEntries(normalizedEntries);
    }
    setLoading(false);
  };

  const handleSaveWeight = async () => {
    const inputValue = parseFloat(weightInput);
    if (isNaN(inputValue) || inputValue <= 0) return;

    setSaving(true);

    // Convert to kg for storage
    const weightKg = toKg(inputValue, unitSystem);

    const response = await weightEntriesApi.create({
      date: selectedDate,
      weightKg,
    });

    if (!response.error) {
      await loadEntries();
    }

    setSaving(false);
  };

  // Normalize date string to YYYY-MM-DD format (handles both ISO timestamps and date strings)
  const normalizeDate = (dateStr: string): string => {
    return dateStr.split('T')[0];
  };

  const formatDate = (dateStr: string): string => {
    const normalized = normalizeDate(dateStr);
    const date = new Date(normalized + 'T00:00:00');
    const today = new Date(selectedDate + 'T00:00:00');
    const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate weight change
  const getWeightChange = (): { value: number; isLoss: boolean } | null => {
    if (entries.length < 2) return null;
    const latest = entries[0];
    const previous = entries[1];
    const change = latest.weight_kg - previous.weight_kg;
    return {
      value: convertWeight(Math.abs(change), unitSystem),
      isLoss: change < 0,
    };
  };

  const weightChange = getWeightChange();

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        Weight Log
      </h2>

      {loading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <>
          {/* Weight Input */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type="number"
                step={getWeightStep(unitSystem)}
                min="0"
                className="input pr-12"
                placeholder={`Enter weight`}
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {getWeightUnit(unitSystem)}
              </span>
            </div>
            <button
              onClick={handleSaveWeight}
              disabled={saving || !weightInput}
              className="btn btn-primary px-4 disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="sm" /> : todayEntry ? 'Update' : 'Log'}
            </button>
          </div>

          {/* Weight Change Indicator */}
          {weightChange && (
            <div className={`text-sm mb-4 flex items-center gap-1 ${
              weightChange.isLoss
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              <svg className={`w-4 h-4 ${weightChange.isLoss ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {weightChange.value.toFixed(1)} {getWeightUnit(unitSystem)} from last entry
            </div>
          )}

          {/* Recent Entries */}
          {entries.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent</p>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {entries.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(entry.date)}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatWeight(entry.weight_kg, unitSystem)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entries.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
              No weight entries yet. Start tracking today!
            </p>
          )}
        </>
      )}
    </div>
  );
}
