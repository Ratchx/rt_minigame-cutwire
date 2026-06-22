<script lang="ts">
  import { gameStore } from '../stores/game.svelte';
  
  // Deriving shake states from failures or recent errors
  let isFailed = $derived(gameStore.status === 'FAILED');
  let isGlitching = $derived(
    gameStore.status === 'PLAYING' && 
    gameStore.mistakes > 0 && 
    gameStore.instability > 0
  );
</script>

<div 
  class="crt-overlay" 
  class:shake={isFailed} 
  class:glitch-shake={isGlitching}
>
  <div class="scanlines"></div>
  <div class="noise"></div>
  <div class="flicker"></div>
  <div class="vignette"></div>
  
  {#if isFailed}
    <div class="explosion-flash"></div>
  {/if}
</div>

<style>
  .crt-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .crt-overlay.shake {
    animation: screen-shake 0.25s infinite;
  }

  /* Short quick vibration when user cuts wrong wire */
  .crt-overlay.glitch-shake {
    animation: screen-shake 0.12s ease-in-out 3;
  }
  
  /* Horizontal raster scanlines overlay */
  .scanlines {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      rgba(18, 16, 16, 0) 50%, 
      rgba(0, 0, 0, 0.25) 50%
    );
    background-size: 100% calc(4 * var(--px-to-vh));
    z-index: 2;
  }
  
  /* Animated scrolling light beam bar */
  .scanlines::after {
    content: "";
    position: absolute;
    left: 0;
    width: 100%;
    height: calc(150 * var(--px-to-vh));
    background: linear-gradient(
      to bottom,
      rgba(0, 243, 255, 0),
      rgba(0, 243, 255, 0.04) 50%,
      rgba(0, 243, 255, 0)
    );
    animation: scanline-roll 8s linear infinite;
    z-index: 3;
  }

  /* SVG Fractal Noise background for terminal grain */
  .noise {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
    z-index: 4;
  }

  /* CRT phosphors glow flicker */
  .flicker {
    position: absolute;
    inset: 0;
    background: rgba(18, 16, 16, 0.015);
    animation: crt-flicker 0.2s infinite;
    z-index: 1;
  }

  /* Vignette border darkness */
  .vignette {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 calc(120 * var(--px-to-vh)) rgba(0, 0, 0, 0.7);
    z-index: 5;
  }

  /* Flash overlay for detonation state */
  .explosion-flash {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, #ff6600 0%, #dd0000 60%, #000 100%);
    opacity: 0;
    z-index: 100;
    mix-blend-mode: screen;
    animation: flash-fade 1.8s cubic-bezier(0.1, 0.8, 0.1, 1) forwards;
  }

  @keyframes flash-fade {
    0% { opacity: 0.98; filter: brightness(2.5); }
    15% { opacity: 0.85; filter: brightness(1.2); }
    100% { opacity: 0.35; }
  }
</style>
