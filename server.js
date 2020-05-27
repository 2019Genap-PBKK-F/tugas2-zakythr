const express = require("express")
const app = express()
const sql = require('mssql')
// const hostname = '10.199.14.46'
// const port = 8018
const jwt = require("jsonwebtoken");
const Validator = require("validator");
const isEmpty = require("is-empty");

const keys = {secretOrKey: "secret"};

//CORS Middleware
app.use(function (req, res, next) {
   //Enabling CORS 
   res.header("Access-Control-Allow-Origin", "*")
   res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE")
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization, *")
   next()
})

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const config = {
   user: 'sa',
   password: 'SaSa1212',
   server: '10.199.13.253',
   database: 'nrp05111740000140'
}

var executeQuery = function(res, query, model, reqType) {
   sql.connect(config, function(err){
      if(err) {
      res.end('Connection Error\n' + err)
      }
      else {
         var request = new sql.Request()
         if(reqType != 0) {
            model.forEach(function(m)
            {
               request.input(m.name, m.sqltype, m.value)
            })
         }
         request.query(query, function(err, response){
            if(err) {
               console.log('Query Error\n' + err)
            }
            else{
               // console.log(response.recordset)
               res.send(response.recordset)
            }
         })
      }
   })
}

function validateLoginInput(data) {
    let errors = {};
    // Convert empty fields to an empty string so we can use validator functions
    data.email = !isEmpty(data.email) ? data.email : "";
    data.password = !isEmpty(data.password) ? data.password : "";
    // Email checks
    if (Validator.isEmpty(data.email)) {
        errors.email = "Email field is required";
    } else if (!Validator.isEmail(data.email)) {
        errors.email = "Email is invalid";
    }
    // Password checks
    if (Validator.isEmpty(data.password)) {
        errors.password = "Password field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};

///////////////////////\\\\\\\\\\\\\\\\\\
///////////////////LOGIN\\\\\\\\\\\\\\\\\\

//Select
app.post("/api/login", function(req, res)
{
    // Form validation
    const {
        errors,
        isValid
    } = validateLoginInput(req.body);
    // Check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const email = req.body.email;
    const password = req.body.password;

    if (email != password) {
        return res.status(400).json(errors);
    }

    sql.connect(config).then(pool => {
        // Query
        var query = `SELECT * FROM [SatuanKerja] WHERE  [SatuanKerja].[email] = N'${email}';`;

        return pool.request()
            .query(query)
    }).then(user => {
        const payload = {
            id: user.recordset[0].id,
            email: user.recordset[0].email,
            nama: user.recordset[0].nama
        };
        // Sign token
        jwt.sign(
            payload,
            keys.secretOrKey, {
                expiresIn: 31556926 // 1 year in seconds
            },
            (err, token) => {
                res.json({
                    success: true,
                    token: "Bearer " + token
                });
            }
        );
    }).catch(err => {
      // ... error checks
      return res
        .status(400)
        .json({
            passwordincorrect: "not found & incorrect"
        });
    });
})

app.get('/my/token', (req, res, next) => {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.headers.authorization;
    // return res.status(401).json(token);
    token = token.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            message: 'Must pass token'
        });
    }
    // decode token
    jwt.verify(token, keys.secretOrKey, function (err, user) {
        if (err)
            return res.status(401).json({
                message: 'token invalid'
            });
        
        return res.status(200).json(user);

        // //return user using the id from w/in JWTToken
        // sql.connect(config).then(pool => {
        //     // Query
        //     var query = `SELECT * FROM [SatuanKerja] WHERE  [SatuanKerja].[id] = N'${user.id}';`;

        //     return pool.request()
        //         .query(query)
        // }).then(user => {
        //     res.json({
        //         user: user,
        //         token: token
        //     });
        // });

    });
}
);

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\
///////////////////Data Dasar\\\\\\\\\\\\\\\\\\

//Select
app.get("/api/datadasar/", function(req, res)
{
   var query = "select * from DataDasar"
   executeQuery(res, query, null, 0)
})

app.get("/api/datadasar/nama", function(req, res)
{
   var query = 'select id,nama as name from DataDasar'
   executeQuery(res, query, null, 0)
})

app.get("/api/datadasar/:id",function(req, res)
{
   var query = "select * from DataDasar where id=" + req.params.id
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/datadasar/", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'expired_date', sqltype: sql.DateTime, value: req.body.expired_date }
   ]

   var query = 'insert into DataDasar ( nama, create_date, last_update, expired_date )'
               + 'values( @nama, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, @expired_date )'
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/datadasar/:id", function(req, res) {
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.params.id },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'expired_date', sqltype: sql.DateTime, value: req.body.expired_date }
   ]

   var query = 'update DataDasar set nama = @nama, last_update = CURRENT_TIMESTAMP, expired_date = @expired_date where id = @id'
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/datadasar/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.params.id }
   ]

   var query = "delete from DataDasar where id = @id"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\
///////////////////Aspek\\\\\\\\\\\\\\\\\\

//Select
app.get("/api/aspekk/", function(req, res)
{
   var query = "select * from Aspek"
   executeQuery(res, query, null, 0)
})

app.get("/api/aspekk/nama", function(req, res)
{
   var query = 'select id,aspek as name from Aspek'
   executeQuery(res, query, null, 0)
})

app.get("/api/aspekk/:id",function(req, res)
{
   var query = "select * from Aspek where id=" + req.params.id
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/aspekk/", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'aspek', sqltype: sql.VarChar, value: req.body.aspek },
      { name: 'komponen_aspek', sqltype: sql.VarChar, value: req.body.komponen_aspek }
   ]

   var query = 'insert into Aspek ( aspek, komponen_aspek ) values( @aspek, @komponen_aspek )'
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/aspekk/:id", function(req, res) {
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'aspek', sqltype: sql.VarChar, value: req.body.aspek },
      { name: 'komponen_aspek', sqltype: sql.VarChar, value: req.body.komponen_aspek }
   ]

   var query = 'update Aspek set aspek = @aspek, komponen_aspek = @komponen_aspek where id = @id'
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/aspekk/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.params.id }
   ]

   var query = "delete from Aspek where id = @id"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
///////////////////Jenis Satker\\\\\\\\\\\\\\\\\\ 

//Select
app.get("/api/jenissatker/", function(req, res)
{
   var query = "select * from JenisSatker"
   executeQuery(res, query, null, 0)
})

