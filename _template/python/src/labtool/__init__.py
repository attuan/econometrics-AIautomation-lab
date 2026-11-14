"""labtool: 雛形。R の did_unit と同じ計算を、標準ライブラリだけで行う。"""
from dataclasses import dataclass
from statistics import mean, variance

__all__ = ["DidResult", "did_unit"]


@dataclass
class DidResult:
    estimate: float
    se: float
    n: int
    n_clusters: int


def did_unit(rows, y="y", unit="unit", treated="treated", post="post"):
    """2×2 の差の差。単位ごとに（処置後の平均 − 処置前の平均）を取り、処置群と対照群で比べる。

    標準誤差は単位を独立とみなす（単位クラスタ）。処置の時点が全単位で同じ設計にだけ使える。
    """
    cells, group = {}, {}
    for r in rows:
        cells.setdefault((r[unit], int(r[post])), []).append(float(r[y]))
        group[r[unit]] = max(group.get(r[unit], 0), int(r[treated]))
    delta = {u: mean(cells[(u, 1)]) - mean(cells[(u, 0)]) for u in group}
    d1 = [d for u, d in delta.items() if group[u] == 1]
    d0 = [d for u, d in delta.items() if group[u] == 0]
    if len(d1) < 2 or len(d0) < 2:
        raise ValueError("処置群と対照群に、それぞれ2単位以上が要る")
    est = mean(d1) - mean(d0)
    se = (variance(d1) / len(d1) + variance(d0) / len(d0)) ** 0.5
    return DidResult(est, se, len(rows), len(delta))
