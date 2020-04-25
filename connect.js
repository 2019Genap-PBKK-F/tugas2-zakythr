var sql = require("mssql");

var config = require("./config/config.js")

module.exports.execqr = function (res, qr, params) {
    sql.connect(config, function (err) {
       if (err) {
          res.end('Database didnt Connect' + err)
       }
       else {
          var request = new sql.Request()
          if (params != null){
             params.forEach(function (p) {
                request.input(p.name, p.sqltype, p.value);
             });
          }
          request.query(qr, function (err, jsonResponse) {
             if (err) {
                console.log(err)
             }
             else {
                res.json(jsonResponse.recordset);
             }
          })
       }
    })
 }