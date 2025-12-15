export default defineContentScript({
  matches: ['*://github.com/*'],
  runAt: 'document_idle',
  async main(ctx) {
    // Define the UI
    const cmWorker = createIframeUi(ctx, {
      page: '/iframe-worker.html',
      position: 'overlay',
      anchor: 'body',
      onMount: (wrapper, iframe) => {
        iframe.id = 'codemirror-ata'
        iframe.style.display = 'none'
        iframe.addEventListener('load', () => {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              browser.runtime.getURL('/worker.js'),
              '*',
            )
          }
        })
      },
    })
    cmWorker.mount()

    // Inject as ES module to enable code splitting
    const script = document.createElement('script')
    script.src = browser.runtime.getURL('/editor-content.js')
    script.type = 'module'
    ;(document.head || document.documentElement).appendChild(script)
  },
})
