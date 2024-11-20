import { FrostDates, HardinessZone, RainfallData, SoilData, CropData, MonthlyAverages } from '../types/types';
import MockGardenDataService from '../components/mock/mock-garden-data';


interface SoilType {
  map_unit_symbol: string;
  map_unit_name: string;
  map_unit_key: string;
}

class GardenDataService {
  private static readonly API_BASE = 'http://garden-api.climata.ca/api/v1';

  private static async fetchWithFallback<T>(
    apiCall: () => Promise<T>,
    mockCall: () => Promise<T>,
    errorContext: string
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`${errorContext} - Falling back to mock data:`, error);
      return mockCall();
    }
  }

  static async getFrostDates(lat: number, lng: number): Promise<FrostDates> {
    return this.fetchWithFallback(
      async () => {
        const url = new URL(`${this.API_BASE}/weather/frost-dates`);
        url.searchParams.append('lat', lat.toString());
        url.searchParams.append('lon', lng.toString());
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        
        return {
          lastFrost: new Date(data.average_last_frost),
          firstFrost: new Date(data.average_first_frost),
          lastFrostRange: {
            earliest: new Date(data.earliest_last_frost),
            latest: new Date(data.latest_last_frost),
            typical: new Date(data.average_last_frost)
          },
          firstFrostRange: {
            earliest: new Date(data.earliest_first_frost),
            latest: new Date(data.latest_first_frost),
            typical: new Date(data.average_first_frost)
          },
          source: response.headers.get('source') || 'NOAA'
        };
      },
      () => MockGardenDataService.getFrostDates(lat, lng),
      'Error fetching frost dates'
    );
  }

  static async getHardinessZone(lat: number, lng: number): Promise<HardinessZone> {
    return this.fetchWithFallback(
      async () => {
        const url = new URL(`${this.API_BASE}/weather/hardiness-zone`);
        url.searchParams.append('lat', lat.toString());
        url.searchParams.append('lon', lng.toString());
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        
        return {
          zone: data.hardiness_zone,
          source: response.headers.get('source') || 'USDA'
        };
      },
      () => MockGardenDataService.getHardinessZone(lat, lng),
      'Error fetching hardiness zone'
    );
  }

  static async getMonthlyAverages(lat: number, lng: number): Promise<MonthlyAverages> {
    return this.fetchWithFallback(
      async () => {
        const url = new URL(`${this.API_BASE}/weather/monthly-averages`);
        url.searchParams.append('lat', lat.toString());
        url.searchParams.append('lon', lng.toString());
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        
        return data;
      },
      () => MockGardenDataService.getMonthlyAverages(lat, lng),
      'Error fetching monthly averages'
    );
  }

  static async getSoilData(lat: number, lng: number): Promise<SoilData> {
    return this.fetchWithFallback(
      async () => {
        const url = new URL(`${this.API_BASE}/soil/type`);
        url.searchParams.append('lat', lat.toString());
        url.searchParams.append('lon', lng.toString());
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data: SoilType = await response.json();
        
        return {
          classification: 'soil',
          description: data.map_unit_name,
          source: response.headers.get('source') || 'USDA Web Soil Survey'
        };
      },
      () => MockGardenDataService.getSoilData(lat, lng),
      'Error fetching soil data'
    );
  }

  static async getRainfallData(lat: number, lng: number): Promise<RainfallData> {
    return this.fetchWithFallback(
      async () => {
        const monthlyData = await this.getMonthlyAverages(lat, lng);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const monthMap: Record<string, string> = {
          'Jan': 'january',
          'Feb': 'february',
          'Mar': 'march',
          'Apr': 'april',
          'May': 'may',
          'Jun': 'june',
          'Jul': 'july',
          'Aug': 'august',
          'Sep': 'september',
          'Oct': 'october',
          'Nov': 'november',
          'Dec': 'december'
        };

        const data = months.map(month => ({
          month,
          amount: monthlyData.monthly_averages[monthMap[month]]?.average_precipitation_mm || 0
        }));

        return {
          data,
          source: 'Weather Service'
        };
      },
      () => MockGardenDataService.getRainfallData(lat, lng),
      'Error fetching rainfall data'
    );
  }

  static async getRecommendedCrops(lat: number, lng: number): Promise<CropData> {
    return this.fetchWithFallback(
      async () => {
        const url = new URL(`${this.API_BASE}/crops/recommended`);
        url.searchParams.append('lat', lat.toString());
        url.searchParams.append('lon', lng.toString());
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        
        return {
          crops: data.recommended_crops,
          source: response.headers.get('source') || 'Extension Service'
        };
      },
      () => MockGardenDataService.getRecommendedCrops(lat, lng),
      'Error fetching recommended crops'
    );
  }
}

export default GardenDataService; 