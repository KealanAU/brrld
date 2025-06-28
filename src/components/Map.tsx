'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { MapContainer as MapContainerType, TileLayer as TileLayerType, Marker as MarkerType, Popup as PopupType } from 'react-leaflet';
import { useBeachData } from '@/context/BeachDataContext';
import { useMap } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import './Map.css';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Create a component to handle map center updates
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// Create a client-side only component
const MapComponent = ({ 
  center = [-33.76886000, 151.28888000], // Curl Curl beach coordinates
  zoom = 13,
  className = 'h-screen w-screen'
}: MapProps) => {
  const [MapContainer, setMapContainer] = useState<typeof MapContainerType | null>(null);
  const [TileLayer, setTileLayer] = useState<typeof TileLayerType | null>(null);
  const [Marker, setMarker] = useState<typeof MarkerType | null>(null);
  const [Popup, setPopup] = useState<typeof PopupType | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { allBeaches } = useBeachData();
  const router = useRouter();

  useEffect(() => {
    // Request user's location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.warn("Location access denied or error:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, []);

  useEffect(() => {
    // Dynamically import Leaflet components only on client side
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
      
      // Custom SVG marker with multiple colors from BRRLD logo
      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f253f" flood-opacity="0.3"/>
            </filter>
          </defs>
          <!-- Main pin shape in orange -->
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                fill="#fb8501" stroke="#0f253f" stroke-width="0.5" filter="url(#shadow)"/>
          <!-- Center dot in blue -->
          <circle cx="12" cy="9" r="2.5" fill="#219fbd"/>
          <!-- Inner highlight in light blue -->
          <circle cx="11.5" cy="8.5" r="1" fill="#8ecbe6"/>
        </svg>
      `;

      const DefaultIcon = L.divIcon({
        className: 'custom-marker',
        html: svgIcon,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
      });

      L.Marker.prototype.options.icon = DefaultIcon;
      
      setMapContainer(() => MapContainer);
      setTileLayer(() => TileLayer);
      setMarker(() => Marker);
      setPopup(() => Popup);
    };

    initMap();
  }, []);

  if (!MapContainer || !TileLayer || !Marker || !Popup) {
    return <div className={className} />;
  }

  // Use user location if available, otherwise fall back to default center
  const mapCenter = userLocation || center;

  const handleBeachClick = (beachName: string) => {
    router.push(`?beach=${encodeURIComponent(beachName)}`);
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      className={`${className} map-container`}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <ChangeMapView center={mapCenter} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {allBeaches.map((beach) => (
        <Marker
          key={beach.beach_id}
          position={[beach.lat, beach.lon]}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{beach.beach_name}</h3>
              <p className="text-sm text-gray-600">{beach.area}</p>
              <p className="text-sm text-gray-600">{beach.region}, {beach.country}</p>
              <button
                onClick={() => handleBeachClick(beach.beach_name)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                View Forecast
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      <div className="leaflet-control-container">
        <div className="leaflet-bottom leaflet-right">
          <div className="leaflet-control-zoom leaflet-bar leaflet-control">
            <a className="leaflet-control-zoom-in" href="#" title="Zoom in" role="button" aria-label="Zoom in">+</a>
            <a className="leaflet-control-zoom-out" href="#" title="Zoom out" role="button" aria-label="Zoom out">−</a>
          </div>
        </div>
      </div>
    </MapContainer>
  );
};

// Export a dynamically loaded version of the component with SSR disabled
const Map = dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-gray-100" />
});

export default Map;
