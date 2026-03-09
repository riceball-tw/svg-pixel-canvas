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
      <h1><i class="nes-icon star is-medium"></i> SVG Pixel Canvas</h1>
      <p>Create beautiful pixel art and export as SVG!</p>
    </header>

    <main class="main-content">
      <aside class="controls nes-container with-title">
        <p class="title">Controls</p>
        
        <div class="control-group">
          <label>Dimensions</label>
          <div class="dimensions-inputs">
            <div class="input-wrap">
              <span>W</span>
              <input type="number" class="nes-input" v-model.number="width" min="1" max="128" />
            </div>
            <div class="input-wrap">
              <span>H</span>
              <input type="number" class="nes-input" v-model.number="height" min="1" max="128" />
            </div>
          </div>
        </div>

        <div class="control-group">
          <label>Tools</label>
          <div class="tools">
            <button 
              :class="['nes-btn', currentTool === 'draw' ? 'is-primary' : '']" 
              @click="currentTool = 'draw'"
            >
              Draw
            </button>
            <button 
              :class="['nes-btn', currentTool === 'erase' ? 'is-error' : '']" 
              @click="currentTool = 'erase'"
            >
              Erase
            </button>
          </div>
        </div>

        <div class="control-group">
          <label>Color</label>
          <input type="color" v-model="currentColor" class="nes-input color-picker" />
        </div>

        <div class="actions">
          <button class="nes-btn is-warning clear-btn" @click="clearCanvas">
            Clear
          </button>
          <button class="nes-btn is-success download-btn" @click="downloadSVG">
            Export SVG
          </button>
        </div>
      </aside>

      <section class="canvas-section">
        <div class="canvas-wrapper nes-container is-rounded">
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
        
        <div class="preview-section nes-container with-title">
          <p class="title">SVG Preview</p>
          <div class="svg-preview-container" v-html="svgData"></div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
/* Reset modern styling defaults */
body {
  background-color: #f0f0f0;
  color: #212529;
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

.header {
  text-align: center;
  margin-bottom: 2rem;
  margin-top: 2rem;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.header p {
  color: #767676;
  font-size: 0.8rem;
  line-height: 1.5;
}

.main-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 320px;
  flex-shrink: 0;
  background-color: white;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.control-group label {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.dimensions-inputs {
  display: flex;
  gap: 1rem;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.input-wrap span {
  font-size: 0.8rem;
}

.input-wrap input {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.8rem;
}

.tools {
  display: flex;
  gap: 1rem;
}

.tools .nes-btn {
  flex: 1;
  font-size: 0.8rem;
  padding: 0.5rem;
}

.color-picker {
  height: 60px;
  padding: 0.5rem;
  cursor: pointer;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.actions .nes-btn {
  font-size: 0.8rem;
  width: 100%;
}

.canvas-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;
}

.canvas-wrapper {
  background-color: white;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.pixel-grid {
  display: grid;
  background-color: white;
  border: 4px solid #212529; /* Chunky outer border */
  width: 100%;
  max-width: 600px;
  user-select: none;
  touch-action: none;
  /* Chunky 8-bit checkerboard pattern for transparent background */
  background-image: 
    linear-gradient(45deg, #e0e0e0 25%, transparent 25%), 
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%), 
    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
  background-size: 32px 32px;
  background-position: 0 0, 0 16px, 16px -16px, -16px 0px;
}

.pixel-cell {
  width: 100%;
  height: 100%;
  border-right: 1px solid rgba(0,0,0,0.1); /* Subtle inner grid */
  border-bottom: 1px solid rgba(0,0,0,0.1);
  cursor: crosshair;
}

.preview-section {
  background-color: white;
}

.svg-preview-container {
  background-color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Same chunky checkerboard for SVG preview */
  background-image: 
    linear-gradient(45deg, #e0e0e0 25%, transparent 25%), 
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%), 
    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
  background-size: 32px 32px;
  background-position: 0 0, 0 16px, 16px -16px, -16px 0px;
  /* Give it an inset NES feel */
  box-shadow: inset 4px 4px 0px #000, inset -4px -4px 0px #ccc;
  border: 4px solid #212529;
}

.svg-preview-container svg {
  max-width: 200px;
  max-height: 200px;
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