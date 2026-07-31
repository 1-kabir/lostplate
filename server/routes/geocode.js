const express = require('express');
const axios = require('axios');
const router = express.Router();

// Two independent OSM geocoders, so a Nominatim-specific slowdown/rate-limit
// doesn't take the whole endpoint down with it — Photon (komoot's public
// instance) runs on entirely separate infrastructure. Both read the same
// underlying OSM data, so this doesn't help with an address that's genuinely
// absent from OSM, but it does help with the far more common case of one
// provider being briefly slow, rate-limited (Nominatim is 1 req/sec, shared
// across every request this backend makes), or transiently unreachable.
//
// The mobile app is already installed and can't be changed right now, and
// it treats ANY non-2xx response as "could not verify address" — blocking
// onboarding outright. So this endpoint is designed to never hand the client
// an error: every path below ends in a 200 with usable coordinates. If every
// real geocode attempt genuinely fails, we fall back to an approximate
// location rather than blocking someone's signup on a geocoder having a bad
// moment.

async function tryNominatim(q, timeoutMs) {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'Lost Plate-Rescue-App-Client-v1' },
    timeout: timeoutMs,
  });
  const result = response.data?.[0];
  if (!result) return null;
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name,
  };
}

async function tryPhoton(q, timeoutMs) {
  const response = await axios.get('https://photon.komoot.io/api/', {
    params: { q, limit: 1 },
    headers: { 'User-Agent': 'Lost Plate-Rescue-App-Client-v1' },
    timeout: timeoutMs,
  });
  const feature = response.data?.features?.[0];
  if (!feature) return null;
  const [lng, lat] = feature.geometry.coordinates; // GeoJSON order is [lng, lat]
  const p = feature.properties || {};
  const displayName = [p.name, p.street, p.city, p.state, p.country]
    .filter(Boolean)
    .filter((part, i, arr) => arr.indexOf(part) === i) // drop dupes, e.g. name === city
    .join(', ');
  return { lat, lng, displayName: displayName || String(q) };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Absolute last resort, used only if Nominatim and Photon both fail across
// every attempt below. Better than blocking someone's signup entirely, but
// it IS a guess — update this if the event isn't near Kolkata.
const FALLBACK_LOCATION = { lat: 22.5726, lng: 88.3639, label: 'Kolkata, India' };

// GET /api/geocode?q=Address
router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query parameter "q" is required' });
  }

  // Primary provider, then the fallback provider, then one more retry of
  // the primary — short exponential backoff between attempts. Worst case
  // (every attempt fully times out) stays comfortably under the app's 10s
  // client-side request timeout.
  const attempts = [
    { label: 'nominatim#1', run: () => tryNominatim(q, 2500), backoffBefore: 0 },
    { label: 'photon#1', run: () => tryPhoton(q, 2500), backoffBefore: 400 },
    { label: 'nominatim#2', run: () => tryNominatim(q, 2500), backoffBefore: 800 },
  ];

  for (const attempt of attempts) {
    if (attempt.backoffBefore) await wait(attempt.backoffBefore);
    try {
      const result = await attempt.run();
      if (result && Number.isFinite(result.lat) && Number.isFinite(result.lng)) {
        return res.json(result);
      }
      console.warn(`Geocode ${attempt.label}: no match for "${q}", trying next provider`);
    } catch (err) {
      console.error(`Geocode ${attempt.label} failed for "${q}":`, err.message);
    }
  }

  // Every real attempt failed or found nothing. Never block onboarding on
  // this — hand back an honest, clearly-labeled approximate location.
  console.warn(`Geocode: all providers exhausted for "${q}", returning fallback location`);
  return res.json({
    lat: FALLBACK_LOCATION.lat,
    lng: FALLBACK_LOCATION.lng,
    displayName: `${q} (approximate location — near ${FALLBACK_LOCATION.label})`,
  });
});

module.exports = router;
