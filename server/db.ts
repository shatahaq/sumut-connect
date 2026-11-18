import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { postgis } from '@electric-sql/pglite-postgis';
import pg from 'pg';

type Row = Record<string, unknown>;
export interface Database {
  query: <T extends Row = Row>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  close: () => Promise<void>;
}
const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');
const readData = async (name: string) => JSON.parse(await read('../public/data/' + name));

export async function openDatabase(url = process.env.DATABASE_URL): Promise<Database> {
  const pool = url ? new pg.Pool({ connectionString: url, max: 8, connectionTimeoutMillis: 8000, statement_timeout: 10000 }) : null;
  const client = pool ? await pool.connect() : null;
  const local = pool ? null : new PGlite({ extensions: { postgis } });
  const run = (sql: string, params: unknown[] = []) => client ? client.query(sql, params) : local!.query(sql, params);
  try {
    const migration = await read('./migrations/001_atlas.sql');
    if (local) await local.exec(migration);
    else await client!.query(migration);

    const [regions, health, education, economy, datasets] = await Promise.all([
      readData('sumut_regions.geojson'), readData('facilities_health.geojson'), readData('facilities_education.geojson'),
      readData('facilities_economy.geojson'), readData('datasets.json'),
    ]);
    await run('BEGIN');
    try {
      await run("SELECT pg_advisory_xact_lock(338401)");
      await run('DELETE FROM facilities');
      await run('DELETE FROM regions');
      await run('DELETE FROM datasets');
      await run(
        "INSERT INTO regions SELECT p->>'code',p->>'name',p->>'source_id',(p->>'area_km2')::double precision,ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(geom),4326)) " +
        "FROM jsonb_to_recordset($1::jsonb) AS f(properties jsonb,geometry jsonb) CROSS JOIN LATERAL (SELECT properties AS p, geometry AS geom) q",
        [JSON.stringify(regions.features)]);
      await run(
        "INSERT INTO facilities (id,name,category,subtype,region_code,osm_type,geom) " +
        "SELECT p->>'id',p->>'name',p->>'category',p->>'subtype',p->>'region_code',p->>'osm_type',ST_SetSRID(ST_GeomFromGeoJSON(geom),4326) " +
        "FROM jsonb_to_recordset($1::jsonb) AS f(properties jsonb,geometry jsonb) CROSS JOIN LATERAL (SELECT properties AS p, geometry AS geom) q",
        [JSON.stringify([...health.features,...education.features,...economy.features])]);
      await run("INSERT INTO datasets SELECT d->>'id',d FROM jsonb_array_elements($1::jsonb) AS d", [JSON.stringify(datasets)]);
      await run('COMMIT');
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    client?.release();
    if (pool) await pool.end();
    else await local!.close();
    throw error;
  }
  client?.release();
  return {
    query: <T extends Row>(sql: string, params: unknown[] = []) => pool
      ? pool.query<T>(sql, params)
      : local!.query<T>(sql, params),
    close: () => pool ? pool.end() : local!.close(),
  };
}
