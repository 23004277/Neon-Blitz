
// FIX: Removed self-import which was causing declaration conflicts.
// FIX: Replaced incorrect component code with all necessary type definitions for the application.
export type Screen = 'loading' | 'main-menu' | 'settings' | 'difficulty-selection' | 'game' | 'duel-selection' | 'sandbox-selection';

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export enum ControlScheme {
  WASD = 'WASD',
  Arrows = 'Arrow Keys',
}

export enum Language {
  English = 'English',
}

export type GameMode = 'campaign' | 'duel' | 'sandbox';

export interface DuelConfig {
  opponentId: string;
  opponentType: 'tank' | 'boss';
  tier?: 'basic' | 'intermediate';
  bossType?: 'goliath' | 'viper' | 'sentinel';
  opponentName: string;
}

export interface SandboxConfig {
  characterId: 'vector-01' | 'rogue-scout' | 'iron-bastion' | 'goliath-prime';
}

export interface GameConfig {
  mode: GameMode;
  duelConfig?: DuelConfig;
  sandboxConfig?: SandboxConfig;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  soundVolume: number;
  screenShake: boolean;
  difficulty: Difficulty;
  controls: ControlScheme;
  language: Language;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface Vector {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  position: Vector;
  angle: number;
  velocity: Vector; // Added explicit velocity for better physics
  createdAt: number; // Added to track lifespan
  size: { width: number; height: number };
  isBarrage?: boolean;
  isHoming?: boolean;
  targetId?: string;
  turnRate?: number;
  damage?: number;
  blastRadius?: number; // Added for AOE
  isFrozen?: boolean;
  isChronoShard?: boolean;
  isBossOrb?: boolean;
  isVampiric?: boolean; // New: Heals owner on hit
  color?: string;
}

export type PowerUpType = 'dualCannon' | 'shield' | 'regensule' | 'reflectorField' | 'lifeLeech' | 'homingMissiles';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector;
  spawnTime: number; // For floating animations
}

export interface Animation {
  id:string;
  type: 'muzzleFlash' | 'hit' | 'explosion' | 'shieldHit' | 'shieldBreak' | 'barrageImpact' | 'laneAttack' | 'mortarStrike' | 'finalBlast' | 'poisonTick' | 'homingExplosion' | 'chronoShardImpact' | 'dashTrail' | 'teleport' | 'railgunBeam' | 'shockwave' | 'mineExplosion' | 'lightning';
  createdAt: number;
  duration: number;
  position: Vector;
  angle?: number;
  color?: string;
  width?: number;
  height?: number;
  opacity?: number;
  targetPosition?: Vector; // For beams and lightning
}

export type AbilityId = 'overdrive' | 'cyberBeam' | 'missileBarrage' | 'toxicRounds' | 'teslaStorm' | 'damageConverter' | 'shockwave' | 'railgun' | 'mortarVolley' | 'laserSweep' | 'scatterMines' | 'nanoSwarm';

export interface Ability {
  id: AbilityId;
  name: string;
  keyBinding: string;
  state: 'ready' | 'charging' | 'chargingHold' | 'active' | 'cooldown';
  duration: number;
  cooldown: number;
  startTime: number;
  mastered?: boolean;
  chargeDuration?: number;
  chargeStartTime?: number;
  firedCount?: number; // Added for rapid fire tracking
}

export interface PoisonStatusEffect {
  type: 'poison';
  ownerId: string;
  stacks: number;
  lastApplied: number;
  duration: number; // Duration is refreshed on each application
  tickDamage: number;
  tickInterval: number;
  lastTickTime: number;
}

export interface StunStatusEffect {
  type: 'stun';
  ownerId: string;
  startTime: number;
  duration: number;
}

export type StatusEffect = PoisonStatusEffect | StunStatusEffect;


