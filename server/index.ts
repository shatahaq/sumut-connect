import { createApp } from './app.js';
import { openDatabase } from './db.js';

const port = Number(process.env.PORT || 4174);
const db = await openDatabase();
const server = createApp(db).listen(port, process.env.HOST || '127.0.0.1', () => {
  console.log('SUMUT CONNECT API aktif pada port ' + port);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => { void db.close(); }));
}
