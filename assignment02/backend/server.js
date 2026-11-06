const express = require('express');
const { pool, init } = require('./db');

const app = express();
app.use(express.json({ limit: '10kb' }));

const LETTERS = ['A', 'B', 'C', 'D'];

// gleiche bewertung wie im quiz
function evaluate(correct, picks) {
  const c = new Set(correct);
  const mine = new Set(picks);
  const allRight = [...c].every(x => mine.has(x));
  const noWrong = [...mine].every(x => c.has(x));
  if (allRight && noWrong) return 'full';
  if ([...mine].some(x => c.has(x))) return 'partial';
  return 'miss';
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'db_unavailable' });
  }
});

// fragen ohne lösung, geprüft wird über /api/check
app.get('/api/questions', async (req, res, next) => {
  try {
    const { part } = req.query;
    const { rows } = await pool.query(
      `SELECT id, part, num, title, prompt, options FROM questions
       WHERE $1::text IS NULL OR part = $1 ORDER BY id`,
      [part || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

app.get('/api/parts', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT part, COUNT(*)::int AS count FROM questions GROUP BY part ORDER BY MIN(id)'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// antwort prüfen und versuch speichern
app.post('/api/check', async (req, res, next) => {
  try {
    const { questionId, picks } = req.body || {};
    if (!Number.isInteger(questionId) || !Array.isArray(picks) || picks.length === 0 ||
        !picks.every(p => LETTERS.includes(p)) || new Set(picks).size !== picks.length) {
      return res.status(400).json({ error: 'questionId (Zahl) und picks (A–D, mind. eine) erforderlich' });
    }
    const { rows } = await pool.query('SELECT correct, expl FROM questions WHERE id = $1', [questionId]);
    if (!rows.length) return res.status(404).json({ error: 'Frage nicht gefunden' });

    const { correct, expl } = rows[0];
    const verdict = evaluate(correct, picks);
    await pool.query(
      'INSERT INTO attempts (question_id, picks, verdict) VALUES ($1, $2, $3)',
      [questionId, picks, verdict]
    );
    const stats = await pool.query(
      `SELECT COUNT(*)::int AS attempts,
              COUNT(*) FILTER (WHERE verdict = 'full')::int AS full
       FROM attempts WHERE question_id = $1`,
      [questionId]
    );
    res.json({ verdict, correct, expl, stats: stats.rows[0] });
  } catch (err) { next(err); }
});

app.post('/api/results', async (req, res, next) => {
  try {
    const { player, questionSet, total, full, partial, miss } = req.body || {};
    const name = typeof player === 'string' ? player.trim() : '';
    const counts = [total, full, partial, miss];
    if (!name || name.length > 40 || typeof questionSet !== 'string' || questionSet.length > 100 ||
        !counts.every(n => Number.isInteger(n) && n >= 0) || total === 0 || full + partial + miss !== total) {
      return res.status(400).json({ error: 'Ungültiges Ergebnis' });
    }
    const { rows } = await pool.query(
      `INSERT INTO results (player, question_set, total, full_count, partial_count, miss_count)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [name, questionSet, total, full, partial, miss]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// beste quote zuerst, bei gleichstand mehr fragen, dann das frühere ergebnis
app.get('/api/leaderboard', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT player, question_set, total, full_count,
              ROUND(100.0 * full_count / total)::int AS pct, created_at
       FROM results
       ORDER BY full_count::float / total DESC, total DESC, created_at ASC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interner Fehler' });
});

const PORT = Number(process.env.PORT || 3000);

init()
  .then(() => app.listen(PORT, () => console.log(`API läuft auf Port ${PORT}`)))
  .catch(err => {
    console.error('Start fehlgeschlagen:', err);
    process.exit(1);
  });
