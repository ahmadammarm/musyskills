// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ahmadammarm.github.io',
  base: '/musyskills',
  // Fetch pages as soon as their links scroll into view, so a tap on a phone
  // (which has no hover) does not wait for the network.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Geist',
      cssVariable: '--font-geist',
      weights: [400, 500, 600],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      weights: [400, 500],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    // Tailwind v4 runs as a Vite plugin. An inline (empty) PostCSS config stops
    // Vite from picking up a postcss.config.js in a parent folder.
    css: { postcss: {} },
    // The site reads skills/, CHANGELOG.md and the CLI's tool table from the repo root.
    server: { fs: { allow: ['..'] } },
  },
});
