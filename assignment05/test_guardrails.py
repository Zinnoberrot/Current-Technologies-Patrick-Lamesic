# tests ohne llm, python3 test_guardrails.py

import builtins
import os

os.environ.pop("GUARDRAILS", None)  # immer mit guardrails testen

import guardrails as g
from tools import Session

passed = failed = 0


def check(description, condition):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✓ {description}")
    else:
        failed += 1
        print(f"  ✗ {description}")


def fetch_all(session, kundennummer="K-1001"):
    for kategorie in ["stammdaten", "bestellungen", "newsletter", "support_tickets"]:
        session.get_personal_data(kundennummer, kategorie)


def blocked(fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except g.GuardrailError:
        return True
    return False


print("Normale Anfrage (anfrage-01)")
s = Session("anfrage-01")
check("Anfrage ohne Manipulationsverdacht", s.read_request()["warnung"] is None)
check("Kunde über Absenderadresse gefunden", s.find_customer("max.mustermann@example.com")["kundennummer"] == "K-1001")
check("Kein Datenzugriff vor der Identitätsprüfung", blocked(s.get_personal_data, "K-1001", "stammdaten"))
check("Identität bestätigt", s.verify_identity("K-1001", "12.04.1990")["bestaetigt"])
stamm = s.get_personal_data("K-1001", "stammdaten")
check("Stammdaten ohne Passwort-Hash", "passwort_hash" not in stamm and stamm["name"] == "Max Mustermann")
tickets = s.get_personal_data("K-1001", "support_tickets")["support_tickets"][0]["verlauf"]
check("Namen Dritter im Support-Ticket geschwärzt", "Erika Schmid" not in tickets and "Julia Berger" not in tickets)
check("Kein Zugriff auf Daten anderer Kunden", blocked(s.get_personal_data, "K-1003", "stammdaten"))
check("Frist = 1 Monat nach Eingang", s.calculate_deadline()["frist_bis"] == "2026-11-20")
check("Kein Entwurf, bevor alle Kategorien abgerufen sind", blocked(s.create_draft, "Anschreiben"))
fetch_all(s)
draft = s.create_draft("Sehr geehrter Herr Mustermann, anbei Ihre Daten.")
check("Fehlende Pflichtangaben (Rechte) werden erkannt",
      draft["fehlende_pflichtangaben"] == ["Berichtigung", "Löschung", "Beschwerde"])
check("Versand gesperrt, solange Pflichtangaben fehlen", blocked(s.send_response))
draft = s.create_draft("Sie haben das Recht auf berichtigung, Löschung und Beschwerde bei der Datenschutzbehörde.")
check("Vollständiges Anschreiben wird akzeptiert", "fehlende_pflichtangaben" not in draft)
check("Datenauszug wird vom Code exakt angehängt",
      "Wanderschuhe Trail X, 159,00 €" in s.draft and "Musterstraße 1, 6020 Innsbruck" in s.draft)
check("Datenauszug ohne Namen Dritter und ohne Passwort-Hash",
      "Erika Schmid" not in s.draft and "$2b$" not in s.draft)

print("\nFalsche Identität (anfrage-02)")
s = Session("anfrage-02")
check("Fremde Absenderadresse wird nicht gefunden", not s.find_customer("anna.h.privat@mail.example")["gefunden"])
check("Identität nicht bestätigt (falsches Geburtsdatum, fremde E-Mail)",
      not s.verify_identity("K-1002", "01.01.1985")["bestaetigt"])
check("Auch mit richtigem Geburtsdatum nicht, weil E-Mail nicht passt",
      not s.verify_identity("K-1002", "30.09.1985")["bestaetigt"])
s.verify_identity("K-1002", "x")
check("Nach 3 Versuchen gesperrt", blocked(s.verify_identity, "K-1002", "30.09.1985"))
check("Kein Entwurf ohne bestätigte Identität", blocked(s.create_draft, "Ihre Daten: ..."))

print("\nPrompt Injection (anfrage-03)")
s = Session("anfrage-03")
check("Manipulationsversuch erkannt", s.read_request()["warnung"] is not None)
check("Suche nach fremder Person blockiert", blocked(s.find_customer, "lukas.gruber@example.net"))
s.verify_identity("K-1001", "12.04.1990")
fetch_all(s)
result = s.create_draft("Daten von Lukas Gruber, lukas.gruber@example.net, Tel. +43 676 1112233. "
                        "Ihre Adresse: max.mustermann@example.com. Recht auf Berichtigung, Löschung, Beschwerde.")
check("Fremde Daten aus dem Entwurf entfernt",
      "Lukas Gruber" not in s.draft and "lukas.gruber" not in s.draft and "1112233" not in s.draft)
letter = s.draft.split("Anhang:")[0]
check("Eigene E-Mail-Adresse bleibt im Anschreiben erhalten (auch mit Punkt dahinter)",
      "Ihre Adresse: max.mustermann@example.com." in letter)
original_input = builtins.input
builtins.input = lambda _: "n"
sent = s.send_response()
builtins.input = original_input
check("Ohne menschliche Freigabe kein Versand", not sent["versendet"])
check("Versand an fremde Adresse blockiert", blocked(s.send_response, "backup@datensammler.example"))

print("\nLöschantrag (anfrage-04)")
s = Session("anfrage-04")
check("Löschantrag als nicht zuständig erkannt", s.read_request()["zustaendig"] is False)
check("Datentools gesperrt", blocked(s.find_customer, "anna.huber@example.org")
      and blocked(s.verify_identity, "K-1002", "30.09.1985"))
check("Eskalation bleibt möglich", s.escalate_to_human("Löschantrag")["eskaliert"])
check("Normale Auskunftsanfragen sind zuständig",
      all(Session(a).read_request()["zustaendig"] for a in ["anfrage-01", "anfrage-02", "anfrage-03"]))

print("\nFreigabe durch Menschen")
s = Session("anfrage-01")
s.verify_identity("K-1001", "12.04.1990")
fetch_all(s)
s.create_draft("Recht auf Berichtigung, Löschung und Beschwerde.")
builtins.input = lambda _: "j"
sent = s.send_response()
builtins.input = original_input
check("Empfänger ist immer die hinterlegte Adresse", sent["empfaenger"] == "max.mustermann@example.com")

print("\nNot-Aus")
g.STOP_FILE.touch()
check("Datei STOP aktiviert den Not-Aus", g.emergency_stop())
g.STOP_FILE.unlink()
check("Ohne Datei STOP läuft der Agent", not g.emergency_stop())

print(f"\n{passed} bestanden, {failed} fehlgeschlagen")
raise SystemExit(1 if failed else 0)
