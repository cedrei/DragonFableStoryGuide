/*
    Licenced under  GPL-3.0-or-later
*/

"use strict";

var bisData = {
	Belts: {},
	Bracers: {},
	Capes: {},
	Helms: {},
	Necklaces: {},
	Rings: {},
	Trinkets: {},
	Weapons: {}
};

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

// Called from main.js when the rest of the page is loaded
function setupBiS() {
	setUpGetJSON(); // Set up the JSON loading
	getData(); // Load the data from the server
}

/*
*   If you run getJSON() locally, it will fail because the MIME type won't be set
*   Since I test locally this is really bad, but this function solves that
*/
function setUpGetJSON() {
	$.ajaxSetup({beforeSend: function(xhr){
	  	if (xhr.overrideMimeType) {
	    	xhr.overrideMimeType("application/json");
	  	}
	}});
}

/*
*	Simple function that fills the bisData object with the JSON files in ./BiSData/,
*	and then it loads the default items
*/
function getData() {
	$.each(Object.keys(bisData), function(index, itemType) {
		$.ajax({
			type: "GET",
			url: "gearstuff/DF Calculator - "+itemType+".csv",
			dataType: "text",
			success: (data) => {
				bisData[itemType] = $.csv.toObjects(data)
				updateBiSValues()
			}
		})
	});
}

function updateBiSValues() {
	$.each(Object.keys(bisData), function(index, itemType) {
		showItem(findBestItem(itemType));
	});
}

/*
*	This function finds what item to show, and then displays that item
*/
function findBestItem(itemType) {
	let profileData = profiles[profilesKey][profiles.current];
	let bestItem = {name: "N/A", score: 0, link: "", type: itemType};
	try {
		$.each(bisData[itemType], function(itemID, data) {
			let score = getScore(data, profileData)
			if (score > bestItem.score && checkFilters(data, profileData.hidden_values)) {
				bestItem.name = data.Name;
				bestItem.score = score;
				bestItem.link = data.Link;
			}
		});
	} catch(err) {
		bestItem = {name: 'Error! Error! Something went wrong here. Error message: <br /><p style="color: red; font-size: 20px">'+err+"</p>", score: 31415926535, link: "", type: itemType}
		throw err
	}
	
	return bestItem;
}

function getScore(item, profileData) {
	let desiredLevel = profileData.BiSDefaults.level
	let sortType = profileData.BiSDefaults.sort
	let activeScores = bisScores[sortType][desiredLevel-1]
	if (+item.level > desiredLevel) {
		return -Infinity
	}

	let score = 0
	for (let i in statTranslateTable) {
		if (item[i]!=undefined) {
			score += (+item[i])*activeScores[statTranslateTable[i]]
		}
	}
	return score
}

/*
*	This function compares an item with the current BiS filters,
*	to see if the item is valid
*/
function checkFilters(data, filters) {
	var isValid = true
	$.each(filters, function(name, value) {
		if (value == true && data[name.substring(2)] != "0" && data[name.substring(2)] != undefined && name.charAt(0) == "g") {
			isValid = false;
			return false;
		}
	});
	return isValid;
}

/*
*	This function shows an item to the user
*	Currently it doesn't do that much, but will probably be nice to have
*	separate in the future if more advanced stuff is desired
*/
function showItem(item) {
	if (item.Link == "") {
		$("#" + item.type + "-BiS").html(item.name);
	} else {
		$("#" + item.type + "-BiS").html("<a href="+item.link+' target="_blank">'+item.name+"</a>");
	}
}