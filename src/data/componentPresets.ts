// =========================================================================
// TECH BEAST COMPONENT SPECS & COLUMN-BASED PRESET SELECTORS
// =========================================================================

export interface PresetItem {
  id?: string;
  name: string;
  price: number;
  warranty: string;
}

export const formatWarrantyText = (warranty?: string | number): string => {
  if (!warranty || warranty === 'N/A' || warranty === '0' || warranty === 'none') {
    return 'No Warranty';
  }
  const str = String(warranty).trim();
  if (!str) return 'No Warranty';

  if (/^\d+$/.test(str)) {
    const years = parseInt(str, 10);
    return `${years} ${years === 1 ? 'Year' : 'Years'} Warranty`;
  }

  if (str.toLowerCase().endsWith('y') || str.toLowerCase().endsWith('yr') || str.toLowerCase().endsWith('yrs')) {
    const num = parseInt(str, 10);
    if (!isNaN(num)) {
      return `${num} ${num === 1 ? 'Year' : 'Years'} Warranty`;
    }
  }

  if (str.toLowerCase().includes('war')) {
    return str;
  }

  return `${str} Warranty`;
};

// -------------------------------------------------------------------------
// 1. PROCESSOR (CPU) STRUCTURE
// -------------------------------------------------------------------------
export const PROCESSOR_LINEUPS = [
  'Core i3',
  'Core i5',
  'Core i7',
  'Core i9',
  'Ryzen 3',
  'Ryzen 5',
  'Ryzen 7',
  'Ryzen 9'
];

export const INTEL_GENS = [
  '1st Gen',
  '2nd Gen',
  '3rd Gen',
  '4th Gen',
  '6th Gen',
  '7th Gen',
  '8th Gen',
  '9th Gen',
  '10th Gen',
  '11th Gen',
  '12th Gen',
  '13th Gen',
  '14th Gen'
];

export const AMD_GENS = [
  '3000 Series',
  '4000 Series',
  '5000 Series',
  '7000 Series',
  '8000 Series',
  '9000 Series'
];

