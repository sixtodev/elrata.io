/**
 * Search categories with dynamic fields.
 * Fields can be conditional based on subtype selection.
 */

export interface CategoryField {
  id: string
  label: string
  type: 'text' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]
  /** Only show this field when the 'type' field matches one of these values */
  showWhen?: string[]
}

export interface SearchCategory {
  id: string
  label: string
  icon: string
  fields: CategoryField[]
  buildQuery: (product: string, brand: string, fields: Record<string, string>) => string
}

export const SEARCH_CATEGORIES: SearchCategory[] = [
  {
    id: 'general',
    label: 'General',
    icon: '',
    fields: [],
    buildQuery: (product, brand) =>
      `${product}${brand ? ` ${brand}` : ''}`,
  },
  {
    id: 'computacion',
    label: 'Computación',
    icon: '',
    fields: [
      {
        id: 'type',
        label: 'Tipo',
        type: 'select',
        options: [
          { value: '', label: 'Cualquiera' },
          { value: 'laptop', label: 'Laptop / Notebook' },
          { value: 'desktop', label: 'PC de escritorio' },
          { value: 'tablet', label: 'Tablet' },
          { value: 'monitor', label: 'Monitor' },
          { value: 'componente', label: 'Componente / Parte' },
        ],
      },
      // RAM — solo para laptop, desktop, componente
      { id: 'ram', label: 'RAM', type: 'select', showWhen: ['', 'laptop', 'desktop', 'componente'], options: [
        { value: '', label: 'Cualquiera' },
        { value: '8GB', label: '8 GB' },
        { value: '16GB', label: '16 GB' },
        { value: '32GB', label: '32 GB' },
        { value: '64GB', label: '64 GB' },
      ]},
      // Almacenamiento — laptop, desktop, tablet
      { id: 'storage', label: 'Almacenamiento', type: 'select', showWhen: ['', 'laptop', 'desktop', 'tablet', 'componente'], options: [
        { value: '', label: 'Cualquiera' },
        { value: '64GB', label: '64 GB' },
        { value: '128GB', label: '128 GB' },
        { value: '256GB', label: '256 GB' },
        { value: '256GB SSD', label: '256 GB SSD' },
        { value: '512GB SSD', label: '512 GB SSD' },
        { value: '1TB SSD', label: '1 TB SSD' },
        { value: '2TB SSD', label: '2 TB SSD' },
      ]},
      // Procesador — solo laptop, desktop
      { id: 'processor', label: 'Procesador', type: 'text', showWhen: ['', 'laptop', 'desktop'], placeholder: 'ej: Intel i7, AMD Ryzen 5, Apple M3...' },
      // Tamaño pantalla — laptop, tablet, monitor
      { id: 'screen', label: 'Pantalla', type: 'select', showWhen: ['laptop', 'tablet', 'monitor'], options: [
        { value: '', label: 'Cualquiera' },
        { value: '10"', label: '10 pulgadas' },
        { value: '11"', label: '11 pulgadas' },
        { value: '13"', label: '13 pulgadas' },
        { value: '14"', label: '14 pulgadas' },
        { value: '15.6"', label: '15.6 pulgadas' },
        { value: '17"', label: '17 pulgadas' },
        { value: '24"', label: '24 pulgadas' },
        { value: '27"', label: '27 pulgadas' },
        { value: '32"', label: '32 pulgadas' },
        { value: '34"', label: '34 pulgadas' },
      ]},
      // Resolución — solo monitor
      { id: 'resolution', label: 'Resolución', type: 'select', showWhen: ['monitor'], options: [
        { value: '', label: 'Cualquiera' },
        { value: 'Full HD 1080p', label: 'Full HD (1080p)' },
        { value: '2K QHD 1440p', label: '2K QHD (1440p)' },
        { value: '4K UHD', label: '4K UHD' },
        { value: 'Ultrawide', label: 'Ultrawide' },
      ]},
      // Refresh rate — monitor
      { id: 'refresh', label: 'Tasa refresco', type: 'select', showWhen: ['monitor'], options: [
        { value: '', label: 'Cualquiera' },
        { value: '60Hz', label: '60 Hz' },
        { value: '75Hz', label: '75 Hz' },
        { value: '144Hz', label: '144 Hz' },
        { value: '165Hz', label: '165 Hz' },
        { value: '240Hz', label: '240 Hz' },
      ]},
    ],
    buildQuery: (product, brand, fields) => {
      const parts = [product]
      if (brand) parts.push(brand)
      // type: include only if it adds info (skip "laptop" when product already says "notebook")
      if (fields.type && !product.toLowerCase().includes(fields.type)) parts.push(fields.type)
      // RAM and storage: compact values like "32GB", "1TB SSD" appear in real product titles — include them
      if (fields.ram) parts.push(fields.ram)
      if (fields.storage) parts.push(fields.storage)
      // Processor: short identifiers like "Ryzen 9", "i7", "M3" work well in text search
      if (fields.processor) parts.push(fields.processor)
      // Screen: skip — "17"" with the quote char breaks URL encoding and rarely appears as text in ML
      return parts.join(' ')
    },
  },
  {
    id: 'celulares',
    label: 'Celulares',
    icon: '',
    fields: [
      { id: 'storage', label: 'Almacenamiento', type: 'select', options: [
        { value: '', label: 'Cualquiera' },
        { value: '64GB', label: '64 GB' },
        { value: '128GB', label: '128 GB' },
        { value: '256GB', label: '256 GB' },
        { value: '512GB', label: '512 GB' },
        { value: '1TB', label: '1 TB' },
      ]},
      { id: 'ram', label: 'RAM', type: 'select', options: [
        { value: '', label: 'Cualquiera' },
        { value: '4GB', label: '4 GB' },
        { value: '6GB', label: '6 GB' },
        { value: '8GB', label: '8 GB' },
        { value: '12GB', label: '12 GB' },
        { value: '16GB', label: '16 GB' },
      ]},
      { id: 'condition', label: 'Condición', type: 'select', options: [
        { value: '', label: 'Cualquiera' },
        { value: 'nuevo', label: 'Nuevo' },
        { value: 'usado', label: 'Usado' },
        { value: 'reacondicionado', label: 'Reacondicionado' },
      ]},
    ],
    buildQuery: (product, brand, fields) => {
      const parts = [product]
      if (brand) parts.push(brand)
      // storage like "256GB", "512GB" appear in phone titles — include them
      if (fields.storage) parts.push(fields.storage)
      if (fields.condition) parts.push(fields.condition)
      return parts.join(' ')
    },
  },
  {
    id: 'vehiculos',
    label: 'Vehículos',
    icon: '',
    fields: [
      {
        id: 'type',
        label: 'Tipo',
        type: 'select',
        options: [
          { value: '', label: 'Cualquiera' },
          { value: 'moto', label: 'Motocicleta' },
          { value: 'auto', label: 'Automóvil' },
          { value: 'bicicleta', label: 'Bicicleta' },
          { value: 'scooter', label: 'Scooter' },
        ],
      },
      { id: 'year', label: 'Año', type: 'text', placeholder: 'ej: 2024, 2023...' },
      { id: 'engine', label: 'Motor / Cilindrada', type: 'text', showWhen: ['', 'moto', 'auto', 'scooter'], placeholder: 'ej: 400cc, 650cc, 2.0L...' },
      { id: 'condition', label: 'Condición', type: 'select', options: [
        { value: '', label: 'Cualquiera' },
        { value: 'nuevo 0km', label: 'Nuevo / 0km' },
        { value: 'usado', label: 'Usado' },
      ]},
    ],
    buildQuery: (product, brand, fields) => {
      const parts = []
      if (fields.type) parts.push(fields.type)
      if (brand) parts.push(brand)
      parts.push(product)
      if (fields.engine) parts.push(fields.engine)
      if (fields.year) parts.push(fields.year)
      if (fields.condition) parts.push(fields.condition)
      return parts.join(' ')
    },
  },
  {
    id: 'electrodomesticos',
    label: 'Electrodomésticos',
    icon: '',
    fields: [
      {
        id: 'type',
        label: 'Tipo',
        type: 'select',
        options: [
          { value: '', label: 'Cualquiera' },
          { value: 'refrigerador', label: 'Refrigerador' },
          { value: 'lavadora', label: 'Lavadora' },
          { value: 'microondas', label: 'Microondas' },
          { value: 'aspiradora', label: 'Aspiradora' },
          { value: 'aire acondicionado', label: 'Aire Acondicionado' },
          { value: 'cafetera', label: 'Cafetera' },
          { value: 'horno', label: 'Horno' },
          { value: 'lavavajillas', label: 'Lavavajillas' },
          { value: 'secadora', label: 'Secadora' },
        ],
      },
      { id: 'capacity', label: 'Capacidad', type: 'text', placeholder: 'ej: 400 litros, 10kg, 1200W...' },
    ],
    buildQuery: (product, brand, fields) => {
      const parts = [product]
      if (brand) parts.push(brand)
      if (fields.type) parts.push(fields.type)
      if (fields.capacity) parts.push(fields.capacity)
      return parts.join(' ')
    },
  },
  {
    id: 'gaming',
    label: 'Gaming',
    icon: '',
    fields: [
      {
        id: 'platform',
        label: 'Plataforma',
        type: 'select',
        options: [
          { value: '', label: 'Cualquiera' },
          { value: 'PC', label: 'PC' },
          { value: 'PS5', label: 'PlayStation 5' },
          { value: 'Xbox Series', label: 'Xbox Series X/S' },
          { value: 'Nintendo Switch', label: 'Nintendo Switch' },
        ],
      },
      {
        id: 'type',
        label: 'Tipo',
        type: 'select',
        options: [
          { value: '', label: 'Cualquiera' },
          { value: 'consola', label: 'Consola' },
          { value: 'juego', label: 'Juego / Videojuego' },
          { value: 'accesorio', label: 'Accesorio / Control' },
          { value: 'silla gamer', label: 'Silla Gamer' },
          { value: 'headset', label: 'Headset / Auriculares' },
        ],
      },
    ],
    buildQuery: (product, brand, fields) => {
      const parts = [product]
      if (brand) parts.push(brand)
      if (fields.platform) parts.push(fields.platform)
      if (fields.type) parts.push(fields.type)
      return parts.join(' ')
    },
  },
  {
    id: 'ropa',
    label: 'Ropa y Calzado',
    icon: '',
    fields: [
      { id: 'size', label: 'Talla', type: 'text', placeholder: 'ej: M, L, 42, 9.5...' },
      { id: 'gender', label: 'Género', type: 'select', options: [
        { value: '', label: 'Cualquiera' },
        { value: 'hombre', label: 'Hombre' },
        { value: 'mujer', label: 'Mujer' },
        { value: 'unisex', label: 'Unisex' },
        { value: 'niño', label: 'Niño/a' },
      ]},
    ],
    buildQuery: (product, brand, fields) => {
      const parts = [product]
      if (brand) parts.push(brand)
      if (fields.gender) parts.push(fields.gender)
      if (fields.size) parts.push(`talla ${fields.size}`)
      return parts.join(' ')
    },
  },
]

export function getCategoryById(id: string): SearchCategory {
  return SEARCH_CATEGORIES.find((c) => c.id === id) || SEARCH_CATEGORIES[0]
}

/**
 * Get visible fields based on current 'type' selection.
 */
export function getVisibleFields(
  category: SearchCategory,
  currentFields: Record<string, string>
): CategoryField[] {
  const typeValue = currentFields['type'] || ''

  return category.fields.filter((field) => {
    // Always show fields without showWhen (including the 'type' selector itself)
    if (!field.showWhen) return true
    // Show if current type matches
    return field.showWhen.includes(typeValue)
  })
}
