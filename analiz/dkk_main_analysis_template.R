# Dijital Kritik Kütle — Ana çalışma analiz şablonu
# Bu dosya pilot bittikten sonra kilitlenecek ana çalışma CSV'si içindir.
# Paketler: tidyverse, lme4, emmeans, performance

library(tidyverse)
library(lme4)
library(emmeans)
library(performance)

d <- read.csv("DKK_main.csv", stringsAsFactors = FALSE)

# Ana çalışma verisini seç
d <- d %>%
  filter(study_phase == "main") %>%
  mutate(
    participant_code = factor(participant_code),
    scenario_id = factor(scenario_id),
    grade = factor(grade),
    device_class = factor(device_class),
    defender_count = as.numeric(defender_count),
    public_defend = as.integer(decision == "public_defend")
  )

# Veri bütünlüğü
stopifnot(all(d$peer_total == 4))
print(table(d$defender_count))
print(table(d$grade))

# Birincil model: doğrusal savunucu sayısı
m_linear <- glmer(
  public_defend ~ defender_count + grade + device_class +
    (1 | participant_code) + (1 | scenario_id),
  data = d, family = binomial,
  control = glmerControl(optimizer = "bobyqa")
)

# Nonlineerlik sınaması: savunucu sayısını kategorik ele al
m_factor <- glmer(
  public_defend ~ factor(defender_count) + grade + device_class +
    (1 | participant_code) + (1 | scenario_id),
  data = d, family = binomial,
  control = glmerControl(optimizer = "bobyqa")
)

print(summary(m_linear))
print(summary(m_factor))
print(anova(m_linear, m_factor, test = "Chisq"))
print(AIC(m_linear, m_factor))

# Koşul bazında tahmini olasılıklar ve %95 GA
emm <- emmeans(m_factor, ~ defender_count, type = "response")
print(emm)

# Ardışık koşul karşılaştırmaları
adj <- contrast(emm, method = "consec", adjust = "holm")
print(adj)

# İkincil: aktif müdahale
d <- d %>% mutate(active_intervention = as.integer(decision %in% c("private_support","public_defend","report")))
m_active <- glmer(
  active_intervention ~ factor(defender_count) + grade + device_class +
    (1 | participant_code) + (1 | scenario_id),
  data = d, family = binomial,
  control = glmerControl(optimizer = "bobyqa")
)
print(summary(m_active))

# Karar süresi yalnız ikincil sonuçtur.
rt <- d %>% filter(rt_ms >= 500, rt_ms <= 120000) %>% mutate(log_rt = log(rt_ms))
m_rt <- lmer(
  log_rt ~ factor(defender_count) + grade + device_class +
    (1 | participant_code) + (1 | scenario_id),
  data = rt
)
print(summary(m_rt))

# Model kontrolleri
print(check_model(m_linear))
