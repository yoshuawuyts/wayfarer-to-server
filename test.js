const wayfarer = require('wayfarer')
const noop = require('noop2')
const http = require('http')
const urit = require('urit')
const nets = require('nets')
const test = require('tape')

const toServer = require('./')

test('wayfarer() should assert params & detect if wayfarer was passed', function (t) {
  t.plan(3)
  t.throws(toServer, /function/)
  t.throws(toServer.bind(null, noop), /wayfarer/)
  t.equal(typeof toServer(wayfarer()), 'function')
})

test('.emit() assert params', function (t) {
  t.plan(3)
  const router = toServer(wayfarer())
  router.on('foo', {
    all: function () {
      t.pass('called')
    }
  })

  t.throws(router.bind(null), /string/)
  t.throws(router.bind(null, 'foo'), /req/)
  t.throws(router.bind(null, 'foo', http.ClientRequest), /res/)
})

test('.emit() should match a path', function (t) {
  t.plan(1)
  const server = http.createServer(function (req, res) {
    const router = toServer(wayfarer())
    router.on('foo', {
      all: function () {
        t.pass('called')
        server.close()
        res.end()
      }
    })
    router('foo', req, res)
  })

  server.listen()

  const uri = urit('http://localhost:{port}/{path}')
  nets(uri({ port: server.address().port, path: 'foo' }))
})

test('.on() should verify its input types', function (t) {
  t.plan(1)

  const r1 = toServer(wayfarer())
  t.throws(r1.on.bind(null, 'foo', 'notAnObject'), /object/)
})

test('.on() should allow nesting', function (t) {
  t.plan(1)

  const server = http.createServer(function (req, res) {
    const r1 = toServer(wayfarer())
    const r2 = toServer(wayfarer())

    r1.on('foo', r2)
    r2.on('bar', {
      all: function () {
        t.pass('called')
        server.close()
        res.end()
      }
    })

    r1(req.url, req, res)
  })

  server.listen()

  const port = server.address().port
  nets('http://localhost:' + port + '/foo/bar')
})

test('.on() should allow deep nesting', function (t) {
  t.plan(1)

  const server = http.createServer(function (req, res) {
    const r1 = toServer(wayfarer())
    const r2 = toServer(wayfarer())
    const r3 = toServer(wayfarer())

    r1.on('foo', r2)
    r2.on('bin', r3)
    r3.on('bar', {
      all: function () {
        t.pass('called')
        server.close()
        res.end()
      }
    })

    r1(req.url, req, res)
  })

  server.listen()

  const port = server.address().port
  nets('http://localhost:' + port + '/foo/bin/bar')
})

test('.on() should delegate default path up the router stack', function (t) {

})
