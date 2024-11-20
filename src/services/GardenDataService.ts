import { FrostDates, HardinessZone, RainfallData, SoilData, CropData } from '../types/types';
import MockGardenDataService from '../components/mock/mock-garden-data';

interface MonthlyAverages {
  monthly_averages: {
    [month: string]: {
      average_temp_c: number;
      average_precipitation_mm: number;
      average_sunshine_mins: number;
    }
  }
}

interface SoilType {
  map_unit_symbol: string;
  map_unit_name: string;
  map_unit_key: string;
}

class GardenDataService {
  private static readonly API_BASE = 'http://garden-api.climata.ca/api/v1';

  private static async fetchWithError(url: string): Promise<Response> {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response;
  }

  static async getFrostDates(lat: number, lng: number): Promise<FrostDates> {
    const url = new URL(`${this.API_BASE}/weather/frost-dates`);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lon', lng.toString());
    
    const response = await this.fetchWithError(url.toString());
    const data = await response.json();
    
    // Transform API response to match existing interface
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
  }

  static async getHardinessZone(lat: number, lng: number): Promise<HardinessZone> {
    const url = new URL(`${this.API_BASE}/weather/hardiness-zone`);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lon', lng.toString());
    
    const response = await this.fetchWithError(url.toString());
    const data = await response.json();
    
    return {
      zone: data.hardiness_zone,
      source: response.headers.get('source') || 'USDA'
    };
  }

  static async getMonthlyAverages(lat: number, lng: number): Promise<MonthlyAverages> {
    const url = new URL(`${this.API_BASE}/weather/monthly-averages`);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lon', lng.toString());
    
    const response = await this.fetchWithError(url.toString());
    const data = await response.json();
    
    return data;
  }

  static async getSoilData(lat: number, lng: number): Promise<SoilData> {
    const url = new URL(`${this.API_BASE}/soil/type`);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lon', lng.toString());
    
    const response = await this.fetchWithError(url.toString());
    const data: SoilType = await response.json();
    
    // Transform API response to match existing interface
    return {
      classification: 'soil',
      description: data.map_unit_name,
      source: response.headers.get('source') || 'USDA Web Soil Survey'
    };
  }

  static async getRainfallData(lat: number, lng: number): Promise<RainfallData> {
    const monthlyData = await this.getMonthlyAverages(lat, lng);
    
    // Define months in the expected format
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Map months to their lowercase versions for API data lookup
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
  }

  static async getRecommendedCrops(lat: number, lng: number): Promise<CropData> {
    // Temporarily use mock implementation until API endpoint is available
    return MockGardenDataService.getRecommendedCrops(lat, lng);
  }
}

export default GardenDataService; 