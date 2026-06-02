// ─── Skeleton Loader Helpers ───────────────────────────────────────────────

export function skeletonProjectGrid(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="project-card project-card--skeleton">
      <div class="skeleton skeleton--icon"></div>
      <div class="skeleton skeleton--title"></div>
      <div class="skeleton skeleton--text"></div>
      <div class="skeleton skeleton--text skeleton--text-sm"></div>
    </div>`).join('');
}

export function skeletonCanvas() {
  return Array.from({ length: 4 }, (_, i) => `
    <div class="section-card section-card--skeleton" style="--delay:${i * 60}ms">
      <div class="section-card__head">
        <div class="skeleton skeleton--dot"></div>
        <div class="skeleton skeleton--label"></div>
      </div>
      <div class="section-card__body">
        ${Array.from({ length: 2 }, () => `
          <div class="field-group">
            <div class="skeleton skeleton--field-label"></div>
            <div class="skeleton skeleton--note"></div>
            <div class="skeleton skeleton--note skeleton--note-sm"></div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}
