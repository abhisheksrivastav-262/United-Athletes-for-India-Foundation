-- ============================================================================
-- Migration: 20261010000003_remove_community_sports_meet_photo.sql
-- Removes the "Community Sports Meet" gallery card (India-jersey huddle photo)
-- from homepage gallery + /gallery page. Safe to re-run (idempotent).
-- ============================================================================

DELETE FROM public.gallery
WHERE slug = 'community-huddle'
   OR title ILIKE 'Community Sports Meet'
   OR (title ILIKE 'Community huddle' AND image_url = '/assets/community.jpg');
