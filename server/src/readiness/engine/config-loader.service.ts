/**
 * Config Loader — reads all engine constants from RdConfigConstant table.
 * Caches for 5 minutes. Falls back to DEFAULTS if DB unavailable.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { EngineConfig } from './formula-engine';

let _cache: EngineConfig | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const DEFAULTS: EngineConfig = {
  DSCR_FAIL: 1.0,
  DSCR_MIN: 1.25,
  DSCR_STRONG: 2.0,
  DE_MAX: 3.0,
  DE_DANGER: 5.0,
  EBITDA_MARGIN_GOOD: 15.0,
  REAL_CASH_MIN_PCT: 30.0,
  COLLECTION_RATE_MIN: 80.0,
  REVENUE_MULTIPLE: 3.0,
  REVERSE_MULT: 5.0,
  REVERSE_LTV: 0.8,
  WC_RATE: 0.20,
  LTV_RATE: 0.75,
  DEFAULT_LOAN_RATE: 0.07,
  DEFAULT_LOAN_YEARS: 7,
  WEIGHT_HEALTH_S05: 0.35,
  WEIGHT_STABILITY_S05: 0.20,
  WEIGHT_DSCR_PASS_S05: 0.20,
  WEIGHT_PLAN_S05: 0.25,
  W_AMOUNT: 0.20,
  W_INTEREST: 0.20,
  W_TENURE: 0.15,
  W_COLLATERAL: 0.25,
  W_COVENANTS: 0.20,
  FRS_L_MINDSET: 0.20,
  FRS_L_HEALTH: 0.25,
  FRS_L_STABILITY: 0.20,
  FRS_L_CAPACITY: 0.20,
  FRS_L_BANK: 0.15,
  FRS_B_MINDSET: 0.10,
  FRS_B_HEALTH: 0.35,
  FRS_B_STABILITY: 0.25,
  FRS_B_CAPACITY: 0.20,
  FRS_B_BANK: 0.10,
  FRS_BAND_READY: 75.0,
  FRS_BAND_ALMOST: 50.0,
  HS_EBITDA_W: 25.0,
  HS_DSCR_W: 30.0,
  HS_DE_W: 25.0,
  HS_GROWTH_W: 20.0,
  CS_POSITIVE_W: 40.0,
  CS_REAL_CASH_W: 30.0,
  CS_TREND_W: 30.0,
  DESIRED_LOAN_WARN_MULT: 1.2,
};

@Injectable()
export class ConfigLoaderService {
  constructor(private prisma: PrismaService) {}

  async loadConfig(forceRefresh = false): Promise<EngineConfig> {
    const now = Date.now();
    if (!forceRefresh && _cache && now - _cacheTime < CACHE_TTL_MS) {
      return _cache;
    }

    try {
      const rows = await this.prisma.rdConfigConstant.findMany();
      const cfg = { ...DEFAULTS };

      for (const row of rows) {
        const key = row.key as keyof EngineConfig;
        if (key in cfg) {
          (cfg as Record<string, number>)[key] = Number(row.value);
        }
      }

      _cache = cfg;
      _cacheTime = now;
      return cfg;
    } catch (err) {
      console.warn('[ConfigLoader] Failed to load from DB, using defaults:', err);
      return DEFAULTS;
    }
  }

  invalidateCache(): void {
    _cache = null;
    _cacheTime = 0;
  }
}
