import { defineConfig, type Plugin } from 'vite';
import { renderPage } from './src/render/page';
import { renderHead, renderSitemap } from './src/render/seo';

/**
 * Renders the page markup from the typed content modules at build time,
 * so the site ships real HTML (readable without JS) and scripts only add motion.
 */
function staticRender(): Plugin {
  return {
    name: 'ahad-sys:static-render',
    transformIndexHtml(html) {
      return html.replace('<!--ssg:head-->', renderHead()).replace('<!--ssg:page-->', renderPage());
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: renderSitemap() });
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
