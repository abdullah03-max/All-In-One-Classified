import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const parentId = '3a4d9e5c-96b9-4787-b9b2-229dbdc869b2'; // Other Accessories

const parts = [
  {
    name: 'Motherboard',
    slug: 'computers-motherboards',
    icon: 'Cpu',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'socket_type', label: 'Socket Type', type: 'select', options: ['LGA 1700', 'LGA 1200', 'LGA 1151', 'AM4', 'AM5', 'TR4', 'Other'], required: true },
      { name: 'form_factor', label: 'Form Factor', type: 'select', options: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'], required: true },
      { name: 'chipset', label: 'Chipset', type: 'select', options: ['Intel Z790', 'Intel B760', 'Intel H610', 'AMD X670', 'AMD B650', 'AMD A620', 'AMD X570', 'AMD B550', 'Other'], required: true },
      { name: 'ram_slots', label: 'RAM Slots', type: 'select', options: ['2 Slots', '4 Slots', '8 Slots'], required: true },
      { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
    ]
  },
  {
    name: 'Graphics Card (GPU)',
    slug: 'computers-gpus',
    icon: 'Film',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'gpu_chipset', label: 'GPU Chipset', type: 'select', options: ['NVIDIA GeForce', 'AMD Radeon', 'Intel Arc'], required: true },
      { name: 'memory_size', label: 'Memory Size', type: 'select', options: ['2 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '24 GB', '48 GB'], required: true },
      { name: 'memory_type', label: 'Memory Type', type: 'select', options: ['GDDR6X', 'GDDR6', 'GDDR5', 'HBM2'], required: true },
      { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
    ]
  },
  {
    name: 'RAM (Memory)',
    slug: 'computers-ram',
    icon: 'Layers',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'capacity', label: 'Capacity', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB'], required: true },
      { name: 'ddr_version', label: 'DDR Version', type: 'select', options: ['DDR5', 'DDR4', 'DDR3', 'DDR2'], required: true },
      { name: 'speed', label: 'Speed', type: 'select', options: ['2400 MHz', '2666 MHz', '3200 MHz', '3600 MHz', '4800 MHz', '5200 MHz', '5600 MHz', '6000 MHz', '6400 MHz+'], required: true },
      { name: 'rgb_support', label: 'RGB Support', type: 'select', options: ['Yes', 'No'], required: true },
      { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
    ]
  },
  {
    name: 'SSD',
    slug: 'computers-ssds',
    icon: 'HardDrive',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'capacity', label: 'Capacity', type: 'select', options: ['120/128 GB', '240/256 GB', '480/512 GB', '1 TB', '2 TB', '4 TB+'], required: true },
      { name: 'interface_type', label: 'Interface Type', type: 'select', options: ['SATA III', 'M.2 SATA', 'External USB-C'], required: true },
      { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
    ]
  },
  {
    name: 'HDD (Hard Disk Drive)',
    slug: 'computers-hdds',
    icon: 'HardDrive',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'capacity', label: 'Capacity', type: 'select', options: ['500 GB', '1 TB', '2 TB', '4 TB', '6 TB', '8 TB', '10 TB+'], required: true },
      { name: 'form_factor', label: 'Form Factor', type: 'select', options: ['3.5-inch Desktop', '2.5-inch Laptop'], required: true },
      { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
    ]
  },
  {
    name: 'NVMe SSD',
    slug: 'computers-nvme-ssds',
    icon: 'HardDrive',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'capacity', label: 'Capacity', type: 'select', options: ['250/256 GB', '500/512 GB', '1 TB', '2 TB', '4 TB+'], required: true },
      { name: 'pcie_generation', label: 'PCIe Generation', type: 'select', options: ['PCIe Gen3', 'PCIe Gen4', 'PCIe Gen5'], required: true },
      { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
    ]
  },
  {
    name: 'Power Supply (PSU)',
    slug: 'computers-power-supplies',
    icon: 'Zap',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'wattage', label: 'Wattage', type: 'select', options: ['Under 450W', '450W-550W', '550W-650W', '650W-750W', '750W-850W', '850W-1000W', '1000W+'], required: true },
      { name: 'efficiency_rating', label: 'Efficiency Rating', type: 'select', options: ['80 Plus Standard', '80 Plus Bronze', '80 Plus Silver', '80 Plus Gold', '80 Plus Platinum', '80 Plus Titanium', 'Not Rated'], required: true },
      { name: 'modularity', label: 'Modularity', type: 'select', options: ['Full Modular', 'Semi-Modular', 'Non-Modular'], required: true },
      { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
    ]
  },
  {
    name: 'PC Case (Cabinet)',
    slug: 'computers-pc-cases',
    icon: 'Box',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'form_factor', label: 'Form Factor', type: 'select', options: ['Full Tower', 'Mid Tower', 'Mini Tower', 'Small Form Factor'], required: true },
      { name: 'side_panel', label: 'Side Panel', type: 'select', options: ['Tempered Glass', 'Acrylic', 'Solid Panel', 'Mesh'], required: true },
      { name: 'rgb_fans', label: 'RGB Fans', type: 'select', options: ['Included', 'Not Included'], required: true }
    ]
  },
  {
    name: 'CPU Cooler',
    slug: 'computers-cpu-coolers',
    icon: 'Wind',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'cooler_type', label: 'Cooler Type', type: 'select', options: ['Air Cooler', 'Liquid AIO 120mm', 'Liquid AIO 240mm', 'Liquid AIO 280mm', 'Liquid AIO 360mm', 'Custom Loop'], required: true },
      { name: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', 'Local Warranty', 'International Warranty'], required: false }
    ]
  },
  {
    name: 'Case Fans',
    slug: 'computers-cooling-fans',
    icon: 'Wind',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'fan_size', label: 'Fan Size', type: 'select', options: ['120mm', '140mm', '200mm', 'Other'], required: true },
      { name: 'pack_size', label: 'Pack Size', type: 'select', options: ['Single Fan', '3-in-1 Pack', '5-in-1 Pack'], required: true },
      { name: 'lighting', label: 'Lighting', type: 'select', options: ['ARGB', 'RGB', 'Single Color', 'No LED'], required: true }
    ]
  },
  {
    name: 'Optical Drive (DVD/CD Drive)',
    slug: 'computers-optical-drives',
    icon: 'Disc',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'drive_type', label: 'Drive Type', type: 'select', options: ['DVD-RW', 'Blu-ray Writer', 'DVD-ROM'], required: true },
      { name: 'mounting', label: 'Mounting', type: 'select', options: ['Internal', 'External USB'], required: true }
    ]
  },
  {
    name: 'Sound Card',
    slug: 'computers-sound-cards',
    icon: 'Volume2',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'card_type', label: 'Card Type', type: 'select', options: ['Internal PCIe', 'External USB DAC'], required: true }
    ]
  },
  {
    name: 'Network Card (LAN/Wi-Fi Card)',
    slug: 'computers-network-cards',
    icon: 'Network',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'connection_interface', label: 'Connection Interface', type: 'select', options: ['PCIe Card', 'USB Dongle', 'M.2 Card'], required: true },
      { name: 'speed_rating', label: 'Speed Rating', type: 'select', options: ['Gigabit Ethernet', 'Wi-Fi 5 (802.11ac)', 'Wi-Fi 6 (802.11ax)', 'Wi-Fi 6E / Wi-Fi 7', '10 Gigabit Ethernet'], required: true }
    ]
  },
  {
    name: 'RGB Components',
    slug: 'computers-rgb-components',
    icon: 'Sparkles',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'component_type', label: 'Component Type', type: 'select', options: ['RGB Strips', 'Controller / Hub', 'Custom Sleeved RGB Cables', 'GPU Support Bracket', 'Other'], required: true }
    ]
  },
  {
    name: 'Thermal Paste',
    slug: 'computers-thermal-paste',
    icon: 'Droplet',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'weight', label: 'Weight/Quantity', type: 'select', options: ['1g - 2g', '3.5g - 4g', '8g+', 'Other'], required: true }
    ]
  },
  {
    name: 'CMOS Battery',
    slug: 'computers-cmos-battery',
    icon: 'Battery',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'battery_model', label: 'Model', type: 'select', options: ['CR2032 (Standard)', 'Other'], required: true }
    ]
  },
  {
    name: 'Internal Cables',
    slug: 'computers-internal-cables',
    icon: 'Link',
    color: '#3b82f6',
    attributes_schema: [
      { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'cable_type', label: 'Cable Type', type: 'select', options: ['SATA Data Cable', 'SATA Power Cable', 'PWM Fan Splitter/Extension', 'PCIe Riser Cable', 'Power Supply Extension Cables', 'Front Panel Connectors', 'Other'], required: true }
    ]
  }
];

async function seedParts() {
  console.log('Logging in...');
  await supabase.auth.signInWithPassword({
    email: 'classifiedallinon@gmail.com',
    password: 'Abdullah0090@'
  });

  console.log('Cleaning existing sub-sub-categories under "Other Accessories"...');
  await supabase.from('categories').delete().eq('parent_id', parentId);

  for (const part of parts) {
    console.log(`Inserting sub-sub-subcategory: ${part.name}...`);
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: part.name,
        slug: part.slug,
        icon: part.icon,
        color: part.color,
        parent_id: parentId,
        attributes_schema: part.attributes_schema,
        is_active: true
      })
      .select();

    if (error) {
      console.error(`Failed to insert ${part.name}:`, error);
    } else {
      console.log(`Successfully inserted ${part.name}: ${data[0].id}`);
    }
  }
}

seedParts();
