export interface Category {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  placeCount: number;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  stats: Array<{
    _id: boolean;
    count: number;
    totalPlaces: number;
  }>;
}

export interface CategoryResponse {
  success: boolean;
  data: Category | Category[] | CategoryStats;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
