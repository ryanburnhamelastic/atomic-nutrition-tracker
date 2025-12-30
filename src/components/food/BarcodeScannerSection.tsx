import { useState, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Food, MealType } from '../../types';
import { barcodeApi, foodEntriesApi } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface BarcodeScannerSectionProps {
  date: string;
  mealType: MealType;
  onSuccess: () => void;
}

export default function BarcodeScannerSection({ date, mealType, onSuccess }: BarcodeScannerSectionProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servings, setServings] = useState('1');
  const [grams, setGrams] = useState('');
  const [inputMode, setInputMode] = useState<'servings' | 'grams'>('servings');
  const [adding, setAdding] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Create an image element from the file
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Scan barcode from image using ZXing
      const codeReader = new BrowserMultiFormatReader();
      const result = await codeReader.decodeFromImageElement(img);

      console.log('Barcode detected:', result.getText());

      // Clean up
      URL.revokeObjectURL(imageUrl);

      // Lookup barcode in FatSecret database
      const response = await barcodeApi.lookup(result.getText());

      if (response.error) {
        setErrorMessage(
          response.error.includes('not found')
            ? 'Product not found in database. Try searching by name instead.'
            : response.error
        );
      } else if (response.data?.food) {
        // Show serving selector modal
        setSelectedFood(response.data.food);
        setServings('1');
        setGrams(response.data.food.serving_size.toString());
        setInputMode('servings');
      } else {
        setErrorMessage('Failed to retrieve product details.');
      }
    } catch (error: any) {
      console.error('Barcode scan error:', error);
      if (error?.message?.includes('No barcode') || error?.message?.includes('NotFoundException')) {
        setErrorMessage('No barcode found in image. Please take a clearer photo of the barcode.');
      } else {
        setErrorMessage('Failed to scan barcode. Please try again with a clearer photo.');
      }
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectedFood(null);
    setServings('1');
    setGrams('');
    setInputMode('servings');
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    // Calculate servings based on input mode
    let servingCount: number;
    if (inputMode === 'grams') {
      const gramsValue = parseFloat(grams) || 0;
      servingCount = gramsValue / selectedFood.serving_size;
    } else {
      servingCount = parseFloat(servings) || 1;
    }

    setAdding(true);

    const response = await foodEntriesApi.create({
      date,
      mealType,
      servings: servingCount,
      name: selectedFood.name,
      servingSize: selectedFood.serving_size,
      servingUnit: selectedFood.serving_unit,
      calories: selectedFood.calories,
      protein: selectedFood.protein,
      carbs: selectedFood.carbs,
      fat: selectedFood.fat,
    });

    setAdding(false);
    setSelectedFood(null);
    setServings('1');
    setGrams('');
    setInputMode('servings');

    if (!response.error) {
      onSuccess();
    }
  };

  // Calculate nutrition for current servings/grams
  let servingCount: number;
  if (inputMode === 'grams' && selectedFood) {
    const gramsValue = parseFloat(grams) || 0;
    servingCount = gramsValue / selectedFood.serving_size;
  } else {
    servingCount = parseFloat(servings) || 1;
  }
  const calculatedNutrition = selectedFood ? {
    calories: Math.round(selectedFood.calories * servingCount),
    protein: Math.round(selectedFood.protein * servingCount * 10) / 10,
    carbs: Math.round(selectedFood.carbs * servingCount * 10) / 10,
    fat: Math.round(selectedFood.fat * servingCount * 10) / 10,
  } : null;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        Barcode Scanner
      </h2>

      {/* Serving Selector Modal (reused from FoodSearchSection) */}
      {selectedFood && (
        <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {selectedFood.name}
              </h3>
              {selectedFood.brand && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedFood.brand}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedFood.serving_size} {selectedFood.serving_unit} per serving
              </p>
            </div>
            <button
              onClick={handleCancelSelection}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Cancel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Input Mode Toggle */}
          <div className="mb-3">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setInputMode('servings')}
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
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
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                  inputMode === 'grams'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Grams
              </button>
            </div>

            {inputMode === 'servings' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of servings
                </label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="input w-32"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount in grams
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="input w-32"
                  placeholder="e.g., 150"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  1 serving = {selectedFood.serving_size}g
                </p>
              </div>
            )}
          </div>

          {/* Calculated Nutrition */}
          {calculatedNutrition && (
            <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
              <div className="bg-white dark:bg-gray-800 rounded p-2">
                <p className="text-gray-500 dark:text-gray-400">Calories</p>
                <p className="font-semibold text-gray-900 dark:text-white">{calculatedNutrition.calories}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2">
                <p className="text-gray-500 dark:text-gray-400">Protein</p>
                <p className="font-semibold text-gray-900 dark:text-white">{calculatedNutrition.protein}g</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2">
                <p className="text-gray-500 dark:text-gray-400">Carbs</p>
                <p className="font-semibold text-gray-900 dark:text-white">{calculatedNutrition.carbs}g</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2">
                <p className="text-gray-500 dark:text-gray-400">Fat</p>
                <p className="font-semibold text-gray-900 dark:text-white">{calculatedNutrition.fat}g</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancelSelection}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFood}
              disabled={
                adding ||
                (inputMode === 'servings' && (!servings || parseFloat(servings) <= 0)) ||
                (inputMode === 'grams' && (!grams || parseFloat(grams) <= 0))
              }
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {adding ? <LoadingSpinner size="sm" /> : 'Add to Meal'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Scan button or loading state */}
      {!selectedFood && !loading && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full btn btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Scan Barcode
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            Scanning barcode...
          </p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && !selectedFood && (
        <div className="mt-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
