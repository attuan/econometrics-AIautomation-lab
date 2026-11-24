import csv
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from labtool import did_unit  # noqa: E402


class TestDidUnit(unittest.TestCase):
    def test_known_answer(self):
        # 処置群の前後差は 3 と 5、対照群は 1 と 1 → 推定値 4 - 1 = 3、標準誤差 sqrt(2/2 + 0/2) = 1
        rows = []
        for u, tr, pre, post in [(1, 1, 0, 3), (2, 1, 0, 5), (3, 0, 0, 1), (4, 0, 2, 3)]:
            rows += [dict(unit=u, treated=tr, post=0, y=pre), dict(unit=u, treated=tr, post=1, y=post)]
        r = did_unit(rows)
        self.assertAlmostEqual(r.estimate, 3.0)
        self.assertAlmostEqual(r.se, 1.0)
        self.assertEqual((r.n, r.n_clusters), (8, 4))

    def test_matches_r_log(self):
        """合成パネルと R の記録があれば、R の did_unit と同じ値になることを確かめる。"""
        proj = Path(__file__).resolve().parents[2]
        panel, log = proj / "data/sim/panel.csv", proj / "log/specs.csv"
        if not (panel.exists() and log.exists()):
            self.skipTest("data/sim/panel.csv か log/specs.csv が無い")
        last = [r for r in csv.DictReader(open(log, newline="", encoding="utf-8")) if r["data"] == "data/sim/panel.csv"][-1]
        r = did_unit(list(csv.DictReader(open(panel, newline="", encoding="utf-8"))))
        self.assertAlmostEqual(r.estimate, float(last["estimate"]), places=5)
        self.assertAlmostEqual(r.se, float(last["se"]), places=5)


if __name__ == "__main__":
    unittest.main()
