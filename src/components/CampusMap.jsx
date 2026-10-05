import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl';
import { MapPin, Tag, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

// Campus default center (standard campus demo coordinates)
const DEFAULT_CENTER = [10.054, 76.354];

// Helper to create custom SVG map marker icons
const createCustomIcon = (status) => {
    const s = (status || '').toUpperCase();
    let bgGradient = 'bg-rose-500';
    let ringColor = 'border-rose-300';
    let dotColor = '#f43f5e';

    if (s === 'FOUND') {
        bgGradient = 'bg-emerald-600';
        ringColor = 'border-emerald-300';
        dotColor = '#059669';
    } else if (s === 'CLAIMED' || s === 'REUNITED' || s === 'RESOLVED') {
        bgGradient = 'bg-indigo-600';
        ringColor = 'border-indigo-300';
        dotColor = '#4f46e5';
    }

    const html = `
        <div style="position: relative; width: 32px; height: 32px; transform: translate(-50%, -100%);">
            <div style="width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background-color: ${dotColor}; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
            </div>
        </div>
    `;

    return L.divIcon({
        className: 'custom-leaflet-marker',
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

function LocationMarker({ position, onLocationChange }) {
    useMapEvents({
        click(e) {
            onLocationChange({
                lat: parseFloat(e.latlng.lat.toFixed(6)),
                lng: parseFloat(e.latlng.lng.toFixed(6))
            });
        }
    });

    if (!position) return null;

    return (
        <Marker
            position={[position.lat, position.lng]}
            icon={createCustomIcon('FOUND')}
        >
            <Popup>
                <div className="text-xs font-bold text-slate-800">
                    Selected Location<br />
                    <span className="text-slate-500 font-normal">
                        {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                    </span>
                </div>
            </Popup>
        </Marker>
    );
}

export default function CampusMap({
    mode = 'view', // 'view' | 'picker'
    items = [],
    selectedLocation = null,
    onLocationChange = null,
    height = '400px'
}) {
    const center = selectedLocation?.lat && selectedLocation?.lng
        ? [selectedLocation.lat, selectedLocation.lng]
        : (items.find(i => i.latitude && i.longitude)
            ? [items.find(i => i.latitude && i.longitude).latitude, items.find(i => i.latitude && i.longitude).longitude]
            : DEFAULT_CENTER);

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-soft relative" style={{ height }}>
            <MapContainer
                center={center}
                zoom={16}
                scrollWheelZoom={false}
                style={{ width: '100%', height: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mode === 'picker' && onLocationChange && (
                    <LocationMarker
                        position={selectedLocation}
                        onLocationChange={onLocationChange}
                    />
                )}

                {mode === 'view' && items.map((item) => {
                    if (!item.latitude || !item.longitude) return null;

                    return (
                        <Marker
                            key={item.id}
                            position={[item.latitude, item.longitude]}
                            icon={createCustomIcon(item.status || item.type)}
                        >
                            <Popup className="custom-leaflet-popup">
                                <div className="p-1 space-y-2 max-w-[200px]">
                                    {item.imageUrl && (
                                        <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100">
                                            <img
                                                src={getImageUrl(item.imageUrl)}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${
                                                item.status === 'LOST' ? 'bg-rose-500' : 'bg-emerald-600'
                                            }`}>
                                                {item.status || item.type}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-semibold truncate">
                                                {item.category}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                                            {item.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                            {item.description || item.location}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/items/${item.id}`}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline pt-1 border-t border-slate-100 w-full"
                                    >
                                        <span>View Item Details</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {mode === 'picker' && (
                <div className="absolute top-3 left-12 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-soft text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Click anywhere on the map to pinpoint location</span>
                </div>
            )}
        </div>
    );
}
