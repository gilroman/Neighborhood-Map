var express = require('express');
var neighborhoodApp = express();

neighborhoodApp.use(express.static(__dirname + '/public'));
//neighborhoodApp.get('/index.html', function(req, res){
//	res.send('Hello Gil!');
//});

var server = neighborhoodApp.listen(8080, function(){
	console.log('Listening on port 8080');
});