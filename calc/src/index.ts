import {ID, GenerationNum, TypeName} from '@pkmn/types';
import * as I from '@smogon/calc/data/interface';
import * as D from './dex';

export function toID(s: string) {
  return ('' + s).toLowerCase().replace(/[^a-z0-9]+/g, '') as I.ID;
}

const GENERATIONS = Object.create(null) as {[num: number]: Generation};

export class Generations implements I.Generations {
  private readonly dex: D.Dex;

  constructor(dex: D.Dex) {
    this.dex = dex;
  }

  get(gen: I.GenerationNum) {
    if (GENERATIONS[gen]) return GENERATIONS[gen];
    return (GENERATIONS[gen] = new Generation(this.dex.forGen(gen)));
  };
}

class Generation implements I.Generation {
  dex: D.Dex;

  abilities: Abilities;
  items: Items;
  moves: Moves;
  species: Species;
  types: Types;
  natures: Natures;

  constructor(dex: D.Dex) {
    this.dex = dex;

    this.abilities = new Abilities(dex);
    this.items = new Items(dex);
    this.moves = new Moves(dex);
    this.species = new Species(dex);
    this.types = new Types(dex);
    this.natures = new Natures(dex);
  }

  get num() {
    return this.dex.gen as I.GenerationNum;
  }
}

class Abilities implements I.Abilities {
  private readonly dex: D.Dex;

  constructor(dex: D.Dex) {
    this.dex = dex;
  }

  get(name: string) {
    const ability = this.dex.getAbility(name);
    if (ability.isNonstandard === 'CAP' && this.dex.gen < 4) return undefined;
    return exists(ability, this.dex.gen) ? new Ability(ability) : undefined;
  }

  *[Symbol.iterator]() {
    for (const id in this.dex.data.Abilities) {
      const a = this.get(id);
      if (a) yield a;
    }
  }
}

class Ability implements I.Ability {
  readonly kind: 'Ability';
  readonly id: I.ID;
  readonly name: I.AbilityName;

  constructor(ability: D.Ability) {
    this.kind = 'Ability';
    this.id = ability.id as I.ID;
    this.name = ability.name as I.AbilityName;
  }
}

class Items implements I.Items {
  private readonly dex: D.Dex;

  constructor(dex: D.Dex) {
    this.dex = dex;
  }

  get(name: string) {
    if (this.dex.gen < 2) return undefined;
    let item = this.dex.getItem(name);
    // Enigma Berry is Unobtainable in Gen 3, but the damage calc supports Unobtainable data and
    // needs the naturalGift data which is only defined in Gen 4.
    if (this.dex.gen === 3 && item.id === 'enigmaberry') {
      item = this.dex.forGen(4).getItem('enigmaberry');
    }
    return exists(item, this.dex.gen) ? new Item(item, this.dex.gen) : undefined;
  }

  *[Symbol.iterator]() {
    for (const id in this.dex.data.Items) {
      const i = this.get(id);
      if (i) yield i;
    }
  }
}

class Item implements I.Item {
  readonly kind: 'Item';
  readonly id: I.ID;
  readonly name: I.ItemName;
  readonly megaEvolves?: I.SpeciesName;
  readonly isBerry?: boolean;
  readonly naturalGift?: Readonly<{basePower: number; type: I.TypeName}>;

  constructor(item: D.Item, gen: I.GenerationNum) {
    this.kind = 'Item';
    this.id = item.id as I.ID;
    this.name = item.name as I.ItemName;
    this.megaEvolves = item.megaEvolves as I.SpeciesName;
    this.isBerry = item.isBerry;
    this.naturalGift = item.naturalGift && {
      basePower: item.naturalGift.basePower - (gen === 2 ? 20 : 0),
      type: item.naturalGift.type as I.TypeName
    };
  }
}

class Moves implements I.Moves {
  private readonly dex: D.Dex;

  constructor(dex: D.Dex) {
    this.dex = dex;
  }

