import { LoreCategory } from '../types/project';

export interface CodexFieldDefinition {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  section: string;
  helpText?: string;
}

export interface CodexCategoryConfig {
  id: LoreCategory;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  color: string;
  bgLight: string;
  borderLight: string;
  fields: CodexFieldDefinition[];
  defaultTemplate: (name: string) => string;
  relationshipPresets: string[];
}

export const CODEX_CATEGORIES: Record<LoreCategory, CodexCategoryConfig> = {
  character: {
    id: 'character',
    name: 'Character',
    shortName: 'Characters',
    tagline: 'Only character details',
    description: 'Detailed individual persona: psychology, traits, goals, physical markers, and personal history.',
    color: '#eb5e28',
    bgLight: 'rgba(235, 94, 40, 0.12)',
    borderLight: 'rgba(235, 94, 40, 0.35)',
    relationshipPresets: [
      'Ally of',
      'Rival to',
      'Mentor to',
      'Student of',
      'Member of',
      'Leader of',
      'Wields',
      'Native of',
      'Ruler of',
      'Exiled from',
      'Sworn Enemy of',
      'Sibling of',
      'Protector of',
    ],
    fields: [
      {
        key: 'archetype',
        label: 'Role / Archetype',
        placeholder: 'Protagonist, Antagonist, Mentor, Supporting...',
        type: 'select',
        options: ['Protagonist', 'Antagonist', 'Deuteragonist', 'Mentor', 'Supporting Cast', 'Foil', 'Historical Figure', 'Creature / Familiar'],
        section: 'Identity & Status',
      },
      {
        key: 'vitalStatus',
        label: 'Vital Status',
        placeholder: 'Alive, Deceased, Missing...',
        type: 'select',
        options: ['Alive', 'Deceased', 'Missing / MIA', 'Transformed / Ascended', 'Reborn / Undead', 'Unknown'],
        section: 'Identity & Status',
      },
      {
        key: 'speciesAndAge',
        label: 'Species / Age / Heritage',
        placeholder: 'e.g. 28 years • Half-Elven • Valyrian nobility',
        type: 'text',
        section: 'Identity & Status',
      },
      {
        key: 'occupation',
        label: 'Occupation / Social Title',
        placeholder: 'e.g. Master Alchemist, Crown Prince, Mercenary Captain',
        type: 'text',
        section: 'Identity & Status',
      },
      {
        key: 'primeMotivation',
        label: 'Core Desire / Prime Motivation',
        placeholder: 'What do they want more than anything in this world?',
        type: 'text',
        section: 'Psychology & Motivation',
        helpText: 'The primary engine driving every scene this character initiates.',
      },
      {
        key: 'internalConflict',
        label: 'Fatal Flaw / Emotional Wound',
        placeholder: 'What internal fear, trauma, or belief holds them back?',
        type: 'text',
        section: 'Psychology & Motivation',
      },
      {
        key: 'appearance',
        label: 'Physical Appearance & Signature Features',
        placeholder: 'Height, silhouette, gaze, distinguishing scars, attire, iconic talisman...',
        type: 'textarea',
        section: 'Visual & Sensory Traits',
      },
      {
        key: 'mannerismsAndVoice',
        label: 'Mannerisms, Voice & Speech Cadence',
        placeholder: 'Tone of voice, catchphrases, fidgets, posture under pressure...',
        type: 'textarea',
        section: 'Visual & Sensory Traits',
      },
    ],
    defaultTemplate: (name: string) => `### Overview
A brief summary of who **${name}** is and their purpose in the narrative.

### Background & Formative History
Where they were raised, the pivotal moment that forged their trajectory, and how they reached where they are today.

### Key Turning Points
- **First Impression:** How others perceive them when entering a room.
- **Under Duress:** How their behavior shifts when cornered or betrayed.
- **Ultimate Stakes:** What happens if they fail to achieve their goal.
`,
  },

  location: {
    id: 'location',
    name: 'Location',
    shortName: 'Locations',
    tagline: 'Only location details',
    description: 'Detailed world geography: terrain, climate, landmarks, inhabitants, culture, and sovereign rule.',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    borderLight: 'rgba(16, 185, 129, 0.35)',
    relationshipPresets: [
      'Capital of',
      'Occupied by',
      'Birthplace of',
      'Headquarters of',
      'Burial Site of',
      'Sanctuary for',
      'Borders on',
      'Trade Route to',
      'Enshrines Relic',
      'Ruled by',
    ],
    fields: [
      {
        key: 'locationType',
        label: 'Location Classification',
        placeholder: 'Metropolitan City, Ancient Ruin, Sovereign Realm...',
        type: 'select',
        options: ['Sovereign Realm / Kingdom', 'Metropolitan City / Port', 'Ancient Ruin / Dungeon', 'Fortress / Citadel', 'Wilderness / Geographical Region', 'Mystical Realm / Otherworld', 'Sanctuary / Temple'],
        section: 'Geographic Context',
      },
      {
        key: 'controllingFaction',
        label: 'Controlling Authority / Sovereign Power',
        placeholder: 'e.g. Ironclad Hegemony, The Northern Tribes, Disputed Free Territory',
        type: 'text',
        section: 'Geographic Context',
      },
      {
        key: 'climateAndAtmosphere',
        label: 'Climate, Weather & Atmosphere',
        placeholder: 'Perpetual freezing mist, subterranean volcanic heat, arid scrubland...',
        type: 'text',
        section: 'Environment & Senses',
      },
      {
        key: 'sensoryImpressions',
        label: 'Signature Sights, Scents & Ambient Sounds',
        placeholder: 'Smell of ozone and brine; creaking iron gallows; bell tolls echoing at dusk...',
        type: 'textarea',
        section: 'Environment & Senses',
      },
      {
        key: 'demographics',
        label: 'Inhabitants & Cultural Demographics',
        placeholder: 'Population size, native peoples, prevailing languages, social hierarchy...',
        type: 'text',
        section: 'Culture & Inhabitants',
      },
      {
        key: 'customsAndLaws',
        label: 'Customs, Taboo Laws & Local Governance',
        placeholder: 'Curfew rules, sacred traditions, forbidden sorcery, punishment for theft...',
        type: 'textarea',
        section: 'Culture & Inhabitants',
      },
      {
        key: 'keyLandmarks',
        label: 'Key Landmarks & Architectural Wonders',
        placeholder: 'The Obsidian Spire, The Lower Catacombs, The Drowned Bridge...',
        type: 'textarea',
        section: 'Landmarks & Hazards',
      },
      {
        key: 'environmentalHazards',
        label: 'Environmental Hazards & Magic Anomalies',
        placeholder: 'Toxic fog tides, dimensional tears, patrolling leviathans...',
        type: 'text',
        section: 'Landmarks & Hazards',
      },
    ],
    defaultTemplate: (name: string) => `### Overview
Atmospheric landscape of **${name}** and why scenes take place here.

### Geography & Key Districts
- **District / Area 1:** Notable layout and activity.
- **District / Area 2:** Hidden corners, dangerous alleys, or sacred groves.

### Strategic & Narrative Significance
Why control of this location matters to the central plot conflict and what secrets remain buried beneath it.
`,
  },

  lore: {
    id: 'lore',
    name: 'Lore & Worldbuilding',
    shortName: 'Lore & World',
    tagline: 'Lore and world explanation',
    description: 'The laws and myths of the universe: magic systems, cosmology, religions, natural laws, and ancient treaties.',
    color: '#eab308',
    bgLight: 'rgba(234, 179, 8, 0.12)',
    borderLight: 'rgba(234, 179, 8, 0.35)',
    relationshipPresets: [
      'Governs',
      'Practiced by',
      'Counters / Negates',
      'Derived from',
      'Forbidden by',
      'Worshipped by',
      'Manifests at',
      'Powers Artifact',
      'Origin of Event',
    ],
    fields: [
      {
        key: 'loreDomain',
        label: 'Lore Domain & Classification',
        placeholder: 'Magic System, Religion, Ancient History, Cosmic Law...',
        type: 'select',
        options: ['Magic System & Arcane Axioms', 'Cosmology & Deities', 'Historical Era / Great War', 'Cosmic / Natural Law', 'Religion, Faith & Prophecy', 'Mythology & Folk Legend', 'Language & Ancient Glyphs'],
        section: 'World System Classification',
      },
      {
        key: 'timelineOrigin',
        label: 'Historical Origin & Era of Genesis',
        placeholder: 'e.g. Pre-Calamity Era, Third Sun Dynasty, Forgotten Millennium',
        type: 'text',
        section: 'World System Classification',
      },
      {
        key: 'governingRules',
        label: 'Governing Rules & Absolute Principles',
        placeholder: 'How does it fundamentally work? What are the unbroken rules?',
        type: 'textarea',
        section: 'Axioms & Limitations',
        helpText: 'Hard limits that prevent plot holes and maintain consistent stakes.',
      },
      {
        key: 'costsAndDangers',
        label: 'Costs, Limitations, Taboos & Lethal Dangers',
        placeholder: 'What price is extracted? Mental exhaustion, soul corruption, physical aging...',
        type: 'textarea',
        section: 'Axioms & Limitations',
      },
      {
        key: 'practitionersAndKeepers',
        label: 'Known Practitioners & Scholarly Keepers',
        placeholder: 'Who holds the authority, rituals, or secrets to channel this lore?',
        type: 'text',
        section: 'Societal Manifestation',
      },
      {
        key: 'societalImpact',
        label: 'Narrative & Worldbuilding Impact',
        placeholder: 'How this lore dictates everyday culture, warfare, trade, and morals in the story...',
        type: 'textarea',
        section: 'Societal Manifestation',
      },
    ],
    defaultTemplate: (name: string) => `### Overview
Foundational concept and principles governing **${name}**.

### Fundamental Axioms
1. **First Rule:** The baseline mechanism of how it operates.
2. **Second Rule:** The boundaries and requirements for invocation.
3. **The Absolute Limitation:** What can NEVER be achieved or done.

### Historical Revelation & Modern Perception
How mortals first discovered this lore, the legends surrounding it, and why it is revered or feared today.
`,
  },

  item: {
    id: 'item',
    name: 'Item & Artifact',
    shortName: 'Items & Artifacts',
    tagline: 'Items and artifact which exist in the world',
    description: 'Concrete physical objects: magical relics, weapons, armor, enchanted tomes, technologies, and curios.',
    color: '#06b6d4',
    bgLight: 'rgba(6, 182, 212, 0.12)',
    borderLight: 'rgba(6, 182, 212, 0.35)',
    relationshipPresets: [
      'Wielded by',
      'Forged by',
      'Guarded by',
      'Hidden at',
      'Sought by',
      'Powered by Lore',
      'Counterpart to',
      'Destroyed at',
      'Symbol of Order',
    ],
    fields: [
      {
        key: 'itemClassification',
        label: 'Item Classification',
        placeholder: 'Relic, Weapon, Talisman, Ancient Tome...',
        type: 'select',
        options: ['Divine / Ancient Relic', 'Weapon / Armament', 'Armor / Warding Attire', 'Talisman / Amulet', 'Arcane Tome / Grimoire', 'Technological Mechanism', 'Alchemical Elixir / Consumable', 'Key / Portal Device'],
        section: 'Item Archetype',
      },
      {
        key: 'rarityAndPower',
        label: 'Rarity / Power Tier',
        placeholder: 'Common, Rare, Legendary, Mythic, Unique...',
        type: 'select',
        options: ['Common Utility', 'Rare Craftsmanship', 'Legendary Wonder', 'Mythic Cataclysm', 'Singular / Unique'],
        section: 'Item Archetype',
      },
      {
        key: 'currentBearerOrLocation',
        label: 'Current Bearer / Stored Location',
        placeholder: 'Who currently holds it, or which vault / ruin conceals it?',
        type: 'text',
        section: 'Custody & Provenance',
      },
      {
        key: 'creatorAndForging',
        label: 'Creator, Origin & Forging Material',
        placeholder: 'Forged from celestial star-metal by the First Smith in Year 104...',
        type: 'text',
        section: 'Custody & Provenance',
      },
      {
        key: 'abilitiesAndEnchantments',
        label: 'Powers, Enchantments & Active Capabilities',
        placeholder: 'What does this item do when drawn, worn, or activated?',
        type: 'textarea',
        section: 'Powers & Penalties',
      },
      {
        key: 'requirementsAndCurse',
        label: 'Requirements, Cost, Limitations or Curse',
        placeholder: 'Must be bathed in moonlight; drains the wielder’s stamina; whispers maddening secrets...',
        type: 'textarea',
        section: 'Powers & Penalties',
      },
    ],
    defaultTemplate: (name: string) => `### Overview
Physical appearance, weight, and initial impression of **${name}**.

### Craftsmanship & Form
- **Materials:** What it was forged, carved, or woven from.
- **Sensory Presence:** Glow, hum, temperature, scent, or aura.

### Active Capabilities & Narrative Role
How it functions when drawn into combat or ritual, and how it alters the fate of the characters who touch it.
`,
  },

  faction: {
    id: 'faction',
    name: 'Faction & Order',
    shortName: 'Factions & Orders',
    tagline: 'Faction and order setup of the world',
    description: 'Organized groups shaping the world: empires, knightly orders, arcane guilds, rebellions, and secret syndicates.',
    color: '#a855f7',
    bgLight: 'rgba(168, 85, 247, 0.12)',
    borderLight: 'rgba(168, 85, 247, 0.35)',
    relationshipPresets: [
      'Headquartered at',
      'Allied with',
      'Sworn Enemy of',
      'Led by',
      'Commands Army',
      'Vassal to',
      'Custodians of Relic',
      'Adheres to Lore',
      'Controls Territory',
    ],
    fields: [
      {
        key: 'factionType',
        label: 'Organization Classification',
        placeholder: 'Noble Dynasty, Holy Order, Rebel Vanguard, Guild...',
        type: 'select',
        options: ['Sovereign Empire / Noble Dynasty', 'Knightly / Martial Order', 'Arcane Academy / Sorcery Guild', 'Religious Sect / Church', 'Rebel Vanguard / Insurgency', 'Secret Society / Syndicate', 'Merchant Coalition'],
        section: 'Structure & Ideology',
      },
      {
        key: 'creedAndMotto',
        label: 'Core Creed, Motto & Oath',
        placeholder: 'e.g. "From Ash, Vigilance." Their non-negotiable mission.',
        type: 'text',
        section: 'Structure & Ideology',
      },
      {
        key: 'leadershipAndRanks',
        label: 'Leadership, Hierarchy & Chain of Command',
        placeholder: 'High Archon, Council of Elders, Knights-Captain, Initiates...',
        type: 'textarea',
        section: 'Structure & Ideology',
      },
      {
        key: 'headquarters',
        label: 'Headquarters / Seat of Power',
        placeholder: 'e.g. The Spire of Vigilance, Imperial Citadel, Floating Isle of Valen',
        type: 'text',
        section: 'Territory & Symbols',
      },
      {
        key: 'sigilAndColors',
        label: 'Sigil, Banner Colors & Regalia',
        placeholder: 'Embroidered twin wolves on crimson silk; obsidian ring insignia...',
        type: 'text',
        section: 'Territory & Symbols',
      },
      {
        key: 'influenceAndPower',
        label: 'Military Might, Wealth & Reach',
        placeholder: 'Fleet of 50 ironclads, network of palace spies, treasury monopoly...',
        type: 'textarea',
        section: 'Alliances & Conflict',
      },
      {
        key: 'alliesAndRivals',
        label: 'Allies, Vassals & Sworn Adversaries',
        placeholder: 'Treaty with House Varos; active war against the Sun Guild...',
        type: 'textarea',
        section: 'Alliances & Conflict',
      },
    ],
    defaultTemplate: (name: string) => `### Overview
The public charter, standing, and founding purpose of **${name}**.

### Inner Circle & Discipline
How initiates are recruited, the sworn oaths they take, and how disobedience is handled within the ranks.

### Major Goals & Antagonisms
What the order seeks to conquer, defend, or preserve, and the primary obstacles standing in their path.
`,
  },
};
