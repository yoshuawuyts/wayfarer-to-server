const getOwnSymbols = require('get-own-property-symbols')
const isReq = require('is-incoming-message')
const isRes = require('is-server-response')
const methodist = require('methodist')
const assert = require('assert')
const xtend = require('xtend')

module.exports = toServer

// wrap req, res, wayfarer to create new server
// obj -> obj
function toServer (router) {
  assert.equal(typeof router, 'function')

  const syms = getOwnSymbols(router)
  assert.equal(syms.length, 1, 'router should be an instance of wayfarer')
  const sym = syms[0]

  emit[sym] = true
  emit.emit = emit
  emit.on = on

  return emit

  // match a route and execute the corresponding callback
  // (obj, obj) -> null
  // original: {path, params parentDefault}
  function emit (route, req, res) {
    assert.equal(typeof route, 'string')
    assert.ok(req, 'no req specified')

    if (!req._ssa) {
      assert.ok(res, 'no res specified')
    }

    // handle server init
    if (isReq(req) && isRes(res)) {
      const ssa = createSsa({}, req, res)
      return router(route, ssa, router.default)
    }

    // handle subrouter
    const params = req
    const parentDefault = res
    router(route, params, parentDefault)
  }

  // register a new route on a method
  // (str, obj) -> obj
  function on (route, methods) {
    assert.equal(typeof route, 'string')

    // mount subrouter
    if (methods[sym]) return router.on(route, methods)

    assert.equal(typeof methods, 'object')

    // mount http methods
    router.on(route, function (params) {
      demuxSsa(params, function (req, res, params) {
        const meth = methodist(req, router, methods)
        meth(req, res, params)
      })
    })
    return emit
  }
}

// mux server params into an object
// (req, res) -> obj
function createSsa (base, req, res) {
  const ret = xtend(base, {
    _ssa: {
      req: req,
      res: res
    }
  })
  return ret
}

// demux an object into server params
// and pass them into a function
// (obj, fn) -> null
function demuxSsa (params, cb) {
  const req = params._ssa.req
  const res = params._ssa.res
  cb(req, res, params)
}