export const PROCESSOR_CATALOG: Record<string, Record<string, PresetItem[]>> = {
  'Core i3': {
    '1st Gen': [{ name: 'Intel Core i3 540 1st Gen (2 Cores / 4 Threads)', price: 900, warranty: '1' }],
    '2nd Gen': [{ name: 'Intel Core i3 2100 2nd Gen (2 Cores / 4 Threads)', price: 1100, warranty: '1' }],
    '3rd Gen': [{ name: 'Intel Core i3 3220 3rd Gen (2 Cores / 4 Threads)', price: 1300, warranty: '1' }],
    '4th Gen': [{ name: 'Intel Core i3 4130 / 4150 4th Gen (2 Cores / 4 Threads)', price: 1500, warranty: '1' }],
    '6th Gen': [{ name: 'Intel Core i3 6100 6th Gen (2 Cores / 4 Threads)', price: 2200, warranty: '1' }],
    '7th Gen': [{ name: 'Intel Core i3 7100 7th Gen (2 Cores / 4 Threads)', price: 2600, warranty: '1' }],
    '8th Gen': [{ name: 'Intel Core i3 8100 8th Gen Quad Core (4 Cores / 4 Threads)', price: 3800, warranty: '1' }],
    '9th Gen': [{ name: 'Intel Core i3 9100F 9th Gen (4 Cores / 4 Threads)', price: 4400, warranty: '1' }],
    '10th Gen': [
      { name: 'Intel Core i3 10100F 10th Gen (4 Cores / 8 Threads)', price: 6200, warranty: '3' },
      { name: 'Intel Core i3 10100 10th Gen (with Integrated UHD Graphics)', price: 7800, warranty: '3' }
    ],
    '12th Gen': [
      { name: 'Intel Core i3 12100F 12th Gen (4 Cores / 8 Threads)', price: 7400, warranty: '3' },
      { name: 'Intel Core i3 12100 12th Gen (with Integrated UHD 730 Graphics)', price: 9800, warranty: '3' }
    ],
    '13th Gen': [{ name: 'Intel Core i3 13100F 13th Gen (4 Cores / 8 Threads)', price: 8900, warranty: '3' }],
    '14th Gen': [
      { name: 'Intel Core i3 14100F 14th Gen (4 Cores / 8 Threads)', price: 10400, warranty: '3' },
      { name: 'Intel Core i3 14100 14th Gen (with Integrated UHD 730 Graphics)', price: 12200, warranty: '3' }
    ]
  },
  'Core i5': {
    '2nd Gen': [{ name: 'Intel Core i5 2400 2nd Gen (4 Cores / 4 Threads)', price: 1800, warranty: '1' }],
    '3rd Gen': [{ name: 'Intel Core i5 3470 3rd Gen (4 Cores / 4 Threads)', price: 2100, warranty: '1' }],
    '4th Gen': [{ name: 'Intel Core i5 4570 / 4590 4th Gen (4 Cores / 4 Threads)', price: 2600, warranty: '1' }],
    '6th Gen': [{ name: 'Intel Core i5 6500 6th Gen (4 Cores / 4 Threads)', price: 3900, warranty: '1' }],
    '7th Gen': [{ name: 'Intel Core i5 7400 7th Gen (4 Cores / 4 Threads)', price: 4600, warranty: '1' }],
    '8th Gen': [{ name: 'Intel Core i5 8400 8th Gen (6 Cores / 6 Threads)', price: 6800, warranty: '1' }],
    '9th Gen': [{ name: 'Intel Core i5 9400F 9th Gen (6 Cores / 6 Threads)', price: 7400, warranty: '1' }],
    '10th Gen': [
      { name: 'Intel Core i5 10400F 10th Gen (6 Cores / 12 Threads)', price: 8600, warranty: '3' },
      { name: 'Intel Core i5 10400 10th Gen (with Integrated UHD 630 Graphics)', price: 11200, warranty: '3' }
    ],
    '11th Gen': [{ name: 'Intel Core i5 11400F 11th Gen (6 Cores / 12 Threads)', price: 9400, warranty: '3' }],
    '12th Gen': [
      { name: 'Intel Core i5 12400F 12th Gen (6 Cores / 12 Threads)', price: 10400, warranty: '3' },
      { name: 'Intel Core i5 12400 12th Gen (with Integrated UHD 730 Graphics)', price: 12900, warranty: '3' },
      { name: 'Intel Core i5 12600K 12th Gen (10 Cores / 16 Threads)', price: 18500, warranty: '3' }
    ],
    '13th Gen': [
      { name: 'Intel Core i5 13400F 13th Gen (10 Cores / 16 Threads)', price: 16800, warranty: '3' },
      { name: 'Intel Core i5 13600K 13th Gen (14 Cores / 20 Threads)', price: 25400, warranty: '3' }
    ],
    '14th Gen': [
      { name: 'Intel Core i5 14400F 14th Gen (10 Cores / 16 Threads)', price: 18400, warranty: '3' },
      { name: 'Intel Core i5 14600K 14th Gen (14 Cores / 20 Threads)', price: 27900, warranty: '3' }
    ]
  },
  'Core i7': {
    '3rd Gen': [{ name: 'Intel Core i7 3770 3rd Gen (4 Cores / 8 Threads)', price: 3600, warranty: '1' }],
    '4th Gen': [{ name: 'Intel Core i7 4770 / 4790 4th Gen (4 Cores / 8 Threads)', price: 4600, warranty: '1' }],
    '6th Gen': [{ name: 'Intel Core i7 6700 6th Gen (4 Cores / 8 Threads)', price: 6800, warranty: '1' }],
    '7th Gen': [{ name: 'Intel Core i7 7700 7th Gen (4 Cores / 8 Threads)', price: 7800, warranty: '1' }],
    '8th Gen': [{ name: 'Intel Core i7 8700 8th Gen (6 Cores / 12 Threads)', price: 10500, warranty: '1' }],
    '9th Gen': [{ name: 'Intel Core i7 9700 9th Gen (8 Cores / 8 Threads)', price: 12500, warranty: '1' }],
    '10th Gen': [{ name: 'Intel Core i7 10700F 10th Gen (8 Cores / 16 Threads)', price: 16500, warranty: '3' }],
    '11th Gen': [{ name: 'Intel Core i7 11700F 11th Gen (8 Cores / 16 Threads)', price: 18500, warranty: '3' }],
    '12th Gen': [{ name: 'Intel Core i7 12700F 12th Gen (12 Cores / 20 Threads)', price: 23500, warranty: '3' }],
    '13th Gen': [
      { name: 'Intel Core i7 13700F 13th Gen (16 Cores / 24 Threads)', price: 29500, warranty: '3' },
      { name: 'Intel Core i7 13700K 13th Gen (16 Cores / 24 Threads)', price: 33500, warranty: '3' }
    ],
    '14th Gen': [
      { name: 'Intel Core i7 14700F 14th Gen (20 Cores / 28 Threads)', price: 34500, warranty: '3' },
      { name: 'Intel Core i7 14700K 14th Gen (20 Cores / 28 Threads)', price: 38500, warranty: '3' }
    ]
  },
  'Core i9': {
    '9th Gen': [{ name: 'Intel Core i9 9900K 9th Gen (8 Cores / 16 Threads)', price: 22000, warranty: '1' }],
    '10th Gen': [{ name: 'Intel Core i9 10900K 10th Gen (10 Cores / 20 Threads)', price: 26000, warranty: '3' }],
    '12th Gen': [{ name: 'Intel Core i9 12900K 12th Gen (16 Cores / 24 Threads)', price: 36000, warranty: '3' }],
    '13th Gen': [{ name: 'Intel Core i9 13900K 13th Gen (24 Cores / 32 Threads)', price: 44000, warranty: '3' }],
    '14th Gen': [{ name: 'Intel Core i9 14900K 14th Gen (24 Cores / 32 Threads 6.0GHz)', price: 52990, warranty: '3' }]
  },
  'Ryzen 3': {
    '3000 Series': [{ name: 'AMD Ryzen 3 3200G with Radeon Vega 8 Graphics', price: 5800, warranty: '3' }]
  },
  'Ryzen 5': {
    '3000 Series': [{ name: 'AMD Ryzen 5 3600 3rd Gen (6 Cores / 12 Threads)', price: 7600, warranty: '3' }],
    '4000 Series': [{ name: 'AMD Ryzen 5 4500 (6 Cores / 12 Threads)', price: 6400, warranty: '3' }],
    '5000 Series': [
      { name: 'AMD Ryzen 5 5500 (6 Cores / 12 Threads)', price: 8200, warranty: '3' },
      { name: 'AMD Ryzen 5 5600 (6 Cores / 12 Threads 35MB Cache)', price: 11400, warranty: '3' },
      { name: 'AMD Ryzen 5 5600G with Radeon Vega 7 Graphics', price: 11800, warranty: '3' },
      { name: 'AMD Ryzen 5 5600X (6 Cores / 12 Threads)', price: 12900, warranty: '3' }
    ],
    '7000 Series': [
      { name: 'AMD Ryzen 5 7600 (6 Cores / 12 Threads 5.1GHz AM5)', price: 18990, warranty: '3' },
      { name: 'AMD Ryzen 5 7600X (6 Cores / 12 Threads 5.3GHz AM5)', price: 20490, warranty: '3' }
    ]
  },
  'Ryzen 7': {
    '5000 Series': [
      { name: 'AMD Ryzen 7 5700X (8 Cores / 16 Threads)', price: 16500, warranty: '3' },
      { name: 'AMD Ryzen 7 5700X3D (8 Cores 3D V-Cache)', price: 21500, warranty: '3' },
      { name: 'AMD Ryzen 7 5800X (8 Cores / 16 Threads)', price: 18900, warranty: '3' }
    ],
    '7000 Series': [
      { name: 'AMD Ryzen 7 7700X (8 Cores / 16 Threads 5.4GHz AM5)', price: 28500, warranty: '3' },
      { name: 'AMD Ryzen 7 7800X3D 3D V-Cache 8-Core Gaming CPU', price: 37500, warranty: '3' }
    ]
  },
  'Ryzen 9': {
    '5000 Series': [{ name: 'AMD Ryzen 9 5900X (12 Cores / 24 Threads)', price: 26500, warranty: '3' }],
    '7000 Series': [
      { name: 'AMD Ryzen 9 7900X (12 Cores / 24 Threads AM5)', price: 39500, warranty: '3' },
      { name: 'AMD Ryzen 9 7950X3D 16-Core 3D V-Cache Flagship', price: 54000, warranty: '3' }
    ]
  }
};

