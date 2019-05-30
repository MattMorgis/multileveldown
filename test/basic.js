var tape = require('tape')
var levelup = require('levelup')
var memdown = require('memdown')
var concat = require('concat-stream')
var multileveldown = require('../')

tape('get', function (t) {
  var db = levelup(memdown())
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  db.put('hello', 'world', function () {
    client.get('hello', {asBuffer: false}, function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
      t.end()
    })
  })
})

tape('put', function (t) {
  var db = levelup(memdown())
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('hello', 'world', function (err) {
    t.error(err, 'no err')
    client.get('hello', {asBuffer: false}, function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
      t.end()
    })
  })
})

tape('readonly', function (t) {
  var db = levelup(memdown())

  db.put('hello', 'verden')

  var stream = multileveldown.server(db, {readonly: true})
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('hello', 'world', function (err) {
    t.ok(err, 'put failed')
    client.get('hello', {asBuffer: false}, function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'verden', 'old value')
      t.end()
    })
  })
})

tape('del', function (t) {
  var db = levelup(memdown())
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('hello', 'world', function (err) {
    t.error(err, 'no err')
    client.del('hello', function (err) {
      t.error(err, 'no err')
      client.get('hello', {asBuffer: false}, function (err) {
        t.ok(err, 'had error')
        t.ok(err.notFound, 'not found err')
        t.end()
      })
    })
  })
})

tape('batch', function (t) {
  var db = levelup(memdown())
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{type: 'put', key: 'hello', value: 'world'}, {type: 'put', key: 'hej', value: 'verden'}], function (err) {
    t.error(err, 'no err')
    client.get('hello', {asBuffer: false}, function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
      client.get('hej', {asBuffer: false}, function (err, value) {
        t.error(err, 'no err')
        t.same(value, 'verden')
        t.end()
      })
    })
  })
})

tape('read stream', function (t) {
  var db = levelup(memdown())
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{type: 'put', key: 'hello', value: 'world'}, {type: 'put', key: 'hej', value: 'verden'}], function (err) {
    t.error(err, 'no err')
    var rs = client.createReadStream({valueEncoding: 'utf-8', keyEncoding: 'utf-8'})
    rs.pipe(concat(function (datas) {
      t.same(datas.length, 2)
      t.same(datas[0], {key: 'hej', value: 'verden'})
      t.same(datas[1], {key: 'hello', value: 'world'})
      t.end()
    }))
  })
})

tape('read stream (gt)', function (t) {
  var db = levelup(memdown())
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{type: 'put', key: 'hello', value: 'world'}, {type: 'put', key: 'hej', value: 'verden'}], function (err) {
    t.error(err, 'no err')
    var rs = client.createReadStream({gt: 'hej', valueEncoding: 'utf-8', keyEncoding: 'utf-8'})
    rs.pipe(concat(function (datas) {
      t.same(datas.length, 1)
      t.same(datas[0], {key: 'hello', value: 'world'})
      t.end()
    }))
  })
})
