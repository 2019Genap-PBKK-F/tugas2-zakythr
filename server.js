const express = require('express')
const app = express()
const port = 8026

app.get('/', (req, res) => res.send('Hello Zaky!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))