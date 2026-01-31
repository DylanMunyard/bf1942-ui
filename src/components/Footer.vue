<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-text">
        Made by
        <a
          href="https://bfstats.io/players/skandia"
          class="author-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          skandia
        </a>
      </div>

      <div class="footer-links">
        <router-link
          to="/system-stats"
          class="stats-link"
          title="System Statistics"
        >
          <svg class="stats-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="1" width="14" height="14" rx="2" />
            <path d="M1 6h14M6 1v14" />
          </svg>
          <span class="link-text">System Stats</span>
        </router-link>

        <span class="divider"></span>

        <a
          href="https://github.com/dylanMunyard/bf1942-stats"
          class="github-link"
          target="_blank"
          rel="noopener noreferrer"
          title="API Repository"
        >
          <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span class="link-text">API</span>
        </a>

        <a
          href="https://github.com/dylanMunyard/bf1942-ui"
          class="github-link"
          target="_blank"
          rel="noopener noreferrer"
          title="UI Repository"
        >
          <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span class="link-text">UI</span>
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Footer component - no logic needed
</script>

<style scoped>
.app-footer {
  position: relative;
  z-index: 10;
  padding: 1rem 1.5rem;
  margin-top: auto;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(64, 64, 64, 0.5);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.author-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.author-link:hover {
  color: var(--color-primary-hover);
}

.author-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.author-link:hover::after {
  width: 100%;
}

.footer-links {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.divider {
  width: 1px;
  height: 1rem;
  background: rgba(64, 64, 64, 0.6);
}

.stats-link,
.github-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

.stats-link:hover,
.github-link:hover {
  color: var(--color-text);
  background: rgba(64, 64, 64, 0.5);
  transform: translateY(-1px);
}

.stats-icon,
.github-icon {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

.stats-link:hover .stats-icon,
.github-link:hover .github-icon {
  transform: scale(1.1);
}

.link-text {
  font-weight: 500;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .app-footer {
    padding: 0.875rem 1rem;
  }

  .footer-content {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .footer-text {
    justify-content: center;
  }

  .footer-links {
    gap: 1rem;
  }

  .github-link {
    font-size: 0.8125rem;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .footer-text {
    font-size: 0.8125rem;
  }

  .footer-links {
    gap: 0.75rem;
  }
}
</style>
