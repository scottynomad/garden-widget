import MockGardenDataService from './mock/mock-garden-data';
import { Chart, registerables } from 'chart.js';
import { FrostDates } from './mock/types';
// Register all Chart.js components we'll need
Chart.register(...registerables);

console.log('Chart.js initialized:', {
  Chart: typeof Chart,
  registerables: registerables
});

class GardenZoneWidget extends HTMLElement {
  private rainfallChart: Chart | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['latitude', 'longitude'];
  }

  connectedCallback() {
    this.render();
    this.loadGardeningData();
  }

  attributeChangedCallback(_name: string, oldValue: string, newValue: string) {
    console.log('attributeChangedCallback', _name, oldValue, newValue);
    if (oldValue !== newValue) {
      this.loadGardeningData();
    }
  }

  async loadGardeningData() {
    const lat = parseFloat(this.getAttribute('latitude') || '0');
    const lng = parseFloat(this.getAttribute('longitude') || '0');
    try {
      console.log('Loading gardening data for:', lat, lng);
      // Using our mock service instead of real APIs
      const [frostDates, hardiness, rainfall, soilData, crops] = await Promise.all([
        MockGardenDataService.getFrostDates(lat, lng),
        MockGardenDataService.getHardinessZone(lat, lng),
        MockGardenDataService.getRainfallData(lat, lng),
        MockGardenDataService.getSoilData(lat, lng),
        MockGardenDataService.getRecommendedCrops(lat, lng)
      ]);
      this.updateDisplay(frostDates, hardiness, rainfall, soilData, crops);
    } catch (error) {
      console.error('Error loading gardening data:', error);
      this.showError();
    }
  }

  // async loadApiGardeningData() {
  //   const lat = this.getAttribute('latitude');
  //   const lng = this.getAttribute('longitude');

  //   try {
  //     // Load data from various APIs
  //     const [frostDates, hardiness, rainfall, soilData, crops] = await Promise.all([
  //       this.getFrostDates(lat, lng),
  //       this.getHardinessZone(lat, lng),
  //       this.getRainfallData(lat, lng),
  //       this.getSoilData(lat, lng),
  //       this.getRecommendedCrops(lat, lng)
  //     ]);

  //     this.updateDisplay(frostDates, hardiness, rainfall, soilData, crops);
  //   } catch (error) {
  //     console.error('Error loading gardening data:', error);
  //     this.showError();
  //   }
  // }

  render() {
    const styles = `
      :host {
        display: block;
        padding: 0.5rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin: 0.5rem;
        font-family: system-ui, sans-serif;
        font-size: 0.9rem;
      }

      .widget-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 0.5rem;
      }

      .data-section {
        margin: 0;
        padding: 0.5rem;
        border: 1px solid #eee;
        border-radius: 4px;
      }

      .data-section h3 {
        color: #2c5282;
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
      }

      .source-link {
        font-size: 0.7rem;
        color: #4299e1;
        text-decoration: none;
        display: block;
        margin-top: 0.25rem;
      }

      .chart-container {
        grid-column: 1 / -1;
        height: 200px;
        width: 100%;
      }

      ul {
        margin: 0;
        padding-left: 1.2rem;
      }

      p {
        margin: 0.25rem 0;
      }


      .crops-section {
        grid-column: 1 / -1;
      }

      .crops-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .season-column h4 {
        color: #2c5282;
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        font-weight: 600;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.25rem;
      }

      .planting-group {
        margin-bottom: 1rem;
      }

      .planting-group h5 {
        color: #4a5568;
        margin: 0 0 0.25rem 0;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .planting-group ul {
        margin: 0;
        padding-left: 1.2rem;
        font-size: 0.85rem;
      }

      .frost-dates {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.5rem;
      }
    `;

    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="widget-container">
        <h2>Garden Zone Information</h2>
        <div class="loading">Loading gardening data...</div>
      </div>
    `;
  }

  async renderRainfallChart(rainfallData: Array<{ month: string; amount: number }>) {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    chartContainer.appendChild(canvas);

    // Wait for next frame
    await new Promise(resolve => requestAnimationFrame(resolve));

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return chartContainer;
    }

    try {
      this.rainfallChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: rainfallData.map(d => d.month),
          datasets: [{
            label: 'Rainfall (inches)',
            data: rainfallData.map(d => d.amount),
            backgroundColor: 'rgba(66, 153, 225, 0.6)',
            borderColor: 'rgb(49, 130, 206)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: { size: 10 }
              }
            },
            x: {
              ticks: {
                font: { size: 10 }
              }
            }
          },
          plugins: {
          }
        }
      });
      console.log('Chart created successfully:', this.rainfallChart);
    } catch (error) {
      console.error('Error creating chart:', error);
      console.error('Error details:', {
        error,
        Chart: typeof Chart,
        canvas: canvas,
        context: ctx,
        data: rainfallData
      });
    }

    return chartContainer;
  }

  async renderFrostChart(frostDates: FrostDates) {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'frost-chart-container';
    chartContainer.style.width = '100%';
    chartContainer.style.height = '60px';

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 60;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    chartContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return chartContainer;

    // Helper to convert date string to days since start of year
    const dateToDays = (date: Date) => {
      return Math.floor((date.getTime() - new Date("2024-01-01").getTime()) / (1000 * 60 * 60 * 24));
    };

    // Calculate days for each boundary
    const lastFrostEarliestDays = dateToDays(frostDates.lastFrostRange.earliest);
    const lastFrostLatestDays = dateToDays(frostDates.lastFrostRange.latest);
    const firstFrostEarliestDays = dateToDays(frostDates.firstFrostRange.earliest);
    const firstFrostLatestDays = dateToDays(frostDates.firstFrostRange.latest);

    // Calculate segment lengths in days
    const beforeLastFrost = lastFrostEarliestDays;
    const lastFrostRange = lastFrostLatestDays - lastFrostEarliestDays;
    const growingSeason = firstFrostEarliestDays - lastFrostLatestDays;
    const firstFrostRange = firstFrostLatestDays - firstFrostEarliestDays;
    const afterFirstFrost = 366 - firstFrostLatestDays; // Use 366 for leap year

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Growing Season'],
        datasets: [
          {
            // Winter/Frost (before last frost)
            data: [beforeLastFrost],
            backgroundColor: 'rgba(203, 213, 224, 0.3)',
            barPercentage: 0.3,
          },
          {
            // Last Frost Range
            data: [lastFrostRange],
            backgroundColor: 'rgba(147, 197, 253, 0.8)',
            barPercentage: 0.3,
          },
          {
            // Growing Season
            data: [growingSeason],
            backgroundColor: 'rgba(72, 187, 120, 0.2)',
            barPercentage: 0.3,
          },
          {
            // First Frost Range
            data: [firstFrostRange],
            backgroundColor: 'rgba(147, 197, 253, 0.8)',
            barPercentage: 0.3,
          },
          {
            // Winter/Frost (after first frost)
            data: [afterFirstFrost],
            backgroundColor: 'rgba(203, 213, 224, 0.3)',
            barPercentage: 0.3,
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            stacked: true,
            display: true,
            grid: {
              display: false
            },
            ticks: {
              callback: function (value: any) {
                // Convert days back to month names
                const date = new Date("2024-01-01");
                date.setDate(date.getDate() + value);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return months[date.getMonth()];
              },
              font: {
                size: 10
              }
            }
          },
          y: {
            stacked: true,
            display: false,
            grid: {
              display: false
            }
          }
        }
      }
    });

    return chartContainer;
  }

  async updateDisplay(frostDates: FrostDates,
    hardiness: {
      zone: string;
      source: string;
    }, rainfall: {
      data: Array<{ month: string; amount: number }>;
      source: string;
    }, soilData: {
      classification: string;
      description?: string;
      source: string;
    }, crops: {
      crops: string[];
      source: string;
    }) {
    const container = this.shadowRoot?.querySelector('.widget-container');
    if (!container) return;

    interface SeasonalGroups {
      [season: string]: {
        title: string;
        groups: {
          [groupName: string]: string[];
        };
      };
    }

    const seasonalGroups: SeasonalGroups = {
      early: {
        title: 'Early Season',
        groups: {
          'Start Indoors (Early Spring)': [],
          'Direct Seed (Spring)': []
        }
      },
      mid: {
        title: 'Mid Season',
        groups: {
          'Start Indoors (Late Spring)': [],
          'Direct Seed (Summer)': []
        }
      },
      late: {
        title: 'Late Season',
        groups: {
          'Start Indoors (Summer)': [],
          'Direct Seed (Fall)': []
        }
      }
    };


    // Group crops as before, but use the new structure
    crops.crops.forEach(crop => {
      if (crop.includes('Tomato') || crop.includes('Pepper') || crop.includes('Eggplant')) {
        seasonalGroups.early.groups['Start Indoors (Early Spring)'].push(crop);
      } else if (crop.includes('Pea') || crop.includes('Spinach') || crop.includes('Lettuce')) {
        seasonalGroups.early.groups['Direct Seed (Spring)'].push(crop);
      } else if (crop.includes('Melon') || crop.includes('Squash')) {
        seasonalGroups.mid.groups['Start Indoors (Late Spring)'].push(crop);
      } else if (crop.includes('Bean') || crop.includes('Corn')) {
        seasonalGroups.mid.groups['Direct Seed (Summer)'].push(crop);
      } else if (crop.includes('Broccoli') || crop.includes('Cabbage')) {
        seasonalGroups.late.groups['Start Indoors (Summer)'].push(crop);
      } else {
        seasonalGroups.late.groups['Direct Seed (Fall)'].push(crop);
      }
    });

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const cropsSection = `
    <div class="data-section crops-section">
      <h3>Recommended Crops</h3>
      <div class="crops-grid">
        ${Object.entries(seasonalGroups).map(([_, season]) => `
          <div class="season-column">
            <h4>${season.title}</h4>
            ${Object.entries(season.groups)
        .filter(([_, crops]) => crops.length > 0)
        .map(([groupName, groupCrops]) => `
                <div class="planting-group">
                  <h5>${groupName}</h5>
                  <ul>
                    ${groupCrops.map(crop => `<li>${crop}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
          </div>
        `).join('')}
      </div>
      <a href="${crops.source}" class="source-link">Extension Service Data</a>
    </div>
  `;

    // Create the HTML content
    container.innerHTML = `
      <h2>Garden Zone Information</h2>
      
      <h3>Coords: ${this.getAttribute('latitude')}, ${this.getAttribute('longitude')}</h3>

      <div class="data-section">
        <h3>Growing Season</h3>
        <div class="frost-chart-container"></div>
        <p class="frost-dates">
          Typical Last Frost: ${formatDate(frostDates.lastFrostRange.typical)}<br>
          Typical First Frost: ${formatDate(frostDates.firstFrostRange.typical)}
        </p>
        <a href="${frostDates.source}" class="source-link">NOAA Data</a>
      </div>

      <div class="data-section">
        <h3>USDA Hardiness Zone</h3>
        <p>Zone: ${hardiness.zone}</p>
        <a href="${hardiness.source}" class="source-link" target="_blank">Source: USDA</a>
      </div>

      <div class="data-section">
        <h3>Growing Season Typical Rainfall</h3>
        <a href="${rainfall.source}" class="source-link" target="_blank">Source: Weather Service</a>
      </div>

      <div class="data-section">
        <h3>Soil Classification</h3>
        <p>${soilData.classification}</p>
        <p><em>${soilData.description || ''}</em></p>
        <a href="${soilData.source}" class="source-link" target="_blank">Source: SSURGO</a>
      </div>

      ${cropsSection}
    `;

    // Debug rainfall data
    console.log('Rainfall data:', rainfall.data);

    // Add the frost chart
    const frostSection = container.querySelector('.frost-chart-container');
    if (frostSection) {
      const chartContainer = await this.renderFrostChart(frostDates);
      frostSection.appendChild(chartContainer);
    }

    // Add the rainfall chart
    const rainfallSection = container.querySelector('.data-section:nth-of-type(3)');
    if (rainfallSection) {
      const chartContainer = await this.renderRainfallChart(rainfall.data);
      rainfallSection.insertBefore(chartContainer, rainfallSection.lastElementChild);
    }
  }

  disconnectedCallback() {
    // Clean up the chart when the component is removed
    if (this.rainfallChart) {
      this.rainfallChart.destroy();
      this.rainfallChart = null;
    }
  }
  showError() {
    const container = this.shadowRoot?.querySelector('.widget-container');
    if (!container) return;

    container.innerHTML = `
      <div class="error">
        Sorry, we couldn't load the gardening data. Please try again later.
      </div>
    `;
  }
}

customElements.define('garden-zone-widget', GardenZoneWidget);