// -------------------------------------------------------------------------
// 2. MOTHERBOARD STRUCTURE
// -------------------------------------------------------------------------
export const MOTHERBOARD_PLATFORMS = [
  'LGA1700 (12/13/14th Gen)',
  'LGA1200 (10/11th Gen)',
  'Legacy Intel (H61/H81/H110)',
  'AMD AM4 (Ryzen 3000-5000)',
  'AMD AM5 (Ryzen 7000-9000)'
];

export const MOTHERBOARD_CATALOG: Record<string, PresetItem[]> = {
  'LGA1700 (12/13/14th Gen)': [
    { name: 'Gigabyte H610M H DDR4 Motherboard (PCIe 4.0, NVMe M.2)', price: 5800, warranty: '3' },
    { name: 'MSI PRO H610M-E DDR4 Motherboard', price: 5600, warranty: '3' },
    { name: 'ASUS Prime H610M-E DDR4 Motherboard', price: 6200, warranty: '3' },
    { name: 'Gigabyte B760M GAMING DDR4 Motherboard (Dual M.2)', price: 9400, warranty: '3' },
    { name: 'MSI PRO B760M-P DDR4 Motherboard (4 RAM Slots)', price: 9800, warranty: '3' },
    { name: 'MSI PRO B760M-A WIFI DDR5 Motherboard', price: 14500, warranty: '3' },
    { name: 'Gigabyte B760 AORUS ELITE AX DDR5 WiFi Motherboard', price: 16800, warranty: '3' },
    { name: 'MSI MAG Z790 TOMAHAWK WIFI DDR5 Gaming Motherboard', price: 23500, warranty: '3' },
    { name: 'ASUS ROG STRIX Z790-A Gaming WiFi DDR5 Motherboard', price: 34500, warranty: '3' }
  ],
  'LGA1200 (10/11th Gen)': [
    { name: 'H510M DDR4 Motherboard with M.2 NVMe Slot (Gigabyte/MSI)', price: 4800, warranty: '3' },
    { name: 'MSI B560M PRO-VDH WIFI DDR4 Motherboard', price: 7800, warranty: '3' }
  ],
  'Legacy Intel (H61/H81/H110)': [
    { name: 'H61 Motherboard DDR3 with HDMI & NVMe M.2 Slot (LGA1155)', price: 2200, warranty: '1' },
    { name: 'H81 Motherboard DDR3 with USB 3.0 & NVMe M.2 (LGA1150)', price: 2400, warranty: '1' },
    { name: 'H110 Motherboard DDR4 with M.2 Slot (LGA1151 6th/7th Gen)', price: 3200, warranty: '1' },
    { name: 'H310M DDR4 Motherboard with HDMI & M.2 (8th/9th Gen)', price: 4200, warranty: '1' }
  ],
  'AMD AM4 (Ryzen 3000-5000)': [
    { name: 'Gigabyte A520M K V2 DDR4 Motherboard (M.2 NVMe)', price: 4600, warranty: '3' },
    { name: 'MSI B450M PRO-VDH MAX DDR4 Motherboard', price: 5600, warranty: '3' },
    { name: 'MSI B550M PRO-VDH WIFI DDR4 Motherboard', price: 9200, warranty: '3' },
    { name: 'Gigabyte B550 AORUS ELITE V2 Gaming Motherboard', price: 11800, warranty: '3' }
  ],
  'AMD AM5 (Ryzen 7000-9000)': [
    { name: 'MSI PRO B650M-P DDR5 Motherboard (4 RAM Slots)', price: 10400, warranty: '3' },
    { name: 'MSI B650M GAMING WIFI DDR5 Motherboard', price: 11900, warranty: '3' },
    { name: 'Gigabyte B650 AORUS ELITE AX DDR5 WiFi Motherboard', price: 21400, warranty: '3' },
    { name: 'MSI MAG X670E TOMAHAWK WIFI AM5 Gaming Motherboard', price: 28500, warranty: '3' }
  ]
};

