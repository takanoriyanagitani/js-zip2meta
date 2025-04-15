/**
 * @template T
 * @typedef {function(): Promise<T>} IO
 */

/**
 * Returns a new io value using the io value and the mapper.
 * @template T
 * @template U
 * @param {IO<T>} io The io value.
 * @param {(t: T) => IO<U>} mapper The function which maps the t.
 * @returns {IO<U>}
 */
export function bind(io, mapper) {
  return () => {
    return io()
      .then((t) => mapper(t)())
  }
}

/**
 * Creates an IO value from the pure function.
 * @template T
 * @template U
 * @param {(t: T) => Promise<U>} pure The original pure function.
 * @returns {(t: T) => IO<U>} The converted function.
 */
export function lift(pure) {
  return (t) => {
    return () => {
      return pure(t)
    }
  }
}

/**
 * Returns an IO value from the specified value.
 * @template T
 * @param {T} t The value to be wrapped.
 * @returns {IO<T>} The wrapped value.
 */
export function of(t) {
  return () => Promise.resolve(t)
}

/**
 * The method used for the zip item.
 * @readonly
 * @enum {number}
 */
export const ZipMethod = Object.freeze({
  UNSPECIFIED: 0,
  STORE: 1,
  DEFLATE: 2,
})

/**
 * URL.
 * @typedef {string} URL
 */

/**
 * Fetch like api.
 * @typedef {function(URL): IO<ArrayBuffer>}
 */

/**
 * An item info in a zip archive.
 * @typedef {object} ZipItemInfo
 * @property {string} name
 * @property {string} comment
 * @property {number} modifiedUnixtime
 * @property {number} size
 * @property {number} method
 * @property {boolean} isDir
 */

/**
 * Converts the zip item info to a JSON string.
 * @param {ZipItemInfo} zitem The zip item to be converted.
 * @returns {string} The converted JSON string.
 */
function zipitem2json(zitem) {
  return JSON.stringify(zitem)
}

/**
 * Zip archive info.
 * @typedef {object} ZipArchiveInfo
 * @property {string} comment
 * @property {string} filepath
 * @property {ZipItemInfo[]} items
 */

/**
 * Zip parser which gets its metadata(without blob data).
 * @typedef {function(ArrayBuffer): IO<ZipArchiveInfo>}
 */

/**
 * Zip item info printer.
 * @typedef {function(ZipItemInfo): IO<Void>} ZipItemWriter
 */

/** @type ZipItemWriter */
const zitem2console = (zitem) => {
  return () => {
    /** @type string */
    return Promise.resolve(zitem)
      .then(zipitem2json)
      .then(console.info)
  }
}

/**
 * Zip archive info printer.
 * @typedef {function(ZipArchiveInfo): IO<Void>} ZipArchiveInfoWriter
 */

/**
 * Creates ZipArchiveInfoWriter using the ZipItemWriter.
 * @param {ZipItemWriter} ziwriter The zip item writer.
 * @returns {ZipArchiveInfoWriter} The zip archive writer.
 */
function zaWriterNew(ziwriter) {
  return (za) => {
    return () => {
      /** @type ZipItemInfo[] */
      const items = za.items

      /** @type Promise<Void>[] */
      const mapd = items.map((zitem) => {
        return ziwriter(zitem)()
      })

      return Promise.all(mapd)
        .then((_) => undefined)
    }
  }
}

/** @type ZipArchiveInfoWriter */
export const zip2console = zaWriterNew(zitem2console)
