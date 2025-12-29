import { useState, useRef } from 'react';
import { GeminiFood, MealType } from '../../types';
import { geminiApi, foodEntriesApi } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface AIFoodInputProps {
  date: string;
  mealType: MealType;
  onSuccess: () => void;
}

type InputMode = 'photo' | 'text';

export default function AIFoodInput({ date, mealType, onSuccess }: AIFoodInputProps) {
  const [mode, setMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeminiFood[]>([]);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please use an image under 10MB.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      const mimeType = file.type;

      // Call Gemini API
      const response = await geminiApi.analyzeImage(base64, mimeType);

      if (response.error) {
        setError(response.error);
      } else if (response.data?.foods?.length) {
        setResults(response.data.foods);
      } else {
        setError('No foods detected in image. Try a clearer photo.');
      }
    } catch {
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTextParse = async () => {
    if (!textInput.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await geminiApi.parseText(textInput.trim());

      if (response.error) {
        setError(response.error);
      } else if (response.data?.foods?.length) {
        setResults(response.data.foods);
      } else {
        setError('Could not parse foods from text. Try being more specific.');
      }
    } catch {
      setError('Failed to parse text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async (food: GeminiFood, index: number) => {
    setAddingIndex(index);

    const response = await foodEntriesApi.create({
      date,
      mealType,
      servings: 1,
      name: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });

    setAddingIndex(null);

    if (!response.error) {
      // Remove from results
      setResults(prev => prev.filter((_, i) => i !== index));
      onSuccess();
    }
  };

  const handleAddAll = async () => {
    setLoading(true);

    for (let i = 0; i < results.length; i++) {
      const food = results[i];
      await foodEntriesApi.create({
        date,
        mealType,
        servings: 1,
        name: food.name,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });
    }

    setResults([]);
    setTextInput('');
    setLoading(false);
    onSuccess();
  };

  const handleClear = () => {
    setResults([]);
    setTextInput('');
    setError(null);
  };

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Food Entry
        </h2>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setMode('text')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              mode === 'text'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setMode('photo')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              mode === 'photo'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Photo
          </button>
        </div>
      </div>

      {/* Text Input Mode */}
      {mode === 'text' && !results.length && (
        <div className="space-y-3">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Describe your food, e.g. '2 scrambled eggs with toast and butter'"
            className="input min-h-[80px] resize-none"
            disabled={loading}
          />
          <button
            onClick={handleTextParse}
            disabled={loading || !textInput.trim()}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Parsing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Parse with AI
              </span>
            )}
          </button>
        </div>
      )}

      {/* Photo Input Mode */}
      {mode === 'photo' && !results.length && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
            id="food-photo-input"
          />
          <label
            htmlFor="food-photo-input"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              loading
                ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                : 'border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="md" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Analyzing photo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tap to take or upload a photo
                </span>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found {results.length} food{results.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Clear
              </button>
              {results.length > 1 && (
                <button
                  onClick={handleAddAll}
                  disabled={loading}
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                >
                  Add All
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {results.map((food, index) => (
              <div key={index} className="py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {food.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {food.servingSize} {food.servingUnit} - {food.calories} cal
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                  </p>
                </div>
                <button
                  onClick={() => handleAddFood(food, index)}
                  disabled={addingIndex === index}
                  className="ml-3 p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50"
                  aria-label="Add food"
                >
                  {addingIndex === index ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Convert a File to base64 string (without data URL prefix)
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