// -------------------------------------------------------------------------
// 3. RAM MEMORY STRUCTURE
// -------------------------------------------------------------------------
export const RAM_SIZES = ['8GB', '16GB (8x2)', '16GB Single', '32GB (16x2)', '64GB (32x2)', '4GB'];
export const RAM_TYPES = ['DDR4 (3200MHz)', 'DDR5 (5600/6000MHz)', 'DDR3 (1600MHz)'];

export const RAM_CATALOG: Record<string, Record<string, PresetItem[]>> = {
  'DDR4 (3200MHz)': {
    '8GB': [
      { name: '8GB DDR4 3200MHz Desktop RAM (Crucial / Consistent)', price: 1600, warranty: '3' },
      { name: 'Corsair Vengeance LPX 8GB 3200MHz DDR4', price: 1850, warranty: '3' }
    ],
    '16GB (8x2)': [
      { name: '16GB (8GBx2) DDR4 3200MHz High Speed Dual Channel RAM', price: 3200, warranty: '3' },
      { name: 'Corsair Vengeance LPX 16GB (8x2) 3200MHz DDR4', price: 3490, warranty: '3' },
      { name: 'Kingston FURY Beast 16GB (8x2) 3200MHz DDR4 RGB', price: 4200, warranty: '3' }
    ],
    '16GB Single': [
      { name: '16GB DDR4 3200MHz Single Stick Desktop RAM (Crucial)', price: 3100, warranty: '3' },
      { name: 'Corsair Vengeance LPX 16GB 3200MHz DDR4', price: 3400, warranty: '3' }
    ],
    '32GB (16x2)': [
      { name: '32GB (16GBx2) DDR4 3200MHz Dual Channel RAM', price: 6200, warranty: '3' },
      { name: 'Corsair Vengeance RGB PRO 32GB (16x2) 3600MHz DDR4', price: 7490, warranty: '3' }
    ],
    '64GB (32x2)': [
      { name: '64GB (32GBx2) DDR4 3200MHz High Capacity RAM Kit', price: 12500, warranty: '3' }
    ],
    '4GB': [
      { name: '4GB DDR4 2666MHz / 3200MHz Desktop RAM', price: 950, warranty: '3' }
    ]
  },
  'DDR5 (5600/6000MHz)': {
    '8GB': [{ name: '8GB DDR5 5200MHz Desktop RAM (Crucial)', price: 2400, warranty: '3' }],
    '16GB Single': [
      { name: '16GB DDR5 5600MHz High Speed Desktop RAM (Crucial)', price: 4200, warranty: '3' },
      { name: '16GB DDR5 6000MHz CL30 Extreme Speed RAM', price: 4800, warranty: '3' }
    ],
    '16GB (8x2)': [
      { name: '16GB (8GBx2) DDR5 5600MHz Dual Channel RAM Kit', price: 4900, warranty: '3' }
    ],
    '32GB (16x2)': [
      { name: 'Corsair Vengeance 32GB (16x2) 5600MHz DDR5', price: 8900, warranty: '3' },
      { name: 'Corsair Vengeance RGB 32GB (16x2) 6000MHz CL30 DDR5', price: 10490, warranty: '3' },
      { name: 'G.Skill Trident Z5 RGB 32GB (16x2) 6000MHz CL30 DDR5', price: 11400, warranty: '3' }
    ],
    '64GB (32x2)': [
      { name: '64GB (32GBx2) DDR5 6000MHz Dual Channel Workstation RAM', price: 18900, warranty: '3' }
    ],
    '4GB': [{ name: '8GB DDR5 4800MHz RAM', price: 2200, warranty: '3' }]
  },
  'DDR3 (1600MHz)': {
    '4GB': [{ name: '4GB DDR3 1600MHz Desktop RAM', price: 650, warranty: '3' }],
    '8GB': [{ name: '8GB DDR3 1600MHz Desktop RAM', price: 1100, warranty: '3' }],
    '16GB (8x2)': [{ name: '16GB (8GBx2) DDR3 1600MHz Dual Channel RAM Kit', price: 2200, warranty: '3' }],
    '16GB Single': [{ name: '16GB (8GBx2) DDR3 1600MHz Dual Channel RAM Kit', price: 2200, warranty: '3' }],
    '32GB (16x2)': [{ name: '16GB (8GBx2) DDR3 1600MHz Dual Channel RAM Kit', price: 2200, warranty: '3' }],
    '64GB (32x2)': [{ name: '32GB DDR3 RAM Kit', price: 4400, warranty: '3' }]
  }
};

