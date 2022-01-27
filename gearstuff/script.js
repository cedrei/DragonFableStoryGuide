const csv = require("csv")
const fs = require("fs")

let itemTypes = ["Belts", "Bracers","Capes","Helms","Necklaces","Rings","Trinkets","Weapons"]
let stats = ["minDamage", "maxDamage", "str","int","dex","cha","luk","end","wis","crit","bonus","Melee","Pierce","Magic","Block","Parry","Dodge","???","Bacon",
"Darkness","Disease","Energy","Evil","Fear","Fire","Good","Ice","Light","Metal","Nature","None","Poison","Silver","Stone","Water","Wind","All","Immobility","Health"]

let statTranslateTable = {
	"Damage Low": "minDamage",
	"Damage High": "maxDamage",
	"STR": "str",
	INT: "int",
	DEX: "dex",
	CHA: "cha",
	LUK: "luk",
	END: "end",
	WIS: "wis",
	Crit: "crit",
	"Bonus": "bonus",
	"Melee Def": "Melee",
	"Pierce Def": "Pierce",
	"Magic Def": "Magic",
	"Block": "Block",
	"Parry": "Parry",
	"Dodge": "Dodge",
	"???": "???",
	"Bacon": "Bacon",
	"Darkness": "Darkness",
	Disease: "Disease",
	Energy: "Energy",
	Evil: "Evil",
	Fear: "Fear",
	Fire: "Fire",
	Good: "Good",
	Ice: "Ice",
	Light: "Light",
	Metal: "Metal",
	Nature: "Nature",
	None: "None",
	Poison: "Poison",
	Silver: "Silver",
	Stone: "Stone",
	Water: "Water",
	Wind: "Wind",
	All: "All",
	Immobility: "Immobility",
	Health: "Health"
}

let baseBuild = {
	level: 1,
	minDamage: 5,
	maxDamage: 10,
	str: 0,
	int: 0,
	dex: 0,
	cha: 0,
	luk: 0,
	end: 0,
	wis: 0,
	crit: 5,
	bonus: 0,
	Melee: 5,
	Pierce: 5,
	Magic: 5,
	Block: 0,
	Parry: 0,
	Dodge: 0,
	"???": 0,
	"Bacon": 0,
	Darkness: 5,
	Disease: 0,
	Energy: 0,
	Evil: 0,
	Fear: 0,
	"Fire": 0,
	Good: 0,
	Ice: 0,
	Light: 5,
	Metal: 0,
	Nature: 0,
	None: 0,
	Poison: 0,
	Silver: 0,
	Stone: 0,
	Water: 0,
	Wind: 0,
	All: 0,
	Immobility: 0,
	Health: 0
}

let scores = {
	strOffensive: [],
	intOffensive: [],
	dexOffensive: [],
	strOverall: [],
	intOverall: [],
	dexOverall: [],
	defensive: []
}

/* let scores = {
	strOffensive = [],
	intOffensive = [],
	dexOffensive = [],
	strOverall = [],
	intOverall = [],
	dexOverall = [],
	defensive = []
} */

let elements = {
	"???": .74,
	"Bacon": .14,
	Darkness: 21.88,
	Disease: .67,
	Energy: 1.26,
	Evil: .39,
	Fear: .63,
	"Fire": 9.09,
	Good: .3,
	Ice: 8.71,
	Light: 2.52,
	Metal: 12.27,
	Nature: 12.1,
	None: 5.79,
	Poison: 4.09,
	Silver: .17,
	Stone: 7.78,
	Water: 6.89,
	Wind: 4.68
}
let types = {
	"Melee": 94.1,
	"Pierce": .74,
	"Magic": 5.13
}
let items = {}


function parseCSV(data) {
	data = data.split("\r\n")
	let headers = data.shift().split(",")
	let result = []
	for (let i = 0; i < data.length; i++) {
		data[i] = data[i].split(",")
		if (data[i].length != headers.length) {
			throw "Problematic entry: "+data[i].join(",")
		}
	}
}

let parsed = 0

for (let i of itemTypes) {
	fs.readFile("DF Calculator - "+i+".csv", {"encoding": "utf-8"}, (err, data)=>{
		csv.parse(data, {columns: true}, (err, records) => {
			for (let j of records) {
				for (let k in statTranslateTable) {
					j[k] = +j[k]
				}
			}
			items[i] = records
			if (++parsed == itemTypes.length) {
				generateAllScores()
			}
		})
	})
}