  get(name: string) {
    const move = this.dex.getMove(name);
    return exists(move, this.dex.gen) ? new Move(move, this.dex) : undefined;
  }

  *[Symbol.iterator]() {
    yield NoMove(this.dex);
    for (const id in this.dex.data.Moves) {
      const m = this.get(id);
      if (m) yield m;
    }
  }
}

class Move implements I.Move {
  readonly kind: 'Move';
  readonly id: I.ID;
  readonly name: I.MoveName;
  readonly bp: number;
  readonly type: I.TypeName;
  readonly category?: I.MoveCategory;
  readonly flags: I.MoveFlags;
  readonly secondaries?: any;
  readonly target?: I.MoveTarget;
  readonly recoil?: [number, number];
  readonly hasCrashDamage?: boolean;
  readonly mindBlownRecoil?: boolean;
  readonly struggleRecoil?: boolean;
  readonly willCrit?: boolean;
  readonly drain?: [number, number];
  readonly priority?: number;
  readonly self?: I.SelfOrSecondaryEffect | null;
  readonly ignoreDefensive?: boolean;
  readonly defensiveCategory?: I.MoveCategory;
  readonly breaksProtect?: boolean;
  readonly isZ?: boolean;
  readonly isMax?: boolean;
  readonly zp?: number;
  readonly maxPower?: number;
  readonly multihit?: number | number[];

  constructor(move: D.Move, dex: D.Dex) {
    this.kind = 'Move';
    this.id = move.id === 'hiddenpower' ? toID(move.name) : move.id as I.ID;
    this.name = move.name as I.MoveName;
    this.bp = move.basePower;
    this.type = move.type;

    if (move.category === 'Status' || dex.gen >= 4) {
      this.category = move.category;
    }

    if (move.recoil) this.recoil = move.recoil;
    if (move.hasCrashDamage) this.hasCrashDamage = move.hasCrashDamage;
    if (move.mindBlownRecoil) this.mindBlownRecoil = move.mindBlownRecoil;
    if (move.struggleRecoil) this.struggleRecoil = move.struggleRecoil;

    const stat = move.category === 'Special' ? 'spa' : 'atk';
    if (move.self?.boosts && move.self.boosts[stat] && move.self.boosts[stat]! < 0) {
      this.self = move.self;
    }

    if (move.multihit) this.multihit = move.multihit;
    if (move.drain) this.drain = move.drain;
    if (move.willCrit) this.willCrit = move.willCrit;
    if (move.priority > 0) this.priority = move.priority;

    this.flags = {};
    if (dex.gen >= 2) {
      if (move.breaksProtect) this.breaksProtect = move.breaksProtect;
    }
    if (dex.gen >= 3) {
      if (move.flags.contact) this.flags.contact = move.flags.contact;
      if (move.flags.sound) this.flags.sound = move.flags.sound;

      if (['allAdjacent', 'allAdjacentFoes', 'adjacentFoe'].includes(move.target)) {
        this.target = move.target;
      }
    }
    if (dex.gen >= 4) {
      if (move.flags.punch) this.flags.punch = move.flags.punch;
      if (move.flags.bite) this.flags.bite = move.flags.bite;
    }
    if (dex.gen >= 5) {
      if (move.ignoreDefensive) this.ignoreDefensive = move.ignoreDefensive;
      if (move.defensiveCategory && move.defensiveCategory !== move.category) {
        this.defensiveCategory = move.defensiveCategory;
      }

      if ('secondaries' in move && move.secondaries?.length) {
        this.secondaries = true;
      }
    }
    if (dex.gen >= 6) {
      if (move.flags.bullet) this.flags.bullet = move.flags.bullet;
      if (move.flags.pulse) this.flags.pulse = move.flags.pulse;
    }
    if (dex.gen >= 7) {
      if (move.isZ) this.isZ = true;
      if (move.zMove) this.zp = move.zMove.basePower; // TODO
    }
    if (dex.gen >= 8) {
      if (move.isMax) this.isMax = true
      if (move.maxMove) this.maxPower = move.maxMove.basePower; // TODO
    }
  }
}

