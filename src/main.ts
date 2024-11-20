import GardenZoneWidget from './components/garden-zone-widget';
import GardenDataService from './services/GardenDataService';

// Configure widget based on environment variable
if (import.meta.env.PROD || import.meta.env.VITE_USE_REAL_API === 'true') {
  GardenZoneWidget.register(GardenDataService);
} else {
  GardenZoneWidget.register();
}

// Add click handlers for the location preset buttons
document.querySelectorAll('.location-preset').forEach(button => {
    button.addEventListener('click', (e) => {
        console.log('Location preset clicked');
        const target = e.target as HTMLButtonElement;
        const lat = target.dataset.lat;
        const lng = target.dataset.lng;

        const widget = document.querySelector('garden-zone-widget');
        if (widget && lat && lng) {
            console.log('Setting widget coords:', lat, lng);
            widget.setAttribute('latitude', lat);
            widget.setAttribute('longitude', lng);
        }
    });
});
