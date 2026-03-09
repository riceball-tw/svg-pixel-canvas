<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const width = ref(16);
const height = ref(16);
const currentColor = ref('#000000');
const isDrawing = ref(false);

// Map of "x,y" to color string
const pixels = ref<Map<string, string>>(new Map());

// Tools
const currentTool = ref<'draw' | 'erase'>('draw');

// Initialize/Reset grid
const resetGrid = () => {
  pixels.value.clear();
};

// Watch for size changes to optionally clear out-of-bounds pixels
watch([width, height], ([newWidth, newHeight]) => {
  const newPixels = new Map<string, string>();
  for (const [key, color] of pixels.value.entries()) {
    const [x, y] = key.split(',').map(Number);
    if (x !== undefined && y !== undefined && x < newWidth && y < newHeight) {
      newPixels.set(key, color);
    }
  }
  pixels.value = newPixels;
});

const getPixelColor = (x: number, y: number) => {
  return pixels.value.get(`${x},${y}`) || 'transparent';
};

const handlePointerDown = (x: number, y: number, event: PointerEvent) => {
  // Left click only
  if (event.button !== 0) return;
  
  isDrawing.value = true;
  (event.target as HTMLElement)?.releasePointerCapture(event.pointerId); // Prevent drag and drop behavior on some browsers
  paintPixel(x, y);
};

const handlePointerEnter = (x: number, y: number) => {
  if (isDrawing.value) {
    paintPixel(x, y);
  }
};

const handlePointerUp = () => {
  isDrawing.value = false;
};

const paintPixel = (x: number, y: number) => {
  const key = `${x},${y}`;
  if (currentTool.value === 'draw') {
    pixels.value.set(key, currentColor.value);
  } else if (currentTool.value === 'erase') {
    pixels.value.delete(key);
  }
};

const clearCanvas = () => {
  if (confirm('Are you sure you want to clear the canvas?')) {
    resetGrid();
  }
};

// SVG Generation
const svgData = computed(() => {
  const rects: string[] = [];
  
  for (const [key, color] of pixels.value.entries()) {
    const [x, y] = key.split(',').map(Number);
    rects.push(`  <rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.value} ${height.value}" width="100%" height="100%">
${rects.join('\n')}
</svg>`;
});

const downloadSVG = () => {
  const blob = new Blob([svgData.value], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pixel-art.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="app-container" @pointerup="handlePointerUp" @pointerleave="handlePointerUp">
    <header class="header">
      <h1>Pixel Builder</h1>
      <p>Create beautiful pixel art and export as SVG</p>
    </header>

    <main class="main-content">
      <aside class="controls">
        <div class="control-group">
          <label>Dimensions</label>
          <div class="dimensions-inputs">
            <div class="input-wrap">
              <span>W</span>
              <input type="number" v-model.number="width" min="1" max="128" />
            </div>
            <div class="input-wrap">
              <span>H</span>
              <input type="number" v-model.number="height" min="1" max="128" />
            </div>
          </div>
        </div>

        <div class="control-group">
          <label>Tools</label>
          <div class="tools">
            <button 
              :class="['tool-btn', { active: currentTool === 'draw' }]" 
              @click="currentTool = 'draw'"
            >
              ✏️ Draw
            </button>
            <button 
              :class="['tool-btn', { active: currentTool === 'erase' }]" 
              @click="currentTool = 'erase'"
            >
              🧹 Erase
            </button>
          </div>
        </div>

        <div class="control-group">
          <label>Color</label>
          <input type="color" v-model="currentColor" class="color-picker" />
        </div>

        <div class="actions">
          <button class="action-btn clear-btn" @click="clearCanvas">
            Clear Canvas
          </button>
          <button class="action-btn download-btn" @click="downloadSVG">
            📥 Export SVG
          </button>
        </div>
      </aside>

      <section class="canvas-section">
        <div class="canvas-wrapper">
          <div 
            class="pixel-grid" 
            :style="{ 
              gridTemplateColumns: `repeat(${width}, 1fr)`,
              gridTemplateRows: `repeat(${height}, 1fr)`,
              aspectRatio: `${width} / ${height}`
            }"
          >
            <!-- Render rows x cols -->
            <template v-for="y in height" :key="'row-'+y">
              <template v-for="x in width" :key="`cell-${x-1}-${y-1}`">
                <div 
                  class="pixel-cell"
                  :style="{ backgroundColor: getPixelColor(x-1, y-1) }"
                  @pointerdown.prevent="handlePointerDown(x-1, y-1, $event)"
                  @pointerenter.prevent="handlePointerEnter(x-1, y-1)"
                ></div>
              </template>
            </template>
          </div>
        </div>
        
        <div class="preview-section">
          <h3>SVG Preview</h3>
          <div class="svg-preview-container" v-html="svgData"></div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
:root {
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --bg: #0f172a;
  --panel-bg: #1e293b;
  --border: #334155;
  --text: #f8fafc;
  --text-muted: #94a3b8;
  --grid-line: rgba(255, 255, 255, 0.05);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(to right, #818cf8, #c084fc);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.header p {
  color: var(--text-muted);
}

.main-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.controls {
  background: var(--panel-bg);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 280px;
  flex-shrink: 0;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.control-group label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
}

.dimensions-inputs {
  display: flex;
  gap: 0.5rem;
}

.input-wrap {
  display: flex;
  align-items: center;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0 0.5rem;
  flex: 1;
}

.input-wrap span {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-right: 0.25rem;
}

.input-wrap input {
  background: transparent;
  border: none;
  color: var(--text);
  width: 100%;
  padding: 0.5rem;
  outline: none;
  font-family: inherit;
}

.tools {
  display: flex;
  gap: 0.5rem;
}

.tool-btn {
  flex: 1;
  padding: 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tool-btn:hover {
  border-color: var(--primary);
}

.tool-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.color-picker {
  width: 100%;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background: transparent;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: 2px solid var(--border);
  border-radius: 0.5rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.action-btn {
  padding: 0.875rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.download-btn {
  background: var(--primary);
  color: white;
}

.download-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.clear-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: #ef4444;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.canvas-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;
}

.canvas-wrapper {
  background: var(--panel-bg);
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.pixel-grid {
  display: grid;
  background-color: var(--bg);
  border: 1px solid var(--border);
  width: 100%;
  max-width: 600px; /* Adjust max width as needed */
  user-select: none;
  touch-action: none;
  /* Checkerboard pattern for transparent background */
  background-image: 
    linear-gradient(45deg, var(--panel-bg) 25%, transparent 25%), 
    linear-gradient(-45deg, var(--panel-bg) 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, var(--panel-bg) 75%), 
    linear-gradient(-45deg, transparent 75%, var(--panel-bg) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.pixel-cell {
  width: 100%;
  height: 100%;
  border-right: 1px solid var(--grid-line);
  border-bottom: 1px solid var(--grid-line);
  cursor: crosshair;
}

/* Remove border on right edge */
/* .pixel-grid > :nth-child(even) {} */

.preview-section {
  background: var(--panel-bg);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid var(--border);
}

.preview-section h3 {
  font-size: 1rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.svg-preview-container {
  background: var(--bg);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  /* Same checkerboard for SVG preview if needed */
  background-image: 
    linear-gradient(45deg, var(--panel-bg) 25%, transparent 25%), 
    linear-gradient(-45deg, var(--panel-bg) 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, var(--panel-bg) 75%), 
    linear-gradient(-45deg, transparent 75%, var(--panel-bg) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.svg-preview-container svg {
  max-width: 200px;
  max-height: 200px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  .controls {
    width: 100%;
  }
}
</style>