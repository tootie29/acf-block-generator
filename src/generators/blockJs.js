// Generate block.js when libraries are detected or custom JS is enabled.

export function generateBlockJs(schema) {
  const { slug, libraries, options } = schema
  const { tabs, slider, accordion } = libraries

  const blocks = []

  if (tabs) {
    blocks.push(`  // ── Tabs ────────────────────────────────────────────────
  document.querySelectorAll('.${slug}').forEach((root) => {
    const triggers = root.querySelectorAll('[data-tab]');
    const panes    = root.querySelectorAll('[data-tab-pane]');
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const target = trigger.getAttribute('data-tab');
        triggers.forEach((t) => t.classList.remove('is--active'));
        panes.forEach((p)    => p.classList.remove('is--active'));
        trigger.classList.add('is--active');
        const pane = root.querySelector('[data-tab-pane="' + target + '"]');
        if (pane) pane.classList.add('is--active');
      });
    });
  });`)
  }

  if (slider) {
    blocks.push(`  // ── Slider (Slick) ──────────────────────────────────────
  if (window.jQuery && typeof window.jQuery.fn.slick === 'function') {
    window.jQuery('.${slug}__track').slick({
      dots: true,
      arrows: true,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      responsive: [
        { breakpoint: 1024, settings: { slidesToShow: 2 } },
        { breakpoint: 768,  settings: { slidesToShow: 1 } },
      ],
    });
  }`)
  }

  if (accordion) {
    blocks.push(`  // ── Accordion (accordion-js) ────────────────────────────
  if (typeof Accordion !== 'undefined') {
    document.querySelectorAll('.${slug} .accordion-container').forEach((el) => {
      // eslint-disable-next-line no-new
      new Accordion(el, {
        duration: 300,
        showMultiple: false,
      });
    });
  }`)
  }

  if (options.hasCustomJs && !blocks.length) {
    blocks.push(`  // ── Custom block JS — add your interactivity here ─────
  document.querySelectorAll('.${slug}').forEach((root) => {
    // your code
  });`)
  } else if (options.hasCustomJs) {
    blocks.push(`  // ── Custom block JS ─────────────────────────────────────
  document.querySelectorAll('.${slug}').forEach((root) => {
    // your code
  });`)
  }

  if (!blocks.length) return null

  return `/**
 * Block: ${slug}
 * Frontend interactivity — enqueued via block.json viewScript.
 */
(function () {
  'use strict';

${blocks.join('\n\n')}
})();
`
}
