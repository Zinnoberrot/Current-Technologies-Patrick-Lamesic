const { Pool } = require('pg');
const questions = require('./questions.json');

// zugangsdaten nur aus env variablen
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS questions (
    id       INTEGER PRIMARY KEY,
    part     TEXT    NOT NULL,
    num      INTEGER NOT NULL,
    title    TEXT    NOT NULL,
    prompt   TEXT,
    options  JSONB   NOT NULL,
    correct  TEXT[]  NOT NULL,
    expl     JSONB   NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id          SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id),
    picks       TEXT[]  NOT NULL,
    verdict     TEXT    NOT NULL CHECK (verdict IN ('full','partial','miss')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS results (
    id          SERIAL PRIMARY KEY,
    player      TEXT    NOT NULL,
    question_set TEXT   NOT NULL,
    total       INTEGER NOT NULL CHECK (total > 0),
    full_count  INTEGER NOT NULL,
    partial_count INTEGER NOT NULL,
    miss_count  INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

// postgres braucht beim ersten start etwas, deshalb mehrmals versuchen
async function waitForDb(retries = 20) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`Datenbank noch nicht erreichbar (Versuch ${i}/${retries}): ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Datenbank nicht erreichbar');
}

// schema anlegen und fragen einspielen
async function init() {
  await waitForDb();
  await pool.query(SCHEMA);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [i, q] of questions.entries()) {
      await client.query(
        `INSERT INTO questions (id, part, num, title, prompt, options, correct, expl)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           part = EXCLUDED.part, num = EXCLUDED.num, title = EXCLUDED.title, prompt = EXCLUDED.prompt,
           options = EXCLUDED.options, correct = EXCLUDED.correct, expl = EXCLUDED.expl`,
        [i + 1, q.part, q.num, q.title, q.prompt, q.options, q.correct, q.expl]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  console.log(`${questions.length} Fragen in der Datenbank`);
}

module.exports = { pool, init };
