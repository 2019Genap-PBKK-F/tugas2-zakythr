const express = require("express");
const app = express();
const sql = require('mssql')
const hostname = 'localhost';
// const hostname = '10.151.37.67';
const port = 8026;

//CORS Middleware
app.use(function (req, res, next) {
  //Enabling CORS 
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
  next();
});

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

const config = {
    user: 'sa',
    password: 'SaSa1212',
    server: '10.199.13.253',
    database: 'nrp05111740000140'
};

var executeQuery = function(res, query, param, reqType) {
  sql.connect(config, function(err){
    if(err) {
      res.end('Connection Error\n' + err)
    }
    else {
      var request = new sql.Request()
      if(reqType != 0) {
        param.forEach(function(p)
        {
          request.input(p.name, p.sqltype, p.value);
        });
      }
      request.query(query, function(err, response){
        if(err) {
          console.log('Query Error\n' + err)
        }
        else{
          res.send(response.recordset)
        }
     })
    }
  })
}

app.get("/",function(req, res)
{
  res.end('Jika gagal berusaha');
});

app.get("/api/mahasiswa", function(req, res)
{
  var query = "select * from mahasiswa";
  executeQuery(res, query, null, 0);
});

app.get("/api/KategoriUnit", function(req, res)
{
  var query = "select * from KategoriUnit";
  executeQuery(res, query, null, 0);
});

app.get("/api/DataDasar", function(req, res)
{
  var query = "select * from DataDasar";
  executeQuery(res, query, null, 0);
});

app.get("/api/DataDasar", function(req, res)
{
  var query = "select * from DataDasar";
  executeQuery(res, query, null, 0);
});

app.get("/api/Unit", function(req, res)
{
  var query = "select * from Unit";
  executeQuery(res, query, null, 0);
});

app.get("/api/Capaian_Unit", function(req, res)
{
  var query = "select * from Capaian_Unit";
  executeQuery(res, query, null, 0);
});

app.post("/api/mahasiswa", function(req, res)
{
  var param = [
    { name: 'nrp', sqltype: sql.VarChar(50), value: req.body.nrp},
    { name: 'nama', sqltype: sql.VarChar(50), value: req.body.nama},
    { name: 'angkatan', sqltype: sql.VarChar(5), value: req.body.angkatan},
    { name: 'tgl_lahir', sqltype: sql.VarChar(50), value: req.body.lahir},
    { name: 'photo', sqltype: sql.VarChar, value: req.body.photo},
    { name: 'checkbox', sqltype: sql.Bit, value: req.body.checkbox}
  ]

  var query = 'insert into mahasiswa ( nrp, nama, angkatan, tgl_lahir, photo, checkbox ) values( @nrp, @nama, @angkatan, @tgl_lahir, @photo, @checkbox)';
  executeQuery(res, query, param, 1)
})

app.post("/api/KategoriUnit", function(req, res)
{
  var param = [
    { name: 'nama', sqltype: sql.VarChar(50), value: req.body.nama}
  ]

  var query = 'insert into KategoriUnit ( nama ) values( @nama)';
  executeQuery(res, query, param, 1)
})

app.post("/api/DataDasar", function(req, res)
{
  var param = [
    { name: 'nama', sqltype: sql.VarChar(50), value: req.body.nama}
  ]

  var query = 'insert into DataDasar ( nama ) values( @nama)';
  executeQuery(res, query, param, 1)
})

app.post("/api/Unit", function(req, res)
{
  var param = [
    { name: 'KategoriUnit_id', sqltype: sql.Int, value: req.body.kategori},
    { name: 'nama', sqltype: sql.VarChar(50), value: req.body.nama}
  ]

  var query = 'insert into Unit ( nama ) values( @nama)';
  executeQuery(res, query, param, 1)
})