app.get("/api/jenissatker/nama", function(req, res)
{
   var query = "select id,nama as name from JenisSatker"
   executeQuery(res, query, null, 0)
})

app.get("/api/jenissatker/id", function(req, res)
{
   var query = "select id as code from JenisSatker"
   executeQuery(res, query, null, 0)
})

app.get("/api/jenissatker/:id",function(req, res)
{
   var query = "select * from JenisSatker where id=" + req.params.id
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/jenissatker/", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Numeric, value: req.body.id },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'expired_date', sqltype: sql.DateTime, value: req.body.expired_date }
   ]

   var query = 'insert into JenisSatker ( nama, create_date, last_update, expired_date )'
               + 'values( @nama, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, @expired_date )'
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/jenissatker/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Numeric, value: req.params.id },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'expired_date', sqltype: sql.DateTime, value: req.body.expired_date }
   ]

   var query = "update JenisSatker set nama = @nama, last_update = CURRENT_TIMESTAMP, expired_date = @expired_date where id = @id" 
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/jenissatker/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Numeric, value: req.params.id }
   ]

   var query = "delete from JenisSatker where id = @id" 
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\
///////////////////Periode\\\\\\\\\\\\\\\\\\ 

//Select
app.get("/api/periode/", function(req, res)
{
   var query = "select * from Periode"
   executeQuery(res, query, null, 0)
})

app.get("/api/periode/nama", function(req, res)
{
   var query = "select id as name from Periode"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/periode/", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Numeric, value: req.body.id },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
   ]

   var query = "insert into Periode (nama, create_date, last_update) values (@nama, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/periode/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Numeric, value: req.params.id },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama }
   ]

   var query = "update Periode set nama = @nama, last_update = CURRENT_TIMESTAMP where id = @id" 
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/periode/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Numeric, value: req.params.id }
   ]

   var query = "delete from Periode where id = @id"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
//////////////////Master Indikator\\\\\\\\\\\\\\

//Select
app.get("/api/masterindikator/", function(req, res)
{
   var query = "select * from MasterIndikator"
   executeQuery(res, query, null, 0)
})

app.get("/api/masterindikator/nama", function(req, res)
{
   var query = "select id,nama as name from MasterIndikator"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/masterindikator/", function(req, res)
{
  var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_aspek', sqltype: sql.Int, value: req.body.id_aspek },
      { name: 'id_penyebut', sqltype: sql.Int, value: req.body.id_penyebut },
      { name: 'id_pembilang', sqltype: sql.Int, value: req.body.id_pembilang },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'deskripsi', sqltype: sql.VarChar, value: req.body.deskripsi },
      { name: 'default_bobot', sqltype: sql.VarChar, value: req.body.default_bobot },
      { name: 'expired_date', sqltype: sql.DateTime, value: req.body.expired_date }
   ]

   var query = "insert into MasterIndikator( id_aspek, id_penyebut, id_pembilang, nama, deskripsi, default_bobot, create_date, last_update, expired_date )"
               + "values ( @id_aspek, @id_penyebut, @id_pembilang, @nama, @deskripsi, @default_bobot, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, @expired_date)"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/masterindikator/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_aspek', sqltype: sql.Int, value: req.body.id_aspek },
      { name: 'id_penyebut', sqltype: sql.Int, value: req.body.id_penyebut },
      { name: 'id_pembilang', sqltype: sql.Int, value: req.body.id_pembilang },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'deskripsi', sqltype: sql.VarChar, value: req.body.deskripsi },
      { name: 'default_bobot', sqltype: sql.VarChar, value: req.body.default_bobot },
      { name: 'expired_date', sqltype: sql.DateTime, value: req.body.expired_date }
   ]

   var query = "update MasterIndikator set id_aspek = @id_aspek, id_penyebut = @id_penyebut, id_pembilang = @id_pembilang, nama = @nama, deskripsi = @deskripsi," 
               + " default_bobot = @default_bobot, expired_date = @expired_date, last_update = CURRENT_TIMESTAMP where id = @id"
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/masterindikator/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.params.id }
   ]
  
   var query = "delete from MasterIndikator where id = @id"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
/////////////////Indikator Periode\\\\\\\\\\\\\\\

//Select
app.get("/api/indikatorP", function(req, res)
{
   var query = "select * from IndikatorPeriode"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/indikatorP", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_master', sqltype: sql.Int, value: req.body.id_master },
      { name: 'id_periode', sqltype: sql.VarChar, value: req.body.id_periode },
      { name: 'bobot', sqltype: sql.VarChar, value: req.body.bobot },
   ]

   var query = "insert into IndikatorPeriode (id_master, id_periode, bobot) values ( @id_master, @id_periode, @bobot )"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/indikatorP/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_master', sqltype: sql.Int, value: req.body.id_master },
      { name: 'id_periode', sqltype: sql.VarChar, value: req.body.id_periode },
      { name: 'bobot', sqltype: sql.Float, value: req.body.bobot }
   ]

   var query = "update IndikatorPeriode set id_master = @id_master, id_periode = @id_periode, bobot = @bobot where id=@id"
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/indikatorP/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.params.id }
   ]

   var query = "delete from IndikatorPeriode where id=@id"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
//////////////////Satuan Kerja\\\\\\\\\\\\\\\\\\ 

//Select
app.get("/api/satker/", function(req, res)
{
   var query = "select * from SatuanKerja"
   executeQuery(res, query, null, 0)
})

app.get("/api/satker/nama", function(req, res)
{
   var query = 'select id,nama as name from SatuanKerja'
   executeQuery(res, query, null, 0)
})

