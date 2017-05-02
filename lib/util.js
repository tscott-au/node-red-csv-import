'use strict'
// utility module for externalising common code

module.exports = {
  filterArrayRegEx,
  filterArray,
  regExComparer,
  isRegEx,
  toRegEx
}

function filterArrayRegEx (source, filters, sorter, transformer) {
  return filterArray(source, filters, regExComparer, sorter, transformer)
}

/**
 * Filter elements in an array against an array of set of regex filters
 * returns an object, where each matched entry is recorded with the filter index
 * Note: assumes that file names are case insensitive.
 * @param  {Array} found list of file names, typically with full paths names.
 * @param  {Array} expected list of supported file names.
 * @return {Object} {[matched:{value, filterIdx}], [unmatched]}
 */
function filterArray (source, filters, comparer, sorter, transformer) {
  if (!Array.isArray(source) || source === undefined) { throw new TypeError('Parameter: "source" was not an Array') }
  if (!Array.isArray(filters) || filters === undefined) { throw new TypeError('Parameter: "filters" was not an Array') }
  var _callback = (typeof comparer === 'function') ? comparer : function (value, filter) { return value === filter }

  var result = source.reduce((acc, value) => {
    var idx = filters.findIndex(filter => _callback(value, filter))
    if (idx === -1) { acc.unmatched.push(value) } else {
      acc.matched.push({'value': value, 'filterIdx': idx})
    }
    return acc
  }, {matched: [], unmatched: []})

  var _sorter = (typeof sorter === 'function') ? sorter : sortFilterResult
  var _transformer = (typeof transformer === 'function') ? transformer : transformFilterResult

  result.matched.sort(_sorter)
  var buf = result.matched.map(_transformer)
  result.matched = buf
  return result
}

function regExComparer (value, regExfilter) {
  return regExfilter.test(value)
}

function sortFilterResult (a, b) {
  return a.filterIdx - b.filterIdx
}

function transformFilterResult (ele) {
  return ele.value
}

const regExTester = new RegExp('^/(.*?)/([gimy]*)$')

function isRegEx (value) {
  return regExTester.test(value)
}

function toRegEx (value) {
  if (isRegEx(value)) {
    var regCheckResult = regExTester.exec(value)
    return new RegExp(regCheckResult[1], regCheckResult[2])
  }
  return new RegExp(value)
}
