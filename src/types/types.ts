export interface FrostDates {
  firstFrost: Date;
  lastFrost: Date;
  firstFrostRange: { earliest: Date; latest: Date, typical: Date };
  lastFrostRange: { earliest: Date; latest: Date, typical: Date };
  source: string;
}

export interface HardinessZone {
  zone: string;
  source: string;
}

export interface RainfallData {
  data: Array<{
    month: string;
    amount: number;
  }>;
  source: string;
}

export interface SoilData {
  classification: string;
  description: string;
  source: string;
}

export interface CropData {
  crops: string[];
  source: string;
}