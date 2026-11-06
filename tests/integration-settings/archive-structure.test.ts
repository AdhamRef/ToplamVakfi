import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { DASHBOARD_NAV_HREFS_ORDERED } from "../../lib/dashboard/nav-config";
import { DASHBOARD_PERMISSION_KEYS } from "../../lib/dashboard/permissions";

/**
 * The archive and the certificate wording left the dashboard. Only the interfaces went: the
 * Prisma models, their rows and the stored files stay, and lib/archive stays for the code that
 * still imports it.
 */

test("archive and certificate wording pages and APIs are removed", () => {
  for (const path of [
    "app/(dashboard)/dashboard/archive",
    "app/api/admin/archive",
    "app/(dashboard)/dashboard/certificates",
    "app/api/certificates/copy",
  ]) {
    assert.equal(existsSync(path), false, `${path} must be removed`);
  }
});

test("archive and certificate wording are absent from navigation and permissions", () => {
  for (const prefix of ["/dashboard/archive", "/dashboard/certificates"]) {
    assert.equal(DASHBOARD_NAV_HREFS_ORDERED.some((href) => href.startsWith(prefix)), false);
  }
  assert.equal((DASHBOARD_PERMISSION_KEYS as readonly string[]).includes("archive"), false);
});
