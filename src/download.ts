import fs from "fs";
import { pipeline } from "stream/promises";

import { getType } from "./file_types";
import { tempFileTask } from "./tempfile";
import { type ArchiveFormat, extract } from "./unarchive";

/**
 * Downloads a file `url` to `dest`.
 * If `url` is a local path (or a `file://` URL), the file will instead be copied to `dest`.
 */
export async function download(url: string, dest: string) {
    if(isLocalPath(url)) {
        return copyLocalFile(trimLocalURL(url), dest);
    } else {
        return downloadFromURL(url, dest);
    }
}

/**
 * Copies local file from `src` to `dest`.
 * @param src Local path or `file://` URL to the source file.
 * @param dest Path to destination file.
 */
async function copyLocalFile(src: string, dest: string) {
    return fs.promises.copyFile(src, dest);
}

/**
 * Downloads a file from `url` to `dest`.
 */
async function downloadFromURL(url: string, dest: string) {
    const resp = await fetch(url);
    const writeStream = fs.createWriteStream(dest);

    if(!resp.ok) {
        throw new Error(`HTTP error (${resp.status}): ${resp.statusText}`);
    }

    if(!resp.body) {
        throw new Error("Empty response body!");
    }

    await pipeline(resp.body, writeStream).catch(err => {
        try {
            fs.unlinkSync(dest);
        } catch(err) {}
        throw new Error(`Failed to download ${url}: ${err}`);
    });
}

/**
 * Downloads an archive from `url` to `dest` and extract it.
 */
export async function downloadAndExtract(url: string, dest: string, strip?: number) {
    await tempFileTask(async temp => {
        await download(url, temp);

        const mime = await getType(temp);
        let format: ArchiveFormat;
        switch(mime) {
        case "application/gzip":
        case "application/x-bzip2":
            format = "tar";
            break;

        case "application/zip":
            format = "zip";
            break;

        default:
            throw new Error(`Unsupported format for ${url}: ${mime}`);
        }

        await extract(temp, dest, format, strip);
    });
}

/**
 * Returns true if `pathLike` is a URL.
 */
function isURL(pathLike: string) {
    try {
        new URL(pathLike);
        return true;
    } catch(err) {
        return false;
    }
}

/**
 * Returns true if `pathLike` is not URL or it is a `file://` URL.
 */
function isLocalPath(pathLike: string) {
    if(isURL(pathLike)) {
        try {
            const url = new URL(pathLike);
            if(url.protocol !== "file:") {
                return false;
            }
        } catch(err) {}
    }

    return true;
}

/**
 * Trims the `file://` protocol scheme from `pathLike`.
 * If `pathLike` is not a URL (i.e. it is a local absolute or relative path), it is returned as is.
 */
function trimLocalURL(pathLike: string) {
    try {
        const url = new URL(pathLike);
        return url.pathname;
    } catch(err) {}
    return pathLike;
}
