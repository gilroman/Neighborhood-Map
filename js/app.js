'use strict';

// Data for the Silverlake Neighborhood Explorer
var places = [{
		name:'Night + Market Song',
		typeOfBusiness:'Restaurant',
		tags:['Thai', 'Restaurant'],
		streetAddress:'3322 W. Sunset Blvd.',
		city:'Los Angeles',
		state:'CA',
		latLong: {lat: 34.086907, lng: -118.275844 }
	},
	{
		name:'Still Yoga',
		typeOfBusiness:'Yoga',
		tags:['Yoga','Studio'],
		streetAddress:'2395 Glendale Blvd',
		city:'Los Angeles',
		state:'CA',
		latLong: {lat: 34.099983, lng: -118.259545}
	}];

// Global variable referencing to the google map object
var map;

// Array for markers.
var markers = [];

// Model - A Class to represent a place listed in the neighborhood map
var Place = function(data) {
	this.name = ko.observable(data.name);
	this.typeOfBusiness = ko.observable(data.typeOfBusiness);
	this.tags = ko.observableArray(data.tags);
	this.streetAddress = ko.observable(data.streetAddress);
	this.city = ko.observable(data.city);
	this.state = ko.observable(data.state);
	this.latLong = ko.observable(data.latLong);
}

// ViewModel
function locationsViewModel(places){
	var self = this;

	// An observable array to store locations data
	self.listings = ko.observableArray(places);

	// A variable for the search input box characters
	self.query = ko.observable('');

	// Filter the Listings by name or tags
	self.filteredList = ko.computed(function(query){
		var filteredArray = [];
		console.log(self.query());
		if(self.query()==''){
			filteredArray = self.listings();
		} else {
			filteredArray = ko.utils.arrayFilter(self.listings(), function(listing){
				return (listing.name.toLowerCase().indexOf(self.query().toLowerCase())>-1 ||
				listing.tags.join(' ').toLowerCase().indexOf(self.query().toLowerCase())>-1);
			});
		}
		return filteredArray;
	});

	// Function that shows a marker if it's in the filtered list and hides it if it's not
	// It compares the marker's title to the listing's name
	self.showMarkers = ko.computed(function(){
		var filteredArray = self.filteredList();
		for(var m=0; m<markers.length; m++){
			for(var l=0; l<filteredArray.length; l++){
				if (markers[m].title==filteredArray[l].name){
					markers[m].setVisible(true);
					break;
				} else {
					markers[m].setVisible(false);
				}
			}
		}
	});

	// Variable for the last clicked on marker on the list
	self.currentMarker = null;

	//Function that makes a marker for every listing in the filtered list
	//pushes a marker to the markers array, creates and infoWindow on the marker
	self.markersOnList = function(){
			self.clearMarkers();
			markers = [];

			for (var i=0; i<self.filteredList().length; i++){
				var infowindow = null;

				markers.push(drawMarker(self.filteredList()[i]));
				infowindow = markerInfoWindow(self.filteredList()[i]);
				bindInfoWindow(markers[i], infowindow, map);
			}
	};

	// Function to set clear all markers in the map by setting to to null the map attribute of each marker
	self.clearMarkers = function() {
		for(var i = 0; i<markers.length; i++){
			markers[i].setMap(null);
		}
	};

	// Function that used the index in the array of the listing clicked and triggers the corresponding marker
	self.listingClicked = function(index) {
		google.maps.event.trigger(markers[index], 'click');
		self.currentMarker = markers[index];
	};

	// Placeholder for the search function
	self.search = function(){

	};

	// Check to see if Google Map has loaded, if not display a message indicating it's waiting to connect
	if (typeof google === 'undefined') {
		var mapError = document.getElementById('map');
		mapError.innerHTML = '<p class="errorMessage">Waiting to connect to Google Map API...</p>';
	} else {
			for (var i=0; i<self.listings().length; i++){
				markers.push(self.drawMarker(self.listings()[i]));

			}
		}
}

ko.applyBindings(new locationsViewModel(places));

/*****************
*								 *
*		   MAP 			 *
*								 *
*****************/

//Initializes the map and draws the markers
var initMap = function(){
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.0869409, lng: -118.2702036},
    zoom: 14
  });

  //Draws the markers when the map initializes
  for (var i=0; i<places.length; i++){
  	var marker = drawMarker(places[i]);
  	markers.push(marker);
  	var infowindow = markerInfoWindow(places[i]);
  	bindInfoWindow(marker, infowindow, map);
  }
};

// Function that takes a listing object as a parameter and draws a single marker
var drawMarker = function(listing){
	var marker = new google.maps.Marker({
		map: map,
		position: listing.latLong,
		title: listing.name,
		animation: google.maps.Animation.DROP
	});
	return marker;
};

// Function that creates a new infowindow on a marker with listing information
var markerInfoWindow = function(listing){
	var contentString = '<div class="infoWindow">'+listing.name+'</div>';
	var infowindow = new google.maps.InfoWindow({
  	content: contentString
  });
	return infowindow;
}

// Function that makes a marker bounce for the amount of time indicated with the timeout argument (in milliseconds)
var bounce = function(marker, timeout) {
	marker.setAnimation(google.maps.Animation.BOUNCE);
  	window.setTimeout(function(){
  		marker.setAnimation(null);
  	}, timeout);
 }

// Function that binds a click event listener to a marker which will open an infowindo
var bindInfoWindow = function(marker, infowindow, map){
	marker.addListener('click', function(){
		infowindow.open(map, marker);
		bounce(marker, 2000);
	});
}