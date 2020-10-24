'use strict';

const assert = require('assert').strict;
const TeamValidator = require('../../build/sim/team-validator').TeamValidator;

describe('Team Validator', function () {
	it('should have valid formats to work with', function () {
		Dex.includeFormats();
		for (const format in Dex.formatsCache) {
			try {
				Dex.getRuleTable(Dex.getFormat(format));
			} catch (e) {
				e.message = `${format}: ${e.message}`;
				throw e;
			}
		}
	});
	it('should reject non-existent Pokemon', function () {
		const team = [
			{species: 'nonexistentPokemon', moves: ['thunderbolt'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7customgame').validateTeam(team);
		assert(illegal);
	});

	it('should reject non-existent items', function () {
		const team = [
			{species: 'pikachu', moves: ['thunderbolt'], ability: 'static', item: 'nonexistentItem', evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7customgame').validateTeam(team);
		assert(illegal);
	});

	it('should reject non-existent abilities', function () {
		const team = [
			{species: 'pikachu', moves: ['thunderbolt'], ability: 'nonexistentAbility', evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7customgame').validateTeam(team);
		assert(illegal);
	});

	it('should reject non-existent moves', function () {
		const team = [
			{species: 'pikachu', ability: 'static', moves: ['nonexistentMove'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7customgame').validateTeam(team);
		assert(illegal);
	});

	it('should validate Gen 2 IVs', function () {
		let team = Dex.fastUnpackTeam('|raikou|||hiddenpowerwater||||14,28,26,,,|||');
		let illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert.equal(illegal, null);

		team = Dex.fastUnpackTeam('|raikou|||hiddenpowerfire||||14,28,26,,,|||');
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert(illegal);

		team = Dex.fastUnpackTeam('|raikou|||hiddenpowerwater||||16,28,26,,,|||');
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert(illegal);

		team = Dex.fastUnpackTeam('|raikou|||thunderbolt||||,,,28,30,|||');
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert(illegal);
	});

	it('should validate Gen 2 EVs', function () {
		let team = Dex.fastUnpackTeam('|gengar|||thunderbolt||,,,200,200,|||||');
		let illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert.equal(illegal, null);

		team = Dex.fastUnpackTeam('|gengar|||thunderbolt||,,,248,252,|||||');
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert(illegal);
	});

	it('should validate Gen 7 IVs', function () {
		let team = [
			{species: 'yveltal', ability: 'darkaura', moves: ['hiddenpowerfighting'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7ubers').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'latiasmega', ability: 'levitate', item: 'latiasite', moves: ['hiddenpowerfighting'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ubers').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should reject non-existent natures', function () {
		const team = [
			{species: 'pikachu', ability: 'static', moves: ['thunderbolt'], nature: 'nonexistentNature', evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7customgame').validateTeam(team);
		assert(illegal);
	});

	it('should reject invalid happiness values', function () {
		const team = [
			{species: 'pikachu', ability: 'static', moves: ['thunderbolt'], happiness: 'invalidHappinessValue', evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7customgame').validateTeam(team);
		assert(illegal);
	});

	it('should accept legal movesets', function () {
		let team = [
			{species: 'pikachu', ability: 'static', moves: ['agility', 'protect', 'thunder', 'thunderbolt'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'meowstic', ability: 'prankster', moves: ['trick', 'magiccoat'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should reject illegal movesets', function () {
		const team = [
			{species: 'pikachu', ability: 'static', moves: ['blastburn', 'frenzyplant', 'hydrocannon', 'dragonascent'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it('should reject banned Pokemon', function () {
		let team = [
			{species: 'arceus', ability: 'multitype', item: 'dragoniumz', moves: ['judgment'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen71v1').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'rayquazamega', ability: 'deltastream', moves: ['dragonascent'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ou').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'mimikyutotem', ability: 'disguise', moves: ['shadowsneak'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ou@@@-mimikyu').validateTeam(team);
		assert(illegal);

		// bans should override past unbans
		team = [
			{species: 'torkoal', ability: 'drought', moves: ['bodyslam'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ou@@@-drought,+drought').validateTeam(team);
		assert.equal(illegal, null);
		illegal = TeamValidator.get('gen7ou@@@-drought,+drought,-drought').validateTeam(team);
		assert(illegal);
	});

	it('should handle weird things', function () {
		// Necrozma-DW should use Necrozma's events, plus Moongeist Beam
		let team = [
			{species: 'necrozmadawnwings', ability: 'prismarmor', shiny: true, moves: ['moongeistbeam', 'metalclaw'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);

		// Shedinja should be able to take one level-up move from ninjask in gen 3-4

		team = [
			{species: 'shedinja', ability: 'wonderguard', moves: ['silverwind', 'swordsdance'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen4ou').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'shedinja', ability: 'wonderguard', moves: ['silverwind', 'batonpass'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen3ou').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'shedinja', ability: 'wonderguard', moves: ['silverwind', 'swordsdance', 'batonpass'], evs: {hp: 1}},
			{species: 'charmander', ability: 'blaze', moves: ['flareblitz', 'dragondance'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen4ou').validateTeam(team);
		assert(illegal);

		// Chansey can't have Chansey-only egg moves as well as Happiny-only level-up moves

		team = [
			{species: 'blissey', ability: 'naturalcure', moves: ['charm', 'seismictoss'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ou').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'marill', ability: 'hugepower', moves: ['splash', 'aquajet'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ou').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'mamoswine', ability: 'oblivious', moves: ['tackle', 'iceshard', 'amnesia', 'furyattack'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert(illegal);
		illegal = TeamValidator.get('gen7ou').validateTeam(team);
		assert.equal(illegal, null);

		// Slam comes from Azurill, Future Sight comes from a variety of Marill-only egg moves

		team = [
			{species: 'azumarill', ability: 'thickfat', moves: ['futuresight', 'slam'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ou').validateTeam(team);
		assert(illegal);

		// male-only hidden abilities are incompatible with egg moves in Gen 5

		team = [
			{species: 'combusken', ability: 'speedboost', moves: ['batonpass'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert(illegal);

		// move not breedable
		team = [
			{species: 'kubfu', ability: 'innerfocus', moves: ['aerialace'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen8lc').validateTeam(team);
		assert(illegal);
	});

	it('should reject illegal egg move combinations', function () {
		let team = [
			{species: 'azumarill', ability: 'hugepower', moves: ['bellydrum', 'aquajet'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'cloyster', moves: ['rapidspin', 'explosion']},
		];
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'weezing', ability: 'levitate', moves: ['painsplit', 'willowisp'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen3ou').validateTeam(team);
		assert.equal(illegal, null);

		// chainbreed smeargle to snubbull to chansey
		team = [
			{species: 'blissey', moves: ['present', 'healbell']},
		];
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert.equal(illegal, null);

		// the weirdest chainbreed I've ever seen:
		// breed male Curse Snorlax in Gen 3, transfer to XD, teach Self-destruct
		// by tutor, breed with female Gluttony Snorlax
		team = [
			{species: 'snorlax', ability: 'gluttony', moves: ['curse', 'selfdestruct'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert.equal(illegal, null);

		// tradeback: egg moves Swords Dance, Rock Slide; trade back to gen 1, and learn Body Slam
		team = [
			{species: 'marowak', moves: ['swordsdance', 'rockslide', 'bodyslam']},
		];
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert.equal(illegal, null);
		illegal = TeamValidator.get('gen1outradeback').validateTeam(team);
		assert.equal(illegal, null);
		illegal = TeamValidator.get('gen1ou').validateTeam(team);
		assert(illegal);

		// tradeback: don't crash if source is gen 2 event
		team = [
			{species: 'charizard', moves: ['crunch']},
		];
		illegal = TeamValidator.get('gen1outradeback').validateTeam(team);
		assert(illegal);

		// tradeback: gen 2 event move from prevo with gen 1 tutor or TM moves
		team = [
			{species: 'pikachu', moves: ['sing', 'surf']},
			{species: 'clefairy', moves: ['dizzypunch', 'bodyslam']},
		];
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert.equal(illegal, null);

		// can't tradeback: gen 2 egg move
		team = [
			{species: 'marowak', moves: ['swordsdance', 'ancientpower', 'bodyslam']},
		];
		illegal = TeamValidator.get('gen2ou').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'skarmory', ability: 'keeneye', moves: ['curse', 'drillpeck'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen3ou').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'skarmory', ability: 'keeneye', moves: ['whirlwind', 'drillpeck'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen3ou').validateTeam(team);
		assert(illegal);

		// Pupitar can evolve into HA Tyranitar despite having no hidden ability
		team = [
			{species: 'tyranitar', ability: 'unnerve', moves: ['dragondance'], evs: {hp: 1}},
			{species: 'staraptor', ability: 'reckless', moves: ['pursuit'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert.equal(illegal, null);

		// Nidoqueen can't breed but can still get egg moves from prevos
		team = [
			{species: 'nidoqueen', ability: 'poisonpoint', moves: ['charm'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen6ou').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'armaldo', ability: 'battlearmor', moves: ['knockoff', 'rapidspin'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen3ou').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'hitmontop', ability: 'intimidate', moves: ["highjumpkick", 'machpunch'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen3ou').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'snorlax', ability: 'immunity', moves: ['curse', 'pursuit'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen4ou').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'charizard', ability: 'blaze', moves: ['dragondance'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen4ou').validateTeam(team);
		assert.equal(illegal, null);
		illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'dragonite', ability: 'multiscale', moves: ['extremespeed'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'dragonite', ability: 'multiscale', moves: ['extremespeed', 'aquajet'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert(illegal);
	});

	it('should require Hidden Ability status to match event moves', function () {
		const team = [
			{species: 'raichu', ability: 'lightningrod', moves: ['extremespeed'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it('should accept VC moves only with Hidden ability and correct IVs', function () {
		let team = [
			{species: 'machamp', ability: 'steadfast', moves: ['fissure'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);
		team = [
			{species: 'tauros', ability: 'sheerforce', moves: ['bodyslam'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);
		team = [
			{species: 'tauros', ability: 'intimidate', ivs: {hp: 31, atk: 31, def: 30, spa: 30, spd: 30, spe: 30}, moves: ['bodyslam'], evs: {hp: 1}},
			{species: 'suicune', ability: 'innerfocus', moves: ['scald'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'machamp', ability: 'noguard', moves: ['fissure'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
		team = [
			{species: 'tauros', ability: 'sheerforce', ivs: {hp: 31, atk: 31, def: 30, spa: 30, spd: 30, spe: 30}, moves: ['bodyslam'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it('should correctly validate USUM Rockruff', function () {
		let team = [
			{species: 'rockruff', ability: 'owntempo', moves: ['happyhour'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);
		team = [
			{species: 'rockruff', level: 9, ability: 'owntempo', moves: ['happyhour'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
		team = [
			{species: 'rockruff', level: 9, ability: 'owntempo', moves: ['tackle'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);
		team = [
			{species: 'rockruff', level: 9, ability: 'steadfast', moves: ['happyhour'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'lycanrocdusk', ability: 'toughclaws', moves: ['happyhour'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);
		team = [
			{species: 'lycanroc', ability: 'steadfast', moves: ['happyhour'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it('should accept both ability types for Mega Evolutions', function () {
		// base forme ability
		let team = [
			{species: 'gyaradosmega', item: 'gyaradosite', ability: 'intimidate', moves: ['dragondance', 'crunch', 'waterfall', 'icefang'], evs: {hp: 1}},
			{species: 'kyogreprimal', item: 'blueorb', ability: 'drizzle', moves: ['originpulse'], evs: {hp: 1}},
			{species: 'rayquazamega', item: 'leftovers', ability: 'airlock', moves: ['dragonascent'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);

		// mega forme ability
		team = [
			{species: 'gyaradosmega', item: 'gyaradosite', ability: 'moldbreaker', moves: ['dragondance', 'crunch', 'waterfall', 'icefang'], evs: {hp: 1}},
			{species: 'kyogreprimal', item: 'blueorb', ability: 'primordialsea', moves: ['originpulse'], evs: {hp: 1}},
			{species: 'rayquazamega', item: 'leftovers', ability: 'deltastream', moves: ['dragonascent'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should reject Ultra Necrozma where ambiguous', function () {
		const team = [
			{species: 'necrozmaultra', ability: 'neuroforce', moves: ['confusion'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7ubers').validateTeam(team);
		assert(illegal);
	});

	it('should handle Dream World moves', function () {
		const team = [
			{species: 'garchomp', ability: 'roughskin', moves: ['endure'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen5ou').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should reject newer Pokemon in older gens', function () {
		const team = [
			{species: 'pichu', ability: 'static', moves: ['thunderbolt']},
		];
		const illegal = TeamValidator.get('gen1ou').validateTeam(team);
		assert(illegal);
	});

	it('should reject exclusive G-Max moves added directly to a Pokemon\'s moveset', function () {
		const team = [
			{species: 'charizard', ability: 'blaze', moves: ['gmaxwildfire'], evs: {hp: 1}, gigantamax: true},
		];
		let illegal = TeamValidator.get('gen8anythinggoes').validateTeam(team);
		assert(illegal);
		illegal = TeamValidator.get('gen8customgame@@@-nonexistent').validateTeam(team);
		assert(illegal);
	});

	it('should reject Gmax Pokemon from formats with Dynamax Clause', function () {
		const team = [
			{species: 'gengar-gmax', ability: 'cursedbody', moves: ['shadowball'], evs: {hp: 1}},
			{species: 'gengar', ability: 'cursedbody', moves: ['shadowball'], evs: {hp: 1}, gigantamax: true},
		];
		const illegal = TeamValidator.get('gen8customgame@@@dynamaxclause').validateTeam(team);
		assert(illegal);
	});

	it('should reject Pokemon that cannot obtain moves in a particular forme', function () {
		let team = [
			{species: 'toxicrity', ability: 'punkrock', moves: ['venomdrench, magneticflux'], evs: {hp: 1}},
			{species: 'toxicrity-low-key', ability: 'punkrock', moves: ['venoshock, shiftgear'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen8anythinggoes').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'rotom-wash', ability: 'levitate', moves: ['overheat'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen8anythinggoes').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'kyurem-black', ability: 'teravolt', moves: ['glaciate'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen8anythinggoes').validateTeam(team);
		assert(illegal);

		// Scary Face is a TM in Gen 8, so use Gen 7 to test
		team = [
			{species: 'kyurem-white', ability: 'turboblaze', moves: ['scaryface'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it('should properly validate Greninja-Ash', function () {
		let team = [
			{species: 'greninja-ash', ability: 'battlebond', moves: ['happyhour'], shiny: true, evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'greninja-ash', ability: 'battlebond', moves: ['protect'], shiny: true, evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'greninja-ash', ability: 'battlebond', moves: ['protect'], ivs: {atk: 0}, evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'greninja-ash', ability: 'battlebond', moves: ['hiddenpowergrass'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it.skip('should not allow evolutions of Shiny-locked events to be Shiny', function () {
		const team = [
			{species: 'urshifu', ability: 'unseenfist', shiny: true, moves: ['snore'], evs: {hp: 1}},
			{species: 'cosmoem', ability: 'sturdy', shiny: true, moves: ['teleport'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen8anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it('should not allow unreleased Gmax formes', function () {
		const team = [
			{species: 'melmetal-gmax', ability: 'ironfist', moves: ['doubleironbash'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen8anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it.skip('should not allow events to use moves only obtainable in a previous generation', function () {
		const team = [
			{species: 'zeraora', ability: 'voltabsorb', shiny: true, moves: ['knockoff'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen8anythinggoes').validateTeam(team);
		assert(illegal);
	});

	it('should allow use of a Hidden Ability if the format has the item Ability Patch', function () {
		let team = [
			{species: 'heatran', ability: 'flamebody', moves: ['sleeptalk'], evs: {hp: 1}},
			{species: 'entei', ability: 'innerfocus', moves: ['sleeptalk'], evs: {hp: 1}},
			{species: 'dracovish', ability: 'sandrush', moves: ['sleeptalk'], evs: {hp: 1}},
			{species: 'zapdos', ability: 'static', moves: ['sleeptalk'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen8vgc2021').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'heatran', ability: 'flamebody', moves: ['sleeptalk'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
	});


	/*********************************************************
 	* Custom rules
 	*********************************************************/
	it('should support legality tags', function () {
		let team = [
			{species: 'kitsunoh', ability: 'frisk', moves: ['shadowstrike'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
		illegal = TeamValidator.get('gen7anythinggoes@@@+cap').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'pikachu', ability: 'airlock', moves: ['thunderbolt'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes').validateTeam(team);
		assert(illegal);
		illegal = TeamValidator.get('gen7ou@@@!obtainableabilities').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'pikachu', ability: 'airlock', moves: ['dragondance'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ou@@@!obtainableabilities').validateTeam(team);
		assert(illegal);
	});

	it('should allow Pokemon to be banned', function () {
		let team = [
			{species: 'pikachu', ability: 'static', moves: ['agility', 'protect', 'thunder', 'thunderbolt'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes@@@-Pikachu').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'greninja', ability: 'battlebond', moves: ['surf'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes@@@-Greninja-Ash').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'greninja', ability: 'battlebond', moves: ['surf'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7anythinggoes@@@!Obtainable Formes,-Greninja-Ash').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should allow Pokemon to be unbanned', function () {
		const team = [
			{species: 'blaziken', ability: 'blaze', moves: ['skyuppercut'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7ou@@@+Blaziken').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should allow Pokemon to be whitelisted', function () {
		let team = [
			{species: 'giratina', ability: 'pressure', moves: ['protect'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7ubers@@@-allpokemon,+giratinaaltered').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'giratinaorigin', ability: 'levitate', moves: ['protect'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7ubers@@@-allpokemon,+giratinaaltered').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'tyrantrum', ability: 'strongjaw', moves: ['protect'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen8nationaldex@@@-allpokemon').validateTeam(team);
		assert(illegal);
	});

	it('should allow moves to be banned', function () {
		const team = [
			{species: 'pikachu', ability: 'static', moves: ['agility', 'protect', 'thunder', 'thunderbolt'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7anythinggoes@@@-Agility').validateTeam(team);
		assert(illegal);
	});

	it('should allow moves to be unbanned', function () {
		const team = [
			{species: 'absol', ability: 'pressure', moves: ['batonpass'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7ou@@@+Baton Pass').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should allow items to be banned', function () {
		const team = [
			{species: 'pikachu', ability: 'static', moves: ['agility', 'protect', 'thunder', 'thunderbolt'], item: 'lightball', evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7anythinggoes@@@-Light Ball').validateTeam(team);
		assert(illegal);
	});

	it('should allow items to be unbanned', function () {
		const team = [
			{species: 'eevee', ability: 'runaway', moves: ['tackle'], item: 'eeviumz', evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7lc@@@+Eevium Z').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should allow abilities to be banned', function () {
		const team = [
			{species: 'pikachu', ability: 'static', moves: ['agility', 'protect', 'thunder', 'thunderbolt'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7anythinggoes@@@-Static').validateTeam(team);
		assert(illegal);
	});

	it('should allow abilities to be unbanned', function () {
		const team = [
			{species: 'wobbuffet', ability: 'shadowtag', moves: ['counter'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7ou@@@+Shadow Tag').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should allow complex bans to be added', function () {
		let team = [
			{species: 'pikachu', ability: 'static', moves: ['agility', 'protect', 'thunder', 'thunderbolt'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7anythinggoes@@@-Pikachu + Agility').validateTeam(team);
		assert(illegal);

		team = [
			{species: 'smeargle', ability: 'owntempo', moves: ['gravity'], evs: {hp: 1}},
			{species: 'pikachu', ability: 'static', moves: ['thunderbolt'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7doublesou@@@-Gravity ++ Thunderbolt').validateTeam(team);
		assert(illegal);
	});

	it('should allow complex bans to be altered', function () {
		let team = [
			{species: 'smeargle', ability: 'owntempo', moves: ['gravity'], evs: {hp: 1}},
			{species: 'abomasnow', ability: 'snowwarning', moves: ['grasswhistle'], evs: {hp: 1}},
		];
		let illegal = TeamValidator.get('gen7doublesou@@@-Gravity ++ Grass Whistle > 2').validateTeam(team);
		assert.equal(illegal, null);

		team = [
			{species: 'smeargle', ability: 'owntempo', moves: ['gravity'], evs: {hp: 1}},
			{species: 'abomasnow', ability: 'snowwarning', moves: ['grasswhistle'], evs: {hp: 1}},
			{species: 'cacturne', ability: 'sandveil', moves: ['grasswhistle'], evs: {hp: 1}},
		];
		illegal = TeamValidator.get('gen7doublesou@@@-Gravity ++ Grass Whistle > 2').validateTeam(team);
		assert(illegal);
	});

	it('should allow complex bans to be removed', function () {
		const team = [
			{species: 'smeargle', ability: 'owntempo', moves: ['gravity'], evs: {hp: 1}},
			{species: 'abomasnow', ability: 'snowwarning', moves: ['grasswhistle'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7doublesou@@@+Gravity ++ Grass Whistle').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should allow rule bundles to be removed', function () {
		const team = [
			{species: 'azumarill', ability: 'hugepower', moves: ['waterfall'], evs: {hp: 1}},
			{species: 'azumarill', ability: 'hugepower', moves: ['waterfall'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7ou@@@!Standard').validateTeam(team);
		assert.equal(illegal, null);
	});

	it('should allow rule bundles to be overridden', function () {
		const team = [
			{species: 'charizard-mega-y', ability: 'drought', item: 'charizarditey', moves: ['wingattack'], evs: {hp: 1}},
		];
		const illegal = TeamValidator.get('gen7customgame@@@Standard').validateTeam(team);
		assert.equal(illegal, null);
	});
});
