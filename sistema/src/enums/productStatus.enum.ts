export enum ProductStatus {
  AVAILABLE = 'Disponible',
  SOLD = 'Vendido',
  RESERVED = 'Reservado',
  FAULTY = 'Falla',
  REPAIR = 'Reparar',
}

export const statusColors = {
  [ProductStatus.AVAILABLE]: 'bg-green-100 text-green-800 border-green-300',
  [ProductStatus.SOLD]: 'bg-gray-100 text-gray-800 border-gray-300',
  [ProductStatus.RESERVED]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [ProductStatus.FAULTY]: 'bg-red-100 text-red-800 border-red-300',
  [ProductStatus.REPAIR]: 'bg-orange-100 text-orange-800 border-orange-300',
};
