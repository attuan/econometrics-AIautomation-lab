# 生データから本文の表・図までを端から端まで作る。プロジェクト直下で: Rscript code/00_run_all.R
# 雛形は合成データ（data/sim/panel.csv。先に Rscript sim/mc_check.R）で通る。
# 実データに切り替えるのはロックの後。DATA と STAGE を書き換える。
set.seed(20261114)
source("code/lib/speclog.R")

DATA  <- "data/sim/panel.csv"   # ロック後: "data/derived/panel.csv"
STAGE <- "synthetic"            # ロック後: "confirmatory"。データを見た後の分析は "exploratory"

source("code/01_estimate.R")
source("code/02_figs.R")

dir.create("log", showWarnings = FALSE)
writeLines(capture.output(sessionInfo()), "log/sessionInfo.txt")
message("完了。走らせた推定は log/specs.csv にある。")
