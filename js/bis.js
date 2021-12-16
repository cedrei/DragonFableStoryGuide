/*
    Licenced under  GPL-3.0-or-later
*/

"use strict";

var bisData = {
	belts: {},
	bracers: {},
	capes: {},
	helms: {},
	necklaces: {},
	rings: {},
	trinkets: {}
};

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
		$.getJSON("BiSData/Finished/" + itemType + ".json", function(data) {
			bisData[itemType] = data;
			showItem(findBestItem(itemType));
		});
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
		$.each(bisData[itemType][profileData.BiSDefaults.sort][profileData.BiSDefaults.level-1], function(itemID, data) {
			if (data.score > bestItem.score && checkFilters(data, profileData.hidden_values)) {
				bestItem.name = data.name;
				bestItem.score = data.score;
				bestItem.link = data.link;
			}
		});
	} catch(err) {
		bestItem = {name: 'Error! Error! Something went wrong here. Error message: <br /><p style="color: red; font-size: 20px">'+err+"</p>", score: 31415926535, link: "", type: itemType}
	}
	
	return bestItem;
}

/*
*	This function compares an item with the current BiS filters,
*	to see if the item is valid
*/
function checkFilters(data, filters) {
	var isValid = true
	$.each(filters, function(name, value) {
		if (value == true && data[name.substring(2)] == "Yes" && name.charAt(0) == "g") {
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
	if (item.link == "") {
		$("#" + item.type + "-BiS").html(item.name);
	} else {
		$("#" + item.type + "-BiS").html("<a href="+item.link+' target="_blank">'+item.name+"</a>");
	}
}