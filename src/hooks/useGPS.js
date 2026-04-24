import { useState, useEffect } from 'react';

// O segredo está nesta linha: "export const" garante o nome para o import
export const useGPS = (isTracking) => {
  const [position, setPosition] = useState([-8.122672, -34.965546]);
  const [path, setPath] = useState([]);

  useEffect(() => {
    let watchId = null;
    if (isTracking) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (!isNaN(lat)) {
            const newPos = [lat, lng];
            setPosition(newPos);
            setPath(prev => {
              const updated = [...prev, newPos];
              // Salvando no localstorage para não perder o rastro ao atualizar
              localStorage.setItem('auditor_path', JSON.stringify(updated));
              return updated;
            });
          }
        },
        (err) => console.error("Erro GPS:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isTracking]);

  return { position, path, setPath };
};