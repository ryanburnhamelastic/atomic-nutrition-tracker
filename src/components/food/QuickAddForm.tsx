import { useState } from 'react';
import { FoodEntry, MealType, CreateFoodEntryInput, UpdateFoodEntryInput } from '../../types';
import { foodEntriesApi } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface QuickAddFormProps {
  date: string;
  mealType: MealType;
  editEntry?: FoodEntry | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function QuickAddForm({ date, mealType, editEntry, onSuccess, onCancel }: QuickAddFormProps) {
  const isEditing = Boolean(editEntry);

  const [name, setName] = useState(editEntry?.name || '');
  const [servingSize, setServingSize] = useState(String(editEntry?.serving_size || '100'));
  const [servingUnit, setServingUnit] = useState(editEntry?.serving_unit || 'g');
  const [servings, setServings] = useState(String(editEntry?.servings || '1'));
  const [grams, setGrams] = useState('');
  const [inputMode, setInputMode] = useState<'servings' | 'grams'>('servings');
  const [calories, setCalories] = useState(String(editEntry?.calories || ''));
  const [protein, setProtein] = useState(String(editEntry?.protein || '0'));
  const [carbs, setCarbs] = useState(String(editEntry?.carbs || '0'));
  const [fat, setFat] = useState(String(editEntry?.fat || '0'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Food name is required');
      return;
    }

    if (!calories || Number(calories) < 0) {
      setError('Valid calorie amount is required');
      return;
    }

    setLoading(true);

    let response;

    // Determine values based on input mode
    let finalServingSize: number;
    let finalServingUnit: string;
    let finalServings: number;

    if (inputMode === 'grams') {
      // In grams mode: serving size = grams entered, servings = 1
      finalServingSize = Number(grams);
      finalServingUnit = 'g';
      finalServings = 1;
    } else {
      // In servings mode: use the form values
      finalServingSize = Number(servingSize);
      finalServingUnit = servingUnit.trim();
      finalServings = Number(servings);
    }

    if (isEditing && editEntry) {
      const updateData: UpdateFoodEntryInput = {
        mealType,
        servings: finalServings,
        name: name.trim(),
        servingSize: finalServingSize,
        servingUnit: finalServingUnit,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
      };
      response = await foodEntriesApi.update(editEntry.id, updateData);
    } else {
      const createData: CreateFoodEntryInput = {
        date,
        mealType,
        servings: finalServings,
        name: name.trim(),
        servingSize: finalServingSize,
        servingUnit: finalServingUnit,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
      };
      response = await foodEntriesApi.create(createData);
    }

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Food Name */}
      <div>
        <label htmlFor="name" className="label">Food Name</label>
        <input
          id="name"
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Chicken Breast"
          autoFocus
        />
      </div>

      {/* Input Mode Toggle */}
      <div>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setInputMode('servings')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              inputMode === 'servings'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Servings
          </button>
          <button
            type="button"
            onClick={() => setInputMode('grams')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              inputMode === 'grams'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Grams
          </button>
        </div>

        {inputMode === 'servings' ? (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="servingSize" className="label">Serving Size</label>
              <input
                id="servingSize"
                type="number"
                className="input"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label htmlFor="servingUnit" className="label">Unit</label>
              <select
                id="servingUnit"
                className="input"
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value)}
              >
                <option value="g">g</option>
                <option value="oz">oz</option>
                <option value="ml">ml</option>
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
                <option value="piece">piece</option>
                <option value="serving">serving</option>
              </select>
            </div>
            <div>
              <label htmlFor="servings" className="label">Servings</label>
              <input
                id="servings"
                type="number"
                className="input"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                min="0.1"
                step="0.1"
              />
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="grams" className="label">Total Amount (grams)</label>
            <input
              id="grams"
              type="number"
              className="input"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              min="1"
              step="1"
              placeholder="e.g., 150"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the total grams you ate. Nutrition values below should be for this total amount.
            </p>
          </div>
        )}
      </div>

      {/* Calories */}
      <div>
        <label htmlFor="calories" className="label">
          Calories {inputMode === 'servings' ? '(per serving)' : '(total)'}
        </label>
        <input
          id="calories"
          type="number"
          className="input"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="0"
          min="0"
        />
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="protein" className="label">
            Protein (g) {inputMode === 'grams' && '(total)'}
          </label>
          <input
            id="protein"
            type="number"
            className="input"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
        <div>
          <label htmlFor="carbs" className="label">
            Carbs (g) {inputMode === 'grams' && '(total)'}
          </label>
          <input
            id="carbs"
            type="number"
            className="input"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
        <div>
          <label htmlFor="fat" className="label">
            Fat (g) {inputMode === 'grams' && '(total)'}
          </label>
          <input
            id="fat"
            type="number"
            className="input"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : isEditing ? 'Update' : 'Add Food'}
        </button>
      </div>
    </form>
  );
}
