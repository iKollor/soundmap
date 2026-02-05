-- PostGIS setup for sounds table
-- Run AFTER drizzle push creates the base tables

-- Add geometry column to sounds table
ALTER TABLE sounds ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- Create trigger function to auto-populate geom from lat/lng
CREATE OR REPLACE FUNCTION update_sound_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on sounds table
DROP TRIGGER IF EXISTS sounds_geom_trigger ON sounds;
CREATE TRIGGER sounds_geom_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude ON sounds
  FOR EACH ROW
  EXECUTE FUNCTION update_sound_geom();

-- Create spatial GIST index for fast geospatial queries
CREATE INDEX IF NOT EXISTS sounds_geom_idx ON sounds USING GIST (geom);

-- Backfill existing records (if any)
UPDATE sounds SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