app.get("/api/satker/:id",function(req, res)
{
   var query = "select * from SatuanKerja where id=" + req.params.id
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/satker/", function(req, res)
{
  var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_satker', sqltype: sql.VarChar, value: req.body.id_satker },
      { name: 'id_jns_satker', sqltype: sql.Numeric, value: req.body.id_jns_satker },
      { name: 'id_induk_satker', sqltype: sql.VarChar, value: req.body.id_induk_satker },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'email', sqltype: sql.VarChar, value: req.body.email },
      { name: 'expired_date', sqltype: sql.DateTime, value: req.body.expired_date }
   ]

   var query = "insert into SatuanKerja ( id_satker, id_jns_satker, id_induk_satker, nama, email, create_date, last_update, expired_date )"
               + "values ( @id_satker, @id_jns_satker, @id_induk_satker, @nama, @email, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, @expired_date)"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/satker/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_satker', sqltype: sql.VarChar, value: req.body.id_satker },
      { name: 'id_jns_satker', sqltype: sql.Numeric, value: req.body.id_jns_satker },
      { name: 'id_induk_satker', sqltype: sql.VarChar, value: req.body.id_induk_satker },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'email', sqltype: sql.VarChar, value: req.body.email },
      { name: 'expired_date', sqltype: sql.DateTime, value: req.body.expired_date }
   ]

   var query = "update SatuanKerja set id_satker = @id_satker, id_jns_satker = @id_jns_satker, id_induk_satker = @id_induk_satker, nama = @nama, email = @email," 
               + " expired_date = @expired_date, last_update = CURRENT_TIMESTAMP where id = @id"
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/satker/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.params.id }
   ]

   var query = "delete from SatuanKerja where id = @id"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
//////////////////Capaian Unit\\\\\\\\\\\\\\\\\\ 

