/**
 * Operating System platform name.
 */
export type Platform = typeof process.platform;
/**
 * System architecture name.
 */
export type Arch = typeof process.arch;

/**
 * Returns an `OS_Arch` pair.
 * @param os Operating System.
 * Defaults to the host OS.
 * @param arch Architecture.
 * Defaults to the host architecture.
 * @returns OS Arch pair in the format of `<os>_<arch>`.
 */
export function osArchPair(os: Platform = process.platform, arch: Arch = process.arch): string {
    return `${normalizeOS(os)}_${normalizeArch(arch)}`;
}

/**
 * Normalizes host OS identifier.
 * @param os OS identifier.
 * Defaults to the current OS.
 * @returns Normalized OS ID:
 * - `win32` => `windows`
 * @private
 */
function normalizeOS(os: Platform = process.platform): string {
    switch(os) {
    case "win32":
        return "windows";

    default:
        return os;
    }
}

/**
 * Normalizes host architecture.
 * @param arch Host architecture.
 * @returns Normalized host architecture:
 * - `ia32` => `386`
 * - `x64` => `amd64`
 * @private
 */
function normalizeArch(arch: Arch = process.arch): string {
    switch(arch) {
    case "ia32":
        return "386";

    case "x64":
        return "amd64";

    default:
        return arch;
    }
}
