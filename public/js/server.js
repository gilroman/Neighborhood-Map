var express = require('express');
var neighborhoodApp = express();

//neighborhoodApp.get('/index.html', function(req, res){
//	res.send('Hello Gil!');
//});

var server = neighborhoodApp.listen(8080, function(){
	console.log('Listening on port 8080');
});