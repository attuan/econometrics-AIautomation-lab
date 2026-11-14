# 走らせた推定を log/specs.csv に1行ずつ残す（AGENTS.md §4.2）。
# 使い方: プロジェクト直下で source("code/lib/speclog.R") してから log_spec(...)。
# 行は消さない。有意でない結果も、やめた仕様も残す。

SPEC_LOG <- "log/specs.csv"
SPEC_COLS <- c("spec_id", "timestamp", "hypothesis", "stage", "data", "outcome", "estimand",
               "formula", "sample", "n", "n_clusters", "cluster", "estimate", "se",
               "ci_low", "ci_high", "note")

is_locked <- function() {
  f <- "prereg/LOCK.json"
  file.exists(f) && grepl("locked_at", paste(readLines(f, warn = FALSE), collapse = ""))
}

# stage: "synthetic"（合成データ）/ "confirmatory"（ロックした仕様）/ "exploratory"（データを見た後の分析）
log_spec <- function(hypothesis, stage, data, outcome, estimand, formula, sample,
                     n, estimate, se, cluster = "", n_clusters = NA, level = 0.95, note = "") {
  stage <- match.arg(stage, c("synthetic", "confirmatory", "exploratory"))
  if (stage != "synthetic" && !is_locked())
    stop("未ロックのまま実データを推定しようとした。python3 tools/lock_pap.py <project> を人の承認の後に実行する。")
  new <- !file.exists(SPEC_LOG)
  id <- sprintf("S%04d", if (new) 1L else nrow(read.csv(SPEC_LOG, colClasses = "character")) + 1L)
  z <- qnorm(1 - (1 - level) / 2)
  row <- data.frame(
    spec_id = id, timestamp = format(Sys.time(), "%Y-%m-%dT%H:%M:%S"),
    hypothesis = hypothesis, stage = stage, data = data, outcome = outcome, estimand = estimand,
    formula = formula, sample = sample, n = n, n_clusters = n_clusters, cluster = cluster,
    estimate = signif(estimate, 6), se = signif(se, 6),
    ci_low = signif(estimate - z * se, 6), ci_high = signif(estimate + z * se, 6),
    note = note, stringsAsFactors = FALSE)
  dir.create(dirname(SPEC_LOG), showWarnings = FALSE)
  write.table(row[SPEC_COLS], SPEC_LOG, sep = ",", row.names = FALSE, qmethod = "double",
              col.names = new, append = !new)
  message(sprintf("%s [%s] %s: %.4g (%.4g)", id, stage, hypothesis, estimate, se))
  invisible(id)
}

# 単位クラスタで妥当な 2×2 の差の差: 単位ごとに（処置後の平均 − 処置前の平均）を取り、処置群と対照群で比べる。
did_unit <- function(d, y = "y", unit = "unit", treated = "treated", post = "post") {
  m <- tapply(d[[y]], list(d[[unit]], d[[post]]), mean)
  delta <- m[, "1"] - m[, "0"]
  g <- tapply(d[[treated]], d[[unit]], max)[names(delta)]
  est <- mean(delta[g == 1]) - mean(delta[g == 0])
  se <- sqrt(var(delta[g == 1]) / sum(g == 1) + var(delta[g == 0]) / sum(g == 0))
  list(estimate = est, se = se, n = nrow(d), n_clusters = length(delta))
}
