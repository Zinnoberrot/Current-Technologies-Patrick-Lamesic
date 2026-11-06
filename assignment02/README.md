# Assignment 2 – DSGVO Lernquiz im Container

Ein Lernquiz mit 60 Fragen zur DSGVO. Die Anwendung besteht aus drei Containern, die mit Docker Compose gestartet werden.

## Aufbau

| Container | Technologie | Aufgabe |
|---|---|---|
| `frontend` | nginx | liefert die Quiz-Seite aus und leitet `/api` an das Backend weiter |
| `backend` | Node.js / Express | API für Fragen, Auswertung der Antworten und Bestenliste |
| `db` | PostgreSQL | speichert Fragen, Antworten und Ergebnisse |

Für `frontend` und `backend` gibt es jeweils ein eigenes Dockerfile. Die Daten der Datenbank liegen im benannten Volume `quiz-data` und bleiben auch nach `docker compose down` erhalten.

## Starten

Voraussetzung: Docker mit Docker Compose.

```bash
cp .env.example .env        # danach POSTGRES_PASSWORD in .env ändern
docker compose up -d --build
```

Danach im Browser öffnen: http://localhost:8080

- Stoppen: `docker compose down`
- Stoppen und Daten löschen: `docker compose down -v`

## Passwörter

Im `docker-compose.yml` steht kein Passwort, sondern nur die Variable `${POSTGRES_PASSWORD}`. Der Wert wird aus der Datei `.env` gelesen. Diese ist in der `.gitignore` eingetragen und wird daher nicht ins Repository übernommen. Als Vorlage dient `.env.example`.

Hinweis: Postgres übernimmt das Passwort nur beim ersten Start. Wird es danach in `.env` geändert, muss die Datenbank mit `docker compose down -v` zurückgesetzt werden.

## API

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/questions` | Fragen (ohne Lösung) |
| GET | `/api/parts` | Themenbereiche |
| POST | `/api/check` | Antwort prüfen, liefert Lösung und Begründungen |
| POST | `/api/results` | Ergebnis einer Runde speichern |
| GET | `/api/leaderboard` | Bestenliste |
| GET | `/api/health` | Health-Check |

## Zusätzlich umgesetzt

- Getrennte Netzwerke: Das Frontend erreicht nur das Backend, die Datenbank ist nur für das Backend erreichbar. Nach außen ist nur Port 8080 offen.
- Healthchecks für Datenbank und Backend. Die Container starten erst, wenn der jeweils vorherige bereit ist (db → backend → frontend).
- Das Backend läuft im Container nicht als root, sondern als eingeschränkter Benutzer.
- Die Lösungen bleiben auf dem Server. Der Browser bekommt sie erst nach dem Prüfen einer Antwort, ungültige Eingaben lehnt die API ab.
