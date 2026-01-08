import '@testing-library/jest-dom';

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// PointerEvent mock for Radix UI
if (!global.PointerEvent) {
    class MockPointerEvent extends Event {
        button: number;
        ctrlKey: boolean;
        pointerType: string;

        constructor(type: string, props: PointerEventInit = {}) {
            super(type, props);
            this.button = props.button || 0;
            this.ctrlKey = props.ctrlKey || false;
            this.pointerType = props.pointerType || 'mouse';
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).PointerEvent = MockPointerEvent as any;
    (window as any).PointerEvent = MockPointerEvent as any;
}

// Element.scrollIntoView mock
Element.prototype.scrollIntoView = () => { };

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = () => ({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => { },
});

// Mock Pointer Capture methods
HTMLElement.prototype.setPointerCapture = () => { };
HTMLElement.prototype.releasePointerCapture = () => { };
HTMLElement.prototype.hasPointerCapture = () => false;