//Select
app.get("/api/capaian-unit/",function(req, res)
{
   var query = "select * from Capaian_Unit"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/capaian-unit/", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_satker', sqltype: sql.VarChar, value: req.body.id_satker },
      { name: 'id_datadasar', sqltype: sql.Int, value: req.body.id_datadasar },
      { name: 'capaian', sqltype: sql.VarChar, value: req.body.capaian }
   ]

   var query = "insert into Capaian_Unit ( id_satker, id_datadasar, waktu, capaian ) values( @id_satker, @id_datadasar, CURRENT_TIMESTAMP, @capaian )"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/capaian-unit/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_satker', sqltype: sql.VarChar, value: req.body.id_satker },
      { name: 'id_datadasar', sqltype: sql.Int, value: req.body.id_datadasar },
      { name: 'capaian', sqltype: sql.VarChar, value: req.body.capaian }
   ]

   var query = "update Capaian_Unit set id_satker = @id_satker, id_datadasar = @id_datadasar, waktu = CURRENT_TIMESTAMP, capaian = @capaian where id = @id"
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/capaian-unit/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id }
   ]

   var query = "delete from Capaian_Unit where id = @id"
   executeQuery(re, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\
///////////////Indikator Satuan Kerja\\\\\\\\\\

//Select
app.get("/api/indikator-satker/", function(req, res)
{
   var query = "select * from Indikator_SatuanKerja"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/indikator-satker/", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_indikator_periode', sqltype: sql.Int, value: req.body.id_indikator_periode },
      { name: 'id_satker', sqltype: sql.UniqueIdentifier, value: req.body.id_satker },
      { name: 'bobot', sqltype: sql.VarChar, value: req.body.bobot },
      { name: 'target', sqltype: sql.VarChar, value: req.body.target },
      { name: 'capaian', sqltype: sql.VarChar, value: req.body.capaian },
      { name: 'lastUpdate', sqltype: sql.VarChar, value: req.body.lastUpdate }
   ]

   var query = "insert into Indikator_SatuanKerja (id_indikator_periode, id_satker, bobot, target, capaian, lastUpdate) values (@id_indikator_periode, @id_satker, @bobot, @target, @capaian, @lastUpdate)"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/indikator-satker/:id&:id2", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'id_indikator_periode', sqltype: sql.Int, value: req.body.id_indikator_periode },
      { name: 'id_satker', sqltype: sql.UniqueIdentifier, value: req.body.id_satker },
      { name: 'bobot', sqltype: sql.Float, value: req.body.bobot },
      { name: 'target', sqltype: sql.Float, value: req.body.target },
      { name: 'capaian', sqltype: sql.Float, value: req.body.capaian },
      { name: 'id', sqltype: sql.Int, value: req.params.id },
      { name: 'id2', sqltype: sql.UniqueIdentifier, value: req.params.id2 },
      { name: 'lastUpdate', sqltype: sql.VarChar, value: req.params.lastUpdate }
  ]

   var query = "update Indikator_SatuanKerja set id_indikator_periode = @id_indikator_periode, id_satker = @id_satker, bobot = @bobot, targer = @target " +
               "capaian = @capaian, id_indikator_periode = @id and id_satker = @id2 lastUpdate = @lastUpdate where id=@id"
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/indikator-satker/:id", function(req, res)
{
   var model = [
      { name: 'id', sqltype: sql.Int, value: req.params.id }
   ]

   var query = "delete from Indikator_SatuanKerja where id=@id"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\
///////////////////Data Desa\\\\\\\\\\\\\\\\\\ 

// //Select
// app.get("/api/datadesa/", function(req, res)
// {
//    var query = "select * from DataDesa"
//    executeQuery(res, query, null, 0)
// })

// //Insert
// app.post("/api/datadesa/", function(req, res)
// {
//    var model = [
//       { name: 'id', sqltype: sql.Int, value: req.body.id },
//       { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
//       { name: 'nik', sqltype: sql.VarChar, value: req.body.nik },
//       { name: 'no_kk', sqltype: sql.VarChar, value: req.body.no_kk },
//       { name: 'tgl_lahir', sqltype: sql.VarChar, value: req.body.tgl_lahir },
//       { name: 'setatus', sqltype: sql.VarChar, value: req.body.setatus },
//       { name: 'pendidikan', sqltype: sql.VarChar, value: req.body.pendidikan },
//       { name: 'pekerjaan', sqltype: sql.VarChar, value: req.body.pekerjaan },
//       { name: 'alamat', sqltype: sql.VarChar, value: req.body.alamat }
//    ]

//    var query = "insert into DataDesa ( nama, nik, no_kk, tgl_lahir, setatus, pendidikan, pekerjaan, alamat) values (@nama, @nik, @no_kk, @tgl_lahir, @setatus, @pendidikan, @pekerjaan, @alamat)"
//    executeQuery(res, query, model, 1)
// })

// //Update
// app.put("/api/datadesa/:id", function(req, res)
// {
//    var model = [
//       { name: 'id', sqltype: sql.Int, value: req.body.id },
//       { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
//       { name: 'nik', sqltype: sql.VarChar, value: req.body.nik },
//       { name: 'no_kk', sqltype: sql.VarChar, value: req.body.no_kk },
//       { name: 'tgl_lahir', sqltype: sql.VarChar, value: req.body.tgl_lahir },
//       { name: 'setatus', sqltype: sql.VarChar, value: req.body.setatus },
//       { name: 'pendidikan', sqltype: sql.VarChar, value: req.body.pendidikan },
//       { name: 'pekerjaan', sqltype: sql.VarChar, value: req.body.pekerjaan },
//       { name: 'alamat', sqltype: sql.VarChar, value: req.body.alamat }
//    ]

//    var query = "update DataDesa set nama = @nama, nik = @nik, no_kk = @no_kk, tgl_lahir = @tgl_lahir, setatus = @setatus, pendidikan = @pendidikan, pekerjaan = @pekerjaan, alamat = @alamat where id = @id" 
//    executeQuery(res, query, model, 1)
// })

// //Delete
// app.delete("/api/datadesa/:id", function(req, res)
// {
//    var model = [
//       { name: 'id', sqltype: sql.Numeric, value: req.params.id }
//    ]

//    var query = "delete from DataDesa where id = @id"
//    executeQuery(res, query, model, 1)
// })

///////////////////////\\\\\\\\\\\\\\\\\\\\
///////////////////Abmas\\\\\\\\\\\\\\\\\\ 

//Select
app.get("/api/abmas/", function(req, res)
{
   var query = "select * from abmas"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/abmas", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.body.id_nmr },
      { name: 'nama_fak', sqltype: sql.VarChar, value: req.body.nama_fak },
      { name: 'nama_dept', sqltype: sql.VarChar, value: req.body.nama_dept },
      { name: 'penelitian_judul', sqltype: sql.VarChar, value: req.body.penelitian_judul },
      { name: 'peneliti_nama', sqltype: sql.VarChar, value: req.body.peneliti_nama },
      { name: 'skim_nama', sqltype: sql.VarChar, value: req.body.skim_nama },
      { name: 'is_dosen', sqltype: sql.VarChar, value: req.body.is_dosen },
      { name: 'tahun', sqltype: sql.VarChar, value: req.body.tahun },
      { name: 'anggota_luar_nama', sqltype: sql.VarChar, value: req.body.anggota_luar_nama },
      { name: 'mhs_nama', sqltype: sql.VarChar, value: req.body.mhs_nama },
      { name: 'anggota_sbg', sqltype: sql.VarChar, value: req.body.anggota_sbg },
      { name: 'bidang_pen_nama', sqltype: sql.VarChar, value: req.body.bidang_pen_nama },
      { name: 'program_id', sqltype: sql.Int, value: req.body.program_id },
      { name: 'nosk', sqltype: sql.VarChar, value: req.body.nosk },
      { name: 'nip_pegawai', sqltype: sql.VarChar, value: req.body.nip_pegawai }
   ]

   var query = "insert into abmas ( nama_fak, nama_dept, penelitian_judul, peneliti_nama, skim_nama, is_dosen, tahun, anggota_luar_nama, mhs_nama, anggota_sbg, bidang_pen_nama, program_id, nosk, nip_pegawai) values (@nama_fak, @nama_dept, @penelitian_judul, @peneliti_nama, @skim_nama, @is_dosen, @tahun, @anggota_luar_nama, @mhs_nama, @anggota_sbg, @bidang_pen_nama, @program_id, @nosk, @nip_pegawai)"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/abmas/:id_nmr", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.body.id_nmr },
      { name: 'nama_fak', sqltype: sql.VarChar, value: req.body.nama_fak },
      { name: 'nama_dept', sqltype: sql.VarChar, value: req.body.nama_dept },
      { name: 'penelitian_judul', sqltype: sql.VarChar, value: req.body.penelitian_judul },
      { name: 'peneliti_nama', sqltype: sql.VarChar, value: req.body.peneliti_nama },
      { name: 'skim_nama', sqltype: sql.VarChar, value: req.body.skim_nama },
      { name: 'is_dosen', sqltype: sql.VarChar, value: req.body.is_dosen },
      { name: 'tahun', sqltype: sql.VarChar, value: req.body.tahun },
      { name: 'anggota_luar_nama', sqltype: sql.VarChar, value: req.body.anggota_luar_nama },
      { name: 'mhs_nama', sqltype: sql.VarChar, value: req.body.mhs_nama },
      { name: 'anggota_sebagai', sqltype: sql.VarChar, value: req.body.anggota_sbg },
      { name: 'bidang_pen_nama', sqltype: sql.VarChar, value: req.body.bidang_pen_nama },
      { name: 'program_id', sqltype: sql.Int, value: req.body.program_id },
      { name: 'nosk', sqltype: sql.VarChar, value: req.body.nosk },
      { name: 'nip_pegawai', sqltype: sql.VarChar, value: req.body.nip_pegawai }
   ]

   var query = "update abmas set nama_fak = @nama_fak, nama_dept = @nama_dept, penelitian_judul = @penelitian_judul, peneliti_nama = @peneliti_nama, skim_nama = @skim_nama, is_dosen = @is_dosen, tahun = @tahun, anggota_luar_nama = @anggota_luar_nama, mhs_nama = @mhs_nama, anggota_sbg = @anggota_sbg, bidang_pen_nama = @bidang_pen_nama, program_id = @program_id, nosk = @nosk, nip_pegawai = @nip_pegawai where id_nmr = @id_nmr" 
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/abmas/:id_nmr", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.params.id_nmr }
   ]

   var query = "delete from abmas where id_nmr = @id_nmr"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\
///////////////////Dosen\\\\\\\\\\\\\\\\\\ 

//Select
app.get("/api/dosen/", function(req, res)
{
   var query = "select * from dosen"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/dosen", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.body.id_nmr },
      { name: 'fakultas', sqltype: sql.VarChar, value: req.body.fakultas },
      { name: 'departemen', sqltype: sql.VarChar, value: req.body.departemen },
      { name: 'status_aktif', sqltype: sql.VarChar, value: req.body.status_aktif },
      { name: 'nip_pegawai', sqltype: sql.VarChar, value: req.body.nip_pegawai },
      { name: 'nama_vpegawai', sqltype: sql.VarChar, value: req.body.nama_vpegawai },
      { name: 'nama_vakademik', sqltype: sql.VarChar, value: req.body.nama_vakademik },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'golongan', sqltype: sql.VarChar, value: req.body.golongan },
      { name: 'nama_pangkat', sqltype: sql.VarChar, value: req.body.nama_pangkat },
      { name: 'nama_fungsional', sqltype: sql.VarChar, value: req.body.nama_fungsional },
      { name: 'jenis_k', sqltype: sql.VarChar, value: req.body.jenis_k },
      { name: 'agama', sqltype: sql.VarChar, value: req.body.agama },
      { name: 'tgl_lahir', sqltype: sql.VarChar, value: req.body.tgl_lahir },
      { name: 'pendidikan_tertinggi', sqltype: sql.VarChar, value: req.body.pendidikan_tertinggi },
      { name: 'pendidikan_versi_kepegawaian', sqltype: sql.VarChar, value: req.body.pendidikan_versi_kepegawaian },
      { name: 'status_ni', sqltype: sql.VarChar, value: req.body.status_ni },
      { name: 'sinta_id', sqltype: sql.VarChar, value: req.body.sinta_id },
      { name: 'scopus_id', sqltype: sql.VarChar, value: req.body.scopus_id },
      { name: 'google_id', sqltype: sql.VarChar, value: req.body.google_id },
      { name: 'sinta_score', sqltype: sql.VarChar, value: req.body.sinta_score },
      { name: 'scopus_hindex', sqltype: sql.Int, value: req.body.scopus_hindex },
      { name: 'scopus_citations', sqltype: sql.Int, value: req.body.scopus_citations },
      { name: 'scopus_article', sqltype: sql.Int, value: req.body.scopus_article },
      { name: 'google_hindex', sqltype: sql.Int, value: req.body.google_hindex },
      { name: 'google_citations', sqltype: sql.Int, value: req.body.google_citations },
      { name: 'google_article', sqltype: sql.Int, value: req.body.google_article },
      { name: 'nidn', sqltype: sql.VarChar, value: req.body.nidn }
   ]

   var query = "insert into dosen ( fakultas, departemen, status_aktif, nip_pegawai, nama_vpegawai, nama_vakademik, nama, golongan, nama_pangkat, nama_fungsional, jenis_k, agama, tgl_lahir, pendidikan_tertinggi, pendidikan_versi_kepegawaian, status_ni, sinta_id, scopus_id, google_id, sinta_score, scopus_hindex, scopus_citations, scopus_article, google_hindex, google_citations, google_article, nidn)" 
               + "values (@fakultas, @departemen, @status_aktif, @nip_pegawai, @nama_vpegawai, @nama_vakademik, @nama, @golongan, @nama_pangkat, @nama_fungsional, @jenis_k, agama, @tgl_lahir, @pendidikan_tertinggi, @pendidikan_versi_kepegawaian, @status_ni, @sinta_id, @scopus_id, @google_id, @sinta_score, @scopus_hindex, @scopus_citations, @scopus_article, @google_hindex, @google_citations, @google_article, @nidn)"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/dosen/:id_nmr", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.body.id_nmr },
      { name: 'fakultas', sqltype: sql.VarChar, value: req.body.fakultas },
      { name: 'departemen', sqltype: sql.VarChar, value: req.body.departemen },
      { name: 'status_aktif', sqltype: sql.VarChar, value: req.body.status_aktif },
      { name: 'nip_pegawai', sqltype: sql.VarChar, value: req.body.nip_pegawai },
      { name: 'nama_vpegawai', sqltype: sql.VarChar, value: req.body.nama_vpegawai },
      { name: 'nama_vakademik', sqltype: sql.VarChar, value: req.body.nama_vakademik },
      { name: 'nama', sqltype: sql.VarChar, value: req.body.nama },
      { name: 'golongan', sqltype: sql.VarChar, value: req.body.golongan },
      { name: 'nama_pangkat', sqltype: sql.VarChar, value: req.body.nama_pangkat },
      { name: 'nama_fungsional', sqltype: sql.VarChar, value: req.body.nama_fungsional },
      { name: 'jenis_k', sqltype: sql.VarChar, value: req.body.jenis_k },
      { name: 'agama', sqltype: sql.VarChar, value: req.body.agama },
      { name: 'tgl_lahir', sqltype: sql.VarChar, value: req.body.tgl_lahir },
      { name: 'pendidikan_tertinggi', sqltype: sql.VarChar, value: req.body.pendidikan_tertinggi },
      { name: 'pendidikan_versi_kepegawaian', sqltype: sql.VarChar, value: req.body.pendidikan_versi_kepegawaian },
      { name: 'status_ni', sqltype: sql.VarChar, value: req.body.status_ni },
      { name: 'sinta_id', sqltype: sql.VarChar, value: req.body.sinta_id },
      { name: 'scopus_id', sqltype: sql.VarChar, value: req.body.scopus_id },
      { name: 'google_id', sqltype: sql.VarChar, value: req.body.google_id },
      { name: 'sinta_score', sqltype: sql.VarChar, value: req.body.sinta_score },
      { name: 'scopus_hindex', sqltype: sql.Int, value: req.body.scopus_hindex },
      { name: 'scopus_citations', sqltype: sql.Int, value: req.body.scopus_citations },
      { name: 'scopus_article', sqltype: sql.Int, value: req.body.scopus_article },
      { name: 'google_hindex', sqltype: sql.Int, value: req.body.google_hindex },
      { name: 'google_citations', sqltype: sql.Int, value: req.body.google_citations },
      { name: 'google_article', sqltype: sql.Int, value: req.body.google_article },
      { name: 'nidn', sqltype: sql.VarChar, value: req.body.nidn }
   ]

   var query = "update dosen set fakultas = @fakultas, departemen = @departemen, status_aktif = @status_aktif, nip_pegawai = @nip_pegawai, nama_vpegawai = @nama_vpegawai, nama_vakademik = @nama_vakademik," 
               + "nama = @nama, golongan = @golongan, nama_pangkat = @nama_pangkat, nama_fungsional = @nama_fungsional, jenis_k = @jenis_k, agama = @agama, tgl_lahir = @tgl_lahir, pendidikan_tertinggi = @pendidikan_tertinggi,"
               + "pendidikan_versi_kepegawaian = @pendidikan_versi_kepegawaian, status_ni = @status_ni, sinta_id = @sinta_id, scopus_id = @scopus_id, google_id = @google_id, sinta_score = @sinta_score, scopus_hindex @scopus_hindex,"
               + "scopus_citations = @scopus_citations, scopus_article = @scopus_article, google_hindex = @google_hindex, google_citations = @google_citations, google_article = @google_article, nidn = @nidn where id_nmr = @id_nmr" 
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/dosen/:id_nmr", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.params.id_nmr }
   ]

   var query = "delete from dosen where id_nmr = @id_nmr"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\
