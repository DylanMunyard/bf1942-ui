<template>
  <section class="portal-card portal-cron">
    <div class="portal-cron-head">
      <h3 class="portal-cron-title">[ CRON ]</h3>
      <p class="portal-cron-desc">Trigger background jobs on demand. After deleting a round, run <strong>Daily Aggregate Refresh</strong> to recalc kills/deaths for affected periods.</p>
    </div>
    <div v-if="jobError" class="portal-cron-err">{{ jobError }}</div>
    <div v-if="jobSuccess" class="portal-cron-ok">{{ jobSuccess }}</div>
    <div class="portal-cron-list">
      <div class="portal-cron-item portal-cron-item--priority">
        <div class="portal-cron-item-body">
          <span class="portal-cron-item-name">Daily Aggregate Refresh</span>
          <span class="portal-cron-item-desc">ServerHourlyPatterns, HourlyPlayerPredictions, MapGlobalAverages. Run after round delete.</span>
        </div>
        <button
          type="button"
          class="portal-btn portal-btn--primary portal-btn--sm"
          :disabled="jobRunning !== null"
          @click="runJob('daily-aggregate-refresh', true)"
        >
          {{ jobRunning === 'daily-aggregate-refresh' ? 'running...' : 'Run' }}
        </button>
      </div>
      <div class="portal-cron-item">
        <div class="portal-cron-item-body">
          <span class="portal-cron-item-name">Weekly Cleanup</span>
          <span class="portal-cron-item-desc">Stale this_week best scores, prune ServerOnlineCounts.</span>
        </div>
        <button
          type="button"
          class="portal-btn portal-btn--ghost portal-btn--sm"
          :disabled="jobRunning !== null"
          @click="runJob('weekly-cleanup', true)"
        >
          {{ jobRunning === 'weekly-cleanup' ? 'running...' : 'Run' }}
        </button>
      </div>
      <div class="portal-cron-item">
        <div class="portal-cron-item-body">
          <span class="portal-cron-item-name">Aggregate Backfill (tier)</span>
          <span class="portal-cron-item-desc">Tier 1–4 by recency. Fire-and-forget; check logs.</span>
        </div>
        <div class="portal-cron-item-actions">
          <select v-model.number="aggregateBackfillTier" class="portal-cron-select">
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
          </select>
          <button
            type="button"
            class="portal-btn portal-btn--ghost portal-btn--sm"
            :disabled="jobRunning !== null"
            @click="runJob('aggregate-backfill-tier', false)"
          >
            Start tier {{ aggregateBackfillTier }}
          </button>
        </div>
      </div>
      <div class="portal-cron-item">
        <div class="portal-cron-item-body">
          <span class="portal-cron-item-name">Aggregate Backfill (full)</span>
          <span class="portal-cron-item-desc">All tiers. Fire-and-forget.</span>
        </div>
        <button
          type="button"
          class="portal-btn portal-btn--ghost portal-btn--sm"
          :disabled="jobRunning !== null"
          @click="runJob('aggregate-backfill', false)"
        >
          Start
        </button>
      </div>
      <div class="portal-cron-item">
        <div class="portal-cron-item-body">
          <span class="portal-cron-item-name">Server Map Stats Backfill</span>
          <span class="portal-cron-item-desc">Full from Rounds; daily only ~2 months.</span>
        </div>
        <button
          type="button"
          class="portal-btn portal-btn--ghost portal-btn--sm"
          :disabled="jobRunning !== null"
          @click="runJob('server-map-stats-backfill', false)"
        >
          Start
        </button>
      </div>
      <div class="portal-cron-item">
        <div class="portal-cron-item-body">
          <span class="portal-cron-item-name">Map Hourly Patterns Backfill</span>
          <span class="portal-cron-item-desc">Full from Rounds; daily ~60 days.</span>
        </div>
        <button
          type="button"
          class="portal-btn portal-btn--ghost portal-btn--sm"
          :disabled="jobRunning !== null"
          @click="runJob('map-hourly-patterns-backfill', false)"
        >
          Start
        </button>
      </div>
      <div class="portal-cron-item">
        <div class="portal-cron-item-body">
          <span class="portal-cron-item-name">Run All</span>
          <span class="portal-cron-item-desc">Daily refresh + weekly cleanup. Fire-and-forget.</span>
        </div>
        <button
          type="button"
          class="portal-btn portal-btn--ghost portal-btn--sm"
          :disabled="jobRunning !== null"
          @click="runJob('run-all', false)"
        >
          Run all
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as adminJobsService from '@/services/adminJobsService';

const jobRunning = ref<string | null>(null);
const jobError = ref<string | null>(null);
const jobSuccess = ref<string | null>(null);
const aggregateBackfillTier = ref(1);

async function runJob(jobKey: string, _isBlocking: boolean) {
  jobError.value = null;
  jobSuccess.value = null;
  jobRunning.value = jobKey;
  let fn: () => Promise<{ message?: string; error?: string }>;
  switch (jobKey) {
    case 'daily-aggregate-refresh':
      fn = adminJobsService.triggerDailyAggregateRefresh;
      break;
    case 'weekly-cleanup':
      fn = adminJobsService.triggerWeeklyCleanup;
      break;
    case 'aggregate-backfill-tier':
      fn = () => adminJobsService.triggerAggregateBackfillTier(aggregateBackfillTier.value);
      break;
    case 'aggregate-backfill':
      fn = adminJobsService.triggerAggregateBackfill;
      break;
    case 'server-map-stats-backfill':
      fn = adminJobsService.triggerServerMapStatsBackfill;
      break;
    case 'map-hourly-patterns-backfill':
      fn = adminJobsService.triggerMapHourlyPatternsBackfill;
      break;
    case 'run-all':
      fn = adminJobsService.triggerRunAll;
      break;
    default:
      jobRunning.value = null;
      return;
  }
  try {
    const res = await fn();
    jobSuccess.value = res.message ?? (_isBlocking ? 'Done.' : 'Started. Check logs.');
  } catch (e) {
    jobError.value = e instanceof Error ? e.message : 'Job failed';
  } finally {
    jobRunning.value = null;
  }
}
</script>
