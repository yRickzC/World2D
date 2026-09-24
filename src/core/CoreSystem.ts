/**
 * CoreSystem
 * Central authority for Core game engine versioning, compatibility checks,
 * and official system capabilities.
 */

export interface VersionParts {
  major: number;
  minor: number;
  patch: number;
  tag?: string;
}

export class CoreSystem {
  static readonly CORE_VERSION = '0.0.1';

  /**
   * Returns current engine Core version.
   */
  static getVersion(): string {
    return this.CORE_VERSION;
  }

  /**
   * Parse a version string "major.minor.patch"
   */
  static parseVersion(v: string): VersionParts | null {
    if (!v || typeof v !== 'string') return null;
    const clean = v.trim().replace(/^[v^~>=<\s]+/, '');
    const parts = clean.split('.');
    if (parts.length < 2) return null;

    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    const patchParts = (parts[2] || '0').split('-');
    const patch = parseInt(patchParts[0], 10);
    const tag = patchParts[1];

    if (isNaN(major) || isNaN(minor) || isNaN(patch)) return null;
    return { major, minor, patch, tag };
  }

  /**
   * Compares two versions.
   * Returns:
   *  -1 if v1 < v2
   *   0 if v1 === v2
   *   1 if v1 > v2
   */
  static compareVersions(v1: string, v2: string): number {
    const p1 = this.parseVersion(v1);
    const p2 = this.parseVersion(v2);
    if (!p1 || !p2) return 0;

    if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
    if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
    if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;
    return 0;
  }

  /**
   * Resolves whether a mod's declared `core_version` is compatible with the running Core.
   * Rule:
   * - Must match major and minor for early 0.x releases (0.0.x must match exactly or be >= declared min).
   * - Supports semver prefixes: "^", "~", ">=", "<=", or exact version.
   */
  static isVersionCompatible(declaredReq: string, targetCoreVersion: string = this.CORE_VERSION): boolean {
    if (!declaredReq || typeof declaredReq !== 'string') return false;
    const req = declaredReq.trim();

    // Exact match
    if (req === targetCoreVersion) return true;

    const coreParts = this.parseVersion(targetCoreVersion);
    const reqParts = this.parseVersion(req);
    if (!coreParts || !reqParts) return false;

    // Range: >=x.y.z
    if (req.startsWith('>=')) {
      return this.compareVersions(targetCoreVersion, req.replace('>=', '').trim()) >= 0;
    }

    // Range: >x.y.z
    if (req.startsWith('>')) {
      return this.compareVersions(targetCoreVersion, req.replace('>', '').trim()) > 0;
    }

    // Range: ^x.y.z (compatible with same major, or same minor if 0.x)
    if (req.startsWith('^')) {
      const baseReq = req.replace('^', '').trim();
      const p = this.parseVersion(baseReq);
      if (!p) return false;
      if (coreParts.major !== p.major) return false;
      if (coreParts.major === 0 && coreParts.minor !== p.minor) return false;
      return this.compareVersions(targetCoreVersion, baseReq) >= 0;
    }

    // Range: ~x.y.z (compatible with same minor)
    if (req.startsWith('~')) {
      const baseReq = req.replace('~', '').trim();
      const p = this.parseVersion(baseReq);
      if (!p) return false;
      if (coreParts.major !== p.major || coreParts.minor !== p.minor) return false;
      return this.compareVersions(targetCoreVersion, baseReq) >= 0;
    }

    // For 0.0.x, exact or compatible patch:
    if (reqParts.major === 0 && reqParts.minor === 0) {
      return coreParts.major === 0 && coreParts.minor === 0 && coreParts.patch >= reqParts.patch;
    }

    // For 0.x.y, same minor and patch >= declared:
    if (reqParts.major === 0) {
      return coreParts.major === 0 && coreParts.minor === reqParts.minor && coreParts.patch >= reqParts.patch;
    }

    // For >= 1.0.0, same major and >= declared:
    return coreParts.major === reqParts.major && this.compareVersions(targetCoreVersion, req) >= 0;
  }
}