///////////////////Penelitian\\\\\\\\\\\\\\\\\\ 

//Select
app.get("/api/penelitian/", function(req, res)
{
   var query = "select * from penelitian"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/penelitian", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.body.id_nmr },
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'tahun', sqltype: sql.VarChar, value: req.body.tahun },
      { name: 'id_dept', sqltype: sql.Int, value: req.body.id_dept },
      { name: 'nama_dept', sqltype: sql.VarChar, value: req.body.nama_dept },
      { name: 'id_fak', sqltype: sql.Int, value: req.body.id_fak },
      { name: 'nama_fak', sqltype: sql.VarChar, value: req.body.nama_fak },
      { name: 'penelitian_id', sqltype: sql.Int, value: req.body.penelitian_id },
      { name: 'penelitian_judul', sqltype: sql.VarChar, value: req.body.penelitian_judul },
      { name: 'peneliti_id', sqltype: sql.Int, value: req.body.peneliti_id },
      { name: 'peneliti_nama', sqltype: sql.VarChar, value: req.body.peneliti_nama },
      { name: 'anggota_sbg', sqltype: sql.VarChar, value: req.body.anggota_sbg },
      { name: 'anggota_kon', sqltype: sql.VarChar, value: req.body.anggota_kon },
      { name: 'anggota_id', sqltype: sql.Int, value: req.body.anggota_id },
      { name: 'anggota_luar_nama', sqltype: sql.VarChar, value: req.body.anggota_luar_nama },
      { name: 'mhs_nama', sqltype: sql.VarChar, value: req.body.mhs_nama },
      { name: 'stapen_id', sqltype: sql.Int, value: req.body.stapen_id },
      { name: 'stapen_nama', sqltype: sql.VarChar, value: req.body.stapen_nama },
      { name: 'id_bidangpen', sqltype: sql.VarChar, value: req.body.id_bidangpen },
      { name: 'bidang_pen_nama', sqltype: sql.VarChar, value: req.body.bidang_pen_nama },
      { name: 'skim_nama', sqltype: sql.VarChar, value: req.body.skim_nama },
      { name: 'skim_id', sqltype: sql.Int, value: req.body.skim_id },
      { name: 'program_id', sqltype: sql.Int, value: req.body.program_id },
      { name: 'program_nama', sqltype: sql.VarChar, value: req.body.program_nama },
      { name: 'is_dosen', sqltype: sql.Int, value: req.body.is_dosen },
      { name: 'PENELITIAN_NOMOR_SK_SELESAI', sqltype: sql.VarChar, value: req.body.PENELITIAN_NOMOR_SK_SELESAI },
      { name: 'nip_pegawai', sqltype: sql.VarChar, value: req.body.nip_pegawai }
   ]

   var query = "insert into penelitian ( id, tahun, id_dept, nama_dept, id_fak, nama_fak, penelitian_id, penelitian_judul, peneliti_id,"
                + "peneliti_nama, anggota_sbg, anggota_kon, anggota_id, anggota_luar_nama, mhs_nama, stapen_id, stapen_nama, id_bidangpen,"
                + "bidang_pen_nama, skim_nama, program_id, program_nama, is_dosen, PENELITIAN_NOMOR_SK_SELESAI, nip_pegawai)" 
                + "values (@id, @tahun, @id_dept, @nama_dept, @id_fak, @nama_fak, @penelitian_id, @penelitian_judul, @peneliti_id,"
                + "@peneliti_nama, @anggota_sbg, @anggota_kon, @anggota_id, @anggota_luar_nama, @mhs_nama, @stapen_id, @stapen_nama, @id_bidangpen,"
                + "@bidang_pen_nama, @skim_nama, @program_id, @program_nama, @is_dosen, @PENELITIAN_NOMOR_SK_SELESAI, @nip_pegawai)"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/penelitian/:id_nmr", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.body.id_nmr },
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'tahun', sqltype: sql.VarChar, value: req.body.tahun },
      { name: 'id_dept', sqltype: sql.Int, value: req.body.id_dept },
      { name: 'nama_dept', sqltype: sql.VarChar, value: req.body.nama_dept },
      { name: 'id_fak', sqltype: sql.Int, value: req.body.id_fak },
      { name: 'nama_fak', sqltype: sql.VarChar, value: req.body.nama_fak },
      { name: 'penelitian_id', sqltype: sql.Int, value: req.body.penelitian_id },
      { name: 'penelitian_judul', sqltype: sql.VarChar, value: req.body.penelitian_judul },
      { name: 'peneliti_id', sqltype: sql.Int, value: req.body.peneliti_id },
      { name: 'peneliti_nama', sqltype: sql.VarChar, value: req.body.peneliti_nama },
      { name: 'anggota_sbg', sqltype: sql.VarChar, value: req.body.anggota_sbg },
      { name: 'anggota_kon', sqltype: sql.VarChar, value: req.body.anggota_kon },
      { name: 'anggota_id', sqltype: sql.Int, value: req.body.anggota_id },
      { name: 'anggota_luar_nama', sqltype: sql.VarChar, value: req.body.anggota_luar_nama },
      { name: 'mhs_nama', sqltype: sql.VarChar, value: req.body.mhs_nama },
      { name: 'stapen_id', sqltype: sql.Int, value: req.body.stapen_id },
      { name: 'stapen_nama', sqltype: sql.VarChar, value: req.body.stapen_nama },
      { name: 'id_bidangpen', sqltype: sql.VarChar, value: req.body.id_bidangpen },
      { name: 'bidang_pen_nama', sqltype: sql.VarChar, value: req.body.bidang_pen_nama },
      { name: 'skim_nama', sqltype: sql.VarChar, value: req.body.skim_nama },
      { name: 'skim_id', sqltype: sql.Int, value: req.body.skim_id },
      { name: 'program_id', sqltype: sql.Int, value: req.body.program_id },
      { name: 'program_nama', sqltype: sql.VarChar, value: req.body.program_nama },
      { name: 'is_dosen', sqltype: sql.Int, value: req.body.is_dosen },
      { name: 'PENELITIAN_NOMOR_SK_SELESAI', sqltype: sql.VarChar, value: req.body.PENELITIAN_NOMOR_SK_SELESAI },
      { name: 'nip_pegawai', sqltype: sql.VarChar, value: req.body.nip_pegawai }
   ]

   var query = "update penelitian set id = @id, tahun = @tahun, id_dept = @id_dept, nama_dept = @nama_dept, id_fak = @id_fak, nama_fak = @nama_fak, penelitian_id = @penelitian_id, penelitian_judul = @penelitian_judul, peneliti_id = @peneliti_id,"
                + "peneliti_nama = @peneliti_nama, anggota_sbg = @anggota_sbg, anggota_kon = @anggota_kon, anggota_id = @anggota_id, anggota_luar_nama = @anggota_luar_nama, mhs_nama = @mhs_nama, stapen_id = @stapen_id, stapen_nama = @stapen_nama, id_bidangpen = id_bidangpen,"
                + "bidang_pen_nama = @bidang_pen_nama, skim_nama = @skim_nama, program_id = @program_id, program_nama = @program_nama, is_dosen = @is_dosen, PENELITIAN_NOMOR_SK_SELESAI = @PENELITIAN_NOMOR_SK_SELESAI, nip_pegawai = @nip_pegawai where id_nmr = @id_nmr" 
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/penelitian/:id_nmr", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.params.id_nmr }
   ]

   var query = "delete from penelitian where id_nmr = @id_nmr"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\
