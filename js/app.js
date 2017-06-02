// Data for the Silverlake Neighborhood Explorer
var places = [{
		name:'Night + Market Song',
		typeOfBusiness:'Restaurant',
		tags:['Thai', 'Restaurant'],
		streetAddress:'3322 W. Sunset Blvd.',
		city:'Los Angeles',
		state:'CA'
	},
	{
		name:'Still Yoga',
		typeOfBusiness:'Yoga',
		tags:['Yoga','Studio'],
		streetAddress:'2395 Glendale Blvd',
		city:'Los Angeles',
		state:'CA'
	}];

var neighborhood = 'Silverlake';

var map;


// Model - A Class to represent a place listed in the neighborhood map
function Place(data){
	var self = this;
	self.name = ko.observable(data.name);
	self.typeOfBusiness = ko.observable(data.typeOfBusiness);
	self.tags = ko.observableArray(data.tags);
	self.streetAddress = ko.observable(data.streetAddress);
	self.city = ko.observable(data.city);
	self.state = ko.observable(data.state);
};


// ViewModel
function locationsViewModel(){

var self = this;

// An empty array to store location data
self.listings = ko.observableArray([]);

// A variable for the query term.
self.query = ko.observable();

self.filteredList = ko.computed(function(){});

// Initialize Google Map
initMap();

// Store the data for each place in the observable array
places.forEach(function(listing){
	self.listings.push(new Place(listing));
	setMarker(listing.streetAddress);
});

// Filtered List   STILL NEED TO MAKE THE TAGS ARRAY ALL TO LOWER CASE FOR COMPARISON WITH THE QUERY
self.filteredList = ko.computed(function(query){
			if(!self.query()){ return self.listings();}
			else {
				var filtered = ko.utils.arrayFilter(self.listings(), function(listing){
				return (listing.name().toLowerCase().indexOf(self.query().toLowerCase())>-1 || listing.tags().indexOf(self.query())>-1);
			});
				return filtered;
			}
		});


// Filter the list of the observable array listings by the query entered on the serach input box
self.filterList = function(){
	return self.filteredList();
}

}

ko.applyBindings(new locationsViewModel());


/*****************
*								 *
*		   MAP 			 *
*								 *
*****************/


function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.0869409, lng: -118.2702036},
    zoom: 15
  });
}

function setMarker(address) {

//Initialize the geocoder.
var geocoder = new google.maps.Geocoder();

//Geocode the location, then center the map on it and zooom in.
geocoder.geocode(
{
	address: address,
	componentRestrictions: {locality: 'Los Angeles'}
}, function (results, status) {
	if(status == 'OK') {
		var marker = new google.maps.Marker({
			map: map,
			position: results[0].geometry.location
		});
	} else {
		window.alert('Google Geocoding was not successful because of: ' +status);
		}
});
}
