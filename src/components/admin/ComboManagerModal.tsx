import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Edit } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface ComboManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: any[]; 
}

export default function ComboManagerModal({ isOpen, onClose, inventory }: ComboManagerModalProps) {
  const { settings, updateSettings } = useSettings();
  const combos = settings.accessoryCombos || [];
  
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [comboName, setComboName] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  if (!isOpen) return null;

  const freeAccessories = inventory.filter(item => item.isFreeAccessory);

  const handleCreateNew = () => {
    setEditingComboId('new');
    setComboName('');
    setSelectedItems([]);
  };

  const handleEdit = (combo: any) => {
    setEditingComboId(combo.id);
    setComboName(combo.name);
    setSelectedItems(combo.items || []);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this combo?")) return;
    const newCombos = combos.filter(c => c.id !== id);
    await updateSettings({ accessoryCombos: newCombos });
  };

  const handleSave = async () => {
    if (!comboName.trim()) {
      alert("Please enter a combo name.");
      return;
    }

    let newCombos = [...combos];
    if (editingComboId === 'new') {
      newCombos.push({
        id: Date.now().toString(),
        name: comboName.trim(),
        items: selectedItems
      });
    } else {
      newCombos = newCombos.map(c => 
        c.id === editingComboId ? { ...c, name: comboName.trim(), items: selectedItems } : c
      );
    }

    await updateSettings({ accessoryCombos: newCombos });
    setEditingComboId(null);
  };

  const toggleItem = (itemName: string) => {
    if (selectedItems.includes(itemName)) {
      setSelectedItems(selectedItems.filter(i => i !== itemName));
    } else {
      setSelectedItems([...selectedItems, itemName]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-md bg-[#0d0d0e] border-l border-white/10 h-full overflow-y-auto flex flex-col shadow-2xl animate-fade-in">
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0d0d0e]/90 backdrop-blur z-10">
          <h2 className="text-xl font-bold text-white">Accessory Combos</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1">
          {editingComboId ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">{editingComboId === 'new' ? 'New Combo' : 'Edit Combo'}</h3>
                <button onClick={() => setEditingComboId(null)} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider">Cancel</button>
              </div>

              <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                Combo Name *
                <input 
                  type="text" 
                  value={comboName} 
                  onChange={(e) => setComboName(e.target.value)} 
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" 
                  placeholder="e.g. Gaming Starter Pack" 
                />
              </label>

              <div className="space-y-3">
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Included Items</p>
                {freeAccessories.length === 0 ? (
                  <p className="text-sm text-slate-500">No free accessories found in inventory.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {freeAccessories.map(item => {
                      const isChecked = selectedItems.includes(item.name);
                      return (
                        <label key={item.id} className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 px-4 py-3 rounded-xl hover:border-blue-500/50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleItem(item.name)}
                            className="rounded text-blue-600 focus:ring-blue-500 border-white/20 bg-white/5" 
                          />
                          <span className="text-sm text-slate-300 font-semibold">{item.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Combo
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={handleCreateNew}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 border-dashed text-white px-4 py-4 rounded-xl text-sm font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create New Combo
              </button>

              <div className="space-y-3">
                {combos.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-8">No combos created yet.</p>
                ) : (
                  combos.map(combo => (
                    <div key={combo.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all">
                      <div>
                        <h4 className="font-bold text-white mb-1">{combo.name}</h4>
                        <p className="text-xs text-slate-400">{combo.items?.length || 0} items included</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(combo)} className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(combo.id)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
