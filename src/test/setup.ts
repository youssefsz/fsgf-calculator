import "@testing-library/jest-dom/vitest"

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

interface TestWindow extends Window {
  ResizeObserver?: typeof ResizeObserver
}

const globalWindow = window as unknown as TestWindow
const globalElement = Element.prototype as unknown as Element & {
  scrollIntoView?: () => void
}

if (typeof window !== "undefined" && !("ResizeObserver" in globalWindow)) {
  globalWindow.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

if (
  typeof window !== "undefined" &&
  typeof globalElement.scrollIntoView !== "function"
) {
  globalElement.scrollIntoView = () => {}
}
