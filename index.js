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
  const sym = syms.length ? syms[0] : router._sym
  assert.ok(sym, 'router should be an instance of wayfarer')

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
      const dft = { node: { cb: [ router._default ] } }
      return router(route, ssa, dft)
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
    methods = methods || {}

    // mount subrouter
    if (methods[sym]) return router.on(route, methods)

    assert.equal(typeof methods, 'object')

    // mount http methods
    router.on(route, function (args) {
      demuxSsa(args, function (req, res, params) {
        const meth = methodist(req, defaultFn, methods)
        meth(req, res, params)

        // default function to call if methods don't match
        // null -> null
        function defaultFn () {
          router._default(args)
        }
      })
    })
    return emit
  }
}

// mux server params into an object
// (req, res) -> obj
function createSsa (base, req, res) {
  assert.equal(typeof base, 'object')
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
  assert.equal(typeof params, 'object')
  assert.equal(typeof params._ssa, 'object')
  assert.equal(typeof cb, 'function')
  const req = params._ssa.req
  const res = params._ssa.res
  const nw = xtend(params)
  delete nw._ssa
  cb(req, res, nw)
}