///////////////////Publikasi\\\\\\\\\\\\\\\\\\ 

//Select
app.get("/api/publikasi/", function(req, res)
{
   var query = "select * from publikasi"
   executeQuery(res, query, null, 0)
})

//Insert
app.post("/api/publikasi", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.body.id_nmr },
      { name: 'fulname', sqltype: sql.VarChar, value: req.body.fulname },
      { name: 'nip_pegawai', sqltype: sql.VarChar, value: req.body.nip_pegawai },
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'nidn', sqltype: sql.VarChar, value: req.body.nidn },
      { name: 'pengarang', sqltype: sql.VarChar, value: req.body.pengarang },
      { name: 'tahun', sqltype: sql.VarChar, value: req.body.tahun },
      { name: 'judul', sqltype: sql.VarChar, value: req.body.judul },
      { name: 'region', sqltype: sql.VarChar, value: req.body.region },
      { name: 'halaman', sqltype: sql.VarChar, value: req.body.halaman },
      { name: 'volume', sqltype: sql.VarChar, value: req.body.volume },
      { name: 'doi', sqltype: sql.VarChar, value: req.body.doi },
      { name: 'issn', sqltype: sql.VarChar, value: req.body.issn },
      { name: 'abtraksi', sqltype: sql.VarChar, value: req.body.abtraksi },
      { name: 'kata_kunci', sqltype: sql.VarChar, value: req.body.kata_kunci },
      { name: 'id_fak', sqltype: sql.VarChar, value: req.body.id_fak },
      { name: 'id_jur', sqltype: sql.Int, value: req.body.id_jur },
      { name: 'url_unduh', sqltype: sql.VarChar, value: req.body.url_unduh },
      { name: 'url_scholar', sqltype: sql.VarChar, value: req.body.url_scholar },
      { name: 'anggota_ket', sqltype: sql.VarChar, value: req.body.anggota_ket },
      { name: 'keterangan', sqltype: sql.VarChar, value: req.body.keterangan },
      { name: 'is_scopus', sqltype: sql.Int, value: req.body.is_scopus },
      { name: 'is_gs', sqltype: sql.VarChar, value: req.body.is_gs },
      { name: 'jenis', sqltype: sql.VarChar, value: req.body.jenis }
   ]

   var query = "insert into publikasi ( fulname, nip_pegawai, id, nidn, pengarang, tahun, judul, region, halaman,"
                + "volume, doi, issn, abtraksi, kata_kunci, id_fak, id_jur, url_unduh, url_scholar, anggota_ket, keterangan, is_scopus, is_gs, jenis)" 
                + "values (@fulname, @nip_pegawai, @id, @nidn, @pengarang, @tahun, @judul, @region, @halaman,"
                + "@volume, @doi, @issn, @abtraksi, @kata_kunci, @id_fak, @id_jur, @url_unduh, @url_scholar, @anggota_ket, @keterangan, @is_scopus, @is_gs, @jenis)"
   executeQuery(res, query, model, 1)
})

