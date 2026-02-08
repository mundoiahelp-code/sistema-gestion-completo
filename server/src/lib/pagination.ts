/**
 * Helper para validar y normalizar parámetros de paginación
 * Previene queries masivos que puedan colapsar el servidor
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Validar y normalizar parámetros de paginación
 * @param page - Número de página (default: 1)
 * @param limit - Cantidad de registros por página (default: 20)
 * @param maxLimit - Límite máximo permitido (default: 100)
 */
export const validatePagination = (
  page: any,
  limit: any,
  maxLimit: number = 100
): PaginationParams => {
  // Parsear y validar página
  const pageNum = Math.max(1, parseInt(page) || 1);
  
  // Parsear y validar límite (entre 1 y maxLimit)
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  
  // Calcular skip
  const skip = (pageNum - 1) * limitNum;
  
  return { 
    page: pageNum, 
    limit: limitNum, 
    skip 
  };
};

/**
 * Crear respuesta de paginación consistente
 */
export const createPaginationResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResponse<T> => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};