function doIt() {
	let standardDefenseScore = getBuildDefenseScore(testBuild)
	let result = {}
	for (let i of stats) {
		let myBuild = JSON.parse(JSON.stringify(testBuild))
		myBuild[i] += 12
		result[i] = (standardDefenseScore/getBuildDefenseScore(myBuild)-1)*10000/24
	}
	let standardOffenseScore = getBuildOffenseScore(testBuild, "str")
	for (let i of stats) {
		let myBuild = JSON.parse(JSON.stringify(testBuild))
		myBuild[i] += 12
		result[i] += (getBuildOffenseScore(myBuild, "str")/standardOffenseScore-1)*10000/24
	}
	console.log(result)
}

function generateAllScores() {
	/* scores.defensive[0]=generateDefenseScores(baseBuild, 1)
	for (let i = 1; i < 90; i++) {
		let gear = getGear(scores.defensive[i-1], i)
		let statBuild = getStatsFromGear(gear, i)
		scores.defensive[i] = generateDefenseScores(statBuild, i)
	}
	console.log(getGear(scores.defensive[89],90)) */

	scores.strOffensive[0]=generateOffenseScores(baseBuild, 1, "str")
	for (let i = 1; i < 90; i++) {
		let gear = getGear(scores.strOffensive[i-1], i)
		let statBuild = getStatsFromGear(gear, i)
		scores.strOffensive[i] = generateOffenseScores(statBuild, i, "str")
	}
	return
	scores.intOffensive[0]=generateOffenseScores(baseBuild, 1, "int")
	for (let i = 1; i < 90; i++) {
		let gear = getGear(scores.intOffensive[i-1], i)
		let statBuild = getStatsFromGear(gear, i)
		scores.intOffensive[i] = generateOffenseScores(statBuild, i, "int")
	}

	scores.dexOffensive[0]=generateOffenseScores(baseBuild, 1, "dex")
	for (let i = 1; i < 90; i++) {
		let gear = getGear(scores.dexOffensive[i-1], i)
		let statBuild = getStatsFromGear(gear, i)
		scores.dexOffensive[i] = generateOffenseScores(statBuild, i, "dex")
	}
	console.log(getGear(scores.intOffensive[89],90))

	scores.strOverall[0]=generateOverallScores(baseBuild, 1, "str")
	for (let i = 1; i < 90; i++) {
		let gear = getGear(scores.strOverall[i-1], i)
		let statBuild = getStatsFromGear(gear, i)
		scores.strOverall[i] = generateOverallScores(statBuild, i, "str")
	}

	scores.intOverall[0]=generateOverallScores(baseBuild, 1, "int")
	for (let i = 1; i < 90; i++) {
		let gear = getGear(scores.intOverall[i-1], i)
		let statBuild = getStatsFromGear(gear, i)
		scores.intOverall[i] = generateOverallScores(statBuild, i, "int")
	}

	scores.dexOverall[0]=generateOverallScores(baseBuild, 1, "dex")
	for (let i = 1; i < 90; i++) {
		let gear = getGear(scores.dexOverall[i-1], i)
		let statBuild = getStatsFromGear(gear, i)
		scores.dexOverall[i] = generateOverallScores(statBuild, i, "dex")
	}
	console.log(getGear(scores.intOverall[89],90))
	fs.writeFile("scores.json",JSON.stringify(scores,null,4), (err)=>{
		if(err) console.error(err)
		else console.log("Finished")
	})
}

function getGear(scores, level) {
	let gear = {}
	for (let i of itemTypes) {
		let best = null
		let bestScore = 0
		for (let j of items[i]) {
			let score = 0
			if (j.Level > level) {
				continue
			}
			for (let k in statTranslateTable) {
				if (i != "Weapons" && ["Damage High", "Damage Low"].includes(k)) {
					continue
				}
				score += j[k]*scores[statTranslateTable[k]]
			}
			if (score > bestScore) {
				bestScore = score
				best = j
			}
		}
		gear[i] = best
	}
	return gear
}

function getStatsFromGear(gear, level) {
	/* console.log(gear)
	console.log(level) */
	let statBuild = JSON.parse(JSON.stringify(baseBuild))
	statBuild.level = level
	statBuild.minDamage = gear.Weapons["Damage Low"]
	statBuild.maxDamage = gear.Weapons["Damage High"]
	for (let i in gear) {
		for (let j in statTranslateTable) {
			if (["Damage High", "Damage Low"].includes(j)) {
				continue
			}

			statBuild[statTranslateTable[j]] += gear[i][j]
		}
	}
	return statBuild
}

