const f = async () => {
  const dbUrl = 'https://monitor-coimbra-default-rtdb.firebaseio.com/ocorrencias.json';
  const r = await fetch(dbUrl);
  const data = await r.json();
  const keys = Object.keys(data);
  for (const k of keys) {
    const pos = data[k].pos;
    if (pos && pos.length >= 2) {
      const lat = pos[0];
      const lon = pos[1];
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
          headers: {
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'User-Agent': 'MonitorCoimbra/1.0'
          }
        });
        const geo = await res.json();
        if (geo && geo.address) {
          data[k].pais = geo.address.country || 'Desconhecido';
          data[k].cidade = geo.address.city || geo.address.town || geo.address.village || geo.address.municipality || 'Desconhecida';
          console.log(`Updated ${k} to ${data[k].cidade}, ${data[k].pais}`);
        }
      } catch (e) {
        console.error('Error fetching', lat, lon, e.message);
      }
    }
    await new Promise(res => setTimeout(res, 1500));
  }
  await fetch(dbUrl, { method: 'PUT', body: JSON.stringify(data) });
  console.log('Done!');
};
f();
