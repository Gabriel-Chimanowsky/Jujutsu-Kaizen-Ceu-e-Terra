export const showConfirmModal = (question, subtext = '') => {
  return new Promise((resolve) => {
    const event = new CustomEvent('show-confirm', {
      detail: { question, subtext, resolve }
    })
    window.dispatchEvent(event)
  })
}

if (typeof window !== 'undefined') {
  window.showConfirmModal = showConfirmModal
}
