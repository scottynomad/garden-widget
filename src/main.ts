import GardenZoneWidget from './components/garden-zone-widget';
import GardenDataService from './services/GardenDataService';

// Configure widget based on environment variable
if (import.meta.env.PROD || import.meta.env.VITE_USE_REAL_API === 'true') {
  GardenZoneWidget.register(GardenDataService);
} else {
  GardenZoneWidget.register();
}

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const lat = urlParams.get('lat');
const lon = urlParams.get('lon');

// Get references to elements
const demoControls = document.querySelector('.demo-controls');
const widget = document.querySelector('garden-zone-widget');

if (lat && lon) {
    // If URL parameters exist, hide controls and set widget coordinates
    demoControls?.classList.add('hidden');
    widget?.setAttribute('latitude', lat);
    widget?.setAttribute('longitude', lon);
} else {
    // If no URL parameters, show controls and set default coordinates
    widget?.setAttribute('latitude', '40');
    widget?.setAttribute('longitude', '-74');
    
    // Add click handlers for the location preset buttons
    document.querySelectorAll('.location-preset').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            const lat = target.dataset.lat;
            const lng = target.dataset.lng;

            if (widget && lat && lng) {
                widget.setAttribute('latitude', lat);
                widget.setAttribute('longitude', lng);
            }
        });
    });
}
