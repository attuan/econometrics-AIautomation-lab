"""候補の雑誌を OpenAlex の source に対応づけ、ISSN と年ごとの論文数を出す。
格（結果変数）との突き合わせはしない。出力: data/derived/journals_openalex.csv
"""
import csv, json, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "econ-lab-meta/0.1"}
# tier_draft は仮置き（AJG・ABDC で照合して確定する）
JOURNALS = [
    ("1", "Econometrica"), ("1", "Journal of Econometrics"), ("1", "Econometric Theory"),
    ("1", "Journal of Business & Economic Statistics"), ("1", "Quantitative Economics"),
    ("1", "The Review of Economics and Statistics"),
    ("2", "Journal of Applied Econometrics"), ("2", "The Econometrics Journal"), ("2", "Econometric Reviews"),
    ("2", "Journal of Time Series Analysis"), ("2", "Journal of Financial Econometrics"),
    ("2", "Oxford Bulletin of Economics and Statistics"), ("2", "International Journal of Forecasting"),
    ("3", "Empirical Economics"), ("3", "Applied Economics"), ("3", "Journal of Forecasting"),
    ("3", "Studies in Nonlinear Dynamics and Econometrics"), ("3", "Econometrics"),
]

# 名前の検索で誤った source に当たる雑誌は、ISSN で引いた ID に固定する（2026-11-24 確認）
PINNED = {"The Econometrics Journal": "S33519306",  # ISSN 1368-4221
          "Econometrics": "S2737431740"}            # MDPI, ISSN 2225-1146

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)

def main():
    out = ROOT / "data/derived/journals_openalex.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for tier, name in JOURNALS:
        if name in PINNED:
            s = get(f"https://api.openalex.org/sources/{PINNED[name]}")
        else:
            q = urllib.parse.quote(name)
            res = get(f"https://api.openalex.org/sources?search={q}&per-page=5")["results"]
            cands = [s for s in res if s.get("type") == "journal"]
            exact = [s for s in cands if s["display_name"].lower().lstrip("the ") == name.lower().lstrip("the ")]
            s = (exact or cands or [None])[0]
        if s is None:
            rows.append(dict(tier_draft=tier, name=name, openalex_id="", display_name="NOT FOUND")); continue
        sid = s["id"].rsplit("/", 1)[-1]
        g = get(f"https://api.openalex.org/works?filter=primary_location.source.id:{sid},publication_year:2015-2024,type:article&group_by=publication_year")
        by = {int(x["key"]): x["count"] for x in g["group_by"]}
        a = get(f"https://api.openalex.org/works?filter=primary_location.source.id:{sid},publication_year:2015-2024,type:article,has_abstract:true&per-page=1")["meta"]["count"]
        rows.append(dict(tier_draft=tier, name=name, openalex_id=sid, display_name=s["display_name"],
                         publisher=s.get("host_organization_name") or "", issn_l=s.get("issn_l") or "",
                         n_2015_2024=sum(by.values()), n_with_abstract=a,
                         **{f"y{y}": by.get(y, 0) for y in range(2015, 2025)}))
        time.sleep(0.2)
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    for r in rows:
        print(r["tier_draft"], r["name"], "->", r.get("display_name"), r.get("openalex_id"), r.get("n_2015_2024"), r.get("n_with_abstract"))

if __name__ == "__main__":
    main()
