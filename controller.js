var express = require('express');
var router = express.Router();
var sql = require("mssql");
var conn = require("./connect")();

var routes = function()
{
    router.route('/')
        .get(function(req, res)
        {
            conn.connect().then(function()
            {
                var sqlQuery = "Select * from siswa";
                var req = new sql.Request(conn);
                req.query(sqlQuery).then(function(recordset)
                {
                    res.json(recordset.recordset);
                    conn.close();
                })
                    .catch(function(err){
                        conn.close();
                        res.status(400).send("Error");
                    });
            })
                .catch(function(err){
                    conn.close();
                    res.status(400).send("Error");
                });
        });
    return router;       
};
module.exports = routes;