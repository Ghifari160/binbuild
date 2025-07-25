import type { Arch, Platform } from "./platform";

import fs from "fs";

import { execa } from "execa";

import { downloadAndExtract } from "./download";
import { osArchPair } from "./platform";

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

export interface Command {
    cmd: string,
    args?: string[],
};

export default class BinBuilder {
    private readonly sources: Source[];
    private destination: string;
    private downloaded: string[];
    private cmds: Command[];

    constructor() {
        this.sources = [];
        this.destination = "";
        this.downloaded = [];
        this.cmds = [];
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

        for(const cmd of this.commands()) {
            const res = await execa(cmd.cmd, cmd.args, { stdout: "inherit", stderr: "inherit", cwd: this.dest() });
            if(res.exitCode != 0) {
                throw new Error(`Build error: ${cmd.cmd} returns ${res.exitCode}`);
            }
        }
    }

    /**
     * Ensures binary is downloaded.
     * If not downloaded, the appropriate sources for this host platform and architecture will be
     * downloaded.
     */
    async ensureExist() {
        if(fs.existsSync(this.dest())) {
            return;
        }

        this.createDir(this.dest());
        await this.download();
    }

    /**
     * Downloads the sources for the current host platform and architecture.
     */
    private async download() {
        const srcs = this.getSrcs();

        if(srcs.length < 1) {
            throw new Error(`No binary for ${osArchPair()}`);
        }

        await Promise.all(srcs.map(async src => {
            await downloadAndExtract(src.url, this.dest(), 1);
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
