import { readdir, rename } from "fs/promises";
import path from "path";

import * as tar from "tar";
import zip from "extract-zip";

import stripDirs from "./strip_dirs";

export type ArchiveFormat = |
    "tar" |
    "zip";

/**
 * Extracts archive in `filepath` to `dest`.
 */
export async function extract(
    filepath: string,
    dest: string,
    format: ArchiveFormat = "tar",
    strip?: number,
) {
    switch(format) {
    case "tar":
        return extractTar(filepath, dest, strip);

    case "zip":
        return extractZip(filepath, dest, strip);

    default:
        throw new Error(`Unsupported file type: ${path.extname(filepath)}`);
    }
}

/**
 * Extracts tar archive from `filepath` to `dest`.
 * @private
 */
async function extractTar(filepath: string, dest: string, strip?: number) {
    return tar.extract({
        file: filepath,
        cwd: dest,
        strip: strip,
    });
}

/**
 * Extracts zip archive from `filepath` to `dest`.
 */
async function extractZip(filepath: string, dest: string, strip?: number) {
    const promise = zip(filepath, { dir: path.resolve(dest) });

    if(typeof strip === "undefined") {
        return promise;
    }

    return promise.then(async () => {
        const leaves = await walkDir(dest, strip+1);

        for(const leaf of leaves) {
            try {
                const dst = stripDirs(leaf, strip);
                await rename(leaf, dst);
            } catch(err) {
                throw new Error(`Cannot strip ${strip} levels for ${leaf}: ${err}`);
            }
        }
    });
}

/**
 * Recursively through `filepath` for a max depth of `maxDepth`.
 */
async function walkDir(filepath: string, maxDepth: number, currDepth: number = 0) {
    const res: string[] = [];

    if(currDepth > maxDepth) {
        return res;
    }

    try {
        const entries = await readdir(filepath, { withFileTypes: true });

        for(const entry of entries) {
            const entryPath = path.join(filepath, entry.name)
            if(entry.isDirectory()) {
                if(currDepth+1 < maxDepth) {
                    const sub = await walkDir(entryPath, maxDepth, currDepth+1);
                    res.push(...sub);
                } else {
                    res.push(entryPath);
                }
            } else {
                res.push(entryPath);
            }
        }
    } catch(err) {
        throw err;
    }

    return res;
}
