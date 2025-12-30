import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Food, MealType, BarcodeScanResult } from '../../types';
import { barcodeApi, foodEntriesApi } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface BarcodeScannerSectionProps {
  date: string;
  mealType: MealType;
  onSuccess: () => void;
}

type ScannerState = 'idle' | 'scanning' | 'loading' | 'error';

export default function BarcodeScannerSection({ date, mealType, onSuccess }: BarcodeScannerSectionProps) {
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servings, setServings] = useState('1');
  const [grams, setGrams] = useState('');
  const [inputMode, setInputMode] = useState<'servings' | 'grams'>('servings');
  const [adding, setAdding] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'barcode-scanner';

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleStartScan = async () => {
    try {
      setScannerState('scanning');
      setErrorMessage('');

      // Check for HTTPS (required for camera access)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setErrorMessage('Camera requires HTTPS connection. Please use a secure connection.');
        setScannerState('error');
        return;
      }

      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Camera not supported on this browser. Please try Chrome or Safari.');
        setScannerState('error');
        return;
      }

      // Initialize scanner
      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      // Get available cameras
      let cameras;
      try {
        cameras = await Html5Qrcode.getCameras();
        console.log('Available cameras:', cameras);
      } catch (cameraListError) {
        console.error('Failed to get cameras:', cameraListError);
        setErrorMessage('Failed to access camera. Please ensure camera permissions are granted.');
        setScannerState('error');
        return;
      }

      if (!cameras || cameras.length === 0) {
        setErrorMessage('No cameras found on this device.');
        setScannerState('error');
        return;
      }

      // Find back camera (environment facing) or use first available
      let cameraId = cameras[0].id;
      const backCamera = cameras.find(camera =>
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      );
      if (backCamera) {
        cameraId = backCamera.id;
        console.log('Using back camera:', backCamera.label);
      } else {
        console.log('Using first available camera:', cameras[0].label);
      }

      // Start scanning with specific camera ID
      try {
        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          async (decodedText: string, decodedResult: any) => {
            await handleScanSuccess({ decodedText, format: decodedResult.result.format.formatName });
          },
          (_errorMessage: string) => {
            // Scan error (no barcode detected) - ignore these
          }
        );
        console.log('Scanner started successfully');
      } catch (startError) {
        console.error('Scanner start error:', startError);
        throw startError;
      }
    } catch (error: any) {
      console.error('Scanner start error:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);

      if (error?.name === 'NotAllowedError' || error?.message?.includes('permission')) {
        setErrorMessage('Camera access denied. Please check your browser permissions and try again.');
      } else if (error?.name === 'NotFoundError' || error?.message?.includes('not find')) {
        setErrorMessage('No camera found on this device.');
      } else if (error?.name === 'NotReadableError' || error?.message?.includes('in use')) {
        setErrorMessage('Camera is already in use by another app. Please close other apps and try again.');
      } else if (error?.name === 'OverconstrainedError') {
        setErrorMessage('Camera constraints not supported. Try using the front camera instead.');
      } else if (error?.message?.includes('secure')) {
        setErrorMessage('Camera requires HTTPS. Please ensure you are using a secure connection.');
      } else {
        setErrorMessage(`Camera error: ${error?.message || 'Unknown error'}. Please try again.`);
      }
      setScannerState('error');
    }
  };

  const handleScanSuccess = async (result: BarcodeScanResult) => {
    try {
      // Stop scanner
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      setScannerState('loading');
      setErrorMessage('');

      // Lookup barcode in FatSecret database
      const response = await barcodeApi.lookup(result.decodedText);

      if (response.error) {
        setErrorMessage(
          response.error.includes('not found')
            ? 'Product not found in database. Try searching by name instead.'
            : response.error
        );
        setScannerState('error');
        return;
      }

      if (response.data?.food) {
        // Show serving selector modal
        setSelectedFood(response.data.food);
        setServings('1');
        setGrams(response.data.food.serving_size.toString());
        setInputMode('servings');
        setScannerState('idle');
      } else {
        setErrorMessage('Failed to retrieve product details.');
        setScannerState('error');
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      setErrorMessage('Failed to look up barcode. Please try again.');
      setScannerState('error');
    }
  };

  const handleStopScan = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setScannerState('idle');
    setErrorMessage('');
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

  const handleRetry = () => {
    setErrorMessage('');
    setScannerState('idle');
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

      {/* Scanner States */}
      {scannerState === 'idle' && !selectedFood && (
        <button
          onClick={handleStartScan}
          className="w-full btn btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Scan Barcode
        </button>
      )}

      {scannerState === 'scanning' && (
        <div>
          {/* Scanner viewfinder */}
          <div id={scannerElementId} className="rounded-lg overflow-hidden mb-3"></div>

          <div className="text-center mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Point your camera at a product barcode
            </p>
          </div>

          <button
            onClick={handleStopScan}
            className="w-full btn btn-secondary"
          >
            Cancel Scan
          </button>
        </div>
      )}

      {scannerState === 'loading' && (
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            Looking up product...
          </p>
        </div>
      )}

      {scannerState === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {errorMessage}
              </p>
              {errorMessage.includes('permission') && (
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Go to your browser settings and allow camera access for this site.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="w-full btn btn-secondary"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
