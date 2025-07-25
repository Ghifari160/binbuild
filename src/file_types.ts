import fs from "fs";

/**
 * Returns the MIME type for `file`.
 * Only looks for the supported types.
 * @param file Path to file.
 * @returns MIME type.
 * Defaults to `application/octet-stream` for unsupported type.
 * Supported types:
 * - `application/gzip`
 * - `application/x-bzip2`
 * - `application/zip`
 */
export async function getType(file: fs.PathLike) {
    const magic = await readMagicNumbers(file);

    let mime: string;
    if(isMagicNum([0x1F, 0x8B], magic)) {
        mime = "application/gzip";
    } else if(isMagicNum([0x42, 0x5A], magic)) {
        mime = "application/x-bzip2";
    } else if(isMagicNum([0x50, 0x4B, 0x03, 0x04], magic)) {
        mime = "application/zip";
    } else {
        mime = "application/octet-stream";
    }

    return mime;
}

/**
 * Reads the first `len` bytes of `file`.
 * @private
 */
async function readMagicNumbers(file: fs.PathLike, len: number = 4) {
    const buffer = Buffer.alloc(len);
    const fd = await fs.promises.open(file);
    await fd.read(buffer, 0, len, 0);
    await fd.close();

    return [...buffer];
}

/**
 * Compares `payload` against `magicNum`.
 * @private
 */
function isMagicNum(magicNum: number[], payload: number[]) {
    const file = [...payload];

    if(magicNum.length > file.length) {
        return false;
    }

    while(magicNum.length > 0) {
        if(file.length < 1) {
            return false;
        }

        const magic = magicNum.shift()
        const p = file.shift();

        if(magic != p) {
            return false;
        }
    }

    return true;
}
