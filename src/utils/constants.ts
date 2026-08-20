import { Category } from '../types';

export const SEATING_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'upholstery_material', label: 'Upholstery Material', type: 'select', options: ['Fabric', 'Leather', 'Velvet', 'Rexine', 'Mesh', 'Plastic', 'Wood', 'Other'], required: true },
  { name: 'frame_material', label: 'Frame Material', type: 'select', options: ['Wood', 'Metal', 'Plastic', 'Iron', 'Engineered Wood', 'Other'], required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'seating_capacity', label: 'Seating Capacity', type: 'select', options: ['1 Seater', '2 Seater', '3 Seater', 'L-Shape', 'Sofa Set', 'Other'], required: false },
  { name: 'cushion_material', label: 'Cushion Material', type: 'select', options: ['Foam', 'Spring', 'Fiber', 'Feather', 'Other'], required: false },
  { name: 'foldable', label: 'Foldable', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'assembly_required', label: 'Assembly Required', type: 'select', options: ['Yes', 'No'], required: false }
];

export const BEDDING_MATTRESS_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'select', options: ['King', 'Queen', 'Double', 'Single', 'Super King', 'Custom / Other'], required: true },
  { name: 'material', label: 'Material', type: 'select', options: ['Wood', 'Metal', 'Memory Foam', 'Spring Mattress', 'Cotton', 'Silk', 'Polyester', 'Velvet', 'Other'], required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'storage_included', label: 'Storage Included', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'set_includes', label: 'Set Includes', type: 'text', required: false }
];

export const TABLE_DINING_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'select', options: ['Wood', 'Glass', 'Metal', 'Marble', 'Plastic', 'Engineered Wood', 'Other'], required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'dimensions', label: 'Dimensions (L × W × H)', type: 'text', required: false },
  { name: 'shape', label: 'Shape', type: 'select', options: ['Rectangular', 'Round', 'Square', 'Oval', 'Hexagonal', 'Other'], required: false },
  { name: 'assembly_required', label: 'Assembly Required', type: 'select', options: ['Yes', 'No'], required: false }
];

export const BATHROOM_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'select', options: ['Ceramic', 'Brass', 'Stainless Steel', 'Chrome', 'PVC', 'Acrylic', 'Other'], required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'installation_type', label: 'Installation Type', type: 'select', options: ['Wall Mounted', 'Floor Mounted', 'Deck Mounted', 'Concealed', 'Other'], required: false },
  { name: 'dimensions', label: 'Dimensions', type: 'text', required: false }
];

export const GARDEN_OUTDOOR_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'select', options: ['Rattan/Wicker', 'Wood', 'Metal', 'Plastic', 'Fabric', 'Other'], required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'indoor_outdoor', label: 'Indoor/Outdoor Use', type: 'select', options: ['Outdoor Only', 'Indoor & Outdoor'], required: false },
  { name: 'water_resistance', label: 'Water Resistance', type: 'select', options: ['Waterproof', 'Water-Resistant', 'No Resistance'], required: false },
  { name: 'dimensions', label: 'Dimensions', type: 'text', required: false }
];

export const LIGHTING_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'bulb_type', label: 'Bulb/Base Type', type: 'select', options: ['LED', 'Halogen', 'Incandescent', 'Smart Bulb', 'E27', 'E14', 'B22', 'Other'], required: true },
  { name: 'wattage', label: 'Wattage (W)', type: 'text', required: false },
  { name: 'power_source', label: 'Power Source', type: 'select', options: ['Corded Electric', 'Battery Powered', 'Solar Powered', 'USB / Rechargeable', 'Other'], required: false },
  { name: 'light_color', label: 'Light Color / Temp', type: 'select', options: ['Warm White', 'Cool White', 'Daylight', 'RGB Multi-Color', 'Other'], required: false },
  { name: 'dimmable', label: 'Dimmable', type: 'select', options: ['Yes', 'No'], required: false }
];

export const DECOR_SCHEMA = [
  { name: 'material', label: 'Material', type: 'select', options: ['Glass', 'Wood', 'Ceramic', 'Metal', 'Canvas', 'Plastic', 'Resin', 'Wax', 'Other'], required: true },
  { name: 'color_theme', label: 'Color / Theme', type: 'text', required: false },
  { name: 'mount_type', label: 'Mount Type', type: 'select', options: ['Wall Mounted', 'Tabletop', 'Floor Standing', 'Hanging', 'Other'], required: false },
  { name: 'dimensions', label: 'Dimensions', type: 'text', required: false },
  { name: 'weight', label: 'Weight', type: 'text', required: false }
];

export const KITCHENWARE_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'select', options: ['Ceramic', 'Glass', 'Stainless Steel', 'Porcelain', 'Plastic', 'Wood', 'Silicone', 'Other'], required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'number_of_pieces', label: 'Number of Pieces', type: 'number', required: false },
  { name: 'capacity_volume', label: 'Capacity / Volume', type: 'text', required: false },
  { name: 'set_includes', label: 'Set Includes', type: 'text', required: false }
];

export const STORAGE_SCHEMA = [
  { name: 'material', label: 'Material', type: 'select', options: ['Wood', 'Metal', 'Plastic', 'Fabric', 'Glass', 'Engineered Wood', 'Other'], required: true },
  { name: 'dimensions', label: 'Dimensions (L × W × H)', type: 'text', required: false },
  { name: 'shelves_drawers', label: 'Shelves / Drawers', type: 'select', options: ['1', '2', '3', '4', '5', '6+', 'N/A'], required: false },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'assembly_required', label: 'Assembly Required', type: 'select', options: ['Yes', 'No'], required: false }
];

export const CLEANING_LAUNDRY_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'type', label: 'Product Type', type: 'select', options: ['Liquid', 'Powder', 'Spray', 'Refill pack', 'Cleaning Tool / Brush', 'Mop / Sweeper', 'Other'], required: true },
  { name: 'volume_weight', label: 'Volume / Weight', type: 'text', required: false },
  { name: 'scent', label: 'Scent / Fragrance', type: 'text', required: false }
];

export const COMMON_JOB_FIELDS = [
  { name: 'company_name', label: 'Company Name', type: 'text', required: true },
  { name: 'company_description', label: 'Company Description', type: 'text', required: false },
  { name: 'employment_type', label: 'Employment Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Freelance'], required: true },
  { name: 'workplace_type', label: 'Workplace Type', type: 'select', options: ['On-site', 'Remote', 'Hybrid'], required: true },
  { name: 'salary_type', label: 'Salary Type', type: 'select', options: ['Hourly', 'Monthly', 'Yearly', 'Negotiable'], required: true },
  { name: 'min_salary', label: 'Minimum Salary', type: 'text', required: false },
  { name: 'max_salary', label: 'Maximum Salary', type: 'text', required: false },
  { name: 'vacancies', label: 'Number of Vacancies', type: 'text', required: false },
  { name: 'gender_preference', label: 'Gender Preference', type: 'select', options: ['Male', 'Female', 'No Preference'], required: false },
  { name: 'min_age', label: 'Minimum Age', type: 'text', required: false },
  { name: 'max_age', label: 'Maximum Age', type: 'text', required: false },
  { name: 'education_level', label: 'Education Level', type: 'select', options: ['Matric', 'Intermediate', 'Bachelors', 'Masters', 'PhD', 'Other'], required: false },
  { name: 'experience_required', label: 'Experience Required', type: 'select', options: ['Fresh / No Experience', 'Under 1 Year', '1-2 Years', '3-5 Years', '5+ Years'], required: false },
  { name: 'skills_required', label: 'Skills Required', type: 'text', required: false },
  { name: 'languages_required', label: 'Languages Required', type: 'text', required: false },
  { name: 'responsibilities', label: 'Responsibilities', type: 'text', required: false },
  { name: 'benefits', label: 'Benefits & Perks', type: 'text', required: false },
  { name: 'working_days', label: 'Working Days', type: 'text', required: false },
  { name: 'working_hours', label: 'Working Hours', type: 'text', required: false },
  { name: 'shift_type', label: 'Shift Type', type: 'select', options: ['Morning', 'Evening', 'Night', 'Rotational'], required: false },
  { name: 'deadline', label: 'Application Deadline', type: 'text', required: false },
  { name: 'joining_date', label: 'Expected Joining Date', type: 'text', required: false },
  { name: 'career_level', label: 'Career Level', type: 'select', options: ['Entry', 'Mid', 'Senior', 'Manager'], required: false },
  { name: 'industry', label: 'Industry', type: 'text', required: false },
  { name: 'required_documents', label: 'Required Documents', type: 'text', required: false },
  { name: 'contact_person', label: 'Contact Person', type: 'text', required: false },
  { name: 'contact_number', label: 'Contact Number', type: 'text', required: false },
  { name: 'email_address', label: 'Email Address', type: 'text', required: false },
  { name: 'company_website', label: 'Company Website', type: 'text', required: false },
  { name: 'urgent_hiring', label: 'Urgent Hiring', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'visa_sponsorship', label: 'Visa Sponsorship', type: 'select', options: ['Yes', 'No', 'Not Applicable'], required: false },
  { name: 'accommodation_provided', label: 'Accommodation Provided', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'transportation_provided', label: 'Transportation Provided', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'food_provided', label: 'Food Provided', type: 'select', options: ['Yes', 'No'], required: false }
];

export const GENERAL_JOB_SCHEMA = [...COMMON_JOB_FIELDS];

export const DRIVER_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'driving_license_type', label: 'Driving License Type', type: 'select', options: ['LTV', 'HTV', 'Motorcycle', 'Commercial', 'Other'], required: true },
  { name: 'license_expiry', label: 'License Expiry Date', type: 'text', required: false },
  { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: ['Car', 'Van', 'Truck', 'Bus', 'Motorcycle', 'Rickshaw', 'Other'], required: true },
  { name: 'route_type', label: 'Route Type', type: 'select', options: ['Local', 'Intercity', 'International', 'Outstation'], required: false },
  { name: 'delivery_experience', label: 'Delivery Experience', type: 'select', options: ['Yes', 'No'], required: false }
];

export const IT_NETWORKING_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'programming_languages', label: 'Programming Languages', type: 'text', required: false },
  { name: 'frameworks', label: 'Frameworks', type: 'text', required: false },
  { name: 'databases', label: 'Databases', type: 'text', required: false },
  { name: 'cloud_platforms', label: 'Cloud Platforms', type: 'text', required: false },
  { name: 'certifications', label: 'Certifications', type: 'text', required: false },
  { name: 'github_portfolio', label: 'GitHub/Portfolio URL', type: 'text', required: false }
];

export const GRAPHIC_DESIGN_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'design_software', label: 'Design Software', type: 'text', required: false },
  { name: 'portfolio_url', label: 'Portfolio URL', type: 'text', required: false },
  { name: 'motion_graphics_experience', label: 'Motion Graphics Experience', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'ui_ux_skills', label: 'UI/UX Skills', type: 'select', options: ['Yes', 'No'], required: false }
];

export const MEDICAL_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'medical_license', label: 'Medical License Number', type: 'text', required: true },
  { name: 'specialization', label: 'Specialization', type: 'text', required: false },
  { name: 'certifications', label: 'Certifications', type: 'text', required: false },
  { name: 'shift_preference', label: 'Shift Preference', type: 'select', options: ['Morning', 'Evening', 'Night', 'Rotational'], required: false }
];

export const EDUCATION_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'subject', label: 'Teaching Subject', type: 'text', required: true },
  { name: 'grade_level', label: 'Grade Level', type: 'text', required: false },
  { name: 'teaching_experience', label: 'Teaching Experience', type: 'select', options: ['Under 1 Year', '1-2 Years', '3-5 Years', '5+ Years'], required: false },
  { name: 'certifications', label: 'Teaching Certifications', type: 'text', required: false }
];

export const ENGINEERING_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'engineering_discipline', label: 'Engineering Discipline', type: 'select', options: ['Civil', 'Mechanical', 'Electrical', 'Chemical', 'Software', 'Aerospace', 'Other'], required: true },
  { name: 'cad_software', label: 'CAD / Design Software', type: 'text', required: false },
  { name: 'professional_certifications', label: 'Professional Certifications', type: 'text', required: false }
];

export const ACCOUNTING_FINANCE_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'accounting_software', label: 'Accounting Software (QuickBooks, SAP, Oracle)', type: 'select', options: ['QuickBooks', 'SAP', 'Oracle', 'Tally', 'Zoho', 'Other'], required: false },
  { name: 'qualification', label: 'CA / ACCA Qualification', type: 'select', options: ['CA', 'ACCA', 'CPA', 'CFA', 'MBA Finance', 'B.Com', 'Other'], required: false },
  { name: 'tax_knowledge', label: 'Tax Knowledge', type: 'select', options: ['Yes', 'No'], required: false }
];

export const SECURITY_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'weapon_license', label: 'Weapon License', type: 'select', options: ['Required', 'Not Required', 'Preferred'], required: false },
  { name: 'security_experience', label: 'Security Experience', type: 'select', options: ['Under 1 Year', '1-2 Years', '3-5 Years', '5+ Years'], required: false },
  { name: 'physical_fitness', label: 'Physical Fitness Requirements', type: 'text', required: false }
];

export const SALES_MARKETING_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'sales_targets', label: 'Sales Targets / Quota', type: 'text', required: false },
  { name: 'crm_experience', label: 'CRM Experience', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'digital_marketing_skills', label: 'Digital Marketing Skills', type: 'text', required: false },
  { name: 'social_media_experience', label: 'Social Media Experience', type: 'select', options: ['Yes', 'No'], required: false }
];

export const HOTELS_RESTAURANTS_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'position', label: 'Position / Role', type: 'text', required: false },
  { name: 'food_safety_certification', label: 'Food Safety Certification', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'hospitality_experience', label: 'Hospitality Experience', type: 'select', options: ['Under 1 Year', '1-2 Years', '3-5 Years', '5+ Years'], required: false }
];

export const CONTENT_WRITING_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'writing_niche', label: 'Writing Niche', type: 'text', required: false },
  { name: 'seo_knowledge', label: 'SEO Knowledge', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'portfolio_url', label: 'Portfolio URL', type: 'text', required: false },
  { name: 'word_count_experience', label: 'Word Count Experience', type: 'text', required: false }
];

export const CUSTOMER_SERVICE_CALL_CENTER_JOB_SCHEMA = [
  ...COMMON_JOB_FIELDS,
  { name: 'language_proficiency', label: 'Language Proficiency', type: 'text', required: false },
  { name: 'typing_speed', label: 'Typing Speed (WPM)', type: 'text', required: false },
  { name: 'communication_skills', label: 'Communication Skills', type: 'select', options: ['Excellent', 'Good', 'Average'], required: false },
  { name: 'crm_experience', label: 'CRM Experience', type: 'select', options: ['Yes', 'No'], required: false }
];

export const CLOTHING_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: true },
  { name: 'category_type', label: 'Category Type', type: 'select', options: ['Eastern', 'Western', 'Sportswear', 'Intimates', 'Costumes', 'Accessories', 'Other'], required: true },
  { name: 'clothing_type', label: 'Clothing Type', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Custom'], required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'material_fabric', label: 'Material/Fabric', type: 'text', required: false },
  { name: 'pattern', label: 'Pattern', type: 'text', required: false },
  { name: 'sleeve_type', label: 'Sleeve Type', type: 'text', required: false },
  { name: 'fit', label: 'Fit', type: 'text', required: false },
  { name: 'season', label: 'Season', type: 'text', required: false },
  { name: 'with_tags', label: 'With Tags', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'altered', label: 'Altered', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'occasion', label: 'Occasion', type: 'select', options: ['Casual', 'Formal', 'Party', 'Wedding', 'Sports'], required: false },
  { name: 'authenticity', label: 'Authenticity', type: 'text', required: false }
];

export const FOOTWEAR_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: true },
  { name: 'shoe_type', label: 'Shoe Type', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'text', required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'sole_material', label: 'Sole Material', type: 'text', required: false },
  { name: 'original_box', label: 'Original Box', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'authenticity', label: 'Authenticity', type: 'text', required: false }
];

export const BAGS_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'bag_type', label: 'Bag Type', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'text', required: false },
  { name: 'capacity', label: 'Capacity', type: 'text', required: false },
  { name: 'authenticity', label: 'Authenticity', type: 'text', required: false }
];

export const FASHION_ACCESSORIES_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'accessory_type', label: 'Accessory Type', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'text', required: false },
  { name: 'style', label: 'Style', type: 'text', required: false }
];

export const MAKEUP_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'product_type', label: 'Product Type', type: 'text', required: false },
  { name: 'shade_color', label: 'Shade/Color', type: 'text', required: false },
  { name: 'skin_type', label: 'Skin Type', type: 'text', required: false },
  { name: 'finish', label: 'Finish', type: 'text', required: false },
  { name: 'coverage', label: 'Coverage', type: 'text', required: false },
  { name: 'expiry_date', label: 'Expiry Date', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity', type: 'text', required: false },
  { name: 'sealed', label: 'Sealed', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'authenticity', label: 'Authenticity', type: 'text', required: false }
];

export const SKIN_HAIR_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'product_type', label: 'Product Type', type: 'text', required: false },
  { name: 'hair_skin_type', label: 'Hair Type / Skin Type', type: 'text', required: false },
  { name: 'concern', label: 'Concern', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity', type: 'text', required: false },
  { name: 'expiry_date', label: 'Expiry Date', type: 'text', required: false },
  { name: 'ingredients', label: 'Ingredients', type: 'text', required: false },
  { name: 'authenticity', label: 'Authenticity', type: 'text', required: false }
];

export const FRAGRANCE_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: false },
  { name: 'fragrance_type', label: 'Fragrance Type', type: 'text', required: false },
  { name: 'size', label: 'Size (ml)', type: 'text', required: false },
  { name: 'concentration', label: 'Concentration', type: 'select', options: ['EDP', 'EDT', 'EDC', 'Parfum', 'Body Mist', 'Cologne', 'Other'], required: false },
  { name: 'remaining_quantity', label: 'Remaining Quantity', type: 'text', required: false },
  { name: 'authenticity', label: 'Authenticity', type: 'text', required: false }
];

export const WEDDING_SCHEMA = [
  { name: 'brand_designer', label: 'Brand / Designer', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex'], required: true },
  { name: 'wearer_type', label: 'Type', type: 'select', options: ['Bridal', 'Formal', 'Groom'], required: true },
  { name: 'size', label: 'Size', type: 'text', required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'fabric', label: 'Fabric', type: 'text', required: false },
  { name: 'embroidery', label: 'Embroidery', type: 'text', required: false },
  { name: 'worn_before', label: 'Worn Before', type: 'select', options: ['Yes', 'No'], required: false }
];

export const BATH_BODY_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'product_type', label: 'Product Type', type: 'text', required: false },
  { name: 'skin_type', label: 'Skin Type', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity', type: 'text', required: false },
  { name: 'expiry_date', label: 'Expiry Date', type: 'text', required: false },
  { name: 'sealed', label: 'Sealed', type: 'select', options: ['Yes', 'No'], required: false }
];

export const WATCHES_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: true },
  { name: 'watch_type', label: 'Watch Type', type: 'select', options: ['Analog', 'Digital', 'Smart'], required: true },
  { name: 'strap_material', label: 'Strap Material', type: 'text', required: false },
  { name: 'dial_color', label: 'Dial Color', type: 'text', required: false },
  { name: 'case_size', label: 'Case Size', type: 'text', required: false },
  { name: 'movement', label: 'Movement', type: 'text', required: false },
  { name: 'water_resistant', label: 'Water Resistant', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'original_box', label: 'Original Box', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
];

export const JEWELLERY_SCHEMA = [
  { name: 'brand', label: 'Brand (if applicable)', type: 'text', required: false },
  { name: 'jewellery_type', label: 'Jewellery Type', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: false },
  { name: 'material', label: 'Material', type: 'select', options: ['Gold', 'Silver', 'Platinum', 'Artificial', 'Brass', 'Copper', 'Other'], required: true },
  { name: 'stone_type', label: 'Stone Type', type: 'text', required: false },
  { name: 'purity', label: 'Purity (e.g. 22K)', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'text', required: false },
  { name: 'weight', label: 'Weight', type: 'text', required: false },
  { name: 'hallmark', label: 'Hallmark', type: 'select', options: ['Yes', 'No'], required: false }
];

