"""走らせた推定を log/specs.csv に1行ずつ残す（R の code/lib/speclog.R と同じ形式）。

プロジェクト直下で実行する。行は消さない。有意でない結果も、やめた仕様も残す。

    from speclog import log_spec
    log_spec(hypothesis="H1", stage="synthetic", data="data/sim/panel.csv", outcome="y", estimand="ATT",
             formula="...", sample="全標本", n=2000, estimate=0.31, se=0.12, cluster="unit", n_clusters=200)
"""
import csv
import datetime
import json
from pathlib import Path
from statistics import NormalDist

SPEC_LOG = Path("log/specs.csv")
SPEC_COLS = ["spec_id", "timestamp", "hypothesis", "stage", "data", "outcome", "estimand", "formula", "sample",
             "n", "n_clusters", "cluster", "estimate", "se", "ci_low", "ci_high", "note"]
STAGES = ("synthetic", "confirmatory", "exploratory")


def is_locked():
    f = Path("prereg/LOCK.json")
    return f.exists() and bool(json.loads(f.read_text(encoding="utf-8")))


def log_spec(*, hypothesis, stage, data, outcome, estimand, formula, sample, n, estimate, se,
             cluster="", n_clusters="", level=0.95, note=""):
    if stage not in STAGES:
        raise ValueError(f"stage は {STAGES} のどれか")
    if stage != "synthetic" and not is_locked():
        raise RuntimeError("未ロックのまま実データを推定しようとした。tools/lock_pap.py を人の承認の後に実行する。")
    new = not SPEC_LOG.exists()
    count = 0 if new else sum(1 for _ in csv.DictReader(open(SPEC_LOG, newline="", encoding="utf-8")))
    z = NormalDist().inv_cdf(1 - (1 - level) / 2)
    row = dict(spec_id=f"S{count + 1:04d}", timestamp=datetime.datetime.now().isoformat(timespec="seconds"),
               hypothesis=hypothesis, stage=stage, data=data, outcome=outcome, estimand=estimand, formula=formula,
               sample=sample, n=n, n_clusters=n_clusters, cluster=cluster, estimate=f"{estimate:.6g}", se=f"{se:.6g}",
               ci_low=f"{estimate - z * se:.6g}", ci_high=f"{estimate + z * se:.6g}", note=note)
    SPEC_LOG.parent.mkdir(exist_ok=True)
    with open(SPEC_LOG, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=SPEC_COLS, quoting=csv.QUOTE_NONNUMERIC)
        if new:
            w.writeheader()
        w.writerow(row)
    print(f"{row['spec_id']} [{stage}] {hypothesis}: {estimate:.4g} ({se:.4g})")
    return row["spec_id"]
