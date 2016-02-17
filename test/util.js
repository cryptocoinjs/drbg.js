'use strict'
var tap = require('tap')
var util = require('../lib/util')

tap.test('util', function (t) {
  t.test('bsum', function (t) {
    t.test('[ 0xffff, 0xffff ]', function (t) {
      var result = util.bsum([ new Buffer([ 0xff, 0xff ]), new Buffer([ 0xff, 0xff ]) ])
      t.equal(result.toString('hex'), 'fffe')
      t.end()
    })

    t.test('[ 0xffff, 0x01 ]', function (t) {
      var result = util.bsum([ new Buffer([ 0xff, 0xff ]), new Buffer([ 0x01 ]) ])
      t.equal(result.toString('hex'), '0000')
      t.end()
    })

    t.test('[ 0x00ff, 0xff ]', function (t) {
      var result = util.bsum([ new Buffer([ 0x00, 0xff ]), new Buffer([ 0xff ]) ])
      t.equal(result.toString('hex'), '01fe')
      t.end()
    })

    t.end()
  })

  t.end()
})
