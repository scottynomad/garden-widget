import './components/garden-zone-widget';

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