//Update
app.put("/api/publikasi/:id_nmr", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.body.id_nmr },
      { name: 'fulname', sqltype: sql.VarChar, value: req.body.fulname },
      { name: 'nip_pegawai', sqltype: sql.VarChar, value: req.body.nip_pegawai },
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'nidn', sqltype: sql.VarChar, value: req.body.nidn },
      { name: 'pengarang', sqltype: sql.VarChar, value: req.body.pengarang },
      { name: 'tahun', sqltype: sql.VarChar, value: req.body.tahun },
      { name: 'judul', sqltype: sql.VarChar, value: req.body.judul },
      { name: 'region', sqltype: sql.VarChar, value: req.body.region },
      { name: 'halaman', sqltype: sql.VarChar, value: req.body.halaman },
      { name: 'volume', sqltype: sql.VarChar, value: req.body.volume },
      { name: 'doi', sqltype: sql.VarChar, value: req.body.doi },
      { name: 'issn', sqltype: sql.VarChar, value: req.body.issn },
      { name: 'abtraksi', sqltype: sql.VarChar, value: req.body.abtraksi },
      { name: 'kata_kunci', sqltype: sql.VarChar, value: req.body.kata_kunci },
      { name: 'id_fak', sqltype: sql.VarChar, value: req.body.id_fak },
      { name: 'id_jur', sqltype: sql.Int, value: req.body.id_jur },
      { name: 'url_unduh', sqltype: sql.VarChar, value: req.body.url_unduh },
      { name: 'url_scholar', sqltype: sql.VarChar, value: req.body.url_scholar },
      { name: 'anggota_ket', sqltype: sql.VarChar, value: req.body.anggota_ket },
      { name: 'keterangan', sqltype: sql.VarChar, value: req.body.keterangan },
      { name: 'is_scopus', sqltype: sql.Int, value: req.body.is_scopus },
      { name: 'is_gs', sqltype: sql.VarChar, value: req.body.is_gs },
      { name: 'jenis', sqltype: sql.VarChar, value: req.body.jenis }
   ]

   var query = "update publikasi set fulname = @fulname, nip_pegawai = @nip_pegawai, id = @id, nidn = @nidn, pengarang = @pengarang,"
               + "tahun = @tahun, judul = @judul, region = @region, halaman = @halaman, volume = @volume, doi = @doi, issn = @issn, abtraksi = @abtraksi, kata_kunci = @kata_kunci," 
               + "id_fak = @id_fak, id_jur = @id_jur, url_unduh = @url_unduh, url_scholar = @url_scholar, anggota_ket = @anggota_ket, keterangan = @keterangan, is_scopus = @is_scopus,"
               + "is_gs = @is_gs, jenis = @jenis where id_nmr = @id_nmr" 
   executeQuery(res, query, model, 1)
})

