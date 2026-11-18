import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import type { Database } from './db.js';

const category = z.enum(['health','education','economy']);
const regionCode = z.string().regex(/^12[0-9]{2}$/);
const facilityId = z.string().regex(/^[nw][0-9]+$/);
const center = z.tuple([z.number().min(95).max(102), z.number().min(-2).max(6)]);
const radiusInput = z.object({
  center, radiusKm: z.number().min(.1).max(100), category: category.optional(),
  limit: z.number().int().min(1).max(5000).default(50),
});
const nearestInput = z.object({ center, category: category.optional(), limit: z.number().int().min(1).max(100).default(10) });
const compareInput = z.object({ a: regionCode, b: regionCode }).refine(x => x.a !== x.b, 'Pilih dua wilayah berbeda.');
const filter = z.object({
  category: category.optional(), region: regionCode.optional(), q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  bbox: z.string().optional().transform(value => value?.split(',').map(Number)).refine(value =>
    !value || (value.length === 4 && value.every(Number.isFinite) && value[0] >= -180 && value[2] <= 180 &&
      value[1] >= -90 && value[3] <= 90 && value[0] < value[2] && value[1] < value[3]), 'Gunakan bbox barat,selatan,timur,utara.'),
});

const featureRegion = "jsonb_build_object('type','Feature','geometry',ST_AsGeoJSON(r.geom)::jsonb,'properties',to_jsonb(s))";
const featureFacility = "jsonb_build_object('type','Feature','geometry',ST_AsGeoJSON(f.geom)::jsonb,'properties'," +
  "jsonb_build_object('id',f.id,'name',f.name,'category',f.category,'subtype',f.subtype,'region_code',f.region_code,'osm_type',f.osm_type))";
const method = 'PostGIS geography · garis lurus pada bumi bulat';

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
const invalid = (message: string) => new HttpError(400, 'INVALID_INPUT', message);
const missing = () => new HttpError(404, 'NOT_FOUND', 'Data yang diminta belum tersedia.');

function decode<T>(schema: z.ZodType<T>, value: unknown) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw invalid(parsed.error.issues[0]?.message ?? 'Parameter tidak valid.');
  return parsed.data;
}