function generateDefenseScores(build, level) {
	build = JSON.parse(JSON.stringify(build))
	build.str+=level
	build.int+=level
	build.dex+=level
	build.end+=level
	build.cha+=level
	build.luk+=level
	build.wis+=level

	let standardScore = getBuildDefenseScore(build)
	let result = {}
	for (let i of stats) {
		let myBuild = JSON.parse(JSON.stringify(build))
		myBuild[i] += 12
		result[i] = (standardScore/getBuildDefenseScore(myBuild)-1)*10000/12
	}
	return result
}

function generateOffenseScores(build, level, mainStat) {
	console.log("Generating for level "+level)
	build = JSON.parse(JSON.stringify(build))
	build.str+=level
	build.int+=level
	build.dex+=level
	build.end+=level
	build.cha+=level
	build.luk+=level
	build.wis+=level

	let standardScore = getBuildOffenseScore(build, mainStat)
	console.log(standardScore)
	let result = {}
	for (let i of stats) {
		let myBuild = JSON.parse(JSON.stringify(build))
		myBuild[i] += 12
		result[i] = (getBuildOffenseScore(myBuild, mainStat)/standardScore-1)*10000/12
		console.log(i+": "+result[i])
	}
	return result
}

function generateOverallScores(build, level, mainStat) {
	let defenseScore = generateDefenseScores(build, level)
	let offenseScore = generateOffenseScores(build, level, mainStat)
	for (let i in offenseScore) {
		defenseScore[i] += offenseScore[i]
	}
	return defenseScore
}

function getBuildOffenseScore(build, mainStat) {
	let baseDamage = (build.minDamage + build.maxDamage)/2
	let petDamage = (build.level + Math.floor(build.cha/10)) * (1+build.cha/400)

	let normalDamage = (baseDamage+Math.floor(build[mainStat]/10)) * (1+build.dex/4000)
	let glancingDamage = normalDamage/10
	let critDamage = (1.8+build.int / 1000)*normalDamage
	let dotDamage = baseDamage * (1+build.dex / 400)

	normalDamage *= (1+build.str/1000)

	let bonus = build.bonus + Math.floor(build.wis/10)

	let enemyMPM = build.level / 3 - bonus
	let enemyBPD = build.level / 3 - bonus

	let missRate = Math.max(Math.min(150, enemyMPM),0)/150
	let glanceRate = Math.max(Math.min(150, enemyBPD),0)/150
	let critRate = (Math.max(Math.min(100,build.crit),0) + Math.floor(build.luk/20))/200
	let glanceCritRate = glanceRate * critRate
	glanceRate -= glanceCritRate
	critRate -= glanceCritRate
	glanceRate *= (1-missRate)
	critRate *= (1-missRate)
	let normalDmgRate = (1-missRate-critRate-glanceRate)

	let directDamage = glanceRate*glancingDamage + critRate*critDamage + normalDmgRate*normalDamage

	console.log(directDamage, dotDamage, petDamage)
	return directDamage + dotDamage / 4 + petDamage / 12
}

function getBuildDefenseScore(build) {
	let maxHP = 80 + build.level*20 + build.end*5

	let enemyBonus = build.level / 3
	let enemyCrit = build.level / 3
	let enemyDamage = build.level * 6 + 18
	let heal = build.level/2 + maxHP / 72

	let mpm = (types.Melee*build.Melee+types.Pierce*build.Pierce+types.Magic*build.Magic)/100
	let bpd = (types.Melee*build.Block+types.Pierce*build.Parry+types.Magic*build.Dodge)/100
	let res = 0
	for (let i in elements) {
		res += Math.min(80,elements[i])*build[i]
	}
	res /= 100
	res += build.All
	res /= 100

	let missRate = Math.max(Math.min(150, mpm - enemyBonus), 0)/150
	let glanceRate = Math.max(Math.min(150, bpd - enemyBonus), 0)/150
	let critRate = enemyCrit/200
	let glancingCritRate = glanceRate*critRate
	glanceRate -= glancingCritRate
	critRate -= glancingCritRate
	glanceRate *= (1-missRate)
	critRate *= (1-missRate)
	let standardRate = 1-missRate-glanceRate-critRate
	let totalDamage = (standardRate+glanceRate/10+critRate*1.75)*enemyDamage
	let immobilityDamage = totalDamage * (100-build.Immobility-build.All)/100
	totalDamage *= 1-res
	heal *= (100-build.Health-build.All+Math.floor(build.wis/20))/100

	//console.log(totalDamage, immobilityDamage, heal, maxHP)

	return (totalDamage+immobilityDamage/48-heal)/maxHP
}