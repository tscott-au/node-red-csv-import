'use strict'
// project specific model code

function up (value) {
  return (value === undefined) ? Date.now() : value
}

function getKeyString (entity, data) {
  var key = getKey(entity, data)
  return key.join(':')
}

function getKey (entity, data) {
  var keyNames = model.keys[entity]
  if (keyNames === undefined) { throw new Error('Unknown entity name: ' + entity) }

  return _getKey(keyNames, data)
}

function _getKey (keyNames, data, key) {
  if (key === undefined) { key = [] }
  keyNames.forEach(ele => key.push(data[ele]))
  return key
}

const model = {
  keys: {
    policy: ['COMPANY', 'PRODUCT', 'POLICY']
  }
}

function getMetaModel () {
  return {
    key: '',
    type: ''
  }
}

function getPolicyModel () {
  return {
    policy: {
      key: '',
      type: '',
      risks: [],
      addresses: []
    }
  }
}

module.exports = {
  up,
  getKeyString,
  model,
  getMetaModel,
  getPolicyModel

}
