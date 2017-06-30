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
	},
	{
		name:'Speranza',
		typeOfBusiness:'Restaurant',
		tags:['Italian','Restaurant'],
		streetAddress:'2547 Hyperion Ave',
		city:'Los Angeles',
		state:'CA',
		latLong: {lat: 34.1056681, lng: -118.2729709}
	},{
		name:'Sunset Boulevard Nursery',
		typeOfBusiness:'Plant Nursery',
		tags:['Plants','Nursery'],
		streetAddress:'4368 Sunset Blvd',
		city:'Los Angeles',
		state:'CA',
		latLong: {lat: 34.0960504, lng: -118.2849394}
	},{
		name:'Micheltorena Stairs',
		typeOfBusiness:'Stairs',
		tags:['Walk','Stairs'],
		streetAddress:'3400 Sunset Blvd',
		city:'Los Angeles',
		state:'CA',
		latLong: {lat: 34.087425, lng: -118.2747807697085}
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

	// Function that uses the index in the array of the listing clicked and triggers the corresponding marker
	self.listingClicked = function(place) {
		var clickedLatLng = place.latLong.lat.toString()+place.latLong.lng.toString().slice(0,11);

		markers.forEach(function(marker){
			var markerLatLng = marker.position.lat().toString()+marker.position.lng().toString().slice(0,11);
			if(clickedLatLng === markerLatLng){
				google.maps.event.trigger(marker, 'click');
			}
		});
	};

}

ko.applyBindings(new locationsViewModel(places));

/*****************
*								 *
*		   MAP 			 *
*								 *
*****************/

//Initializes the map and draws the markers
function initMap(){

		var mapLoading = document.getElementById('map');
		mapLoading.innerHTML = '<p class="errorMessage">Loading the Google Map API...</p>';

		var googleMapPromise = new Promise(function(resolve, reject){
			map = new google.maps.Map(document.getElementById('map'), {
    				center: {lat: 34.0869409, lng: -118.2702036},
    				zoom: 14
  				});

			var mapListener = google.maps.event.addListenerOnce(map, 'idle', mapLoaded);

			function mapLoaded(){
  			resolve();
  			google.maps.event.removeListener(mapListener);
  		}
  	})
  	.then(function(){
  		places.map(function(place){
  			var marker = drawMarker(place);
  			markers.push(marker);

  			//object to store each venue's description, tipsURL and tips
  			var info = {};

  			// Each Venue Goes through these steps
  			//1. get URL's this can be done for all of them in parallel at once
  			var url = venueUrl(fourSquareClientID, fourSquareClientSecret, fourSquareApiVersion, place.latLong, place.name);


  			//2. get venue object from foursquare & attach the infowindow to the marker
  			get(url)
  			.then(function(response){
  				return response.json();
  			})
  			.then(function(venues){
  				var venueObject = venue(venues,0);
  				info.content = venueDescription(venueObject);
  				info.tipsUrl = tipsUrl(fourSquareClientID, fourSquareClientSecret, fourSquareApiVersion, venueObject.id);

  				get(info.tipsUrl, info)
					.then(function(response){
						return response.json();
					})
					.then(function(data){
						info.tips = tips(data);
					})
					.then(function(){
						var infowindow = markerInfoWindow(info.content, info.tips);
						bindInfoWindow(marker, infowindow, map);
					});
				})
  			.catch(function(error){
  				info.content = 'Error Getting Venue information about '+ place.name +' from Foursquare';
  				info.tips = '';
  				var infowindow = markerInfoWindow(info.content, info.tips);
					bindInfoWindow(marker, infowindow, map);
  				console.log('Error with Foursquare API', error);
  			});
  	});
  	})
  	.catch(function(error){
  		console.log('Error with Google Map API', error);
  		var mapLoading = document.getElementById('map');
			mapLoading.innerHTML = '<p class="errorMessage">Waiting to connect to Google Map API...</p>';
  	});
}



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
var markerInfoWindow = function(description, tips){
	var contentString = '<div class="infoWindow">'
												+description+tips
												+'<p class="attribution">Our venue information is provided by Foursquare</p>'
											+'</div>';
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


/************************
*								 				*
*		  FOURSQUARE 			 	*
*								 				*
************************/
var fourSquareClientID = '551QAF42W0LM5Q5FL1HJJBITSW14KBUXFEKXYOXFHW2JITWK';
var fourSquareClientSecret = 'QJYCFLFJZ3OKYMEW4ATB2TRVMSX5JTF43UQ2HY4JAFMAIQLZ';
var fourSquareApiVersion = '20160801';

// Function that takes the venue, name, latlong object and foursquare api credentials
// and returns a string with the correct url to request the venue information from the Foursquare API
var venueUrl = function(clientId, clientSecret, APIversion,latlong, name){
	return 'https://api.foursquare.com/v2/venues/search?ll='+latlong.lat+','+latlong.lng+
					'&client_id='+clientId+
					'&client_secret='+clientSecret+
					'&v='+APIversion+
					'&query='+name.replace(/ /g,"%20");+
					'&intent=browse&radius=100';
};

// Function that takes a ClientID, Client Secret, venueID & foursquare API version and returns
// a string of the proper API url to requests tips for that venue
var tipsUrl = function(clientId, clientSecret, APIversion, venueId){
	return 'https://api.foursquare.com/v2/venues/'+venueId+'/tips?'+
					'client_id='+clientId+
					'&client_secret='+clientSecret+
					'&v='+APIversion;
};

// Function that returns the venue object in the specified array index from a fourSquare response
var venue = function(data, index){
	return data.response.venues[index];
};

// Function that takes in a venue object and returns a string with html
// to use as content on an infowindow
var venueDescription = function(venue){
	var venueTxt = '<p class="venueDescription">';
		if(venue.categories[0].name){
			venueTxt = venueTxt.concat(venue.categories[0].name+'<br>');
		}
		if(venue.name){
			venueTxt = venueTxt.concat('<a href="http://foursquare.com/v/'+venue.id+'?ref='+fourSquareClientID+'>'+venue.name+'</a><br>');
		}
		if(venue.url){
			venueTxt = venueTxt.concat(venue.url+'<br>');
		}
		if(venue.contact.formattedPhone){
			venueTxt = venueTxt.concat(venue.contact.formattedPhone+'<br>');
		}
		if(venue.location.address){
			venueTxt = venueTxt.concat(venue.location.address+'<br>');
		}
		if(venue.location.city){
			venueTxt = venueTxt.concat(venue.location.city+'<br>');
		}
		if(venue.location.state){
			venueTxt = venueTxt.concat(venue.location.state+'<br>');
		}
		if(venue.location.postalCode){
			venueTxt = venueTxt.concat(venue.location.postalCode);
		}
		venueTxt = venueTxt.concat('</p>');
	return venueTxt;
};

// Function that returns an array of text strings for the first three tips
// in a fourSquare tips response object for a specific venue
var tips = function(data){
	var tipCount = 3;
	var tips = '<p class="tips">Tips:<br>';
	if (tipCount > data.response.tips.items.length){
		tipCount = data.response.tips.items.length;
	}
	for (var i=0; i<tipCount; i++){
		tips = tips.concat('<p>'+data.response.tips.items[i].text+'</p>');
	}
		tips = tips.concat('</p>');
	return tips;
};

//function that takes in a url and uses fetch to make a request to the server
var get = function (url){
	return fetch(url, {
		method:'get'
	});
};