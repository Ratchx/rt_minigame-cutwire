<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from './stores/game.svelte';
  import { uiStore } from './stores/ui.svelte';
  import BombDevice from './components/BombDevice.svelte';
  import ScanLines from './components/ScanLines.svelte';

  onMount(() => {
    // Prevent double-click zoom
    const preventDblClick = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dblclick', preventDblClick, { capture: true, passive: false });

    // Prevent ctrl+wheel zoom
    const preventWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', preventWheel, { capture: true, passive: false });

    // Prevent keyboard zoom (Ctrl + + / - / 0)
    const preventKeyZoom = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '0' || e.key === '+' || e.code === 'Equal' || e.code === 'Minus' || e.code === 'Digit0')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventKeyZoom, { capture: true });

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const preventDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', preventDoubleTap, { capture: true, passive: false });

    // Prevent scrolling / shifting
    const preventScroll = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.scrollTop = 0;
        appEl.scrollLeft = 0;
      }
    };
    window.addEventListener('scroll', preventScroll, { capture: true, passive: true });
    document.addEventListener('scroll', preventScroll, { capture: true, passive: true });

    gameStore.initGame('HARD')

    return () => {
      window.removeEventListener('dblclick', preventDblClick, true);
      window.removeEventListener('wheel', preventWheel, true);
      window.removeEventListener('keydown', preventKeyZoom, true);
      document.removeEventListener('touchend', preventDoubleTap, true);
      window.removeEventListener('scroll', preventScroll, true);
    };
  });
</script>

{#if uiStore.visible}
  <main class="minigame-container">
    <!-- Retro Scanlines, curvature vignette and noise overlays -->
    <ScanLines />

    <!-- Scaled container wrapper (now scales purely via CSS --px-to-vh) -->
    <div 
      class="scale-wrapper" 
      style="display: flex; justify-content: center; align-items: center; pointer-events: auto;"
    >
      <!-- Technical chassis layout -->
      <BombDevice />
    </div>
  </main>
{/if}

<style>
  .minigame-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    
    /* Screen glow backdrop */
    /* background-color: var(--bg-dark); */
  }
</style>
