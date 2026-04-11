---
name: Seasonal charges with custom periods
description: Seasonal charges use dynamic periods (startMonth, endMonth, amount) instead of fixed 4 seasons
type: feature
---
- ChargeType includes 'seasonal' with SeasonPeriod[] (id, startMonth, endMonth, amount)
- Periods are user-defined: add/remove with month selectors and amount per period
- getSeasonalMonthlyAverage() computes yearly average over 12 months
- getSeasonalAmountForMonth() returns the amount for a specific month
- Checkbox "Charge saisonnière" in ChargeForm toggles seasonal mode
- Average monthly amount is stored in charge.amount for totals
