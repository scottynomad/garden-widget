import { FrostDates, HardinessZone, RainfallData, SoilData, CropData, MonthlyAverages } from '../../types/types';

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

  private static readonly MONTHLY_CLIMATE_DATA: Record<string, {
    temps_c: number[];      // Average temperatures in Celsius
    precip_mm: number[];    // Precipitation in millimeters
    sunshine_mins: number[]; // Average daily sunshine in minutes
  }> = {
    '25,-80': { // Miami
      temps_c: [20, 21, 22, 24, 26, 27, 28, 28, 28, 26, 23, 21],
      precip_mm: [55, 53, 66, 86, 140, 216, 165, 208, 213, 160, 86, 56],
      sunshine_mins: [440, 450, 480, 510, 540, 510, 510, 480, 450, 420, 390, 420]
    },
    '40,-74': { // New York
      temps_c: [0, 2, 6, 12, 17, 22, 25, 24, 20, 14, 9, 3],
      precip_mm: [91, 76, 102, 104, 102, 97, 117, 104, 94, 89, 86, 89],
      sunshine_mins: [300, 330, 360, 420, 480, 510, 510, 480, 420, 360, 300, 270]
    },
    '34,-118': { // Los Angeles
      temps_c: [15, 16, 17, 18, 19, 21, 23, 24, 23, 21, 18, 15],
      precip_mm: [79, 97, 64, 23, 8, 3, 0, 3, 5, 10, 30, 58],
      sunshine_mins: [420, 450, 480, 510, 510, 540, 600, 570, 510, 480, 420, 390]
    },
    '47,-122': { // Seattle
      temps_c: [5, 6, 8, 11, 14, 17, 19, 19, 17, 12, 8, 5],
      precip_mm: [142, 89, 94, 69, 51, 38, 18, 23, 41, 89, 155, 142],
      sunshine_mins: [240, 270, 330, 390, 450, 480, 540, 510, 420, 300, 210, 210]
    },
    '41,-87': { // Chicago
      temps_c: [-3, -1, 4, 10, 16, 22, 24, 23, 19, 12, 6, -1],
      precip_mm: [46, 46, 64, 86, 94, 97, 94, 89, 84, 69, 71, 56],
      sunshine_mins: [270, 300, 330, 390, 450, 480, 510, 480, 420, 360, 270, 240]
    }
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
 
    const typicalLastFrost = addDays(lastFrost, -dates.lastFrostRange[0]);
    const typicalFirstFrost = addDays(firstFrost, -dates.firstFrostRange[0]);

    return Promise.resolve({
      lastFrost,
      firstFrost,
      lastFrostRange: {
        earliest: addDays(lastFrost, -dates.lastFrostRange[0]),
        latest: addDays(lastFrost, dates.lastFrostRange[1]),
        typical: typicalLastFrost
      },
      firstFrostRange: {
        earliest: addDays(firstFrost, -dates.firstFrostRange[0]),
        latest: addDays(firstFrost, dates.firstFrostRange[1]),
        typical: typicalFirstFrost
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

  static async getMonthlyAverages(lat: number, lng: number): Promise<MonthlyAverages> {
    await delay(800);

    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];

    const coordinate = this.getClosestCoordinate(lat, lng);
    const climateData = this.MONTHLY_CLIMATE_DATA[coordinate] || this.MONTHLY_CLIMATE_DATA['40,-74']; // Default to NYC

    const monthly_averages: Record<string, {
      average_temp_c: number;
      average_precipitation_mm: number;
      average_sunshine_mins: number;
    }> = {};

    months.forEach((month, index) => {
      // Add some random variation (±10%) to make it more realistic
      const variation = () => 0.9 + Math.random() * 0.2;

      monthly_averages[month] = {
        average_temp_c: +(climateData.temps_c[index] * variation()).toFixed(1),
        average_precipitation_mm: +(climateData.precip_mm[index] * variation()).toFixed(1),
        average_sunshine_mins: Math.round(climateData.sunshine_mins[index] * variation())
      };
    });

    return {
      monthly_averages
    };
  }
}
export default MockGardenDataService;