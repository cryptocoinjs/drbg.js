'use strict'
var createCipher = require('browserify-aes').createCipher
var cipherInfo = require('./lib/cipher-info.json')
var util = require('./lib/util')

var ebuf = new Buffer(0)
var b0x00 = new Buffer([ 0x00 ])
var b0x01 = new Buffer([ 0x01 ])

function CtrDRBG (algo, entropy, nonce, pers) {
  var info = cipherInfo[algo]
  if (info === undefined) throw new Error('cipher ' + algo + ' is not supported')

  this._algo = algo
  this._securityStrength = info.securityStrength / 8
  this._outlen = info.outlen / 8
  this._keylen = info.keylen / 8
  this._seedlen = this._outlen + this._keylen
  this._reseedInterval = 0x1000000000000 // 2**48

  this._init(entropy, nonce, pers)
}

CtrDRBG.prototype._blockEnctrypt = function (key, data) {
  var cipher = createCipher(this._algo, key)
  var r = Buffer.concat([ cipher.update(data), cipher.final() ])
  return r.slice(0, this._outlen)
}

CtrDRBG.prototype._bcc = function (key, data) {
  var chainingValue = new Buffer(util.b512zero.slice(0, this._outlen))
  for (var i = 0, n = Math.ceil(data.length / this._outlen); i < n; ++i) {
    var inputBlock = util.bxor(chainingValue, data.slice(i * this._outlen, (i + 1) * this._outlen))
    chainingValue = this._blockEnctrypt(key, inputBlock)
  }
  return chainingValue
}

CtrDRBG.prototype._cipherdf = function (input, len) {
  var S = Buffer.concat([ new Buffer(8), input, new Buffer([ 0x80 ]) ])
  S.writeUInt32BE(input.length, 0)
  S.writeUInt32BE(len, 4)
  while (S.length % this._outlen !== 0) {
    S = Buffer.concat([ S, b0x00 ])
  }

  var temp = new Buffer(0)
  var K = new Buffer(util.bKsource.slice(0, this._keylen))
  var IV = new Buffer(util.b512zero.slice(0, this._outlen))
  for (var i = 0; temp.length < this._seedlen; ++i) {
    IV.writeUInt32BE(i, 0)
    temp = Buffer.concat([ temp, this._bcc(K, Buffer.concat([ IV, S ])) ])
  }

  K = temp.slice(0, this._keylen)
  var X = temp.slice(this._keylen, this._seedlen)
  temp = new Buffer(0)
  while (temp.length < len) {
    X = this._blockEnctrypt(K, X)
    temp = Buffer.concat([ temp, X ])
  }

  return temp.slice(0, len)
}

CtrDRBG.prototype._update = function (data) {
  var temp = new Buffer(0)
  while (temp.length < this._seedlen) {
    this._V = util.bsum([ this._V, b0x01 ])
    temp = Buffer.concat([ temp, this._blockEnctrypt(this._K, this._V) ])
  }
  temp = util.bxor(temp.slice(0, this._seedlen), data)
  this._K = temp.slice(0, this._keylen)
  this._V = temp.slice(-this._outlen)
}

CtrDRBG.prototype._init = function (entropy, nonce, pers) {
  if (entropy.length < this._securityStrength) throw new Error('Not enough entropy')

  var seedMaterial = Buffer.concat([ entropy, nonce, pers || ebuf ])
  // if (seedMaterial.length !== this._seedlen) throw new Error('Bad seed length')

  seedMaterial = this._cipherdf(seedMaterial, this._seedlen)
  this._K = new Buffer(util.b512zero.slice(0, this._keylen))
  this._V = new Buffer(util.b512zero.slice(0, this._outlen))
  this._update(seedMaterial)
  this._reseed = 1
}

CtrDRBG.prototype.reseed = function (entropy, add) {
  if (entropy.length < this._securityStrength) throw new Error('Not enough entropy')

  var seedMaterial = Buffer.concat([ entropy, add || ebuf ])
  // if (seedMaterial.length !== this._seedlen) throw new Error('Bad seed length')

  seedMaterial = this._cipherdf(seedMaterial, this._seedlen)
  this._update(seedMaterial)
  this._reseed = 1
}

CtrDRBG.prototype.generate = function (len, add) {
  if (this._reseed > this._reseedInterval) throw new Error('Reseed is required')

  if (add && add.length !== 0) {
    add = this._cipherdf(add, this._seedlen)
    this._update(add)
  } else {
    add = new Buffer(util.b512zero.slice(0, this._seedlen))
  }

  var temp = new Buffer(0)
  while (temp.length < len) {
    this._V = util.bsum([ this._V, b0x01 ])
    temp = Buffer.concat([ temp, this._blockEnctrypt(this._K, this._V) ])
  }

  this._update(add)
  this._reseed += 1
  return temp.slice(0, len)
}

module.exports = CtrDRBG
