<script lang="ts">
  import { gameStore } from '../stores/game.svelte';

  // Derives remaining sequence to print
  let currentTargetLabel = $derived(
    gameStore.currentObjectiveWire ? gameStore.currentObjectiveWire.label : 'NONE'
  );
</script>

<div class="progress-tracker glow-border-cyan">
  <!-- Left Column: Primary Objective -->
  <div class="objective-display">
    <div class="header">
      <span class="label-heading">ACTIVE BYPASS OBJECTIVE</span>
    </div>
    {#if gameStore.status === 'PLAYING'}
      <div class="objective-body pulsing">
        <span class="crosshair-icon">⌖</span>
        <span class="target-wire text-mono">{currentTargetLabel}</span>
      </div>
    {:else if gameStore.status === 'SUCCESS'}
      <div class="objective-body success">
        <span class="checkmark-icon">✓</span>
        <span class="target-wire text-mono text-lime">BYPASSED</span>
      </div>
    {:else if gameStore.status === 'FAILED'}
      <div class="objective-body failed">
        <span class="warning-icon">⚠</span>
        <span class="target-wire text-mono text-red">DETONATED</span>
      </div>
    {:else}
      <div class="objective-body">
        <span class="target-wire text-mono text-muted">AWAITING AUTH</span>
      </div>
    {/if}
  </div>

  <!-- Right Column: Visual Sequence Checklist -->
  <div class="sequence-list">
    <span class="label-heading">BYPASS SEQUENCE PIPELINE</span>
    
    <div class="nodes-row">
      {#each gameStore.sequenceWires as wire, index}
        {@const isActive = index === gameStore.currentSequenceIndex && gameStore.status === 'PLAYING'}
        {@const isCompleted = wire.isCut && wire.cutSequenceIndex < gameStore.currentSequenceIndex}
        
        <div 
          class="sequence-node" 
          class:completed={isCompleted}
          class:active={isActive}
        >
          <div class="node-index text-mono">0{index + 1}</div>
          <div class="node-label text-mono">{wire.label}</div>
          <div class="node-indicator">
            {#if isCompleted}
              <span class="dot-completed">✓</span>
            {:else if isActive}
              <span class="dot-active">⌖</span>
            {:else}
              <span class="dot-pending">🔒</span>
            {/if}
          </div>
        </div>
        
        <!-- Connector line between nodes, except last one -->
        {#if index < gameStore.sequenceWires.length - 1}
          <div 
            class="node-divider"
            class:completed={index < gameStore.currentSequenceIndex}
          ></div>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .progress-tracker {
    display: grid;
    grid-template-columns: calc(280 * var(--px-to-vh)) 1fr;
    background: var(--panel-bg);
    border-radius: calc(8 * var(--px-to-vh));
    padding: calc(16 * var(--px-to-vh)) calc(24 * var(--px-to-vh));
    gap: calc(30 * var(--px-to-vh));
    align-items: center;
    box-sizing: border-box;
    height: calc(120 * var(--px-to-vh));
  }

  .label-heading {
    font-size: calc(11 * var(--px-to-vh));
    font-weight: 700;
    letter-spacing: calc(1.5 * var(--px-to-vh));
    color: var(--color-muted);
  }

  /* Left column styling - Active Objective target */
  .objective-display {
    display: flex;
    flex-direction: column;
    gap: calc(4 * var(--px-to-vh));
    border-right: calc(1 * var(--px-to-vh)) solid var(--border-muted);
    padding-right: calc(20 * var(--px-to-vh));
  }

  .objective-body {
    display: flex;
    align-items: center;
    gap: calc(12 * var(--px-to-vh));
    background: rgba(0, 0, 0, 0.25);
    border: calc(1 * var(--px-to-vh)) solid var(--border-muted);
    padding: calc(10 * var(--px-to-vh)) calc(16 * var(--px-to-vh));
    border-radius: calc(4 * var(--px-to-vh));
    height: calc(48 * var(--px-to-vh));
    box-sizing: border-box;
  }

  .objective-body.pulsing {
    border-color: rgba(255, 136, 0, 0.6);
    box-shadow: 0 0 calc(10 * var(--px-to-vh)) rgba(255, 136, 0, 0.15);
    animation: alert-pulse 1.5s infinite alternate ease-in-out;
    
    .target-wire {
      color: var(--color-orange);
      text-shadow: var(--glow-orange);
    }
    
    .crosshair-icon {
      color: var(--color-orange);
      text-shadow: var(--glow-orange);
      animation: spin 3s linear infinite;
    }
  }

  .objective-body.success {
    border-color: var(--color-lime);
    box-shadow: 0 0 calc(10 * var(--px-to-vh)) rgba(57, 255, 20, 0.15);
  }

  .objective-body.failed {
    border-color: var(--color-red);
    box-shadow: 0 0 calc(10 * var(--px-to-vh)) rgba(255, 0, 85, 0.15);
    
    .warning-icon {
      color: var(--color-red);
      text-shadow: var(--glow-red);
      animation: alert-flash 0.5s infinite step-end;
    }
  }

  .crosshair-icon {
    font-size: calc(20 * var(--px-to-vh));
  }

  .target-wire {
    font-size: calc(20 * var(--px-to-vh));
    font-weight: 700;
    letter-spacing: calc(1 * var(--px-to-vh));
  }

  /* Right column: Nodes checklist */
  .sequence-list {
    display: flex;
    flex-direction: column;
    gap: calc(8 * var(--px-to-vh));
  }

  .nodes-row {
    display: flex;
    align-items: center;
    gap: calc(6 * var(--px-to-vh));
    overflow-x: auto;
    padding: calc(6 * var(--px-to-vh)) calc(6 * var(--px-to-vh));
    box-sizing: border-box;
  }

  .sequence-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.02);
    border: calc(1 * var(--px-to-vh)) solid var(--border-muted);
    border-radius: calc(4 * var(--px-to-vh));
    padding: calc(6 * var(--px-to-vh)) calc(14 * var(--px-to-vh));
    min-width: calc(80 * var(--px-to-vh));
    height: calc(56 * var(--px-to-vh));
    box-sizing: border-box;
    transition: all 0.3s ease;
  }

  .node-index {
    font-size: calc(9 * var(--px-to-vh));
    color: var(--color-muted);
    letter-spacing: calc(0.5 * var(--px-to-vh));
  }

  .node-label {
    font-size: calc(14 * var(--px-to-vh));
    font-weight: 700;
    margin: calc(2 * var(--px-to-vh)) 0;
    color: var(--color-white);
  }

  .node-indicator {
    font-size: calc(12 * var(--px-to-vh));
    height: calc(16 * var(--px-to-vh));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Completion states of nodes */
  .sequence-node.completed {
    border-color: var(--color-lime);
    background: rgba(57, 255, 20, 0.03);
    
    .node-label {
      color: var(--color-lime);
      text-shadow: var(--glow-lime);
    }
  }

  .sequence-node.active {
    border-color: var(--color-cyan);
    background: rgba(0, 243, 255, 0.06);
    box-shadow: 0 0 calc(10 * var(--px-to-vh)) rgba(0, 243, 255, 0.2);
    
    .node-label {
      color: var(--color-cyan);
      text-shadow: var(--glow-cyan);
    }
  }

  /* Connectors styling */
  .node-divider {
    height: calc(2 * var(--px-to-vh));
    width: calc(20 * var(--px-to-vh));
    background: rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
    transition: background 0.3s ease;
  }

  .node-divider.completed {
    background: var(--color-lime);
    box-shadow: 0 0 calc(5 * var(--px-to-vh)) rgba(57, 255, 20, 0.3);
  }

  /* Animations keyframes */
  @keyframes alert-pulse {
    0% {
      border-color: rgba(255, 136, 0, 0.3);
      box-shadow: 0 0 calc(4 * var(--px-to-vh)) rgba(255, 136, 0, 0.05);
    }
    100% {
      border-color: rgba(255, 136, 0, 0.8);
      box-shadow: 0 0 calc(15 * var(--px-to-vh)) rgba(255, 136, 0, 0.3);
    }
  }

  @keyframes alert-flash {
    from, to { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
