const express = require('express')
const app = express('10.199.14.46')
const port = 8026

app.get('/', (req, res) => res.send('Hello Zaky!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))