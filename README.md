# wayfarer-to-server
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![Downloads][downloads-image]][downloads-url]
[![js-standard-style][standard-image]][standard-url]

__31/01/2016:__ since
[wayfarer@6.0.0](https://github.com/yoshuawuyts/wayfarer/commit/50d4978cbc29ac6a25edae6c85659d17b0ec736b)
this project is no longer compatible with `wayfarer` and has been deprecated.
An alternative server implementation should be linked on the `wayfarer` page.

Wrap [`wayfarer`](https://github.com/yoshuawuyts/wayfarer) to provide HTTP
method matching and `req`, `res` delegation.

## Installation
```bash
$ npm install wayfarer-to-server
```

## Usage
```js
import toServer from 'wayfarer-to-server'
import match from 'pathname-match'
import wayfarer from 'wayfarer'
import http from 'http'

const server = http.createServer((req, res) => {
  const router = toServer(wayfarer())

  router.on('/hello', {
    get: (req, res, params) => console.log('get'),
    all: (req, res, params) => console.log('any route matches')
  })

  router(match(req.url), req, res)
})

server.listen(1337)
```

## API
### router = toServer(wayfarer())
Wrap an instance of [`wayfarer`](https://github.com/yoshuawuyts/wayfarer) to
match HTTP methods and delegate `req, res`.

### router.on(route, methods)
Register a new route on a method.
- __route__: the route name that is matched. See
  [`routington.define()`](https://github.com/pillarjs/routington#nodes-node--routerdefineroute)
  for all options.
- __methods__: a nested router or an object containing methods. Method keys
  must be HTTP verbs, `any` or `all`.  See
  [`methodist`](https://github.com/yoshuawuyts/methodist) for the full
  documentation. Methods are lowercased before matched.

### router(route, req, res)
Match a route and execute the corresponding callback. Alias: `router.emit()`.

## FAQ
### why did you build this?
Server routers are inherently more complex than client routers because of the
necessity to handle HTTP methods. `wayfarer-to-server` extends the
[`wayfarer`](https://github.com/yoshuawuyts/wayfarer) router to match HTTP
methods and delegate `req, res` objects while maintaining its composable nature
and fast [`radix trie`](https://en.wikipedia.org/wiki/Radix_tree) core.

### why not use existing server routers?
Most routers have strong opinions on how applications should be structured.
These opinions are expressed in features such as: middleware helpers, error
handlers, control flow constructs or even mutating the `err, req` objects. Some
of these features might be desireable to have in an application, but shouldn't
be included in a router.

## See Also
- [wayfarer](https://github.com/yoshuawuyts/wayfarer)
- [methodist](https://github.com/yoshuawuyts/methodist)

## License
[MIT](https://tldrlegal.com/license/mit-license)

[npm-image]: https://img.shields.io/npm/v/wayfarer-to-server.svg?style=flat-square
[npm-url]: https://npmjs.org/package/wayfarer-to-server
[travis-image]: https://img.shields.io/travis/yoshuawuyts/wayfarer-to-server/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/yoshuawuyts/wayfarer-to-server
[codecov-image]: https://img.shields.io/codecov/c/github/yoshuawuyts/wayfarer-to-server/master.svg?style=flat-square
[codecov-url]: https://codecov.io/github/yoshuawuyts/wayfarer-to-server
[downloads-image]: http://img.shields.io/npm/dm/wayfarer-to-server.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/wayfarer-to-server
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