// -------------------------------------------------------------------------
// 4. SSD & STORAGE STRUCTURE
// -------------------------------------------------------------------------
export const STORAGE_TYPES = [
  'M.2 NVMe Gen4',
  'M.2 NVMe Gen3',
  '2.5" SATA SSD',
  'Hard Disk (HDD)'
];

export const STORAGE_SIZES = ['512GB', '1TB', '2TB', '256GB', '128GB', '4TB'];

export const STORAGE_CATALOG: Record<string, Record<string, PresetItem[]>> = {
  'M.2 NVMe Gen4': {
    '512GB': [
      { name: 'Kingston NV2 512GB M.2 NVMe PCIe 4.0 SSD (up to 3500MB/s)', price: 2950, warranty: '3' },
      { name: 'Crucial P3 Plus 500GB M.2 NVMe PCIe 4.0 SSD', price: 3400, warranty: '3' }
    ],
    '1TB': [
      { name: 'Kingston NV2 / NV3 1TB M.2 NVMe PCIe 4.0 SSD', price: 5200, warranty: '3' },
      { name: 'Crucial P3 Plus 1TB M.2 NVMe PCIe 4.0 SSD (up to 5000MB/s)', price: 5490, warranty: '3' },
      { name: 'Western Digital WD Blue SN580 1TB M.2 NVMe Gen4 SSD', price: 5600, warranty: '5' },
      { name: 'Samsung 980 PRO 1TB M.2 NVMe PCIe 4.0 Flagship SSD (7450MB/s)', price: 8990, warranty: '5' }
    ],
    '2TB': [
      { name: 'Crucial P3 Plus 2TB M.2 NVMe PCIe 4.0 SSD (5000MB/s)', price: 10800, warranty: '3' },
      { name: 'Samsung 990 PRO 2TB M.2 NVMe Gen4 Ultra Speed SSD', price: 16500, warranty: '5' }
    ],
    '256GB': [{ name: '256GB M.2 NVMe PCIe High Speed SSD', price: 1750, warranty: '3' }],
    '128GB': [{ name: '128GB M.2 NVMe SSD', price: 1200, warranty: '3' }],
    '4TB': [{ name: 'Crucial P3 Plus 4TB M.2 NVMe PCIe 4.0 SSD', price: 23500, warranty: '3' }]
  },
  'M.2 NVMe Gen3': {
    '256GB': [{ name: '256GB M.2 NVMe PCIe 3.0 SSD (Consistent/EVM)', price: 1650, warranty: '3' }],
    '512GB': [{ name: '512GB M.2 NVMe PCIe 3.0 SSD (2400MB/s)', price: 2600, warranty: '3' }],
    '1TB': [{ name: 'Crucial P3 1TB M.2 NVMe PCIe 3.0 SSD (3500MB/s)', price: 4900, warranty: '3' }],
    '2TB': [{ name: 'Crucial P3 2TB M.2 NVMe PCIe 3.0 SSD', price: 9800, warranty: '3' }],
    '128GB': [{ name: '128GB M.2 NVMe SSD', price: 1100, warranty: '3' }],
    '4TB': [{ name: '4TB NVMe SSD', price: 21000, warranty: '3' }]
  },
  '2.5" SATA SSD': {
    '128GB': [{ name: '128GB SATA III 2.5" Solid State Drive', price: 900, warranty: '3' }],
    '256GB': [{ name: '256GB SATA III 2.5" Solid State Drive (Consistent/EVM)', price: 1450, warranty: '3' }],
    '512GB': [{ name: '512GB SATA III 2.5" Solid State Drive (Crucial/EVM)', price: 2500, warranty: '3' }],
    '1TB': [{ name: 'Crucial BX500 1TB 3D NAND SATA 2.5" SSD', price: 4400, warranty: '3' }],
    '2TB': [{ name: 'Crucial BX500 2TB 3D NAND SATA 2.5" SSD', price: 9200, warranty: '3' }],
    '4TB': [{ name: '4TB SATA SSD', price: 18500, warranty: '3' }]
  },
  'Hard Disk (HDD)': {
    '1TB': [{ name: '1TB Seagate Barracuda 7200RPM Desktop Hard Drive', price: 3800, warranty: '2' }],
    '2TB': [{ name: '2TB Seagate Barracuda 3.5" Desktop Hard Drive', price: 5200, warranty: '2' }],
    '4TB': [{ name: '4TB Seagate Surveillance / Desktop 3.5" Hard Drive', price: 8900, warranty: '2' }],
    '512GB': [{ name: '500GB 7200RPM Desktop Hard Drive', price: 1400, warranty: '1' }],
    '256GB': [{ name: '320GB Desktop Hard Drive', price: 1100, warranty: '1' }],
    '128GB': [{ name: '160GB Desktop Hard Drive', price: 800, warranty: '1' }]
  }
};

