export interface StandardAttributeOption {
  value: string;
  label: string;
}

export interface StandardAttributeDef {
  id: string; // 'condition_full' | 'condition_simple' | 'animal_sex' | 'human_gender'
  name: string;
  label: string;
  options: StandardAttributeOption[];
  description: string;
  badge: string;
}

export interface CustomAttributeDef {
  name: string;
  label: string;
  type: 'select' | 'text' | 'number' | 'checkbox' | 'radio';
  required: boolean;
  options?: string[];
  isStandard?: boolean;
}

export const STANDARD_ATTRIBUTES: Record<string, StandardAttributeDef> = {
  condition_full: {
    id: 'condition_full',
    name: 'Condition (Full Options)',
    label: 'Condition',
    options: [
      { value: 'new', label: 'New' },
      { value: 'used', label: 'Used' },
      { value: 'refurbished', label: 'Refurbished' },
      { value: 'open_box', label: 'Open Box' }
    ],
    description: 'New, Used, Refurbished, Open Box',
    badge: 'Full Condition'
  },
  condition_simple: {
    id: 'condition_simple',
    name: 'Condition (Simple Options)',
    label: 'Condition',
    options: [
      { value: 'new', label: 'New' },
      { value: 'used', label: 'Used' }
    ],
    description: 'Only New, Used',
    badge: 'Simple Condition'
  },
  animal_sex: {
    id: 'animal_sex',
    name: 'Animal Sex',
    label: 'Sex',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'pair', label: 'Pair' }
    ],
    description: 'Male, Female, Pair (for Pets & Animals)',
    badge: 'Pets & Animals'
  },
  human_gender: {
    id: 'human_gender',
    name: 'Human Gender',
    label: 'Gender',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' }
    ],
    description: 'Male, Female, Other (for Jobs & Services)',
    badge: 'Jobs & Services'
  }
};

/**
 * Checks if Price is enabled for this category schema.
 * Defaults to true unless explicitly disabled (e.g. for Jobs or Services).
 */
export const getPriceEnabled = (attributesSchema: any = []): boolean => {
  if (!attributesSchema) return true;
  if (Array.isArray(attributesSchema)) {
    // Check if there is a meta field
    const meta = attributesSchema.find(f => f && (f._type === '__category_config__' || f.name === '__price_config__'));
    if (meta && typeof meta.price_enabled === 'boolean') {
      return meta.price_enabled;
    }
    // Also check if any field has price_enabled: false
    const disabledField = attributesSchema.find(f => f && f.price_enabled === false);
    if (disabledField) return false;
    return true;
  }
  if (typeof attributesSchema === 'object' && attributesSchema !== null) {
    if (typeof attributesSchema.price_enabled === 'boolean') {
      return attributesSchema.price_enabled;
    }
  }
  return true;
};

/**
 * Extracts enabled standard attribute IDs from a category's attributes_schema array.
 */
export const getEnabledStandardAttrIds = (attributesSchema: any[] = []): string[] => {
  if (!Array.isArray(attributesSchema)) return [];
  
  const enabledIds: string[] = [];
  attributesSchema.forEach(field => {
    if (!field || field._type === '__category_config__') return;
    if (field.isStandard || field.is_standard) {
      const stdId = field.standardId || field.standard_id || field.name;
      if (stdId && STANDARD_ATTRIBUTES[stdId]) {
        enabledIds.push(stdId);
      }
    }
  });

  return Array.from(new Set(enabledIds));
};

/**
 * Filter out standard attributes and config objects to keep custom attributes separate.
 */
export const getCustomAttributesSchema = (attributesSchema: any[] = []): CustomAttributeDef[] => {
  if (!Array.isArray(attributesSchema)) return [];
  return attributesSchema.filter(field => 
    field && 
    field._type !== '__category_config__' && 
    field.name !== '__price_config__' &&
    !field.isStandard && 
    !field.is_standard
  );
};

/**
 * Combines priceEnabled setting, selected standard attribute IDs, and custom attribute fields
 * into a unified attributes_schema array.
 */
export const combineAttributesSchema = (
  enabledStandardIds: string[] = [], 
  customFields: CustomAttributeDef[] = [],
  priceEnabled: boolean = true
): any[] => {
  const combined: any[] = [];

  // Add Category Config header object (stores price_enabled and metadata)
  combined.push({
    _type: '__category_config__',
    price_enabled: priceEnabled,
  });

  // Add standard attributes
  enabledStandardIds.forEach(stdId => {
    const def = STANDARD_ATTRIBUTES[stdId];
    if (def) {
      combined.push({
        name: stdId,
        label: def.label,
        type: 'select',
        options: def.options.map(o => o.label),
        required: false,
        isStandard: true,
        standardId: stdId
      });
    }
  });

  // Add custom fields
  customFields.forEach(field => {
    combined.push({
      ...field,
      isStandard: false
    });
  });

  return combined;
};
