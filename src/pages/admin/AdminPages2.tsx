import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Tag, Shield, UserPlus, BarChart2, TrendingUp, Users, Package, DollarSign, ArrowUp, ArrowDown, Settings, Eye, X, EyeOff, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
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

  // View States: 3-Level Drill-Down vs Tree View
  const [viewMode, setViewMode] = useState<'drilldown' | 'tree'>('drilldown');
  const [selectedMainCatId, setSelectedMainCatId] = useState<string | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      const loadedCats = data || [];
      setCategories(loadedCats);
      checkUnsyncedCategories(loadedCats);

      // Auto-select first main category if none selected
      if (!selectedMainCatId) {
        const firstMain = loadedCats.find(c => !c.parent_id);
        if (firstMain) setSelectedMainCatId(firstMain.id);
      }
    } catch (e: any) {
      toast.error('Failed to load categories: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Map category levels and lineage
  const categoryLevelMap = React.useMemo(() => {
    const map = new Map<string, { level: number; path: string; parentId: string | null }>();
    
    // Pass 1: Level 1 Main Categories
    categories.filter(c => !c.parent_id).forEach(main => {
      map.set(main.id, { level: 1, path: main.name, parentId: null });
    });

    // Pass 2: Level 2 Sub Categories
    categories.filter(c => c.parent_id && map.get(c.parent_id)?.level === 1).forEach(sub => {
      const parentInfo = map.get(sub.parent_id!);
      map.set(sub.id, { level: 2, path: `${parentInfo?.path} → ${sub.name}`, parentId: sub.parent_id });
    });

    // Pass 3: Level 3 Sub-Sub Categories
    categories.filter(c => c.parent_id && map.get(c.parent_id)?.level === 2).forEach(subsub => {
      const parentInfo = map.get(subsub.parent_id!);
      map.set(subsub.id, { level: 3, path: `${parentInfo?.path} → ${subsub.name}`, parentId: subsub.parent_id });
    });

    return map;
  }, [categories]);

  // Valid Parent Options for Add/Edit Modal
  const parentOptions = React.useMemo(() => {
    const options: { value: string; label: string; level: number }[] = [];
    const mainCats = categories.filter(c => !c.parent_id);
    
    // Helper to check if category A is descendant of category B
    const isDescendant = (candidateId: string, targetId: string): boolean => {
      let curr = categories.find(c => c.id === candidateId);
      while (curr && curr.parent_id) {
        if (curr.parent_id === targetId) return true;
        curr = categories.find(c => c.id === curr!.parent_id);
      }
      return false;
    };

    mainCats.forEach(main => {
      // Exclude editing category and its descendants
      if (main.id !== editingCat?.id && (!editingCat || !isDescendant(main.id, editingCat.id))) {
        options.push({ value: main.id, label: `📁 Level 1: ${main.name}`, level: 1 });
        
        // Subcategories under this main category
        const subCats = categories.filter(c => c.parent_id === main.id);
        subCats.forEach(sub => {
          if (sub.id !== editingCat?.id && (!editingCat || !isDescendant(sub.id, editingCat.id))) {
            options.push({ value: sub.id, label: `   ↳ Level 2: ${main.name} → ${sub.name}`, level: 2 });
          }
        });
      }
    });

    return options;
  }, [categories, editingCat]);

  // Hierarchy Resolution helper for tree view
  const categoryTree = React.useMemo(() => {
    const parents = categories.filter(c => !c.parent_id).map(c => ({ ...c, subcategories: [] as Category[] }));
    const children = categories.filter(c => c.parent_id);
    const parentMap = new Map(parents.map(c => [c.id, c]));
    
    const orphans: Category[] = [];
    children.forEach(child => {
      const parent = parentMap.get(child.parent_id as string);
      if (parent) {
        parent.subcategories.push({ ...child, subcategories: [] });
      } else {
        orphans.push(child);
      }
    });

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

  // Category Lists for 3 Columns
  const mainCategoriesList = React.useMemo(() => {
    return categories
      .filter(c => !c.parent_id)
      .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, searchQuery]);

  const subCategoriesList = React.useMemo(() => {
    if (!selectedMainCatId) return [];
    return categories
      .filter(c => c.parent_id === selectedMainCatId)
      .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, selectedMainCatId, searchQuery]);

  const subSubCategoriesList = React.useMemo(() => {
    if (!selectedSubCatId) return [];
    return categories
      .filter(c => c.parent_id === selectedSubCatId)
      .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, selectedSubCatId, searchQuery]);

  // Selected Category Objects
  const activeMainCat = categories.find(c => c.id === selectedMainCatId);
  const activeSubCat = categories.find(c => c.id === selectedSubCatId);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    const ids = new Set<string>();
    categories.forEach(cat => ids.add(cat.id));
    setExpandedIds(ids);
  };

  const handleCollapseAll = () => setExpandedIds(new Set());

  // Start Adding Category with default parent prefilled
  const handleStartAdd = (presetParentId: string = '') => {
    setEditingCat(null);
    setName('');
    setIcon('Tag');
    setColor('#3b82f6');
    setParentId(presetParentId);
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
    if (!name.trim()) {
      toast.error('Category Name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slugify(name.trim()),
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

  const handleDeleteCategory = async (cat: Category) => {
    // Check nested children count
    const directChildren = categories.filter(c => c.parent_id === cat.id);
    const directChildIds = directChildren.map(c => c.id);
    const grandChildren = categories.filter(c => c.parent_id && directChildIds.includes(c.parent_id));
    const totalNested = directChildren.length + grandChildren.length;

    let confirmMsg = `Are you sure you want to delete category "${cat.name}"?`;
    if (totalNested > 0) {
      confirmMsg = `⚠️ WARNING: Category "${cat.name}" has ${directChildren.length} subcategories and ${grandChildren.length} sub-subcategories under it!\n\nDeleting it will unlink or delete all ${totalNested} nested categories. Are you sure you want to proceed?`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', cat.id);
      if (error) throw error;
      toast.success(`Category "${cat.name}" deleted successfully`);

      // Reset selection if deleted category was active
      if (selectedMainCatId === cat.id) setSelectedMainCatId(null);
      if (selectedSubCatId === cat.id) setSelectedSubCatId(null);

      fetchCategories();
    } catch (e: any) {
      toast.error('Failed to delete category: ' + e.message);
    }
  };

  const handleMoveOrder = async (cat: Category, direction: 'up' | 'down') => {
    // Find peer categories on the same level
    const peers = categories.filter(c => (c.parent_id || null) === (cat.parent_id || null))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const idx = peers.findIndex(c => c.id === cat.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= peers.length) return;

    const currentCat = peers[idx];
    const targetCat = peers[targetIdx];

    const currentOrder = currentCat.sort_order || idx;
    const targetOrder = targetCat.sort_order || targetIdx;

    try {
      await Promise.all([
        supabase.from('categories').update({ sort_order: targetOrder }).eq('id', currentCat.id),
        supabase.from('categories').update({ sort_order: currentOrder }).eq('id', targetCat.id)
      ]);
      fetchCategories();
      toast.success('Category order updated');
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
      if (selectedBrandOption?.id === id) setSelectedBrandOption(null);
      if (optionsCategory) fetchCategoryOptions(optionsCategory.id);
    } catch (e: any) {
      toast.error('Failed to delete option: ' + e.message);
    }
  };

  // Determine current modal target level info
  const targetParent = categories.find(c => c.id === parentId);
  const targetLevel = parentId ? ((categoryLevelMap.get(parentId)?.level || 1) + 1) : 1;

  return (
    <DashboardLayout navItems={adminNav} title="Manage Categories">
      <div className="space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">3-Level Category Manager</h1>
              <span className="text-xs bg-primary-500/20 text-primary-400 font-bold px-2.5 py-1 rounded-full border border-primary-500/30">
                Level 1 → Level 2 → Level 3
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Easily manage Main Categories, Sub Categories, and Sub-Sub Categories.
            </p>
          </div>

          {/* View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setViewMode('drilldown')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'drilldown' ? "bg-primary-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                3-Column Workflow
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'tree' ? "bg-primary-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                Tree View
              </button>
            </div>

            <Button icon={<Plus size={16} />} onClick={() => handleStartAdd('')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Add Main Category
            </Button>
          </div>
        </div>

        {/* Sync Banner */}
        {unsyncedCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">System Categories Unsynced</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-0.5">
                There are {unsyncedCount} system categories missing in database. Sync them to make them fully editable.
              </p>
            </div>
            <Button
              onClick={handleSyncCategories}
              loading={syncing}
              className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0"
            >
              Sync Categories
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Filter categories by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input w-full"
          />
        </div>

        {/* LOADING SKELETON */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        ) : viewMode === 'drilldown' ? (
          
          /* ============================================================ */
          /* 3-LEVEL DRILL-DOWN COLUMN WORKFLOW (RECOMMENDED)             */
          /* ============================================================ */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: LEVEL 1 MAIN CATEGORIES */}
            <div className="card p-4 border border-slate-200 dark:border-slate-800 flex flex-col h-[650px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 font-bold text-xs flex items-center justify-center">1</span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Main Categories</h3>
                  <span className="text-xs text-slate-400">({mainCategoriesList.length})</span>
                </div>
                <button
                  onClick={() => handleStartAdd('')}
                  className="text-xs text-primary-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {mainCategoriesList.map(cat => {
                  const subCount = categories.filter(c => c.parent_id === cat.id).length;
                  const isSelected = selectedMainCatId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedMainCatId(cat.id);
                        // Auto-select first subcategory
                        const firstSub = categories.find(c => c.parent_id === cat.id);
                        setSelectedSubCatId(firstSub ? firstSub.id : null);
                      }}
                      className={cn(
                        "p-3 rounded-2xl border transition-all cursor-pointer select-none group flex items-center justify-between",
                        isSelected
                          ? "bg-primary-50 dark:bg-primary-950/40 border-primary-500 shadow-sm"
                          : "border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: (cat.color || '#3b82f6') + '20' }}
                        >
                          <Icon name={cat.icon || 'Tag'} size={18} style={{ color: cat.color || '#3b82f6' }} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 transition-colors">
                            {cat.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {subCount} sub-categories
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleMoveOrder(cat, 'up')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400"><ArrowUp size={12} /></button>
                        <button onClick={() => handleMoveOrder(cat, 'down')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400"><ArrowDown size={12} /></button>
                        <button onClick={() => handleStartEdit(cat)} className="p-1 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-md"><Edit2 size={13} /></button>
                        <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md"><Trash2 size={13} /></button>
                        <ChevronRight size={16} className={cn("transition-transform ml-1", isSelected ? "text-primary-600 translate-x-0.5" : "text-slate-300 opacity-0 group-hover:opacity-100")} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: LEVEL 2 SUB CATEGORIES */}
            <div className="card p-4 border border-slate-200 dark:border-slate-800 flex flex-col h-[650px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {activeMainCat ? `Sub Categories under ${activeMainCat.name}` : 'Sub Categories'}
                    </h3>
                  </div>
                </div>
                {selectedMainCatId && (
                  <button
                    onClick={() => handleStartAdd(selectedMainCatId)}
                    className="text-xs text-primary-600 hover:underline font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} /> Add Sub
                  </button>
                )}
              </div>

              {!selectedMainCatId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <ChevronLeft size={32} className="mb-2 opacity-40 animate-pulse" />
                  <p className="text-xs">Select a Main Category on the left to manage its Level-2 Sub Categories.</p>
                </div>
              ) : subCategoriesList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <p className="text-xs font-semibold mb-3">No Sub Categories under "{activeMainCat?.name}" yet.</p>
                  <Button size="sm" onClick={() => handleStartAdd(selectedMainCatId)} icon={<Plus size={14} />}>
                    Add First Sub Category
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {subCategoriesList.map(sub => {
                    const subsubCount = categories.filter(c => c.parent_id === sub.id).length;
                    const isSelected = selectedSubCatId === sub.id;
                    const fieldsCount = (sub as any).attributes_schema?.length || 0;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubCatId(sub.id)}
                        className={cn(
                          "p-3 rounded-2xl border transition-all cursor-pointer select-none group flex items-center justify-between",
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm"
                            : "border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                              Level 2
                            </span>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">
                              {sub.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {subsubCount} sub-subs
                            </span>
                            {fieldsCount > 0 && (
                              <Badge variant="success" className="text-[9px] py-0">{`${fieldsCount} fields`}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleManageOptions(sub)} className="p-1 text-slate-400 hover:text-primary-600 rounded-md" title="Manage Options"><Settings size={12} /></button>
                          <button onClick={() => handleStartEdit(sub)} className="p-1 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-md"><Edit2 size={13} /></button>
                          <button onClick={() => handleDeleteCategory(sub)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md"><Trash2 size={13} /></button>
                          <ChevronRight size={16} className={cn("transition-transform ml-1", isSelected ? "text-indigo-600 translate-x-0.5" : "text-slate-300 opacity-0 group-hover:opacity-100")} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMN 3: LEVEL 3 SUB-SUB CATEGORIES */}
            <div className="card p-4 border border-slate-200 dark:border-slate-800 flex flex-col h-[650px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {activeSubCat ? `Sub-Sub Categories under ${activeSubCat.name}` : 'Sub-Sub Categories'}
                    </h3>
                  </div>
                </div>
                {selectedSubCatId && (
                  <button
                    onClick={() => handleStartAdd(selectedSubCatId)}
                    className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} /> Add Sub-Sub
                  </button>
                )}
              </div>

              {!selectedSubCatId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <ChevronLeft size={32} className="mb-2 opacity-40 animate-pulse" />
                  <p className="text-xs">Select a Level-2 Sub Category in column 2 to manage its Level-3 Sub-Sub Categories.</p>
                </div>
              ) : subSubCategoriesList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <p className="text-xs font-semibold mb-3">No Sub-Sub Categories under "{activeSubCat?.name}" yet.</p>
                  <Button size="sm" onClick={() => handleStartAdd(selectedSubCatId)} icon={<Plus size={14} />} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Add First Sub-Sub Category
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {subSubCategoriesList.map(subsub => {
                    const fieldsCount = (subsub as any).attributes_schema?.length || 0;

                    return (
                      <div
                        key={subsub.id}
                        className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                              Level 3
                            </span>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                              {subsub.name}
                            </h4>
                          </div>
                          {fieldsCount > 0 && (
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {fieldsCount} custom attributes
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleManageOptions(subsub)} className="p-1 text-slate-400 hover:text-primary-600 rounded-md" title="Manage Options"><Settings size={12} /></button>
                          <button onClick={() => handleStartEdit(subsub)} className="p-1 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-md"><Edit2 size={13} /></button>
                          <button onClick={() => handleDeleteCategory(subsub)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (

          /* ============================================================ */
          /* FULL HIERARCHY TREE VIEW (ALTERNATIVE VIEW)                 */
          /* ============================================================ */
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={handleExpandAll} className="text-xs px-3 py-1.5 h-auto">Expand All</Button>
              <Button variant="secondary" onClick={handleCollapseAll} className="text-xs px-3 py-1.5 h-auto">Collapse All</Button>
            </div>

            <div className="space-y-4">
              {categoryTree.map(cat => (
                <div key={cat.id} className="card p-4 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleExpanded(cat.id)}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: (cat.color || '#3b82f6') + '20' }}>
                        <Icon name={cat.icon || 'Tag'} size={18} style={{ color: cat.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          {cat.name}
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            expandedIds.has(cat.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                          )}
                        </h3>
                        <p className="text-xs text-slate-400">Level 1 Main Category · {cat.subcategories?.length || 0} subcategories</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleStartAdd(cat.id)} className="text-xs text-primary-600 font-bold px-2 py-1 hover:bg-primary-50 rounded-lg flex items-center gap-1"><Plus size={12} /> Add Sub</button>
                      <button onClick={() => handleStartEdit(cat)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={13} /></button>
                      <button onClick={() => handleDeleteCategory(cat)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {expandedIds.has(cat.id) && cat.subcategories && (
                    <div className="mt-3 pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-3">
                      {cat.subcategories.map(sub => (
                        <div key={sub.id} className="space-y-2">
                          <div className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl">
                            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => toggleExpanded(sub.id)}>
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">Level 2</span>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{sub.name}</span>
                              {sub.subcategories && sub.subcategories.length > 0 && (
                                expandedIds.has(sub.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleStartAdd(sub.id)} className="text-xs text-emerald-600 font-bold px-2 py-1 hover:bg-emerald-50 rounded-lg flex items-center gap-1"><Plus size={12} /> Add Sub-Sub</button>
                              <button onClick={() => handleManageOptions(sub)} className="p-1 text-slate-400 hover:text-primary-600"><Settings size={12} /></button>
                              <button onClick={() => handleStartEdit(sub)} className="p-1 text-slate-400 hover:text-primary-600"><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteCategory(sub)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </div>

                          {expandedIds.has(sub.id) && sub.subcategories && (
                            <div className="pl-6 border-l-2 border-dashed border-slate-100 dark:border-slate-800 space-y-1">
                              {sub.subcategories.map(subsub => (
                                <div key={subsub.id} className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Level 3</span>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{subsub.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleManageOptions(subsub)} className="p-1 text-slate-400 hover:text-primary-600"><Settings size={10} /></button>
                                    <button onClick={() => handleStartEdit(subsub)} className="p-1 text-slate-400 hover:text-primary-600"><Edit2 size={10} /></button>
                                    <button onClick={() => handleDeleteCategory(subsub)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={10} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADD / EDIT CATEGORY MODAL                                    */}
      {/* ============================================================ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? `Edit Category: ${editingCat.name}` : `Add New Level ${targetLevel} Category`}
        size="xl"
      >
        <div className="p-4 space-y-6">

          {/* Level Info Banner */}
          <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center text-white shadow-sm",
                targetLevel === 1 ? "bg-primary-600" : targetLevel === 2 ? "bg-indigo-600" : "bg-emerald-600"
              )}>
                {targetLevel}
              </span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  {targetLevel === 1 ? 'Level 1: Main Category' : targetLevel === 2 ? 'Level 2: Sub Category' : 'Level 3: Sub-Sub Category'}
                </span>
                {targetParent && (
                  <span className="text-[11px] text-slate-500">
                    Parent: <strong className="text-slate-700 dark:text-slate-300">{categoryLevelMap.get(targetParent.id)?.path || targetParent.name}</strong>
                  </span>
                )}
              </div>
            </div>

            <Badge variant={targetLevel === 1 ? 'primary' : targetLevel === 2 ? 'info' : 'success'}>
              Level {targetLevel}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Category Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Kids Vehicles"
            />

            {/* Hierarchical Parent Category Dropdown */}
            <Select
              label="Parent Category"
              options={[
                { value: '', label: 'None (Create as Level 1 Main Category)' },
                ...parentOptions.map(p => ({ value: p.value, label: p.label }))
              ]}
              value={parentId}
              onChange={e => setParentId(e.target.value)}
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
