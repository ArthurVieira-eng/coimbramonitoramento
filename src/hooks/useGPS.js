import { useState, useEffect } from 'react';

export const useGPS = (isRegistered, isTracking) => {
  // 1. Começa como null. NADA de coordenadas do Brasil aqui!
  const [position, setPosition] = useState(null);
  const [path, setPath] = useState([]);

  useEffect(() => {
    let watchId = null;

    // Só ativa o sensor se o usuário já passou da tela de login
    if (isRegistered) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const newPos = [lat, lng];

          // Atualiza a posição atual (ponto azul no mapa)
          setPosition(newPos);

          // 2. Só adiciona ao rastro (path) se o botão "Iniciar" foi clicado
          if (isTracking) {
            setPath(prev => {
              const updated = [...prev, newPos];
              localStorage.setItem('auditor_path', JSON.stringify(updated));
              return updated;
            });
          }
        },
        (err) => console.error("Erro GPS:", err),
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isRegistered, isTracking]); // Recarrega se o status de registro ou rastreio mudar

  return { position, path, setPath };
};