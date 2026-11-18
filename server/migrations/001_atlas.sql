CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS datasets (
  id text PRIMARY KEY,
  metadata jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS regions (
  code text PRIMARY KEY CHECK (code ~ '^12[0-9]{2}$'),
  name text NOT NULL,
  source_id text NOT NULL UNIQUE,
  area_km2 double precision NOT NULL CHECK (area_km2 > 0),
  geom geometry(MultiPolygon, 4326) NOT NULL
);
CREATE TABLE IF NOT EXISTS facilities (
  id text PRIMARY KEY CHECK (id ~ '^[nw][0-9]+$'),
  name text,
  category text NOT NULL CHECK (category IN ('health', 'education', 'economy')),
  subtype text NOT NULL,
  region_code text NOT NULL REFERENCES regions(code),
  osm_type text NOT NULL CHECK (osm_type IN ('node', 'way')),
  geom geometry(Point, 4326) NOT NULL,
  geog geography(Point, 4326) GENERATED ALWAYS AS (geom::geography) STORED
);
CREATE INDEX IF NOT EXISTS regions_geom_idx ON regions USING gist (geom);
CREATE INDEX IF NOT EXISTS facilities_region_category_idx ON facilities (region_code, category);
CREATE INDEX IF NOT EXISTS facilities_category_idx ON facilities (category);
CREATE INDEX IF NOT EXISTS facilities_geom_idx ON facilities USING gist (geom);
CREATE INDEX IF NOT EXISTS facilities_geog_idx ON facilities USING gist (geog);

CREATE OR REPLACE VIEW region_statistics AS
SELECT r.code, r.name, r.source_id, r.area_km2,
       count(f.id) FILTER (WHERE f.category = 'health')::integer AS health,
       count(f.id) FILTER (WHERE f.category = 'education')::integer AS education,
       count(f.id) FILTER (WHERE f.category = 'economy')::integer AS economy,
       count(f.id)::integer AS total
FROM regions r LEFT JOIN facilities f ON f.region_code = r.code
GROUP BY r.code;
