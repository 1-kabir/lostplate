const express = require('express');
const { supabaseAdmin } = require('../db');
const { sendExpoPush } = require('../lib/push');
const router = express.Router();

// POST /api/claims/verify
// Validate QR token upon NGO arrival and finalize verification.
//
// NOTE: qty_remaining_kg is reserved atomically at CLAIM time via the
// create_claim() Postgres function (server/migrations/001_*.sql), not here.
// This endpoint only marks the claim as physically completed and, once every
// claim against a listing has been picked up, flips the listing to
// 'collected'. Earlier logic decremented qty_remaining_kg a second time in
// this handler, which double-counted every pickup — fixed by removing it.
router.post('/verify', async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ error: 'qrToken is required' });
    }

    const { data: claim, error: claimError } = await supabaseAdmin
      .from('claims')
      .select('*')
      .eq('qr_token', qrToken)
      .eq('status', 'confirmed')
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ error: 'Valid claim reservation not found' });
    }

    const { error: updateClaimErr } = await supabaseAdmin
      .from('claims')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', claim.id);

    if (updateClaimErr) {
      return res.status(500).json({ error: 'Failed to update claim state' });
    }

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', claim.listing_id)
      .single();

    if (listing) {
      // A listing is only fully 'collected' once nothing is left to give AND
      // every other claim against it has also been physically picked up.
      const { data: outstandingClaims } = await supabaseAdmin
        .from('claims')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('status', 'confirmed');

      const nothingLeftToPickUp = listing.qty_remaining_kg <= 0 && (outstandingClaims ?? []).length === 0;

      if (nothingLeftToPickUp && listing.status !== 'collected') {
        await supabaseAdmin.from('listings').update({ status: 'collected' }).eq('id', listing.id);
      }

      // Let the donor know their food actually made it out the door.
      const { data: donor } = await supabaseAdmin
        .from('users')
        .select('expo_push_token')
        .eq('id', listing.donor_id)
        .single();

      if (donor?.expo_push_token) {
        await sendExpoPush(
          donor.expo_push_token,
          'Pickup verified',
          `${listing.food_name} (${claim.qty_claimed_kg}kg) was picked up successfully.`,
          { type: 'pickup_verified', listingId: listing.id }
        );
      }
    }

    return res.json({ success: true, message: 'Pickup verification completed successfully' });
  } catch (err) {
    console.error('QR verification failure:', err);
    return res.status(500).json({ error: 'Internal verification loop error' });
  }
});

module.exports = router;
