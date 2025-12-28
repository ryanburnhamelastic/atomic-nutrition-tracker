import { useState, useEffect, useCallback } from 'react';
import { customFoodsApi } from '../lib/api';
import { CustomFood, CreateCustomFoodInput } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function MyFoods() {
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    const response = await customFoodsApi.list();
    if (response.data) {
      setFoods(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this food?')) return;

    const response = await customFoodsApi.delete(id);
    if (!response.error) {
      setFoods(foods.filter((f) => f.id !== id));
    }
  };

  const handleEdit = (food: CustomFood) => {
    setEditingFood(food);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingFood(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchFoods();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Foods</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create and manage your custom foods
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Add Food
        </button>
      </div>

      {showForm && (
        <FoodForm
          food={editingFood}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : foods.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You haven't created any custom foods yet.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Create Your First Food
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {foods.map((food) => (
            <div
              key={food.id}
              className="card flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {food.name}
                </p>
                {food.brand && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {food.brand}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {food.serving_size} {food.serving_unit} • {food.calories} cal
                </p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>P: {food.protein}g</span>
                  <span>C: {food.carbs}g</span>
                  <span>F: {food.fat}g</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEdit(food)}
                  className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                  aria-label="Edit"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(food.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Delete"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Food Form Component
interface FoodFormProps {
  food: CustomFood | null;
  onClose: () => void;
  onSuccess: () => void;
}

function FoodForm({ food, onClose, onSuccess }: FoodFormProps) {
  const [name, setName] = useState(food?.name || '');
  const [brand, setBrand] = useState(food?.brand || '');
  const [servingSize, setServingSize] = useState(String(food?.serving_size || '100'));
  const [servingUnit, setServingUnit] = useState(food?.serving_unit || 'g');
  const [calories, setCalories] = useState(String(food?.calories || ''));
  const [protein, setProtein] = useState(String(food?.protein || '0'));
  const [carbs, setCarbs] = useState(String(food?.carbs || '0'));
  const [fat, setFat] = useState(String(food?.fat || '0'));
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

    const data: CreateCustomFoodInput = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      servingSize: Number(servingSize),
      servingUnit: servingUnit.trim(),
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
    };

    const response = food
      ? await customFoodsApi.update(food.id, data)
      : await customFoodsApi.create(data);

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    onSuccess();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {food ? 'Edit Food' : 'Create Custom Food'}
        </h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="error-message">{error}</div>}

        <div>
          <label htmlFor="name" className="label">Food Name</label>
          <input
            id="name"
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Homemade Granola"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="brand" className="label">Brand (optional)</label>
          <input
            id="brand"
            type="text"
            className="input"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., My Kitchen"
          />
        </div>

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
            <label htmlFor="calories" className="label">Calories</label>
            <input
              id="calories"
              type="number"
              className="input"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              min="0"
            />
          </div>
        </div>

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

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
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
            {loading ? <LoadingSpinner size="sm" /> : food ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
