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
 * Extracts enabled standard attribute IDs from a category's attributes_schema array.
 */
export const getEnabledStandardAttrIds = (attributesSchema: any[] = []): string[] => {
  if (!Array.isArray(attributesSchema)) return [];
  
  const enabledIds: string[] = [];
  attributesSchema.forEach(field => {
    if (field && (field.isStandard || field.is_standard)) {
      const stdId = field.standardId || field.standard_id || field.name;
      if (stdId && STANDARD_ATTRIBUTES[stdId]) {
        enabledIds.push(stdId);
      }
    }
  });

  return Array.from(new Set(enabledIds));
};

/**
 * Filter out standard attributes to keep custom attributes separate.
 */
export const getCustomAttributesSchema = (attributesSchema: any[] = []): any[] => {
  if (!Array.isArray(attributesSchema)) return [];
  return attributesSchema.filter(field => field && !field.isStandard && !field.is_standard);
};

/**
 * Combines selected standard attribute IDs and custom attribute fields into a unified attributes_schema array.
 */
export const combineAttributesSchema = (enabledStandardIds: string[] = [], customFields: any[] = []): any[] => {
  const combined: any[] = [];

  // Add standard attributes first
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
