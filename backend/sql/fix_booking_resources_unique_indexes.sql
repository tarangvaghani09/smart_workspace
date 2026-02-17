-- Fix booking_resources unique indexes so split allocations are allowed.
-- Expected unique rule:
--   (bookingId, resourceId, fromRoomId, toRoomId)
-- and NOT unique bookingId alone / resourceId alone.

-- 1) Drop wrong single-column unique indexes if they exist.
-- Note: index names may differ by DB. Adjust names if needed after SHOW INDEX.
ALTER TABLE booking_resources DROP INDEX bookingId;
ALTER TABLE booking_resources DROP INDEX resourceId;

-- 2) Drop previous composite (if any) to recreate cleanly.
ALTER TABLE booking_resources DROP INDEX booking_resources_booking_id_resource_id_from_room_id_to_room_id;

-- 3) Create correct composite unique index.
ALTER TABLE booking_resources
  ADD UNIQUE INDEX uq_booking_resources_alloc
  (bookingId, resourceId, fromRoomId, toRoomId);

-- 4) Optional check.
SHOW INDEX FROM booking_resources;
