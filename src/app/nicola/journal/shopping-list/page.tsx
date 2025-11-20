// src/app/nicola/journal/shopping-list/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FaPlus, FaTrash, FaShoppingCart } from 'react-icons/fa';

// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---
type ShoppingListItem = {
  id: number;
  item_name: string;
  is_purchased: boolean;
};

// --- Main Shopping List Page Component ---
export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching shopping list items:', error);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    };
    fetchItems();
  }, []);

  // --- Form & Item Logic ---
  const handleAddItem = async () => {
    if (newItem.trim() === '') return;

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({ item_name: newItem, is_purchased: false })
      .select()
      .single();

    if (error) {
      alert('Failed to add item.');
      console.error(error);
    } else if (data) {
      setItems(prevItems => [...prevItems, data]);
      setNewItem('');
    }
  };

  const toggleItemPurchased = async (item: ShoppingListItem) => {
    const { error } = await supabase
      .from('shopping_list_items')
      .update({ is_purchased: !item.is_purchased })
      .eq('id', item.id);

    if (error) {
      alert('Failed to update item.');
    } else {
      setItems(prevItems =>
        prevItems.map(i => (i.id === item.id ? { ...i, is_purchased: !i.is_purchased } : i))
      );
    }
  };

  const handleDeleteItem = async (id: number) => {
    const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Failed to delete item.');
    } else {
        setItems(prevItems => prevItems.filter(i => i.id !== id));
    }
  };
  
  const handleClearPurchased = async () => {
    const purchasedIds = items.filter(i => i.is_purchased).map(i => i.id);
    if (purchasedIds.length === 0) return;

    const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .in('id', purchasedIds);

    if (error) {
        alert('Failed to clear purchased items.');
    } else {
        setItems(prevItems => prevItems.filter(i => !i.is_purchased));
    }
  };


  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#2e5568' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#7886c7' }}>Shopping List</h1>
          <p className="text-lg" style={{ color: '#d1d5db' }}>Stay organised, shop smart.</p>
        </div>

        {/* Add Item Input */}
        <div className="bg-white/10 p-4 rounded-lg flex gap-2 mb-6">
            <input 
                type="text" 
                value={newItem} 
                onChange={(e) => setNewItem(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                className="flex-grow bg-white/20 border-none rounded p-3 text-white placeholder-gray-300" 
                placeholder="Add a new item..."
            />
            <button onClick={handleAddItem} className="p-3 bg-pink-500 rounded text-white text-xl">
                <FaPlus />
            </button>
        </div>

        {/* Shopping List */}
        <div className="bg-white/10 p-4 rounded-lg">
            {loading ? <p className="text-center text-white">Loading list...</p> : (
                <ul className="space-y-3">
                    {items.map(item => (
                        <li key={item.id} className="flex items-center justify-between bg-white/5 p-3 rounded-md transition-all">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleItemPurchased(item)}>
                                <input 
                                    type="checkbox" 
                                    checked={item.is_purchased} 
                                    readOnly
                                    className="h-6 w-6 rounded-full text-pink-500 focus:ring-0 bg-white/20 border-none"
                                />
                                <span className={`text-lg ${item.is_purchased ? 'line-through text-gray-400' : 'text-white'}`}>
                                    {item.item_name}
                                </span>
                            </div>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-600 p-2">
                                <FaTrash />
                            </button>
                        </li>
                    ))}
                    {items.length === 0 && <p className="text-center text-gray-400">Your shopping list is empty!</p>}
                </ul>
            )}
        </div>

        {/* Clear Button */}
        <div className="mt-6 flex justify-end">
            <button 
                onClick={handleClearPurchased} 
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors" 
                style={{ backgroundColor: '#7886c7' }}
                disabled={!items.some(i => i.is_purchased)}
            >
                Clear Purchased Items
            </button>
        </div>
      </div>
    </div>
  );
}