//Delete
app.delete("/api/publikasi/:id_nmr", function(req, res)
{
   var model = [
      { name: 'id_nmr', sqltype: sql.Int, value: req.params.id_nmr }
   ]

   var query = "delete from publikasi where id_nmr = @id_nmr"
   executeQuery(res, query, model, 1)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////Konkin Departemen Fakultas\\\\\\\\\\\\\\\\\\\\

const List = {
    "Aktuaria": "Departemen Aktuaria",
    "Arsitektur": "Departemen Arsitektur",
    "Biologi": "Departemen Biologi",
    "DesainInterior": "Departemen Desain Interior",
    "DesainKomunikasiVisual": "Departemen Desain Komunikasi Visual",
    "DesainProduk": "Departemen Desain Produk",
    "Fisika": "Departemen Fisika",
    "Kimia": "Departemen Kimia",
    "ManajemenBisnis": "Departemen Manajemen Bisnis",
    "ManajemenTeknologi": "Departemen Manajemen Teknologi",
    "Matematika": "Departemen Matematika",
    "PerencanaanWilayahKota": "Departemen Perencanaan Wilayah Kota",
    "SistemInformasi": "Departemen Sistem Informasi",
    "StatistikaBisnis": "Departemen Statistika Bisnis",
    "Statistika": "Departemen Statistika",
    "StudiPembangunan": "Departemen Studi Pembangunan",
    "TeknikBiomedik": "Departemen Teknik Biomedik",
    "TeknikElektroOtomasi": "Departemen Teknik Elektro Otomasi",
    "TeknikElektro": "Departemen Teknik Elektro",
    "TeknikFisika": "Departemen Teknik Fisika",
    "TeknikGeofisika": "Departemen Teknik Geofisika",
    "TeknikGeomatika": "Departemen Teknik Geomatika",
    "TeknikInformatika": "Departemen Teknik Informatika",
    "TeknikInfrastrukturSipil": "Departemen Teknik Infrastruktur Sipil",
    "TeknikInstrumentasi": "Departemen Teknik Instrumentasi",
    "TeknikKelautan": "Departemen Teknik Kelautan",
    "TeknikKimiaIndustri": "Departemen Teknik Kimia Industri",
    "TeknikKimia": "Departemen Teknik Kimia",
    "TeknikKomputer": "Departemen Teknik Komputer",
    "TeknikLingkungan": "Departemen Teknik Lingkungan",
    "TeknikMaterialMetalurgi": "Departemen Teknik Material dan Metalurgi",
    "TeknikMesinIndustri": "Departemen Teknik Mesin Industri",
    "TeknikMesin": "Departemen Teknik Mesin",
    "TeknikPerkapalan": "Departemen Teknik Perkapalan",
    "TeknikSipil": "Departemen Teknik Sipil",
    "TeknikSistemIndustri": "Departemen Teknik Sistem dan Industri",
    "TeknikSistemPerkapalan": "Departemen Teknik Sistem Perkapalan",
    "TeknikTransportasiLaut": "Departemen Teknik Transportasi Laut",
    "TeknologiInformasi": "Departemen Teknologi Informasi",
    "Civplan": "Fakultas Teknik Sipil, Perencanaan, dan Kebumian",
    "Creabiz": "Fakultas Desain Kreatif dan Bisnis Digital",
    "Electics": "Fakultas Teknologi Elektro dan Informatika Cerdas",
    "Indsys": "Fakultas Teknologi Industri dan Rekayasa Sistem",
    "Martech": "Fakultas Teknologi Kelautan",
    "Scientics": "Fakultas Sains dan Analitika Data",
    "Vocation": "Fakultas Vokasi"
}

//Select
app.get("/api/konkin/:satker", function(req, res)
{
    const satkerku = List[req.params.satker];

    if(typeof satkerku == 'undefined'){
        return res.status(404)        // HTTP status 404: NotFound
            .send('Not found');
    }

    var query = `SELECT [IndikatorSatuanKerja].[id], 
                [IndikatorSatuanKerja].[bobot], 
                [IndikatorSatuanKerja].[target], 
                [IndikatorSatuanKerja].[capaian],
                [MasterIndikators].[nama] AS [indikatorKinerja],  
                [Aspeks].[aspek] AS [aspek], 
                [Aspeks].[komponen_aspek] AS [komponenAspek], 
                [SatuanKerjas].[nama] AS [SatuanKerjas] 

                FROM [Indikator_SatuanKerja] AS [IndikatorSatuanKerja] 
                LEFT OUTER JOIN [MasterIndikator] AS [MasterIndikators] ON [IndikatorSatuanKerja].[id_indikator_periode] = [MasterIndikators].[id] 
                LEFT OUTER JOIN [Aspek] AS [Aspeks] ON [MasterIndikators].[id_aspek] = [Aspeks].[id] 
                INNER JOIN [SatuanKerja] AS [SatuanKerjas] ON  [IndikatorSatuanKerja].[id_satker] LIKE  SUBSTRING([SatuanKerjas].[id_satker], 2, 36 )  AND [SatuanKerjas].[nama] = N'${satkerku}';`
    executeQuery(res, query, null, 0)
})

///////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
///////////////log indikator satker\\\\\\\\\\\\\\

//Select
app.get("/api/log-indikator-satker", function(req, res){
   var query = "select * from Indikator_SatuanKerja_Log"
   executeQuery(res, query, null, 0)
})

app.listen(8026, function () {
   console.log('Listen on port 8026')
})
