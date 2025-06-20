
// Add this at the top of the file, before any imports
declare global {
  interface Window {
    L: any; // Leaflet global object
    [key:string]: any; 
  }
}

import React, { useState, useEffect, ChangeEvent, useCallback, useRef } from 'react';
import CloseIcon from './icons/CloseIcon';
import MapPinIcon from './icons/MapPinIcon'; 
import MyLocationIcon from './icons/MyLocationIcon'; // Nuevo icono
import SpinnerIcon from './icons/SpinnerIcon'; // Nuevo icono

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string; // Nominatim returns string
  lon: string; // Nominatim returns string
}

interface InteractiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLocation: (selectedAddress: string, lat?: number, lon?: number) => void; // Updated prop
  initialAddress?: string;
  title?: string;
  modalIdPrefix?: string;
}

const InteractiveMapModal: React.FC<InteractiveMapModalProps> = ({
  isOpen,
  onClose,
  onConfirmLocation,
  initialAddress = '',
  title = "Seleccionar Ubicación",
  modalIdPrefix = "defaultMapModal"
}) => {
  const [currentAddress, setCurrentAddress] = useState(initialAddress);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(null); // Store coords
  const [searchInput, setSearchInput] = useState(initialAddress);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); 
  const suggestionsRef = useRef<HTMLUListElement>(null); 

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null); 
  const markerRef = useRef<any | null>(null); 

  const [isFetchingCurrentLocation, setIsFetchingCurrentLocation] = useState(false);


  const defaultMapPosition: [number, number] = [9.076358, -79.453566]; // Panama City

  const updateMarkerAndAddress = useCallback((latlngTuple: [number, number], address: string, nominatimLat?: string, nominatimLon?: string, zoomLevel = 17, updateSearchInputField: boolean = true) => {
    if (mapRef.current) {
      mapRef.current.setView(latlngTuple, zoomLevel);
      mapRef.current.invalidateSize(); 
    }
    if (markerRef.current) {
      markerRef.current.setLatLng(latlngTuple);
    }
    setCurrentAddress(address);
    if (nominatimLat && nominatimLon) {
        setCurrentCoords({ lat: parseFloat(nominatimLat), lon: parseFloat(nominatimLon) });
    } else {
        setCurrentCoords({ lat: latlngTuple[0], lon: latlngTuple[1] }); // Fallback if nominatim coords not directly passed
    }

    if (updateSearchInputField) {
      setSearchInput(address); 
    }
    setGeocodingError(null);
  }, []); 
  
  const reverseGeocode = useCallback(async (latlngTuple: [number, number]) => {
    setGeocodingError(null);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlngTuple[0]}&lon=${latlngTuple[1]}`);
      if (!response.ok) throw new Error(`Error de red: ${response.status}`);
      const data: NominatimResult = await response.json();
      if (data && data.display_name) {
        updateMarkerAndAddress(latlngTuple, data.display_name, data.lat, data.lon, mapRef.current?.getZoom() || 17, false);
      } else {
        updateMarkerAndAddress(latlngTuple, "Dirección no encontrada para esta ubicación.", String(latlngTuple[0]), String(latlngTuple[1]), mapRef.current?.getZoom() || 17, false);
        setGeocodingError("No se pudo determinar la dirección para esta ubicación.");
      }
    } catch (error) {
      console.error("Error en geocodificación inversa:", error);
      setCurrentAddress("Error al obtener la dirección.");
      setGeocodingError("Error al obtener la dirección.");
      setCurrentCoords(null);
    }
  }, [updateMarkerAndAddress]);

  const geocodeAddress = useCallback(async (address: string) => {
    if (!address.trim()) return;
    setGeocodingError(null);
    setSuggestions([]); 
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=pa`); 
      if (!response.ok) throw new Error(`Error de red: ${response.status}`);
      const data: NominatimResult[] = await response.json();
      if (data && data.length > 0) {
        const firstResult = data[0];
        updateMarkerAndAddress([parseFloat(firstResult.lat), parseFloat(firstResult.lon)], firstResult.display_name, firstResult.lat, firstResult.lon, 17, true);
      } else {
        setGeocodingError(`No se encontraron resultados para "${address}". Intenta con una dirección más general o usa el mapa.`);
        setCurrentCoords(null);
      }
    } catch (error) {
      console.error("Error en geocodificación:", error);
      setGeocodingError("Error al buscar la dirección.");
      setCurrentCoords(null);
    }
  }, [updateMarkerAndAddress]);

  useEffect(() => {
    if (isOpen && !mapRef.current && mapContainerRef.current && window.L) {
      setIsLoadingMap(true);
      const map = window.L.map(mapContainerRef.current).setView(defaultMapPosition, 15);
      mapRef.current = map;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const marker = window.L.marker(defaultMapPosition, { draggable: true }).addTo(map);
      markerRef.current = marker;

      map.on('click', (e: any) => { 
        reverseGeocode([e.latlng.lat, e.latlng.lng]);
      });

      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        reverseGeocode([latlng.lat, latlng.lng]);
      });

      if (initialAddress && initialAddress.trim() !== '') {
        geocodeAddress(initialAddress);
      } else {
        // For default position, get initial address and coords
        const fetchInitialAddressForDefault = async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${defaultMapPosition[0]}&lon=${defaultMapPosition[1]}`);
                if (!response.ok) throw new Error('Initial reverse geocode failed');
                const data: NominatimResult = await response.json();
                if (data && data.display_name) {
                    updateMarkerAndAddress(defaultMapPosition, data.display_name, data.lat, data.lon, mapRef.current?.getZoom() || 15, false);
                }
            } catch (err) {
                console.error("Failed to fetch initial address for default position:", err);
                setCurrentAddress("Ciudad de Panamá (Ubicación por defecto)");
                setCurrentCoords({ lat: defaultMapPosition[0], lon: defaultMapPosition[1] });
            }
        };
        fetchInitialAddressForDefault();
      }
      setIsLoadingMap(false);
    }
    
    if (isOpen && mapRef.current) {
        setTimeout(() => { 
            mapRef.current.invalidateSize();
        }, 100);
    }

  }, [isOpen, initialAddress, geocodeAddress, reverseGeocode, updateMarkerAndAddress]); // Added updateMarkerAndAddress
  
  useEffect(() => {
    if (isOpen) {
      setCurrentAddress(initialAddress);
      setSearchInput(initialAddress); 
      setIsVisible(true);
      setGeocodingError(null); 
      setSuggestions([]);
      setIsFetchingCurrentLocation(false);
      setCurrentCoords(null); // Reset coords on open, will be set by geocoding/reverseGeocoding
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialAddress]);

  useEffect(() => {
    if (searchInput.trim().length < 3) {
      setSuggestions([]);
      setIsFetchingSuggestions(false);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsFetchingSuggestions(true);
    debounceTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&countrycodes=pa&limit=5`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const data: NominatimResult[] = await response.json();
        setSuggestions(data || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchInput]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    onConfirmLocation(currentAddress, currentCoords?.lat, currentCoords?.lon);
    handleCloseModal();
  };

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };
  
  const handleAddressDisplayChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentAddress(e.target.value); 
    // Optionally, clear coords if user manually edits the final address field,
    // as they might no longer match the map pin.
    // For now, let's keep coords if they were set, assuming minor text edits are ok.
    // If a full manual edit invalidates the map pin, the parent AddAddressModal will handle it.
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestions([]);
    geocodeAddress(searchInput);
  };
  
  const handleSuggestionClick = (suggestion: NominatimResult) => {
    setSearchInput(suggestion.display_name); 
    setSuggestions([]); 
    geocodeAddress(suggestion.display_name); 
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeocodingError("La geolocalización no es soportada por tu navegador.");
      return;
    }
    setIsFetchingCurrentLocation(true);
    setGeocodingError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        reverseGeocode([position.coords.latitude, position.coords.longitude]);
        setIsFetchingCurrentLocation(false);
      },
      (error) => {
        let message = "No se pudo obtener tu ubicación. ";
        switch(error.code) {
            case error.PERMISSION_DENIED: message += "Permiso denegado."; break;
            case error.POSITION_UNAVAILABLE: message += "Información de ubicación no disponible."; break;
            case error.TIMEOUT: message += "Se agotó el tiempo de espera para obtener la ubicación."; break;
            default: message += "Ocurrió un error desconocido."; break;
        }
        setGeocodingError(message);
        setIsFetchingCurrentLocation(false);
        setCurrentCoords(null);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };


  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-[110] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalIdPrefix}-interactive-map-title`}
      onClick={handleCloseModal}
    >
      <div
        className={`bg-brand-primary p-5 sm:p-6 rounded-lg shadow-modal w-full max-w-2xl transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={`${modalIdPrefix}-interactive-map-title`} className="text-lg sm:text-xl font-semibold text-brand-secondary">{title}</h2>
          <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar mapa">
            <CloseIcon className="w-5 h-5"/>
          </button>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="relative mb-2">
            <div className="flex gap-2">
                <input
                    ref={searchInputRef}
                    id={`${modalIdPrefix}-address-search-input`}
                    type="text"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onFocus={() => { /* Maybe re-fetch suggestions if input isn't empty */ }}
                    placeholder="Buscar dirección o lugar..."
                    className="flex-grow p-2.5 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base" 
                    autoComplete="off"
                />
                <button type="submit" className="btn-secondary px-3 sm:px-4 py-2 flex items-center" aria-label="Buscar dirección">
                    <MapPinIcon className="w-4 h-4 mr-1.5 sm:mr-2"/> <span className="hidden sm:inline">Buscar</span>
                </button>
            </div>
             {isFetchingSuggestions && <p className="text-xs text-brand-gray-medium mt-1">Buscando sugerencias...</p>}
             {suggestions.length > 0 && (
                <ul 
                  ref={suggestionsRef}
                  className="absolute z-[1000] w-full bg-brand-primary border border-brand-quaternary rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto"
                >
                {suggestions.map((suggestion) => (
                    <li 
                        key={suggestion.place_id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-2 hover:bg-brand-gray-light cursor-pointer text-sm text-text-primary"
                        role="option"
                        aria-selected={false}
                    >
                    {suggestion.display_name}
                    </li>
                ))}
                </ul>
            )}
        </form>
        
        <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isFetchingCurrentLocation}
            className="btn-outline w-full py-2 mb-3 flex items-center justify-center disabled:opacity-70 disabled:cursor-wait"
        >
            {isFetchingCurrentLocation ? (
                <>
                    <SpinnerIcon className="w-4 h-4 mr-2" /> Buscando ubicación...
                </>
            ) : (
                <>
                    <MyLocationIcon className="w-4 h-4 mr-2" /> Usar mi ubicación actual
                </>
            )}
        </button>

         {geocodingError && <p className="text-xs text-error mb-2 text-center">{geocodingError}</p>}

        <div ref={mapContainerRef} className="w-full h-56 sm:h-64 md:h-72 rounded-md mb-4 shadow-md bg-brand-gray-light relative">
            {isLoadingMap && <div className="absolute inset-0 flex items-center justify-center bg-brand-gray-light/80"><p className="text-text-secondary text-sm">Cargando mapa...</p></div>}
        </div>
        
        <div>
          <label htmlFor={`${modalIdPrefix}-map-address-display`} className="block text-sm sm:text-base font-medium text-text-primary mb-1">
            Dirección Seleccionada:
          </label>
          <input
            id={`${modalIdPrefix}-map-address-display`}
            type="text"
            value={currentAddress}
            onChange={handleAddressDisplayChange} 
            placeholder="La dirección aparecerá aquí..."
            className="w-full p-2.5 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
          />
           <p className="text-xs text-brand-gray-medium mt-1">Puedes ajustar la dirección manualmente si es necesario.</p>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={handleCloseModal} className="btn-ghost py-2 px-4">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} className="btn-primary py-2 px-4" disabled={!currentAddress.trim()}>
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMapModal;