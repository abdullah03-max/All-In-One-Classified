import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Tag, Shield, UserPlus, BarChart2, TrendingUp, Users, Package, DollarSign, ArrowUp, ArrowDown, Settings, Eye, X, EyeOff, ChevronDown, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button, Modal, Input, Select, Badge, Skeleton, EmptyState, StatCard } from '../../components/ui';
import { usersService, analyticsService, categoriesService, VIRTUAL_CATEGORIES } from '../../services';
import { User, Category } from '../../types';
import Icon from '../../components/ui/Icon';
import { adminNav } from './AdminPages';
import { formatDate, formatPrice, slugify, cn } from '../../utils/helpers';
import { STANDARD_ATTRIBUTES, getEnabledStandardAttrIds, getCustomAttributesSchema, combineAttributesSchema, getPriceEnabled, CustomAttributeDef } from '../../utils/standardAttributes';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

// ============================================================
// POPULAR ICONS PRESETS
// ============================================================
const PRESET_ICONS = [
  'Tag', 'Bike', 'Car', 'Smartphone', 'Laptop', 'Home', 'Briefcase', 'Shirt',
  'Sparkles', 'Tv', 'Gamepad', 'Utensils', 'Wrench', 'Shield', 'ShoppingBag',
  'Music', 'Book', 'Camera', 'Heart', 'Dumbbell', 'Watch', 'Plane', 'Layers',
  'Grid', 'Box', 'Folder', 'Truck', 'Zap'
];

