const isReq = require('is-incoming-message')
const isRes = require('is-server-response')
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
  router.on('foo', {})

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

test('.on() should pass `req, res, params` to children', function (t) {
  t.plan(4)
  const server = http.createServer(function (req, res) {
    const r1 = toServer(wayfarer())
    r1.on(':foo', { all: allFn })
    r1(req.url, req, res)
  })

  server.listen()
  const port = server.address().port
  nets('http://localhost:' + port + '/bar')

  function allFn (req, res, params) {
    t.ok(isReq(req), 'req type')
    t.ok(isRes(res), 'res type')
    t.equal(typeof params, 'object')
    t.equal(params.foo, 'bar')
    res.end()
    server.close()
  }
})

test('.on() should delegate default path up the router stack', function (t) {
  t.plan(4)

  var n = 0
  const server = http.createServer(function (req, res) {
    const r1 = toServer(wayfarer('/404'))
    const r2 = toServer(wayfarer())
    const r3 = toServer(wayfarer())

    r1.on('/404', { all: pass })
    r1.on('foo', r2)
    r2.on('bin', r3)

    r1(req.url, req, res)
  })

  server.listen()

  const port = server.address().port
  nets('http://localhost:' + port + '/')
  nets('http://localhost:' + port + '/foo')
  nets('http://localhost:' + port + '/foo/bin')
  nets('http://localhost:' + port + '/foo/bin/bar')

  function pass (req, res, params) {
    t.pass('called')
    res.end()
    if (++n === 4) server.close()
  }
})

// regression test
test(".on() should delegate to default path if method doesn't match", function (t) {
  t.plan(1)

  const server = http.createServer(function (req, res) {
    const r = toServer(wayfarer('/404'))
    r.on('/404', { all: pass })
    r.on('/', { post: noop })
    r(req.url, req, res)
  })

  server.listen()

  const port = server.address().port
  nets('http://localhost:' + port + '/')

  function pass (req, res, params) {
    t.pass('called')
    res.end()
    server.close()
  }
})
