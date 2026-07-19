-- Dashboard import: last 7 complete days (excludes today's partial partition).
-- Output shape matches src/data/adapters/bq-sql.js: one row per global brand,
-- Advertiser Module (channel 2) pivoted into am_*, indirect channels (3,4,5,6)
-- into ind_*, and the Global Brand dim's canonical industry array as
-- configured_industry_ids_raw. Export as CSV (with header) and paste/upload
-- into the dashboard's "BigQuery export" box.
--
-- V3 (Streaming Hub sub-entity) ids: advertiser_dim/brand_dim have NO global_*
-- columns (despite what older docs said). The real linkage is
--   fact.campaign_id        -> campaign_dim.advertiser_id  (V3 advertiser)
--   fact.insertion_order_id -> insertion_order_dim.brand_id (V3 brand)
-- and only direct-sold (channel 2) rows carry meaningful campaign/IO ids, so
-- V3 ids come from the brand's top-revenue Advertiser Module row. Brands with
-- no direct-sold delivery get NULL v3 ids (dashboard renders those read-only;
-- use its Resolve-V3 button, which searches FreeWheel live).
--
-- Cost guard: dry-run first (bq query --dry_run or the console estimate).

WITH base AS (
  SELECT
    fw.sales_channel_type_id,
    brand_id                          AS global_brand_id,
    advertiser_id                     AS global_advertiser_id,
    NULLIF(fw.campaign_id, -1)        AS campaign_id,
    NULLIF(fw.insertion_order_id, -1) AS insertion_order_id,
    (SELECT STRING_AGG(CAST(id AS STRING), '|') FROM UNNEST(fw.global_industry_ids) AS id)
      AS applied_industry_ids_raw,
    SUM(fw.net_counted_ads_nbr)       AS impressions,
    SUM(fw.run_revenue_amt)           AS revenue
  FROM `i-digital-adsales-prod.fw_datafeed_fact_vw.demand_portfolio_hourly_fct` AS fw
  CROSS JOIN UNNEST(fw.global_brand_ids)      AS brand_id
  CROSS JOIN UNNEST(fw.global_advertiser_ids) AS advertiser_id
  WHERE fw.event_dt BETWEEN DATE_SUB(CURRENT_DATE('America/New_York'), INTERVAL 7 DAY)
                        AND DATE_SUB(CURRENT_DATE('America/New_York'), INTERVAL 1 DAY)
    AND fw.delivered_country_id = 165
    AND fw.sales_channel_type_id IN (2, 3, 4, 5, 6)
    AND brand_id      != -1
    AND advertiser_id != -1
  GROUP BY 1, 2, 3, 4, 5, 6
),

-- One row per brand. For each side, applied_industry_ids_raw comes from that
-- side's highest-revenue grouping (avoids mixing different assignment arrays
-- into one pipe string, which would distort the common-ancestor resolution);
-- impressions/revenue are summed across the whole side. The V3 linkage ids
-- come from the top-revenue direct-sold row.
sides AS (
  SELECT
    global_brand_id,
    ARRAY_AGG(global_advertiser_id ORDER BY revenue DESC LIMIT 1)[SAFE_OFFSET(0)]
      AS global_advertiser_id,

    ARRAY_AGG(IF(sales_channel_type_id = 2, campaign_id, NULL) IGNORE NULLS
              ORDER BY revenue DESC LIMIT 1)[SAFE_OFFSET(0)]
      AS am_campaign_id,
    ARRAY_AGG(IF(sales_channel_type_id = 2, insertion_order_id, NULL) IGNORE NULLS
              ORDER BY revenue DESC LIMIT 1)[SAFE_OFFSET(0)]
      AS am_insertion_order_id,

    ARRAY_AGG(IF(sales_channel_type_id = 2, applied_industry_ids_raw, NULL) IGNORE NULLS
              ORDER BY revenue DESC LIMIT 1)[SAFE_OFFSET(0)]
      AS am_applied_industry_ids_raw,
    SUM(IF(sales_channel_type_id = 2, impressions, 0)) AS am_impressions,
    SUM(IF(sales_channel_type_id = 2, revenue,     0)) AS am_revenue,

    ARRAY_AGG(IF(sales_channel_type_id != 2, applied_industry_ids_raw, NULL) IGNORE NULLS
              ORDER BY revenue DESC LIMIT 1)[SAFE_OFFSET(0)]
      AS ind_applied_industry_ids_raw,
    SUM(IF(sales_channel_type_id != 2, impressions, 0)) AS ind_impressions,
    SUM(IF(sales_channel_type_id != 2, revenue,     0)) AS ind_revenue
  FROM base
  GROUP BY 1
)

SELECT
  s.global_brand_id,
  gb.global_brand_nm,
  s.global_advertiser_id,
  ga.global_advertiser_nm,
  cd.advertiser_id AS v3_advertiser_id,
  io.brand_id      AS v3_brand_id,
  s.am_applied_industry_ids_raw,
  CAST(ROUND(s.am_impressions) AS INT64)  AS am_impressions,
  ROUND(s.am_revenue, 2)                  AS am_revenue,
  s.ind_applied_industry_ids_raw,
  CAST(ROUND(s.ind_impressions) AS INT64) AS ind_impressions,
  ROUND(s.ind_revenue, 2)                 AS ind_revenue,
  (SELECT STRING_AGG(CAST(id AS STRING), '|') FROM UNNEST(gb.global_industry_ids) AS id)
    AS configured_industry_ids_raw
FROM sides AS s
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.global_brand_dim`      AS gb
  ON gb.global_brand_id = s.global_brand_id
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.global_advertiser_dim` AS ga
  ON ga.global_advertiser_id = s.global_advertiser_id
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.campaign_dim`          AS cd
  ON cd.campaign_id = s.am_campaign_id
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.insertion_order_dim`   AS io
  ON io.insertion_order_id = s.am_insertion_order_id
ORDER BY s.am_revenue + s.ind_revenue DESC
LIMIT 5000
