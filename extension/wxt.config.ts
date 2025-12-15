import { defineConfig } from 'wxt'
import { statebuilder } from 'statebuilder/compiler'
import tsconfigPaths from 'vite-tsconfig-paths'

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  publicDir: 'src/public',
  modulesDir: 'src/modules',
  outDir: './dist',
  vite: (env) => ({
    plugins: [
      tsconfigPaths(),
      statebuilder({
        autoKey: true,
        dev: env.mode === 'development',
      }) as any,
    ],
  }),
  hooks: {
    'vite:build:extendConfig': (entrypoints, config) => {
      // Check if this build includes editor-content
      const hasEditorContent = entrypoints.some(
        (ep) => ep.name === 'editor-content'
      )
      if (hasEditorContent) {
        // Enable ESM and code splitting for editor-content
        config.build = config.build || {}

        // Override the library format
        if (config.build.lib) {
          config.build.lib.formats = ['es']
        }

        config.build.rollupOptions = config.build.rollupOptions || {}

        // Handle both array and object output configurations
        const outputConfig = {
          format: 'es' as const,
          inlineDynamicImports: false,
          chunkFileNames: 'chunks/[name]-[hash].js',
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              if (id.includes('@codemirror') || id.includes('codemirror') || id.includes('@valtown/codemirror-ts')) {
                return 'vendor-codemirror'
              }
              if (id.includes('prosemirror') || id.includes('prosekit') || id.includes('@prosemirror')) {
                return 'vendor-prosemirror'
              }
              if (id.includes('remark') || id.includes('rehype') || id.includes('unified') || id.includes('mdast') || id.includes('hast') || id.includes('unist')) {
                return 'vendor-markdown'
              }
            }
          },
        }

        if (Array.isArray(config.build.rollupOptions.output)) {
          config.build.rollupOptions.output = config.build.rollupOptions.output.map(
            (o) => ({ ...o, ...outputConfig })
          )
        } else {
          config.build.rollupOptions.output = {
            ...(config.build.rollupOptions.output as object),
            ...outputConfig,
          }
        }
      }
    },
  },
  // only on linux/macOS
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    startUrls: ['https://github.com/riccardoperra/better-writer-for-github'],
  },

  zip: {
    name: 'better-comments-for-github',
  },

  modules: ['@wxt-dev/module-solid'],

  manifest: {
    name: 'Better comments for GitHub',
    description:
      'A chrome extension that will enhance the GitHub native comment editor with a more powerful wysiwyg block based editor',
    author: {
      email: 'riccardo.perra@icloud.com',
    },
    web_accessible_resources: [
      {
        resources: [
          'editor-content.js',
          'worker.js',
          'iframe-worker.html',
          'chunks/*.js',
        ],
        matches: ['*://github.com/*'],
      },
    ],
    content_scripts: [
      {
        css: ['assets/main.css', 'assets/editor-content.css'],
        matches: ['*://github.com/*'],
        exclude_matches: ['https://*/login/*'],
      },
    ],
  },
})