export const DIY_JEWELLERY_SCHEMA = [
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'kit_type', label: 'Kit Type', type: 'text', required: false },
  { name: 'pieces_count', label: 'Number of Pieces', type: 'text', required: false },
  { name: 'suitable_for', label: 'Suitable For', type: 'text', required: false }
];

export const OTHER_FASHION_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'text', required: false }
];

// ─── Education Attribute Schemas ────────────────────────────────────────────

export const EDU_BOOKS_SCHEMA = [
  { name: 'book_title', label: 'Book Title', type: 'text', required: true },
  { name: 'author', label: 'Author', type: 'text', required: false },
  { name: 'publisher', label: 'Publisher', type: 'text', required: false },
  { name: 'edition', label: 'Edition', type: 'text', required: false },
  { name: 'year', label: 'Year of Publication', type: 'text', required: false },
  { name: 'isbn', label: 'ISBN', type: 'text', required: false },
  { name: 'subject', label: 'Subject', type: 'text', required: false },
  { name: 'language', label: 'Language', type: 'select', options: ['English', 'Urdu', 'Arabic', 'Other'], required: false },
  { name: 'book_format', label: 'Format', type: 'select', options: ['Paperback', 'Hardcover', 'Softcover', 'Spiral Bound'], required: false },
  { name: 'pages', label: 'Number of Pages', type: 'text', required: false },
  { name: 'highlighting', label: 'Highlighting/Annotations', type: 'select', options: ['None', 'Light', 'Heavy'], required: false }
];

export const EDU_SCHOOL_BOOKS_SCHEMA = [
  { name: 'book_title', label: 'Book Title', type: 'text', required: true },
  { name: 'class_grade', label: 'Class / Grade', type: 'select', options: ['Pre-Primary', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9 (Matric)', 'Class 10 (Matric)', 'Class 11 (FSc/FA)', 'Class 12 (FSc/FA)', 'Other'], required: true },
  { name: 'subject', label: 'Subject', type: 'text', required: true },
  { name: 'board', label: 'Board', type: 'select', options: ['Federal Board', 'Punjab Board', 'Sindh Board', 'KPK Board', 'Balochistan Board', 'AJK Board', 'Other'], required: false },
  { name: 'publisher', label: 'Publisher', type: 'text', required: false },
  { name: 'year', label: 'Year', type: 'text', required: false },
  { name: 'highlighting', label: 'Highlighting/Annotations', type: 'select', options: ['None', 'Light', 'Heavy'], required: false }
];

export const EDU_UNIVERSITY_BOOKS_SCHEMA = [
  { name: 'book_title', label: 'Book Title', type: 'text', required: true },
  { name: 'author', label: 'Author', type: 'text', required: false },
  { name: 'publisher', label: 'Publisher', type: 'text', required: false },
  { name: 'edition', label: 'Edition', type: 'text', required: false },
  { name: 'year', label: 'Year', type: 'text', required: false },
  { name: 'isbn', label: 'ISBN', type: 'text', required: false },
  { name: 'degree_level', label: 'Degree Level', type: 'select', options: ['Bachelors', 'Masters', 'MPhil', 'PhD', 'Other'], required: false },
  { name: 'subject', label: 'Subject / Field', type: 'text', required: false },
  { name: 'language', label: 'Language', type: 'select', options: ['English', 'Urdu', 'Arabic', 'Other'], required: false },
  { name: 'highlighting', label: 'Highlighting/Annotations', type: 'select', options: ['None', 'Light', 'Heavy'], required: false }
];

export const EDU_TUTORING_SCHEMA = [
  { name: 'subject', label: 'Subject', type: 'text', required: true },
  { name: 'class_grade', label: 'Class / Grade Level', type: 'select', options: ['Pre-Primary', 'Primary (1-5)', 'Middle (6-8)', 'Matric (9-10)', 'FSc/FA/ICS (11-12)', 'A-Level', 'O-Level', 'Bachelors', 'Masters', 'Other'], required: true },
  { name: 'tutor_gender', label: 'Tutor Gender', type: 'select', options: ['Male', 'Female', 'Any'], required: false },
  { name: 'mode', label: 'Mode of Teaching', type: 'select', options: ['In-Person', 'Online', 'Both'], required: true },
  { name: 'timing', label: 'Timing Preference', type: 'text', required: false },
  { name: 'days_per_week', label: 'Days per Week', type: 'select', options: ['1', '2', '3', '4', '5', '6', '7', 'Flexible'], required: false },
  { name: 'session_duration', label: 'Session Duration', type: 'select', options: ['30 min', '45 min', '1 hour', '1.5 hours', '2 hours', 'Flexible'], required: false },
  { name: 'experience_years', label: 'Experience (Years)', type: 'text', required: false },
  { name: 'qualification', label: 'Tutor Qualification', type: 'text', required: false },
  { name: 'board_university', label: 'Board / University (if relevant)', type: 'text', required: false },
  { name: 'group_individual', label: 'Session Type', type: 'select', options: ['Individual', 'Group', 'Both'], required: false }
];

export const EDU_ONLINE_COURSE_SCHEMA = [
  { name: 'course_title', label: 'Course Title', type: 'text', required: true },
  { name: 'platform', label: 'Platform', type: 'text', required: false },
  { name: 'instructor', label: 'Instructor', type: 'text', required: false },
  { name: 'skill_level', label: 'Skill Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'], required: false },
  { name: 'duration', label: 'Duration', type: 'text', required: false },
  { name: 'language', label: 'Language', type: 'select', options: ['English', 'Urdu', 'Arabic', 'Other'], required: false },
  { name: 'certificate', label: 'Includes Certificate', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'access_type', label: 'Access Type', type: 'select', options: ['Lifetime', 'Limited Time', 'Subscription'], required: false },
  { name: 'topics_covered', label: 'Topics Covered', type: 'text', required: false }
];

export const EDU_ACADEMY_SCHEMA = [
  { name: 'course_title', label: 'Course / Program Name', type: 'text', required: true },
  { name: 'academy_name', label: 'Academy / Institute Name', type: 'text', required: false },
  { name: 'subject_field', label: 'Subject / Field', type: 'text', required: true },
  { name: 'level', label: 'Level', type: 'select', options: ['Matric Prep', 'FSc/FA Prep', 'O-Level', 'A-Level', 'Bachelors Entry', 'Entry Test Prep', 'Professional', 'Other'], required: false },
  { name: 'mode', label: 'Mode', type: 'select', options: ['In-Person', 'Online', 'Hybrid'], required: true },
  { name: 'duration', label: 'Duration', type: 'text', required: false },
  { name: 'batch_timing', label: 'Batch / Timing', type: 'text', required: false },
  { name: 'certificate', label: 'Includes Certificate', type: 'select', options: ['Yes', 'No'], required: false }
];

export const EDU_TEST_PREP_SCHEMA = [
  { name: 'exam_name', label: 'Exam Name', type: 'text', required: true },
  { name: 'subject', label: 'Subject', type: 'text', required: false },
  { name: 'level', label: 'Level', type: 'select', options: ['Matric', 'FSc/FA', 'O-Level', 'A-Level', 'MDCAT', 'ECAT', 'IELTS', 'GRE', 'SAT', 'GMAT', 'CSS', 'PMS', 'NTS', 'Other'], required: true },
  { name: 'mode', label: 'Mode', type: 'select', options: ['In-Person', 'Online', 'Both'], required: false },
  { name: 'duration', label: 'Duration', type: 'text', required: false },
  { name: 'includes_material', label: 'Includes Study Material', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'mock_tests', label: 'Mock Tests Included', type: 'select', options: ['Yes', 'No'], required: false }
];

export const EDU_STUDY_MATERIAL_SCHEMA = [
  { name: 'material_type', label: 'Material Type', type: 'select', options: ['Past Papers', 'Notes', 'Worksheets', 'Flashcards', 'Guides', 'Practice Sets', 'Study Kits', 'Other'], required: true },
  { name: 'subject', label: 'Subject', type: 'text', required: true },
  { name: 'class_grade', label: 'Class / Grade / Level', type: 'text', required: false },
  { name: 'board_university', label: 'Board / University', type: 'text', required: false },
  { name: 'year', label: 'Year (if applicable)', type: 'text', required: false },
  { name: 'format', label: 'Format', type: 'select', options: ['Printed', 'Digital (PDF)', 'Both'], required: false },
  { name: 'language', label: 'Language', type: 'select', options: ['English', 'Urdu', 'Arabic', 'Other'], required: false }
];

export const EDU_STATIONERY_SCHEMA = [
  { name: 'item_type', label: 'Item Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity / Pack Size', type: 'text', required: false },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'suitable_for', label: 'Suitable For', type: 'text', required: false }
];

export const EDU_INSTRUMENTS_SCHEMA = [
  { name: 'instrument_type', label: 'Instrument Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'subject', label: 'Subject / Use', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity', type: 'text', required: false },
  { name: 'age_range', label: 'Age Range', type: 'text', required: false }
];

export const EDU_UNIFORM_SCHEMA = [
  { name: 'school_college', label: 'School / College Name', type: 'text', required: false },
  { name: 'uniform_type', label: 'Uniform Type', type: 'select', options: ['School Uniform', 'Sports Uniform', 'Lab Coat', 'Apron', 'Other'], required: true },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Boys', 'Girls', 'Men', 'Women', 'Unisex'], required: true },
  { name: 'size', label: 'Size', type: 'text', required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'pieces', label: 'Number of Pieces', type: 'text', required: false },
  { name: 'worn_before', label: 'Worn Before', type: 'select', options: ['Yes', 'No'], required: false }
];

export const EDU_SCHOOL_SUPPLIES_SCHEMA = [
  { name: 'item_type', label: 'Item Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'suitable_for', label: 'Suitable For', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity', type: 'text', required: false }
];

export const EDU_LANGUAGE_SCHEMA = [
  { name: 'language_taught', label: 'Language', type: 'text', required: true },
  { name: 'proficiency_level', label: 'Level', type: 'select', options: ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'All Levels'], required: true },
  { name: 'mode', label: 'Mode', type: 'select', options: ['In-Person', 'Online', 'Both'], required: true },
  { name: 'session_type', label: 'Session Type', type: 'select', options: ['Individual', 'Group', 'Both'], required: false },
  { name: 'duration', label: 'Duration', type: 'text', required: false },
  { name: 'certification', label: 'Certification Prep', type: 'select', options: ['None', 'IELTS', 'TOEFL', 'PTE', 'DET', 'Other'], required: false }
];

export const EDU_SCHOLARSHIP_SCHEMA = [
  { name: 'scholarship_name', label: 'Scholarship Name', type: 'text', required: true },
  { name: 'provider', label: 'Provider / Organization', type: 'text', required: false },
  { name: 'country', label: 'Country', type: 'text', required: false },
  { name: 'level', label: 'Level', type: 'select', options: ['Undergraduate', 'Masters', 'PhD', 'Short Course', 'Other'], required: false },
  { name: 'field_of_study', label: 'Field of Study', type: 'text', required: false },
  { name: 'deadline', label: 'Application Deadline', type: 'text', required: false },
  { name: 'coverage', label: 'Coverage', type: 'text', required: false }
];

// ─── Sports & Hobbies Attribute Schemas ────────────────────────────────────