// ============================================================
// CATEGORIES MANAGEMENT COMPONENT
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

  // Expandable tree state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Wizard Step State: 1 | 2 | 3 | 4
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Step 1: Main Category Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3b82f6');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  // Step 2: Subcategories (Comma-separated & List)
  const [subCatsCsvInput, setSubCatsCsvInput] = useState('');
  const [subCategoriesList, setSubCategoriesList] = useState<Array<{ id?: string; name: string; slug?: string }>>([]);

  // Step 3: Sub-Subcategories
  const [selectedSubForSubSub, setSelectedSubForSubSub] = useState<string>('');
  const [subSubCsvInput, setSubSubCsvInput] = useState('');
  const [subSubCategoriesMap, setSubSubCategoriesMap] = useState<Record<string, Array<{ id?: string; name: string; slug?: string }>>>({});

  // Step 4: Ad Details & Attributes
  const [priceEnabled, setPriceEnabled] = useState<boolean>(true);
  const [enabledStandardIds, setEnabledStandardIds] = useState<string[]>([]);
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeDef[]>([]);

  // Temp Custom Attribute Builder
  const [newAttrLabel, setNewAttrLabel] = useState('');
  const [newAttrType, setNewAttrType] = useState<'text' | 'number' | 'select' | 'checkbox' | 'radio'>('select');
  const [newAttrOptions, setNewAttrOptions] = useState('');
  const [newAttrRequired, setNewAttrRequired] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesService.getCategories();
      const loadedCats = data || [];
      setCategories(loadedCats);

      // Auto-select first main category if none selected
      if (!selectedMainCatId && loadedCats.length > 0) {
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
      const parentName = map.get(sub.parent_id!)?.path || '';
      map.set(sub.id, { level: 2, path: `${parentName} → ${sub.name}`, parentId: sub.parent_id });
    });

    // Pass 3: Level 3 Sub-Sub Categories
    categories.filter(c => c.parent_id && map.get(c.parent_id)?.level === 2).forEach(subsub => {
      const parentPath = map.get(subsub.parent_id!)?.path || '';
      map.set(subsub.id, { level: 3, path: `${parentPath} → ${subsub.name}`, parentId: subsub.parent_id });
    });

    return map;
  }, [categories]);

  // Hierarchical category tree
  const categoryTree = React.useMemo(() => {
    const mainCats = categories.filter(c => !c.parent_id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return mainCats.map(main => {
      const subcats = categories.filter(c => c.parent_id === main.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      const subcatsWithChildren = subcats.map(sub => {
        const subsubcats = categories.filter(c => c.parent_id === sub.id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        return { ...sub, subcategories: subsubcats };
      });

      return { ...main, subcategories: subcatsWithChildren };
    });
  }, [categories]);

  // Filtered lists for Drill-down
  const mainCategoriesList = React.useMemo(() => {
    return categories
      .filter(c => !c.parent_id)
      .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, searchQuery]);

  const subCategoriesListDrilldown = React.useMemo(() => {
    if (!selectedMainCatId) return [];
    return categories
      .filter(c => c.parent_id === selectedMainCatId)
      .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, selectedMainCatId, searchQuery]);

  const subSubCategoriesListDrilldown = React.useMemo(() => {
    if (!selectedSubCatId) return [];
    return categories
      .filter(c => c.parent_id === selectedSubCatId)
      .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, selectedSubCatId, searchQuery]);

  const activeMainCat = categories.find(c => c.id === selectedMainCatId);
  const activeSubCat = categories.find(c => c.id === selectedSubCatId);

  // Toggle tree expansion
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

  // ============================================================
  // OPEN MODAL FOR ADDING CATEGORY
  // ============================================================
  const handleStartAdd = (presetParentId: string = '') => {
    setEditingCat(null);
    setWizardStep(1);
    setName('');
    setIcon('Tag');
    setColor('#3b82f6');
    setParentId(presetParentId);
    setDescription('');
    setImageUrl('');
    setSortOrder(categories.length + 1);

    setSubCatsCsvInput('');
    setSubCategoriesList([]);
    setSelectedSubForSubSub('');
    setSubSubCsvInput('');
    setSubSubCategoriesMap({});

    setPriceEnabled(true);
    setEnabledStandardIds(['condition_full']);
    setCustomAttributes([]);

    setNewAttrLabel('');
    setNewAttrType('select');
    setNewAttrOptions('');
    setNewAttrRequired(false);

    setModalOpen(true);
  };

  // ============================================================
  // OPEN MODAL FOR EDITING CATEGORY (FULL REHYDRATION)
  // ============================================================
  const handleStartEdit = (cat: Category) => {
    setEditingCat(cat);
    setWizardStep(1);
    setName(cat.name);
    setIcon(cat.icon || 'Tag');
    setColor(cat.color || '#3b82f6');
    setParentId(cat.parent_id || '');
    setDescription(cat.description || '');
    setImageUrl((cat as any).image_url || '');
    setSortOrder(cat.sort_order || 0);

    // Rehydrate Subcategories if Level 1
    const existingSubs = categories.filter(c => c.parent_id === cat.id);
    setSubCategoriesList(existingSubs.map(s => ({ id: s.id, name: s.name, slug: s.slug })));
    setSubCatsCsvInput('');

    // Rehydrate Sub-Subcategories
    const subSubMap: Record<string, Array<{ id?: string; name: string; slug?: string }>> = {};
    existingSubs.forEach(sub => {
      const subsubs = categories.filter(c => c.parent_id === sub.id);
      subSubMap[sub.name] = subsubs.map(ss => ({ id: ss.id, name: ss.name, slug: ss.slug }));
    });
    setSubSubCategoriesMap(subSubMap);
    if (existingSubs.length > 0) {
      setSelectedSubForSubSub(existingSubs[0].name);
    }
    setSubSubCsvInput('');

    // Rehydrate Ad Details & Attributes
    const schema = (cat as any).attributes_schema || [];
    setPriceEnabled(getPriceEnabled(schema));
    setEnabledStandardIds(getEnabledStandardAttrIds(schema));
    setCustomAttributes(getCustomAttributesSchema(schema));

    setNewAttrLabel('');
    setNewAttrType('select');
    setNewAttrOptions('');
    setNewAttrRequired(false);

    setModalOpen(true);
  };

  // ============================================================
  // STEP 2: PARSE COMMA-SEPARATED SUBCATEGORIES
  // ============================================================
  const handleAddSubCategoriesFromCsv = () => {
    if (!subCatsCsvInput.trim()) return;
    const names = subCatsCsvInput.split(',').map(s => s.trim()).filter(Boolean);
    const updated = [...subCategoriesList];
    names.forEach(n => {
      if (!updated.some(existing => existing.name.toLowerCase() === n.toLowerCase())) {
        updated.push({ name: n, slug: slugify(n) });
      }
    });
    setSubCategoriesList(updated);
    setSubCatsCsvInput('');
    if (!selectedSubForSubSub && updated.length > 0) {
      setSelectedSubForSubSub(updated[0].name);
    }
  };

  const handleRemoveSubCategory = (subName: string) => {
    setSubCategoriesList(prev => prev.filter(s => s.name !== subName));
    setSubSubCategoriesMap(prev => {
      const copy = { ...prev };
      delete copy[subName];
      return copy;
    });
    if (selectedSubForSubSub === subName) {
      const remaining = subCategoriesList.filter(s => s.name !== subName);
      setSelectedSubForSubSub(remaining.length > 0 ? remaining[0].name : '');
    }
  };

  // ============================================================
  // STEP 3: PARSE COMMA-SEPARATED SUB-SUBCATEGORIES
  // ============================================================
  const handleAddSubSubCategoriesFromCsv = () => {
    if (!selectedSubForSubSub || !subSubCsvInput.trim()) return;
    const names = subSubCsvInput.split(',').map(s => s.trim()).filter(Boolean);
    const currentList = subSubCategoriesMap[selectedSubForSubSub] || [];
    const updated = [...currentList];
    names.forEach(n => {
      if (!updated.some(existing => existing.name.toLowerCase() === n.toLowerCase())) {
        updated.push({ name: n, slug: slugify(n) });
      }
    });
    setSubSubCategoriesMap(prev => ({
      ...prev,
      [selectedSubForSubSub]: updated
    }));
    setSubSubCsvInput('');
  };

  const handleRemoveSubSubCategory = (parentSubName: string, subSubName: string) => {
    setSubSubCategoriesMap(prev => ({
      ...prev,
      [parentSubName]: (prev[parentSubName] || []).filter(ss => ss.name !== subSubName)
    }));
  };

  // ============================================================
  // STEP 4: ATTRIBUTES & STANDARD TOGGLES
  // ============================================================
  const handleToggleStandardAttr = (stdId: string) => {
    setEnabledStandardIds(prev => {
      let next = [...prev];
      if (next.includes(stdId)) {
        next = next.filter(id => id !== stdId);
      } else {
        next.push(stdId);
        if (stdId === 'condition_full') {
          next = next.filter(id => id !== 'condition_simple');
        } else if (stdId === 'condition_simple') {
          next = next.filter(id => id !== 'condition_full');
        }
      }
      return next;
    });
  };

  const handleAddCustomAttribute = () => {
    if (!newAttrLabel.trim()) {
      toast.error('Attribute Label is required');
      return;
    }
    const slug = slugify(newAttrLabel.trim());
    if (customAttributes.some(a => a.name === slug)) {
      toast.error('An attribute with this label already exists.');
      return;
    }

    const optionsList = (newAttrType === 'select' || newAttrType === 'radio')
      ? newAttrOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newField: CustomAttributeDef = {
      name: slug,
      label: newAttrLabel.trim(),
      type: newAttrType,
      required: newAttrRequired,
      options: optionsList,
      isStandard: false
    };

    setCustomAttributes([...customAttributes, newField]);
    setNewAttrLabel('');
    setNewAttrOptions('');
    setNewAttrRequired(false);
  };

  const handleRemoveCustomAttribute = (index: number) => {
    setCustomAttributes(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // SAVE FULL CATEGORY & ALL NESTED LEVELS (ATOMIC & DUPLICATE-FREE)
  // ============================================================
  const handleSaveFullCategory = async () => {
    if (!name.trim()) {
      toast.error('Main Category Name is required');
      setWizardStep(1);
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving category & hierarchy...');

    try {
      const combinedSchema = combineAttributesSchema(enabledStandardIds, customAttributes, priceEnabled);

      let mainCatId = editingCat ? editingCat.id : null;

      const mainPayload: any = {
        name: name.trim(),
        slug: slugify(name.trim()),
        icon: icon || 'Tag',
        color: color || '#3b82f6',
        parent_id: parentId || null,
        description: description || null,
        image_url: imageUrl || null,
        sort_order: sortOrder,
        attributes_schema: combinedSchema,
        is_active: true
      };

      // 1. Save or Update Main Category
      if (editingCat) {
        const { error: updateErr } = await supabase
          .from('categories')
          .update(mainPayload)
          .eq('id', editingCat.id);
        if (updateErr) throw updateErr;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('categories')
          .insert(mainPayload)
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        mainCatId = inserted.id;
      }

      if (!mainCatId) throw new Error('Could not obtain category ID');

      // 2. Save Subcategories (Step 2)
      for (const sub of subCategoriesList) {
        let subId = sub.id;
        const subPayload: any = {
          name: sub.name.trim(),
          slug: slugify(sub.name.trim()),
          icon: icon || 'Tag',
          color: color || '#3b82f6',
          parent_id: mainCatId,
          sort_order: 0,
          attributes_schema: combinedSchema,
          is_active: true
        };

        if (subId) {
          await supabase.from('categories').update(subPayload).eq('id', subId);
        } else {
          const { data: insertedSub, error: subErr } = await supabase
            .from('categories')
            .insert(subPayload)
            .select('id')
            .single();
          if (!subErr && insertedSub) {
            subId = insertedSub.id;
          }
        }

        // 3. Save Sub-Subcategories for this subcategory (Step 3)
        const subSubList = subSubCategoriesMap[sub.name] || [];
        if (subId && subSubList.length > 0) {
          for (const subsub of subSubList) {
            const subSubPayload: any = {
              name: subsub.name.trim(),
              slug: slugify(subsub.name.trim()),
              icon: icon || 'Tag',
              color: color || '#3b82f6',
              parent_id: subId,
              sort_order: 0,
              attributes_schema: combinedSchema,
              is_active: true
            };

            if (subsub.id) {
              await supabase.from('categories').update(subSubPayload).eq('id', subsub.id);
            } else {
              await supabase.from('categories').insert(subSubPayload);
            }
          }
        }
      }

      toast.success('Category & all subcategories saved successfully!', { id: toastId });
      setModalOpen(false);
      fetchCategories();
    } catch (e: any) {
      toast.error('Error saving category: ' + e.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // SYNC ALL VIRTUAL CATEGORIES TO DATABASE
  // ============================================================
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleSyncAllToDb = async () => {
    if (!confirm('This will sync all standard categories, subcategories, and their schemas into Supabase database. Proceed?')) return;
    setIsSyncingAll(true);
    const toastId = toast.loading('Syncing categories to database...');
    try {
      const res = await categoriesService.syncAllToDatabase((msg) => {
        toast.loading(msg, { id: toastId });
      });
      if (res.success) {
        toast.success(`Successfully synced ${res.count} categories to Supabase database!`, { id: toastId });
        fetchCategories();
      } else {
        toast.error('Sync failed: ' + (res.error?.message || 'Unknown error'), { id: toastId });
      }
    } catch (err: any) {
      toast.error('Sync error: ' + err.message, { id: toastId });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // ============================================================
  // DELETE CATEGORY
  // ============================================================
  const handleDeleteCategory = async (cat: Category) => {
    const directChildren = categories.filter(c => c.parent_id === cat.id);
    const directChildIds = directChildren.map(c => c.id);
    const grandChildren = categories.filter(c => c.parent_id && directChildIds.includes(c.parent_id));
    const grandChildIds = grandChildren.map(c => c.id);
    const totalNested = directChildren.length + grandChildren.length;
    const allIdsToDelete = [cat.id, ...directChildIds, ...grandChildIds];

    let confirmMsg = `Are you sure you want to delete category "${cat.name}"?`;
    if (totalNested > 0) {
      confirmMsg = `⚠️ WARNING: "${cat.name}" has ${directChildren.length} subcategories and ${grandChildren.length} sub-subcategories under it.\n\nDeleting it will remove all ${totalNested} nested categories. Proceed?`;
    }

    if (!confirm(confirmMsg)) return;

    const toastId = toast.loading(`Deleting "${cat.name}"...`);

    try {
      // 1. Resolve listings table foreign key constraints:
      // A) Nullify subcategory_id in listings referencing any deleted ID
      try {
        await supabase
          .from('listings')
          .update({ subcategory_id: null })
          .in('subcategory_id', allIdsToDelete);
      } catch (err) {
        console.warn('Subcategory FK update warning:', err);
      }

      // B) Reassign category_id in listings referencing any deleted ID to a safe fallback category
      const remainingCats = categories.filter(c => !allIdsToDelete.includes(c.id));
      const fallbackCat = remainingCats.find(c => !c.parent_id) || remainingCats[0];

      if (fallbackCat) {
        try {
          await supabase
            .from('listings')
            .update({ category_id: fallbackCat.id })
            .in('category_id', allIdsToDelete);
        } catch (err) {
          console.warn('Category FK update warning:', err);
        }
      }

      // 2. Cascading delete from child sub-subcategories -> subcategories -> parent
      if (grandChildIds.length > 0) {
        await supabase.from('categories').delete().in('id', grandChildIds);
        await supabase.from('categories').update({ is_active: false }).in('id', grandChildIds);
      }
      if (directChildIds.length > 0) {
        await supabase.from('categories').delete().in('id', directChildIds);
        await supabase.from('categories').update({ is_active: false }).in('id', directChildIds);
      }

      // 3. Delete / deactivate parent category
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);
      if (error) {
        // If hard delete still hits any table constraint, perform soft delete
        await supabase.from('categories').upsert({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          is_active: false,
        });
      }

      toast.success(`Category "${cat.name}" deleted successfully`, { id: toastId });

      if (selectedMainCatId === cat.id) setSelectedMainCatId(null);
      if (selectedSubCatId === cat.id) setSelectedSubCatId(null);

      fetchCategories();
    } catch (e: any) {
      console.error('Delete category error:', e);
      toast.error('Failed to delete category: ' + e.message, { id: toastId });
    }
  };

  const handleMoveOrder = async (cat: Category, direction: 'up' | 'down') => {
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
      toast.success('Order updated');
    } catch (e: any) {
      toast.error('Failed to reorder: ' + e.message);
    }
  };

  return (
    <DashboardLayout navItems={adminNav} title="Category Management">
      <div className="space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Category Management System</h1>
              <span className="text-xs bg-primary-500/20 text-primary-400 font-bold px-2.5 py-1 rounded-full border border-primary-500/30">
                Main → Sub → Sub-Sub
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Configure dynamic categories, ad attributes, price settings, and subcategories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setViewMode('drilldown')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'drilldown' ? "bg-primary-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                Drill-Down
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

            <button
              onClick={handleSyncAllToDb}
              disabled={isSyncingAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncingAll ? "animate-spin" : ""} />
              {isSyncingAll ? 'Syncing...' : 'Sync All to Database'}
            </button>

            <Button icon={<Plus size={16} />} onClick={() => handleStartAdd('')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
              Add Category
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Search categories across all levels..."
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
          /* 3-LEVEL DRILL-DOWN COLUMN WORKFLOW                           */
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
                  <Plus size={14} /> Add Main
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {mainCategoriesList.map(cat => {
                  const subCount = categories.filter(c => c.parent_id === cat.id).length;
                  const isSelected = selectedMainCatId === cat.id;
                  const isPriceOn = getPriceEnabled((cat as any).attributes_schema);

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedMainCatId(cat.id);
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
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: (cat.color || '#3b82f6') + '20' }}
                        >
                          <Icon name={cat.icon || 'Tag'} size={18} style={{ color: cat.color || '#3b82f6' }} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 transition-colors">
                            {cat.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {subCount} subcategories
                            </span>
                            {!isPriceOn && (
                              <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold px-1.5 py-0.2 rounded">
                                No Price
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleMoveOrder(cat, 'up')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"><ArrowUp size={12} /></button>
                        <button onClick={() => handleMoveOrder(cat, 'down')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"><ArrowDown size={12} /></button>
                        <button onClick={() => handleStartEdit(cat)} className="p-1 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded"><Edit2 size={13} /></button>
                        <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"><Trash2 size={13} /></button>
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
                      {activeMainCat ? `Subcategories (${activeMainCat.name})` : 'Subcategories'}
                    </h3>
                  </div>
                </div>
                {selectedMainCatId && (
                  <button
                    onClick={() => handleStartEdit(activeMainCat!)}
                    className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} /> Add/Edit Subs
                  </button>
                )}
              </div>

              {!selectedMainCatId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <ChevronLeft size={32} className="mb-2 opacity-40 animate-pulse" />
                  <p className="text-xs">Select a Main Category on the left to view and manage its Subcategories.</p>
                </div>
              ) : subCategoriesListDrilldown.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <p className="text-xs font-semibold mb-3">No Subcategories under "{activeMainCat?.name}" yet.</p>
                  <Button size="sm" onClick={() => handleStartEdit(activeMainCat!)} icon={<Plus size={14} />}>
                    Add Subcategories
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {subCategoriesListDrilldown.map(sub => {
                    const subsubCount = categories.filter(c => c.parent_id === sub.id).length;
                    const isSelected = selectedSubCatId === sub.id;

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
                              {subsubCount} sub-subcategories
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleStartEdit(sub)} className="p-1 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded"><Edit2 size={13} /></button>
                          <button onClick={() => handleDeleteCategory(sub)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"><Trash2 size={13} /></button>
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
                      {activeSubCat ? `Sub-Subcategories (${activeSubCat.name})` : 'Sub-Subcategories'}
                    </h3>
                  </div>
                </div>
                {selectedSubCatId && (
                  <button
                    onClick={() => handleStartEdit(activeMainCat || activeSubCat!)}
                    className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} /> Add/Edit Sub-Sub
                  </button>
                )}
              </div>

              {!selectedSubCatId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <ChevronLeft size={32} className="mb-2 opacity-40 animate-pulse" />
                  <p className="text-xs">Select a Level-2 Subcategory in column 2 to view its Sub-Subcategories.</p>
                </div>
              ) : subSubCategoriesListDrilldown.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <p className="text-xs font-semibold mb-3">No Sub-Subcategories under "{activeSubCat?.name}" yet.</p>
                  <Button size="sm" onClick={() => handleStartEdit(activeMainCat || activeSubCat!)} icon={<Plus size={14} />} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Add Sub-Subcategories
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {subSubCategoriesListDrilldown.map(subsub => (
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
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleStartEdit(subsub)} className="p-1 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded"><Edit2 size={13} /></button>
                        <button onClick={() => handleDeleteCategory(subsub)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (

          /* ============================================================ */
          /* FULL HIERARCHY TREE VIEW                                     */
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
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: (cat.color || '#3b82f6') + '20' }}>
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
      {/* 4-STEP CATEGORY CREATION & EDITING WIZARD MODAL             */}
      {/* ============================================================ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? `Edit Category: ${name || editingCat.name}` : `Create & Configure Category`}
        size="xl"
      >
        <div className="p-4 space-y-6">

          {/* Wizard Step Tabs */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
            {[
              { num: 1, label: 'Main Category', desc: 'Name & Icon' },
              { num: 2, label: 'Subcategories', desc: 'Bulk comma list' },
              { num: 3, label: 'Sub-Subcategories', desc: '3rd level items' },
              { num: 4, label: 'Ad Details & Fields', desc: 'Price & attributes' }
            ].map(step => (
              <button
                key={step.num}
                type="button"
                onClick={() => setWizardStep(step.num)}
                className={cn(
                  "p-2.5 rounded-2xl text-left transition-all border flex flex-col items-start gap-0.5",
                  wizardStep === step.num
                    ? "bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-700 dark:text-primary-300 shadow-sm"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center",
                    wizardStep === step.num ? "bg-primary-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600"
                  )}>
                    {step.num}
                  </span>
                  <span className="text-xs font-bold truncate">{step.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 pl-6 hidden sm:inline">{step.desc}</span>
              </button>
            ))}
          </div>

          {/* ============================================================ */}
          {/* STEP 1: MAIN CATEGORY FORM                                   */}
          {/* ============================================================ */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Category Name *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Bikes, Electronics, Jobs"
                />

                <Select
                  label="Parent Category (Optional - Leave empty for Level 1)"
                  options={[
                    { value: '', label: 'None (Create as Level 1 Main Category)' },
                    ...categories.filter(c => !editingCat || c.id !== editingCat.id).map(c => ({
                      value: c.id,
                      label: `${categoryLevelMap.get(c.id)?.path || c.name} (Level ${categoryLevelMap.get(c.id)?.level || 1})`
                    }))
                  ]}
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                />

                <div>
                  <label className="label">Icon Selection</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={icon}
                      onChange={e => setIcon(e.target.value)}
                      placeholder="Tag, Bike, Car..."
                      className="flex-1"
                    />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <Icon name={icon || 'Tag'} size={20} style={{ color }} />
                    </div>
                  </div>

                  {/* Preset Icons Palette */}
                  <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                    {PRESET_ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={cn(
                          "p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all",
                          icon === ic
                            ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        )}
                      >
                        <Icon name={ic} size={13} />
                        <span className="text-[10px]">{ic}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Input label="Color Theme" value={color} onChange={e => setColor(e.target.value)} type="color" className="h-10 cursor-pointer" />
                  <Input label="Sort Order" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} type="number" />
                </div>

                <div className="col-span-full">
                  <Input label="Illustration/Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                </div>

                <div className="col-span-full">
                  <label className="label">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="input h-16 resize-none" placeholder="Description of the category" />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="button" onClick={() => setWizardStep(2)} className="bg-primary-600 text-white">
                  Next: Add Subcategories →
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: SUBCATEGORIES BULK COMMA INPUT                       */}
          {/* ============================================================ */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">Add Subcategories (Bulk Comma Separated)</h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                    Enter multiple subcategory names separated by commas. Example: <strong className="font-bold">Standard Bikes, Electric Bikes, Sports Bikes, Scooters</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={subCatsCsvInput}
                    onChange={e => setSubCatsCsvInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubCategoriesFromCsv(); } }}
                    placeholder="Standard Bikes, Electric Bikes, Sports Bikes..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddSubCategoriesFromCsv} icon={<Plus size={14} />} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                    Add List
                  </Button>
                </div>
              </div>

              {/* Subcategories Chip List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subcategories for "{name || 'Main Category'}" ({subCategoriesList.length})
                  </h5>
                </div>

                {subCategoriesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 border border-dashed rounded-xl text-center">
                    No subcategories added yet. Type comma-separated names above and click "Add List".
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {subCategoriesList.map((sub, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
                      >
                        {sub.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubCategory(sub.name)}
                          className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5 text-indigo-600 dark:text-indigo-300"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-3">
                <Button type="button" variant="secondary" onClick={() => setWizardStep(1)}>
                  ← Back: Main Category
                </Button>
                <Button type="button" onClick={() => setWizardStep(3)} className="bg-primary-600 text-white">
                  Next: Add Sub-Subcategories →
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SUB-SUBCATEGORIES FORM                               */}
          {/* ============================================================ */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Add Sub-Subcategories under Subcategories</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Select a subcategory, then enter comma-separated 3rd level items. Example: <strong className="font-bold">E-Bike 250W, E-Bike 500W, Mountain E-Bike</strong>
                  </p>
                </div>

                {subCategoriesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Please add subcategories in Step 2 first.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Select
                        label="Select Subcategory"
                        options={subCategoriesList.map(s => ({ value: s.name, label: s.name }))}
                        value={selectedSubForSubSub}
                        onChange={e => setSelectedSubForSubSub(e.target.value)}
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Sub-Subcategories (Comma separated)"
                          value={subSubCsvInput}
                          onChange={e => setSubSubCsvInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubSubCategoriesFromCsv(); } }}
                          placeholder="e.g. E-Bike 250W, E-Bike 500W..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" onClick={handleAddSubSubCategoriesFromCsv} icon={<Plus size={14} />} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Add to {selectedSubForSubSub || 'Subcategory'}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Sub-Subcategories Overview */}
              <div className="space-y-3">
                {subCategoriesList.map(sub => {
                  const subsubs = subSubCategoriesMap[sub.name] || [];
                  return (
                    <div key={sub.name} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {sub.name} <span className="text-slate-400 font-normal">({subsubs.length} sub-subs)</span>
                        </span>
                      </div>

                      {subsubs.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No sub-subcategories added.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {subsubs.map((ss, idx) => (
                            <span
                              key={idx}
                              className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-2.5 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                            >
                              {ss.name}
                              <button
                                type="button"
                                onClick={() => handleRemoveSubSubCategory(sub.name, ss.name)}
                                className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 text-emerald-600 dark:text-emerald-300"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-3">
                <Button type="button" variant="secondary" onClick={() => setWizardStep(2)}>
                  ← Back: Subcategories
                </Button>
                <Button type="button" onClick={() => setWizardStep(4)} className="bg-primary-600 text-white">
                  Next: Ad Details & Attributes →
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: AD DETAILS & ATTRIBUTES CONFIGURATION                */}
          {/* ============================================================ */}
          {wizardStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* PRICE TOGGLE CONFIGURATION */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Enable Price Field for this Category</span>
                    <Badge variant={priceEnabled ? 'success' : 'warning'}>
                      {priceEnabled ? 'Price Enabled' : 'Price Disabled (Jobs/Services)'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    When disabled, users will not see the Price field when posting ads in this category (e.g. Jobs, Resumes, Free Services).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priceEnabled}
                    onChange={e => setPriceEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* STANDARD ATTRIBUTES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Standard Attributes / Features</h4>
                  <span className="text-[10px] bg-primary-100 dark:bg-primary-950 text-primary-600 font-bold px-2 py-0.5 rounded-full">Built-In</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(STANDARD_ATTRIBUTES).map(stdAttr => {
                    const isChecked = enabledStandardIds.includes(stdAttr.id);
                    return (
                      <div
                        key={stdAttr.id}
                        onClick={() => handleToggleStandardAttr(stdAttr.id)}
                        className={cn(
                          "p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3",
                          isChecked
                            ? "bg-primary-500/10 border-primary-500 dark:bg-primary-950/40"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-primary-600 mt-0.5 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <strong className="text-xs text-slate-800 dark:text-slate-100 font-bold">{stdAttr.name}</strong>
                            <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded">
                              {stdAttr.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Options: <span className="font-semibold text-slate-700 dark:text-slate-300">{stdAttr.description}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CUSTOM ATTRIBUTES BUILDER */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Custom Attributes Builder</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create custom category fields (e.g. Dropdown, Text, Number, Checkbox, Radio).
                  </p>
                </div>

                {/* List of Custom Attributes */}
                {customAttributes.length > 0 ? (
                  <div className="space-y-2">
                    {customAttributes.map((field, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold">{field.label}</strong>
                            <Badge variant="info" className="text-[9px] py-0">{field.type.toUpperCase()}</Badge>
                            {field.required && <Badge variant="warning" className="text-[9px] py-0">Required</Badge>}
                          </div>
                          {field.options && field.options.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Options: <span className="font-semibold text-slate-700 dark:text-slate-300">{field.options.join(', ')}</span>
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCustomAttribute(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 border border-dashed rounded-xl text-center">
                    No custom attributes added yet. Add custom fields below.
                  </p>
                )}

                {/* Form to Add Custom Attribute */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Field Label"
                      value={newAttrLabel}
                      onChange={e => setNewAttrLabel(e.target.value)}
                      placeholder="e.g. PTA Status, Transmission, Storage"
                    />

                    <Select
                      label="Field Type"
                      options={[
                        { value: 'select', label: 'Dropdown List (Select)' },
                        { value: 'text', label: 'Text Input' },
                        { value: 'number', label: 'Number Input' },
                        { value: 'checkbox', label: 'Checkbox' },
                        { value: 'radio', label: 'Radio Buttons' }
                      ]}
                      value={newAttrType}
                      onChange={e => setNewAttrType(e.target.value as any)}
                    />

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="attrRequired"
                        className="w-4 h-4 rounded text-primary-600 cursor-pointer"
                        checked={newAttrRequired}
                        onChange={e => setNewAttrRequired(e.target.checked)}
                      />
                      <label htmlFor="attrRequired" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Required Field
                      </label>
                    </div>
                  </div>

                  {(newAttrType === 'select' || newAttrType === 'radio') && (
                    <Input
                      label="Options (Comma separated list) *"
                      value={newAttrOptions}
                      onChange={e => setNewAttrOptions(e.target.value)}
                      placeholder="e.g. PTA Approved, Non-PTA, JV or Male, Female, Pair"
                    />
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleAddCustomAttribute}
                      icon={<Plus size={14} />}
                    >
                      Add Custom Attribute
                    </Button>
                  </div>
                </div>
              </div>

              {/* SAVE / SUBMIT ACTIONS */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setWizardStep(3)}>
                  ← Back: Sub-Subcategories
                </Button>
                <Button
                  type="button"
                  loading={isSaving}
                  onClick={handleSaveFullCategory}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg font-bold"
                >
                  Save Full Category & All Levels
                </Button>
              </div>
            </div>
          )}

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
