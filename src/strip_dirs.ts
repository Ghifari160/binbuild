import path from "path";

/**
 * Removes leading directory components from `dir`.
 * @returns `dir` after `level` directories are stripped.
 * If `level` is greater than the components in `dir`, no stripping will be done.
 */
export default function stripDirs(dir: string, level: number) {
    // const dirs = dir.split(path.sep);
    const dirs = path.dirname(dir).split(path.sep);
    const base = path.basename(dir);

    if(dirs.length < level) {
        return path.join(...dirs, base);
    }

    for(let i = 0; i < level; i++) {
        dirs.pop();
    }
    return path.join(...dirs, base);
}
