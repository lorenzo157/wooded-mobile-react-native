export interface CreateDefectTreeDto {
  defectName: string;
  defectValue: number;
  textDefectValue: string;
  branches?: number;
}

export interface ReadDefectTreeDto {
  defectName: string;
  defectZone: string;
  defectValue: number;
  textDefectValue: string;
  branches?: number;
}

export interface CreateTreeDto {
  photoFile?: string | null;
  currentPhoto?: string | null;
  cityBlock?: number | null;
  perimeter?: number | null;
  height?: number | null;
  incline?: number | null;
  treesInTheBlock?: number | null;
  useUnderTheTree?: string | null;
  frequencyUse?: number | null;
  potentialDamage?: number | null;
  isMovable?: boolean | null;
  isRestrictable?: boolean | null;
  isMissing?: boolean | null;
  isDead?: boolean | null;
  exposedRoots?: boolean | null;
  dch?: number | null;
  windExposure?: string | null;
  vigor?: string | null;
  canopyDensity?: string | null;
  growthSpace?: string | null;
  treeValue?: string | null;
  streetMateriality?: string;
  risk?: number | null;
  address: string;
  conflictsNames?: string[];
  createDefectsDtos: CreateDefectTreeDto[];
  diseasesNames?: string[];
  interventionsNames?: string[];
  pestsNames?: string[];
  latitude: number;
  longitude: number;
  treeTypeName?: string;
  gender?: string;
  projectId: number;
  treeInfoCollectionStartTime?: Date;
}

export interface ReadTreeDto {
  idTree: number;
  datetime: Date;
  pathPhoto: string;
  cityBlock: number;
  perimeter: number;
  height: number;
  incline: number;
  treesInTheBlock: number;
  useUnderTheTree: string;
  frequencyUse: number;
  potentialDamage: number;
  isMovable: boolean;
  isRestrictable: boolean;
  isMissing: boolean;
  isDead: boolean;
  exposedRoots: boolean;
  dch: number;
  windExposure: string;
  vigor: string;
  canopyDensity: string;
  growthSpace: string;
  treeValue: string;
  streetMateriality: string;
  risk: number;
  address: string;
  conflictsNames: string[];
  readDefectDto: ReadDefectTreeDto[];
  diseasesNames: string[];
  interventionsNames: string[];
  pestsNames: string[];
  latitude: number;
  longitude: number;
  neighborhoodName: string;
  treeTypeName?: string;
  gender?: string;
  species?: string;
  scientificName?: string;
  treeInfoCollectionTime?: string;
  createdAt?: Date;
}

export interface SimplyReadTreeDto {
  idTree: number;
  address: string;
  datetime: Date;
  treeValue: string | null;
  risk: number | null;
  neighborhoodName: string | null;
}
