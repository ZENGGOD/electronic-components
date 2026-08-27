export type ProductCategory =
  'MCU' | 'Analog IC' | 'Power Management' | 'Communication IC' | 'DSP / DSC'

export interface Product {
  id: string
  partNumber: string
  manufacturer: string
  category: ProductCategory
  package: string

  title: string
  description: string

  features: string[]

  applications: string[]

  datasheet?: string

  status: 'In Stock' | 'Available' | 'Request Quote'
}