class Species implements I.Species {
  private readonly dex: D.Dex;

  constructor(dex: D.Dex) {
    this.dex = dex;
  }

  get(name: string) {
    const species = this.dex.getSpecies(name);
    if (this.dex.gen >= 6 && species.id === 'aegislashboth') return AegislashBoth(this.dex);
    return exists(species, this.dex.gen) ? new Specie(species, this.dex) : undefined;
  }

  *[Symbol.iterator]() {
    for (const id in this.dex.data.Species) {
      const s = this.get(id);
      if (s) {
        if (id ==='aegislash') yield AegislashBoth(this.dex);
        yield s;
      }
    }
  }
}

// Custom Move placeholder
function NoMove(dex: D.Dex) {
  return new Move({
    id: 'nomove' as ID,
    name: '(No Move)',
    basePower: 0,
    type: 'Normal',
    category: 'Status',
    target: 'any',
    flags: {},
    gen: 1,
    priority: 0,
  }, dex);
}

class Specie implements I.Specie {
  readonly kind: 'Species';
  readonly id: I.ID;
  readonly name: I.SpeciesName;

  readonly types: [I.TypeName] | [I.TypeName, I.TypeName];
  readonly baseStats: Readonly<I.StatsTable>;
  readonly weightkg: number;
  readonly nfe?: boolean;
  readonly gender?: I.GenderName;
  readonly otherFormes?: I.SpeciesName[];
  readonly baseSpecies?: I.SpeciesName;
  readonly abilities?: {0: I.AbilityName};

  constructor(species: D.Species, dex: D.Dex) {
    this.kind = 'Species';
    this.id = (species.id === 'aegislash' ? 'aegislashshield' : species.id) as I.ID;
    this.name = (species.name === 'Aegislash' ? 'Aegislash-Shield' : species.name) as I.SpeciesName;
    this.types = species.types as [I.TypeName] | [I.TypeName, I.TypeName];
    this.baseStats = species.baseStats;
    this.weightkg = species.weightkg;

    const nfe = !!species.evos?.some(s => exists(dex.getSpecies(s), dex.gen));
    if (nfe) this.nfe = nfe;
    if (species.gender === 'N' && dex.gen > 1) this.gender = species.gender;

    const formes = species.otherFormes?.filter(s => exists(dex.getSpecies(s), dex.gen));
    if (species.id.startsWith('aegislash')) {
      if (species.id === 'aegislashblade') {
        this.otherFormes = ['Aegislash-Shield', 'Aegislash-Both'] as I.SpeciesName[];
      } else {
        this.baseSpecies = 'Aegislash-Blade' as I.SpeciesName;
      }
    } else if (species.id === 'toxtricity') {
      this.otherFormes = ['Toxtricity-Gmax', 'Toxtricity-Low-Key', 'Toxtricity-Low-Key-Gmax'
      ] as I.SpeciesName[];
    } else if (species.id === 'toxtricitylowkey') {
      this.baseSpecies = 'Toxtricity' as I.SpeciesName;
    } else if (species.id === 'eternatus') {
      this.otherFormes = ['Eternatus-Eternamax'] as I.SpeciesName[];
    } else if (formes && formes.length) {
      this.otherFormes = [...formes].sort() as I.SpeciesName[];
    } else if (species.baseSpecies !== this.name) {
      this.baseSpecies = species.baseSpecies as I.SpeciesName;
    }

    if (dex.gen > 2) this.abilities = {0: species.abilities[0] as I.AbilityName};
  }
}

// Custom Aegislash forme
function AegislashBoth(dex: D.Dex) {
  const shield = dex.getSpecies('aegislash')!;
  const blade = dex.getSpecies('aegislashblade')!;
  const baseStats = {
    hp: shield.baseStats.hp,
    atk: blade.baseStats.atk,
    def: shield.baseStats.def,
    spa: blade.baseStats.spa,
    spd: shield.baseStats.spd,
    spe: shield.baseStats.spe,
  };
  return new Specie({
    ...shield,
    baseStats,
    id: 'aegislashboth' as I.ID,
    name: 'Aegislash-Both',
  }, dex);
}

