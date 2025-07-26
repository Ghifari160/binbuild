import type { Arch, Platform } from "./platform";

import fs from "fs";
import path from "path";

import { execa } from "execa";

import { downloadAndExtract } from "./download";
import { osArchPair } from "./platform";
import { tempDirectoryTask } from "./tempfile";

/**
 * Binary source.
 */
interface Source {
    /**
     * Operating System for this source.
     */
    os: Platform,
    /**
     * System Architecture for this source.
     */
    arch: Arch,
    /**
     * URL to download from.
     */
    url: string,
};

/**
 * Describes remapping for a file.
 */
export interface Remap {
    /**
     * Source path relative to the build directory (i.e. the root of the archive).
     */
    src: string,
    /**
     * Destination path relative to the target directory.
     * If unspecified, `src` will be used.
     */
    dest?: string,
}

export interface Command {
    cmd: string,
    args?: string[],
};

export default class BinBuilder {
    private readonly sources: Source[];
    private destination: string;
    private downloaded: string[];
    private cmds: Command[];
    private fileRemaps: Remap[];

    constructor() {
        this.sources = [];
        this.destination = "";
        this.downloaded = [];
        this.cmds = [];
        this.fileRemaps = [];
    }

    /**
     * Registers a source URL for the current host platform and architecture.
     */
    src(url: string): this;
    /**
     * Registers a source URL for the given host platform and the current architecture.
     */
    src(url: string, os: Platform): this;
    /**
     * Registers a source URL for the given host platform and architecture.
     */
    src(url: string, os: Platform, arc: Arch): this;
    src(url: string, os: Platform = process.platform, arch: Arch = process.arch): this {
        this.sources.push({
            os: os,
            arch: arch,
            url: url,
        });
        return this;
    }

    /**
     * Returns a list of downloaded sources.
     */
    downloadedSrcs(): string[] {
        return this.downloaded;
    }

    /**
     * Returns path to destination directory.
     */
    dest(): string;
    /**
     * Sets destination directory.
     */
    dest(dest: string): this;
    dest(dest?: string): this | string {
        if(typeof dest === "undefined") {
            return this.destination;
        }

        if(this.exist(dest) && !this.isDirectory(dest)) {
            throw new Error(`Destination ${dest} is not a directory`);
        }
        this.destination = dest;
        return this;
    }

    /**
     * Returns the configured remappings.
     */
    remaps(): Remap[];
    /**
     * Sets file remapping to be done after the build process.
     * If there are no remap entry, the entire contents of the build directory will be moved to the
     * target directory after build completion.
     */
    remaps(remaps: Remap[]): this;
    remaps(remaps?: Remap[]) {
        if(typeof remaps === "undefined") {
            return this.fileRemaps;
        }

        this.fileRemaps = remaps;
        return this;
    }

    /**
     * Returns the build commands.
     */
    commands(): Command[];
    /**
     * Sets the build commands.
     */
    commands(cmds: Command[]): this;
    commands(cmds?: Command[]) {
        if(typeof cmds === "undefined") {
            return this.cmds;
        }

        this.cmds = cmds;
        return this;
    }

    /**
     * Performs build.
     */
    async build() {
        await this.ensureExist();

        tempDirectoryTask(async buildDir => {
            await this.download(buildDir);

            for(const cmd of this.commands()) {
                const res = await execa(cmd.cmd, cmd.args, {
                    stdout: "inherit",
                    stderr: "inherit",
                    cwd: buildDir,
                });
                if(res.exitCode != 0) {
                    throw new Error(`Build error: ${cmd.cmd} returns ${res.exitCode}`);
                }
            }

            if(this.remaps().length > 0) {
                for(const remap of this.remaps()) {
                    const src = path.join(buildDir, remap.src);
                    const dst = path.join(this.dest(), remap.dest || remap.src);
                    const dstDir = path.dirname(dst);

                    const dstDirExists = await exists(dstDir);
                    if(!dstDirExists) {
                        await fs.promises.mkdir(dstDir, { recursive: true });
                    }

                    await fs.promises.rename(src, dst);
                }
            } else {
                await fs.promises.rename(buildDir, this.dest());
            }
        });
    }

    /**
     * Ensures target directory exist.
     * If not, it will be created.
     */
    async ensureExist() {
        if(await exists(this.dest())) {
            return;
        }

        this.createDir(this.dest());
    }

    /**
     * Downloads the sources for the current host platform and architecture.
     */
    private async download(dest: string) {
        const srcs = this.getSrcs();

        if(srcs.length < 1) {
            throw new Error(`No binary for ${osArchPair()}`);
        }

        await Promise.all(srcs.map(async src => {
            await downloadAndExtract(src.url, dest, 1);
            this.downloaded.push(src.url);
        }));
    }

    /**
     * Returns sources for the current host platform and architecture.
     */
    private getSrcs(): Source[] {
        return this.sources.filter(src => src.os === process.platform &&
            src.arch === process.arch);
    }

    /**
     * Returns true if the path exists.
     */
    private exist(path: fs.PathLike) {
        return fs.existsSync(path);
    }

    /**
     * Returns true if the path is a directory.
     */
    private isDirectory(path: fs.PathLike) {
        return fs.statSync(path).isDirectory();
    }

    /**
     * Creates directory at the given path.
     */
    private createDir(path: fs.PathLike) {
        return fs.mkdirSync(path, { recursive: true });
    }
}

/**
 * Returns a Promise that resolves to the existence status of `filepath`.
 * @returns Promise that resolves `true` if `filepath` exists, and `false` otherwise.
 * @private
 */
async function exists(filepath: fs.PathLike) {
    try {
        await fs.promises.access(filepath);
        return true;
    } catch(err: unknown) {
        if(err instanceof Error && "code" in err && err.code === "ENOENT") {
            return false;
        }
        throw err;
    }
}