export interface Tank {
  id: string;
  name: string;
  type: 'player' | 'enemy';
  status: 'spawning' | 'active' | 'dying' | 'dead';
  tier?: 'basic' | 'intermediate';
  bossType?: 'goliath' | 'viper' | 'sentinel'; // Added to Tank for Sandbox mode players
  spawnTime?: number;
  position: Vector;
  velocity: Vector;
  angle: number;
  turretAngle: number;
  size: { width: number; height: number };
  health: number;
  maxHealth: number;
  color: string;
  score: number;
  kills: number;
  deaths: number;
  deathTime?: number;
  respawnTime?: number;
  activePowerUp?: PowerUpType | null;
  powerUpExpireTime?: number;
  shieldHealth?: number;
  path?: Vector[];
  patrolTarget?: Vector;
  lastHitTime?: number;
  isInvulnerable?: boolean;
  statusEffects?: StatusEffect[];
  homingMissileCount?: number;
  damageConverterCharge?: number; // Stores energy from damage taken
  
  // AI Properties
  lastFireTime?: number;
  aiMode?: 'engage' | 'strafe' | 'flank';
  aiStrafeDir?: number;
  aiStateTimer?: number;
}

export interface Telegraph {
  id: string;
  type: 'circle' | 'rect' | 'line';
  position: Vector;
  radius?: number;
  width?: number;
  height?: number;
  angle?: number;
  createdAt: number;
  duration: number;
  color?: string;
  targetPosition?: Vector; // For lines
}

export interface EffectZone {
  id: string;
  type: 'chrono' | 'poison';
  position: Vector;
  radius: number;
  createdAt: number;
  duration: number;
}

export interface Minion {
  id: string;
  position: Vector;
  angle: number; // Gun angle
  size: { width: number; height: number };
  health: number;
  maxHealth: number;
  status: 'spawning' | 'active' | 'dying' | 'dead';
  spawnTime: number;
  deathTime?: number;
  lastHitTime?: number;
  lastFireTime?: number;
  statusEffects?: StatusEffect[];
}

export interface Boss {
  id: string;
  name: string;
  bossType: 'goliath' | 'viper' | 'sentinel';
  position: Vector;
  velocity: Vector; // Added for movement physics
  angle: number; // Body angle
  patrolTarget?: Vector;
  size: { width: number; height: number };
  health: number;
  maxHealth: number;
  turretAngle: number;
  status: 'spawning' | 'active' | 'dying' | 'dead';
  spawnTime?: number;
  deathTime?: number;
  color: string;
  lastHitTime?: number;
  lastFireTime?: number;
  hasUsedLastStand?: boolean;
  statusEffects?: StatusEffect[];
  shieldSegments?: { angle: number, health: number, maxHealth: number, active: boolean }[]; // For Sentinel
  attackState: {
    currentAttack: 'none' | 'mortarVolley' | 'laserSweep' | 'scatterMines' | 'lastStand' | 'summonMinions' | 'shockwave' | 'railgun';
    phase: 'idle' | 'telegraphing' | 'attacking' | 'recovering' | 'charging';
    phaseStartTime: number;
    attackData?: {
      telegraphDuration?: number;
      attackDuration?: number;
      recoveryDuration?: number;
      targets?: Vector[];
      sweepAngleStart?: number;
      sweepAngleEnd?: number;
      attackOrigin?: Vector;
      attackAngle?: number;
      targetPosition?: Vector; // For railgun locking
      telegraphId?: string; 
      telegraphIds?: string[]; // For multiple scatter mines
    };
  };
}

export interface DamageNumber {
  id: string;
  text: string;
  position: Vector;
  createdAt: number;
  duration: number;
  color: string;
}

export interface DamageIndicator {
    id: string;
    angle: number; // angle from player to damage source
    createdAt: number;
    duration: number;
}

// Minimal state for the React Render loop (UI only)
export interface UIState {
    playerHealth: number;
    playerMaxHealth: number;
    playerShield: number;
    playerScore: number;
    playerKills: number;
    wave: number;
    enemiesRemaining: number;
    bossHealth?: number;
    bossMaxHealth?: number;
    bossName?: string;
    gameOver: boolean;
    duelWon: boolean;
    abilities: Ability[];
    damageConverterCharge: number;
}