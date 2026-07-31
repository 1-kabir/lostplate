const express = require('express');
const { supabaseAdmin } = require('../db');
const router = express.Router();

// Haversine formula to compute distance in km between two geo-coordinates
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// POST /api/match
// Smart Match engine to score and suggest top 3 verified NGOs for a food listing
router.post('/', async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' });
    }

    // 1. Fetch listing details
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // 2. Fetch all verified NGOs
    const { data: ngos, error: ngosError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('type', 'ngo')
      .eq('verified', true);

    if (ngosError) {
      return res.status(500).json({ error: 'Failed to fetch NGOs' });
    }

    const scoredNgos = ngos.map((ngo) => {
      // Metric A: Distance (40%)
      const distance = getDistanceKm(listing.lat, listing.lng, ngo.lat, ngo.lng);
      // Inverse distance score, clamped to prevent division by zero
      const distanceScore = Math.max(0, 1 / (distance + 0.1));

      // Metric B: Preference match (30%)
      // If the listing's category matches the NGO's preferred food types
      const prefersFood = ngo.food_prefs ? ngo.food_prefs.includes(listing.category) : true;
      const preferenceScore = prefersFood ? 1 : 0.2;

      // Metric C: Capacity headroom (20%)
      // Higher capacity = higher score
      const capacityScore = Math.min(1, ngo.max_capacity_kg / 200);

      // Metric D: Proximity filter boundary
      const inRadius = distance <= (ngo.pickup_radius_km || 15);

      // Composite Score computation
      // Score = (distanceScore * 0.4) + (preferenceScore * 0.3) + (capacityScore * 0.2)
      let finalScore = (distanceScore * 0.4) + (preferenceScore * 0.3) + (capacityScore * 0.2);

      // Penalize if the NGO is outside their selected pickup radius range
      if (!inRadius) {
        finalScore *= 0.5;
      }

      return {
        ngo: {
          id: ngo.id,
          name: ngo.name,
          address: ngo.address,
          distance: `${distance.toFixed(1)} km`,
        },
        score: finalScore,
      };
    });

    // Sort descending by score and pick top 3
    const topMatches = scoredNgos
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.ngo);

    return res.json({ matches: topMatches });
  } catch (err) {
    console.error('Match engine failure:', err);
    return res.status(500).json({ error: 'Internal match logic error' });
  }
});

module.exports = router;
