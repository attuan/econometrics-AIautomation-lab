# 段階6: 推定量と検出力の点検。プロジェクト直下で: Rscript sim/mc_check.R
# 真の効果 tau が分かっている合成パネルを何度も作り、推定量の偏り・95%信頼区間の被覆率・検出力を測る。
# 下の PARAMS を実データの構造（単位数・期間・処置の割合・系列相関）に合わせて書き換える。
# 比べる推定量:
#   did_unit   単位ごとに前後差を取って群間比較（単位クラスタで妥当）
#   naive_ols  単位×期の観測を独立とみなす OLS（比較用。標準誤差が合うかどうかは系列相関と期の数による）
set.seed(20261114)
source("code/lib/speclog.R")

PARAMS <- list(
  n_units   = 200,    # 単位の数
  n_periods = 10,     # 期の数
  t0        = 6,      # この期から処置
  share     = 0.5,    # 処置群の割合
  sd_unit   = 1.0,    # 単位固定効果の標準偏差
  sd_eps    = 1.0,    # 誤差の標準偏差
  rho       = 0.6,    # 誤差の系列相関 AR(1)
  taus      = c(0, 0.1, 0.2, 0.3, 0.5),  # 試す真の効果（結果変数の単位）
  reps      = 500
)

sim_panel <- function(p, tau) {
  u <- rep(seq_len(p$n_units), each = p$n_periods)
  t <- rep(seq_len(p$n_periods), times = p$n_units)
  treated <- as.integer(u <= round(p$n_units * p$share))
  post <- as.integer(t >= p$t0)
  e <- matrix(0, p$n_periods, p$n_units)   # 定常な AR(1)。列が単位
  e[1, ] <- rnorm(p$n_units, sd = p$sd_eps)
  for (k in 2:p$n_periods) e[k, ] <- p$rho * e[k - 1, ] + rnorm(p$n_units, sd = p$sd_eps * sqrt(1 - p$rho^2))
  eps <- as.vector(e)
  y <- rnorm(p$n_units, sd = p$sd_unit)[u] + 0.05 * t + tau * treated * post + eps
  data.frame(unit = u, period = t, treated = treated, post = post, y = y)
}

naive_ols <- function(d) {   # lm(y ~ treated * post) の交差項と同じ値を、セル平均から直接計算する
  cell <- interaction(d$treated, d$post)
  m <- tapply(d$y, cell, mean); n <- tapply(d$y, cell, length)
  s2 <- sum((d$y - m[cell])^2) / (nrow(d) - 4)
  list(estimate = unname(m["1.1"] - m["1.0"] - m["0.1"] + m["0.0"]), se = sqrt(s2 * sum(1 / n)))
}

one <- function(tau) {
  d <- sim_panel(PARAMS, tau)
  est <- list(did_unit = did_unit(d), naive_ols = naive_ols(d))
  do.call(rbind, lapply(names(est), function(k) {
    e <- est[[k]]
    data.frame(estimator = k, est = e$estimate, se = e$se,
               cover = abs(e$estimate - tau) <= 1.96 * e$se,
               reject = abs(e$estimate) > 1.96 * e$se)
  }))
}

res <- do.call(rbind, lapply(PARAMS$taus, function(tau) {
  r <- do.call(rbind, replicate(PARAMS$reps, one(tau), simplify = FALSE))
  do.call(rbind, lapply(split(r, r$estimator), function(g) data.frame(
    tau = tau, estimator = g$estimator[1],
    bias = mean(g$est) - tau, rmse = sqrt(mean((g$est - tau)^2)),
    mean_se = mean(g$se), sd_est = sd(g$est),
    coverage95 = mean(g$cover), reject_rate = mean(g$reject), reps = nrow(g))))
}))
rownames(res) <- NULL
res[sapply(res, is.numeric)] <- lapply(res[sapply(res, is.numeric)], round, 4)

dir.create("data/sim", recursive = TRUE, showWarnings = FALSE)
write.csv(res, "data/sim/mc_summary.csv", row.names = FALSE)
write.csv(sim_panel(PARAMS, PARAMS$taus[length(PARAMS$taus)]), "data/sim/panel.csv", row.names = FALSE)
print(res)

# 読み方: tau = 0 の reject_rate が偽陽性率（0.05 が目標）。tau > 0 の reject_rate が検出力。
ok <- res[res$estimator == "did_unit" & res$tau > 0 & res$reject_rate >= 0.8, ]
cat(sprintf("\ndid_unit で検出力 80%% 以上になる最小の効果（試した中で）: %s\n",
            if (nrow(ok)) min(ok$tau) else "なし（標本を増やすか、設計を変える）"))
fp <- res[res$tau == 0, c("estimator", "reject_rate")]
cat("tau = 0 での偽陽性率: ", paste(fp$estimator, fp$reject_rate, collapse = " / "), "\n")
