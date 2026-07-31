const express = require('express');
const { supabaseAdmin } = require('../db');
const router = express.Router();

// FoodPrint formulas from the feature spec — kept in one place so the pitch
// numbers and the on-screen numbers can never drift apart.
const CO2_PER_KG = 2.5;
const WATER_L_PER_KG = 1000;
const MEALS_PER_KG = 3;

// GET /api/impact/:userId
// Computes real FoodPrint stats by summing COMPLETED claims — i.e. food that
// was actually picked up, not merely listed or reserved. Queried directly
// against claims/listings via the service-role client rather than the
// donor_impact/ngo_impact SQL views (see migrations/001_*.sql) so this still
// works even on a project where that migration hasn't been applied yet.
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, type, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let totalKg = 0;
    let partnerCount = 0;

    if (user.type === 'donor') {
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('id')
        .eq('donor_id', userId);

      const listingIds = (listings ?? []).map((l) => l.id);

      if (listingIds.length > 0) {
        const { data: claims } = await supabaseAdmin
          .from('claims')
          .select('qty_claimed_kg, ngo_id')
          .in('listing_id', listingIds)
          .eq('status', 'completed');

        totalKg = (claims ?? []).reduce((sum, c) => sum + (c.qty_claimed_kg || 0), 0);
        partnerCount = new Set((claims ?? []).map((c) => c.ngo_id)).size;
      }
    } else {
      const { data: claims } = await supabaseAdmin
        .from('claims')
        .select('qty_claimed_kg, listing_id')
        .eq('ngo_id', userId)
        .eq('status', 'completed');

      totalKg = (claims ?? []).reduce((sum, c) => sum + (c.qty_claimed_kg || 0), 0);

      const listingIds = [...new Set((claims ?? []).map((c) => c.listing_id))];
      if (listingIds.length > 0) {
        const { data: listings } = await supabaseAdmin
          .from('listings')
          .select('donor_id')
          .in('id', listingIds);
        partnerCount = new Set((listings ?? []).map((l) => l.donor_id)).size;
      }
    }

    return res.json({
      totalKg,
      mealsEnabled: Math.round(totalKg * MEALS_PER_KG),
      co2SavedKg: Math.round(totalKg * CO2_PER_KG * 10) / 10,
      waterSavedL: Math.round(totalKg * WATER_L_PER_KG),
      partnerCount,
      memberSince: user.created_at,
    });
  } catch (err) {
    console.error('Impact calculation failure:', err);
    return res.status(500).json({ error: 'Internal impact calculation error' });
  }
});

module.exports = router;
