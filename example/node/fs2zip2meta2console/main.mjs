import fs from "node:fs/promises";

import JSZip from "jszip";

import { bind, lift, of, zip2console, ZipMethod } from "../../../zip2meta.mjs";

/**
 * @import { JSZipObject } from "jszip"
 */

/**
 * @import { IO, ZipItemInfo, ZipArchiveInfo } from "../../../zip2meta.mjs"
 */

/**
 * Returns the contents of the specified file as a Buffer.
 * @param {string} filename The name of the file to be read.
 * @returns {IO<Buffer>} The content of the file as a Buffer.
 */
function filename2buffer(filename) {
  return () => {
    return fs.readFile(filename);
  };
}

/**
 * Converts the Buffer to ArrayBuffer.
 * @param {Buffer} buffer The buffer to be converted.
 * @returns {Promise<ArrayBuffer>} The converted buffer.
 */
function buffer2abuf(buffer) {
  return Promise.resolve(buffer.buffer);
}

/**
 * Gets the content of the specified file as an ArrayBuffer.
 * @param {string} filename The name of the file to be read.
 * @returns {IO<ArrayBuffer>} The content of the file as an ArrayBuffer.
 */
function filename2arrayBuffer(filename) {
  return bind(
    filename2buffer(filename),
    lift(buffer2abuf),
  );
}

/**
 * Parses the array buffer and returns a zip archive info.
 * @todo Compute the size of a zip item entry somehow.
 * @param {ArrayBuffer} buf The buffer to be parsed.
 * @returns {IO<ZipArchiveInfo>} The zip archive info.
 */
function buf2zip(buf) {
  return () => {
    return JSZip.loadAsync(buf)
      .then((jz) => {
        const fileMap = jz.files;
        /** @type JSZipObject[] */
        const files = Object.keys(fileMap).map((key) => {
          /** @type JSZipObject */
          const file = fileMap[key];
          return file;
        });
        /** @type ZipItemInfo[] */
        const infoArr = files.map((file) => {
          /** @type Date */
          const date = file.date;

          /** @type number */
          const unixtimeMs = date.getTime();

          /** @type string */
          const method = file.options.compression;

          /** @type number */
          const mnum = ((ms) => {
            switch (ms) {
              case "store":
                return ZipMethod.STORE;
              case "deflate":
                return ZipMethod.DEFLATE;
              default:
                return ZipMethod.UNSPECIFIED;
            }
          })(method);

          return {
            name: file.name,
            comment: file.comment ?? "",
            modifiedUnixtime: unixtimeMs / 1000,
            size: 0,
            method: mnum,
            isDir: file.dir,
          };
        });

        return {
          comment: "",
          filepath: "",
          items: infoArr,
        };
      });
  };
}

/** @type IO<Void> */
const main = () => {
  return Promise.resolve()
    .then((_) => {
      /** @type IO<string> */
      const filename = of("./sample.zip");

      /** @type IO<ArrayBuffer> */
      const zipBytes = bind(
        filename,
        filename2arrayBuffer,
      );

      /** @type IO<ZipArchiveInfo> */
      const zinfo = bind(
        zipBytes,
        buf2zip,
      );

      /** @type IO<Void> */
      const zinfo2console = bind(zinfo, zip2console);

      return zinfo2console();
    });
};

main();