app.post("/api/Capaian_Unit", function(req, res)
{
  var param = [
    //{ name: 'DataDasar_id', sqltype: sql.Int, value: req.body.datadasar},
    //{ name: 'Unit_Id', sqltype: sql.Int, value: req.body.unit},
    { name: 'waktu', sqltype: sql.DateTime, value: req.body.waktu},
    { name: 'capaian', sqltype: sql.Float, value: req.body.capaian}
  ]

  var query = 'insert into Capaian_Unit ( waktu, capaian ) values( @waktu, @capaian)';
  executeQuery(res, query, param, 1)
})

app.put('/api/mahasiswa/:id',function(req,res){

  var param = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'nrp', sqltype: sql.VarChar(50), value: req.body.nrp},
    { name: 'nama', sqltype: sql.VarChar(50), value: req.body.nama},
    { name: 'angkatan', sqltype: sql.VarChar(5), value: req.body.angkatan},
    { name: 'tgl_lahir', sqltype: sql.VarChar(50), value: req.body.lahir},
    { name: 'photo', sqltype: sql.VarChar, value: req.body.photo},
    { name: 'checkbox', sqltype: sql.Bit, value: req.body.checkbox}
  ]
  
  var query = "update mahasiswa set nrp = @nrp, nama = @nama, angkatan = @angkatan, tgl_lahir = @tgl_lahir, photo = @photo, checkbox = @checkbox WHERE id = @id";
  executeQuery(res,query, param, 1);
});

app.put('/api/KategoriUnit/:id',function(req,res){

  var param = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'nama', sqltype: sql.VarChar(50), value: req.body.nama}
  ]
  
  var query = "update KategoriUnit set nama = @nama WHERE id = @id";
  executeQuery(res,query, param, 1);
});

app.put('/api/DataDasar/:id',function(req,res){

  var param = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'nama', sqltype: sql.VarChar(50), value: req.body.nama}
  ]
  
  var query = "update DataDasar set nama = @nama WHERE id = @id";
  executeQuery(res,query, param, 1);
});

app.put('/api/Unit/:id',function(req,res){

  var param = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'KategoriUnit_id', sqltype: sql.Int, value: req.body.kategori},
    { name: 'nama', sqltype: sql.VarChar(50), value: req.body.nama}
  ]
  
  var query = "update Unit set nama = @nama, KategoriUnit_id = @KategoriUnit_id WHERE id = @id";
  executeQuery(res,query, param, 1);
});

app.put('/api/Capaian_Unit/:DataDasar_id',function(req,res){

  var param = [
    { name: 'DataDasar_id', sqltype: sql.Int, value: req.body.datadasar},
    { name: 'Unit_Id', sqltype: sql.Int, value: req.body.unit},
    { name: 'waktu', sqltype: sql.DateTime, value: req.body.waktu},
    { name: 'capaian', sqltype: sql.Float, value: req.body.capaian}
  ]
  
  var query = "update Capaian_Unit set DataDasar_id = @DataDasar_id, Unit_Id = @Unit_Id, waktu = @waktu, capaian = @capaian WHERE DataDasar_id = @DataDasar_id";
  executeQuery(res,query, param, 1);
});

app.delete("/api/mahasiswa/:id", function(req, res)
{
  var query = "delete from mahasiswa where id=" + req.params.id;
  executeQuery(res, query, null, 0);
})

app.delete("/api/KategoriUnit/:id", function(req, res)
{
  var query = "delete KategoriUnit where id=" + req.params.id;
  executeQuery(res, query, null, 0);
})

app.delete("/api/DataDasar/:id", function(req, res)
{
  var query = "delete DataDasar where id=" + req.params.id;
  executeQuery(res, query, null, 0);
})

app.delete("/api/Unit/:id", function(req, res)
{
  var query = "delete Unit where id=" + req.params.id;
  executeQuery(res, query, null, 0);
})

app.listen(port, hostname, function () {
  var message = "Server runnning on Port: " + port;
  console.log(message);
});