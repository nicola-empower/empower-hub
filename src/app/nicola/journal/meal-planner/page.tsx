// src/app/nicola/journal/meal-planner/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Meal = {
  id?: number;
  plan_date: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner';
  meal_description: string;
  ingredients?: string; 
};

export default function MealPlannerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const weekStartDate = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const newDate = new Date(d.setDate(diff));
    newDate.setHours(0, 0, 0, 0); // Normalize to the start of the day
    return newDate;
  }, [currentDate]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + i);
        return date;
    });
  }, [weekStartDate]);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    const firstDay = weekStartDate.toISOString().slice(0, 10);
    const lastDayDate = new Date(weekStartDate);
    lastDayDate.setDate(weekStartDate.getDate() + 6);
    const lastDayStr = lastDayDate.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('meal_planner')
      .select('*')
      .gte('plan_date', firstDay)
      .lte('plan_date', lastDayStr)
      .order('plan_date');

    if (error) console.error('Error fetching meals:', error);
    else setMeals(data || []);
    setLoading(false);
  }, [weekStartDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);
  
  const handleMealChange = (date: string, mealType: Meal['meal_type'], field: 'meal_description' | 'ingredients', value: string) => {
    setMeals(currentMeals => {
        const mealIndex = currentMeals.findIndex(m => m.plan_date === date && m.meal_type === mealType);

        if (mealIndex > -1) {
            const updatedMeals = [...currentMeals];
            updatedMeals[mealIndex] = { ...updatedMeals[mealIndex], [field]: value };
            return updatedMeals;
        } else {
            const newMeal: Meal = {
                plan_date: date,
                meal_type: mealType,
                meal_description: '',
                ingredients: '',
                [field]: value,
            };
            return [...currentMeals, newMeal];
        }
    });
  };

  const handleSaveWeek = async () => {
    setIsSaving(true);
    const mealsToSave = meals.filter(m => m.meal_description?.trim() !== '' || m.ingredients?.trim() !== '');
    const { error } = await supabase.from('meal_planner').upsert(mealsToSave, { onConflict: 'user_id, plan_date, meal_type' });
    if (error) {
        alert('Failed to save meal plan.');
        console.error(error);
    } else {
        alert('Meal plan saved!');
    }
    setIsSaving(false);
  };

  const handleAddIngredientsToShoppingList = async () => {
    const allIngredients = meals
      .flatMap(meal => meal.ingredients?.split(/[\n,]+/) || [])
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0);

    if (allIngredients.length === 0) {
      alert("No ingredients to add!");
      return;
    }

    const shoppingListItems = allIngredients.map(item => ({
      item_name: item,
      is_purchased: false,
    }));

    const { error } = await supabase.from('shopping_list_items').insert(shoppingListItems);

    if (error) {
      alert("Failed to add ingredients to shopping list.");
      console.error(error);
    } else {
      alert(`${allIngredients.length} ingredients added to your shopping list!`);
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#2e5568' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold" style={{ color: '#7886c7' }}>Meal Planner</h1>
          <p className="text-lg" style={{ color: '#d1d5db' }}>Plan your week, nourish your body.</p>
        </div>

        <div className="flex items-center justify-between mb-6 bg-white/10 p-4 rounded-lg">
          <button onClick={goToPreviousWeek} className="p-2 rounded-full" style={{ backgroundColor: '#7886c7', color: '#ffffff' }} aria-label="Previous week"><ChevronLeftIcon className="h-6 w-6" /></button>
          <h2 className="text-xl font-semibold text-white">Week of {weekStartDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}</h2>
          <button onClick={goToNextWeek} className="p-2 rounded-full" style={{ backgroundColor: '#7886c7', color: '#ffffff' }} aria-label="Next week"><ChevronRightIcon className="h-6 w-6" /></button>
        </div>

        {loading ? <p className="text-center text-white">Loading meals...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-1">
            {weekDates.map(date => {
              const dateString = date.toISOString().slice(0, 10);
              return (
                <div key={dateString} className="bg-white/5 rounded-lg p-2 space-y-2">
                  <h3 className="font-bold text-center text-white">{date.toLocaleDateString('en-GB', { weekday: 'short' })}</h3>
                  <p className="text-xs text-center text-gray-300">{date.toLocaleDateString('en-GB', { day: '2-digit' })}</p>
                  
                  {(['Breakfast', 'Lunch', 'Dinner'] as const).map(mealType => {
                    const meal = meals.find(m => m.plan_date === dateString && m.meal_type === mealType);
                    return (
                      <div key={mealType}>
                        <label className="text-sm font-medium" style={{ color: '#7886c7' }}>{mealType}</label>
                        <textarea value={meal?.meal_description || ''} onChange={(e) => handleMealChange(dateString, mealType, 'meal_description', e.target.value)} rows={2} className="w-full mt-1 bg-white/10 border-none rounded p-2 text-white placeholder-gray-300 text-sm" placeholder="Meal"/>
                        <textarea value={meal?.ingredients || ''} onChange={(e) => handleMealChange(dateString, mealType, 'ingredients', e.target.value)} rows={3} className="w-full mt-1 bg-white/10 border-none rounded p-2 text-white placeholder-gray-300 text-sm" placeholder="Ingredients..."/>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
            <button onClick={handleAddIngredientsToShoppingList} className="px-8 py-3 rounded-lg font-bold text-white transition-colors bg-pink-500 hover:bg-pink-600">
                Add Ingredients to Shopping List
            </button>
            <button onClick={handleSaveWeek} disabled={isSaving} className="px-8 py-3 rounded-lg font-bold text-white transition-colors" style={{ backgroundColor: '#7886c7' }}>
                {isSaving ? 'Saving...' : "Save Week's Plan"}
            </button>
        </div>
      </div>
    </div>
  );
}
