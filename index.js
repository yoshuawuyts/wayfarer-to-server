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
    assert.ok(req._ssa || res, 'no res specified')

    // called from server
    if (isReq(req) && isRes(res)) {
      const ssa = { _ssa: { req: req, res: res } }
      const dft = { node: { cb: [ router._default ] } }
      return router(route, ssa, dft)
    }

    // called as a subroute
    const params = req
    const parentDefault = res
    router.emit(route, params, parentDefault)
  }

  // register a new route on a method
  // (str, obj) -> obj
  function on (route, methods) {
    assert.equal(typeof route, 'string')
    methods = methods || {}

    // mount subrouter
    if (methods[sym]) {
      const subrouter = methods
      return router.on(route, subrouter)
    }

    assert.equal(typeof methods, 'object')

    // mount http methods
    router.on(route, function (args, dft) {
      if (dft && dft.node) dft = dft.node.cb[0]
      if (dft) dft.bind(null, args)

      const req = args._ssa.req
      const res = args._ssa.res
      const nw = xtend(args)
      delete nw._ssa

      const meth = methodist(req, dft, methods)
      meth(req, res, nw)
    })
    return emit
  }
}
