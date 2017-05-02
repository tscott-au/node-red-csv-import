'use strict'
// project specific code

const path = require('path')

const projUtil = require('./util')

const expectedSourceFiles = [
  /.*policy.csv/i,
  /.*risk.csv/i
]

function routeFiles2BigCSV (topic, sourceFiles, expectedFiles) {
  // we pass in the case insensitive comparer
  var filtered = projUtil.filterArrayRegEx(sourceFiles, expectedFiles)

  // finish msg transform, no point passing anything else to big lib as it gets thrown away.
  var routedMsgs = filtered.matched.map(ele => {
    var x = {'topic': (topic + ':' + path.parse(ele).base),
      'filename': ele}
    return x
  })

  // weap array to make just 1 msg
  var msgUnexpected = {topic: topic, payload: filtered.unmatched}

  return [routedMsgs, msgUnexpected]
}

module.exports = {
  routeFiles2BigCSV,
  expectedSourceFiles
}
