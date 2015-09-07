const series = require('run-series')
const wayfarer = require('wayfarer')
const match = require('hash-match')
const http = require('http')
const nets = require('nets')

const toServer = require('../')

const router = toServer(wayfarer())
const port = 2048

const alphabet = []
var n = 0
for (; n < 26; n++) {
  var code = 'a'.charCodeAt(0) + n
  var str = String.fromCharCode(code)
  alphabet.push(str)
}

alphabet.forEach(function (letter) {
  router.on('/' + letter, {
    get: function (req, res, params) {
      res.statusCode = 200
      res.end()
    }
  })
})

const server = http.createServer(function (req, res) {
  router(match(req.url), req, res)
})
server.listen(port)

const fns = alphabet.map(function (letter) {
  return function (next) {
    nets('http://localhost:' + port + '/' + letter, function (err, res) {
      if (err) throw err
      next()
    })
  }
})

series(fns, function () {
  console.log('done')
  server.close()
})
