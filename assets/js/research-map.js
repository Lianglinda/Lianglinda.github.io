
// research-map.js
document.addEventListener("DOMContentLoaded", function () {
  // load JSON either from inline <script type="application/json" id="collab-data"> or fetch
  function getData() {
    const el = document.getElementById('collab-data');
    if (el) {
      try { return JSON.parse(el.textContent || el.innerText); }
      catch(e){ console.error('collab json parse error', e); }
    }
    return null;
  }

  const data = getData();
  if (!data) {
    console.warn('Looking forward to future collaborators.');
    return;
  }

  const center = data.center || [20, 0];
  const zoom = data.zoom || 2;
  const map = L.map('research-map', { zoomControl: true }).setView(center, zoom);

  // add a tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // a layer group for markers and lines
  const markers = L.layerGroup().addTo(map);
  const lines = L.layerGroup().addTo(map);

  // helper: small icon
  const defaultIcon = L.icon({
    iconUrl: '/images/marker-icon-2x.png', // you can supply your own
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
  });

  // create a map from id -> node
  const nodesById = {};
  (data.nodes || []).forEach(n => {
    nodesById[n.id] = n;
    const elContent = `<div style="min-width:200px;">
      <strong style="font-size:14px;">${n.name}</strong><br/>
      <small>${n.short || ''}</small><br/>
      ${n.url ? `<a href="${n.url}" target="_blank">Website</a>` : ''}
    </div>`;

    // use custom icon if img provided
    let icon = defaultIcon;
    if (n.img) {
      icon = L.icon({
        iconUrl: n.img,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
        className: 'collab-marker'
      });
    }

    const m = L.marker([n.lat, n.lon], { icon: icon }).bindPopup(elContent);
    m.addTo(markers);
  });

  // draw links (curved using leaflet-curve if available)
  (data.links || []).forEach(l => {
    const a = nodesById[l.from];
    const b = nodesById[l.to];
    if (!a || !b) return;

    // style by type
    const style = { color: l.type === 'collab' ? '#2b8cff' : '#999', weight: 2, opacity: 0.8 };
    // if leaflet-curve available, draw curve
    if (L.Curve) {
      const latlngs = [[a.lat, a.lon], [(a.lat + b.lat) / 2 + 5, (a.lon + b.lon) / 2], [b.lat, b.lon]];
      // simple polyline fallback
      L.curve(
        ['M', latlngs[0], 'Q', latlngs[1], latlngs[2]],
        { color: style.color, weight: style.weight, opacity: style.opacity }
      ).addTo(lines);
    } else {
      L.polyline([[a.lat, a.lon], [b.lat, b.lon]], style).addTo(lines);
    }
  });

  // fit bounds to show all markers
  const group = L.featureGroup(Object.values(markers._layers || {}));
  if (group.getBounds && group.getBounds().isValid()) {
    map.fitBounds(group.getBounds().pad(0.2));
  }
});