export function createApp(db: Database) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    res.set('X-Request-Id', res.locals.requestId);
    res.set('X-Content-Type-Options','nosniff');
    res.set('Referrer-Policy','strict-origin-when-cross-origin');
    next();
  });
  const api = express.Router();
  api.use((req, res, next) => {
    const origin = process.env.WEB_ORIGIN;
    if (origin && req.get('Origin') === origin) {
      res.set('Access-Control-Allow-Origin', origin);
      res.vary('Origin');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    }
    next();
  });
  api.use(express.json({ limit: '24kb' }));
  api.use(rateLimit({
    windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req,res) => res.status(429).json({ code:'RATE_LIMIT', message:'Terlalu banyak permintaan. Coba lagi dalam satu menit.', requestId:res.locals.requestId }),
  }));
  const collection = (rows: { feature: unknown }[]) => ({ type:'FeatureCollection', features:rows.map(row => row.feature) });

  api.get('/health', async (_req, res) => {
    const { rows } = await db.query<{ postgis: string }>('SELECT PostGIS_Version() AS postgis');
    res.json({ status:'ok', database:'PostgreSQL', postgis:rows[0].postgis });
  });
  api.get('/regions', async (_req, res) => {
    const { rows } = await db.query<{ feature: unknown }>('SELECT ' + featureRegion + ' AS feature FROM regions r JOIN region_statistics s USING (code) ORDER BY r.code');
    res.json(collection(rows));
  });
  api.get('/regions/:code', async (req, res) => {
    const { rows } = await db.query<{ feature: unknown }>('SELECT ' + featureRegion + ' AS feature FROM regions r JOIN region_statistics s USING (code) WHERE r.code=$1', [decode(regionCode,req.params.code)]);
    if (!rows[0]) throw missing();
    res.json(rows[0].feature);
  });
  api.get('/facilities', async (req, res) => {
    const input = decode(filter, req.query);
    const params: unknown[] = [];
    const conditions: string[] = [];
    const param = (value: unknown) => { params.push(value); return '$' + params.length; };
    if (input.category) conditions.push('f.category=' + param(input.category));
    if (input.region) conditions.push('f.region_code=' + param(input.region));
    if (input.q) conditions.push("strpos(lower(coalesce(f.name,'')),lower(" + param(input.q) + '))>0');
    if (input.bbox) conditions.push('ST_Intersects(f.geom,ST_MakeEnvelope(' + input.bbox.map(param).join(',') + ',4326))');
    const clauses = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await db.query<{ feature: unknown }>('SELECT ' + featureFacility + ' AS feature FROM facilities f' +
      clauses + ' ORDER BY f.id LIMIT ' + param(input.limit) + ' OFFSET ' + param(input.offset),params);
    res.json(collection(rows));
  });
  api.get('/facilities/:id', async (req, res) => {
    const { rows } = await db.query<{ feature: unknown }>('SELECT ' + featureFacility + ' AS feature FROM facilities f WHERE f.id=$1', [decode(facilityId,req.params.id)]);
    if (!rows[0]) throw missing();
    res.json(rows[0].feature);
  });
  api.get('/categories', (_req, res) => {
    res.json([{ id:'health', name:'Kesehatan' }, { id:'education', name:'Pendidikan' }, { id:'economy', name:'Ekonomi' }]);
  });
  api.get('/statistics/summary', async (_req, res) => {
    const { rows } = await db.query('SELECT count(*)::int AS regions, sum(total)::int AS facilities, sum(health)::int AS health, sum(education)::int AS education, sum(economy)::int AS economy, (SELECT count(*)::int FROM datasets) AS datasets FROM region_statistics');
    res.json(rows[0]);
  });
  api.get('/statistics/regions', async (_req, res) => {
    res.json((await db.query('SELECT * FROM region_statistics ORDER BY code')).rows);
  });
  api.get('/indicators', (_req, res) => {
    res.json(['total','health','education','economy'].map(key => ({ id:key, unit:'titik fasilitas terpetakan', aggregate:'count' })));
  });
  api.get('/datasets', async (_req, res) => {
    const { rows } = await db.query<{ metadata: unknown }>('SELECT metadata FROM datasets ORDER BY id');
    res.json(rows.map(r => r.metadata));
  });
  api.post('/analysis/radius', async (req,res) => {
    const input = decode(radiusInput,req.body);
    const { rows } = await db.query<{ facility: unknown; meters: number; count: number }>(
      'WITH origin AS (SELECT ST_SetSRID(ST_MakePoint($1,$2),4326)::geography AS geog) ' +
      'SELECT ' + featureFacility + ' AS facility, ST_Distance(f.geog,o.geog,false) AS meters, count(*) OVER ()::int AS count ' +
      'FROM facilities f CROSS JOIN origin o WHERE ST_DWithin(f.geog,o.geog,$3,false) AND ($4::text IS NULL OR f.category=$4) ' +
      'ORDER BY meters,f.id LIMIT $5',
      [...input.center, input.radiusKm * 1000, input.category ?? null, input.limit]);
    res.json({ center: input.center, radiusKm: input.radiusKm, method, total:rows[0]?.count ?? 0,
      hits:rows.map(({facility,meters}) => ({facility,meters})) });
  });
  api.post('/analysis/nearest', async (req,res) => {
    const input = decode(nearestInput,req.body);
    const { rows } = await db.query(
      'SELECT ' + featureFacility + ' AS facility, f.geog <-> ST_SetSRID(ST_MakePoint($1,$2),4326)::geography AS meters ' +
      'FROM facilities f WHERE ($3::text IS NULL OR f.category=$3) ORDER BY meters,f.id LIMIT $4',
      [...input.center,input.category ?? null,input.limit]);
    res.json({ center:input.center, method, hits:rows });
  });
  api.post('/analysis/compare', async (req,res) => {
    const { a,b } = decode(compareInput,req.body);
    type Stat = { code:string; total:number; health:number; education:number; economy:number; area_km2:number };
    const { rows } = await db.query<Stat>('SELECT * FROM region_statistics WHERE code=$1 OR code=$2',[a,b]);
    const left=rows.find(r => r.code===a), right=rows.find(r => r.code===b);
    if (!left || !right) throw missing();
    const diff=Object.fromEntries((['health','education','economy','total','area_km2'] as const).map(k => [k,left[k]-right[k]]));
    res.json({ a:left, b:right, difference:diff, unit:'titik fasilitas terpetakan; luas dalam km²' });
  });
  api.use((_req,_res,next) => next(missing()));
  app.use('/api/v1',api);

  const dist = fileURLToPath(new URL('../dist', import.meta.url));
  if (existsSync(dist)) app.use(express.static(dist));
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = err instanceof HttpError ? err.status : err instanceof SyntaxError ? 400 :
      typeof err === 'object' && err && 'status' in err && err.status === 413 ? 413 : 500;
    const code = err instanceof HttpError ? err.code : status === 400 ? 'INVALID_JSON' : status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR';
    const message = err instanceof HttpError ? err.message : status === 400 ? 'JSON tidak valid.' :
      status === 413 ? 'Badan permintaan terlalu besar.' : 'Layanan belum dapat menyelesaikan permintaan.';
    if (status === 500) console.error(JSON.stringify({ level:'error', requestId:res.locals.requestId, code }));
    res.status(status).json({ code,message,requestId:res.locals.requestId });
  });
  return app;
}
