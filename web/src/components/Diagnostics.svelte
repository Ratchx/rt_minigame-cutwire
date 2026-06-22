<script lang="ts">
  import { gameStore } from "../stores/game.svelte";
  import { tick } from "svelte";

  let terminalContainer = $state<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of diagnostics logs as entries are added
  $effect(() => {
    // Reference gameStore.logs to register dependency
    const logsLength = gameStore.logs.length;

    if (terminalContainer) {
      tick().then(() => {
        if (terminalContainer) {
          terminalContainer.scrollTo({
            top: terminalContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  });
</script>

<div class="diagnostics-panel glow-border-cyan">
  <!-- Top diagnostic header -->
  <div class="panel-header">
    <div class="blinking-dot"></div>
    <span class="panel-title">TERMINAL LOGS FEED</span>
    <span class="port-num">COM_PORT_NUI</span>
  </div>

  <!-- Terminal log container -->
  <div class="logs-container" bind:this={terminalContainer}>
    <div class="logs-wrapper">
      <div class="log-row initial-msg">
        <span class="timestamp">[00:00:00]</span>
        <span class="msg text-muted"
          >BOOT: Kernel initializing. Memory check ok.</span
        >
      </div>
      <div class="log-row initial-msg">
        <span class="timestamp">[00:00:00]</span>
        <span class="msg text-muted">PORT: Binding WebSocket NUI channel.</span>
      </div>

      <!-- Render reversed list so they scroll upward -->
      {#each [...gameStore.logs].reverse() as log (log.id)}
        <div class="log-row {log.type}">
          <span class="timestamp">[{log.timestamp}]</span>
          <span class="msg">{log.message}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Technical footer metadata -->
  <div class="panel-footer">
    <span>BAUD: 115200</span>
    <span>BUFF: {gameStore.logs.length}/40</span>
    <span>SYS_ACTIVE</span>
  </div>
</div>

<style>
  .diagnostics-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--panel-bg-glass);
    border-radius: calc(8 * var(--px-to-vh));
    box-sizing: border-box;
    overflow: hidden;
  }

  /* Header style */
  .panel-header {
    display: flex;
    align-items: center;
    padding: calc(8 * var(--px-to-vh)) calc(12 * var(--px-to-vh));
    background: rgba(0, 243, 255, 0.05);
    border-bottom: calc(1 * var(--px-to-vh)) solid var(--border-cyan);
    font-size: calc(11 * var(--px-to-vh));
    font-weight: 700;
    letter-spacing: calc(1 * var(--px-to-vh));
  }

  .blinking-dot {
    width: calc(6 * var(--px-to-vh));
    height: calc(6 * var(--px-to-vh));
    border-radius: 50%;
    background-color: var(--color-cyan);
    box-shadow: var(--glow-cyan);
    margin-right: calc(8 * var(--px-to-vh));
    animation: flash 1s infinite alternate;
  }

  .panel-title {
    color: var(--color-cyan);
    flex-grow: 1;
  }

  .port-num {
    font-family: var(--font-mono);
    color: var(--color-muted);
  }

  /* Logs scrolling viewport */
  .logs-container {
    flex-grow: 1;
    overflow-y: auto;
    padding: calc(8 * var(--px-to-vh)) calc(12 * var(--px-to-vh));
    box-sizing: border-box;
    font-family: var(--font-mono);
    font-size: calc(11 * var(--px-to-vh));
    line-height: 1.3;
  }

  .logs-wrapper {
    display: flex;
    flex-direction: column;
    gap: calc(4 * var(--px-to-vh));
    justify-content: flex-end;
    min-height: 100%;
  }

  .log-row {
    display: flex;
    gap: calc(8 * var(--px-to-vh));
    align-items: flex-start;
    animation: slide-in-up 0.15s ease-out forwards;
  }

  .timestamp {
    color: var(--color-muted);
    white-space: nowrap;
  }

  .msg {
    word-break: normal;
    overflow-wrap: break-word;
  }

  /* Color themes for types of logs */
  .info {
    color: var(--color-white);
  }

  .warning {
    color: var(--color-orange);
    text-shadow: 0 0 calc(4 * var(--px-to-vh)) rgba(255, 136, 0, 0.2);
  }

  .error {
    color: var(--color-red);
    text-shadow: 0 0 calc(5 * var(--px-to-vh)) rgba(255, 0, 85, 0.3);
  }

  .success {
    color: var(--color-lime);
    text-shadow: 0 0 calc(5 * var(--px-to-vh)) rgba(57, 255, 20, 0.3);
  }

  /* Footer styling */
  .panel-footer {
    display: flex;
    justify-content: space-between;
    padding: calc(6 * var(--px-to-vh)) calc(12 * var(--px-to-vh));
    border-top: calc(1 * var(--px-to-vh)) solid var(--border-muted);
    font-size: calc(9 * var(--px-to-vh));
    color: var(--color-muted);
    font-family: var(--font-mono);
    background: rgba(0, 0, 0, 0.2);
    letter-spacing: calc(0.5 * var(--px-to-vh));
  }

  /* Keyframes */
  @keyframes flash {
    0% {
      opacity: 0.2;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes slide-in-up {
    from {
      opacity: 0;
      transform: translateY(calc(4 * var(--px-to-vh)));
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
