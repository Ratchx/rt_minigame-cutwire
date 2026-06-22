export interface Wire {
  id: string;
  color: string;
  colorName: string;
  label: string;
  isCut: boolean;
  isDecoy: boolean;
  isFake: boolean;
  isPenalty: boolean;
  cutSequenceIndex: number; // -1 if not in sequence, or 0, 1, 2... for correct cutting sequence order
  pathD: string;
  connectorLeftY: number;
  connectorRightY: number;
  connectorLeftLabel: string;
  connectorRightLabel: string;
}
