import { playHoverSound, playCutSound, playErrorSound, playSuccessSound, playExplosionSound } from '../lib/sound';
import { uiStore } from './ui.svelte';
import type { Wire } from '../types/wire';
import type { LogEntry, GameStatus, Difficulty, GameConfig } from '../types/game';

const NEON_COLORS = [
  { hex: '#39ff14', name: 'Volt Lime' },
  { hex: '#00f3ff', name: 'Neon Cyan' },
  { hex: '#ff007f', name: 'Plasma Pink' },
  { hex: '#bc00dd', name: 'Proton Purple' },
  { hex: '#ff8800', name: 'Cyber Orange' },
  { hex: '#0055ff', name: 'Cobalt Blue' },
  { hex: '#ccff00', name: 'Volt Yellow' },
  { hex: '#ff003c', name: 'Crimson Red' },
  { hex: '#ffffff', name: 'Core White' },
  { hex: '#e5a90a', name: 'Heavy Amber' },
  // Similar colors to increase difficulty
  { hex: '#00aaff', name: 'Cyan-Blue' },
  { hex: '#ff4444', name: 'Coral Red' },
  { hex: '#ff5500', name: 'Orange-Red' },
  { hex: '#a3ff12', name: 'Green-Lime' },
];

const WIRE_PREFIXES = ['SEC', 'PWR', 'GND', 'MOD', 'DAT', 'SYS', 'AUX', 'LNK'];

export interface DifficultyPreset {
  wireCount: number;
  sequenceLength: number;
  fakeCount: number;
  penaltyCount: number;
}

export let DIFFICULTY_PRESETS: Record<Exclude<Difficulty, 'CUSTOM'>, DifficultyPreset> = {
  EASY: { wireCount: 12, sequenceLength: 3, fakeCount: 1, penaltyCount: 1 },
  MEDIUM: { wireCount: 14, sequenceLength: 4, fakeCount: 2, penaltyCount: 2 },
  HARD: { wireCount: 16, sequenceLength: 5, fakeCount: 3, penaltyCount: 3 },
  EXPERT: { wireCount: 20, sequenceLength: 6, fakeCount: 3, penaltyCount: 3 },
};

export class GameStore {
  // State runes
  status = $state<GameStatus>('IDLE');
  timer = $state<number>(60);
  wires = $state<Wire[]>([]);
  mistakes = $state<number>(0);
  maxMistakes = $state<number>(3);
  instability = $state<number>(0);
  logs = $state<LogEntry[]>([]);
  currentSequenceIndex = $state<number>(0);
  difficulty = $state<Difficulty>('EASY');

  private lastInitParams: {
    wireCountOrDifficulty: number | Difficulty;
    sequenceLengthParam?: number;
    customDuration?: number;
    difficultyParam?: Difficulty;
    fakeCountParam?: number;
    penaltyCountParam?: number;
  } | null = null;

  // Derived runes
  isLowTime = $derived(this.timer <= 10);
  isCriticalInstability = $derived(this.instability >= 70);

  // Get the wires that belong to the sequence, sorted by their correct cutting sequence index
  sequenceWires = $derived(
    this.wires.filter(w => w.cutSequenceIndex !== -1).sort((a, b) => a.cutSequenceIndex - b.cutSequenceIndex)
  );

  // Remaining cuts needed in sequence
  remainingSequenceCount = $derived(
    this.sequenceWires.filter(w => !w.isCut).length
  );

  // Current objective wire
  currentObjectiveWire = $derived(
    this.sequenceWires.find(w => w.cutSequenceIndex === this.currentSequenceIndex)
  );

  private timerInterval: any = null;

  cleanup() {
    this.resetTimer();
    this.status = 'IDLE';
    this.wires = [];
    this.mistakes = 0;
    this.instability = 0;
    this.currentSequenceIndex = 0;
    this.logs = [];
    this.timer = 60;
  }