const DAMAGE_TAKEN = [1, 2, 0.5, 0] as I.TypeEffectiveness[];

export class Types implements I.Types {
  private readonly dex: D.Dex
  private readonly byID: {[id: string]: I.Type}

  constructor(dex: D.Dex) {
    this.dex = dex;

    const unknown = {
      kind: 'Type',
      id: '' as ID,
      name: '???',
      effectiveness: {},
    } as I.Type;

    this.byID = {};
    for (const t1 in this.dex.data.Types) {
      const id = toID(t1) as I.ID;
      const name = t1 as Exclude<TypeName, '???'>;

      const effectiveness = {'???': 1} as {[type in I.TypeName]: I.TypeEffectiveness};
      for (const t2 in this.dex.data.Types) {
        const t = t2 as Exclude<TypeName, '???'>;
        effectiveness[t] = DAMAGE_TAKEN[this.dex.data.Types[t].damageTaken[name]!];
      }
      (unknown.effectiveness as any)[name] = 1;

      this.byID[id] = {kind: 'Type', id, name, effectiveness};
    }
    this.byID[unknown.id] = unknown;
  }

  get(name: string) {
    // toID('???') => '', as do many other things, but returning the '???' type seems appropriate :)
    return this.byID[toID(name)];
  }

  *[Symbol.iterator]() {
    for (const id in this.byID) {
      yield this.byID[id];
    }
  }
}

export class Natures implements I.Natures {
  private readonly dex: D.Dex;

  constructor(dex: D.Dex) {
    this.dex = dex;
  }

  get(name: string) {
    const nature = this.dex.getNature(name)
    return exists(nature, this.dex.gen) ? new Nature(nature) : undefined;
  }

  *[Symbol.iterator]() {
    for (const id in this.dex.data.Natures) {
      const n = this.get(id);
      if (n) yield n;
    }
  }
}

class Nature implements I.Nature {
  readonly kind: 'Nature';
  readonly id: I.ID;
  readonly name: I.NatureName;
  readonly plus: I.StatName;
  readonly minus: I.StatName;

  constructor(nature: D.Nature) {
    this.kind = 'Nature';
    this.id = nature.id as I.ID;
    this.name = nature.name as I.NatureName;

    switch (nature.id) {
      case 'hardy':
        this.plus = 'atk';
        this.minus = 'atk';
        break;
      case 'docile':
        this.plus = 'def';
        this.minus = 'def';
        break;
      case 'bashful':
        this.plus = 'spa';
        this.minus = 'spa';
        break;
      case 'quirky':
        this.plus = 'spd';
        this.minus = 'spd';
        break;
      case 'serious':
        this.plus = 'spe';
        this.minus = 'spe';
        break;
      default:
        this.plus = nature.plus!;
        this.minus = nature.minus!;
    }
  }
}

const NATDEX_BANNED = [
  'Pikachu-Cosplay',
  'Pikachu-Rock-Star',
  'Pikachu-Belle',
  'Pikachu-Pop-Star',
  'Pikachu-PhD',
  'Pikachu-Libre',
  'Pichu-Spiky-eared',
  'Floette-Eternal',
  'Magearna-Original',
];

function exists(val: D.Ability| D.Item | D.Move | D.Species | D.Nature, gen: GenerationNum) {
  if (!val.exists || val.id === 'noability') return false;
  if (gen === 7 && val.isNonstandard === 'LGPE') return true;
  if (gen === 8 && val.isNonstandard === 'Past' && !NATDEX_BANNED.includes(val.name)) return true;
  if (gen === 8 && ['eternatuseternamax', 'slowpoke'].includes(val.id)) return true; // sigh
  if (val.isNonstandard && !['CAP', 'Unobtainable'].includes(val.isNonstandard!)) return false;
  return !('tier' in val && ['Illegal', 'Unreleased'].includes(val.tier!));
}