// -------------------------------------------------------------------------
// 5. GRAPHICS CARD (GPU) STRUCTURE
// -------------------------------------------------------------------------
export const GPU_SERIES = [
  'RTX 40-Series',
  'RTX 30-Series / GTX',
  'AMD Radeon RX',
  'Integrated Graphics'
];

export const GPU_CATALOG: Record<string, PresetItem[]> = {
  'RTX 40-Series': [
    { name: 'ZOTAC / MSI Gaming GeForce RTX 4060 Twin Edge 8GB GDDR6', price: 27490, warranty: '3' },
    { name: 'Gigabyte GeForce RTX 4060 Ti Eagle OC 8GB GDDR6', price: 36990, warranty: '3' },
    { name: 'MSI / ASUS GeForce RTX 4060 Ti 16GB GDDR6', price: 44500, warranty: '3' },
    { name: 'Gigabyte / MSI GeForce RTX 4070 Windforce 12GB GDDR6X', price: 51990, warranty: '3' },
    { name: 'ASUS Dual / ZOTAC GeForce RTX 4070 SUPER 12GB GDDR6X', price: 58990, warranty: '3' },
    { name: 'MSI Gaming X / ASUS TUF RTX 4070 Ti SUPER 16GB GDDR6X', price: 76500, warranty: '3' },
    { name: 'ZOTAC Trinity / MSI RTX 4080 SUPER 16GB GDDR6X', price: 96000, warranty: '3' },
    { name: 'ASUS ROG Strix / MSI Gaming GeForce RTX 4090 24GB GDDR6X', price: 175000, warranty: '3' }
  ],
  'RTX 30-Series / GTX': [
    { name: 'MSI GeForce RTX 3050 Ventus 2X 6GB GDDR6', price: 16500, warranty: '3' },
    { name: 'ZOTAC / MSI GeForce RTX 3060 Twin Edge 12GB GDDR6', price: 24500, warranty: '3' },
    { name: 'Gigabyte / ASUS GeForce GTX 1650 4GB GDDR6', price: 11800, warranty: '3' },
    { name: 'Gigabyte / ASUS GeForce GT 1030 2GB GDDR5 Low Profile', price: 5600, warranty: '3' },
    { name: 'GeForce GT 730 4GB DDR3 Dedicated Graphics Card', price: 4200, warranty: '3' },
    { name: 'GeForce GT 710 2GB DDR3 Display Card', price: 3200, warranty: '3' }
  ],
  'AMD Radeon RX': [
    { name: 'AMD Radeon RX 580 8GB 256-bit Gaming Graphics Card', price: 8500, warranty: '2' },
    { name: 'Sapphire Pulse AMD Radeon RX 6600 8GB GDDR6', price: 19800, warranty: '3' },
    { name: 'Sapphire PULSE AMD Radeon RX 7600 8GB GDDR6', price: 24990, warranty: '3' },
    { name: 'Sapphire PULSE AMD Radeon RX 7700 XT 12GB GDDR6', price: 41990, warranty: '3' },
    { name: 'Sapphire Pure / Nitro+ AMD Radeon RX 7800 XT 16GB', price: 49500, warranty: '3' }
  ],
  'Integrated Graphics': [
    { name: 'Integrated Intel UHD / AMD Radeon Graphics', price: 0, warranty: 'N/A' }
  ]
};

