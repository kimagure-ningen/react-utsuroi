"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCanvasElements = void 0;
const findCanvasElements = (element) => {
    const canvasElements = element.querySelectorAll('canvas');
    const composables = [];
    Array.from(canvasElements).forEach((canvasElement) => {
        const canvas = canvasElement;
        composables.push(canvas);
    });
    return composables;
};
exports.findCanvasElements = findCanvasElements;
