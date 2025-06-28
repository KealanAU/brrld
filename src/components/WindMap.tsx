'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useBeachData } from '@/context/BeachDataContext';
import type { MapContainer as MapContainerType, TileLayer as TileLayerType, Marker as MarkerType, Popup as PopupType } from 'react-leaflet';
import type { Icon as LeafletIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

interface WindMapProps {
  width?: number;
  height?: number;
  className?: string;
}

// Create a client-side only component
const WindMapComponent = ({ 
  width = 150,
  height = 150,
  className = ''
}: WindMapProps) => {
  const [MapContainer, setMapContainer] = useState<typeof MapContainerType | null>(null);
  const [TileLayer, setTileLayer] = useState<typeof TileLayerType | null>(null);
  const [Marker, setMarker] = useState<typeof MarkerType | null>(null);
  const [Popup, setPopup] = useState<typeof PopupType | null>(null);
  const [markerIcon, setMarkerIcon] = useState<LeafletIcon | null>(null);
  const { beachData } = useBeachData();

  useEffect(() => {
    // Dynamically import Leaflet components only on client side
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
      
      // Fix for default marker icons
      const icon = (await import('leaflet/dist/images/marker-icon.png')).default;
      const iconShadow = (await import('leaflet/dist/images/marker-shadow.png')).default;

      const DefaultIcon = L.icon({
        iconUrl: icon.src,
        shadowUrl: iconShadow.src,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Set the default icon for all markers
      L.Marker.prototype.options.icon = DefaultIcon;
      setMarkerIcon(DefaultIcon);
      
      setMapContainer(() => MapContainer);
      setTileLayer(() => TileLayer);
      setMarker(() => Marker);
      setPopup(() => Popup);
    };

    initMap();
  }, []);

  if (!MapContainer || !TileLayer || !Marker || !Popup || !beachData?.details || !markerIcon) {
    return (
      <div 
        style={{ width, height }} 
        className={`${className} bg-gray-100 flex items-center justify-center`}
      >
        <p className="text-gray-500">Select a beach to view the map</p>
      </div>
    );
  }

  // Use coordinates from the selected beach
  const center: [number, number] = [beachData.details.lat, beachData.details.lon];

  return (
    <div style={{ width, height }} className={`${className} rounded-lg overflow-hidden shadow-lg`}>
      <MapContainer
        center={center}
        zoom={14}
        className="h-full w-full map-container"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      
        <div className="leaflet-control-container">
          <style jsx global>{`
            .leaflet-control-attribution {
              font-size: 8px !important;
              padding: 2px 4px !important;
              max-width: 100% !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              background: rgba(255, 255, 255, 0.8) !important;
              margin: 0 !important;
              position: absolute !important;
              bottom: 0 !important;
              right: 0 !important;
              transform: translateY(-2px) !important;
            }
            .leaflet-control-attribution a {
              font-size: 8px !important;
            }
            .leaflet-control-container {
              position: relative !important;
            }
          `}</style>
        </div>
      </MapContainer>
    </div>
  );
};

// Export a dynamically loaded version of the component with SSR disabled
export const WindMap = dynamic(() => Promise.resolve(WindMapComponent), {
  ssr: false,
  loading: () => <div className="h-[150px] w-[150px] bg-gray-100 flex items-center justify-center">
    <p className="text-gray-500">Loading map...</p>
  </div>
});
