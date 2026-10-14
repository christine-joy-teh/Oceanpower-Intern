import { createRequire } from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
require('../server.js');
const repository=require('../cms/repository.js');
if(!repository.configured())throw new Error('Set MYSQL_DATABASE, MYSQL_USER and the other MYSQL_* values in .env first.');
await repository.migrate();
console.log('Oceanpower CMS database tables are ready.');
