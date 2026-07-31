const express = require('express');
const { supabaseAdmin } = require('../db');
const { sendExpoPush } = require('../lib/push');
const router = express.Router();

// POST /api/notify/register
// Stores (or clears, when token is null) this device's Expo push token
// against the signed-in user's profile row.
router.post('/register', async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ expo_push_token: token ?? null })
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to store push token' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Push token registration failure:', err);
    return res.status(500).json({ error: 'Internal registration error' });
  }
});

// POST /api/notify/send
// Looks up a user's stored push token and delivers a notification. Used by
// the app right after a claim is confirmed, so the donor hears about it in
// real time even though the reservation itself was written directly to
// Supabase from the NGO's device.
router.post('/send', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title and body are required' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('expo_push_token')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await sendExpoPush(user.expo_push_token, title, body, data ?? {});
    return res.json({ success: !result.skipped, ...result });
  } catch (err) {
    console.error('Push send failure:', err);
    return res.status(500).json({ error: 'Internal notify error' });
  }
});

module.exports = router;