// -------------------------------------------------------------------------
// 6. POWER SUPPLY (SMPS) STRUCTURE
// -------------------------------------------------------------------------
export const SMPS_CATALOG: PresetItem[] = [
  { name: '450W Standard Heavy Duty ATX Power Supply', price: 1100, warranty: '1' },
  { name: 'Ant Esports VS450L 450W Power Supply', price: 1800, warranty: '2' },
  { name: 'Ant Esports 550W 80 Plus Bronze Gaming Power Supply', price: 2600, warranty: '2' },
  { name: 'DeepCool PK550D 550W 80 Plus Bronze Power Supply', price: 3400, warranty: '5' },
  { name: 'DeepCool PK650D 650W 80 Plus Bronze Power Supply', price: 4200, warranty: '5' },
  { name: 'Corsair CV650 650 Watt 80 Plus Bronze Power Supply', price: 4800, warranty: '3' },
  { name: 'DeepCool PM750D 750W 80 Plus Gold Power Supply', price: 6200, warranty: '5' },
  { name: 'MSI MAG A750GL PCIE5 750W 80+ Gold Fully Modular PSU', price: 7800, warranty: '5' },
  { name: 'DeepCool PN850M 850W 80 Plus Gold ATX 3.1 Fully Modular', price: 9200, warranty: '10' },
  { name: 'Corsair RM850e 850W 80 Plus Gold Fully Modular ATX 3.0', price: 10800, warranty: '7' },
  { name: 'DeepCool PN1000M 1000W 80 Plus Gold Fully Modular PSU', price: 12800, warranty: '10' }
];

