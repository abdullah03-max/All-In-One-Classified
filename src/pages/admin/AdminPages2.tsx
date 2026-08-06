import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Tag, Shield, UserPlus, BarChart2, TrendingUp, Users, Package, DollarSign, ArrowUp, ArrowDown, Settings, Eye, X, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button, Modal, Input, Select, Badge, Skeleton, EmptyState, StatCard } from '../../components/ui';
import { usersService, analyticsService, categoriesService, VIRTUAL_CATEGORIES } from '../../services';
import { User, Category } from '../../types';
import Icon from '../../components/ui/Icon';
import { adminNav } from './AdminPages';
import { formatDate, formatPrice, slugify, cn } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

// ============================================================
// CATEGORIES MANAGEMENT
// ============================================================


export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3b82f6');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  // Sync state
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Expandable tree state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Attributes builder state
  const [attributesSchema, setAttributesSchema] = useState<any[]>([]);

  // Temp single attribute editor state
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrLabel, setNewAttrLabel] = useState('');
  const [newAttrType, setNewAttrType] = useState<'text' | 'number' | 'select'>('text');
  const [newAttrOptions, setNewAttrOptions] = useState('');
  const [newAttrRequired, setNewAttrRequired] = useState(false);

  const checkUnsyncedCategories = (loadedCats: Category[]) => {
    const dbIds = new Set(loadedCats.map(c => c.id));
    const unsynced = VIRTUAL_CATEGORIES.filter(vc => !dbIds.has(vc.id));
    setUnsyncedCount(unsynced.length);
  };

  const handleSyncCategories = async () => {
    setSyncing(true);
    try {
      const dbIds = new Set(categories.map(c => c.id));
      const unsynced = VIRTUAL_CATEGORIES.filter(vc => !dbIds.has(vc.id));
      
      if (unsynced.length === 0) {
        toast.success('All categories are already synced!');
        return;
      }

      toast.loading(`Syncing ${unsynced.length} categories to database...`, { id: 'sync-cats' });

      // Insert/upsert chunk-by-chunk to prevent overloading the network
      const chunks = [];
      const chunkSize = 15;
      for (let i = 0; i < unsynced.length; i += chunkSize) {
        chunks.push(unsynced.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const promises = chunk.map(cat => 
          supabase.from('categories').upsert({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon || 'Tag',
            color: cat.color || '#3b82f6',
            parent_id: cat.parent_id || null,
            sort_order: cat.sort_order || 0,
            description: cat.description || null,
            image_url: (cat as any).image_url || null,
            attributes_schema: (cat as any).attributes_schema || []
          })
        );
        const results = await Promise.all(promises);
        const err = results.find(r => r.error);
        if (err && err.error) throw err.error;
      }

      toast.success('Categories synced successfully!', { id: 'sync-cats' });
      fetchCategories();
    } catch (e: any) {
      toast.error('Sync failed: ' + e.message, { id: 'sync-cats' });
    } finally {
      setSyncing(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesService.getCategories();
      setCategories(data || []);
      checkUnsyncedCategories(data || []);
    } catch (e: any) {
      toast.error('Failed to load categories: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const ids = new Set<string>();
    categories.forEach(cat => {
      ids.add(cat.id);
      if (cat.subcategories) {
        cat.subcategories.forEach(sub => {
          ids.add(sub.id);
        });
      }
    });
    setExpandedIds(ids);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Hierarchy Resolution helper
  const categoryTree = React.useMemo(() => {
    const parents = categories.filter(c => !c.parent_id).map(c => ({ ...c, subcategories: [] as Category[] }));
    const children = categories.filter(c => c.parent_id);
    
    // Map parents
    const parentMap = new Map(parents.map(c => [c.id, c]));
    
    // First pass for second level subcategories
    const orphans: Category[] = [];
    children.forEach(child => {
      const parent = parentMap.get(child.parent_id as string);
      if (parent) {
        parent.subcategories.push({ ...child, subcategories: [] });
      } else {
        orphans.push(child);
      }
    });

    // Second pass for third level sub-subcategories
    if (orphans.length > 0) {
      parents.forEach(parent => {
        parent.subcategories.forEach(sub => {
          const subs = orphans.filter(o => o.parent_id === sub.id);
          if (subs.length > 0) {
            sub.subcategories = subs;
          }
        });
      });
    }

    return parents;
  }, [categories]);

  const handleStartAdd = () => {
    setEditingCat(null);
    setName('');
    setIcon('Tag');
    setColor('#3b82f6');
    setParentId('');
    setDescription('');
    setImageUrl('');
    setSortOrder(categories.length + 1);
    setAttributesSchema([]);
    setModalOpen(true);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setIcon(cat.icon || 'Tag');
    setColor(cat.color || '#3b82f6');
    setParentId(cat.parent_id || '');
    setDescription(cat.description || '');
    setImageUrl((cat as any).image_url || '');
    setSortOrder(cat.sort_order || 0);
    setAttributesSchema((cat as any).attributes_schema || []);
    setModalOpen(true);
  };

  const handleAddAttribute = () => {
    if (!newAttrLabel) {
      toast.error('Attribute Label is required');
      return;
    }
    const slug = slugify(newAttrLabel);
    if (attributesSchema.some(a => a.name === slug)) {
      toast.error('An attribute with this label already exists.');
      return;
    }

    const newField = {
      name: slug,
      label: newAttrLabel,
      type: newAttrType,
      required: newAttrRequired,
      options: newAttrType === 'select' ? newAttrOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined
    };

    setAttributesSchema([...attributesSchema, newField]);
    setNewAttrLabel('');
    setNewAttrOptions('');
    setNewAttrRequired(false);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributesSchema(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveCategory = async () => {
    if (!name) {
      toast.error('Category Name is required');
      return;
    }

    const payload = {
      name,
      slug: slugify(name),
      icon,
      color,
      parent_id: parentId || null,
      description: description || null,
      image_url: imageUrl || null,
      sort_order: sortOrder,
      attributes_schema: attributesSchema
    };

    try {
      if (editingCat) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCat.id);
        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(payload);
        if (error) throw error;
        toast.success('Category created successfully');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (e: any) {
      toast.error('Failed to save category: ' + e.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All nested subcategories will be unlinked.')) return;
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (e: any) {
      toast.error('Failed to delete category: ' + e.message);
    }
  };

  const handleMoveOrder = async (cat: Category, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === cat.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const currentCat = categories[idx];
    const targetCat = categories[targetIdx];

    const currentOrder = currentCat.sort_order || 0;
    const targetOrder = targetCat.sort_order || 0;

    try {
      const updates = [
        supabase.from('categories').update({ sort_order: targetOrder }).eq('id', currentCat.id),
        supabase.from('categories').update({ sort_order: currentOrder }).eq('id', targetCat.id)
      ];
      await Promise.all(updates);
      fetchCategories();
      toast.success('Re-ordered!');
    } catch (e: any) {
      toast.error('Re-order failed: ' + e.message);
    }
  };

  // Option management states
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [optionsCategory, setOptionsCategory] = useState<Category | null>(null);
  const [optionsList, setOptionsList] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  
  // Selected brand for model list editing
  const [selectedBrandOption, setSelectedBrandOption] = useState<any | null>(null);
  
  // Input fields for adding option
  const [newBrandNameInput, setNewBrandNameInput] = useState('');
  const [newModelNameInput, setNewModelNameInput] = useState('');

  const fetchCategoryOptions = async (catId: string) => {
    setOptionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('category_field_options')
        .select('*')
        .eq('category_id', catId);
      // Silently ignore table-not-found (PGRST205) — table may not be created yet
      if (error && error.code !== 'PGRST205') throw error;
      setOptionsList(data || []);
    } catch (e: any) {
      toast.error('Failed to load options: ' + e.message);
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleManageOptions = (cat: Category) => {
    setOptionsCategory(cat);
    setSelectedBrandOption(null);
    setNewBrandNameInput('');
    setNewModelNameInput('');
    fetchCategoryOptions(cat.id);
    setOptionsModalOpen(true);
  };

  const brandsList = React.useMemo(() => {
    return optionsList.filter(o => !o.parent_id);
  }, [optionsList]);

  const modelsList = React.useMemo(() => {
    if (!selectedBrandOption) return [];
    return optionsList.filter(o => o.parent_id === selectedBrandOption.id);
  }, [optionsList, selectedBrandOption]);

  const handleAddBrandOption = async () => {
    if (!newBrandNameInput || !optionsCategory) return;
    try {
      const { error } = await supabase
        .from('category_field_options')
        .insert({
          category_id: optionsCategory.id,
          name: newBrandNameInput,
          parent_id: null
        });
      if (error) throw error;
      toast.success('Brand added!');
      setNewBrandNameInput('');
      fetchCategoryOptions(optionsCategory.id);
    } catch (e: any) {
      toast.error('Failed to add brand: ' + e.message);
    }
  };

  const handleAddModelOption = async () => {
    if (!newModelNameInput || !optionsCategory || !selectedBrandOption) return;
    try {
      const { error } = await supabase
        .from('category_field_options')
        .insert({
          category_id: optionsCategory.id,
          name: newModelNameInput,
          parent_id: selectedBrandOption.id
        });
      if (error) throw error;
      toast.success('Model added!');
      setNewModelNameInput('');
      fetchCategoryOptions(optionsCategory.id);
    } catch (e: any) {
      toast.error('Failed to add model: ' + e.message);
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option? All child models will also be deleted.')) return;
    try {
      const { error } = await supabase
        .from('category_field_options')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Option deleted!');
      if (selectedBrandOption?.id === id) {
        setSelectedBrandOption(null);
      }
      if (optionsCategory) {
        fetchCategoryOptions(optionsCategory.id);
      }
    } catch (e: any) {
      toast.error('Failed to delete option: ' + e.message);
    }
  };

  return (
    <DashboardLayout navItems={adminNav} title="Manage Categories">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Manage Categories</h1>
            <p className="text-sm text-slate-500 mt-1">Configure nested categories and custom form fields dynamically.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExpandAll} className="text-xs px-3 py-1.5 h-auto">
              Expand All
            </Button>
            <Button variant="secondary" onClick={handleCollapseAll} className="text-xs px-3 py-1.5 h-auto">
              Collapse All
            </Button>
            <Button icon={<Plus size={16} />} onClick={handleStartAdd}>
              Add Category
            </Button>
          </div>
        </div>

        {unsyncedCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">System Categories Unsynced</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-0.5">
                There are {unsyncedCount} system categories that do not exist in the database. Sync them to make them fully editable and allow option configuration.
              </p>
            </div>
            <Button
              onClick={handleSyncCategories}
              loading={syncing}
              className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0 self-start sm:self-center"
            >
              Sync System Categories
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {categoryTree.map(cat => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5 border border-slate-200 dark:border-slate-800"
              >
                {/* Main Category Row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div 
                    className="flex items-center gap-3 cursor-pointer select-none group"
                    onClick={() => toggleExpanded(cat.id)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800/40" style={{ backgroundColor: cat.color + '20' }}>
                      <Icon name={cat.icon || 'Tag'} size={20} style={{ color: cat.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 transition-colors">{cat.name}</h3>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          expandedIds.has(cat.id) ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Main Category · Sort: {cat.sort_order || 0} · {cat.subcategories?.length || 0} subcategories</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleMoveOrder(cat, 'up')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"><ArrowUp size={14} /></button>
                    <button onClick={() => handleMoveOrder(cat, 'down')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"><ArrowDown size={14} /></button>
                    <button onClick={() => handleStartEdit(cat)} className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Subcategories (Second level) */}
                {expandedIds.has(cat.id) && (
                  <div className="mt-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-4">
                    {cat.subcategories && cat.subcategories.map(sub => (
                      <div key={sub.id} className="space-y-3">
                        <div className="flex items-center justify-between py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                          <div 
                            className="flex items-center gap-2 cursor-pointer select-none group"
                            onClick={() => toggleExpanded(sub.id)}
                          >
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">Sub</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors">{sub.name}</span>
                            {sub.subcategories && sub.subcategories.length > 0 && (
                              expandedIds.has(sub.id) ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />
                            )}
                            {(sub as any).attributes_schema?.length > 0 && (
                              <Badge variant="success" className="text-[9px] py-0.5">{`${(sub as any).attributes_schema.length} fields`}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleManageOptions(sub)} className="p-1 text-slate-400 hover:text-primary-600 rounded-lg" title="Manage Options"><Settings size={12} /></button>
                            <button onClick={() => handleStartEdit(sub)} className="p-1 text-slate-400 hover:text-primary-600 rounded-lg"><Edit2 size={12} /></button>
                            <button onClick={() => handleDeleteCategory(sub.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={12} /></button>
                          </div>
                        </div>

                        {/* Sub-subcategories (Third level) */}
                        {expandedIds.has(sub.id) && sub.subcategories && sub.subcategories.length > 0 && (
                          <div className="pl-6 border-l-2 border-dashed border-slate-100 dark:border-slate-800 space-y-2">
                            {sub.subcategories.map(subsub => (
                              <div key={subsub.id} className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded font-medium">Sub-Sub</span>
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{subsub.name}</span>
                                  {(subsub as any).attributes_schema?.length > 0 && (
                                    <Badge variant="info" className="text-[9px] py-0.5">{`${(subsub as any).attributes_schema.length} fields`}</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleManageOptions(subsub)} className="p-1 text-slate-400 hover:text-primary-600 rounded-lg" title="Manage Options"><Settings size={10} /></button>
                                  <button onClick={() => handleStartEdit(subsub)} className="p-1 text-slate-400 hover:text-primary-600 rounded-lg"><Edit2 size={10} /></button>
                                  <button onClick={() => handleDeleteCategory(subsub.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={10} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Category Editor / Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCat ? 'Edit Category' : 'Add Category'} size="xl">
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Category Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mobile Phones" />
            <Select
              label="Parent Category (Optional)"
              options={categories.filter(c => c.id !== editingCat?.id).map(c => ({ value: c.id, label: `${c.parent_id ? '↳ ' : ''}${c.name}` }))}
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              placeholder="None (Create as Main Category)"
            />
            <Input label="Icon (Lucide name)" value={icon} onChange={e => setIcon(e.target.value)} placeholder="Tag" />
            <Input label="Color Theme" value={color} onChange={e => setColor(e.target.value)} type="color" className="h-10 cursor-pointer" />
            <Input label="Illustration/Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://unsplash.com/..." />
            <Input label="Sort Order" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} type="number" />
            <div className="col-span-full">
              <label className="label">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="input h-16 resize-none" placeholder="Description of the category" />
            </div>
          </div>

          {/* Dynamic Attributes Schema Builder Section */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Custom Attributes Builder</h3>
              <p className="text-xs text-slate-500">Configure dynamic inputs that only appear when users post ads under this category.</p>
            </div>

            {/* List of current attributes */}
            {attributesSchema.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {attributesSchema.map((field, idx) => (
                  <div key={idx} className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 flex items-center gap-2">
                    <div className="text-xs">
                      <strong className="text-slate-800 dark:text-slate-100">{field.label}</strong>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{field.type} {field.required && '· Required'}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveAttribute(idx)} className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No custom attributes defined yet. Standard title, price, photos, location, and description will be used.</p>
            )}

            {/* Form to add an attribute */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <Input label="Field Label" value={newAttrLabel} onChange={e => setNewAttrLabel(e.target.value)} placeholder="e.g. PTA Status" />
              <Select
                label="Field Type"
                options={[
                  { value: 'text', label: 'Text Input' },
                  { value: 'number', label: 'Number Input' },
                  { value: 'select', label: 'Dropdown List' }
                ]}
                value={newAttrType}
                onChange={e => setNewAttrType(e.target.value as any)}
              />
              <div className="flex items-center gap-2 pb-3">
                <input
                  type="checkbox"
                  id="attrRequired"
                  className="w-4 h-4 rounded"
                  checked={newAttrRequired}
                  onChange={e => setNewAttrRequired(e.target.checked)}
                />
                <label htmlFor="attrRequired" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Required Field</label>
              </div>
              {newAttrType === 'select' && (
                <div className="col-span-full">
                  <Input
                    label="Dropdown Options (Comma separated list)"
                    value={newAttrOptions}
                    onChange={e => setNewAttrOptions(e.target.value)}
                    placeholder="e.g. Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              <Button type="button" size="sm" variant="secondary" onClick={handleAddAttribute} icon={<Plus size={14} />} className="col-span-full sm:col-span-1 sm:col-start-3">
                Add Field
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSaveCategory}>Save Category</Button>
          </div>
        </div>
      </Modal>

      {/* Category Field Options Manager Modal */}
      <Modal isOpen={optionsModalOpen} onClose={() => setOptionsModalOpen(false)} title={`Manage Options for ${optionsCategory?.name}`} size="xl">
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Brands (Parent options) */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Brands / Parent Options</h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Apple"
                  className="input text-xs"
                  value={newBrandNameInput}
                  onChange={(e) => setNewBrandNameInput(e.target.value)}
                />
                <Button size="sm" onClick={handleAddBrandOption} icon={<Plus size={14} />}>Add</Button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
                {brandsList.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedBrandOption(opt)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold",
                      selectedBrandOption?.id === opt.id
                        ? "bg-primary-500/10 text-primary-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <span>{opt.name}</span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedBrandOption(opt)}
                        className="text-xs text-primary-600 hover:underline font-bold"
                      >
                        Edit Models
                      </button>
                      <button
                        onClick={() => handleDeleteOption(opt.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {brandsList.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No brands defined yet.</p>}
              </div>
            </div>

            {/* Models (Child options for selected Brand) */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                Models for {selectedBrandOption ? selectedBrandOption.name : 'Select a Brand...'}
              </h3>
              
              {selectedBrandOption ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. iPhone 16 Pro Max"
                      className="input text-xs"
                      value={newModelNameInput}
                      onChange={(e) => setNewModelNameInput(e.target.value)}
                    />
                    <Button size="sm" onClick={handleAddModelOption} icon={<Plus size={14} />}>Add</Button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
                    {modelsList.map(opt => (
                      <div key={opt.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl text-xs font-medium">
                        <span>{opt.name}</span>
                        <button onClick={() => handleDeleteOption(opt.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {modelsList.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No models added for this brand yet.</p>}
                  </div>
                </>
              ) : (
                <div className="h-48 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
                  Select a brand on the left to manage models.
                </div>
              )}
            </div>

          </div>
          <div className="flex pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" className="w-full" onClick={() => setOptionsModalOpen(false)}>Close Manager</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// ============================================================
// MODERATORS MANAGEMENT
// ============================================================
export const AdminModeratorsPage: React.FC = () => {
  const [moderators, setModerators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMod, setEditingMod] = useState<User | null>(null);

  // Manual Moderator Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    usersService.getAllUsers().then(data => {
      const users = data as unknown as User[];
      setModerators(users.filter(u => u.role === 'moderator'));
    }).finally(() => setLoading(false));
  }, []);

  const handleStartAdd = () => {
    setEditingMod(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setAvatarFile(null);
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleStartEdit = (mod: User) => {
    setEditingMod(mod);
    setName(mod.full_name);
    setEmail(mod.email || '');
    setPhone(mod.phone || '');
    setPassword('');
    setAvatarFile(null);
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleCreateModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and Email are required');
      return;
    }
    if (!editingMod && !password) {
      toast.error('Password is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editingMod) {
        // 1. Update moderator auth or profile
        try {
          await usersService.updateAdmin(editingMod.id, {
            name,
            email,
            phone: phone || undefined,
            password: password || undefined
          });
        } catch (rpcErr) {
          // Fallback: update profile row directly
          const { error: directErr } = await supabase
            .from('users')
            .update({
              full_name: name,
              phone: phone || null,
              email: email,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingMod.id);
          if (directErr) throw directErr;
        }

        // 2. Upload avatar if chosen
        let avatarUrl = editingMod.avatar_url;
        if (avatarFile) {
          avatarUrl = await usersService.uploadAvatar(avatarFile, editingMod.id);
          await usersService.updateUser(editingMod.id, { avatar_url: avatarUrl });
        }

        setModerators(prev => prev.map(m => m.id === editingMod.id ? {
          ...m,
          full_name: name,
          email,
          phone: phone || null,
          avatar_url: avatarUrl || undefined,
          updated_at: new Date().toISOString()
        } : m));

        toast.success('Moderator account updated successfully');
        setModalOpen(false);
      } else {
        // Create mode (Invitation flow)
        const inviteId = await usersService.createModerator({ name, email, phone, password });

        // Upload avatar if chosen
        let avatarUrl = null;
        if (avatarFile && inviteId) {
          avatarUrl = await usersService.uploadAvatar(avatarFile, inviteId);
          await usersService.updateUser(inviteId, { avatar_url: avatarUrl });
        }

        const newMod: User = {
          id: inviteId,
          full_name: name,
          email,
          phone: phone || null,
          role: 'moderator',
          roles: ['moderator'],
          is_verified: true,
          email_verified: true,
          is_active: true,
          is_temp_password: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: avatarUrl || undefined,
        };

        setModerators(prev => [...prev, newMod]);
        toast.success('Moderator account created successfully & email sent!');
        setModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save moderator');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemote = async (id: string) => {
    try {
      await usersService.deleteUser(id);
      setModerators(prev => prev.filter(m => m.id !== id));
      toast.success('Moderator deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete moderator');
    }
  };

  return (
    <DashboardLayout navItems={adminNav} title="Manage Moderators">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Manage Moderators</h1>
          <Button icon={<UserPlus size={16} />} onClick={handleStartAdd}>Add Moderator</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : moderators.length === 0 ? (
          <EmptyState icon={<Shield size={28} />} title="No moderators" description="Add a moderator manually to start moderating content" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {moderators.map(mod => (
              <div key={mod.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 font-semibold shrink-0">
                  {mod.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{mod.full_name}</p>
                  <p className="text-xs text-slate-500">{mod.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="purple" className="capitalize">{mod.role.replace('_', ' ')}</Badge>
                    {mod.is_temp_password && (
                      <Badge variant="warning" className="text-[10px]">Pending Invite</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleStartEdit(mod)} className="text-xs text-primary-600 hover:underline">Edit</button>
                  {mod.role === 'moderator' && (
                    <button onClick={() => handleDemote(mod.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingMod ? "Edit Moderator" : "Add Moderator Manually"} size="sm">
        <form onSubmit={handleCreateModerator} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="E.g. Hamza Ali"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E.g. hamza@gmail.com"
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="E.g. 0300-1234567"
          />
          <div className="relative">
            <Input
              label={editingMod ? "New Password (Optional)" : "Password"}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={editingMod ? "Leave blank to keep current" : "Set password for login"}
              required={!editingMod}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div>
            <label className="label text-xs font-semibold mb-1">Avatar Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setAvatarFile(e.target.files?.[0] || null)}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-700 dark:file:text-slate-200 text-xs text-slate-500"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" type="submit" loading={submitting}>
              {editingMod ? "Save Changes" : "Create Moderator"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

// ============================================================
// ADMIN ANALYTICS PAGE
// ============================================================
export const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState({ total_listings: 0, total_users: 0, total_revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboardStats().then(setStats).finally(() => setLoading(false));
  }, []);

  // Mock trend data for visualization
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    listings: Math.floor(Math.random() * 50) + 20,
    users: Math.floor(Math.random() * 30) + 10,
  }));

  const categoryData = [
    { name: 'Vehicles', count: 1240 },
    { name: 'Property for Sale', count: 890 },
    { name: 'Mobile & Tech products', count: 2100 },
    { name: 'Jobs', count: 560 },
    { name: 'Fashion', count: 1450 },
  ];

  return (
    <DashboardLayout navItems={adminNav} title="Platform Analytics">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Platform Analytics</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Listings" value={stats.total_listings} icon={<Package size={20} />} color="blue" />
          <StatCard title="Total Users" value={stats.total_users} icon={<Users size={20} />} color="green" />
          <StatCard title="Total Revenue" value={formatPrice(stats.total_revenue)} icon={<DollarSign size={20} />} color="purple" />
          <StatCard title="Growth Rate" value="+18%" icon={<TrendingUp size={20} />} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Weekly Activity</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="listings" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Listings by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
