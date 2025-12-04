import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mapping files
// Robust path resolution for Docker vs Local
const possibleMappingPaths = [
    join(process.cwd(), 'mapping'),       // Local root / Docker working dir
    join(process.cwd(), '../mapping'),    // Local dev from app/
    join(__dirname, '../../../mapping'),  // Relative from src/utils
    '/app/mapping'                        // Absolute Docker path
];

let mappingDir = '';
import { existsSync } from 'fs';

for (const p of possibleMappingPaths) {
    if (existsSync(p)) {
        mappingDir = p;
        console.log(`[Mappings] Found mapping directory at: ${mappingDir}`);
        break;
    }
}

if (!mappingDir) {
    console.warn('[Mappings] ⚠️ Mapping directory not found in standard paths. Defaulting to relative.');
    mappingDir = join(__dirname, '../../../mapping');
}

export interface NodeMapping {
  index: number;
  nodeIndex: number;
  name: string;
}

export interface LevelData {
  level: number;
  xp: number;
  xpIncrease: number;
}

export interface TraitData {
  name: string;
  type: string;
  stats: number[]; // [Power, HP, Violence, Harmony, Slot]
}

export interface TraitRegistry {
  body: Record<string, TraitData>;
  hands: Record<string, TraitData>;
  face: Record<string, TraitData>;
  background: Record<string, TraitData>;
  color: Record<string, TraitData>;
}

// Parse nodeNames.txt
// Format: [nodeIndex, 'Node Name'] on each line
export function parseNodeNames(): Map<number, NodeMapping> {
  const content = readFileSync(join(mappingDir, 'nodeNames.txt'), 'utf-8');
  const lines = content.split('\n');
  const nodeMap = new Map<number, NodeMapping>();

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Parse format: [nodeIndex, 'Node Name']
    const match = trimmed.match(/\[\s*(\d+)\s*,\s*'([^']+)'\s*\]/);
    if (match) {
      const nodeIndex = parseInt(match[1]);
      const name = match[2];
      // Map by nodeIndex (the actual index from contract)
      nodeMap.set(nodeIndex, { index: lineIndex, nodeIndex, name });
    }
  });

  return nodeMap;
}

// Parse levels.csv
export function parseLevels(): Map<number, LevelData> {
  const content = readFileSync(join(mappingDir, 'levels.csv'), 'utf-8');
  const lines = content.split('\n');
  const levelMap = new Map<number, LevelData>();

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [level, xp, xpIncrease] = line.split(',');
    const levelNum = parseInt(level);
    if (!isNaN(levelNum)) {
      levelMap.set(levelNum, {
        level: levelNum,
        xp: parseInt(xp) || 0,
        xpIncrease: parseInt(xpIncrease) || 0,
      });
    }
  }

  return levelMap;
}

// Load trait registry
export function loadTraitRegistry(): TraitRegistry {
  const content = readFileSync(join(mappingDir, 'kami_trait_registry.json'), 'utf-8');
  return JSON.parse(content) as TraitRegistry;
}

// Cache mappings
let nodeMapCache: Map<number, NodeMapping> | null = null;
let levelMapCache: Map<number, LevelData> | null = null;
let traitRegistryCache: TraitRegistry | null = null;

export function getNodeMap(): Map<number, NodeMapping> {
  if (!nodeMapCache) {
    nodeMapCache = parseNodeNames();
  }
  return nodeMapCache;
}

export function getLevelMap(): Map<number, LevelData> {
  if (!levelMapCache) {
    levelMapCache = parseLevels();
  }
  return levelMapCache;
}

export function getTraitRegistry(): TraitRegistry {
  if (!traitRegistryCache) {
    traitRegistryCache = loadTraitRegistry();
  }
  return traitRegistryCache;
}

// Get node name by nodeIndex (the actual node index from contract)
export function getNodeName(nodeIndex: number): string | null {
  const nodeMap = getNodeMap();
  const node = nodeMap.get(nodeIndex);
  return node ? node.name : null;
}

// Get node affinity type based on node name
export function getNodeAffinityType(nodeIndex: number): string {
  const nodeName = getNodeName(nodeIndex);
  if (!nodeName) return 'Normal'; // Default affinity

  const lowerCaseName = nodeName.toLowerCase();

  if (lowerCaseName.includes('scrap')) return 'Scrap';
  if (lowerCaseName.includes('insect') || lowerCaseName.includes('centipedes')) return 'Insect';
  if (lowerCaseName.includes('eerie') || lowerCaseName.includes('skeleton') || lowerCaseName.includes('graves') || lowerCaseName.includes('black pool') || lowerCaseName.includes('skull')) return 'Eerie';
  
  return 'Normal';
}

// Get level data
export function getLevelData(level: number): LevelData | null {
  const levelMap = getLevelMap();
  return levelMap.get(level) || null;
}

// Get trait data
export function getTraitData(
  category: 'body' | 'hands' | 'face' | 'background' | 'color',
  index: number
): TraitData | null {
  const registry = getTraitRegistry();
  const categoryData = registry[category];
  const trait = categoryData[index.toString()];
  return trait || null;
}

