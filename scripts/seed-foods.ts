/**
 * Seed script for populating the foods database with 150+ common foods
 *
 * Run with: DATABASE_URL="your-connection-string" npx ts-node scripts/seed-foods.ts
 *
 * Requires DATABASE_URL environment variable to be set
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// 150+ Common foods data - nutrition per serving
const commonFoods = [
  // ========== PROTEINS (30 items) ==========
  { name: 'Chicken Breast (raw)', brand: null, serving_size: 100, serving_unit: 'g', calories: 120, protein: 22.5, carbs: 0, fat: 2.6, source: 'USDA' },
  { name: 'Chicken Breast (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6, source: 'USDA' },
  { name: 'Chicken Thigh (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 209, protein: 26, carbs: 0, fat: 10.9, source: 'USDA' },
  { name: 'Chicken Wings', brand: null, serving_size: 100, serving_unit: 'g', calories: 203, protein: 30.5, carbs: 0, fat: 8.1, source: 'USDA' },
  { name: 'Ground Beef (93% lean)', brand: null, serving_size: 100, serving_unit: 'g', calories: 152, protein: 21, carbs: 0, fat: 7, source: 'USDA' },
  { name: 'Ground Beef (85% lean)', brand: null, serving_size: 100, serving_unit: 'g', calories: 215, protein: 21, carbs: 0, fat: 13, source: 'USDA' },
  { name: 'Ground Beef (80% lean)', brand: null, serving_size: 100, serving_unit: 'g', calories: 254, protein: 17.2, carbs: 0, fat: 20, source: 'USDA' },
  { name: 'Beef Steak (sirloin)', brand: null, serving_size: 100, serving_unit: 'g', calories: 183, protein: 27, carbs: 0, fat: 8, source: 'USDA' },
  { name: 'Beef Steak (ribeye)', brand: null, serving_size: 100, serving_unit: 'g', calories: 291, protein: 24, carbs: 0, fat: 21, source: 'USDA' },
  { name: 'Pork Chop', brand: null, serving_size: 100, serving_unit: 'g', calories: 231, protein: 25, carbs: 0, fat: 14, source: 'USDA' },
  { name: 'Pork Tenderloin', brand: null, serving_size: 100, serving_unit: 'g', calories: 143, protein: 26, carbs: 0, fat: 3.5, source: 'USDA' },
  { name: 'Bacon', brand: null, serving_size: 3, serving_unit: 'slices', calories: 161, protein: 12, carbs: 0.4, fat: 12, source: 'USDA' },
  { name: 'Turkey Breast', brand: null, serving_size: 100, serving_unit: 'g', calories: 135, protein: 30, carbs: 0, fat: 1, source: 'USDA' },
  { name: 'Ground Turkey', brand: null, serving_size: 100, serving_unit: 'g', calories: 149, protein: 20, carbs: 0, fat: 8, source: 'USDA' },
  { name: 'Salmon (Atlantic)', brand: null, serving_size: 100, serving_unit: 'g', calories: 208, protein: 20, carbs: 0, fat: 13, source: 'USDA' },
  { name: 'Tuna (canned in water)', brand: null, serving_size: 100, serving_unit: 'g', calories: 116, protein: 26, carbs: 0, fat: 0.8, source: 'USDA' },
  { name: 'Tuna Steak', brand: null, serving_size: 100, serving_unit: 'g', calories: 132, protein: 29, carbs: 0, fat: 1, source: 'USDA' },
  { name: 'Shrimp', brand: null, serving_size: 100, serving_unit: 'g', calories: 85, protein: 20, carbs: 0.2, fat: 0.5, source: 'USDA' },
  { name: 'Cod', brand: null, serving_size: 100, serving_unit: 'g', calories: 82, protein: 18, carbs: 0, fat: 0.7, source: 'USDA' },
  { name: 'Tilapia', brand: null, serving_size: 100, serving_unit: 'g', calories: 96, protein: 20, carbs: 0, fat: 1.7, source: 'USDA' },
  { name: 'Eggs (whole)', brand: null, serving_size: 1, serving_unit: 'large', calories: 72, protein: 6, carbs: 0.4, fat: 5, source: 'USDA' },
  { name: 'Egg Whites', brand: null, serving_size: 100, serving_unit: 'g', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, source: 'USDA' },
  { name: 'Tofu (firm)', brand: null, serving_size: 100, serving_unit: 'g', calories: 144, protein: 17, carbs: 3, fat: 9, source: 'USDA' },
  { name: 'Tofu (silken)', brand: null, serving_size: 100, serving_unit: 'g', calories: 55, protein: 5, carbs: 2.4, fat: 2.7, source: 'USDA' },
  { name: 'Tempeh', brand: null, serving_size: 100, serving_unit: 'g', calories: 192, protein: 20, carbs: 8, fat: 11, source: 'USDA' },
  { name: 'Greek Yogurt (plain, nonfat)', brand: null, serving_size: 170, serving_unit: 'g', calories: 100, protein: 17, carbs: 6, fat: 0.7, source: 'USDA' },
  { name: 'Greek Yogurt (plain, whole)', brand: null, serving_size: 170, serving_unit: 'g', calories: 165, protein: 15, carbs: 6, fat: 9, source: 'USDA' },
  { name: 'Cottage Cheese (low fat)', brand: null, serving_size: 100, serving_unit: 'g', calories: 72, protein: 12, carbs: 3, fat: 1, source: 'USDA' },
  { name: 'Cottage Cheese (full fat)', brand: null, serving_size: 100, serving_unit: 'g', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, source: 'USDA' },
  { name: 'Whey Protein Powder', brand: null, serving_size: 30, serving_unit: 'g', calories: 120, protein: 24, carbs: 3, fat: 1.5, source: 'estimate' },

  // ========== GRAINS & CARBS (25 items) ==========
  { name: 'White Rice (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, source: 'USDA' },
  { name: 'Brown Rice (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 112, protein: 2.3, carbs: 24, fat: 0.8, source: 'USDA' },
  { name: 'Jasmine Rice (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 129, protein: 2.4, carbs: 28, fat: 0.2, source: 'USDA' },
  { name: 'Oatmeal (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 71, protein: 2.5, carbs: 12, fat: 1.5, source: 'USDA' },
  { name: 'Oats (dry)', brand: null, serving_size: 40, serving_unit: 'g', calories: 154, protein: 5.3, carbs: 27, fat: 2.8, source: 'USDA' },
  { name: 'Bread (whole wheat)', brand: null, serving_size: 1, serving_unit: 'slice', calories: 81, protein: 4, carbs: 14, fat: 1.1, source: 'USDA' },
  { name: 'Bread (white)', brand: null, serving_size: 1, serving_unit: 'slice', calories: 79, protein: 2.7, carbs: 15, fat: 1, source: 'USDA' },
  { name: 'Bread (sourdough)', brand: null, serving_size: 1, serving_unit: 'slice', calories: 93, protein: 4, carbs: 18, fat: 0.6, source: 'USDA' },
  { name: 'Bagel (plain)', brand: null, serving_size: 1, serving_unit: 'medium', calories: 277, protein: 11, carbs: 54, fat: 1.4, source: 'USDA' },
  { name: 'English Muffin', brand: null, serving_size: 1, serving_unit: 'muffin', calories: 132, protein: 5, carbs: 26, fat: 1, source: 'USDA' },
  { name: 'Tortilla (flour)', brand: null, serving_size: 1, serving_unit: 'medium', calories: 144, protein: 4, carbs: 24, fat: 3.5, source: 'USDA' },
  { name: 'Tortilla (corn)', brand: null, serving_size: 1, serving_unit: 'medium', calories: 52, protein: 1.4, carbs: 11, fat: 0.7, source: 'USDA' },
  { name: 'Pasta (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 131, protein: 5, carbs: 25, fat: 1.1, source: 'USDA' },
  { name: 'Spaghetti (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 131, protein: 5, carbs: 25, fat: 1.1, source: 'USDA' },
  { name: 'Quinoa (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, source: 'USDA' },
  { name: 'Sweet Potato (baked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 90, protein: 2, carbs: 21, fat: 0.1, source: 'USDA' },
  { name: 'Potato (baked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 93, protein: 2.5, carbs: 21, fat: 0.1, source: 'USDA' },
  { name: 'Potato (mashed)', brand: null, serving_size: 100, serving_unit: 'g', calories: 83, protein: 2, carbs: 17, fat: 1.2, source: 'USDA' },
  { name: 'French Fries', brand: null, serving_size: 100, serving_unit: 'g', calories: 312, protein: 3.4, carbs: 41, fat: 15, source: 'USDA' },
  { name: 'Couscous (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 112, protein: 3.8, carbs: 23, fat: 0.2, source: 'USDA' },
  { name: 'Corn (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 96, protein: 3.4, carbs: 21, fat: 1.5, source: 'USDA' },
  { name: 'Cereal (Cheerios)', brand: 'General Mills', serving_size: 28, serving_unit: 'g', calories: 100, protein: 3, carbs: 20, fat: 2, source: 'USDA' },
  { name: 'Cereal (Corn Flakes)', brand: 'Kellogg\'s', serving_size: 28, serving_unit: 'g', calories: 100, protein: 2, carbs: 24, fat: 0, source: 'USDA' },
  { name: 'Granola', brand: null, serving_size: 50, serving_unit: 'g', calories: 225, protein: 5, carbs: 32, fat: 9, source: 'USDA' },
  { name: 'Pancakes', brand: null, serving_size: 1, serving_unit: 'medium', calories: 86, protein: 2.4, carbs: 11, fat: 3.5, source: 'USDA' },

  // ========== FRUITS (25 items) ==========
  { name: 'Apple', brand: null, serving_size: 1, serving_unit: 'medium', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, source: 'USDA' },
  { name: 'Banana', brand: null, serving_size: 1, serving_unit: 'medium', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, source: 'USDA' },
  { name: 'Orange', brand: null, serving_size: 1, serving_unit: 'medium', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, source: 'USDA' },
  { name: 'Strawberries', brand: null, serving_size: 100, serving_unit: 'g', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, source: 'USDA' },
  { name: 'Blueberries', brand: null, serving_size: 100, serving_unit: 'g', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, source: 'USDA' },
  { name: 'Raspberries', brand: null, serving_size: 100, serving_unit: 'g', calories: 52, protein: 1.2, carbs: 12, fat: 0.7, source: 'USDA' },
  { name: 'Blackberries', brand: null, serving_size: 100, serving_unit: 'g', calories: 43, protein: 1.4, carbs: 10, fat: 0.5, source: 'USDA' },
  { name: 'Grapes', brand: null, serving_size: 100, serving_unit: 'g', calories: 67, protein: 0.6, carbs: 17, fat: 0.4, source: 'USDA' },
  { name: 'Watermelon', brand: null, serving_size: 100, serving_unit: 'g', calories: 30, protein: 0.6, carbs: 7.5, fat: 0.2, source: 'USDA' },
  { name: 'Cantaloupe', brand: null, serving_size: 100, serving_unit: 'g', calories: 34, protein: 0.8, carbs: 8, fat: 0.2, source: 'USDA' },
  { name: 'Honeydew', brand: null, serving_size: 100, serving_unit: 'g', calories: 36, protein: 0.5, carbs: 9, fat: 0.1, source: 'USDA' },
  { name: 'Pineapple', brand: null, serving_size: 100, serving_unit: 'g', calories: 50, protein: 0.5, carbs: 13, fat: 0.1, source: 'USDA' },
  { name: 'Mango', brand: null, serving_size: 100, serving_unit: 'g', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, source: 'USDA' },
  { name: 'Peach', brand: null, serving_size: 1, serving_unit: 'medium', calories: 59, protein: 1.4, carbs: 14, fat: 0.4, source: 'USDA' },
  { name: 'Pear', brand: null, serving_size: 1, serving_unit: 'medium', calories: 101, protein: 0.6, carbs: 27, fat: 0.2, source: 'USDA' },
  { name: 'Plum', brand: null, serving_size: 1, serving_unit: 'medium', calories: 30, protein: 0.5, carbs: 7.5, fat: 0.2, source: 'USDA' },
  { name: 'Cherries', brand: null, serving_size: 100, serving_unit: 'g', calories: 50, protein: 1, carbs: 12, fat: 0.3, source: 'USDA' },
  { name: 'Kiwi', brand: null, serving_size: 1, serving_unit: 'medium', calories: 42, protein: 0.8, carbs: 10, fat: 0.4, source: 'USDA' },
  { name: 'Avocado', brand: null, serving_size: 100, serving_unit: 'g', calories: 160, protein: 2, carbs: 9, fat: 15, source: 'USDA' },
  { name: 'Grapefruit', brand: null, serving_size: 0.5, serving_unit: 'medium', calories: 52, protein: 0.9, carbs: 13, fat: 0.2, source: 'USDA' },
  { name: 'Lemon', brand: null, serving_size: 1, serving_unit: 'medium', calories: 17, protein: 0.6, carbs: 5, fat: 0.2, source: 'USDA' },
  { name: 'Lime', brand: null, serving_size: 1, serving_unit: 'medium', calories: 20, protein: 0.5, carbs: 7, fat: 0.1, source: 'USDA' },
  { name: 'Dried Cranberries', brand: null, serving_size: 40, serving_unit: 'g', calories: 123, protein: 0, carbs: 33, fat: 0.5, source: 'USDA' },
  { name: 'Raisins', brand: null, serving_size: 40, serving_unit: 'g', calories: 120, protein: 1.2, carbs: 32, fat: 0.2, source: 'USDA' },
  { name: 'Dates', brand: null, serving_size: 2, serving_unit: 'dates', calories: 133, protein: 0.8, carbs: 36, fat: 0.1, source: 'USDA' },

  // ========== VEGETABLES (25 items) ==========
  { name: 'Broccoli', brand: null, serving_size: 100, serving_unit: 'g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, source: 'USDA' },
  { name: 'Spinach', brand: null, serving_size: 100, serving_unit: 'g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, source: 'USDA' },
  { name: 'Kale', brand: null, serving_size: 100, serving_unit: 'g', calories: 49, protein: 4.3, carbs: 9, fat: 0.9, source: 'USDA' },
  { name: 'Carrots', brand: null, serving_size: 100, serving_unit: 'g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, source: 'USDA' },
  { name: 'Tomatoes', brand: null, serving_size: 100, serving_unit: 'g', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, source: 'USDA' },
  { name: 'Cherry Tomatoes', brand: null, serving_size: 100, serving_unit: 'g', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, source: 'USDA' },
  { name: 'Cucumber', brand: null, serving_size: 100, serving_unit: 'g', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, source: 'USDA' },
  { name: 'Bell Pepper (red)', brand: null, serving_size: 100, serving_unit: 'g', calories: 31, protein: 1, carbs: 6, fat: 0.3, source: 'USDA' },
  { name: 'Bell Pepper (green)', brand: null, serving_size: 100, serving_unit: 'g', calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, source: 'USDA' },
  { name: 'Lettuce (iceberg)', brand: null, serving_size: 100, serving_unit: 'g', calories: 14, protein: 0.9, carbs: 3, fat: 0.1, source: 'USDA' },
  { name: 'Lettuce (romaine)', brand: null, serving_size: 100, serving_unit: 'g', calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, source: 'USDA' },
  { name: 'Onion', brand: null, serving_size: 100, serving_unit: 'g', calories: 40, protein: 1.1, carbs: 9, fat: 0.1, source: 'USDA' },
  { name: 'Garlic', brand: null, serving_size: 3, serving_unit: 'cloves', calories: 13, protein: 0.6, carbs: 3, fat: 0, source: 'USDA' },
  { name: 'Mushrooms', brand: null, serving_size: 100, serving_unit: 'g', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, source: 'USDA' },
  { name: 'Zucchini', brand: null, serving_size: 100, serving_unit: 'g', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, source: 'USDA' },
  { name: 'Asparagus', brand: null, serving_size: 100, serving_unit: 'g', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, source: 'USDA' },
  { name: 'Green Beans', brand: null, serving_size: 100, serving_unit: 'g', calories: 31, protein: 1.8, carbs: 7, fat: 0.1, source: 'USDA' },
  { name: 'Celery', brand: null, serving_size: 100, serving_unit: 'g', calories: 16, protein: 0.7, carbs: 3, fat: 0.2, source: 'USDA' },
  { name: 'Cauliflower', brand: null, serving_size: 100, serving_unit: 'g', calories: 25, protein: 2, carbs: 5, fat: 0.3, source: 'USDA' },
  { name: 'Brussels Sprouts', brand: null, serving_size: 100, serving_unit: 'g', calories: 43, protein: 3.4, carbs: 9, fat: 0.3, source: 'USDA' },
  { name: 'Cabbage', brand: null, serving_size: 100, serving_unit: 'g', calories: 25, protein: 1.3, carbs: 6, fat: 0.1, source: 'USDA' },
  { name: 'Eggplant', brand: null, serving_size: 100, serving_unit: 'g', calories: 25, protein: 1, carbs: 6, fat: 0.2, source: 'USDA' },
  { name: 'Peas', brand: null, serving_size: 100, serving_unit: 'g', calories: 81, protein: 5.4, carbs: 14, fat: 0.4, source: 'USDA' },
  { name: 'Edamame', brand: null, serving_size: 100, serving_unit: 'g', calories: 121, protein: 11, carbs: 10, fat: 5, source: 'USDA' },
  { name: 'Artichoke', brand: null, serving_size: 1, serving_unit: 'medium', calories: 60, protein: 4.2, carbs: 13, fat: 0.2, source: 'USDA' },

  // ========== DAIRY & ALTERNATIVES (15 items) ==========
  { name: 'Milk (whole)', brand: null, serving_size: 240, serving_unit: 'ml', calories: 149, protein: 8, carbs: 12, fat: 8, source: 'USDA' },
  { name: 'Milk (2%)', brand: null, serving_size: 240, serving_unit: 'ml', calories: 122, protein: 8, carbs: 12, fat: 5, source: 'USDA' },
  { name: 'Milk (skim)', brand: null, serving_size: 240, serving_unit: 'ml', calories: 83, protein: 8, carbs: 12, fat: 0.2, source: 'USDA' },
  { name: 'Almond Milk (unsweetened)', brand: null, serving_size: 240, serving_unit: 'ml', calories: 30, protein: 1, carbs: 1, fat: 2.5, source: 'USDA' },
  { name: 'Oat Milk', brand: null, serving_size: 240, serving_unit: 'ml', calories: 120, protein: 3, carbs: 16, fat: 5, source: 'USDA' },
  { name: 'Soy Milk', brand: null, serving_size: 240, serving_unit: 'ml', calories: 80, protein: 7, carbs: 4, fat: 4, source: 'USDA' },
  { name: 'Cheddar Cheese', brand: null, serving_size: 28, serving_unit: 'g', calories: 113, protein: 7, carbs: 0.4, fat: 9, source: 'USDA' },
  { name: 'Mozzarella Cheese', brand: null, serving_size: 28, serving_unit: 'g', calories: 85, protein: 6, carbs: 0.6, fat: 6, source: 'USDA' },
  { name: 'Parmesan Cheese', brand: null, serving_size: 28, serving_unit: 'g', calories: 111, protein: 10, carbs: 0.9, fat: 7, source: 'USDA' },
  { name: 'Feta Cheese', brand: null, serving_size: 28, serving_unit: 'g', calories: 75, protein: 4, carbs: 1.2, fat: 6, source: 'USDA' },
  { name: 'Cream Cheese', brand: null, serving_size: 28, serving_unit: 'g', calories: 99, protein: 2, carbs: 1, fat: 10, source: 'USDA' },
  { name: 'Butter', brand: null, serving_size: 14, serving_unit: 'g', calories: 102, protein: 0.1, carbs: 0, fat: 12, source: 'USDA' },
  { name: 'Sour Cream', brand: null, serving_size: 30, serving_unit: 'g', calories: 60, protein: 0.7, carbs: 1.2, fat: 6, source: 'USDA' },
  { name: 'Heavy Cream', brand: null, serving_size: 30, serving_unit: 'ml', calories: 103, protein: 0.6, carbs: 0.8, fat: 11, source: 'USDA' },
  { name: 'Half and Half', brand: null, serving_size: 30, serving_unit: 'ml', calories: 40, protein: 0.9, carbs: 1.3, fat: 3.5, source: 'USDA' },

  // ========== NUTS & SEEDS (15 items) ==========
  { name: 'Almonds', brand: null, serving_size: 28, serving_unit: 'g', calories: 164, protein: 6, carbs: 6, fat: 14, source: 'USDA' },
  { name: 'Peanuts', brand: null, serving_size: 28, serving_unit: 'g', calories: 161, protein: 7, carbs: 5, fat: 14, source: 'USDA' },
  { name: 'Walnuts', brand: null, serving_size: 28, serving_unit: 'g', calories: 185, protein: 4, carbs: 4, fat: 18, source: 'USDA' },
  { name: 'Cashews', brand: null, serving_size: 28, serving_unit: 'g', calories: 157, protein: 5, carbs: 9, fat: 12, source: 'USDA' },
  { name: 'Pecans', brand: null, serving_size: 28, serving_unit: 'g', calories: 196, protein: 2.6, carbs: 4, fat: 20, source: 'USDA' },
  { name: 'Pistachios', brand: null, serving_size: 28, serving_unit: 'g', calories: 159, protein: 6, carbs: 8, fat: 13, source: 'USDA' },
  { name: 'Macadamia Nuts', brand: null, serving_size: 28, serving_unit: 'g', calories: 204, protein: 2.2, carbs: 4, fat: 21, source: 'USDA' },
  { name: 'Peanut Butter', brand: null, serving_size: 32, serving_unit: 'g', calories: 188, protein: 8, carbs: 6, fat: 16, source: 'USDA' },
  { name: 'Almond Butter', brand: null, serving_size: 32, serving_unit: 'g', calories: 196, protein: 7, carbs: 6, fat: 18, source: 'USDA' },
  { name: 'Chia Seeds', brand: null, serving_size: 28, serving_unit: 'g', calories: 138, protein: 5, carbs: 12, fat: 9, source: 'USDA' },
  { name: 'Flax Seeds', brand: null, serving_size: 28, serving_unit: 'g', calories: 150, protein: 5, carbs: 8, fat: 12, source: 'USDA' },
  { name: 'Pumpkin Seeds', brand: null, serving_size: 28, serving_unit: 'g', calories: 151, protein: 7, carbs: 5, fat: 13, source: 'USDA' },
  { name: 'Sunflower Seeds', brand: null, serving_size: 28, serving_unit: 'g', calories: 165, protein: 5.5, carbs: 7, fat: 14, source: 'USDA' },
  { name: 'Hemp Seeds', brand: null, serving_size: 30, serving_unit: 'g', calories: 166, protein: 10, carbs: 2.6, fat: 14, source: 'USDA' },
  { name: 'Trail Mix', brand: null, serving_size: 40, serving_unit: 'g', calories: 173, protein: 5, carbs: 17, fat: 11, source: 'USDA' },

  // ========== LEGUMES (10 items) ==========
  { name: 'Black Beans (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, source: 'USDA' },
  { name: 'Kidney Beans (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 127, protein: 8.7, carbs: 23, fat: 0.5, source: 'USDA' },
  { name: 'Chickpeas (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 164, protein: 9, carbs: 27, fat: 2.6, source: 'USDA' },
  { name: 'Lentils (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 116, protein: 9, carbs: 20, fat: 0.4, source: 'USDA' },
  { name: 'Pinto Beans (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 143, protein: 9, carbs: 26, fat: 0.6, source: 'USDA' },
  { name: 'Navy Beans (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 140, protein: 8.2, carbs: 26, fat: 0.6, source: 'USDA' },
  { name: 'Refried Beans', brand: null, serving_size: 100, serving_unit: 'g', calories: 89, protein: 5.4, carbs: 14, fat: 1.2, source: 'USDA' },
  { name: 'Hummus', brand: null, serving_size: 50, serving_unit: 'g', calories: 83, protein: 2.4, carbs: 7, fat: 5, source: 'USDA' },
  { name: 'Split Peas (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 118, protein: 8.3, carbs: 21, fat: 0.4, source: 'USDA' },
  { name: 'Soybeans (cooked)', brand: null, serving_size: 100, serving_unit: 'g', calories: 173, protein: 17, carbs: 10, fat: 9, source: 'USDA' },

  // ========== BEVERAGES (10 items) ==========
  { name: 'Coffee (black)', brand: null, serving_size: 240, serving_unit: 'ml', calories: 2, protein: 0.3, carbs: 0, fat: 0, source: 'USDA' },
  { name: 'Espresso', brand: null, serving_size: 30, serving_unit: 'ml', calories: 3, protein: 0.1, carbs: 0.5, fat: 0, source: 'USDA' },
  { name: 'Orange Juice', brand: null, serving_size: 240, serving_unit: 'ml', calories: 112, protein: 2, carbs: 26, fat: 0.5, source: 'USDA' },
  { name: 'Apple Juice', brand: null, serving_size: 240, serving_unit: 'ml', calories: 114, protein: 0.2, carbs: 28, fat: 0.3, source: 'USDA' },
  { name: 'Cranberry Juice', brand: null, serving_size: 240, serving_unit: 'ml', calories: 116, protein: 0, carbs: 31, fat: 0.1, source: 'USDA' },
  { name: 'Grape Juice', brand: null, serving_size: 240, serving_unit: 'ml', calories: 152, protein: 1, carbs: 37, fat: 0.2, source: 'USDA' },
  { name: 'Coconut Water', brand: null, serving_size: 240, serving_unit: 'ml', calories: 46, protein: 2, carbs: 9, fat: 0.5, source: 'USDA' },
  { name: 'Sports Drink (Gatorade)', brand: 'Gatorade', serving_size: 360, serving_unit: 'ml', calories: 80, protein: 0, carbs: 21, fat: 0, source: 'USDA' },
  { name: 'Green Tea', brand: null, serving_size: 240, serving_unit: 'ml', calories: 2, protein: 0, carbs: 0, fat: 0, source: 'USDA' },
  { name: 'Hot Chocolate', brand: null, serving_size: 240, serving_unit: 'ml', calories: 192, protein: 9, carbs: 27, fat: 6, source: 'USDA' },

  // ========== CONDIMENTS & SAUCES (10 items) ==========
  { name: 'Olive Oil', brand: null, serving_size: 14, serving_unit: 'ml', calories: 119, protein: 0, carbs: 0, fat: 14, source: 'USDA' },
  { name: 'Coconut Oil', brand: null, serving_size: 14, serving_unit: 'ml', calories: 121, protein: 0, carbs: 0, fat: 14, source: 'USDA' },
  { name: 'Mayonnaise', brand: null, serving_size: 15, serving_unit: 'g', calories: 94, protein: 0.1, carbs: 0.1, fat: 10, source: 'USDA' },
  { name: 'Ketchup', brand: null, serving_size: 17, serving_unit: 'g', calories: 19, protein: 0.2, carbs: 5, fat: 0, source: 'USDA' },
  { name: 'Mustard', brand: null, serving_size: 5, serving_unit: 'g', calories: 3, protein: 0.2, carbs: 0.3, fat: 0.2, source: 'USDA' },
  { name: 'Soy Sauce', brand: null, serving_size: 15, serving_unit: 'ml', calories: 9, protein: 1, carbs: 1, fat: 0, source: 'USDA' },
  { name: 'Hot Sauce', brand: null, serving_size: 5, serving_unit: 'ml', calories: 1, protein: 0, carbs: 0, fat: 0, source: 'USDA' },
  { name: 'BBQ Sauce', brand: null, serving_size: 30, serving_unit: 'g', calories: 58, protein: 0.3, carbs: 14, fat: 0.2, source: 'USDA' },
  { name: 'Ranch Dressing', brand: null, serving_size: 30, serving_unit: 'g', calories: 129, protein: 0.4, carbs: 2, fat: 13, source: 'USDA' },
  { name: 'Italian Dressing', brand: null, serving_size: 30, serving_unit: 'g', calories: 71, protein: 0.1, carbs: 2.5, fat: 7, source: 'USDA' },

  // ========== SNACKS & SWEETS (10 items) ==========
  { name: 'Protein Bar (average)', brand: null, serving_size: 1, serving_unit: 'bar', calories: 200, protein: 20, carbs: 20, fat: 7, source: 'estimate' },
  { name: 'Granola Bar', brand: null, serving_size: 1, serving_unit: 'bar', calories: 120, protein: 2, carbs: 20, fat: 4, source: 'estimate' },
  { name: 'Dark Chocolate (70%)', brand: null, serving_size: 28, serving_unit: 'g', calories: 170, protein: 2, carbs: 13, fat: 12, source: 'USDA' },
  { name: 'Milk Chocolate', brand: null, serving_size: 28, serving_unit: 'g', calories: 153, protein: 2, carbs: 17, fat: 9, source: 'USDA' },
  { name: 'Potato Chips', brand: null, serving_size: 28, serving_unit: 'g', calories: 152, protein: 2, carbs: 15, fat: 10, source: 'USDA' },
  { name: 'Tortilla Chips', brand: null, serving_size: 28, serving_unit: 'g', calories: 142, protein: 2, carbs: 18, fat: 7, source: 'USDA' },
  { name: 'Popcorn (air-popped)', brand: null, serving_size: 28, serving_unit: 'g', calories: 110, protein: 3, carbs: 22, fat: 1.3, source: 'USDA' },
  { name: 'Pretzels', brand: null, serving_size: 28, serving_unit: 'g', calories: 108, protein: 3, carbs: 23, fat: 1, source: 'USDA' },
  { name: 'Rice Cakes', brand: null, serving_size: 1, serving_unit: 'cake', calories: 35, protein: 0.7, carbs: 7, fat: 0.3, source: 'USDA' },
  { name: 'Ice Cream (vanilla)', brand: null, serving_size: 66, serving_unit: 'g', calories: 137, protein: 2.3, carbs: 16, fat: 7, source: 'USDA' },

  // ========== FAST FOOD & COMMON MEALS (10 items) ==========
  { name: 'Hamburger (fast food)', brand: null, serving_size: 1, serving_unit: 'burger', calories: 350, protein: 17, carbs: 33, fat: 17, source: 'estimate' },
  { name: 'Cheeseburger (fast food)', brand: null, serving_size: 1, serving_unit: 'burger', calories: 430, protein: 22, carbs: 35, fat: 23, source: 'estimate' },
  { name: 'Pizza Slice (cheese)', brand: null, serving_size: 1, serving_unit: 'slice', calories: 285, protein: 12, carbs: 36, fat: 10, source: 'estimate' },
  { name: 'Pizza Slice (pepperoni)', brand: null, serving_size: 1, serving_unit: 'slice', calories: 311, protein: 13, carbs: 35, fat: 13, source: 'estimate' },
  { name: 'Burrito (chicken)', brand: null, serving_size: 1, serving_unit: 'burrito', calories: 520, protein: 30, carbs: 55, fat: 20, source: 'estimate' },
  { name: 'Taco (beef)', brand: null, serving_size: 1, serving_unit: 'taco', calories: 170, protein: 8, carbs: 13, fat: 10, source: 'estimate' },
  { name: 'Chicken Nuggets (6 pc)', brand: null, serving_size: 6, serving_unit: 'pieces', calories: 280, protein: 14, carbs: 18, fat: 17, source: 'estimate' },
  { name: 'Caesar Salad', brand: null, serving_size: 1, serving_unit: 'serving', calories: 360, protein: 8, carbs: 12, fat: 32, source: 'estimate' },
  { name: 'Grilled Cheese Sandwich', brand: null, serving_size: 1, serving_unit: 'sandwich', calories: 390, protein: 15, carbs: 30, fat: 24, source: 'estimate' },
  { name: 'BLT Sandwich', brand: null, serving_size: 1, serving_unit: 'sandwich', calories: 344, protein: 12, carbs: 29, fat: 20, source: 'estimate' },
];

async function seedFoods() {
  console.log('Starting food database seed...');
  console.log(`Preparing to insert ${commonFoods.length} foods...`);

  try {
    // Ensure the foods table exists
    console.log('Ensuring foods table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS foods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        brand TEXT,
        serving_size DECIMAL(10,2) NOT NULL,
        serving_unit TEXT NOT NULL,
        calories DECIMAL(10,2) NOT NULL,
        protein DECIMAL(10,2) NOT NULL DEFAULT 0,
        carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
        fat DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_verified BOOLEAN DEFAULT false,
        source TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create unique index for upsert
    console.log('Creating unique index...');
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_name_unique ON foods(name) WHERE brand IS NULL
    `;

    // Check existing count
    const existingCount = await sql`SELECT COUNT(*) as count FROM foods`;
    console.log(`Current foods in database: ${existingCount[0].count}`);

    let inserted = 0;

    // Insert foods (upsert based on name)
    for (const food of commonFoods) {
      try {
        await sql`
          INSERT INTO foods (name, brand, serving_size, serving_unit, calories, protein, carbs, fat, is_verified, source)
          VALUES (${food.name}, ${food.brand}, ${food.serving_size}, ${food.serving_unit}, ${food.calories}, ${food.protein}, ${food.carbs}, ${food.fat}, true, ${food.source})
          ON CONFLICT (name) WHERE brand IS NULL
          DO UPDATE SET
            serving_size = EXCLUDED.serving_size,
            serving_unit = EXCLUDED.serving_unit,
            calories = EXCLUDED.calories,
            protein = EXCLUDED.protein,
            carbs = EXCLUDED.carbs,
            fat = EXCLUDED.fat,
            source = EXCLUDED.source
        `;
        inserted++;
        if (inserted % 25 === 0) {
          console.log(`  Processed ${inserted}/${commonFoods.length} foods...`);
        }
      } catch (err) {
        console.error(`Failed to insert ${food.name}:`, err);
      }
    }

    // Final count
    const finalCount = await sql`SELECT COUNT(*) as count FROM foods`;
    console.log(`\nSeed completed!`);
    console.log(`  Foods processed: ${inserted}`);
    console.log(`  Total foods in database: ${finalCount[0].count}`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedFoods();
