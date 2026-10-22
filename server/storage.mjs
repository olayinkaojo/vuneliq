import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import pg from 'pg';

// The server is the only database client. Never expose DATABASE_URL to the browser.
export async function createStore({url=process.env.DATABASE_URL,dir=process.env.DATA_DIR||'./data'}={}) {
  if(url){
    const connection=new URL(url);
    // Require certificate verification rather than allowing sslmode to weaken TLS.
    for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])connection.searchParams.delete(key);
    const pool=new pg.Pool({connectionString:connection.toString(),max:3,connectionTimeoutMillis:10000,ssl:{rejectUnauthorized:true,...(process.env.DATABASE_CA_CERT?{ca:process.env.DATABASE_CA_CERT.replaceAll('\\n','\n')}:{})}});
    pool.on('error',()=>console.error('Database pool connection failed'));
    const sql=s=>{let i=0;return s.replace(/\?/g,()=>'$'+(++i)).replace(/\b(workspace|users|sessions)\b/g,'vuneliq.$1')};
    const api=client=>({get:async(q,...params)=>(await client.query(sql(q),params)).rows[0],run:async(q,...params)=>client.query(sql(q),params)});
    await pool.query(`CREATE SCHEMA IF NOT EXISTS vuneliq; REVOKE ALL ON SCHEMA vuneliq FROM PUBLIC;
      CREATE TABLE IF NOT EXISTS vuneliq.workspace(id INTEGER PRIMARY KEY, version INTEGER NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS vuneliq.users(email TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL, donor TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS vuneliq.sessions(token TEXT PRIMARY KEY,email TEXT NOT NULL REFERENCES vuneliq.users(email),expires BIGINT NOT NULL);
      REVOKE ALL ON ALL TABLES IN SCHEMA vuneliq FROM PUBLIC;`);
    return {...api(pool),kind:'postgres',close:()=>pool.end(),transaction:async fn=>{const c=await pool.connect();try{await c.query('BEGIN');const result=await fn(api(c));await c.query('COMMIT');return result}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}};
  }
  if(process.env.REQUIRE_DATABASE_URL==='true')throw Error('DATABASE_URL is required; refusing temporary local storage.');
  mkdirSync(dir,{recursive:true});const db=new DatabaseSync(resolve(dir,'vuneliq.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS workspace(id INTEGER PRIMARY KEY,version INTEGER NOT NULL,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS users(email TEXT PRIMARY KEY,salt TEXT,hash TEXT,role TEXT,donor TEXT); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,email TEXT,expires INTEGER);`);
  const api={get:async(q,...params)=>db.prepare(q).get(...params),run:async(q,...params)=>db.prepare(q).run(...params)};
  let pending=Promise.resolve();
  return {...api,kind:'sqlite',close:async()=>db.close(),transaction:fn=>{const task=pending.then(async()=>{db.exec('BEGIN IMMEDIATE');try{const result=await fn(api);db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}});pending=task.catch(()=>{});return task}};
}