  addLog(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const time = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

    this.logs = [
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp,
        message,
        type,
      },
      ...this.logs,
    ].slice(0, 40);
  }

  handlerMessage = (event: MessageEvent) => {
    const item = event.data;
    if (!item) return;

    if (item.action === 'show') {
      uiStore.show();
      if (item.securityLevel) {
        uiStore.setSecurityLevel(item.securityLevel);
      }
    } else if (item.action === 'hide') {
      uiStore.hide();
    } else if (item.action === 'start') {
      if (item.securityLevel) {
        uiStore.setSecurityLevel(item.securityLevel);
      }
      if (item.wireCount !== undefined || item.sequenceLength !== undefined) {
        this.initGame(
          item.wireCount,
          item.sequenceLength,
          item.duration,
          item.difficulty || 'CUSTOM',
          item.fakeCount,
          item.penaltyCount
        );
      } else {
        const diff = item.difficulty || 'HARD';
        const duration = item.duration || 30;
        this.initGame(diff, duration);
      }
    } else if (item.action === 'stop') {
      uiStore.hide();
    }
  };

  private shuffle(array: any[]) {
    let m = array.length, t, i;
    while (m) {
      i = Math.floor(Math.random() * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }

  initGame(
    wireCountOrDifficulty: number | Difficulty = 14,
    sequenceLengthParam?: number,
    customDuration?: number,
    difficultyParam?: Difficulty,
    fakeCountParam?: number,
    penaltyCountParam?: number
  ): void {
    // If called with CUSTOM/no-arguments/restart and we have last init params, reuse them
    if (wireCountOrDifficulty === 'CUSTOM' && this.lastInitParams) {
      return this.initGame(
        this.lastInitParams.wireCountOrDifficulty,
        this.lastInitParams.sequenceLengthParam,
        this.lastInitParams.customDuration,
        this.lastInitParams.difficultyParam,
        this.lastInitParams.fakeCountParam,
        this.lastInitParams.penaltyCountParam
      );
    }

    // Save current parameters for potential restart
    this.lastInitParams = {
      wireCountOrDifficulty,
      sequenceLengthParam,
      customDuration,
      difficultyParam,
      fakeCountParam,
      penaltyCountParam,
    };

    this.resetTimer();
    this.status = 'PLAYING';
    this.mistakes = 0;
    this.instability = 0;
    this.currentSequenceIndex = 0;
    this.logs = [];

    // Make uiStore.visible work immediately when starting the game
    uiStore.show();

    let wireCount = 14;
    let sequenceLength = 4;
    let duration = customDuration ?? 60;
    let difficulty: Difficulty = 'CUSTOM';

    if (typeof wireCountOrDifficulty === 'string') {
      difficulty = wireCountOrDifficulty;
      const preset = difficulty !== 'CUSTOM' ? DIFFICULTY_PRESETS[difficulty] : null;
      if (preset) {
        wireCount = preset.wireCount;
        sequenceLength = preset.sequenceLength;
      }
    } else {
      wireCount = wireCountOrDifficulty;
      sequenceLength = sequenceLengthParam ?? Math.min(4, wireCount);
      difficulty = difficultyParam ?? 'CUSTOM';
    }

    this.difficulty = difficulty;
    this.timer = duration;

    this.addLog('SYSTEM: Initializing Bomb Disarm Sequence...', 'info');
    this.addLog(`SECURITY: Auth Level [${difficulty}] established.`, 'info');
    this.addLog('VOLTAGE: 240V active across primary circuit rail.', 'warning');

    const height = 500;
    const leftPositions = Array.from({ length: wireCount }, (_, i) => 30 + i * (height - 60) / (wireCount - 1));
    const rightPositions = [...leftPositions];

    this.shuffle(rightPositions);

    const generatedWires: Wire[] = [];

    const labelSet = new Set<string>();
    const generateUniqueLabel = () => {
      let label = '';
      do {
        const prefix = WIRE_PREFIXES[Math.floor(Math.random() * WIRE_PREFIXES.length)];
        const num = Math.floor(Math.random() * 90) + 10; // 10-99
        label = `${prefix}-${num}`;
      } while (labelSet.has(label));
      labelSet.add(label);
      return label;
    };

    const colors: typeof NEON_COLORS = [];
    for (let i = 0; i < wireCount; i++) {
      colors.push(NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]);
    }

    for (let i = 0; i < wireCount; i++) {
      const colorObj = colors[i];
      const wireId = `wire_${i}_${Math.random().toString(36).substr(2, 5)}`;
      const label = generateUniqueLabel();

      const startX = 30;
      const endX = 470;
      const yLeft = leftPositions[i];
      const yRight = rightPositions[i];

      const cp1x = startX + 100 + Math.random() * 50;
      const cp1y = yLeft;
      const cp2x = endX - 100 - Math.random() * 50;
      const cp2y = yRight;

      const pathD = `M ${startX} ${yLeft} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${yRight}`;

      generatedWires.push({
        id: wireId,
        color: colorObj.hex,
        colorName: colorObj.name,
        label,
        isCut: false,
        isDecoy: false,
        isFake: false,
        isPenalty: false,
        cutSequenceIndex: -1,
        pathD,
        connectorLeftY: yLeft,
        connectorRightY: yRight,
        connectorLeftLabel: `L-${(i + 1).toString().padStart(2, '0')}`,
        connectorRightLabel: `R-${(rightPositions.indexOf(yRight) + 1).toString().padStart(2, '0')}`,
      });
    }

    const wireIndices = Array.from({ length: wireCount }, (_, i) => i);
    this.shuffle(wireIndices);

    for (let s = 0; s < sequenceLength; s++) {
      const idx = wireIndices[s];
      generatedWires[idx].cutSequenceIndex = s;
    }

    const preset = difficulty !== 'CUSTOM' ? DIFFICULTY_PRESETS[difficulty] : null;
    let fakeCount = fakeCountParam ?? (preset ? preset.fakeCount : 3);
    let penaltyCount = penaltyCountParam ?? (preset ? preset.penaltyCount : 3);

    // Safeguard to prevent out of bounds when custom wireCount/sequenceLength are passed
    const remainingWires = wireCount - sequenceLength;
    if (fakeCount + penaltyCount > remainingWires) {
      fakeCount = Math.max(0, Math.floor(remainingWires / 2));
      penaltyCount = Math.max(0, remainingWires - fakeCount);
    }

    for (let f = 0; f < fakeCount; f++) {
      const idx = wireIndices[sequenceLength + f];
      if (idx !== undefined) {
        generatedWires[idx].isFake = true;
        generatedWires[idx].label = `FLT-${Math.floor(Math.random() * 90) + 10}`;
      }
    }

    for (let p = 0; p < penaltyCount; p++) {
      const idx = wireIndices[sequenceLength + fakeCount + p];
      if (idx !== undefined) {
        generatedWires[idx].isPenalty = true;
        generatedWires[idx].label = `WRG-${Math.floor(Math.random() * 90) + 10}`;
      }
    }

    for (let d = sequenceLength + fakeCount + penaltyCount; d < wireCount; d++) {
      const idx = wireIndices[d];
      if (idx !== undefined) {
        generatedWires[idx].isDecoy = true;
      }
    }

    this.wires = generatedWires.sort((a, b) => a.connectorLeftY - b.connectorLeftY);

    this.addLog(`OBJECTIVE: Cut ${sequenceLength} bypass wires in correct sequential sequence.`, 'info');
    this.addLog(`NEXT TARGET: Locate and sever wire [${this.sequenceWires[0].label}]`, 'info');

    this.startTimer();
  }

  cutWire(wireId: string) {
    if (this.status !== 'PLAYING') return;

    const wire = this.wires.find(w => w.id === wireId);
    if (!wire || wire.isCut) return;

    playCutSound();

    wire.isCut = true;

    if (wire.isPenalty) {
      playErrorSound();
      this.mistakes += 1;
      this.instability = Math.min(100, this.instability + 30);
      const timePen = 6;
      this.timer = Math.max(0, this.timer - timePen);
      this.addLog(`SURGE: Wire ${wire.label} severed. Time penalty -${timePen}s. Instability increased.`, 'error');

      this.checkDefuseState();
      return;
    }

    if (wire.isFake) {
      playErrorSound();
      this.mistakes += 1;
      this.instability = Math.min(100, this.instability + 25);
      this.addLog(`FAULT: Dead circuit ${wire.label} severed. Instability increased.`, 'error');

      this.checkDefuseState();
      return;
    }

    if (wire.cutSequenceIndex === this.currentSequenceIndex) {
      this.currentSequenceIndex += 1;
      this.instability = Math.max(0, this.instability - 5); // Severing cleans the feedback loops

      this.addLog(`BYPASS: Circuit ${wire.label} correctly bypassed.`, 'success');

      const nextObjective = this.currentObjectiveWire;
      if (nextObjective) {
        this.addLog(`NEXT TARGET: Sever wire [${nextObjective.label}]`, 'info');
      }

      this.checkDefuseState();
    } else {
      playErrorSound();
      this.mistakes += 1;
      this.instability = Math.min(100, this.instability + 20);

      if (wire.isDecoy) {
        this.addLog(`FAIL: Decoy wire ${wire.label} severed. Circuit unstable.`, 'warning');
      } else {
        this.addLog(`SEQUENCE BREAK: Wire ${wire.label} severed out of order!`, 'error');
      }

      this.checkDefuseState();
    }
  }

  private checkDefuseState() {
    if (this.instability >= 100) {
      this.failGame('SURGE_OVERLOAD');
      return;
    }

    if (this.mistakes >= this.maxMistakes) {
      this.failGame('MAX_CRITICAL_ERRORS');
      return;
    }

    if (this.remainingSequenceCount === 0) {
      this.successGame();
    }
  }

  private failGame(reason: string) {
    this.status = 'FAILED';
    this.resetTimer();
    playExplosionSound();

    if (reason === 'TIMER_EXPIRED') {
      this.addLog('CRITICAL: Detonation timer expired. Detonation imminent.', 'error');
    } else if (reason === 'SURGE_OVERLOAD') {
      this.addLog('CRITICAL: Volatile surge overload. Containment failure.', 'error');
    } else if (reason === 'MAX_CRITICAL_ERRORS') {
      this.addLog('CRITICAL: Defusal hardware damaged. Auto-detonation triggered.', 'error');
    }

    this.addLog('DISARM SEQUENCE FAILED. BOMB DETONATED.', 'error');

    uiStore.sendNUICallback('defuseResult', {
      success: false,
      reason: reason,
      difficulty: this.difficulty,
    });

    setTimeout(() => {
      uiStore.hide();
      this.cleanup();
    }, 3000);
  }

  private successGame() {
    this.status = 'SUCCESS';
    this.resetTimer();
    playSuccessSound();

    this.addLog('BYPASS COMPLETE: Magnetic lock disengaged.', 'success');
    this.addLog('CORE SHUTDOWN: Detonator unit successfully defused.', 'success');

    uiStore.sendNUICallback('defuseResult', {
      success: true,
      difficulty: this.difficulty,
      remainingTime: this.timer,
    });

    setTimeout(() => {
      uiStore.hide();
      this.cleanup();
    }, 3000);
  }

  private startTimer() {
    this.resetTimer();
    this.timerInterval = setInterval(() => {
      if (this.status === 'PLAYING') {
        this.timer -= 1;
        if (this.timer <= 0) {
          this.timer = 0;
          this.failGame('TIMER_EXPIRED');
        }
      }
    }, 1000);
  }

  private resetTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

export const gameStore = new GameStore();
