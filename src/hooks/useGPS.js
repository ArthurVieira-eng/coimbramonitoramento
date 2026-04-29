import { useState, useEffect, useRef } from 'react';

export const useGPS = (isRegistered, isTracking) => {
  // 1. Começa como null. NADA de coordenadas do Brasil aqui!
  const [position, setPosition] = useState(null);
  const [path, setPath] = useState([]);
  const [fallbackActive, setFallbackActive] = useState(false);
  const isFirstFix = useRef(true);

  useEffect(() => {
    let watchId = null;
    let timeoutId = null;

    // Só ativa o sensor se o usuário já passou da tela de login
    if (isRegistered) {
      // Inicia fallback se não houver sinal de GPS em 6 segundos
      timeoutId = setTimeout(() => {
        if (isFirstFix.current) {
          console.warn("GPS timeout. Iniciando fallback por IP...");
          fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
              if (data && data.latitude && data.longitude) {
                console.log("Fallback IP bem-sucedido:", data);
                setPosition([data.latitude, data.longitude]);
                setFallbackActive(true);
              }
            })
            .catch(err => console.error("Erro no fallback de IP:", err));
        }
      }, 6000);

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          isFirstFix.current = false;
          clearTimeout(timeoutId);
          setFallbackActive(false);

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
        (err) => {
          console.error("Erro GPS:", err);
          // Se der erro rápido de permissão e o timeout ainda não disparou
          if (err.code === 1 && isFirstFix.current) {
            isFirstFix.current = false;
            clearTimeout(timeoutId);
            fetch('https://ipapi.co/json/')
              .then(res => res.json())
              .then(data => {
                if (data && data.latitude && data.longitude) {
                  setPosition([data.latitude, data.longitude]);
                  setFallbackActive(true);
                }
              });
          }
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRegistered, isTracking]); // Recarrega se o status de registro ou rastreio mudar

  return { position, path, setPath, fallbackActive };
};