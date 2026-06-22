<script lang="ts">
  import { gameStore } from "../stores/game.svelte";
  import { playHoverSound } from "../lib/sound";
  import type { Wire } from "../types/wire";

  // State for diagnostic scan overlay
  let isScanning = $state<boolean>(false);
  let scanTimer: any = null;

  // Track hovered wire ID
  let hoveredWireId = $state<string | null>(null);

  // Sparks particle system state
  interface Spark {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
  }
  let sparks = $state<Spark[]>([]);
  let sparkIdCounter = 0;

  // Sort wires so the hovered wire is rendered last, overlaying on top of others
  let sortedWires = $derived([
    ...gameStore.wires.filter((w) => w.id !== hoveredWireId),
    ...gameStore.wires.filter((w) => w.id === hoveredWireId),
  ]);

  // Trigger diagnostic scans
  function triggerScan() {
    if (gameStore.status !== "PLAYING") return;

    isScanning = true;
    playHoverSound();

    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      isScanning = false;
    }, 4000); // Labels stay visible for 4s
  }

  // Handle wire hover
  function handleMouseEnter(wire: Wire) {
    if (gameStore.status !== "PLAYING" || wire.isCut) return;
    hoveredWireId = wire.id;
    playHoverSound();
  }

  function handleMouseLeave() {
    hoveredWireId = null;
  }

  // Handle wire cut
  function handleWireClick(wire: Wire) {
    if (gameStore.status !== "PLAYING" || wire.isCut) return;

    // Spawn spark particles at cut point
    spawnSparks(wire);

    // Perform cut action in store
    gameStore.cutWire(wire.id);

    if (hoveredWireId === wire.id) {
      hoveredWireId = null;
    }
  }

  // Spawn spark particles relative to the SVG mid-point
  function spawnSparks(wire: Wire) {
    const midX = 250; // Approximated center of calc(500 * var(--px-to-vh)) wide area
    const midY = (wire.connectorLeftY + wire.connectorRightY) / 2;

    const count = 15 + Math.floor(Math.random() * 10);
    const newSparks: Spark[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      newSparks.push({
        id: sparkIdCounter++,
        x: midX,
        y: midY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0, // bias upward slightly
        color: wire.isPenalty ? "#ff0055" : "#00f3ff",
        size: 2 + Math.random() * 4,
      });
    }

    sparks = [...sparks, ...newSparks];

    // Trigger frame update logic to animate sparks
    const startTime = Date.now();
    const updateSparks = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 700) {
        // Filter out this batch of sparks
        sparks = sparks.filter((s) => !newSparks.includes(s));
      } else {
        // Apply physics
        sparks = sparks.map((s) => {
          if (newSparks.includes(s)) {
            return {
              ...s,
              x: s.x + s.vx,
              y: s.y + s.vy + 0.15, // gravity
            };
          }
          return s;
        });
        requestAnimationFrame(updateSparks);
      }
    };
    requestAnimationFrame(updateSparks);
  }

  // Get dangling bezier paths for a severed wire
  function getSeveredPaths(wire: Wire) {
    const startX = 30;
    const endX = 470;
    const yLeft = wire.connectorLeftY;
    const yRight = wire.connectorRightY;
    const midX = (startX + endX) / 2;
    const midY = (yLeft + yRight) / 2;

    // Gravity pulls severed wires downward
    const dropLeft = Math.min(
      480,
      midY + 50 + (parseInt(wire.id.split("_")[1] || "0") % 3) * 15,
    );
    const dropRight = Math.min(
      480,
      midY + 65 + (parseInt(wire.id.split("_")[1] || "0") % 2) * 20,
    );

    const cp1x = startX + 80;
    const cp1y = yLeft;
    const cp2x = midX - 40;
    const cp2y = midY + 20;

    const leftD = `M ${startX} ${yLeft} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${midX - 15} ${dropLeft}`;

    const cp3x = midX + 40;
    const cp3y = midY + 20;
    const cp4x = endX - 80;
    const cp4y = yRight;

    const rightD = `M ${midX + 15} ${dropRight} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${endX} ${yRight}`;

    return { leftD, rightD };
  }

  // Handle focus scroll prevention inside the panel container
  let containerEl = $state<HTMLDivElement | null>(null);
  $effect(() => {
    const el = containerEl;
    if (el) {
      const handleScroll = () => {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      };
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        el.removeEventListener("scroll", handleScroll);
      };
    }
  });
</script>

