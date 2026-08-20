/// Default Rich Category Specifications and Attributes Schemas for Flutter App
/// Synchronized 1:1 with Web marketplace specifications.

class CategoryConstants {
  static const List<Map<String, dynamic>> mobilePhonesSchema = [
    {
      'name': 'brand',
      'label': 'Brand',
      'type': 'select',
      'required': true,
      'options': [
        'Apple / iPhone',
        'Samsung',
        'Xiaomi / Redmi',
        'Vivo',
        'Oppo',
        'Realme',
        'Infinix',
        'Tecno',
        'Google Pixel',
        'OnePlus',
        'Huawei',
        'Honor',
        'Sony',
        'Motorola',
        'Nokia',
        'ZTE',
        'Nothing Phone',
        'XMobile',
        'Other'
      ]
    },
    {
      'name': 'model',
      'label': 'Model',
      'type': 'text',
      'required': true,
    },
    {
      'name': 'pta_status',
      'label': 'PTA Status',
      'type': 'select',
      'required': true,
      'options': [
        'PTA Approved',
        'Non PTA',
        'Factory Unlocked',
        'Custom Paid',
        'JV / Patch'
      ]
    },
    {
      'name': 'storage',
      'label': 'Storage',
      'type': 'select',
      'required': true,
      'options': [
        '16 GB',
        '32 GB',
        '64 GB',
        '128 GB',
        '256 GB',
        '512 GB',
        '1 TB'
      ]
    },
    {
      'name': 'ram',
      'label': 'RAM',
      'type': 'select',
      'required': true,
      'options': [
        '2 GB',
        '3 GB',
        '4 GB',
        '6 GB',
        '8 GB',
        '12 GB',
        '16 GB',
        '24 GB'
      ]
    },
    {
      'name': 'color',
      'label': 'Color',
      'type': 'text',
      'required': false,
    },
    {
      'name': 'warranty',
      'label': 'Warranty',
      'type': 'select',
      'required': false,
      'options': [
        'No Warranty',
        'Brand Warranty',
        'Local Warranty',
        'International Warranty'
      ]
    },
    {
      'name': 'condition_full',
      'label': 'Condition',
      'type': 'select',
      'isStandard': true,
      'standardId': 'condition_full',
      'options': ['New', 'Used', 'Open Box', 'Refurbished', 'For Parts / Not Working']
    }
  ];