export const SPORTS_EQUIPMENT_SCHEMA = [
  { name: 'sport_type', label: 'Sport Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'item_type', label: 'Item Type', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'age_group', label: 'Age Group', type: 'select', options: ['Kids', 'Youth', 'Adult', 'All Ages'], required: false }
];

export const GYM_FITNESS_SCHEMA = [
  { name: 'equipment_type', label: 'Equipment Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'weight_capacity', label: 'Weight Capacity (kg)', type: 'text', required: false },
  { name: 'dimensions', label: 'Dimensions', type: 'text', required: false },
  { name: 'assembly_required', label: 'Assembly Required', type: 'select', options: ['Yes', 'No'], required: false }
];

export const MUSICAL_INSTRUMENTS_SCHEMA = [
  { name: 'instrument_type', label: 'Instrument Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'model', label: 'Model', type: 'text', required: false },
  { name: 'skill_level', label: 'Skill Level', type: 'select', options: ['Beginner', 'Intermediate', 'Professional'], required: false },
  { name: 'includes_accessories', label: 'Includes Accessories', type: 'select', options: ['Yes', 'No'], required: false }
];

export const ARTS_CRAFTS_SCHEMA = [
  { name: 'item_type', label: 'Item Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity / Pack Size', type: 'text', required: false },
  { name: 'suitable_for', label: 'Suitable For', type: 'text', required: false }
];

export const CAMPING_HIKING_SCHEMA = [
  { name: 'item_type', label: 'Item Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'capacity', label: 'Capacity / Size', type: 'text', required: false },
  { name: 'weight', label: 'Weight (kg)', type: 'text', required: false },
  { name: 'weather_resistance', label: 'Weather Resistance', type: 'select', options: ['Yes', 'No'], required: false }
];

export const CRAFT_DIY_SCHEMA = [
  { name: 'craft_type', label: 'Craft Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity / Pack Size', type: 'text', required: false },
  { name: 'suitable_for', label: 'Suitable For', type: 'text', required: false }
];

export const COLLECTABLES_SCHEMA = [
  { name: 'item_type', label: 'Collectible Type', type: 'text', required: true },
  { name: 'era_year', label: 'Era / Year', type: 'text', required: false },
  { name: 'country_of_origin', label: 'Country of Origin', type: 'text', required: false },
  { name: 'grade', label: 'Grade / Quality', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity', type: 'text', required: false },
  { name: 'certificate', label: 'Certificate of Authenticity', type: 'select', options: ['Yes', 'No'], required: false }
];

export const CALENDARS_SCHEMA = [
  { name: 'calendar_type', label: 'Calendar Type', type: 'select', options: ['Wall Calendar', 'Desk Calendar', 'Planner', 'Diary', 'Other'], required: true },
  { name: 'year', label: 'Year', type: 'text', required: false },
  { name: 'theme', label: 'Theme', type: 'text', required: false },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'language', label: 'Language', type: 'select', options: ['English', 'Urdu', 'Arabic', 'Other'], required: false }
];

// ─── Agriculture Attribute Schemas ──────────────────────────────────────────

export const AGRI_TRACTOR_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: true },
  { name: 'model', label: 'Model', type: 'text', required: true },
  { name: 'year', label: 'Year', type: 'text', required: false },
  { name: 'engine_power', label: 'Engine Power (HP)', type: 'text', required: true },
  { name: 'power_source', label: 'Fuel Type', type: 'select', options: ['Diesel', 'Petrol', 'Electric', 'LPG', 'Other'], required: false },
  { name: 'drive_type', label: 'Drive Type', type: 'select', options: ['2WD', '4WD', 'Crawler', 'Other'], required: false }
];

export const AGRI_MACHINERY_SCHEMA = [
  { name: 'machinery_type', label: 'Machinery Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'model', label: 'Model', type: 'text', required: false },
  { name: 'year', label: 'Year of Manufacture', type: 'text', required: false },
  { name: 'power_source', label: 'Power Source', type: 'select', options: ['Diesel', 'Petrol', 'Electric', 'PTO Driven', 'Manual', 'Other'], required: false },
  { name: 'capacity', label: 'Capacity / Throughput', type: 'text', required: false }
];

export const AGRI_SEEDS_SCHEMA = [
  { name: 'crop_type', label: 'Suitable Crop', type: 'text', required: true },
  { name: 'brand', label: 'Brand / Manufacturer', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity / Pack Size', type: 'text', required: true },
  { name: 'expiry_date', label: 'Expiry Date (e.g. MM/YYYY)', type: 'text', required: false },
  { name: 'certification', label: 'Certification', type: 'text', required: false }
];

export const AGRI_FERTILIZERS_SCHEMA = [
  { name: 'brand', label: 'Brand / Manufacturer', type: 'text', required: false },
  { name: 'suitable_crop', label: 'Suitable Crop(s)', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity / Pack Size', type: 'text', required: true },
  { name: 'expiry_date', label: 'Expiry Date (e.g. MM/YYYY)', type: 'text', required: false },
  { name: 'certification', label: 'Certification', type: 'text', required: false }
];

export const AGRI_PESTICIDES_SCHEMA = [
  { name: 'brand', label: 'Brand / Manufacturer', type: 'text', required: false },
  { name: 'active_ingredient', label: 'Active Ingredient', type: 'text', required: false },
  { name: 'suitable_crop', label: 'Suitable Crop(s)', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity / Pack Size', type: 'text', required: true },
  { name: 'expiry_date', label: 'Expiry Date (e.g. MM/YYYY)', type: 'text', required: false },
  { name: 'certification', label: 'Certification', type: 'text', required: false }
];

export const AGRI_FEED_SCHEMA = [
  { name: 'feed_type', label: 'Feed Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand / Manufacturer', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity / Pack Size', type: 'text', required: true },
  { name: 'weight', label: 'Weight (kg)', type: 'text', required: false }
];

export const AGRI_IRRIGATION_SCHEMA = [
  { name: 'item_type', label: 'Equipment Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'coverage_area', label: 'Coverage Area', type: 'text', required: false }
];

export const AGRI_TOOLS_SCHEMA = [
  { name: 'tool_type', label: 'Tool Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'text', required: false }
];

export const AGRI_GREENHOUSE_SCHEMA = [
  { name: 'dimensions', label: 'Dimensions / Size', type: 'text', required: true },
  { name: 'material', label: 'Material / Frame', type: 'text', required: false },
  { name: 'coverage_area', label: 'Coverage Area', type: 'text', required: false },
  { name: 'climate_control', label: 'Climate Control System', type: 'select', options: ['Yes', 'No'], required: false }
];

export const AGRI_LAND_SCHEMA = [
  { name: 'area_size', label: 'Area Size (Acres/Kanals)', type: 'text', required: true },
  { name: 'suitable_crop', label: 'Suitable Crop(s)', type: 'text', required: false },
  { name: 'water_source', label: 'Water Source', type: 'select', options: ['Canal Water', 'Tube Well', 'Rain Fed (Barani)', 'Mixed', 'No Water Source'], required: true },
  { name: 'soil_type', label: 'Soil Type', type: 'text', required: false }
];

export const AGRI_PRODUCE_SCHEMA = [
  { name: 'produce_type', label: 'Produce Type', type: 'text', required: true },
  { name: 'quantity', label: 'Quantity Available', type: 'text', required: true },
  { name: 'weight', label: 'Weight (kg/ton)', type: 'text', required: false },
  { name: 'harvest_date', label: 'Harvest Date', type: 'text', required: false }
];

export const AGRI_DAIRY_SCHEMA = [
  { name: 'equipment_type', label: 'Equipment Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'capacity', label: 'Capacity / Volume', type: 'text', required: false }
];

export const AGRI_POULTRY_SCHEMA = [
  { name: 'equipment_type', label: 'Equipment Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'capacity', label: 'Capacity (Eggs/Birds)', type: 'text', required: false }
];

export const AGRI_GENERAL_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'compatibility', label: 'Compatibility / Suitable For', type: 'text', required: false }
];

// ─── Kids Attribute Schemas ──────────────────────────────────────────────────

export const KIDS_FURNITURE_SCHEMA = [
  { name: 'furniture_type', label: 'Furniture Type', type: 'select', options: ['Baby Bed & Crib', 'Study Table', 'Kids Chair', 'Toy Storage', 'Wardrobe', 'Bookshelf', 'Bean Bag', 'Other'], required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'dimensions', label: 'Dimensions (LxWxH)', type: 'text', required: false },
  { name: 'storage_included', label: 'Storage Included', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'assembly_required', label: 'Assembly Required', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'foldable', label: 'Foldable', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'age_suitability', label: 'Age Group', type: 'select', options: ['0-6 Months', '6-12 Months', '1-3 Years', '3-5 Years', '5-8 Years', '8-12 Years', '12+ Years'], required: false }
];

export const KIDS_VEHICLES_SCHEMA = [
  { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: ['Kids Bike', 'Kids Car', 'Kids Cycle', 'Kids Scooty', 'Other'], required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'power_source', label: 'Power Source', type: 'select', options: ['Battery Powered', 'Manual'], required: true },
  { name: 'battery_included', label: 'Battery Included', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'motor_power', label: 'Motor Power (e.g. 12V)', type: 'text', required: false },
  { name: 'max_speed', label: 'Maximum Speed (km/h)', type: 'text', required: false },
  { name: 'max_weight_capacity', label: 'Max Weight Capacity (kg)', type: 'text', required: false },
  { name: 'charger_included', label: 'Charger Included', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'remote_control_included', label: 'Remote Control Included', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'age_suitability', label: 'Age Group', type: 'select', options: ['0-6 Months', '6-12 Months', '1-3 Years', '3-5 Years', '5-8 Years', '8-12 Years', '12+ Years'], required: false }
];

export const KIDS_TOYS_SCHEMA = [
  { name: 'toy_type', label: 'Toy Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'educational', label: 'Educational Toy', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'battery_required', label: 'Battery Required', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'battery_included', label: 'Battery Included', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'number_of_pieces', label: 'Number of Pieces', type: 'text', required: false },
  { name: 'safety_certification', label: 'Safety Certification', type: 'text', required: false },
  { name: 'age_suitability', label: 'Age Group', type: 'select', options: ['0-6 Months', '6-12 Months', '1-3 Years', '3-5 Years', '5-8 Years', '8-12 Years', '12+ Years'], required: false }
];

export const KIDS_BABY_GEAR_SCHEMA = [
  { name: 'product_type', label: 'Product Type', type: 'select', options: ['Pram & Walker', 'Baby Bouncer', 'Baby Carrier', 'Baby Cot', 'Baby Swing', 'Car Seat', 'High Chair', 'Other'], required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'max_weight_capacity', label: 'Max Weight Capacity (kg)', type: 'text', required: false },
  { name: 'foldable', label: 'Foldable', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'adjustable', label: 'Adjustable', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'safety_harness', label: 'Safety Harness', type: 'select', options: ['5-Point', '3-Point', 'None', 'Other'], required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'age_suitability', label: 'Age Group', type: 'select', options: ['0-6 Months', '6-12 Months', '1-3 Years', '3-5 Years', '5-8 Years', '8-12 Years', '12+ Years'], required: false }
];

export const KIDS_BATH_DIAPERS_SCHEMA = [
  { name: 'product_type', label: 'Product Type', type: 'select', options: ['Diapers', 'Baby Wipes', 'Baby Shampoo', 'Baby Soap', 'Baby Towel', 'Potty Training', 'Baby Bathtub', 'Other'], required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'text', required: false },
  { name: 'quantity', label: 'Quantity / Pack Count', type: 'text', required: true },
  { name: 'skin_type', label: 'Skin Type / Suitability', type: 'text', required: false },
  { name: 'expiry_date', label: 'Expiry Date (e.g. MM/YYYY)', type: 'text', required: false },
  { name: 'sealed', label: 'Product Sealed', type: 'select', options: ['Yes', 'No'], required: false }
];

export const KIDS_SWINGS_SLIDES_SCHEMA = [
  { name: 'use_type', label: 'Indoor / Outdoor', type: 'select', options: ['Indoor', 'Outdoor', 'Both'], required: true },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'weight_capacity', label: 'Weight Capacity (kg)', type: 'text', required: false },
  { name: 'number_of_children', label: 'Max Number of Children', type: 'text', required: false },
  { name: 'assembly_required', label: 'Assembly Required', type: 'select', options: ['Yes', 'No'], required: false },
  { name: 'dimensions', label: 'Dimensions (LxWxH)', type: 'text', required: false },
  { name: 'safety_features', label: 'Safety Features', type: 'text', required: false },
  { name: 'age_suitability', label: 'Age Group', type: 'select', options: ['0-6 Months', '6-12 Months', '1-3 Years', '3-5 Years', '5-8 Years', '8-12 Years', '12+ Years'], required: false }
];

export const KIDS_CLOTHING_SCHEMA = [
  { name: 'clothing_type', label: 'Clothing/Shoe Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Boys', 'Girls', 'Unisex'], required: true },
  { name: 'age_suitability', label: 'Age Group', type: 'select', options: ['0-6 Months', '6-12 Months', '1-3 Years', '3-5 Years', '5-8 Years', '8-12 Years', '12+ Years'], required: true },
  { name: 'size', label: 'Size', type: 'text', required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'material_fabric', label: 'Fabric/Material', type: 'text', required: false },
  { name: 'pattern', label: 'Pattern', type: 'text', required: false },
  { name: 'season', label: 'Season', type: 'text', required: false },
  { name: 'occasion', label: 'Occasion', type: 'text', required: false }
];

export const KIDS_ACCESSORIES_SCHEMA = [
  { name: 'accessory_type', label: 'Accessory Type', type: 'text', required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'material', label: 'Material', type: 'text', required: false },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'features', label: 'Special Features', type: 'text', required: false },
  { name: 'age_suitability', label: 'Age Group', type: 'select', options: ['0-6 Months', '6-12 Months', '1-3 Years', '3-5 Years', '5-8 Years', '8-12 Years', '12+ Years'], required: false }
];

export const CARS_SCHEMA = [
  { name: 'make', label: 'Make / Brand', type: 'select', options: ['Toyota', 'Honda', 'Suzuki', 'Daihatsu', 'Nissan', 'Audi', 'BMW', 'Mercedes-Benz', 'Hyundai', 'KIA', 'Changan', 'MG', 'Haval', 'Peugeot', 'Proton', 'DFSK', 'FAW', 'Prince', 'Other'], required: true },
  { name: 'model', label: 'Model', type: 'text', required: true },
  { name: 'year', label: 'Year', type: 'select', options: ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009', '2008', '2007', '2006', '2005', 'Older'], required: true },
  { name: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'], required: true },
  { name: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG'], required: true },
  { name: 'registered_city', label: 'Registered In', type: 'select', options: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Un-registered'], required: false },
  { name: 'mileage_km', label: 'Mileage (KM)', type: 'number', required: false },
  { name: 'engine_capacity_cc', label: 'Engine Capacity (CC)', type: 'number', required: false },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'assembly', label: 'Assembly', type: 'select', options: ['Local', 'Imported'], required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box', 'Refurbished'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const BIKES_SCHEMA = [
  { name: 'make', label: 'Make / Brand', type: 'select', options: ['Honda', 'Yamaha', 'Suzuki', 'United', 'Road Prince', 'Super Power', 'Crown', 'Hi-Speed', 'Benelli', 'Unique', 'ZXMCO', 'Metro', 'Other'], required: true },
  { name: 'model', label: 'Model', type: 'text', required: true },
  { name: 'year', label: 'Year', type: 'select', options: ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', 'Older'], required: true },
  { name: 'engine_capacity', label: 'Engine Capacity', type: 'select', options: ['70 cc', '100 cc', '110 cc', '125 cc', '150 cc', '200 cc', '250 cc', '500+ cc'], required: true },
  { name: 'engine_type', label: 'Engine Type', type: 'select', options: ['4 Stroke', '2 Stroke', 'Electric'], required: false },
  { name: 'registered_city', label: 'Registered City', type: 'select', options: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Un-registered'], required: false },
  { name: 'mileage_km', label: 'Mileage (KM)', type: 'number', required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box', 'Refurbished'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const MOBILE_PHONES_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'select', options: ['Apple / iPhone', 'Samsung', 'Xiaomi / Redmi', 'Vivo', 'Oppo', 'Realme', 'Infinix', 'Tecno', 'Google Pixel', 'OnePlus', 'Huawei', 'Honor', 'Sony', 'Motorola', 'Nokia', 'ZTE', 'Nothing Phone', 'XMobile', 'Other'], required: true },
  { name: 'model', label: 'Model', type: 'text', required: true },
  { name: 'pta_status', label: 'PTA Status', type: 'select', options: ['PTA Approved', 'Non PTA', 'Factory Unlocked', 'Custom Paid', 'JV / Patch'], required: true },
  { name: 'storage', label: 'Storage', type: 'select', options: ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], required: true },
  { name: 'ram', label: 'RAM', type: 'select', options: ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '24 GB'], required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Brand Warranty', 'Local Warranty', 'International Warranty'], required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box', 'Refurbished', 'For Parts / Not Working'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const TABLETS_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'select', options: ['Apple iPad', 'Samsung Galaxy Tab', 'Lenovo Tab', 'Huawei MatePad', 'Amazon Fire', 'Xiaomi Pad', 'Microsoft Surface', 'Other'], required: true },
  { name: 'model', label: 'Model', type: 'text', required: true },
  { name: 'pta_status', label: 'PTA Status / Connectivity', type: 'select', options: ['Wi-Fi Only', 'Wi-Fi + Cellular (PTA Approved)', 'Wi-Fi + Cellular (Non-PTA)'], required: true },
  { name: 'storage', label: 'Storage', type: 'select', options: ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'], required: true },
  { name: 'ram', label: 'RAM', type: 'select', options: ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '16 GB'], required: true },
  { name: 'screen_size', label: 'Screen Size', type: 'select', options: ['7-8 inch', '9-10 inch', '11-12 inch', '12.9+ inch'], required: false },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Brand Warranty', 'Local Warranty'], required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box', 'Refurbished'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const LAPTOPS_SCHEMA = [
  { name: 'brand', label: 'Brand / Make', type: 'select', options: ['Dell', 'HP', 'Lenovo', 'Apple / MacBook', 'Asus', 'Acer', 'MSI', 'Razer', 'Microsoft Surface', 'Toshiba', 'Samsung', 'Other'], required: true },
  { name: 'model', label: 'Model', type: 'text', required: true },
  { name: 'processor', label: 'Processor', type: 'select', options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Intel Xeon', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4', 'Other'], required: true },
  { name: 'generation', label: 'Generation', type: 'select', options: ['4th Gen', '5th Gen', '6th Gen', '7th Gen', '8th Gen', '9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen', 'Apple Silicon', 'Other'], required: false },
  { name: 'ram', label: 'RAM', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB'], required: true },
  { name: 'storage_type', label: 'Storage Type', type: 'select', options: ['SSD (Solid State Drive)', 'NVMe SSD', 'HDD (Hard Disk Drive)', 'Hybrid (SSD + HDD)'], required: true },
  { name: 'storage_capacity', label: 'Storage Capacity', type: 'select', options: ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB+'], required: true },
  { name: 'screen_size', label: 'Screen Size', type: 'select', options: ['11.6 inch', '12.5 inch', '13.3 inch', '14.0 inch', '15.6 inch', '16.0 inch', '17.3 inch'], required: false },
  { name: 'graphics', label: 'Graphics Card', type: 'select', options: ['Integrated Graphics (Intel/AMD/Apple)', 'NVIDIA GeForce GTX', 'NVIDIA GeForce RTX', 'AMD Radeon Dedicated', 'NVIDIA Quadro / Workstation'], required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box', 'Refurbished'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const COMPUTERS_SCHEMA = [
  { name: 'type', label: 'Computer Type', type: 'select', options: ['Desktop PC Tower', 'All-in-One (AIO)', 'Gaming PC', 'Workstation', 'Mini PC', 'Server'], required: true },
  { name: 'brand', label: 'Brand', type: 'select', options: ['Custom Build', 'Dell', 'HP', 'Lenovo', 'Apple iMac / Mac Mini', 'Asus', 'Acer', 'Other'], required: true },
  { name: 'processor', label: 'Processor', type: 'select', options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Intel Xeon', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple Silicon', 'Other'], required: true },
  { name: 'ram', label: 'RAM', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB'], required: true },
  { name: 'storage_capacity', label: 'Storage Capacity', type: 'select', options: ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB+'], required: true },
  { name: 'graphics', label: 'Graphics Card', type: 'select', options: ['Integrated Graphics', 'NVIDIA GeForce GTX', 'NVIDIA GeForce RTX', 'AMD Radeon Dedicated', 'No GPU'], required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box', 'Refurbished'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const CAMERAS_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'select', options: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic / Lumix', 'GoPro', 'DJI', 'Olympus', 'Leica', 'Other'], required: true },
  { name: 'camera_type', label: 'Camera Type', type: 'select', options: ['DSLR', 'Mirrorless', 'Action / Sports Camera', 'Drone Camera', 'Compact / Point & Shoot', 'Camcorder / Video', 'Security / CCTV Camera', 'Vintage / Film Camera'], required: true },
  { name: 'megapixels', label: 'Megapixels / Resolution', type: 'select', options: ['12-16 MP', '18-24 MP', '26-36 MP', '45+ MP', '4K Video', '8K Video'], required: false },
  { name: 'lens_included', label: 'Lens Included', type: 'select', options: ['Body Only', 'With Kit Lens', 'With Multiple Lenses'], required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box', 'Refurbished'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const GAMING_CONSOLES_SCHEMA = [
  { name: 'brand', label: 'Platform / Brand', type: 'select', options: ['Sony PlayStation', 'Microsoft Xbox', 'Nintendo', 'Valve Steam Deck', 'ASUS ROG Ally', 'VR Headset (Oculus/Meta/PSVR)', 'Retro Console', 'Other'], required: true },
  { name: 'model', label: 'Console Model', type: 'select', options: ['PlayStation 5', 'PlayStation 5 Slim / Pro', 'PlayStation 4 Pro', 'PlayStation 4 Slim', 'PlayStation 4', 'PlayStation 3', 'Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S', 'Nintendo Switch OLED', 'Nintendo Switch V2', 'Nintendo Switch Lite', 'Meta Quest 2 / 3', 'Other'], required: true },
  { name: 'storage', label: 'Storage', type: 'select', options: ['500 GB', '825 GB', '1 TB', '2 TB', 'Custom / Upgraded'], required: false },
  { name: 'controllers_count', label: 'Controllers Included', type: 'select', options: ['1 Controller', '2 Controllers', '3+ Controllers', 'No Controller (Console Only)'], required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box', 'Refurbished'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const SMART_WATCHES_SCHEMA = [
  { name: 'brand', label: 'Brand', type: 'select', options: ['Apple Watch', 'Samsung Galaxy Watch', 'Huawei Watch', 'Xiaomi / Amazfit', 'Haylou', 'Fossil', 'Garmin', 'Kieslect', 'Realme', 'Other'], required: true },
  { name: 'compatibility', label: 'Operating System Compatibility', type: 'select', options: ['iOS & Android', 'iOS Only (Apple Watch)', 'Android Only'], required: false },
  { name: 'features', label: 'Key Features', type: 'select', options: ['Calling / Bluetooth Call', 'GPS & Heart Rate', 'Cellular (eSIM)', 'Waterproof / Swim Proof'], required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const TECH_ACCESSORIES_SCHEMA = [
  { name: 'type', label: 'Accessory Type', type: 'select', options: ['Headphones / Earbuds / AirPods', 'Chargers & Cables', 'Power Banks', 'Covers & Cases', 'Screen Protectors', 'Keyboards & Mouse', 'Speakers', 'Memory Cards & USB Drives', 'Smart Bands', 'Other'], required: true },
  { name: 'brand', label: 'Brand', type: 'text', required: false },
  { name: 'compatibility', label: 'Compatible With', type: 'text', required: false },
  { name: 'condition_full', label: 'Condition', type: 'select', options: ['New', 'Used', 'Open Box'], required: true, isStandard: true, standardId: 'condition_full' }
];

export const CATEGORIES: Category[] = [
  { id: 'c1000000-0000-0000-0000-000000000001', name: 'Vehicles', slug: 'vehicles', icon: 'Car', color: '#ef4444', attributes_schema: CARS_SCHEMA,
    subcategories: [
      { id: 'c1000000-0000-0000-0000-000000000101', name: 'Cars', slug: 'cars', icon: 'Car', color: '#ef4444', attributes_schema: CARS_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000181', name: 'Cars on Installments', slug: 'cars-on-installments', icon: 'Clock', color: '#ef4444', attributes_schema: CARS_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000182', name: 'Car Care', slug: 'car-care', icon: 'Wrench', color: '#ef4444',
        subcategories: [
          { id: 'c1000000-0000-0000-0000-000000000251', name: 'Pressure Washers', slug: 'pressure-washers', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000252', name: 'Waxes', slug: 'waxes', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000253', name: 'Covers', slug: 'covers', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000254', name: 'Polishes', slug: 'polishes', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000255', name: 'Microfiber Cloths', slug: 'microfiber-cloths', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000256', name: 'Cleaners', slug: 'cleaners', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000257', name: 'Compound Polishes', slug: 'compound-polishes', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000258', name: 'Shampoos', slug: 'shampoos', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000259', name: 'Air Fresheners', slug: 'air-fresheners', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000260', name: 'Pads, Sponges & Brushes', slug: 'pads-sponges-brushes', icon: 'Wrench', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000261', name: 'Other', slug: 'car-care-other', icon: 'Wrench', color: '#ef4444' }
        ]
      },
      { id: 'c1000000-0000-0000-0000-000000000183', name: 'Cars Accessories', slug: 'cars-accessories', icon: 'Sliders', color: '#ef4444',
        subcategories: [
          { id: 'c1000000-0000-0000-0000-000000000271', name: 'Tools & Gadgets', slug: 'acc-tools-gadgets', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000272', name: 'Safety & Security', slug: 'acc-safety-security', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000273', name: 'Audio & Multimedia', slug: 'acc-audio-multimedia', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000274', name: 'Interior', slug: 'acc-interior', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000275', name: 'Exterior', slug: 'acc-exterior', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000276', name: 'Paints, Primers & Tools', slug: 'acc-paints-primers-tools', icon: 'Settings', color: '#ef4444' }
        ]
      },
      { id: 'cc0c0e8e-757b-42c8-8598-872fb6c6d870', name: 'Spare Parts', slug: 'spare-parts', icon: 'Settings', color: '#ef4444',
        subcategories: [
          { id: 'c1000000-0000-0000-0000-000000000281', name: 'Tyres', slug: 'parts-tyres', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000282', name: 'Lights', slug: 'parts-lights', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000283', name: 'Bumpers', slug: 'parts-bumpers', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000284', name: 'Batteries', slug: 'parts-batteries', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000285', name: 'Engines', slug: 'parts-engines', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000286', name: 'Doors & Components', slug: 'parts-doors-components', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000287', name: 'Suspension Parts', slug: 'parts-suspension', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000288', name: 'Windscreen', slug: 'parts-windscreen', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000289', name: 'AC & Heating', slug: 'parts-ac-heating', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000290', name: 'Fenders', slug: 'parts-fenders', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000291', name: 'Trunk Parts', slug: 'parts-trunk', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000292', name: 'Mirrors', slug: 'parts-mirrors', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000293', name: 'Power Steerings', slug: 'parts-power-steering', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000294', name: 'Front Grills', slug: 'parts-front-grills', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000295', name: 'Gaskets & Seals', slug: 'parts-gaskets-seals', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000296', name: 'Spark Plugs', slug: 'parts-spark-plugs', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000297', name: 'Bonnets', slug: 'parts-bonnets', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000298', name: 'Radiator & Coolants', slug: 'parts-radiator-coolants', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000299', name: 'Horns', slug: 'parts-horns', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000300', name: 'Ignition Coils', slug: 'parts-ignition-coils', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000301', name: 'Fuel Pump', slug: 'parts-fuel-pump', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000302', name: 'Antennas', slug: 'parts-antennas', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000303', name: 'Wipers', slug: 'parts-wipers', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000304', name: 'Bushing', slug: 'parts-bushing', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000305', name: 'Buttons', slug: 'parts-buttons', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000306', name: 'Catalytic Converters', slug: 'parts-catalytic-converters', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000307', name: 'Ignition Switches', slug: 'parts-ignition-switches', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000308', name: 'Engine Shields', slug: 'parts-engine-shields', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000309', name: 'Oxygen Sensors', slug: 'parts-oxygen-sensors', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000310', name: 'Fenders & Body Parts', slug: 'parts-fenders-body-parts', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000311', name: 'Filters', slug: 'parts-filters', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000312', name: 'Brakes', slug: 'parts-brakes', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000313', name: 'Sun Visor', slug: 'parts-sun-visor', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000314', name: 'Insulation Sheets', slug: 'parts-insulation-sheets', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000315', name: 'Alternators & Generators', slug: 'parts-alternators-generators', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000316', name: 'Bearings', slug: 'parts-bearings', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000317', name: 'Exhaust System', slug: 'parts-exhaust', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000318', name: 'Belts & Cables', slug: 'parts-belts-cables', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000319', name: 'Electrical & Wiring', slug: 'parts-electrical-wiring', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000320', name: 'Spark Plugs & Ingition Coils', slug: 'parts-spark-plugs-ignition', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000321', name: 'Waterbody & Water Pumps', slug: 'parts-waterbody-pumps', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000322', name: 'Hose, Lines & Fittings', slug: 'parts-hose-lines-fittings', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000323', name: 'Sunroofs', slug: 'parts-sunroofs', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000324', name: 'Other Parts', slug: 'parts-other', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000325', name: 'Lock Nut Kits & Spindles', slug: 'parts-lock-nut-spindles', icon: 'Settings', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000326', name: 'Gearboxes & Transfer Cases', slug: 'parts-gearboxes-transfer-cases', icon: 'Settings', color: '#ef4444' }
        ]
      },
      { id: 'c1000000-0000-0000-0000-000000000184', name: 'Oil & Lubricants', slug: 'oil-lubricants', icon: 'Droplet', color: '#ef4444',
        subcategories: [
          { id: 'c1000000-0000-0000-0000-000000000331', name: 'Engine Oil', slug: 'oil-engine', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000332', name: 'Gear Oil', slug: 'oil-gear', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000333', name: 'Coolants', slug: 'oil-coolants', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000334', name: 'CVTF Oil', slug: 'oil-cvtf', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000335', name: 'Fluids & Flushes', slug: 'oil-fluids-flushes', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000336', name: 'Brake Oil', slug: 'oil-brake', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000337', name: 'Fuel Additives', slug: 'oil-fuel-additives', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000338', name: 'Oil Additives', slug: 'oil-additives', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000339', name: 'Multipurpose Grease', slug: 'oil-grease', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000340', name: 'Chain Lubes & Cleaners', slug: 'oil-chain-lubes-cleaners', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000341', name: 'Adhesives', slug: 'oil-adhesives', icon: 'Droplet', color: '#ef4444' },
          { id: 'c1000000-0000-0000-0000-000000000342', name: 'Solvents', slug: 'oil-solvents', icon: 'Droplet', color: '#ef4444' }
        ]
      },
      { id: 'c1000000-0000-0000-0000-000000000104', name: 'Buses, Vans & Trucks', slug: 'buses-vans-trucks', icon: 'Truck', color: '#ef4444' },
      { id: 'c1000000-0000-0000-0000-000000000185', name: 'Rickshaw & Chingchi', slug: 'rickshaw-chingchi', icon: 'Car', color: '#ef4444' },
      { id: 'c1000000-0000-0000-0000-000000000186', name: 'Tractors & Trailers', slug: 'tractors-trailers', icon: 'Settings', color: '#ef4444' },
      { id: 'c1000000-0000-0000-0000-000000000187', name: 'Boats', slug: 'boats', icon: 'Ship', color: '#ef4444' },
      { id: 'c1000000-0000-0000-0000-000000000106', name: 'Other Vehicles', slug: 'other-vehicles', icon: 'Car', color: '#ef4444' },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000099', name: 'Bikes', slug: 'bikes', icon: 'Bike', color: '#f97316', attributes_schema: BIKES_SCHEMA,
    subcategories: [
      { id: '4b79486b-2af9-4775-9fa1-7f5d477401ff', name: 'Motorcycles', slug: 'motorcycles', icon: 'Bike', color: '#f97316', attributes_schema: BIKES_SCHEMA,
        subcategories: [
          { id: 'c1000000-0000-0000-0000-000000000361', name: 'Standard Bikes', slug: 'standard-bikes', icon: 'Bike', color: '#f97316' },
          { id: 'c1000000-0000-0000-0000-000000000362', name: 'Electric Bikes', slug: 'electric-bikes', icon: 'Zap', color: '#f97316' },
          { id: 'c1000000-0000-0000-0000-000000000363', name: 'Sports & Heavy Bikes', slug: 'sports-heavy-bikes', icon: 'Bike', color: '#f97316' },
          { id: 'c1000000-0000-0000-0000-000000000364', name: 'Cafe Racers', slug: 'cafe-racers', icon: 'Bike', color: '#f97316' },
          { id: 'c1000000-0000-0000-0000-000000000365', name: 'Cruisers', slug: 'cruisers', icon: 'Bike', color: '#f97316' },
          { id: 'c1000000-0000-0000-0000-000000000366', name: 'Trail', slug: 'trail-bikes', icon: 'Bike', color: '#f97316' },
          { id: 'c1000000-0000-0000-0000-000000000367', name: 'Others', slug: 'other-motorcycles', icon: 'Bike', color: '#f97316' }
        ]
      },
      { id: 'c1000000-0000-0000-0000-000000000351', name: 'Spare Parts', slug: 'bike-spare-parts', icon: 'Settings', color: '#f97316',
        subcategories: [
          { id: 'sp-air-filters', name: 'Air Filters', slug: 'air-filters', icon: 'Settings', color: '#f97316' },
          { id: 'sp-carburetors', name: 'Carburetors', slug: 'carburetors', icon: 'Settings', color: '#f97316' },
          { id: 'sp-bearings', name: 'Bearings', slug: 'bearings', icon: 'Settings', color: '#f97316' },
          { id: 'sp-side-mirrors', name: 'Side Mirrors', slug: 'side-mirrors', icon: 'Settings', color: '#f97316' },
          { id: 'sp-motorcycle-batteries', name: 'Motorcycle Batteries', slug: 'motorcycle-batteries', icon: 'Zap', color: '#f97316' },
          { id: 'sp-switches', name: 'Switches', slug: 'switches', icon: 'Settings', color: '#f97316' },
          { id: 'sp-lighting', name: 'Lighting', slug: 'lighting', icon: 'Settings', color: '#f97316' },
          { id: 'sp-cylinders', name: 'Cylinders', slug: 'cylinders', icon: 'Settings', color: '#f97316' },
          { id: 'sp-clutches', name: 'Clutches', slug: 'clutches', icon: 'Settings', color: '#f97316' },
          { id: 'sp-pistons', name: 'Pistons', slug: 'pistons', icon: 'Settings', color: '#f97316' },
          { id: 'sp-chain-covers-sprockets', name: 'Chain, Covers & Sprockets', slug: 'chain-covers-sprockets', icon: 'Settings', color: '#f97316' },
          { id: 'sp-brakes', name: 'Brakes', slug: 'brakes', icon: 'Settings', color: '#f97316' },
          { id: 'sp-handle-bars-grips', name: 'Handle Bars & Grips', slug: 'handle-bars-grips', icon: 'Settings', color: '#f97316' },
          { id: 'sp-levers', name: 'Levers', slug: 'levers', icon: 'Settings', color: '#f97316' },
          { id: 'sp-seats', name: 'Seats', slug: 'seats', icon: 'Settings', color: '#f97316' },
          { id: 'sp-exhausts', name: 'Exhausts', slug: 'exhausts', icon: 'Settings', color: '#f97316' },
          { id: 'sp-fuel-tanks', name: 'Fuel Tanks', slug: 'fuel-tanks', icon: 'Settings', color: '#f97316' },
          { id: 'sp-horns', name: 'Horns', slug: 'horns', icon: 'Settings', color: '#f97316' },
          { id: 'sp-speedometers', name: 'Speedometers', slug: 'speedometers', icon: 'Settings', color: '#f97316' },
          { id: 'sp-plugs', name: 'Plugs', slug: 'plugs', icon: 'Settings', color: '#f97316' },
          { id: 'sp-stands', name: 'Stands', slug: 'stands', icon: 'Settings', color: '#f97316' },
          { id: 'sp-tyres-tubes', name: 'Tyres & Tubes', slug: 'tyres-tubes', icon: 'Settings', color: '#f97316' },
          { id: 'sp-silencer', name: 'Silencer', slug: 'silencer', icon: 'Settings', color: '#f97316' },
          { id: 'sp-transmission', name: 'Transmission', slug: 'transmission', icon: 'Settings', color: '#f97316' },
          { id: 'sp-steering-suspension', name: 'Steering & Suspension', slug: 'steering-suspension', icon: 'Settings', color: '#f97316' },
          { id: 'sp-body-frame', name: 'Body & Frame', slug: 'body-frame', icon: 'Settings', color: '#f97316' },
          { id: 'sp-other-spare-parts', name: 'Other Spare Parts', slug: 'other-spare-parts', icon: 'Settings', color: '#f97316' }
        ]
      },
      { id: 'c1000000-0000-0000-0000-000000000352', name: 'Bikes Accessories', slug: 'bike-accessories', icon: 'Sliders', color: '#f97316',
        subcategories: [
          { id: 'ba-bicycle-air-pumps', name: 'Bicycle Air Pumps', slug: 'bicycle-air-pumps', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-oils-lubricants', name: 'Oils / Lubricants', slug: 'oils-lubricants', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-bike-covers', name: 'Bike Covers', slug: 'bike-covers', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-bike-gloves', name: 'Bike Gloves', slug: 'bike-gloves', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-helmets', name: 'Helmets', slug: 'helmets', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-tail-boxes', name: 'Tail Boxes', slug: 'tail-boxes', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-bike-jackets', name: 'Bike Jackets', slug: 'bike-jackets', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-bike-locks', name: 'Bike Locks', slug: 'bike-locks', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-safe-guards', name: 'Safe Guards', slug: 'safe-guards', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-sticker-emblems', name: 'Sticker & Emblems', slug: 'sticker-emblems', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-mobile-chargers', name: 'Mobile chargers', slug: 'mobile-chargers', icon: 'Zap', color: '#f97316' },
          { id: 'ba-bike-shoes', name: 'Bike Shoes', slug: 'bike-shoes', icon: 'Sliders', color: '#f97316' },
          { id: 'ba-bluetooth-headsets', name: 'Bluetooth Headsets', slug: 'bluetooth-headsets', icon: 'Headphones', color: '#f97316' },
          { id: 'ba-safety-security', name: 'Safety & Security', slug: 'safety-security', icon: 'Shield', color: '#f97316' },
          { id: 'ba-other-bike-accessories', name: 'Other Bike Accessories', slug: 'other-bike-accessories', icon: 'Sliders', color: '#f97316' }
        ]
      },
      { id: '4a00ceef-1ea9-45c3-9517-bdb62320e8d1', name: 'Bicycles', slug: 'bicycles', icon: 'Bike', color: '#f97316',
        subcategories: [
          { id: 'bc-road-bikes', name: 'Road Bikes', slug: 'road-bikes', icon: 'Bike', color: '#f97316' },
          { id: 'bc-mountain-bikes', name: 'Mountain Bikes', slug: 'mountain-bikes', icon: 'Bike', color: '#f97316' },
          { id: 'bc-hybrid-bikes', name: 'Hybrid Bikes', slug: 'hybrid-bikes', icon: 'Bike', color: '#f97316' },
          { id: 'bc-bmx-bikes', name: 'BMX Bikes', slug: 'bmx-bikes', icon: 'Bike', color: '#f97316' },
          { id: 'bc-electric-bicycles', name: 'Electric Bicycles', slug: 'electric-bicycles', icon: 'Zap', color: '#f97316' },
          { id: 'bc-folding-bikes', name: 'Folding Bikes', slug: 'folding-bikes', icon: 'Bike', color: '#f97316' },
          { id: 'bc-other-bicycles', name: 'Other Bicycles', slug: 'other-bicycles', icon: 'Bike', color: '#f97316' }
        ]
      },
      { id: 'c1000000-0000-0000-0000-000000000355', name: 'ATV & Quads', slug: 'atv-quads', icon: 'Bike', color: '#f97316' },
      { id: 'c1000000-0000-0000-0000-000000000353', name: 'Scooters', slug: 'scooters', icon: 'Bike', color: '#f97316',
        subcategories: [
          { id: 'c1000000-0000-0000-0000-000000000371', name: 'Petrol', slug: 'petrol-scooters', icon: 'Bike', color: '#f97316' },
          { id: 'c1000000-0000-0000-0000-000000000372', name: 'Electric', slug: 'electric-scooters', icon: 'Zap', color: '#f97316' }
        ]
      },
      { id: 'c1000000-0000-0000-0000-000000000356', name: 'Bike Care', slug: 'bike-care', icon: 'Sparkles', color: '#f97316' }
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000002', name: 'Property for Sale', slug: 'property-for-sale', icon: 'Building2', color: '#8b5cf6',
    subcategories: [
      { id: '4c4a2d5d-7303-4b97-8e1e-775337fe894e', name: 'Land & Plots', slug: 'land-plots', icon: 'Map', color: '#8b5cf6' },
      { id: '24e59436-fa5b-4fe6-898c-4ce34c4b901f', name: 'Houses', slug: 'houses', icon: 'Home', color: '#8b5cf6' },
      { id: '9ef60e0a-9e89-4a78-86ef-5c9ea8b923dd', name: 'Apartments & Flats', slug: 'apartments-flats', icon: 'Building', color: '#8b5cf6' },
      { id: '3f9d177a-5fc9-4a78-803e-111cbbd5831c', name: 'Shops - Offices - Commercial Space', slug: 'shops-offices-commercial-space', icon: 'Building2', color: '#8b5cf6' },
      { id: 'a8dfa959-a83b-438c-8ffb-3faaa43b1626', name: 'Portions & Floors', slug: 'portions-floors', icon: 'Layers', color: '#8b5cf6' },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000015', name: 'Property for Rent', slug: 'property-for-rent', icon: 'Key', color: '#7c3aed',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000000101', name: 'Houses', slug: 'rent-houses', icon: 'Home', color: '#7c3aed' },
      { id: 'd1000000-0000-0000-0000-000000000102', name: 'Apartments & Flats', slug: 'rent-apartments-flats', icon: 'Building', color: '#7c3aed' },
      { id: 'd1000000-0000-0000-0000-000000000103', name: 'Portions & Floors', slug: 'rent-portions-floors', icon: 'Layers', color: '#7c3aed' },
      { id: 'd1000000-0000-0000-0000-000000000104', name: 'Shops - Offices - Commercial Space', slug: 'rent-shops-offices-commercial-space', icon: 'Building2', color: '#7c3aed' },
      { id: 'd1000000-0000-0000-0000-000000000105', name: 'Rooms', slug: 'rent-rooms', icon: 'DoorOpen', color: '#7c3aed' },
      { id: 'd1000000-0000-0000-0000-000000000106', name: 'Roommates & Paying Guests', slug: 'rent-roommates-paying-guests', icon: 'Users', color: '#7c3aed' },
      { id: 'd1000000-0000-0000-0000-000000000107', name: 'Vacation Rentals - Guest Houses', slug: 'rent-vacation-guest-houses', icon: 'Hotel', color: '#7c3aed' },
      { id: 'd1000000-0000-0000-0000-000000000108', name: 'Land & Plots', slug: 'rent-land-plots', icon: 'Map', color: '#7c3aed' },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000003', name: 'Mobile & Tech products', slug: 'mobile-tech-products', icon: 'Smartphone', color: '#3b82f6', attributes_schema: MOBILE_PHONES_SCHEMA,
    subcategories: [
      { id: 'c1000000-0000-0000-0000-000000000112', name: 'Mobile Phones', slug: 'mobile-phones', icon: 'Smartphone', color: '#3b82f6', attributes_schema: MOBILE_PHONES_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000113', name: 'Tablets', slug: 'tablets', icon: 'Tablet', color: '#3b82f6', attributes_schema: TABLETS_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000114', name: 'Laptops', slug: 'laptops', icon: 'Laptop', color: '#3b82f6', attributes_schema: LAPTOPS_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000115', name: 'Computers', slug: 'computers', icon: 'Monitor', color: '#3b82f6', attributes_schema: COMPUTERS_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000116', name: 'Cameras', slug: 'cameras', icon: 'Camera', color: '#3b82f6', attributes_schema: CAMERAS_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000117', name: 'Gaming Consoles', slug: 'gaming-consoles', icon: 'Gamepad2', color: '#3b82f6', attributes_schema: GAMING_CONSOLES_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000118', name: 'Accessories', slug: 'electronics-accessories', icon: 'Headphones', color: '#3b82f6', attributes_schema: TECH_ACCESSORIES_SCHEMA },
      { id: 'c1000000-0000-0000-0000-000000000199', name: 'Smart Watches', slug: 'smart-watches', icon: 'Watch', color: '#3b82f6', attributes_schema: SMART_WATCHES_SCHEMA },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000004', name: 'Jobs', slug: 'jobs', icon: 'Briefcase', color: '#10b981',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000004001', name: 'Accounting & Finance', slug: 'accounting-finance', icon: 'Calculator', color: '#10b981', attributes_schema: ACCOUNTING_FINANCE_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004002', name: 'Advertising & PR', slug: 'advertising-pr', icon: 'Megaphone', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004003', name: 'Architecture & Interior Design', slug: 'architecture-interior-design', icon: 'Compass', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004004', name: 'Clerical & Administration', slug: 'clerical-administration', icon: 'Clipboard', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004005', name: 'Call Center', slug: 'call-center', icon: 'PhoneCall', color: '#10b981', attributes_schema: CUSTOMER_SERVICE_CALL_CENTER_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004006', name: 'Content Writing', slug: 'content-writing', icon: 'PenTool', color: '#10b981', attributes_schema: CONTENT_WRITING_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004007', name: 'Customer Service', slug: 'customer-service', icon: 'Headphones', color: '#10b981', attributes_schema: CUSTOMER_SERVICE_CALL_CENTER_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004008', name: 'Delivery Riders', slug: 'delivery-riders', icon: 'Bike', color: '#10b981', attributes_schema: DRIVER_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004009', name: 'Domestic Staff', slug: 'domestic-staff', icon: 'Home', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004010', name: 'Driver', slug: 'driver', icon: 'Car', color: '#10b981', attributes_schema: DRIVER_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004011', name: 'Education', slug: 'education', icon: 'GraduationCap', color: '#10b981', attributes_schema: EDUCATION_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004012', name: 'Engineering', slug: 'engineering', icon: 'Settings', color: '#10b981', attributes_schema: ENGINEERING_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004013', name: 'Graphic Design', slug: 'graphic-design', icon: 'Palette', color: '#10b981', attributes_schema: GRAPHIC_DESIGN_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004014', name: 'Hotels & Tourism', slug: 'hotels-tourism', icon: 'Hotel', color: '#10b981', attributes_schema: HOTELS_RESTAURANTS_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004015', name: 'Human Resources', slug: 'human-resources', icon: 'Users', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004016', name: 'Internships', slug: 'internships', icon: 'BookOpen', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004017', name: 'IT & Networking', slug: 'it-networking', icon: 'Cpu', color: '#10b981', attributes_schema: IT_NETWORKING_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004018', name: 'Manufacturing', slug: 'manufacturing', icon: 'Factory', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004019', name: 'Marketing', slug: 'marketing', icon: 'TrendingUp', color: '#10b981', attributes_schema: SALES_MARKETING_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004020', name: 'Medical', slug: 'medical', icon: 'Activity', color: '#10b981', attributes_schema: MEDICAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004021', name: 'Online', slug: 'online', icon: 'Globe', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004022', name: 'Other Jobs', slug: 'other-jobs', icon: 'Briefcase', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004023', name: 'Part Time', slug: 'part-time-job', icon: 'Clock', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004024', name: 'Real Estate', slug: 'real-estate-jobs', icon: 'Building', color: '#10b981', attributes_schema: GENERAL_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004025', name: 'Restaurants & Hospitality', slug: 'restaurants-hospitality', icon: 'Utensils', color: '#10b981', attributes_schema: HOTELS_RESTAURANTS_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004026', name: 'Sales', slug: 'sales', icon: 'DollarSign', color: '#10b981', attributes_schema: SALES_MARKETING_JOB_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000004027', name: 'Security', slug: 'security', icon: 'Shield', color: '#10b981', attributes_schema: SECURITY_JOB_SCHEMA }
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000005', name: 'Fashion & Beauty', slug: 'fashion-beauty', icon: 'ShoppingBag', color: '#ec4899',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000005001', name: 'Clothes', slug: 'clothes', icon: 'Shirt', color: '#ec4899',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000005101', name: 'Eastern', slug: 'clothes-eastern', icon: 'Shirt', color: '#ec4899', attributes_schema: CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005102', name: 'Hijabs & Abayas', slug: 'clothes-hijabs-abayas', icon: 'Shirt', color: '#ec4899', attributes_schema: CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005103', name: 'Kids Clothes', slug: 'clothes-kids', icon: 'Shirt', color: '#ec4899', attributes_schema: CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005104', name: 'Sports Clothes', slug: 'clothes-sports', icon: 'Shirt', color: '#ec4899', attributes_schema: CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005105', name: 'Western', slug: 'clothes-western', icon: 'Shirt', color: '#ec4899', attributes_schema: CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005106', name: 'Intimates', slug: 'clothes-intimates', icon: 'Shirt', color: '#ec4899', attributes_schema: CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005107', name: 'Costumes', slug: 'clothes-costumes', icon: 'Shirt', color: '#ec4899', attributes_schema: CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005108', name: 'Clothing Accessories', slug: 'clothes-accessories', icon: 'Shirt', color: '#ec4899', attributes_schema: CLOTHING_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000005002', name: 'Footwear', slug: 'footwear', icon: 'Footprints', color: '#ec4899', attributes_schema: FOOTWEAR_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000005003', name: 'Bags', slug: 'bags', icon: 'ShoppingBag', color: '#ec4899', attributes_schema: BAGS_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000005004', name: 'Fashion Accessories', slug: 'fashion-accessories', icon: 'Sliders', color: '#ec4899',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000005201', name: 'Belts', slug: 'accessories-belts', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005202', name: 'Caps', slug: 'accessories-caps', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005203', name: 'Cufflinks', slug: 'accessories-cufflinks', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005204', name: 'Gloves', slug: 'accessories-gloves', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005205', name: 'Scarves', slug: 'accessories-scarves', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005206', name: 'Socks', slug: 'accessories-socks', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005207', name: 'Sunglasses', slug: 'accessories-sunglasses', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005208', name: 'Ties', slug: 'accessories-ties', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005209', name: 'Key Holders', slug: 'accessories-keyholders', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005210', name: 'Eyewear', slug: 'accessories-eyewear', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005211', name: 'Other Accessories', slug: 'accessories-other', icon: 'Sliders', color: '#ec4899', attributes_schema: FASHION_ACCESSORIES_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000005005', name: 'Makeup', slug: 'makeup', icon: 'Sparkles', color: '#ec4899',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000005301', name: 'Brushes', slug: 'makeup-brushes', icon: 'Sparkles', color: '#ec4899', attributes_schema: MAKEUP_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005302', name: 'Eyes', slug: 'makeup-eyes', icon: 'Sparkles', color: '#ec4899', attributes_schema: MAKEUP_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005303', name: 'Face', slug: 'makeup-face', icon: 'Sparkles', color: '#ec4899', attributes_schema: MAKEUP_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005304', name: 'Lips', slug: 'makeup-lips', icon: 'Sparkles', color: '#ec4899', attributes_schema: MAKEUP_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005305', name: 'Nails', slug: 'makeup-nails', icon: 'Sparkles', color: '#ec4899', attributes_schema: MAKEUP_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005306', name: 'Other Makeup Accessories', slug: 'makeup-other', icon: 'Sparkles', color: '#ec4899', attributes_schema: MAKEUP_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000005006', name: 'Skin & Hair', slug: 'skin-hair', icon: 'Smile', color: '#ec4899',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000005401', name: 'Hair Care', slug: 'skin-hair-care', icon: 'Smile', color: '#ec4899', attributes_schema: SKIN_HAIR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005402', name: 'Skin Care', slug: 'skin-care', icon: 'Smile', color: '#ec4899', attributes_schema: SKIN_HAIR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005403', name: 'Hair Accessories', slug: 'hair-accessories', icon: 'Smile', color: '#ec4899', attributes_schema: SKIN_HAIR_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000005007', name: 'Fragrance', slug: 'fragrance', icon: 'Flame', color: '#ec4899', attributes_schema: FRAGRANCE_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000005008', name: 'Wedding', slug: 'wedding', icon: 'Heart', color: '#ec4899',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000005501', name: 'Bridals', slug: 'wedding-bridals', icon: 'Heart', color: '#ec4899', attributes_schema: WEDDING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005502', name: 'Formals', slug: 'wedding-formals', icon: 'Heart', color: '#ec4899', attributes_schema: WEDDING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005503', name: 'Grooms', slug: 'wedding-grooms', icon: 'Heart', color: '#ec4899', attributes_schema: WEDDING_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000005009', name: 'Bath & Body', slug: 'bath-body', icon: 'Bath', color: '#ec4899',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000005601', name: 'Bath & Body Accessories', slug: 'bath-body-accessories', icon: 'Bath', color: '#ec4899', attributes_schema: BATH_BODY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005602', name: 'Gifts & Value Sets', slug: 'bath-body-gifts', icon: 'Bath', color: '#ec4899', attributes_schema: BATH_BODY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005603', name: 'Hair Removal', slug: 'bath-body-hair-removal', icon: 'Bath', color: '#ec4899', attributes_schema: BATH_BODY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005604', name: 'Lotions & Moisturisers', slug: 'bath-body-lotions', icon: 'Bath', color: '#ec4899', attributes_schema: BATH_BODY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005605', name: 'Massage Oils', slug: 'bath-body-massage-oils', icon: 'Bath', color: '#ec4899', attributes_schema: BATH_BODY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005606', name: 'Scrubs', slug: 'bath-body-scrubs', icon: 'Bath', color: '#ec4899', attributes_schema: BATH_BODY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000005607', name: 'Soaps & Shower Gels', slug: 'bath-body-soaps', icon: 'Bath', color: '#ec4899', attributes_schema: BATH_BODY_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000005010', name: 'Watches', slug: 'watches', icon: 'Watch', color: '#ec4899', attributes_schema: WATCHES_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000005011', name: 'Jewellery', slug: 'jewellery', icon: 'Gem', color: '#ec4899', attributes_schema: JEWELLERY_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000005012', name: 'DIY Jewellery', slug: 'diy-jewellery', icon: 'Hammer', color: '#ec4899', attributes_schema: DIY_JEWELLERY_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000005013', name: 'Other Fashion', slug: 'other-fashion', icon: 'ShoppingBag', color: '#ec4899', attributes_schema: OTHER_FASHION_SCHEMA }
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000006', name: 'Furniture & Home Decor', slug: 'furniture-home-decor', icon: 'Home', color: '#f59e0b',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000000310', name: 'Sofa & Chairs', slug: 'sofa-chairs', icon: 'Armchair', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001201', name: 'Bean Bags', slug: 'bean-bags', icon: 'Armchair', color: '#f59e0b', attributes_schema: SEATING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001202', name: 'Chairs', slug: 'chairs', icon: 'Armchair', color: '#f59e0b', attributes_schema: SEATING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001203', name: 'Cushions', slug: 'cushions', icon: 'Armchair', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001204', name: 'Recliners', slug: 'recliners', icon: 'Armchair', color: '#f59e0b', attributes_schema: SEATING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001205', name: 'Sofa Beds', slug: 'sofa-beds', icon: 'Armchair', color: '#f59e0b', attributes_schema: SEATING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001206', name: 'Sofa Covers', slug: 'sofa-covers', icon: 'Armchair', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001207', name: 'Sofas', slug: 'sofas', icon: 'Armchair', color: '#f59e0b', attributes_schema: SEATING_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000311', name: 'Beds & Wardrobes', slug: 'beds-wardrobes', icon: 'Bed', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001301', name: 'Beds', slug: 'beds', icon: 'Bed', color: '#f59e0b', attributes_schema: BEDDING_MATTRESS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001302', name: 'Mattresses', slug: 'mattresses', icon: 'Bed', color: '#f59e0b', attributes_schema: BEDDING_MATTRESS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001303', name: 'Mattress Covers', slug: 'mattress-covers', icon: 'Bed', color: '#f59e0b', attributes_schema: BEDDING_MATTRESS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001304', name: 'Pillows & Cases', slug: 'pillows-cases', icon: 'Bed', color: '#f59e0b', attributes_schema: BEDDING_MATTRESS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001305', name: 'Bed Sheets', slug: 'bed-sheets', icon: 'Bed', color: '#f59e0b', attributes_schema: BEDDING_MATTRESS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001306', name: 'Blankets & Comforters', slug: 'blankets-comforters', icon: 'Bed', color: '#f59e0b', attributes_schema: BEDDING_MATTRESS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001307', name: 'Other Bedding Accessories', slug: 'other-bedding-accessories', icon: 'Bed', color: '#f59e0b', attributes_schema: BEDDING_MATTRESS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001308', name: 'Wardrobes', slug: 'wardrobes', icon: 'Bed', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001309', name: 'Bedside Tables', slug: 'bedside-tables', icon: 'Bed', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001310', name: 'Dressers & Drawers', slug: 'dressers-drawers', icon: 'Bed', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001311', name: 'Bookcases & Shelves', slug: 'bookcases-shelves', icon: 'Bed', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001312', name: 'Mattress Toppers & Pads', slug: 'mattress-toppers-pads', icon: 'Bed', color: '#f59e0b', attributes_schema: BEDDING_MATTRESS_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000312', name: 'Tables & Dining', slug: 'tables-dining', icon: 'Inbox', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001401', name: 'Coffee Tables', slug: 'coffee-tables', icon: 'Inbox', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001402', name: 'Console Tables', slug: 'console-tables', icon: 'Inbox', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001403', name: 'Dining Chairs', slug: 'dining-chairs', icon: 'Inbox', color: '#f59e0b', attributes_schema: SEATING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001404', name: 'Dining Room Sets', slug: 'dining-room-sets', icon: 'Inbox', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001405', name: 'Dining Tables', slug: 'dining-tables', icon: 'Inbox', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001406', name: 'Kids Tables & Sets', slug: 'kids-tables-sets', icon: 'Inbox', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001407', name: 'Kitchen Islands', slug: 'kitchen-islands', icon: 'Inbox', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001408', name: 'Side Tables', slug: 'side-tables', icon: 'Inbox', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001409', name: 'Sideboards & Buffets', slug: 'sideboards-buffets', icon: 'Inbox', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000313', name: 'Bathroom Accessories', slug: 'bathroom-accessories', icon: 'Droplets', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001501', name: 'Basins', slug: 'basins', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001502', name: 'Bath Cabinets', slug: 'bath-cabinets', icon: 'Droplets', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001503', name: 'Bath Towels', slug: 'bath-towels', icon: 'Droplets', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001504', name: 'Bath Tubs', slug: 'bath-tubs', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001505', name: 'Bathrobes', slug: 'bathrobes', icon: 'Droplets', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001506', name: 'Hand Showers, Hoses & Pipes', slug: 'hand-showers-hoses-pipes', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001507', name: 'Other Bathroom Accessories', slug: 'other-bathroom-accessories', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001508', name: 'Shower Cabins', slug: 'shower-cabins', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001509', name: 'Soap Dispensers', slug: 'soap-dispensers', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001510', name: 'Taps', slug: 'taps', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001511', name: 'Toilets', slug: 'toilets', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001512', name: 'Vanity Units', slug: 'vanity-units', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001513', name: 'Traps & Drains', slug: 'traps-drains', icon: 'Droplets', color: '#f59e0b', attributes_schema: BATHROOM_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000314', name: 'Garden & Outdoor', slug: 'garden-outdoor', icon: 'Flower', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001601', name: 'Artificial Grass', slug: 'artificial-grass', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001602', name: 'Benches', slug: 'benches', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001603', name: 'Hardware', slug: 'outdoor-hardware', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001604', name: 'Other Outdoor Items', slug: 'other-outdoor-items', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001605', name: 'Outdoor Activities', slug: 'outdoor-activities', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001606', name: 'Outdoor Chairs', slug: 'outdoor-chairs', icon: 'Flower', color: '#f59e0b', attributes_schema: SEATING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001607', name: 'Outdoor Fountains', slug: 'outdoor-fountains', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001608', name: 'Outdoor Lights', slug: 'outdoor-lights', icon: 'Flower', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001609', name: 'Outdoor Swings', slug: 'outdoor-swings', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001610', name: 'Outdoor Tables', slug: 'outdoor-tables', icon: 'Flower', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001611', name: 'Outdoor Umbrellas', slug: 'outdoor-umbrellas', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001612', name: 'Plants & Pots', slug: 'plants-pots', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001613', name: 'Tents & Shades', slug: 'tents-shades', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001614', name: 'Sprinklers & Watering Systems', slug: 'sprinklers-watering-systems', icon: 'Flower', color: '#f59e0b', attributes_schema: GARDEN_OUTDOOR_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000315', name: 'Painting & Mirrors', slug: 'painting-mirrors', icon: 'Image', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001701', name: 'Mirror Lights', slug: 'mirror-lights', icon: 'Image', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001702', name: 'Mirrors', slug: 'mirrors', icon: 'Image', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001703', name: 'Painting Accessories', slug: 'painting-accessories', icon: 'Image', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001704', name: 'Paintings', slug: 'paintings', icon: 'Image', color: '#f59e0b', attributes_schema: DECOR_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000316', name: 'Rugs & Carpets', slug: 'rugs-carpets', icon: 'Layers', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001801', name: 'Carpets', slug: 'carpets', icon: 'Layers', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001802', name: 'Mats', slug: 'mats', icon: 'Layers', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001803', name: 'Prayer Mats', slug: 'prayer-mats', icon: 'Layers', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001804', name: 'Rugs', slug: 'rugs', icon: 'Layers', color: '#f59e0b', attributes_schema: DECOR_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000317', name: 'Curtains & Blinds', slug: 'curtains-blinds', icon: 'Sliders', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001901', name: 'Curtains', slug: 'curtains', icon: 'Sliders', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001902', name: 'Blinds', slug: 'blinds', icon: 'Sliders', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001903', name: 'Curtain Accessories', slug: 'curtain-accessories', icon: 'Sliders', color: '#f59e0b', attributes_schema: DECOR_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000318', name: 'Office Furniture', slug: 'office-furniture', icon: 'Briefcase', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000002001', name: 'Office Cabinets', slug: 'office-cabinets', icon: 'Briefcase', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002002', name: 'Office Chairs', slug: 'office-chairs', icon: 'Briefcase', color: '#f59e0b', attributes_schema: SEATING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002003', name: 'Office Sofas', slug: 'office-sofas', icon: 'Briefcase', color: '#f59e0b', attributes_schema: SEATING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002004', name: 'Office Tables', slug: 'office-tables', icon: 'Briefcase', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002005', name: 'Other Office Furniture', slug: 'other-office-furniture', icon: 'Briefcase', color: '#f59e0b', attributes_schema: TABLE_DINING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002006', name: 'Shelves & Racks', slug: 'shelves-racks', icon: 'Briefcase', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000319', name: 'Lighting', slug: 'lighting', icon: 'Lightbulb', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000002101', name: 'Bathroom Lighting', slug: 'bathroom-lighting', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002102', name: 'Ceiling Lights', slug: 'ceiling-lights', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002103', name: 'Fairy Lights', slug: 'fairy-lights', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002104', name: 'Floor Lamps', slug: 'floor-lamps', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002105', name: 'LED Strip Lighting', slug: 'led-strip-lighting', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002106', name: 'Lamp Shades', slug: 'lamp-shades', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002107', name: 'Light Bulbs', slug: 'light-bulbs', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002108', name: 'Lighting Fixtures & Components', slug: 'lighting-fixtures-components', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002109', name: 'Night Lights', slug: 'night-lights', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002110', name: 'Outdoor Lighting', slug: 'outdoor-lighting', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002111', name: 'Picture & Display Lights', slug: 'picture-display-lights', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002112', name: 'Seasonal & Decorative Lighting', slug: 'seasonal-decorative-lighting', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002113', name: 'Table Lamps', slug: 'table-lamps', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002114', name: 'Wall Lights & Sconces', slug: 'wall-lights-sconces', icon: 'Lightbulb', color: '#f59e0b', attributes_schema: LIGHTING_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000320', name: 'Home Decoration', slug: 'home-decoration', icon: 'Sparkles', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000002201', name: 'Wall Decor', slug: 'wall-decor', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002202', name: 'Clocks', slug: 'clocks', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002203', name: 'Artificial Plants & Flowers', slug: 'artificial-plants-flowers', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002204', name: 'Vases', slug: 'vases', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002205', name: 'Decorative Trays', slug: 'decorative-trays', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002206', name: 'Candles & Candle Holders', slug: 'candles-candle-holders', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002207', name: 'Photo Frames', slug: 'photo-frames', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002208', name: 'Decorative Figurines', slug: 'decorative-figurines', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002209', name: 'Decorative Bowls', slug: 'decorative-bowls', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002210', name: 'Indoor Fountains', slug: 'indoor-fountains', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002211', name: 'Wall Shelves', slug: 'wall-shelves', icon: 'Sparkles', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002212', name: 'Home Fragrances', slug: 'home-fragrances', icon: 'Sparkles', color: '#f59e0b', attributes_schema: CLEANING_LAUNDRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002213', name: 'Decorative Cushions', slug: 'decorative-cushions', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002214', name: 'Decorative Accessories', slug: 'decorative-accessories', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000002215', name: 'Other Home Decor', slug: 'other-home-decor', icon: 'Sparkles', color: '#f59e0b', attributes_schema: DECOR_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000321', name: 'Kitchen Essentials', slug: 'kitchen-essentials', icon: 'UtensilsCrossed', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001001', name: 'Baking Dishes & Tools', slug: 'baking-dishes-tools', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001002', name: 'Cookers, Pots & Pans', slug: 'cookers-pots-pans', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001003', name: 'Crockery & Dinner Sets', slug: 'crockery-dinner-sets', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001004', name: 'Cups, Glasses & Drink Sets', slug: 'cups-glasses-drink-sets', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001005', name: 'Cutlery', slug: 'cutlery', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001006', name: 'Kitchen Utensils & Tools', slug: 'kitchen-utensils-tools', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001007', name: 'Serving Dishes & Utensils', slug: 'serving-dishes-utensils', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001008', name: 'Beverage Containers', slug: 'beverage-containers', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001009', name: 'Food Storage & Dispensers', slug: 'food-storage-dispensers', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: KITCHENWARE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001010', name: 'Sponges, Cleaners & Liquids', slug: 'sponges-cleaners-liquids', icon: 'UtensilsCrossed', color: '#f59e0b', attributes_schema: CLEANING_LAUNDRY_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000322', name: 'Home Essentials', slug: 'home-essentials', icon: 'Home', color: '#f59e0b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000001101', name: 'Air Fresheners', slug: 'air-fresheners', icon: 'Home', color: '#f59e0b', attributes_schema: CLEANING_LAUNDRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001102', name: 'Brooms, Mops & Sweepers', slug: 'brooms-mops-sweepers', icon: 'Home', color: '#f59e0b', attributes_schema: CLEANING_LAUNDRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001103', name: 'Brushes, Sponges & Wipers', slug: 'brushes-sponges-wipers', icon: 'Home', color: '#f59e0b', attributes_schema: CLEANING_LAUNDRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001104', name: 'Cleaning Supplies', slug: 'cleaning-supplies', icon: 'Home', color: '#f59e0b', attributes_schema: CLEANING_LAUNDRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000001105', name: 'Laundry Supplies', slug: 'laundry-supplies', icon: 'Home', color: '#f59e0b', attributes_schema: CLEANING_LAUNDRY_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000323', name: 'Other Household Items', slug: 'other-household-items', icon: 'Package', color: '#f59e0b', attributes_schema: DECOR_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000000324', name: 'Home DIY & Renovations', slug: 'home-diy-renovations', icon: 'Wrench', color: '#f59e0b', attributes_schema: STORAGE_SCHEMA },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000016', name: 'Electronics & Home Appliances', slug: 'electronics-home-appliances', icon: 'Tv', color: '#3b82f6',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000000201', name: 'Computers & Accessories', slug: 'computers-accessories', icon: 'Laptop', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000701', name: 'Servers', slug: 'servers', icon: 'Server', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000702', name: 'Softwares', slug: 'softwares', icon: 'Code', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000703', name: 'Gaming PCs', slug: 'gaming-pcs', icon: 'Gamepad2', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000704', name: 'Networking', slug: 'networking', icon: 'Wifi', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000705', name: 'Printers & Photocopiers', slug: 'printers-photocopiers', icon: 'Printer', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000706', name: 'Inks & Toners', slug: 'inks-toners', icon: 'Droplet', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000707', name: '3D Printers & Accessories', slug: '3d-printers-accessories', icon: 'Box', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000202', name: 'Televisions & Accessories', slug: 'televisions-accessories', icon: 'Tv', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000301', name: 'Televisions', slug: 'televisions', icon: 'Tv', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000302', name: 'Android Boxes', slug: 'android-boxes', icon: 'Box', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000303', name: 'IPTV', slug: 'iptv', icon: 'Tv', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000304', name: 'Dish Antennas', slug: 'dish-antennas', icon: 'Radio', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000305', name: 'Projectors & Projection Screens', slug: 'projectors-projection-screens', icon: 'Tv', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000306', name: 'TV Remotes', slug: 'tv-remotes', icon: 'Sliders', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000307', name: 'TV Cables', slug: 'tv-cables', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000308', name: 'Wall Mounts', slug: 'wall-mounts', icon: 'Layers', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000309', name: 'Other TV Accessories', slug: 'other-tv-accessories', icon: 'Settings', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000203', name: 'Video-Audios', slug: 'video-audios', icon: 'Volume2', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000401', name: 'Speakers', slug: 'speakers', icon: 'Volume2', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000402', name: 'Amplifiers', slug: 'amplifiers', icon: 'Volume2', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000403', name: 'Microphones', slug: 'microphones', icon: 'Mic', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000404', name: 'Home Theater Systems', slug: 'home-theater-systems', icon: 'Tv', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000405', name: 'Car Audio/Video', slug: 'car-audio-video', icon: 'Radio', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000406', name: 'Other Video - Audio', slug: 'other-video-audio', icon: 'Settings', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000407', name: 'Walkie Talkie', slug: 'walkie-talkie', icon: 'Radio', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000408', name: 'CD/DVD Players', slug: 'cd-dvd-players', icon: 'Disc', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000409', name: 'Sound Bars', slug: 'sound-bars', icon: 'Volume2', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000410', name: 'Radios', slug: 'radios', icon: 'Radio', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000411', name: 'Cassette Players & Recorders', slug: 'cassette-players-recorders', icon: 'Disc', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000412', name: 'Audio Mixers', slug: 'audio-mixers', icon: 'Sliders', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000413', name: 'Mp 3 Players', slug: 'mp3-players', icon: 'Music', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000414', name: 'Turntables & Accessories', slug: 'turntables-accessories', icon: 'Disc', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000415', name: 'Audio Interface', slug: 'audio-interface', icon: 'Sliders', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000416', name: 'Digital Recorders', slug: 'digital-recorders', icon: 'Mic', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000417', name: 'Cables', slug: 'cables', icon: 'Zap', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000204', name: 'Refrigerators & Freezers', slug: 'refrigerators-freezers', icon: 'Box', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000501', name: 'Refrigerators', slug: 'refrigerators', icon: 'Box', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000502', name: 'Freezers', slug: 'freezers', icon: 'Box', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000503', name: 'Mini', slug: 'mini-refrigerators', icon: 'Box', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000504', name: 'Refrigerators & Freezers Accessories', slug: 'refrigerators-freezers-accessories', icon: 'Settings', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000205', name: 'AC & Coolers', slug: 'ac-coolers', icon: 'Wind', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000601', name: 'Air Conditioners', slug: 'air-conditioners', icon: 'Wind', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000602', name: 'Air Coolers', slug: 'air-coolers', icon: 'Wind', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000603', name: 'AC & Cooler Accessories', slug: 'ac-cooler-accessories', icon: 'Settings', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000206', name: 'Games & Entertainment', slug: 'games-entertainment', icon: 'Gamepad2', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000701', name: 'Gaming Consoles', slug: 'gaming-consoles', icon: 'Gamepad2', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000702', name: 'Video Games', slug: 'video-games', icon: 'Gamepad2', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000703', name: 'Controllers', slug: 'controllers', icon: 'Sliders', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000704', name: 'Gaming Accessories', slug: 'gaming-accessories', icon: 'Settings', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000207', name: 'Washing Machines & Dryers', slug: 'washing-machines-dryers', icon: 'RefreshCw', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000801', name: 'Washer', slug: 'washer', icon: 'RefreshCw', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000802', name: 'Spin Dryer', slug: 'spin-dryer', icon: 'RefreshCw', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000803', name: 'Washer & Dryer', slug: 'washer-dryer', icon: 'RefreshCw', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000804', name: 'Washing Machine & Dryer Accessories', slug: 'washing-machine-dryer-accessories', icon: 'Settings', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000208', name: 'Irons & Steamers', slug: 'irons-steamers', icon: 'Flame', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000805', name: 'Irons', slug: 'irons', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000806', name: 'Steamers', slug: 'steamers', icon: 'Flame', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000209', name: 'Generators, UPS & Power Solutions', slug: 'generators-ups-power-solutions', icon: 'Zap', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000807', name: 'Generators', slug: 'generators', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000808', name: 'UPS', slug: 'ups', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000809', name: 'Solar Panels', slug: 'solar-panels', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000810', name: 'Solar Inverter', slug: 'solar-inverter', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000811', name: 'Solar Accessories', slug: 'solar-accessories', icon: 'Settings', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000812', name: 'Batteries', slug: 'batteries', icon: 'Zap', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000210', name: 'Microwaves & Ovens', slug: 'microwaves-ovens', icon: 'UtensilsCrossed', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000813', name: 'Ovens', slug: 'ovens', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000814', name: 'Microwaves', slug: 'microwaves', icon: 'UtensilsCrossed', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000211', name: 'Kitchen Appliances', slug: 'kitchen-appliances', icon: 'UtensilsCrossed', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000901', name: 'Juicers', slug: 'juicers', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000902', name: 'Food Factory', slug: 'food-factory', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000903', name: 'Stoves', slug: 'stoves', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000904', name: 'Blenders', slug: 'blenders', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000905', name: 'Air Fryers', slug: 'air-fryers', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000906', name: 'Choppers', slug: 'choppers', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000907', name: 'Grills', slug: 'grills', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000908', name: 'Water Purifiers', slug: 'water-purifiers', icon: 'Droplets', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000909', name: 'Mixers', slug: 'mixers', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000910', name: 'Electric Kettles', slug: 'electric-kettles', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000911', name: 'Toasters', slug: 'toasters', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000912', name: 'Electric Cookers', slug: 'electric-cookers', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000913', name: 'Hot Plates', slug: 'hot-plates', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000914', name: 'Coffee & Tea Machines', slug: 'coffee-tea-machines', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000915', name: 'Hobs', slug: 'hobs', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000916', name: 'Sandwich Makers', slug: 'sandwich-makers', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000917', name: 'Vegetable Slicers', slug: 'vegetable-slicers', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000918', name: 'Hoods', slug: 'hoods', icon: 'Wind', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000919', name: 'Meat Grinders', slug: 'meat-grinders', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000920', name: 'Dishwashers', slug: 'dishwashers', icon: 'RefreshCw', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000921', name: 'Roti Makers', slug: 'roti-makers', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000922', name: 'Sinks', slug: 'sinks', icon: 'Droplets', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000923', name: 'Food Steamers', slug: 'food-steamers', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000924', name: 'Other Kitchen Appliances', slug: 'other-kitchen-appliances', icon: 'UtensilsCrossed', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000925', name: 'Kitchen Appliance Accessories', slug: 'kitchen-appliance-accessories', icon: 'Settings', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000212', name: 'Fans', slug: 'fans', icon: 'Wind', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000a01', name: 'Ceiling Fans', slug: 'ceiling-fans', icon: 'Wind', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a02', name: 'Pedestal Fans', slug: 'pedestal-fans', icon: 'Wind', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a03', name: 'Bracket Fans', slug: 'bracket-fans', icon: 'Wind', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a04', name: 'Exhaust Fans', slug: 'exhaust-fans', icon: 'Wind', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a05', name: 'Mist Fans', slug: 'mist-fans', icon: 'Wind', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a06', name: 'Portable Fans', slug: 'portable-fans', icon: 'Wind', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000213', name: 'Heaters & Geysers', slug: 'heaters-geysers', icon: 'Thermometer', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000a07', name: 'Geysers', slug: 'geysers', icon: 'Thermometer', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a08', name: 'Heating Rods', slug: 'heating-rods', icon: 'Flame', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a09', name: 'Heaters', slug: 'heaters', icon: 'Flame', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000214', name: 'Air Purifiers & Humidifiers', slug: 'air-purifiers-humidifiers', icon: 'Wind', color: '#3b82f6' },
      { id: 'd1000000-0000-0000-0000-000000000215', name: 'Sewing Machines', slug: 'sewing-machines', icon: 'Scissors', color: '#3b82f6' },
      { id: 'd1000000-0000-0000-0000-000000000216', name: 'Water Dispensers', slug: 'water-dispensers', icon: 'Droplets', color: '#3b82f6' },
      { id: 'd1000000-0000-0000-0000-000000000217', name: 'Tools & DIY Equipment', slug: 'tools-diy-equipment', icon: 'Wrench', color: '#3b82f6',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000a10', name: 'Hand Tools', slug: 'hand-tools', icon: 'Wrench', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a11', name: 'Power Tools', slug: 'power-tools', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a12', name: 'Electrical', slug: 'electrical', icon: 'Zap', color: '#3b82f6' },
          { id: 'd1000000-0000-0000-0000-000000000a13', name: 'Other Equipments', slug: 'other-equipments', icon: 'Wrench', color: '#3b82f6' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000218', name: 'Other Home Appliances', slug: 'other-home-appliances', icon: 'Cpu', color: '#3b82f6' },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000007', name: 'Services', slug: 'services', icon: 'Wrench', color: '#06b6d4',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000000d01', name: 'Architecture & Interior Design', slug: 'architecture-interior-design', icon: 'Compass', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d02', name: 'Camera Installation', slug: 'camera-installation', icon: 'Camera', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d03', name: 'Car Rental', slug: 'car-rental', icon: 'Car', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d04', name: 'Car Services', slug: 'car-services', icon: 'Wrench', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d05', name: 'Catering & Restaurant', slug: 'catering-restaurant', icon: 'Utensils', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d06', name: 'Construction Services', slug: 'construction-services', icon: 'Building', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d07', name: 'Consultancy Services', slug: 'consultancy-services', icon: 'Briefcase', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d08', name: 'Domestic Help', slug: 'domestic-help', icon: 'Home', color: '#06b6d4',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000e01', name: 'Maids', slug: 'maids', icon: 'Home', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e02', name: 'Babysitters', slug: 'babysitters', icon: 'Heart', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e03', name: 'Cooks', slug: 'cooks', icon: 'Utensils', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e04', name: 'Nursing Staff', slug: 'nursing-staff', icon: 'Heart', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e05', name: 'Other Domestic Help', slug: 'other-domestic-help', icon: 'Home', color: '#06b6d4' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000d09', name: 'Drivers & Taxi', slug: 'drivers-taxi', icon: 'Car', color: '#06b6d4',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000e06', name: 'Drivers', slug: 'drivers', icon: 'Car', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e07', name: 'Pick & Drop', slug: 'pick-drop', icon: 'Car', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e08', name: 'Carpool', slug: 'carpool', icon: 'Car', color: '#06b6d4' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000d10', name: 'Tuitions & Academies', slug: 'tuitions-academies', icon: 'GraduationCap', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d11', name: 'Electronics & Computer Repair', slug: 'electronics-computer-repair', icon: 'Cpu', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d13', name: 'Farm & Fresh Food', slug: 'farm-fresh-food', icon: 'Apple', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d14', name: 'Health & Beauty', slug: 'health-beauty', icon: 'Heart', color: '#06b6d4',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000e20', name: 'Beauty & Spa', slug: 'beauty-spa', icon: 'Sparkles', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e21', name: 'Fitness Trainers', slug: 'fitness-trainers', icon: 'Activity', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e22', name: 'Health Services', slug: 'health-services', icon: 'Heart', color: '#06b6d4' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000d15', name: 'Home & Office Repair', slug: 'home-office-repair', icon: 'Wrench', color: '#06b6d4',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000e10', name: 'Painters', slug: 'painters', icon: 'Paintbrush', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e11', name: 'Electricians', slug: 'electricians', icon: 'Zap', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e12', name: 'Plumbers', slug: 'plumbers', icon: 'Droplets', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e13', name: 'Carpenters', slug: 'carpenters', icon: 'Hammer', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e14', name: 'Pest Control', slug: 'pest-control', icon: 'Bug', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e15', name: 'Water Tank Cleaning', slug: 'water-tank-cleaning', icon: 'Droplets', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e16', name: 'Deep Cleaning', slug: 'deep-cleaning', icon: 'Sparkles', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e17', name: 'Geyser Services', slug: 'geyser-services', icon: 'Flame', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e18', name: 'AC Services', slug: 'ac-services', icon: 'Wind', color: '#06b6d4' },
          { id: 'd1000000-0000-0000-0000-000000000e19', name: 'Other Repair Services', slug: 'other-repair-services', icon: 'Wrench', color: '#06b6d4' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000d16', name: 'Insurance Services', slug: 'insurance-services', icon: 'Shield', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d17', name: 'Marriage Bureau', slug: 'marriage-bureau', icon: 'Heart', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d18', name: 'Movers & Packers', slug: 'movers-packers', icon: 'Truck', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d19', name: 'Renting Services', slug: 'renting-services', icon: 'Key', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d20', name: 'Tailor Services', slug: 'tailor-services', icon: 'Scissors', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d21', name: 'Travel & Visa', slug: 'travel-visa', icon: 'Globe', color: '#06b6d4' },
      { id: 'd1000000-0000-0000-0000-000000000d24', name: 'Other Services', slug: 'other-services', icon: 'Wrench', color: '#06b6d4' },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000008', name: 'Education', slug: 'education', icon: 'BookOpen', color: '#6366f1',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000008001', name: 'Books', slug: 'edu-books', icon: 'Book', color: '#6366f1',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000008101', name: 'School Books', slug: 'edu-school-books', icon: 'Book', color: '#6366f1', attributes_schema: EDU_SCHOOL_BOOKS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008102', name: 'University Books', slug: 'edu-university-books', icon: 'Book', color: '#6366f1', attributes_schema: EDU_UNIVERSITY_BOOKS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008103', name: 'O-Level / A-Level Books', slug: 'edu-olevel-alevel-books', icon: 'Book', color: '#6366f1', attributes_schema: EDU_BOOKS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008104', name: 'Islamic / Religious Books', slug: 'edu-religious-books', icon: 'Book', color: '#6366f1', attributes_schema: EDU_BOOKS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008105', name: 'General Knowledge Books', slug: 'edu-gk-books', icon: 'Book', color: '#6366f1', attributes_schema: EDU_BOOKS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008106', name: 'Professional / Technical Books', slug: 'edu-professional-books', icon: 'Book', color: '#6366f1', attributes_schema: EDU_BOOKS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008107', name: 'Other Books', slug: 'edu-other-books', icon: 'Book', color: '#6366f1', attributes_schema: EDU_BOOKS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008108', name: 'Magazines', slug: 'edu-magazines', icon: 'BookOpen', color: '#6366f1', attributes_schema: EDU_BOOKS_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000008002', name: 'Tuition & Tutoring', slug: 'edu-tuition', icon: 'Users', color: '#6366f1',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000008201', name: 'Home Tutor Wanted', slug: 'edu-home-tutor-wanted', icon: 'Users', color: '#6366f1', attributes_schema: EDU_TUTORING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008202', name: 'Home Tutor Available', slug: 'edu-home-tutor-available', icon: 'Users', color: '#6366f1', attributes_schema: EDU_TUTORING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008203', name: 'Online Tutor Available', slug: 'edu-online-tutor-available', icon: 'Users', color: '#6366f1', attributes_schema: EDU_TUTORING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008204', name: 'Group Tuition', slug: 'edu-group-tuition', icon: 'Users', color: '#6366f1', attributes_schema: EDU_TUTORING_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000008003', name: 'Courses & Training', slug: 'edu-courses', icon: 'GraduationCap', color: '#6366f1',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000008301', name: 'Online Courses', slug: 'edu-online-courses', icon: 'GraduationCap', color: '#6366f1', attributes_schema: EDU_ONLINE_COURSE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008302', name: 'Academies & Institutes', slug: 'edu-academies', icon: 'GraduationCap', color: '#6366f1', attributes_schema: EDU_ACADEMY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008303', name: 'Entry Test Preparation', slug: 'edu-entry-test-prep', icon: 'GraduationCap', color: '#6366f1', attributes_schema: EDU_TEST_PREP_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008304', name: 'Professional Certifications', slug: 'edu-professional-cert', icon: 'GraduationCap', color: '#6366f1', attributes_schema: EDU_ACADEMY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008305', name: 'Vocational & Skill Courses', slug: 'edu-vocational-courses', icon: 'GraduationCap', color: '#6366f1', attributes_schema: EDU_ACADEMY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008306', name: 'Language Courses', slug: 'edu-language-courses', icon: 'GraduationCap', color: '#6366f1', attributes_schema: EDU_LANGUAGE_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000008004', name: 'Study Materials', slug: 'edu-study-materials', icon: 'FileText', color: '#6366f1',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000008401', name: 'Past Papers', slug: 'edu-past-papers', icon: 'FileText', color: '#6366f1', attributes_schema: EDU_STUDY_MATERIAL_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008402', name: 'Notes & Guides', slug: 'edu-notes-guides', icon: 'FileText', color: '#6366f1', attributes_schema: EDU_STUDY_MATERIAL_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008403', name: 'Worksheets & Practice Sets', slug: 'edu-worksheets', icon: 'FileText', color: '#6366f1', attributes_schema: EDU_STUDY_MATERIAL_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008404', name: 'Flashcards', slug: 'edu-flashcards', icon: 'FileText', color: '#6366f1', attributes_schema: EDU_STUDY_MATERIAL_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008405', name: 'Other Study Material', slug: 'edu-other-study-material', icon: 'FileText', color: '#6366f1', attributes_schema: EDU_STUDY_MATERIAL_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000008005', name: 'School Supplies', slug: 'edu-school-supplies', icon: 'Pencil', color: '#6366f1',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000008501', name: 'Stationery', slug: 'edu-stationery', icon: 'Pencil', color: '#6366f1', attributes_schema: EDU_STATIONERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008502', name: 'School Bags & Backpacks', slug: 'edu-school-bags', icon: 'Pencil', color: '#6366f1', attributes_schema: EDU_SCHOOL_SUPPLIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008503', name: 'Lab Instruments & Equipment', slug: 'edu-lab-instruments', icon: 'Pencil', color: '#6366f1', attributes_schema: EDU_INSTRUMENTS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008504', name: 'Art & Craft Supplies', slug: 'edu-art-craft', icon: 'Pencil', color: '#6366f1', attributes_schema: EDU_STATIONERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000008505', name: 'Other School Supplies', slug: 'edu-other-supplies', icon: 'Pencil', color: '#6366f1', attributes_schema: EDU_SCHOOL_SUPPLIES_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000008006', name: 'Uniforms', slug: 'edu-uniforms', icon: 'Shirt', color: '#6366f1', attributes_schema: EDU_UNIFORM_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000008007', name: 'Scholarships & Admissions', slug: 'edu-scholarships', icon: 'Award', color: '#6366f1', attributes_schema: EDU_SCHOLARSHIP_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000008008', name: 'Language Learning', slug: 'edu-language-learning', icon: 'Globe', color: '#6366f1', attributes_schema: EDU_LANGUAGE_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000008009', name: 'Other Education', slug: 'edu-other', icon: 'BookOpen', color: '#6366f1', attributes_schema: EDU_STUDY_MATERIAL_SCHEMA }
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000009', name: 'Animals', slug: 'animals', icon: 'PawPrint', color: '#f97316',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000000b01', name: 'Hens', slug: 'hens', icon: 'Egg', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b02', name: 'Parrots', slug: 'parrots', icon: 'Bird', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b03', name: 'Livestock', slug: 'livestock', icon: 'Beef', color: '#f97316',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000c01', name: 'Buffalos', slug: 'buffalos', icon: 'Beef', color: '#f97316' },
          { id: 'd1000000-0000-0000-0000-000000000c02', name: 'Bulls', slug: 'bulls', icon: 'Beef', color: '#f97316' },
          { id: 'd1000000-0000-0000-0000-000000000c03', name: 'Camels', slug: 'camels', icon: 'PawPrint', color: '#f97316' },
          { id: 'd1000000-0000-0000-0000-000000000c04', name: 'Cows', slug: 'cows', icon: 'Beef', color: '#f97316' },
          { id: 'd1000000-0000-0000-0000-000000000c05', name: 'Goats', slug: 'goats', icon: 'Beef', color: '#f97316' },
          { id: 'd1000000-0000-0000-0000-000000000c06', name: 'Sheep', slug: 'sheep', icon: 'Beef', color: '#f97316' },
          { id: 'd1000000-0000-0000-0000-000000000c07', name: 'Others', slug: 'other-livestock', icon: 'PawPrint', color: '#f97316' },
        ]
      },
      { id: 'c1000000-0000-0000-0000-000000000148', name: 'Cats', slug: 'cats', icon: 'Cat', color: '#f97316' },
      { id: 'c1000000-0000-0000-0000-000000000151', name: 'Pet Food & Accessories', slug: 'pet-food-accessories', icon: 'ShoppingBag', color: '#f97316' },
      { id: 'c1000000-0000-0000-0000-000000000147', name: 'Dogs', slug: 'dogs', icon: 'PawPrint', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b07', name: 'Pigeons', slug: 'pigeons', icon: 'Bird', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b08', name: 'Rabbits', slug: 'rabbits', icon: 'Rabbit', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b09', name: 'Finches', slug: 'finches', icon: 'Bird', color: '#f97316' },
      { id: 'c1000000-0000-0000-0000-000000000150', name: 'Fish', slug: 'fish', icon: 'Fish', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b11', name: 'Other Birds', slug: 'other-birds', icon: 'Bird', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b12', name: 'Fertile Eggs', slug: 'fertile-eggs', icon: 'Egg', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b13', name: 'Ducks', slug: 'ducks', icon: 'Bird', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b14', name: 'Other Animals', slug: 'other-animals', icon: 'PawPrint', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b15', name: 'Doves', slug: 'doves', icon: 'Bird', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b16', name: 'Peacocks', slug: 'peacocks', icon: 'Bird', color: '#f97316' },
      { id: 'd1000000-0000-0000-0000-000000000b17', name: 'Horses', slug: 'horses', icon: 'PawPrint', color: '#f97316' },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000010', name: 'Sports & Hobbies', slug: 'sports-hobbies', icon: 'Trophy', color: '#84cc16',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000009001', name: 'Sports Equipment', slug: 'sph-sports-equipment', icon: 'Trophy', color: '#84cc16', attributes_schema: SPORTS_EQUIPMENT_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000009002', name: 'Gym & Fitness', slug: 'sph-gym-fitness', icon: 'Dumbbell', color: '#84cc16', attributes_schema: GYM_FITNESS_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000009003', name: 'Musical Instruments', slug: 'sph-musical-instruments', icon: 'Music', color: '#84cc16', attributes_schema: MUSICAL_INSTRUMENTS_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000009004', name: 'Calendars', slug: 'sph-calendars', icon: 'Calendar', color: '#84cc16', attributes_schema: CALENDARS_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000009005', name: 'Arts & Crafts', slug: 'sph-arts-crafts', icon: 'Palette', color: '#84cc16',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000009501', name: 'Gifts & Wrapping', slug: 'sph-gifts-wrapping', icon: 'Gift', color: '#84cc16', attributes_schema: ARTS_CRAFTS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009502', name: 'Craft Packaging & Supplies', slug: 'sph-craft-packaging', icon: 'Package', color: '#84cc16', attributes_schema: ARTS_CRAFTS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009503', name: 'Painting Supplies', slug: 'sph-painting-supplies', icon: 'Palette', color: '#84cc16', attributes_schema: ARTS_CRAFTS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009504', name: 'Paper Products', slug: 'sph-paper-products', icon: 'FileText', color: '#84cc16', attributes_schema: ARTS_CRAFTS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009505', name: 'Party Supplies', slug: 'sph-party-supplies', icon: 'PartyPopper', color: '#84cc16', attributes_schema: ARTS_CRAFTS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009506', name: 'Art Pads, Diaries & Folios', slug: 'sph-art-pads-diaries', icon: 'BookOpen', color: '#84cc16', attributes_schema: ARTS_CRAFTS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009507', name: 'Modeling & Sculpting', slug: 'sph-modeling-sculpting', icon: 'Box', color: '#84cc16', attributes_schema: ARTS_CRAFTS_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000009006', name: 'Camping & Hiking', slug: 'sph-camping-hiking', icon: 'Tent', color: '#84cc16',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000009601', name: 'Backpacks', slug: 'sph-backpacks', icon: 'Backpack', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009602', name: 'Camp Furniture', slug: 'sph-camp-furniture', icon: 'Armchair', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009603', name: 'Camp Kitchen', slug: 'sph-camp-kitchen', icon: 'UtensilsCrossed', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009604', name: 'Camping & Hiking Tool Kits', slug: 'sph-camping-tool-kits', icon: 'Wrench', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009605', name: 'Lighting', slug: 'sph-camping-lighting', icon: 'Flashlight', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009606', name: 'Navigation & Electronics', slug: 'sph-navigation-electronics', icon: 'Compass', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009607', name: 'Shelters & Canopies', slug: 'sph-shelters-canopies', icon: 'Home', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009608', name: 'Sleeping Gear', slug: 'sph-sleeping-gear', icon: 'Moon', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009609', name: 'Tents', slug: 'sph-tents', icon: 'Tent', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009610', name: 'Trekking Poles', slug: 'sph-trekking-poles', icon: 'Minus', color: '#84cc16', attributes_schema: CAMPING_HIKING_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000009007', name: 'Crafts & DIY Supplies', slug: 'sph-crafts-diy', icon: 'Scissors', color: '#84cc16',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000009701', name: 'Sewing Accessories', slug: 'sph-sewing-accessories', icon: 'Scissors', color: '#84cc16', attributes_schema: CRAFT_DIY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009702', name: 'Wool, Knitting & Crochet', slug: 'sph-wool-knitting-crochet', icon: 'Wind', color: '#84cc16', attributes_schema: CRAFT_DIY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009703', name: 'Embroidery & Hand Stitching', slug: 'sph-embroidery', icon: 'Sparkles', color: '#84cc16', attributes_schema: CRAFT_DIY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009704', name: 'Sewing & Craft Patterns', slug: 'sph-sewing-patterns', icon: 'FileText', color: '#84cc16', attributes_schema: CRAFT_DIY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009705', name: 'Quilt Making Supplies', slug: 'sph-quilt-making', icon: 'Layers', color: '#84cc16', attributes_schema: CRAFT_DIY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009706', name: 'Laces, Ribbons & Decorative Trims', slug: 'sph-laces-ribbons', icon: 'Ribbon', color: '#84cc16', attributes_schema: CRAFT_DIY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009707', name: 'Other Craft Supplies', slug: 'sph-other-craft', icon: 'Package', color: '#84cc16', attributes_schema: CRAFT_DIY_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000009008', name: 'Other Hobbies', slug: 'sph-other-hobbies', icon: 'Star', color: '#84cc16', attributes_schema: ARTS_CRAFTS_SCHEMA },
      { id: 'd1000000-0000-0000-0000-000000009009', name: 'Collectables', slug: 'sph-collectables', icon: 'Medal', color: '#84cc16',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000009801', name: 'Coins & Notes', slug: 'sph-coins-notes', icon: 'Coins', color: '#84cc16', attributes_schema: COLLECTABLES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009802', name: 'Stamps', slug: 'sph-stamps', icon: 'Stamp', color: '#84cc16', attributes_schema: COLLECTABLES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000009803', name: 'Stones', slug: 'sph-stones', icon: 'Gem', color: '#84cc16', attributes_schema: COLLECTABLES_SCHEMA }
        ]
      }
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000011', name: 'Business & Industrial', slug: 'business-industrial', icon: 'Factory', color: '#64748b',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000000f01', name: 'Business for Sale', slug: 'business-for-sale', icon: 'Store', color: '#64748b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000f10', name: 'Mobile Shops', slug: 'mobile-shops', icon: 'Smartphone', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f11', name: 'Water Plants', slug: 'water-plants', icon: 'Droplets', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f12', name: 'Beauty Salons', slug: 'beauty-salons', icon: 'Sparkles', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f13', name: 'Grocery Stores', slug: 'grocery-stores', icon: 'ShoppingCart', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f14', name: 'Hotels & Restaurants', slug: 'hotels-restaurants', icon: 'Utensils', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f15', name: 'Pharmacies', slug: 'pharmacies', icon: 'Pill', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f16', name: 'Snooker Clubs', slug: 'snooker-clubs', icon: 'Trophy', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f17', name: 'Cosmetic & Jewellery Shops', slug: 'cosmetic-jewellery-shops', icon: 'Sparkles', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f18', name: 'Gyms', slug: 'gyms', icon: 'Dumbbell', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f19', name: 'Clinics', slug: 'clinics', icon: 'Stethoscope', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f20', name: 'Franchises', slug: 'franchises', icon: 'Building2', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f21', name: 'Gift & Toy Shops', slug: 'gift-toy-shops', icon: 'Gift', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f22', name: 'Petrol Pumps', slug: 'petrol-pumps', icon: 'Fuel', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f23', name: 'Auto Part Shops', slug: 'auto-part-shops', icon: 'Settings', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f24', name: 'Other Businesses', slug: 'other-businesses', icon: 'Briefcase', color: '#64748b' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000f02', name: 'Food & Restaurants', slug: 'food-restaurants', icon: 'Utensils', color: '#64748b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000f30', name: 'Baking Equipments', slug: 'baking-equipments', icon: 'Utensils', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f31', name: 'Food Display Counters', slug: 'food-display-counters', icon: 'Store', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f32', name: 'Ovens & Tandoor', slug: 'ovens-tandoor', icon: 'Flame', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f33', name: 'Fryers', slug: 'fryers', icon: 'Flame', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f34', name: 'Tables & Platforms', slug: 'tables-platforms', icon: 'Layers', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f35', name: 'Fruit & Vegetable Machines', slug: 'fruit-vegetable-machines', icon: 'Apple', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f36', name: 'Chillers', slug: 'chillers', icon: 'Thermometer', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f37', name: 'Food Stalls', slug: 'food-stalls', icon: 'Store', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f38', name: 'Delivery Bags', slug: 'delivery-bags', icon: 'ShoppingBag', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f39', name: 'Crockery & Cutlery', slug: 'crockery-cutlery', icon: 'Utensils', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f40', name: 'Ice cream Machines', slug: 'ice-cream-machines', icon: 'Sparkles', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f41', name: 'Other Restaurant Equipments', slug: 'other-restaurant-equipments', icon: 'Wrench', color: '#64748b' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000f03', name: 'Construction & Heavy Machinery', slug: 'construction-heavy-machinery', icon: 'HardHat', color: '#64748b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000f50', name: 'Construction Material', slug: 'construction-material', icon: 'Building', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f51', name: 'Concrete Grinders', slug: 'concrete-grinders', icon: 'Cog', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f52', name: 'Drill Machines', slug: 'drill-machines', icon: 'Zap', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f53', name: 'Loaders', slug: 'loaders', icon: 'Truck', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f54', name: 'Concrete Mixers', slug: 'concrete-mixers', icon: 'Cog', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f55', name: 'Road Roller', slug: 'road-roller', icon: 'Truck', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f56', name: 'Cranes', slug: 'cranes', icon: 'HardHat', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f57', name: 'Construction Lifters', slug: 'construction-lifters', icon: 'HardHat', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f58', name: 'Pavers', slug: 'pavers', icon: 'Truck', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f59', name: 'Excavators', slug: 'excavators', icon: 'Truck', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f60', name: 'Concrete Cutters', slug: 'concrete-cutters', icon: 'Scissors', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f61', name: 'Compactors', slug: 'compactors', icon: 'Cog', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f62', name: 'Water Pumps', slug: 'water-pumps', icon: 'Droplets', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f63', name: 'Bulldozers', slug: 'bulldozers', icon: 'Truck', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f64', name: 'Air Compressors', slug: 'air-compressors', icon: 'Wind', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f65', name: 'Dump Truck', slug: 'dump-truck', icon: 'Truck', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f66', name: 'Motor Graders', slug: 'motor-graders', icon: 'Truck', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f67', name: 'Other Heavy Equipments', slug: 'other-heavy-equipments', icon: 'Wrench', color: '#64748b' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000f04', name: 'Agriculture', slug: 'biz-agriculture', icon: 'Leaf', color: '#64748b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000f70', name: 'Farm Machinery & Equipments', slug: 'farm-machinery-equipments', icon: 'Tractor', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f71', name: 'Seeds', slug: 'biz-seeds', icon: 'Leaf', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f72', name: 'Crops', slug: 'biz-crops', icon: 'Leaf', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f73', name: 'Pesticides & Fertilizers', slug: 'pesticides-fertilizers', icon: 'Flask', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f74', name: 'Plants & Trees', slug: 'plants-trees', icon: 'Leaf', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f75', name: 'Other Agriculture', slug: 'other-agriculture', icon: 'Leaf', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f76', name: 'Silage', slug: 'silage', icon: 'Leaf', color: '#64748b' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000f05', name: 'Medical & Pharma', slug: 'medical-pharma', icon: 'Stethoscope', color: '#64748b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000f80', name: 'Ultrasound Machines', slug: 'ultrasound-machines', icon: 'Activity', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f81', name: 'Surgical Masks', slug: 'surgical-masks', icon: 'Shield', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f82', name: 'Patient Beds', slug: 'patient-beds', icon: 'Heart', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f83', name: 'Wheelchairs', slug: 'wheelchairs', icon: 'Heart', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f84', name: 'Oxygen Concentrators', slug: 'oxygen-concentrators', icon: 'Wind', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f85', name: 'Oxygen Cylinders', slug: 'oxygen-cylinders', icon: 'Wind', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f86', name: 'Pulse Oximeters', slug: 'pulse-oximeters', icon: 'Activity', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f87', name: 'Hearing Aids', slug: 'hearing-aids', icon: 'Heart', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f88', name: 'Blood Pressure Monitors', slug: 'blood-pressure-monitors', icon: 'Activity', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f89', name: 'Thermometers', slug: 'thermometers', icon: 'Thermometer', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f90', name: 'Walkers', slug: 'walkers', icon: 'Heart', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f91', name: 'Nebulizers', slug: 'nebulizers', icon: 'Wind', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f92', name: 'Sanitizers', slug: 'sanitizers', icon: 'Droplets', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f93', name: 'Surgical Gloves', slug: 'surgical-gloves', icon: 'Shield', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f94', name: 'X-ray Machines', slug: 'x-ray-machines', icon: 'Activity', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f95', name: 'Medical Lighting', slug: 'medical-lighting', icon: 'Zap', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f96', name: 'Medicines', slug: 'medicines', icon: 'Pill', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f97', name: 'Glucometers', slug: 'glucometers', icon: 'Activity', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f98', name: 'Breast Pumps', slug: 'breast-pumps', icon: 'Heart', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000f99', name: 'Commode Chairs', slug: 'commode-chairs', icon: 'Heart', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fa0', name: 'Surgical Instruments', slug: 'surgical-instruments', icon: 'Scissors', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fa1', name: 'Medical Scrubs', slug: 'medical-scrubs', icon: 'Shield', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fa2', name: 'Weighing Scales', slug: 'weighing-scales', icon: 'Activity', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fa3', name: 'Health Accessories', slug: 'health-accessories', icon: 'Heart', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fa4', name: 'Microscopes', slug: 'microscopes', icon: 'Stethoscope', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fa5', name: 'Other Medical Supplies', slug: 'other-medical-supplies', icon: 'Stethoscope', color: '#64748b' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000f06', name: 'Trade & Industrial Machinery', slug: 'trade-industrial-machinery', icon: 'Cog', color: '#64748b',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000000fb0', name: 'Woodworking Machines', slug: 'woodworking-machines', icon: 'Wrench', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb1', name: 'Currency Counting Machines', slug: 'currency-counting-machines', icon: 'Briefcase', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb2', name: 'Plastic & Rubber Processing Machines', slug: 'plastic-rubber-processing-machines', icon: 'Cog', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb3', name: 'Industry Laser Machines', slug: 'industry-laser-machines', icon: 'Zap', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb4', name: 'Molding Machines', slug: 'molding-machines', icon: 'Cog', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb5', name: 'Packaging Machines', slug: 'packaging-machines', icon: 'Package', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb6', name: 'Welding Equipments', slug: 'welding-equipments', icon: 'Flame', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb7', name: 'Paper Machines', slug: 'paper-machines', icon: 'Cog', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb8', name: 'Air Compressors', slug: 'biz-air-compressors', icon: 'Wind', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fb9', name: 'Sealing Machines', slug: 'sealing-machines', icon: 'Package', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc0', name: 'Lathe Machines', slug: 'lathe-machines', icon: 'Cog', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc1', name: 'Liquid Filling Machines', slug: 'liquid-filling-machines', icon: 'Droplets', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc2', name: 'Marking Machines', slug: 'marking-machines', icon: 'Cog', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc3', name: 'Textile Machinery', slug: 'textile-machinery', icon: 'Scissors', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc4', name: 'Sewing Machines', slug: 'biz-sewing-machines', icon: 'Scissors', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc5', name: 'Knitting Machines', slug: 'knitting-machines', icon: 'Scissors', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc6', name: 'Embroidery Machines', slug: 'embroidery-machines', icon: 'Sparkles', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc7', name: 'Printing Machines', slug: 'printing-machines', icon: 'Printer', color: '#64748b' },
          { id: 'd1000000-0000-0000-0000-000000000fc8', name: 'Other Business & Industrial Machines', slug: 'other-biz-industrial-machines', icon: 'Wrench', color: '#64748b' },
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000000f07', name: 'Other Business & Industry', slug: 'other-business-industry', icon: 'Briefcase', color: '#64748b' },
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000012', name: 'Agriculture', slug: 'agriculture', icon: 'Leaf', color: '#22c55e',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-00000000a001', name: 'Farm Machinery & Equipment', slug: 'agri-machinery', icon: 'Wrench', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a101', name: 'Harvesters', slug: 'agri-harvesters', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a102', name: 'Seed Drills', slug: 'agri-seed-drills', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a103', name: 'Ploughs', slug: 'agri-ploughs', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a104', name: 'Rotavators', slug: 'agri-rotavators', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a105', name: 'Cultivators', slug: 'agri-cultivators', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a106', name: 'Sprayers', slug: 'agri-sprayers', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a107', name: 'Trailers', slug: 'agri-trailers', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a108', name: 'Water Pumps', slug: 'agri-water-pumps', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a109', name: 'Other Machinery', slug: 'agri-other-machinery', icon: 'Wrench', color: '#22c55e', attributes_schema: AGRI_MACHINERY_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a002', name: 'Tractors', slug: 'agri-tractors', icon: 'Tractor', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a201', name: 'Compact Tractors', slug: 'agri-compact-tractors', icon: 'Tractor', color: '#22c55e', attributes_schema: AGRI_TRACTOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a202', name: 'Utility Tractors', slug: 'agri-utility-tractors', icon: 'Tractor', color: '#22c55e', attributes_schema: AGRI_TRACTOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a203', name: 'Row Crop Tractors', slug: 'agri-row-crop-tractors', icon: 'Tractor', color: '#22c55e', attributes_schema: AGRI_TRACTOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a204', name: 'Industrial Tractors', slug: 'agri-industrial-tractors', icon: 'Tractor', color: '#22c55e', attributes_schema: AGRI_TRACTOR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a205', name: 'Tractor Parts & Accessories', slug: 'agri-tractor-parts', icon: 'Settings', color: '#22c55e', attributes_schema: AGRI_GENERAL_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a206', name: 'Other Tractors', slug: 'agri-other-tractors', icon: 'Tractor', color: '#22c55e', attributes_schema: AGRI_TRACTOR_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a003', name: 'Seeds', slug: 'agri-seeds', icon: 'Leaf', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a301', name: 'Wheat Seeds', slug: 'agri-wheat-seeds', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_SEEDS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a302', name: 'Rice Seeds', slug: 'agri-rice-seeds', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_SEEDS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a303', name: 'Maize Seeds', slug: 'agri-maize-seeds', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_SEEDS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a304', name: 'Vegetable Seeds', slug: 'agri-vegetable-seeds', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_SEEDS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a305', name: 'Fruit Seeds', slug: 'agri-fruit-seeds', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_SEEDS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a306', name: 'Flower Seeds', slug: 'agri-flower-seeds', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_SEEDS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a307', name: 'Other Seeds', slug: 'agri-other-seeds', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_SEEDS_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a004', name: 'Fertilizers', slug: 'agri-fertilizers', icon: 'Flask', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a401', name: 'Organic Fertilizers', slug: 'agri-organic-fertilizers', icon: 'Flask', color: '#22c55e', attributes_schema: AGRI_FERTILIZERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a402', name: 'Chemical Fertilizers', slug: 'agri-chemical-fertilizers', icon: 'Flask', color: '#22c55e', attributes_schema: AGRI_FERTILIZERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a403', name: 'Biofertilizers', slug: 'agri-biofertilizers', icon: 'Flask', color: '#22c55e', attributes_schema: AGRI_FERTILIZERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a404', name: 'Other Fertilizers', slug: 'agri-other-fertilizers', icon: 'Flask', color: '#22c55e', attributes_schema: AGRI_FERTILIZERS_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a005', name: 'Pesticides', slug: 'agri-pesticides', icon: 'Skull', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a501', name: 'Insecticides', slug: 'agri-insecticides', icon: 'Skull', color: '#22c55e', attributes_schema: AGRI_PESTICIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a502', name: 'Herbicides', slug: 'agri-herbicides', icon: 'Skull', color: '#22c55e', attributes_schema: AGRI_PESTICIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a503', name: 'Fungicides', slug: 'agri-fungicides', icon: 'Skull', color: '#22c55e', attributes_schema: AGRI_PESTICIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a504', name: 'Rodenticides', slug: 'agri-rodenticides', icon: 'Skull', color: '#22c55e', attributes_schema: AGRI_PESTICIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a505', name: 'Other Pesticides', slug: 'agri-other-pesticides', icon: 'Skull', color: '#22c55e', attributes_schema: AGRI_PESTICIDES_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a006', name: 'Livestock Feed', slug: 'agri-livestock-feed', icon: 'Package', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a601', name: 'Poultry Feed', slug: 'agri-poultry-feed', icon: 'Package', color: '#22c55e', attributes_schema: AGRI_FEED_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a602', name: 'Cattle & Dairy Feed', slug: 'agri-cattle-feed', icon: 'Package', color: '#22c55e', attributes_schema: AGRI_FEED_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a603', name: 'Fish Feed', slug: 'agri-fish-feed', icon: 'Package', color: '#22c55e', attributes_schema: AGRI_FEED_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a604', name: 'Other Livestock Feed', slug: 'agri-other-feed', icon: 'Package', color: '#22c55e', attributes_schema: AGRI_FEED_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a007', name: 'Irrigation Equipment', slug: 'agri-irrigation', icon: 'Droplet', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a701', name: 'Drip Irrigation', slug: 'agri-drip-irrigation', icon: 'Droplet', color: '#22c55e', attributes_schema: AGRI_IRRIGATION_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a702', name: 'Sprinkler Systems', slug: 'agri-sprinkler-systems', icon: 'Droplet', color: '#22c55e', attributes_schema: AGRI_IRRIGATION_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a703', name: 'Water Pipes & Hoses', slug: 'agri-water-pipes', icon: 'Droplet', color: '#22c55e', attributes_schema: AGRI_IRRIGATION_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a704', name: 'Valves & Controllers', slug: 'agri-irrigation-controllers', icon: 'Sliders', color: '#22c55e', attributes_schema: AGRI_IRRIGATION_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a705', name: 'Other Irrigation', slug: 'agri-other-irrigation', icon: 'Droplet', color: '#22c55e', attributes_schema: AGRI_IRRIGATION_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a008', name: 'Farm Tools', slug: 'agri-farm-tools', icon: 'Hammer', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a801', name: 'Hand Tools', slug: 'agri-hand-tools', icon: 'Hammer', color: '#22c55e', attributes_schema: AGRI_TOOLS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a802', name: 'Pruning & Cutting Tools', slug: 'agri-cutting-tools', icon: 'Scissors', color: '#22c55e', attributes_schema: AGRI_TOOLS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a803', name: 'Wheelbarrows & Carts', slug: 'agri-wheelbarrows', icon: 'ShoppingCart', color: '#22c55e', attributes_schema: AGRI_TOOLS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a804', name: 'Other Tools', slug: 'agri-other-tools', icon: 'Hammer', color: '#22c55e', attributes_schema: AGRI_TOOLS_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a009', name: 'Greenhouses', slug: 'agri-greenhouses', icon: 'Home', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000a901', name: 'Greenhouse Tunnels', slug: 'agri-greenhouse-tunnels', icon: 'Home', color: '#22c55e', attributes_schema: AGRI_GREENHOUSE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a902', name: 'Greenhouse Covers & Sheets', slug: 'agri-greenhouse-covers', icon: 'FileText', color: '#22c55e', attributes_schema: AGRI_GREENHOUSE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a903', name: 'Climate Control & Fans', slug: 'agri-greenhouse-fans', icon: 'Wind', color: '#22c55e', attributes_schema: AGRI_GREENHOUSE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000a904', name: 'Other Greenhouse Materials', slug: 'agri-other-greenhouse', icon: 'Home', color: '#22c55e', attributes_schema: AGRI_GREENHOUSE_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a010', name: 'Agricultural Land', slug: 'agri-land', icon: 'Map', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000aa01', name: 'Cultivated Land', slug: 'agri-cultivated-land', icon: 'Map', color: '#22c55e', attributes_schema: AGRI_LAND_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000aa02', name: 'Barren Land', slug: 'agri-barren-land', icon: 'Map', color: '#22c55e', attributes_schema: AGRI_LAND_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000aa03', name: 'Orchards & Groves', slug: 'agri-orchards', icon: 'Map', color: '#22c55e', attributes_schema: AGRI_LAND_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000aa04', name: 'Other Land', slug: 'agri-other-land', icon: 'Map', color: '#22c55e', attributes_schema: AGRI_LAND_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a011', name: 'Crop Produce', slug: 'agri-produce', icon: 'Leaf', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000ab01', name: 'Grains & Cereals', slug: 'agri-grains', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_PRODUCE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ab02', name: 'Vegetables', slug: 'agri-produce-vegetables', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_PRODUCE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ab03', name: 'Fruits', slug: 'agri-produce-fruits', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_PRODUCE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ab04', name: 'Cotton, Sugarcane & Cash Crops', slug: 'agri-cash-crops', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_PRODUCE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ab05', name: 'Other Produce', slug: 'agri-other-produce', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_PRODUCE_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a012', name: 'Dairy Equipment', slug: 'agri-dairy-equipment', icon: 'GlassWater', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000ac01', name: 'Milking Machines', slug: 'agri-milking-machines', icon: 'GlassWater', color: '#22c55e', attributes_schema: AGRI_DAIRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ac02', name: 'Milk Chillers & Coolers', slug: 'agri-milk-chillers', icon: 'GlassWater', color: '#22c55e', attributes_schema: AGRI_DAIRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ac03', name: 'Milk Cans & Containers', slug: 'agri-milk-cans', icon: 'GlassWater', color: '#22c55e', attributes_schema: AGRI_DAIRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ac04', name: 'Other Dairy Equipment', slug: 'agri-other-dairy-equipment', icon: 'GlassWater', color: '#22c55e', attributes_schema: AGRI_DAIRY_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a013', name: 'Poultry Equipment', slug: 'agri-poultry-equipment', icon: 'Bird', color: '#22c55e',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-00000000ad01', name: 'Incubators & Brooders', slug: 'agri-incubators', icon: 'Bird', color: '#22c55e', attributes_schema: AGRI_POULTRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ad02', name: 'Feeders & Drinkers', slug: 'agri-poultry-feeders', icon: 'Bird', color: '#22c55e', attributes_schema: AGRI_POULTRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ad03', name: 'Cages & Coops', slug: 'agri-cages-coops', icon: 'Bird', color: '#22c55e', attributes_schema: AGRI_POULTRY_SCHEMA },
          { id: 'd1000000-0000-0000-0000-00000000ad04', name: 'Other Poultry Equipment', slug: 'agri-other-poultry-equipment', icon: 'Bird', color: '#22c55e', attributes_schema: AGRI_POULTRY_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-00000000a014', name: 'Other Agriculture', slug: 'agri-other', icon: 'Leaf', color: '#22c55e', attributes_schema: AGRI_GENERAL_SCHEMA }
    ]
  },
  { id: 'c1000000-0000-0000-0000-000000000017', name: 'Kids', slug: 'kids', icon: 'Baby', color: '#fb7185',
    subcategories: [
      { id: 'd1000000-0000-0000-0000-000000007001', name: 'Kids Furniture', slug: 'kids-furniture', icon: 'Bed', color: '#fb7185',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000007101', name: 'Baby Beds & Cribs', slug: 'kids-beds-cribs', icon: 'Bed', color: '#fb7185', attributes_schema: KIDS_FURNITURE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007102', name: 'Study Tables', slug: 'kids-study-tables', icon: 'BookOpen', color: '#fb7185', attributes_schema: KIDS_FURNITURE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007103', name: 'Kids Chairs', slug: 'kids-chairs', icon: 'Check', color: '#fb7185', attributes_schema: KIDS_FURNITURE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007104', name: 'Toy Storage', slug: 'kids-toy-storage', icon: 'Package', color: '#fb7185', attributes_schema: KIDS_FURNITURE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007105', name: 'Wardrobes', slug: 'kids-wardrobes', icon: 'Home', color: '#fb7185', attributes_schema: KIDS_FURNITURE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007106', name: 'Bookshelves', slug: 'kids-bookshelves', icon: 'BookOpen', color: '#fb7185', attributes_schema: KIDS_FURNITURE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007107', name: 'Bean Bags', slug: 'kids-bean-bags', icon: 'Heart', color: '#fb7185', attributes_schema: KIDS_FURNITURE_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007108', name: 'Other Kids Furniture', slug: 'kids-other-furniture', icon: 'Bed', color: '#fb7185', attributes_schema: KIDS_FURNITURE_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000007002', name: 'Kids Vehicles', slug: 'kids-vehicles', icon: 'Car', color: '#fb7185',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000007201', name: 'Kids Bikes', slug: 'kids-bikes', icon: 'Bike', color: '#fb7185', attributes_schema: KIDS_VEHICLES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007202', name: 'Kids Cars', slug: 'kids-cars', icon: 'Car', color: '#fb7185', attributes_schema: KIDS_VEHICLES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007203', name: 'Kids Cycles', slug: 'kids-cycles', icon: 'Bike', color: '#fb7185', attributes_schema: KIDS_VEHICLES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007204', name: 'Kids Scooties', slug: 'kids-scooties', icon: 'Zap', color: '#fb7185', attributes_schema: KIDS_VEHICLES_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000007003', name: 'Toys', slug: 'kids-toys', icon: 'Gamepad2', color: '#fb7185',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000007301', name: 'Educational Toys', slug: 'kids-educational-toys', icon: 'GraduationCap', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007302', name: 'Action Figures', slug: 'kids-action-figures', icon: 'Gamepad2', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007303', name: 'Dolls', slug: 'kids-dolls', icon: 'Baby', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007304', name: 'Building Blocks', slug: 'kids-building-blocks', icon: 'Package', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007305', name: 'Board Games', slug: 'kids-board-games', icon: 'Gamepad2', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007306', name: 'Remote Control Toys', slug: 'kids-rc-toys', icon: 'Zap', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007307', name: 'Ride-On Toys', slug: 'kids-rideon-toys', icon: 'Car', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007308', name: 'Soft Toys', slug: 'kids-soft-toys', icon: 'Heart', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007309', name: 'Outdoor Toys', slug: 'kids-outdoor-toys', icon: 'Compass', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007310', name: 'Puzzles', slug: 'kids-puzzles', icon: 'HelpCircle', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007311', name: 'Musical Toys', slug: 'kids-musical-toys', icon: 'Music', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007312', name: 'Other Toys', slug: 'kids-other-toys', icon: 'Gamepad2', color: '#fb7185', attributes_schema: KIDS_TOYS_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000007004', name: 'Baby Gear', slug: 'kids-baby-gear', icon: 'Baby', color: '#fb7185',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000007401', name: 'Prams & Walkers', slug: 'kids-prams-walkers', icon: 'Baby', color: '#fb7185', attributes_schema: KIDS_BABY_GEAR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007402', name: 'Baby Bouncers', slug: 'kids-bouncers', icon: 'Smile', color: '#fb7185', attributes_schema: KIDS_BABY_GEAR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007403', name: 'Baby Carriers', slug: 'kids-carriers', icon: 'Baby', color: '#fb7185', attributes_schema: KIDS_BABY_GEAR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007404', name: 'Baby Cots', slug: 'kids-cots', icon: 'Bed', color: '#fb7185', attributes_schema: KIDS_BABY_GEAR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007405', name: 'Baby Swings', slug: 'kids-baby-swings', icon: 'Play', color: '#fb7185', attributes_schema: KIDS_BABY_GEAR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007406', name: 'Car Seats', slug: 'kids-car-seats', icon: 'Shield', color: '#fb7185', attributes_schema: KIDS_BABY_GEAR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007407', name: 'High Chairs', slug: 'kids-high-chairs', icon: 'Award', color: '#fb7185', attributes_schema: KIDS_BABY_GEAR_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007408', name: 'Other Baby Gear', slug: 'kids-other-gear', icon: 'Baby', color: '#fb7185', attributes_schema: KIDS_BABY_GEAR_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000007005', name: 'Bath & Diapers', slug: 'kids-bath-diapers', icon: 'Droplets', color: '#fb7185',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000007501', name: 'Diapers', slug: 'kids-diapers', icon: 'Baby', color: '#fb7185', attributes_schema: KIDS_BATH_DIAPERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007502', name: 'Baby Wipes', slug: 'kids-wipes', icon: 'FileText', color: '#fb7185', attributes_schema: KIDS_BATH_DIAPERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007503', name: 'Baby Shampoo', slug: 'kids-shampoo', icon: 'Droplet', color: '#fb7185', attributes_schema: KIDS_BATH_DIAPERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007504', name: 'Baby Soap', slug: 'kids-soap', icon: 'Droplet', color: '#fb7185', attributes_schema: KIDS_BATH_DIAPERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007505', name: 'Baby Towels', slug: 'kids-towels', icon: 'Layers', color: '#fb7185', attributes_schema: KIDS_BATH_DIAPERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007506', name: 'Potty Training', slug: 'kids-potty-training', icon: 'Smile', color: '#fb7185', attributes_schema: KIDS_BATH_DIAPERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007507', name: 'Baby Bathtubs', slug: 'kids-bathtubs', icon: 'Droplet', color: '#fb7185', attributes_schema: KIDS_BATH_DIAPERS_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007508', name: 'Other Bath & Diapers', slug: 'kids-other-bath', icon: 'Droplets', color: '#fb7185', attributes_schema: KIDS_BATH_DIAPERS_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000007006', name: 'Swings & Slides', slug: 'kids-swings-slides', icon: 'Play', color: '#fb7185',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000007601', name: 'Indoor Swings', slug: 'kids-indoor-swings', icon: 'Play', color: '#fb7185', attributes_schema: KIDS_SWINGS_SLIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007602', name: 'Outdoor Swings', slug: 'kids-outdoor-swings', icon: 'Play', color: '#fb7185', attributes_schema: KIDS_SWINGS_SLIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007603', name: 'Plastic Slides', slug: 'kids-plastic-slides', icon: 'Play', color: '#fb7185', attributes_schema: KIDS_SWINGS_SLIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007604', name: 'Playhouses', slug: 'kids-playhouses', icon: 'Home', color: '#fb7185', attributes_schema: KIDS_SWINGS_SLIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007605', name: 'Climbing Frames', slug: 'kids-climbing-frames', icon: 'Check', color: '#fb7185', attributes_schema: KIDS_SWINGS_SLIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007606', name: 'Seesaws', slug: 'kids-seesaws', icon: 'Play', color: '#fb7185', attributes_schema: KIDS_SWINGS_SLIDES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007607', name: 'Other Play Equipment', slug: 'kids-other-play', icon: 'Play', color: '#fb7185', attributes_schema: KIDS_SWINGS_SLIDES_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000007007', name: 'Kids Clothing', slug: 'kids-clothing', icon: 'Shirt', color: '#fb7185',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000007701', name: 'Kids Costumes', slug: 'kids-costumes', icon: 'Shirt', color: '#fb7185', attributes_schema: KIDS_CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007702', name: 'Kids Clothes', slug: 'kids-clothes', icon: 'Shirt', color: '#fb7185', attributes_schema: KIDS_CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007703', name: 'Kids Shoes', slug: 'kids-shoes', icon: 'Shirt', color: '#fb7185', attributes_schema: KIDS_CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007704', name: 'Kids Uniforms', slug: 'kids-uniforms', icon: 'Shirt', color: '#fb7185', attributes_schema: KIDS_CLOTHING_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007705', name: 'Others', slug: 'kids-clothing-others', icon: 'Shirt', color: '#fb7185', attributes_schema: KIDS_CLOTHING_SCHEMA }
        ]
      },
      { id: 'd1000000-0000-0000-0000-000000007008', name: 'Kids Accessories', slug: 'kids-accessories', icon: 'Sparkles', color: '#fb7185',
        subcategories: [
          { id: 'd1000000-0000-0000-0000-000000007801', name: 'School Bags', slug: 'kids-school-bags', icon: 'Sparkles', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007802', name: 'Lunch Boxes', slug: 'kids-lunch-boxes', icon: 'Package', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007803', name: 'Water Bottles', slug: 'kids-water-bottles', icon: 'Droplet', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007804', name: 'Baby Blankets', slug: 'kids-baby-blankets', icon: 'Layers', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007805', name: 'Feeding Bottles', slug: 'kids-feeding-bottles', icon: 'Droplet', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007806', name: 'Pacifiers', slug: 'kids-pacifiers', icon: 'Smile', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007807', name: 'Bibs', slug: 'kids-bibs', icon: 'Layers', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007808', name: 'Hats & Caps', slug: 'kids-hats-caps', icon: 'Sparkles', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007809', name: 'Hair Accessories', slug: 'kids-hair-accessories', icon: 'Sparkles', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA },
          { id: 'd1000000-0000-0000-0000-000000007810', name: 'Other Accessories', slug: 'kids-other-accessories', icon: 'Sparkles', color: '#fb7185', attributes_schema: KIDS_ACCESSORIES_SCHEMA }
        ]
      }
    ]
  },
];

export const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Abbottabad',
  'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana', 'Sheikhupura', 'Jhang',
  'Rahim Yar Khan', 'Gujrat'
];

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Open Box' },
  { value: 'good', label: 'Used' },
  { value: 'fair', label: 'Refurbished' },
  { value: 'poor', label: 'For Parts / Not Working' },
];

export const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'views', label: 'Most Viewed' },
];
