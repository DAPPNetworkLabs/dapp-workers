const express = require('express')

// creating a instance of express
const app = express();

app.listen(3000, console.log('App Running On Port 3000!'))

app.get('/health', (req, res) => {
    res.send('alive')
})
