<script lang="ts">
  import { gameStore } from '../stores/game.svelte';

  // Format timer as 00:XX
  let formattedTime = $derived(
    `00:${gameStore.timer.toString().padStart(2, '0')}`
  );

  // Deriving danger levels
  let dangerLevel = $derived(() => {
    if (gameStore.timer === 0) return { label: 'DETONATED', class: 'detonated' };
    if (gameStore.timer <= 10 || gameStore.instability >= 75) return { label: 'CRITICAL', class: 'critical' };
    if (gameStore.timer <= 20 || gameStore.instability >= 40) return { label: 'ELEVATED', class: 'elevated' };
    return { label: 'STABLE', class: 'stable' };
  });

  // Calculate instability bar divisions
  const maxTicks = 20;
  let activeTicks = $derived(Math.ceil((gameStore.instability / 100) * maxTicks));
</script>

<div class="timer-section glow-border-cyan">
  <!-- Left Side: Danger indicator -->
  <div class="danger-indicator {dangerLevel().class}">
    <span class="label-heading">SYSTEM STATUS</span>
    <span class="status-text">{dangerLevel().label}</span>
    <div class="blinking-light"></div>
  </div>

  <!-- Center: Large Digital Countdown -->
  <div class="countdown-container" class:low-time={gameStore.isLowTime && gameStore.status === 'PLAYING'}>
    <span class="time-shadow">88:88</span>
    <span class="time-value">{formattedTime}</span>
    <span class="subtext">DETONATION TIMER</span>
  </div>

  <!-- Right Side: Instability Meter -->
  <div class="instability-meter">
    <div class="meter-header">
      <span class="label-heading">CORE INSTABILITY</span>
      <span class="instability-percentage text-mono {gameStore.isCriticalInstability ? 'text-red' : 'text-orange'}">
        {gameStore.instability.toString().padStart(3, '0')}%
      </span>
    </div>
    
    <!-- Segmented horizontal bar -->
    <div class="ticks-bar">
      {#each Array(maxTicks) as _, index}
        <div 
          class="tick-segment" 
          class:active={index < activeTicks}
          class:warn={index >= 8 && index < 15}
          class:danger={index >= 15}
        ></div>
      {/each}
    </div>
    <div class="grid-subtext">
      <span>000V</span>
      <span>NOMINAL</span>
      <span>MAX STABIL</span>
    </div>
  </div>
</div>

<style>
  .timer-section {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    align-items: center;
    background: var(--panel-bg);
    border-radius: calc(8 * var(--px-to-vh));
    padding: calc(8 * var(--px-to-vh)) calc(16 * var(--px-to-vh));
    gap: calc(12 * var(--px-to-vh));
    position: relative;
    box-sizing: border-box;
    border-bottom: calc(2 * var(--px-to-vh)) solid var(--color-cyan);
    height: calc(80 * var(--px-to-vh));
  }

  .label-heading {
    font-size: calc(11 * var(--px-to-vh));
    font-weight: 700;
    letter-spacing: calc(1.5 * var(--px-to-vh));
    color: var(--color-muted);
  }

  /* Status Lights Panel */
  .danger-indicator {
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-left: calc(3 * var(--px-to-vh)) solid var(--color-muted);
    padding-left: calc(15 * var(--px-to-vh));
    position: relative;
  }

  .status-text {
    font-size: calc(22 * var(--px-to-vh));
    font-weight: 700;
    letter-spacing: calc(1 * var(--px-to-vh));
    font-family: var(--font-cyber);
    transition: color 0.3s ease;
  }

  .blinking-light {
    position: absolute;
    right: calc(15 * var(--px-to-vh));
    top: 50%;
    transform: translateY(-50%);
    width: calc(12 * var(--px-to-vh));
    height: calc(12 * var(--px-to-vh));
    border-radius: 50%;
    background-color: var(--color-muted);
  }

  /* Status Colors */
  .stable {
    border-left-color: var(--color-lime);
    .status-text { color: var(--color-lime); text-shadow: var(--glow-lime); }
    .blinking-light {
      background-color: var(--color-lime);
      box-shadow: var(--glow-lime);
      animation: blink 2s infinite step-end;
    }
  }

  .elevated {
    border-left-color: var(--color-orange);
    .status-text { color: var(--color-orange); text-shadow: var(--glow-orange); }
    .blinking-light {
      background-color: var(--color-orange);
      box-shadow: var(--glow-orange);
      animation: blink 1s infinite step-end;
    }
  }

  .critical {
    border-left-color: var(--color-red);
    .status-text { color: var(--color-red); text-shadow: var(--glow-red); }
    .blinking-light {
      background-color: var(--color-red);
      box-shadow: var(--glow-red);
      animation: blink 0.4s infinite step-end;
    }
  }

  .detonated {
    border-left-color: #3f0015;
    .status-text { color: var(--color-muted); }
    .blinking-light {
      background-color: #3f0015;
      box-shadow: none;
    }
  }

  /* Countdown Display styling */
  .countdown-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    padding: 0 calc(10 * var(--px-to-vh));
  }

  .time-shadow {
    font-size: calc(46 * var(--px-to-vh));
    font-family: var(--font-mono);
    color: rgba(255, 255, 255, 0.02);
    letter-spacing: calc(2 * var(--px-to-vh));
    line-height: 1;
  }

  .time-value {
    position: absolute;
    top: 0;
    font-size: calc(46 * var(--px-to-vh));
    font-family: var(--font-mono);
    color: var(--color-cyan);
    text-shadow: var(--glow-cyan);
    letter-spacing: calc(2 * var(--px-to-vh));
    line-height: 1;
    transition: all 0.3s ease;
  }

  .subtext {
    font-size: calc(10 * var(--px-to-vh));
    font-weight: 700;
    letter-spacing: calc(2 * var(--px-to-vh));
    color: var(--color-cyan);
    margin-top: calc(4 * var(--px-to-vh));
    opacity: 0.8;
  }

  .countdown-container.low-time {
    .time-value {
      color: var(--color-red);
      text-shadow: var(--glow-red);
      animation: danger-pulse-text 0.5s infinite alternate ease-in-out;
    }
    .subtext {
      color: var(--color-red);
    }
  }

  /* Instability meter grid spacing */
  .instability-meter {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .meter-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: calc(6 * var(--px-to-vh));
  }

  .instability-percentage {
    font-size: calc(15 * var(--px-to-vh));
    font-weight: 700;
  }

  .ticks-bar {
    display: flex;
    gap: calc(3 * var(--px-to-vh));
    height: calc(12 * var(--px-to-vh));
    background: rgba(255, 255, 255, 0.03);
    padding: calc(2 * var(--px-to-vh));
    border-radius: calc(3 * var(--px-to-vh));
    border: calc(1 * var(--px-to-vh)) solid var(--border-muted);
  }

  .tick-segment {
    flex: 1;
    background: rgba(255, 255, 255, 0.07);
    border-radius: calc(1 * var(--px-to-vh));
    transition: background 0.15s ease;
  }

  /* Segment colors when activated */
  .tick-segment.active {
    background: var(--color-lime);
    box-shadow: 0 0 calc(5 * var(--px-to-vh)) rgba(57, 255, 20, 0.4);
  }

  .tick-segment.active.warn {
    background: var(--color-orange);
    box-shadow: 0 0 calc(5 * var(--px-to-vh)) rgba(255, 136, 0, 0.4);
  }

  .tick-segment.active.danger {
    background: var(--color-red);
    box-shadow: 0 0 calc(8 * var(--px-to-vh)) rgba(255, 0, 85, 0.6);
  }

  .grid-subtext {
    display: flex;
    justify-content: space-between;
    font-size: calc(9 * var(--px-to-vh));
    color: var(--color-muted);
    font-family: var(--font-mono);
    margin-top: calc(4 * var(--px-to-vh));
    letter-spacing: calc(0.5 * var(--px-to-vh));
  }

  /* Keyframe loops */
  @keyframes blink {
    from, to { opacity: 1; }
    50% { opacity: 0.2; }
  }

  @keyframes danger-pulse-text {
    0% { transform: scale(1); filter: brightness(1); }
    100% { transform: scale(1.04); filter: brightness(1.3); }
  }
</style>
