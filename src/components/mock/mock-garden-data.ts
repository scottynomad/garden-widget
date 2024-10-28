import { FrostDates, HardinessZone, RainfallData, SoilData, CropData } from './types';

// Helper function to simulate API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockGardenDataService {
  private static readonly HARDINESS_ZONES: Record<string, string> = {
    '25,-80': '10b',  // Miami
    '40,-74': '7a',   // New York
    '34,-118': '10a', // Los Angeles
    '47,-122': '8b',  // Seattle
    '41,-87': '6a',   // Chicago
  };

  private static readonly SOIL_TYPES: Record<string, SoilData> = {
    '25,-80': {
      classification: 'Sandy Loam',
      description: 'Well-draining soil with high organic content',
      source: 'https://websoilsurvey.nrcs.usda.gov/'
    },
    '40,-74': {
      classification: 'Clay Loam',
      description: 'Rich soil with good water retention',
      source: 'https://websoilsurvey.nrcs.usda.gov/'
    },
    // Add more regions as needed
  };
  private static getClosestCoordinate(lat: number, lng: number): string {
    // Calculate closest coordinate using Euclidean distance
    const coordinates = Object.keys(this.HARDINESS_ZONES);

    return coordinates.reduce((closest, coord) => {
      const [coordLat, coordLng] = coord.split(',').map(Number);
      const currentDistance = Math.sqrt(
        Math.pow(lat - coordLat, 2) + Math.pow(lng - coordLng, 2)
      );

      if (!closest) return coord;

      const [closestLat, closestLng] = closest.split(',').map(Number);
      const closestDistance = Math.sqrt(
        Math.pow(lat - closestLat, 2) + Math.pow(lng - closestLng, 2)
      );

      return currentDistance < closestDistance ? coord : closest;
    }, '');
  }

  static getFrostDates(lat: number, lng: number): Promise<FrostDates> {
    const currentYear = new Date().getFullYear();
    const zone = this.HARDINESS_ZONES[this.getClosestCoordinate(lat, lng)] || '7a';
    
    // Define frost dates based on zone and latitude
    const frostDates: Record<string, {
      lastFrost: [number, number],  // [month, day]
      firstFrost: [number, number],
      lastFrostRange: [number, number],  // range in days
      firstFrostRange: [number, number]
    }> = {
      '10b': {  // Miami
        lastFrost: [1, 15],  // Rarely gets frost
        firstFrost: [12, 15],
        lastFrostRange: [7, 7],
        firstFrostRange: [7, 7]
      },
      '10a': {  // Los Angeles
        lastFrost: [2, 1],
        firstFrost: [12, 1],
        lastFrostRange: [14, 14],
        firstFrostRange: [14, 14]
      },
      '8b': {   // Seattle
        lastFrost: [3, 15],
        firstFrost: [11, 15],
        lastFrostRange: [21, 21],
        firstFrostRange: [21, 21]
      },
      '7a': {   // New York
        lastFrost: [4, 15],
        firstFrost: [10, 15],
        lastFrostRange: [30, 30],
        firstFrostRange: [30, 30]
      },
      '6a': {   // Chicago
        lastFrost: [5, 1],
        firstFrost: [10, 1],
        lastFrostRange: [30, 30],
        firstFrostRange: [30, 30]
      }
    };
  
    const dates = frostDates[zone] || frostDates['7a']; // Default to 7a if zone not found
    
    // Helper to add/subtract days from a date
    const addDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };
  
    // Create base dates
    const lastFrost = new Date(currentYear, dates.lastFrost[0] - 1, dates.lastFrost[1]);
    const firstFrost = new Date(currentYear, dates.firstFrost[0] - 1, dates.firstFrost[1]);
  
    return Promise.resolve({
      lastFrost,
      firstFrost,
      lastFrostRange: {
        earliest: addDays(lastFrost, -dates.lastFrostRange[0]),
        latest: addDays(lastFrost, dates.lastFrostRange[1])
      },
      firstFrostRange: {
        earliest: addDays(firstFrost, -dates.firstFrostRange[0]),
        latest: addDays(firstFrost, dates.firstFrostRange[1])
      },
      source: 'https://www.noaa.gov/frost-dates'
    });
  }

  static async getHardinessZone(lat: number, lng: number): Promise<HardinessZone> {
    await delay(600);
    return {
      zone: this.HARDINESS_ZONES[this.getClosestCoordinate(lat, lng)] || '7a',
      source: 'https://planthardiness.ars.usda.gov/'
    };
  }

  static async getRainfallData(lat: number, lng: number): Promise<RainfallData> {
    await delay(1000);
    
    // Define rainfall patterns for different climate types
    const rainfallPatterns: Record<string, number[]> = {
      '10b': [ // Miami - Tropical with wet summer
        2.2, 2.1, 2.6, 3.4, 5.5, 8.5, 6.5, 8.2, 8.4, 6.3, 3.4, 2.2
      ],
      '10a': [ // Los Angeles - Mediterranean
        3.1, 3.8, 2.5, 0.9, 0.3, 0.1, 0.0, 0.1, 0.2, 0.4, 1.2, 2.3
      ],
      '8b': [  // Seattle - Maritime
        5.6, 3.5, 3.7, 2.7, 2.0, 1.5, 0.7, 0.9, 1.6, 3.5, 6.1, 5.6
      ],
      '7a': [  // New York - Humid Continental
        3.6, 3.0, 4.0, 4.1, 4.0, 3.8, 4.6, 4.1, 3.7, 3.5, 3.4, 3.5
      ],
      '6a': [  // Chicago - Continental
        1.8, 1.8, 2.5, 3.4, 3.7, 3.8, 3.7, 3.5, 3.3, 2.7, 2.8, 2.2
      ]
    };
  
    const zone = this.HARDINESS_ZONES[this.getClosestCoordinate(lat, lng)] || '7a';
    const basePattern = rainfallPatterns[zone] || rainfallPatterns['7a'];
    
    // Add some random variation (±15%) to make it more realistic
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = months.map((month, i) => ({
      month,
      amount: +(basePattern[i] * (0.85 + Math.random() * 0.3)).toFixed(1)
    }));
  
    return {
      data,
      source: 'https://www.weather.gov/'
    };
  }

  static async getSoilData(lat: number, lng: number): Promise<SoilData> {
    await delay(700);
    return (
      this.SOIL_TYPES[this.getClosestCoordinate(lat, lng)] || {
        classification: 'Loam',
        description: 'Medium-textured soil with balanced properties',
        source: 'https://websoilsurvey.nrcs.usda.gov/'
      }
    );
  }
  static async getRecommendedCrops(lat: number, lng: number): Promise<CropData> {
    await delay(900);
    const zone = this.HARDINESS_ZONES[this.getClosestCoordinate(lat, lng)] || '7a';
    const zoneNumber = parseInt(zone);
    // Adjust crop recommendations based on hardiness zone
    const crops = [
      'Tomatoes',
      'Peppers',
      'Lettuce',
      'Beans',
      ...(zoneNumber >= 8 ? ['Citrus', 'Avocado'] : []),
      ...(zoneNumber <= 7 ? ['Potatoes', 'Cabbage'] : []),
      'Herbs',
      'Cucumbers',
      'Squash'
    ];
    return {
      crops,
      source: 'https://extension.org/'
    };
  }
}
export default MockGardenDataService;