  static const List<Map<String, dynamic>> tabletsSchema = [
    {
      'name': 'brand',
      'label': 'Brand',
      'type': 'select',
      'required': true,
      'options': [
        'Apple iPad',
        'Samsung Galaxy Tab',
        'Lenovo Tab',
        'Huawei MatePad',
        'Amazon Fire',
        'Xiaomi Pad',
        'Microsoft Surface',
        'Other'
      ]
    },
    {
      'name': 'model',
      'label': 'Model',
      'type': 'text',
      'required': true,
    },
    {
      'name': 'pta_status',
      'label': 'PTA Status / Connectivity',
      'type': 'select',
      'required': true,
      'options': [
        'Wi-Fi Only',
        'Wi-Fi + Cellular (PTA Approved)',
        'Wi-Fi + Cellular (Non-PTA)'
      ]
    },
    {
      'name': 'storage',
      'label': 'Storage',
      'type': 'select',
      'required': true,
      'options': ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB']
    },
    {
      'name': 'ram',
      'label': 'RAM',
      'type': 'select',
      'required': true,
      'options': ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '16 GB']
    },
    {
      'name': 'condition_full',
      'label': 'Condition',
      'type': 'select',
      'isStandard': true,
      'standardId': 'condition_full',
      'options': ['New', 'Used', 'Open Box', 'Refurbished']
    }
  ];

  static const List<Map<String, dynamic>> laptopsSchema = [
    {
      'name': 'brand',
      'label': 'Brand / Make',
      'type': 'select',
      'required': true,
      'options': [
        'Dell',
        'HP',
        'Lenovo',
        'Apple / MacBook',
        'Asus',
        'Acer',
        'MSI',
        'Razer',
        'Microsoft Surface',
        'Toshiba',
        'Samsung',
        'Other'
      ]
    },
    {
      'name': 'model',
      'label': 'Model',
      'type': 'text',
      'required': true,
    },
    {
      'name': 'processor',
      'label': 'Processor',
      'type': 'select',
      'required': true,
      'options': [
        'Intel Core i3',
        'Intel Core i5',
        'Intel Core i7',
        'Intel Core i9',
        'AMD Ryzen 3',
        'AMD Ryzen 5',
        'AMD Ryzen 7',
        'AMD Ryzen 9',
        'Apple M1',
        'Apple M2',
        'Apple M3',
        'Apple M4',
        'Other'
      ]
    },
    {
      'name': 'generation',
      'label': 'Generation',
      'type': 'select',
      'required': false,
      'options': [
        '4th Gen',
        '5th Gen',
        '6th Gen',
        '7th Gen',
        '8th Gen',
        '9th Gen',
        '10th Gen',
        '11th Gen',
        '12th Gen',
        '13th Gen',
        '14th Gen',
        'Apple Silicon',
        'Other'
      ]
    },
    {
      'name': 'ram',
      'label': 'RAM',
      'type': 'select',
      'required': true,
      'options': ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB']
    },
    {
      'name': 'storage_type',
      'label': 'Storage Type',
      'type': 'select',
      'required': true,
      'options': ['SSD', 'NVMe SSD', 'HDD', 'Hybrid (SSD + HDD)']
    },
    {
      'name': 'storage_capacity',
      'label': 'Storage Capacity',
      'type': 'select',
      'required': true,
      'options': ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB+']
    },
    {
      'name': 'graphics',
      'label': 'Graphics Card',
      'type': 'select',
      'required': false,
      'options': [
        'Integrated Graphics',
        'NVIDIA GeForce GTX',
        'NVIDIA GeForce RTX',
        'AMD Radeon Dedicated',
        'Dedicated GPU'
      ]
    },
    {
      'name': 'condition_full',
      'label': 'Condition',
      'type': 'select',
      'isStandard': true,
      'standardId': 'condition_full',
      'options': ['New', 'Used', 'Open Box', 'Refurbished']
    }
  ];

  static const List<Map<String, dynamic>> carsSchema = [
    {
      'name': 'make',
      'label': 'Make / Brand',
      'type': 'select',
      'required': true,
      'options': [
        'Toyota',
        'Honda',
        'Suzuki',
        'Daihatsu',
        'Nissan',
        'Audi',
        'BMW',
        'Mercedes-Benz',
        'Hyundai',
        'KIA',
        'Changan',
        'MG',
        'Haval',
        'Peugeot',
        'Proton',
        'DFSK',
        'FAW',
        'Prince',
        'Other'
      ]
    },
    {
      'name': 'model',
      'label': 'Model',
      'type': 'text',
      'required': true,
    },
    {
      'name': 'year',
      'label': 'Year',
      'type': 'select',
      'required': true,
      'options': [
        '2026',
        '2025',
        '2024',
        '2023',
        '2022',
        '2021',
        '2020',
        '2019',
        '2018',
        '2017',
        '2016',
        '2015',
        '2014',
        '2013',
        '2012',
        '2011',
        '2010',
        'Older'
      ]
    },
    {
      'name': 'transmission',
      'label': 'Transmission',
      'type': 'select',
      'required': true,
      'options': ['Automatic', 'Manual']
    },
    {
      'name': 'fuel_type',
      'label': 'Fuel Type',
      'type': 'select',
      'required': true,
      'options': ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG']
    },
    {
      'name': 'registered_city',
      'label': 'Registered In',
      'type': 'select',
      'required': false,
      'options': [
        'Lahore',
        'Karachi',
        'Islamabad',
        'Rawalpindi',
        'Faisalabad',
        'Multan',
        'Peshawar',
        'Un-registered'
      ]
    },
    {
      'name': 'mileage_km',
      'label': 'Mileage (KM)',
      'type': 'number',
      'required': false,
    },
    {
      'name': 'engine_capacity_cc',
      'label': 'Engine Capacity (CC)',
      'type': 'number',
      'required': false,
    },
    {
      'name': 'condition_full',
      'label': 'Condition',
      'type': 'select',
      'isStandard': true,
      'standardId': 'condition_full',
      'options': ['New', 'Used', 'Open Box', 'Refurbished']
    }
  ];

  static const List<Map<String, dynamic>> bikesSchema = [
    {
      'name': 'make',
      'label': 'Make / Brand',
      'type': 'select',
      'required': true,
      'options': [
        'Honda',
        'Yamaha',
        'Suzuki',
        'United',
        'Road Prince',
        'Super Power',
        'Crown',
        'Hi-Speed',
        'Benelli',
        'Unique',
        'ZXMCO',
        'Metro',
        'Other'
      ]
    },
    {
      'name': 'model',
      'label': 'Model',
      'type': 'text',
      'required': true,
    },
    {
      'name': 'year',
      'label': 'Year',
      'type': 'select',
      'required': true,
      'options': [
        '2026',
        '2025',
        '2024',
        '2023',
        '2022',
        '2021',
        '2020',
        '2019',
        '2018',
        '2017',
        '2016',
        '2015',
        'Older'
      ]
    },
    {
      'name': 'engine_capacity',
      'label': 'Engine Capacity',
      'type': 'select',
      'required': true,
      'options': ['70 cc', '100 cc', '110 cc', '125 cc', '150 cc', '200 cc', '250 cc', '500+ cc']
    },
    {
      'name': 'registered_city',
      'label': 'Registered City',
      'type': 'select',
      'required': false,
      'options': [
        'Lahore',
        'Karachi',
        'Islamabad',
        'Rawalpindi',
        'Faisalabad',
        'Multan',
        'Peshawar',
        'Un-registered'
      ]
    },
    {
      'name': 'condition_full',
      'label': 'Condition',
      'type': 'select',
      'isStandard': true,
      'standardId': 'condition_full',
      'options': ['New', 'Used', 'Open Box', 'Refurbished']
    }
  ];

  /// Resolves default schema fallback based on category name or slug
  static List<dynamic> getSchemaForCategory(String name, String slug) {
    final n = name.toLowerCase();
    final s = slug.toLowerCase();

    if (s.contains('phone') || n.contains('phone') || s.contains('mobile') || n.contains('mobile')) {
      return mobilePhonesSchema;
    }
    if (s.contains('tablet') || n.contains('tablet') || s.contains('ipad')) {
      return tabletsSchema;
    }
    if (s.contains('laptop') || n.contains('laptop') || s.contains('macbook')) {
      return laptopsSchema;
    }
    if (s.contains('car') || n.contains('car') || s.contains('vehicle') || n.contains('vehicle')) {
      return carsSchema;
    }
    if (s.contains('bike') || n.contains('bike') || s.contains('motorcycle') || n.contains('motorcycle')) {
      return bikesSchema;
    }

    return [
      {
        'name': 'condition_full',
        'label': 'Condition',
        'type': 'select',
        'isStandard': true,
        'standardId': 'condition_full',
        'options': ['New', 'Used', 'Open Box', 'Refurbished']
      }
    ];
  }
}
