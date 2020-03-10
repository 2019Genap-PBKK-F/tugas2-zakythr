var express = require('express');
var app = express();
const hostname = '10.199.14.46';
const port = 8026;

var Controller = require('./controller')();

app.get("/",function(request, response)
{
    response.json({"Message":"Welcome"});
});
app.use("/api/siswa", Controller);

app.listen(port, function () {
    var message = "Server runnning on Port: " + port;
    console.log(message);
});