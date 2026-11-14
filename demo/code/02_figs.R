# 図: 検出力曲線（data/sim/mc_summary.csv → paper/figs/demo_power.pdf）。00_run_all.R から呼ぶ。
res <- read.csv("data/sim/mc_summary.csv")
dir.create("paper/figs", showWarnings = FALSE)
pdf("paper/figs/demo_power.pdf", width = 6.4, height = 3.8, family = "Japan1GothicBBB")
par(mar = c(4.2, 4.4, 1, 1), las = 1)
plot(NA, xlim = range(res$tau), ylim = c(0, 1), xlab = "真の効果 τ", ylab = "帰無仮説を棄却した割合")
abline(h = c(0.05, 0.8), lty = 3, col = "grey40")
text(c(0.42, 0.2), c(0.05, 0.8), c("5%", "80%"), pos = 3, col = "grey40", cex = 0.8)
sty <- list(did_unit = list(col = "#1F5FA8", pch = 16, lty = 1), naive_ols = list(col = "#C8641E", pch = 2, lty = 2))
for (k in names(sty)) {
  g <- res[res$estimator == k, ]
  lines(g$tau, g$reject_rate, type = "b", col = sty[[k]]$col, pch = sty[[k]]$pch, lty = sty[[k]]$lty, lwd = 2)
}
legend("topleft", c("単位ごとの前後差（did_unit）", "独立とみなす OLS（naive_ols）"), bty = "n", cex = 0.85,
       col = c("#1F5FA8", "#C8641E"), pch = c(16, 2), lty = c(1, 2), lwd = 2)
invisible(dev.off())