<div class="wire-panel">
  <!-- Interactive Header Panel -->
  <div class="panel-header">
    <div class="header-leds">
      <div class="led" class:scanning={isScanning}></div>
      <span class="panel-tag">CIRCUIT INTERCEPT GRID</span>
    </div>
  </div>

  <!-- SVG Arena -->
  <div class="svg-container" bind:this={containerEl}>
    <!-- Grid line overlays underneath SVG -->
    <div class="bg-grid"></div>

    <div class="svg-wrapper">
      <svg
        viewBox="0 0 500 500"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        overflow="hidden"
        class="wire-svg"
        ondblclick={(e) => e.preventDefault()}
      >
        <defs>
          <!-- Glowing filters for hover neon effects -->
          <filter
            id="glow-cyan-svg"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-wire" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Render Left Connector Screws/Pads -->
        {#each gameStore.wires as wire (wire.id + "_left_pad")}
          <g class="connector-group left">
            <!-- Connector metallic plate -->
            <rect
              x="5"
              y={wire.connectorLeftY - 10}
              width="22"
              height="20"
              rx="3"
              fill="#1b1e25"
              stroke="#373e4f"
            />
            <circle
              cx="16"
              cy={wire.connectorLeftY}
              r="5"
              fill="#2d3341"
              stroke="#48536b"
            />
            <!-- Small center screw -->
            <line
              x1="14"
              y1={wire.connectorLeftY - 2}
              x2="18"
              y2={wire.connectorLeftY + 2}
              stroke="#8595b2"
              stroke-width="1.5"
            />

            <!-- Port index label (L-01, etc.) -->
            <text
              x="32"
              y={wire.connectorLeftY + 4}
              class="connector-label text-mono"
              fill="#9ca3af"
            >
              {wire.connectorLeftLabel}
            </text>
          </g>
        {/each}

        <!-- Render Right Connector Screws/Pads -->
        {#each gameStore.wires as wire (wire.id + "_right_pad")}
          <g class="connector-group right">
            <rect
              x="473"
              y={wire.connectorRightY - 10}
              width="22"
              height="20"
              rx="3"
              fill="#1b1e25"
              stroke="#373e4f"
            />
            <circle
              cx="484"
              cy={wire.connectorRightY}
              r="5"
              fill="#2d3341"
              stroke="#48536b"
            />
            <line
              x1="482"
              y1={wire.connectorRightY - 2}
              x2="486"
              y2={wire.connectorRightY + 2}
              stroke="#8595b2"
              stroke-width="1.5"
            />

            <text
              x="468"
              y={wire.connectorRightY + 4}
              class="connector-label text-mono right-align"
              fill="#9ca3af"
            >
              {wire.connectorRightLabel}
            </text>
          </g>
        {/each}

        <!-- Dynamic Wire rendering sorted so hovered is on top -->
        {#each sortedWires as wire (wire.id)}
          {@const isHovered = hoveredWireId === wire.id}
          {@const showLabel = isScanning || isHovered}

          {#if !wire.isCut}
            <!-- Single curved wire -->
            <!-- Background thick clickbox handler to make clicking easy -->
            <path
              d={wire.pathD}
              fill="none"
              stroke="transparent"
              stroke-width="14"
              class="wire-click-target"
              role="button"
              tabindex="-1"
              aria-label="Cut wire {wire.label}"
              pointer-events="stroke"
              onmouseenter={() => handleMouseEnter(wire)}
              onmouseleave={handleMouseLeave}
              onclick={() => handleWireClick(wire)}
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleWireClick(wire);
                }
              }}
              onmousedown={(e) => e.preventDefault()}
            />

            <!-- Glowing wire shadow -->
            <path
              d={wire.pathD}
              fill="none"
              stroke={wire.color}
              stroke-width={isHovered ? 7 : 4}
              opacity={isHovered ? 0.95 : 0.65}
              filter={isHovered ? "url(#glow-cyan-svg)" : "url(#glow-wire)"}
              style="pointer-events: none;"
            />

            <!-- Core wire line -->
            <path
              d={wire.pathD}
              fill="none"
              stroke={wire.isFake ? "#52525b" : wire.color}
              stroke-width="3"
              style="pointer-events: none;"
            />

            <!-- Wire stripes/accents to indicate high voltage or decoy details -->
            {#if wire.isPenalty}
              <path
                d={wire.pathD}
                fill="none"
                stroke="#ff0000"
                stroke-width="3"
                stroke-dasharray="8 8"
                opacity="0.9"
                style="pointer-events: none;"
              />
            {/if}

            <!-- Floating wire alphanumeric label (SEC-12, etc.) -->
            {#if showLabel}
              {@const labelX = 250}
              {@const labelY = (wire.connectorLeftY + wire.connectorRightY) / 2}

              <g class="label-g" style="pointer-events: none;">
                <rect
                  x={labelX - 40}
                  y={labelY - 11}
                  width="80"
                  height="22"
                  rx="3"
                  fill="#0a0d13"
                  stroke={wire.isPenalty ? "#ff0055" : "#00f3ff"}
                  stroke-width="1"
                />
                <text
                  x={labelX}
                  y={labelY + 4}
                  class="wire-tag text-mono"
                  class:penalty={wire.isPenalty}
                  class:fake={wire.isFake}
                >
                  {wire.label}
                </text>
              </g>
            {/if}
          {:else}
            <!-- Severed Wire (split into left and right dangling halves) -->
            {@const severed = getSeveredPaths(wire)}

            <!-- Left severed half -->
            <path
              d={severed.leftD}
              fill="none"
              stroke={wire.color}
              stroke-width="4"
              opacity="0.3"
              filter="url(#glow-wire)"
            />
            <path
              d={severed.leftD}
              fill="none"
              stroke={wire.isFake ? "#3f3f46" : wire.color}
              stroke-width="2.5"
            />

            <!-- Right severed half -->
            <path
              d={severed.rightD}
              fill="none"
              stroke={wire.color}
              stroke-width="4"
              opacity="0.3"
              filter="url(#glow-wire)"
            />
            <path
              d={severed.rightD}
              fill="none"
              stroke={wire.isFake ? "#3f3f46" : wire.color}
              stroke-width="2.5"
            />

            <!-- Small copper wire tips visible on severed edges -->
            {@const startLeftX = 30}
            {@const endLeftX = 250 - 15}
            {@const leftSeveredY = Math.min(
              480,
              (wire.connectorLeftY + wire.connectorRightY) / 2 +
                50 +
                (parseInt(wire.id.split("_")[1] || "0") % 3) * 15,
            )}
            <circle cx={endLeftX} cy={leftSeveredY} r="2" fill="#c27732" />

            {@const startRightX = 250 + 15}
            {@const rightSeveredY = Math.min(
              480,
              (wire.connectorLeftY + wire.connectorRightY) / 2 +
                65 +
                (parseInt(wire.id.split("_")[1] || "0") % 2) * 20,
            )}
            <circle cx={startRightX} cy={rightSeveredY} r="2" fill="#c27732" />
          {/if}
        {/each}

        <!-- Spark particles overlay -->
        {#each sparks as spark (spark.id)}
          <circle
            cx={spark.x}
            cy={spark.y}
            r={spark.size}
            fill={spark.color}
            filter="url(#glow-wire)"
            class="spark"
          />
        {/each}
      </svg>
    </div>
  </div>
</div>

<style>
  .wire-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--panel-bg);
    border-radius: calc(8 * var(--px-to-vh));
    box-sizing: border-box;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(10 * var(--px-to-vh)) calc(16 * var(--px-to-vh));
    background: rgba(0, 0, 0, 0.2);
    border-bottom: calc(1 * var(--px-to-vh)) solid var(--border-muted);
  }

  .header-leds {
    display: flex;
    align-items: center;
    gap: calc(8 * var(--px-to-vh));
  }

  .led {
    width: calc(6 * var(--px-to-vh));
    height: calc(6 * var(--px-to-vh));
    border-radius: 50%;
    background: #27272a;
    transition: all 0.3s ease;
  }

  .led.scanning {
    background: var(--color-cyan);
    box-shadow: var(--glow-cyan);
    animation: flash 0.6s infinite alternate;
  }

  .panel-tag {
    font-size: calc(11 * var(--px-to-vh));
    font-weight: 700;
    letter-spacing: calc(1 * var(--px-to-vh));
    color: var(--color-muted);
  }

  /* SVG Arena layout */
  .svg-container {
    flex-grow: 1;
    height: 0;
    position: relative;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.15);
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  .svg-wrapper {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        rgba(255, 255, 255, 0.02) calc(1 * var(--px-to-vh)),
        transparent calc(1 * var(--px-to-vh))
      ),
      linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.02) calc(1 * var(--px-to-vh)),
        transparent calc(1 * var(--px-to-vh))
      );
    background-size: calc(20 * var(--px-to-vh)) calc(20 * var(--px-to-vh));
    pointer-events: none;
    z-index: 0;
  }

  .wire-svg {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    z-index: 1;
    display: block;
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;
    overflow: hidden;
  }

  /* SVG Typography labels */
  .connector-label {
    font-size: calc(11 * var(--px-to-vh));
    font-weight: bold;
    opacity: 0.85;
    fill: #a3b3cc !important;
  }

  .connector-label.right-align {
    text-anchor: end;
  }

  .wire-tag {
    font-size: calc(12 * var(--px-to-vh));
    font-weight: bold;
    fill: var(--color-cyan);
    text-anchor: middle;
  }

  .wire-tag.penalty {
    fill: var(--color-red);
  }

  .wire-tag.fake {
    fill: #71717a;
  }

  .wire-click-target {
    cursor: pointer;
  }

  .spark {
    animation: spark-fade 0.7s forwards;
  }

  /* Animation definitions */
  @keyframes flash {
    0% {
      opacity: 0.2;
    }
    100% {
      opacity: 1;
    }
  }
</style>
