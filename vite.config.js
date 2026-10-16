import { defineConfig } from 'vite';

// GitHub Pages serves the site under /<repo>/, so the deploy workflow sets
// BASE_PATH. Local dev and builds keep the root path.
const base = process.env.BASE_PATH || '/';

// Data files and components reference public images as "/images/...".
// Vite rewrites those in CSS, but not inside JS/JSON strings, so prefix them here.
function prefixPublicImages() {
  return {
    name: 'prefix-public-images',
    enforce: 'pre',
    transform(code, id) {
      if (base === '/' || !/\.(jsx?|json)$/.test(id.split('?')[0]) || id.includes('node_modules')) return null;
      if (!code.includes('/images/')) return null;
      return { code: code.replace(/(["'`])\/images\//g, `$1${base}images/`), map: null };
    },
  };
}

export default defineConfig({ base, plugins: [prefixPublicImages()] });
