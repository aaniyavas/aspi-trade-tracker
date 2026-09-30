"""
One-time data cleanup: read the detailed tracker CSV and add two new
columns (Status_Category, Type_Category) that bucket the free-text
Status and Agreement_Type fields into a small, filter-friendly set.

The original detailed text is kept untouched in Status/Agreement_Type
so nothing is lost -- it's what shows up in the table and timeline.
Status_Category/Type_Category are only used to populate the dropdown
filters, so the dropdowns stay short and useful as the dataset grows.
"""
import csv

STATUS_RULES = [
    ("In Force",                 ["in force", "implemented", "entered into force"]),
    ("Signed",                   ["signed", "formalized", "finalized"]),
    ("Negotiations Concluded",   ["concluded", "nearing conclusion", "nearly complete",
                                   "final stages", "expected conclusion", "ratification"]),
    ("Talks Stalled/Slowed",     ["stalled", "slowed"]),
    ("Negotiations Ongoing",     ["ongoing", "in progress", "negotiating"]),
    ("Negotiations Launched/Planned", [
        "launched", "to launch", "to accelerate", "to expedite", "to resume",
        "to restart", "planned", "preparing", "considering", "anticipated",
        "application announced", "commitment to", "open to pursuing",
        "under consideration", "nearing", "to begin", "to start",
    ]),
    ("Cooperation/Dialogue",     ["agreed", "discussed", "held", "elevated", "deepened",
                                   "established", "formed", "made", "adopted", "engagement",
                                   "visit", "designated", "extended", "reaffirmed", "allowed",
                                   "set", "announced"]),
]

TYPE_RULES = [
    ("FTA / CEPA / PTA / EPA",       ["fta", "cepa", "pta", "epa", "ceca", "ecta"]),
    ("Strategic Partnership",         ["strategic partnership", "comprehensive partnership"]),
    ("Critical Minerals / Investment",["critical minerals", "investment", "mining"]),
    ("Digital Trade Agreement",       ["digital trade"]),
    ("Trade Bloc Accession",          ["accession"]),
    ("Tariff / Regulatory Action",    ["tariff", "anti-dumping", "duties", "quota"]),
    ("Defense / Security Agreement",  ["defense", "security agreement", "nuclear"]),
    ("Summit / Dialogue / Visit",     ["dialogue", "visit", "summit", "conference", "forum",
                                        "meeting", "committee", "consultations"]),
    ("MOU / Cooperation Agreement",   ["mou", "cooperation", "partnership", "action plan",
                                        "joint statement", "agreements", "pacts", "documents"]),
]


def classify(value, rules, default="Other"):
    v = value.lower()
    for label, keywords in rules:
        if any(k in v for k in keywords):
            return label
    return default


with open("data/tracker.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

for row in rows:
    row["Status_Category"] = classify(row["Status"], STATUS_RULES)
    row["Type_Category"] = classify(row["Agreement_Type"], TYPE_RULES)

fieldnames = list(rows[0].keys())
with open("data/tracker.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

from collections import Counter
print("Status_Category counts:", Counter(r["Status_Category"] for r in rows))
print()
print("Type_Category counts:", Counter(r["Type_Category"] for r in rows))
