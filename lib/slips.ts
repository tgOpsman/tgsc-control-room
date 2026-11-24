export type Slip = { username: string; password: string; name: string; role: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Opens a printable sheet of cut-out login slips. */
export function printSlips(slips: Slip[], logoUrl: string) {
  if (!slips.length) return;
  const w = window.open("", "_blank");
  if (!w) return;
  const origin = window.location.origin;
  const logo = new URL(logoUrl, origin).href;
  const body = slips.map((s) => `
    <div class="slip">
      <div class="head"><img src="${esc(logo)}" alt="" /><strong>Control Room Manager</strong></div>
      <div class="name">${esc(s.name)} <span>(${esc(s.role)})</span></div>
      <table><tr><td>Sign in at</td><td>${esc(origin)}</td></tr>
      <tr><td>Username</td><td class="mono">${esc(s.username)}</td></tr>
      <tr><td>Temporary password</td><td class="mono">${esc(s.password)}</td></tr></table>
      <p>On first sign-in you will add your details and choose your own password. Keep this slip private and destroy it once you have signed in.</p>
    </div>`).join("");
  w.document.write(`<!doctype html><html><head><title>Login slips</title><style>
    body{font-family:Inter,Arial,sans-serif;margin:16px;color:#0f1e3d}
    .slip{border:2px dashed #999;border-radius:8px;padding:14px;margin-bottom:14px;page-break-inside:avoid}
    .head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.head img{height:28px}
    .name{font-size:18px;font-weight:700;margin-bottom:6px}.name span{font-weight:400;color:#555;font-size:14px}
    td{padding:2px 12px 2px 0;font-size:14px}.mono{font-family:'DM Mono',monospace;font-size:16px;font-weight:700}
    p{font-size:12px;color:#444;margin:8px 0 0}
  </style></head><body>${body}<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

/** Random temporary password (12 chars, no look-alike characters). */
export function tempPassword(len = 12) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const a = new Uint32Array(len); crypto.getRandomValues(a);
  return Array.from(a, (n) => chars[n % chars.length]).join("");
}
