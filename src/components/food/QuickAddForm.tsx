import { useState } from 'react';
import { MealType, CreateFoodEntryInput } from '../../types';
import { foodEntriesApi } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface QuickAddFormProps {
  date: string;
  mealType: MealType;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function QuickAddForm({ date, mealType, onSuccess, onCancel }: QuickAddFormProps) {
  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [servings, setServings] = useState('1');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');
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

    const data: CreateFoodEntryInput = {
      date,
      mealType,
      servings: Number(servings),
      name: name.trim(),
      servingSize: Number(servingSize),
      servingUnit: servingUnit.trim(),
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
    };

    const response = await foodEntriesApi.create(data);

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

      {/* Serving Info */}
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

      {/* Calories */}
      <div>
        <label htmlFor="calories" className="label">Calories (per serving)</label>
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
          <label htmlFor="protein" className="label">Protein (g)</label>
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
          <label htmlFor="carbs" className="label">Carbs (g)</label>
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
          <label htmlFor="fat" className="label">Fat (g)</label>
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
          {loading ? <LoadingSpinner size="sm" /> : 'Add Food'}
        </button>
      </div>
    </form>
  );
}
