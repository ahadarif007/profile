import { defineConfig, type Plugin } from 'vite';
import { renderPage } from './src/render/page';

/**
 * Renders the page markup from the typed content modules at build time,
 * so the site ships real HTML (readable without JS) and scripts only add motion.
 */
function staticRender(): Plugin {
  return {
    name: 'ahad-sys:static-render',
    transformIndexHtml(html) {
      return html.replace('<!--ssg:page-->', renderPage());
    },
  };
}

export default defineConfig({
  base: '/profile/',
  plugins: [staticRender()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 2048,
  },
});