// -------------------------------------------------------------------------
// 7. CABINET / CASE STRUCTURE
// -------------------------------------------------------------------------
export const CABINET_CATALOG: PresetItem[] = [
  { name: 'Standard Sleek Black ATX Office Cabinet', price: 1100, warranty: '1' },
  { name: 'Ant Esports RGB Mid Tower Gaming Cabinet with Front Strip', price: 2300, warranty: '1' },
  { name: 'Ant Esports ICE-130AG Gaming Case (3 RGB Auto Fans)', price: 2600, warranty: '1' },
  { name: 'Ant Esports ICE-211TG Gaming Case (4 ARGB Fans + Tempered Glass)', price: 3100, warranty: '1' },
  { name: 'Tech Beast Panoramic Dual Glass Fish-Tank Aquarium Gaming Case', price: 3400, warranty: '1' },
  { name: 'DeepCool CC560 V2 Mid-Tower Airflow Case with 4 ARGB Fans', price: 4200, warranty: '1' },
  { name: 'MSI MAG FORGE 120R Airflow Gaming Case with 4 ARGB Fans', price: 4600, warranty: '1' },
  { name: 'Lian Li O11 Dynamic EVO Dual Chamber Premium Showcase Case', price: 12500, warranty: '1' }
];

// -------------------------------------------------------------------------
// 8. CPU COOLER STRUCTURE
// -------------------------------------------------------------------------
export const COOLER_CATALOG: PresetItem[] = [
  { name: 'Stock Included Air Cooler', price: 0, warranty: '1' },
  { name: 'DeepCool AG300 Compact 3-Heatpipe CPU Cooler', price: 1100, warranty: '1' },
  { name: 'DeepCool AG400 ARGB Single Tower CPU Cooler (4 Heatpipes)', price: 1890, warranty: '1' },
  { name: 'DeepCool AK400 Digital CPU Air Cooler with Temp Display', price: 3400, warranty: '3' },
  { name: 'DeepCool AK620 Digital High-Performance Dual Tower Air Cooler', price: 5990, warranty: '3' },
  { name: 'DeepCool LE520 240mm ARGB All-In-One Liquid CPU Cooler', price: 5490, warranty: '3' },
  { name: 'DeepCool LT720 360mm Premium ARGB Liquid CPU Cooler (Infinity Mirror)', price: 9990, warranty: '5' }
];

// -------------------------------------------------------------------------
// 9. MONITOR STRUCTURE
// -------------------------------------------------------------------------
export const MONITOR_CATALOG: PresetItem[] = [
  { name: '20-inch HD LED Monitor with HDMI & VGA (Flicker-Free)', price: 4200, warranty: '1' },
  { name: '22-inch Full HD 1080p 100Hz IPS Slim Bezel Monitor', price: 5800, warranty: '3' },
  { name: '24-inch Full HD 1080p 100Hz IPS Monitor (HDMI/Audio)', price: 6800, warranty: '3' },
  { name: 'Acer Nitro / MSI 24-inch 180Hz 0.5ms FHD Fast-IPS Gaming Monitor', price: 9800, warranty: '3' },
  { name: '27-inch Full HD 1080p 100Hz IPS Display Monitor', price: 9200, warranty: '3' },
  { name: '27-inch 2K QHD (2560x1440) 180Hz Fast-IPS HDR10 Gaming Monitor', price: 18500, warranty: '3' }
];

// -------------------------------------------------------------------------
// 10. PERIPHERALS STRUCTURE
// -------------------------------------------------------------------------
export const PERIPHERAL_CATALOG: PresetItem[] = [
  { name: 'Standard USB Wired Keyboard & Optical Mouse Combo', price: 650, warranty: '1' },
  { name: 'Ant Esports KM540 RGB Gaming Keyboard & Mouse Combo', price: 1200, warranty: '1' },
  { name: 'Ant Esports MK1200 RGB Mechanical Gaming Keyboard', price: 2100, warranty: '1' },
  { name: 'Logitech MK215 / Dell Wireless Keyboard and Mouse Combo', price: 1400, warranty: '3' },
  { name: 'Dual-Band AC1300 / WiFi 6 USB Adapter with High Gain Antenna', price: 650, warranty: '1' },
  { name: 'Goldmedal / Anchor 4-Socket Surge Protector Extension Board', price: 450, warranty: '1' }
];
