# H1 の主仕様（paper/main.tex の式 eq:main）。00_run_all.R から呼ぶ。
if (!file.exists(DATA)) stop(DATA, " が無い。合成データなら先に Rscript sim/mc_check.R を実行する。")
d <- read.csv(DATA)

fit <- did_unit(d)
log_spec(hypothesis = "H1", stage = STAGE, data = DATA, outcome = "y",
         estimand = "ATT（処置後の全期間の平均）",
         formula = "単位ごとの (処置後平均 - 処置前平均) を処置群と対照群で比較",
         sample = "全標本", n = fit$n, estimate = fit$estimate, se = fit$se,
         cluster = "unit", n_clusters = fit$n_clusters, note = "主仕様")
