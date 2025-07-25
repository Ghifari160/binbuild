import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";
import os from "os";

type CallbackFn = (tempPath: string) => Promise<void>;

const tempDir = fs.realpathSync(os.tmpdir());

/**
 * Creates random path.
 * @private
 */
function getPath(prefix: string = "") {
    return path.join(tempDir, `${prefix}${randomString()}`);
}

/**
 * Generate random string.
 * @private
 */
function randomString(len: number = 32): string {
    return randomBytes(len/2).toString("hex");
}

/**
 * Runs cb after creating tempPath.
 * Also removes tempPath after cb completes regardless of status.
 * @private
 */
async function runTask(tempPath: string, cb: CallbackFn) {
    try {
        return await cb(tempPath);
    } finally {
        await fs.promises.rm(tempPath, { recursive: true, force: true, maxRetries: 5 });
    }
}

/**
 * Creates a temporary file.
 */
export function tempFile({
    name,
    extension,
}: {
    name?: string,
    extension?: string,
} = {}) {
    if(typeof name !== "undefined") {
        if(typeof extension !== "undefined" && extension !== null) {
            throw new Error(`"name" and "extension" are mutually exclusive!`);
        }
        return path.join(tempDir, name);
    }

    return getPath() +
        ((extension === undefined || extension === null) ? "" : `.${extension?.replace(/^\./, "")}`);
}

/**
 * Runs a task on a temporary file.
 */
export async function tempFileTask(
    cb: CallbackFn,
    options?: {
        name?: string,
        extension?: string,
    },
) {
    return runTask(tempFile(options), cb);
}

/**
 * Creates a temporary directory.
 */
export function tempDirectory({
    prefix,
}: {
    prefix?: string,
} = {}) {
    const dir = getPath(prefix);
    fs.mkdirSync(dir);
    return dir;
}

/**
 * Runs a task on a temporary directory.
 */
export async function tempDirectoryTask(
    cb: CallbackFn,
    options?: {
        prefix?: string,
    },
) {
    return runTask(tempDirectory(options), cb)
}
