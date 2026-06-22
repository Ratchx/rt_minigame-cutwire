<script lang="ts">
  import { gameStore } from "../stores/game.svelte";
  import { uiStore } from "../stores/ui.svelte";
  import Timer from "./Timer.svelte";
  import WirePanel from "./WirePanel.svelte";
  import Diagnostics from "./Diagnostics.svelte";
  import ProgressTracker from "./ProgressTracker.svelte";
  import { playHoverSound } from "../lib/sound";

  // State derivations for layout
  let remainingAttempts = $derived(gameStore.maxMistakes - gameStore.mistakes);

  function handleRestart() {
    playHoverSound();
    gameStore.initGame(gameStore.difficulty);
  }

  function handleClose() {
    playHoverSound();
    uiStore.hide();
    gameStore.cleanup();
  }
</script>

<div
  class="bomb-device-chassis"
  class:exploded={gameStore.status === "FAILED"}
  class:defused={gameStore.status === "SUCCESS"}
>
  <!-- Hardware Rivets on chassis corners -->
  <div class="rivet top-left"></div>
  <div class="rivet top-right"></div>
  <div class="rivet bottom-left"></div>
  <div class="rivet bottom-right"></div>

  <!-- Diagonal Warning Hazard Stripes on top/bottom borders -->
  <div class="hazard-stripes top"></div>

  <!-- Main HUD header containing timer and status bar -->
  <div class="hud-header">
    <Timer />
  </div>

  <!-- Primary operational panels -->
  <div class="hud-body">
    <!-- LEFT PANEL: Technical stats, attempt indicators, legend -->
    <div class="left-panel-column">
      <!-- Security authorization box -->
      <div class="panel-section glow-border-cyan">
        <span class="section-heading">ENCRYPTION AUTH</span>
        <div class="security-level-display">
          <span class="sec-label">SEC_LEVEL</span>
          <span class="sec-value text-mono">{uiStore.securityLevel}</span>
        </div>
        <div class="difficulty-static-display">
          <span class="diff-label">BYPASS_DIFF</span>
          <span class="diff-value text-mono">{gameStore.difficulty}</span>
        </div>
      </div>

      <!-- Attempts Remaining display -->
      <div class="panel-section glow-border-cyan">
        <span class="section-heading">ATTEMPTS REMAINING</span>
        <div class="attempts-container">
          <div class="attempts-counter text-mono">
            {remainingAttempts} / {gameStore.maxMistakes}
          </div>
          <div class="attempts-visual">
            {#each Array(gameStore.maxMistakes) as _, index}
              <div
                class="attempt-node"
                class:active={index < remainingAttempts}
                class:danger={remainingAttempts === 1}
              >
                <div class="attempt-led"></div>
                <span class="attempt-label">SYS_0{index + 1}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Information/Legend Panel -->
      <div class="panel-section info-legend-box glow-border-cyan">
        <span class="section-heading">CIRCUIT LEGEND SPECS</span>
        <div class="legend-content">
          <div class="legend-item">
            <span class="bullet cyan">■</span>
            <div class="desc">
              <strong>BYPASS SEQ:</strong> Cut target wires sequentially. Follow
              bottom sequence order.
            </div>
          </div>
          <div class="legend-item">
            <span class="bullet orange">■</span>
            <div class="desc">
              <strong>DECOY:</strong> Safe to cut but breaks bypass sequence chain.
            </div>
          </div>
          <div class="legend-item">
            <span class="bullet red">■</span>
            <div class="desc">
              <strong>SURGE (WRG-*):</strong> Trigger voltage backfeed. Deducts time
              & increases instability.
            </div>
          </div>
          <div class="legend-item">
            <span class="bullet gray">■</span>
            <div class="desc">
              <strong>FAULT (FLT-*):</strong> Disconnected/broken lines. Induces
              visual glitch & instability.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CENTER PANEL: Interactive wire cutting SVG area -->
    <div class="center-panel-column">
      <WirePanel />
    </div>

    <!-- RIGHT PANEL: Scrolling terminal diagnostics logs -->
    <div class="right-panel-column">
      <Diagnostics />
    </div>
  </div>

  <!-- Bottom hud containing sequence pipeline -->
  <div class="hud-footer">
    <ProgressTracker />
  </div>

  <div class="hazard-stripes bottom"></div>

  <!-- SUCCESS CLEARANCE SPLASH SCREEN -->
  {#if gameStore.status === "SUCCESS"}
    <div class="splash-overlay success-splash">
      <div class="splash-box glow-border-cyan">
        <div class="glitch-title" data-text="CLEARANCE GRANTED">
          CLEARANCE GRANTED
        </div>
        <div class="splash-divider"></div>
        <p class="splash-subtext">CORE VOLTAGE DISCHARGED SAFELY</p>
        <p class="stats-line text-mono">
          REMAINING TIME: {gameStore.timer}s // ATTEMPTS: {remainingAttempts}/{gameStore.maxMistakes}
        </p>
      </div>
    </div>
  {/if}

  <!-- EXPLOSION FAILURE SPLASH SCREEN -->
  {#if gameStore.status === "FAILED"}
    <div class="splash-overlay failure-splash">
      <div class="splash-box glow-border-red">
        <div class="glitch-title-failed" data-text="SYSTEM DETONATED">
          SYSTEM DETONATED
        </div>
        <div class="splash-divider-failed"></div>
        <p class="splash-subtext-failed">CRITICAL CIRCUIT CONTAINMENT FAIL</p>
        <p class="stats-line-failed text-mono">
          CODE ERR: VOLTAGE_OVERLOAD // STABILITY: 0.0%
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  .bomb-device-chassis {
    width: calc(1040 * var(--px-to-vh));
    height: calc(720 * var(--px-to-vh));
    background: #0d0f13;
    border: calc(3 * var(--px-to-vh)) solid #202632;
    border-radius: calc(12 * var(--px-to-vh));
    position: relative;
    display: flex;
    flex-direction: column;
    padding: calc(8 * var(--px-to-vh));
    box-sizing: border-box;
    box-shadow:
      0 calc(30 * var(--px-to-vh)) calc(70 * var(--px-to-vh)) rgba(0, 0, 0, 0.8),
      inset 0 0 calc(40 * var(--px-to-vh)) rgba(0, 243, 255, 0.03);
    z-index: 10;
    transition:
      border-color 0.5s ease,
      box-shadow 0.5s ease;
  }

  /* Success/Failed visual states for outer box glow */
  .bomb-device-chassis.defused {
    border-color: var(--color-lime);
    box-shadow:
      0 calc(30 * var(--px-to-vh)) calc(80 * var(--px-to-vh)) rgba(57, 255, 20, 0.15),
      inset 0 0 calc(50 * var(--px-to-vh)) rgba(57, 255, 20, 0.05);
  }

  .bomb-device-chassis.exploded {
    border-color: var(--color-red);
    box-shadow:
      0 calc(30 * var(--px-to-vh)) calc(85 * var(--px-to-vh)) rgba(255, 0, 85, 0.25),
      inset 0 0 calc(50 * var(--px-to-vh)) rgba(255, 0, 85, 0.08);
  }

  /* Chassis decoration elements */
  .rivet {
    position: absolute;
    width: calc(10 * var(--px-to-vh));
    height: calc(10 * var(--px-to-vh));
    border-radius: 50%;
    background: radial-gradient(circle, #5a6477 0%, #1c202a 80%);
    border: calc(1 * var(--px-to-vh)) solid #101217;
    box-shadow: inset 0 calc(1 * var(--px-to-vh)) calc(2 * var(--px-to-vh)) rgba(255, 255, 255, 0.2);
  }
  .rivet.top-left {
    top: calc(6 * var(--px-to-vh));
    left: calc(6 * var(--px-to-vh));
  }
  .rivet.top-right {
    top: calc(6 * var(--px-to-vh));
    right: calc(6 * var(--px-to-vh));
  }
  .rivet.bottom-left {
    bottom: calc(6 * var(--px-to-vh));
    left: calc(6 * var(--px-to-vh));
  }
  .rivet.bottom-right {
    bottom: calc(6 * var(--px-to-vh));
    right: calc(6 * var(--px-to-vh));
  }

  /* Hazard stripes */
  .hazard-stripes {
    height: calc(5 * var(--px-to-vh));
    background: repeating-linear-gradient(
      -45deg,
      #facc15,
      #facc15 calc(8 * var(--px-to-vh)),
      #1e293b calc(8 * var(--px-to-vh)),
      #1e293b calc(16 * var(--px-to-vh))
    );
    opacity: 0.6;
    border-radius: calc(2 * var(--px-to-vh));
  }
  .hazard-stripes.top {
    margin-bottom: calc(8 * var(--px-to-vh));
  }
  .hazard-stripes.bottom {
    margin-top: calc(8 * var(--px-to-vh));
  }

  /* Layout grids */
  .hud-header {
    margin-bottom: calc(8 * var(--px-to-vh));
    flex-shrink: 0;
  }

  .hud-body {
    display: grid;
    grid-template-columns: calc(240 * var(--px-to-vh)) 1fr calc(280 * var(--px-to-vh));
    gap: calc(12 * var(--px-to-vh));
    flex-grow: 1;
    height: calc(462 * var(--px-to-vh));
    min-height: 0; /* Important to prevent overflow on grid kids */
    margin-bottom: calc(8 * var(--px-to-vh));
    overflow: hidden;
  }

  .hud-footer {
    flex-shrink: 0;
  }

  /* Left Panel columns items styling */
  .left-panel-column {
    display: flex;
    flex-direction: column;
    gap: calc(8 * var(--px-to-vh));
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .panel-section {
    background: var(--panel-bg-glass);
    border-radius: calc(6 * var(--px-to-vh));
    padding: calc(10 * var(--px-to-vh)) calc(14 * var(--px-to-vh));
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .section-heading {
    font-size: calc(10 * var(--px-to-vh));
    font-weight: 700;
    color: var(--color-muted);
    letter-spacing: calc(1.5 * var(--px-to-vh));
    border-bottom: calc(1 * var(--px-to-vh)) solid var(--border-muted);
    padding-bottom: calc(4 * var(--px-to-vh));
    margin-bottom: calc(8 * var(--px-to-vh));
  }

  /* Security Level box items */
  .security-level-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    padding: calc(8 * var(--px-to-vh)) calc(10 * var(--px-to-vh));
    border-radius: calc(4 * var(--px-to-vh));
    border-left: calc(3 * var(--px-to-vh)) solid var(--color-cyan);
    margin-bottom: calc(8 * var(--px-to-vh));
  }

  .sec-label {
    font-size: calc(10 * var(--px-to-vh));
    color: var(--color-muted);
    font-weight: bold;
  }

  .sec-value {
    font-size: calc(16 * var(--px-to-vh));
    font-weight: bold;
    color: var(--color-cyan);
    text-shadow: var(--glow-cyan);
  }

  /* Difficulty Static Display */
  .difficulty-static-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 136, 0, 0.05);
    padding: calc(6 * var(--px-to-vh)) calc(10 * var(--px-to-vh));
    border-radius: calc(4 * var(--px-to-vh));
    border-left: calc(3 * var(--px-to-vh)) solid var(--color-orange);
  }

  .diff-label {
    font-size: calc(10 * var(--px-to-vh));
    color: var(--color-muted);
    font-weight: bold;
  }

  .diff-value {
    font-size: calc(14 * var(--px-to-vh));
    font-weight: bold;
    color: var(--color-orange);
    text-shadow: var(--glow-orange);
  }

  /* Attempts display */
  .attempts-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .attempts-counter {
    font-size: calc(20 * var(--px-to-vh));
    font-weight: bold;
    color: var(--color-white);
  }

  .attempts-visual {
    display: flex;
    gap: calc(8 * var(--px-to-vh));
  }

  .attempt-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(2 * var(--px-to-vh));
  }

  .attempt-led {
    width: calc(14 * var(--px-to-vh));
    height: calc(6 * var(--px-to-vh));
    border-radius: calc(2 * var(--px-to-vh));
    background: #1c202a;
    border: calc(1 * var(--px-to-vh)) solid #272c3a;
    transition: all 0.3s ease;
  }

  .attempt-node.active .attempt-led {
    background: var(--color-lime);
    box-shadow: var(--glow-lime);
    border-color: rgba(57, 255, 20, 0.3);
  }

  .attempt-node.active.danger .attempt-led {
    background: var(--color-red);
    box-shadow: var(--glow-red);
    border-color: rgba(255, 0, 85, 0.3);
    animation: flash 0.5s infinite alternate;
  }

  .attempt-label {
    font-size: calc(8 * var(--px-to-vh));
    color: var(--color-muted);
    font-family: var(--font-mono);
  }

  /* Rule specs bullet points */
  .info-legend-box {
    flex-grow: 1;
    min-height: 0;
  }

  .legend-content {
    display: flex;
    flex-direction: column;
    gap: calc(5 * var(--px-to-vh));
    overflow-y: auto;
    font-size: calc(10.5 * var(--px-to-vh));
    line-height: 1.3;
    padding-right: calc(4 * var(--px-to-vh));
  }

  .legend-item {
    display: flex;
    align-items: flex-start;
    gap: calc(8 * var(--px-to-vh));
  }

  .bullet {
    font-size: calc(12 * var(--px-to-vh));
    line-height: 1;
  }

  .bullet.cyan {
    color: var(--color-cyan);
  }
  .bullet.orange {
    color: var(--color-orange);
  }
  .bullet.red {
    color: var(--color-red);
  }
  .bullet.gray {
    color: var(--color-muted);
  }

  .desc strong {
    font-weight: 700;
    color: var(--color-white);
  }

  /* Center column wire area wrapper */
  .center-panel-column {
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  /* Right column log logs wrapper */
  .right-panel-column {
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  /* Splash Screens (Victory / Failure) overlay card layouts */
  .splash-overlay {
    position: absolute;
    inset: 0;
    background: rgba(4, 5, 7, 0.9);
    border-radius: calc(12 * var(--px-to-vh));
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: calc(40 * var(--px-to-vh));
    animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .splash-box {
    width: calc(480 * var(--px-to-vh));
    background: #0a0d13;
    padding: calc(30 * var(--px-to-vh));
    border-radius: calc(8 * var(--px-to-vh));
    text-align: center;
    box-shadow: 0 calc(20 * var(--px-to-vh)) calc(50 * var(--px-to-vh)) rgba(0, 0, 0, 0.6);
  }

  /* Success typography glitch effects */
  .glitch-title {
    font-size: calc(32 * var(--px-to-vh));
    font-weight: 900;
    letter-spacing: calc(2 * var(--px-to-vh));
    color: var(--color-lime);
    text-shadow: var(--glow-lime);
    position: relative;
  }

  .splash-divider {
    height: calc(2 * var(--px-to-vh));
    background: var(--color-lime);
    box-shadow: var(--glow-lime);
    margin: calc(16 * var(--px-to-vh)) auto;
    width: 80%;
  }

  .splash-subtext {
    font-size: calc(13 * var(--px-to-vh));
    letter-spacing: calc(1.5 * var(--px-to-vh));
    color: var(--color-white);
    margin-bottom: calc(4 * var(--px-to-vh));
  }

  .stats-line {
    font-size: calc(11 * var(--px-to-vh));
    color: var(--color-muted);
    margin-bottom: calc(24 * var(--px-to-vh));
  }

  .splash-actions {
    display: flex;
    gap: calc(12 * var(--px-to-vh));
    justify-content: center;
  }

  .splash-btn {
    border-radius: calc(4 * var(--px-to-vh));
    font-family: var(--font-cyber);
    font-size: calc(12 * var(--px-to-vh));
    font-weight: 700;
    letter-spacing: calc(1 * var(--px-to-vh));
    padding: calc(10 * var(--px-to-vh)) calc(20 * var(--px-to-vh));
    cursor: pointer;
  }

  .close-nui-btn {
    background: var(--color-lime);
    color: var(--bg-dark);
    border: none;
    box-shadow: var(--glow-lime);
  }

  .close-nui-btn:hover {
    filter: brightness(1.2);
  }

  .retry-btn {
    background: transparent;
    color: var(--color-white);
    border: calc(1 * var(--px-to-vh)) solid var(--border-muted);
  }

  .retry-btn:hover {
    border-color: var(--color-white);
    background: rgba(255, 255, 255, 0.05);
  }

  /* Failure splash styling overrides */
  .glitch-title-failed {
    font-size: calc(32 * var(--px-to-vh));
    font-weight: 900;
    letter-spacing: calc(2 * var(--px-to-vh));
    color: var(--color-red);
    text-shadow: var(--glow-red);
    position: relative;
  }

  .splash-divider-failed {
    height: calc(2 * var(--px-to-vh));
    background: var(--color-red);
    box-shadow: var(--glow-red);
    margin: calc(16 * var(--px-to-vh)) auto;
    width: 80%;
  }

  .splash-subtext-failed {
    font-size: calc(13 * var(--px-to-vh));
    letter-spacing: calc(1.5 * var(--px-to-vh));
    color: var(--color-white);
    margin-bottom: calc(4 * var(--px-to-vh));
  }

  .stats-line-failed {
    font-size: calc(11 * var(--px-to-vh));
    color: var(--color-muted);
    margin-bottom: calc(24 * var(--px-to-vh));
  }

  .close-nui-btn-failed {
    background: transparent;
    color: var(--color-white);
    border: calc(1 * var(--px-to-vh)) solid var(--border-red);
  }

  .close-nui-btn-failed:hover {
    background: rgba(255, 0, 85, 0.05);
  }

  .retry-btn-failed {
    background: var(--color-red);
    color: var(--color-white);
    border: none;
    box-shadow: var(--glow-red);
  }

  .retry-btn-failed:hover {
    filter: brightness(1.2);
  }

  /* Keyframe animations */
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes flash {
    from {
      opacity: 0.2;
    }
    to {
      opacity: 1;
    }
  }
</style>
