// Anatomy core: signed-distance anatomy of the sellar region (units: mm).
// Axes: +x = patient's LEFT (viewer's right in an anterior / coronal view), +y = superior, +z = anterior.
window.Core = (function () {
  'use strict';

  // ---------- noise ----------
  function hash(i, j, k) {
    let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const a = hash(xi, yi, zi), b = hash(xi + 1, yi, zi), c = hash(xi, yi + 1, zi), d = hash(xi + 1, yi + 1, zi);
    const e = hash(xi, yi, zi + 1), f = hash(xi + 1, yi, zi + 1), g = hash(xi, yi + 1, zi + 1), h = hash(xi + 1, yi + 1, zi + 1);
    const x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (h - g) * u;
    const y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v;
    return (y1 + (y2 - y1) * w) * 2 - 1;
  }
  function fbm(x, y, z) {
    return noise3(x, y, z) * 0.62 + noise3(x * 2.13 + 5.1, y * 2.13, z * 2.13) * 0.28 + noise3(x * 4.7, y * 4.7 + 3.3, z * 4.7) * 0.1;
  }

  // ---------- SDF primitives ----------
  const sqrt = Math.sqrt, abs = Math.abs, max = Math.max, min = Math.min;
  function sdEll(px, py, pz, cx, cy, cz, rx, ry, rz) {
    const x = px - cx, y = py - cy, z = pz - cz;
    const k0 = sqrt((x / rx) * (x / rx) + (y / ry) * (y / ry) + (z / rz) * (z / rz));
    const k1 = sqrt((x / (rx * rx)) ** 2 + (y / (ry * ry)) ** 2 + (z / (rz * rz)) ** 2);
    return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -min(rx, ry, rz);
  }
  function sdRBox(px, py, pz, cx, cy, cz, hx, hy, hz, r) {
    const qx = abs(px - cx) - hx + r, qy = abs(py - cy) - hy + r, qz = abs(pz - cz) - hz + r;
    const mx = max(qx, 0), my = max(qy, 0), mz = max(qz, 0);
    return sqrt(mx * mx + my * my + mz * mz) + min(max(qx, qy, qz), 0) - r;
  }
  function sdCone(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) {
    const pax = px - ax, pay = py - ay, paz = pz - az, bax = bx - ax, bay = by - ay, baz = bz - az;
    let h = (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz);
    h = h < 0 ? 0 : h > 1 ? 1 : h;
    const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
    return sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
  }
  function smin(a, b, k) {
    const h = max(k - abs(a - b), 0) / k;
    return min(a, b) - h * h * k * 0.25;
  }
  function smax(a, b, k) { return -smin(-a, -b, k); }

  // ---------- centripetal Catmull-Rom paths with per-control radius ----------
  function crDense(P, per) {
    const n = P.length;
    const g0 = P[0].map((v, i) => 2 * v - P[1][i]);
    const g1 = P[n - 1].map((v, i) => 2 * v - P[n - 2][i]);
    const pts = [g0, ...P, g1];
    const out = [];
    const d = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), 0.5) || 1e-4;
    for (let i = 1; i < pts.length - 2; i++) {
      const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
      const t0 = 0, t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
      for (let s = 0; s < per; s++) {
        const t = t1 + ((t2 - t1) * s) / per;
        const q = [0, 0, 0];
        for (let k = 0; k < 3; k++) {
          const A1 = ((t1 - t) / (t1 - t0)) * p0[k] + ((t - t0) / (t1 - t0)) * p1[k];
          const A2 = ((t2 - t) / (t2 - t1)) * p1[k] + ((t - t1) / (t2 - t1)) * p2[k];
          const A3 = ((t3 - t) / (t3 - t2)) * p2[k] + ((t - t2) / (t3 - t2)) * p3[k];
          const B1 = ((t2 - t) / (t2 - t0)) * A1 + ((t - t0) / (t2 - t0)) * A2;
          const B2 = ((t3 - t) / (t3 - t1)) * A2 + ((t - t1) / (t3 - t1)) * A3;
          q[k] = ((t2 - t) / (t2 - t1)) * B1 + ((t - t1) / (t2 - t1)) * B2;
        }
        out.push([q[0], q[1], q[2], i - 1 + s / per]);
      }
    }
    const L = P[n - 1];
    out.push([L[0], L[1], L[2], n - 1]);
    return out;
  }

  // Path: resampled polyline carrying radius and control parameter c (0..nCtrl-1).
  function makePath(ctrl, radii, ds) {
    const dense = crDense(ctrl, 24);
    const cum = [0];
    for (let i = 1; i < dense.length; i++) {
      const a = dense[i - 1], b = dense[i];
      cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    const length = cum[cum.length - 1];
    const n = Math.max(2, Math.ceil(length / ds) + 1);
    const X = new Float64Array(n), Y = new Float64Array(n), Z = new Float64Array(n), R = new Float64Array(n), C = new Float64Array(n);
    let j = 0;
    for (let i = 0; i < n; i++) {
      const s = (length * i) / (n - 1);
      while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const f = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
      const a = dense[j], b = dense[j + 1];
      X[i] = a[0] + (b[0] - a[0]) * f; Y[i] = a[1] + (b[1] - a[1]) * f; Z[i] = a[2] + (b[2] - a[2]) * f;
      const c = a[3] + (b[3] - a[3]) * f;
      C[i] = c;
      const ci = Math.min(Math.floor(c), radii.length - 2), cf = c - ci;
      R[i] = radii[ci] + (radii[ci + 1] - radii[ci]) * cf;
    }
    let rmax = 0; for (let i = 0; i < n; i++) rmax = Math.max(rmax, R[i]);
    // segment boxes (expanded by radius) and groups of 8 segments
    const ns = n - 1, sb = new Float64Array(ns * 6);
    for (let i = 0; i < ns; i++) {
      const r = Math.max(R[i], R[i + 1]);
      sb[i * 6] = Math.min(X[i], X[i + 1]) - r; sb[i * 6 + 1] = Math.max(X[i], X[i + 1]) + r;
      sb[i * 6 + 2] = Math.min(Y[i], Y[i + 1]) - r; sb[i * 6 + 3] = Math.max(Y[i], Y[i + 1]) + r;
      sb[i * 6 + 4] = Math.min(Z[i], Z[i + 1]) - r; sb[i * 6 + 5] = Math.max(Z[i], Z[i + 1]) + r;
    }
    const G = 8, ng = Math.ceil(ns / G), gb = new Float64Array(ng * 6);
    for (let g = 0; g < ng; g++) {
      gb[g * 6] = gb[g * 6 + 2] = gb[g * 6 + 4] = 1e9; gb[g * 6 + 1] = gb[g * 6 + 3] = gb[g * 6 + 5] = -1e9;
      for (let i = g * G; i < Math.min(ns, (g + 1) * G); i++) {
        for (let k = 0; k < 6; k += 2) { gb[g * 6 + k] = Math.min(gb[g * 6 + k], sb[i * 6 + k]); gb[g * 6 + k + 1] = Math.max(gb[g * 6 + k + 1], sb[i * 6 + k + 1]); }
      }
    }
    const path = { ctrl, radii, n, X, Y, Z, R, C, length, rmax, lastC: 0 };
    // distance to the tube surface (negative inside). Returns 1e3 when farther than `margin`.
    path.dist = function (px, py, pz, margin) {
      const m = margin === undefined ? 4 : margin;
      let best = 1e3, bi = -1, bh = 0;
      for (let g = 0; g < ng; g++) {
        const o = g * 6;
        if (px < gb[o] - m || px > gb[o + 1] + m || py < gb[o + 2] - m || py > gb[o + 3] + m || pz < gb[o + 4] - m || pz > gb[o + 5] + m) continue;
        const e = Math.min(ns, (g + 1) * G);
        for (let i = g * G; i < e; i++) {
          const q = i * 6;
          if (px < sb[q] - m || px > sb[q + 1] + m || py < sb[q + 2] - m || py > sb[q + 3] + m || pz < sb[q + 4] - m || pz > sb[q + 5] + m) continue;
          const ax = X[i], ay = Y[i], az = Z[i];
          const bx = X[i + 1] - ax, by = Y[i + 1] - ay, bz = Z[i + 1] - az;
          const qx = px - ax, qy = py - ay, qz = pz - az;
          let h = (qx * bx + qy * by + qz * bz) / (bx * bx + by * by + bz * bz);
          h = h < 0 ? 0 : h > 1 ? 1 : h;
          const dx = qx - bx * h, dy = qy - by * h, dz = qz - bz * h;
          const d = sqrt(dx * dx + dy * dy + dz * dz) - (R[i] + (R[i + 1] - R[i]) * h);
          if (d < best) { best = d; bi = i; bh = h; }
        }
      }
      if (bi >= 0) path.lastC = C[bi] + (C[bi + 1] - C[bi]) * bh;
      return best;
    };
    return path;
  }
  const mirror = (P) => P.map((p) => [-p[0], p[1], p[2]]);

  // ---------- anatomy definitions (left side, x > 0) ----------
  const A = {};
  A.ica = {
    ctrl: [[25, -16, -28], [18, -15, -19], [13, -13.5, -12.5], [11.3, -9.5, -9.5], [10.8, -6.3, -6.8], [10.5, -5.4, -2.5], [10.5, -5.0, 3.5],
      [11.0, -3.6, 7.3], [11.0, -0.4, 8.9], [10.4, 2.6, 7.8], [9.6, 4.8, 5.2], [9.5, 6.0, 1.8], [10.2, 7.2, -1.2], [11.4, 8.6, -2.4]],
    radii: [3.0, 3.0, 2.9, 2.7, 2.6, 2.55, 2.5, 2.45, 2.4, 2.3, 2.2, 2.15, 2.1, 2.0],
    // Bouthillier segment by control-parameter range
    segments: [[0, 2, 'C2 · petröz'], [2, 3, 'C3 · laserum'], [3, 8, 'C4 · kavernöz'], [8, 9, 'C5 · klinoid'], [9, 11, 'C6 · oftalmik'], [11, 13, 'C7 · komünikan']]
  };
  A.vessels = {
    mca: { ctrl: [[11.4, 8.6, -2.4], [15, 9.2, -1.8], [20, 9.8, -0.4], [25, 11.0, 0.8]], radii: [1.45, 1.4, 1.35, 1.3] },
    a1: { ctrl: [[11.4, 8.6, -2.4], [8, 9.8, 0.6], [4, 10.6, 3.8], [1.0, 11.0, 5.2]], radii: [1.2, 1.15, 1.1, 1.05] },
    a2: { ctrl: [[1.0, 11.0, 5.2], [1.1, 14.5, 6.4], [1.3, 21, 6.8]], radii: [1.0, 1.0, 0.95] },
    pcom: { ctrl: [[10.2, 7.2, -1.2], [9.4, 6.8, -5.2], [7.6, 6.2, -9.8]], radii: [0.75, 0.7, 0.72] },
    pca: { ctrl: [[0.4, 4, -14], [3.6, 5.2, -12.9], [7.6, 6.2, -10.2], [11.2, 7.1, -12.4], [15.5, 7.8, -16.5]], radii: [1.3, 1.25, 1.25, 1.2, 1.15] },
    sca: { ctrl: [[0.4, 2.6, -14.6], [4, 2.2, -14], [8, 1.8, -15], [12.5, 2.4, -17.5]], radii: [0.95, 0.9, 0.9, 0.85] },
    oph: { ctrl: [[9.5, 4.0, 6.0], [8.7, 1.4, 8.6], [10.4, 0.2, 12.5], [11.6, 0.2, 19]], radii: [0.6, 0.55, 0.5, 0.5] }
  };
  A.midline = {
    basilar: { ctrl: [[0, -24, -30], [0, -14, -23.5], [0, -4, -17], [0, 2.6, -14.6], [0, 4, -14]], radii: [1.7, 1.65, 1.6, 1.6, 1.5] },
    acom: { ctrl: [[-1.1, 11, 5.2], [0, 11.1, 5.4], [1.1, 11, 5.2]], radii: [0.7, 0.65, 0.7] }
  };
  A.nerves = {
    cn3: { ctrl: [[3, 3.5, -16.5], [5.8, 3.5, -12.4], [9, 2.6, -7.8], [12.6, 0.4, -4], [15.1, -1.0, 0], [15.3, -1.4, 4], [15.4, -1.5, 8.5], [16.4, -1.8, 12], [16.6, -1.6, 14], [18, -1.4, 20]], r: 1.1, name: 'cn3' },
    cn4: { ctrl: [[8, 5.5, -19], [11.5, 3.6, -12.5], [14.2, 0.4, -6.5], [16.0, -2.7, -1.5], [16.2, -2.9, 4], [17.1, -1.0, 9], [16.3, 0.0, 10.6], [15.6, -0.2, 12.2], [15.4, -0.2, 14], [16.2, 0.1, 20]], r: 0.55, name: 'cn4' },
    v1: { ctrl: [[16, -7.0, -6], [15.5, -4.9, -1.5], [15.6, -4.7, 4], [16.3, -4.0, 9], [18.6, -2.9, 12.5], [18.8, -1.9, 14], [20.5, -1.5, 20]], r: 1.05, name: 'v1' },
    v2: { ctrl: [[17.5, -8.4, -5.5], [16, -7.4, -0.5], [15.9, -7.3, 4.5], [15.6, -7.9, 9.5], [15.6, -8.5, 15], [16.4, -9.2, 21]], r: 1.25, name: 'v2' },
    cn6: { ctrl: [[2.5, -22, -28], [4, -15, -23], [6, -10, -19], [8.6, -8.6, -12.8], [11.8, -8.0, -7.5], [13.4, -7.4, -2], [13.6, -7.0, 4], [14.6, -5.6, 9], [16.2, -3.6, 12.5], [16.6, -3.4, 14], [18, -3.6, 20]], r: 0.62, name: 'cn6' }
  };
  A.nervesStatic = {
    v3: { ctrl: [[20, -10, -7.5], [20.8, -13.5, -5], [21.2, -18, -3.5], [21.5, -24, -2]], r: 1.5 },
    cn5: { ctrl: [[5, -5.2, -19], [10, -5.6, -15], [14.8, -6.8, -11.2]], r: 2.1 }
  };
  A.ganglion = { c: [18, -8.2, -8.8], r: [4.6, 1.45, 3.0], yaw: -0.62 };
  A.optic = {
    nerve: { ctrl: [[12.5, 1.4, 19], [9.56, 1.4, 12.5], [7.6, 1.8, 8], [5.2, 5.0, 4.6], [2.8, 6.6, 3.2]], radii: [1.55, 1.55, 1.75, 1.95, 2.0] },
    tract: { ctrl: [[2.5, 7.1, 0.2], [6.8, 7.8, -4.4], [10.8, 8.5, -9], [14, 9, -13]], radii: [1.8, 1.8, 1.9, 2.0] }
  };
  A.stalkTop = [0, 6.3, -2.8];

  // Coarse paths for SDF queries (left side; mirror queries with |x|).
  const P = {};
  P.ica = makePath(A.ica.ctrl, A.ica.radii, 0.9);
  P.icaCav = makePath(A.ica.ctrl.slice(3, 10), A.ica.ctrl.slice(3, 10).map(() => 4.2), 1.0);
  P.opticN = makePath(A.optic.nerve.ctrl, A.optic.nerve.radii, 0.8);
  P.opticT = makePath(A.optic.tract.ctrl, A.optic.tract.radii, 0.9);

  // ---------- bone ----------
  const CLV = (function () { const d = [0, -22, -15], l = Math.hypot(...d); const dir = d.map((v) => v / l); return { dir, perp: [0, -dir[2], dir[1]] }; })();
  // perp = (0,-dir.z, dir.y) → (0,-0.564,0.827)*-1? keep orthogonal; sign irrelevant for a symmetric box.
  function fossaSDF(x, y, z) { return sdEll(x, y, z, 0, -1.5, 0.3, 7.2, 4.2, 5.8); }
  function sinusSDF(x, y, z, icaD) {
    let d = sdRBox(x, y, z, 0, -13.5, 2.5, 8.3, 7.2, 10.3, 3);
    d = smax(d, -(fossaSDF(x, y, z) - 1.4), 1.0);
    d = smax(d, -(icaD - 2.0), 1.0);
    return d;
  }
  // Low-frequency domain warp: bends the solid bone organically without thinning walls.
  function warp(x, y, z) {
    return [x + 0.9 * noise3(x * 0.075 + 3.1, y * 0.075, z * 0.075), y + 0.6 * noise3(x * 0.075, y * 0.075 + 7.7, z * 0.075), z + 0.9 * noise3(x * 0.075, y * 0.075, z * 0.075 + 1.9)];
  }
  function boneSolid(x, y, z) {
    const ax = abs(x);
    let d = sdRBox(x, y, z, 0, -12, 1, 10, 10, 13, 4.5); // sphenoid body
    d = smin(d, sdRBox(x, y, z, 0, -1.4, 13, 9.5, 2.4, 7, 2.2), 2.5); // tuberculum / limbus
    d = smin(d, sdRBox(x, y, z, 0, -1.0, 24, 10.5, 1.8, 6.5, 1.6), 2.0); // planum sphenoidale
    {
      const e = sdEll(ax, y, z, 20, -9, 21, 11.5, 11, 11);
      let sh = abs(e + 0.9) - 0.9;
      sh = smax(sh, -(y + 1.0), 1.2);
      d = smin(d, sh, 2.0); // orbital roof (domed)
    }
    {
      // lesser wing: flattened tapered blade sweeping posterolaterally
      const k = 2.1, yy = 1.3 + (y - 1.3) * k;
      d = smin(d, sdCone(ax, yy, z, 11.5, 1.3, 13, 31, 1.3, 3.5, 4.2, 1.4) / k, 1.6);
    }
    d = smin(d, sdRBox(ax, y, z, 10.8, 1.4, 13.5, 3.6, 3.4, 4.2, 1.8), 1.4); // optic strut / lesser-wing root
    d = smin(d, sdCone(ax, y, z, 13.2, 1.2, 11, 14.2, 1.8, 1.5, 2.8, 1.1), 1.0); // anterior clinoid
    {
      const lz = z + 7.4 - (y - 1.5) * 0.22;
      const wx = 6.4 + (y - 1.5) * 0.12; // dorsum widens slightly upward
      d = smin(d, sdRBox(x, y, lz, 0, 1.5, 0, wx, 6, 1.25, 1.2), 1.6); // dorsum sellae
    }
    d = smin(d, sdEll(ax, y, z, 5.8, 7.2, -6.3, 2.0, 1.7, 1.8), 1.0); // posterior clinoid
    {
      const qy = y + 15, qz = z + 17.5;
      const la = qy * CLV.dir[1] + qz * CLV.dir[2];
      const lb = qy * CLV.perp[1] + qz * CLV.perp[2];
      d = smin(d, sdRBox(x, la, lb, 0, 0, 0, 7.5, 13.3, 2.8, 2.4), 2.4); // clivus
    }
    d = smin(d, sdCone(ax, y, z, 12.5, -10.5, -13.5, 32, -9, -30, 3.4, 6.5), 2.4); // petrous apex / ridge
    {
      const e = sdEll(ax, y, z, 24, -3, -1, 13, 14.5, 16);
      let sh = abs(e + 1.2) - 1.1;
      sh = smax(sh, y + 4.5, 1.2);
      sh = smax(sh, 11.5 - ax, 1.2);
      d = smin(d, sh, 2.0); // middle cranial fossa floor (greater wing)
    }
    return d;
  }
  function boneSDF(x, y, z) {
    const ax = abs(x);
    // cheap bound: far above everything
    if (y > 12) return y - 10;
    const w = warp(x, y, z);
    let d = boneSolid(w[0], w[1], w[2]);
    // hollows (unwarped: they must match the soft tissue exactly)
    d = smax(d, -fossaSDF(x, y, z), 0.8);
    const icaD = P.ica.dist(ax, y, z, 5);
    d = smax(d, -(icaD - 0.9), 0.6); // carotid sulcus / canal
    d = smax(d, -sinusSDF(w[0], w[1], w[2], icaD), 0.6);
    d = smax(d, -sdRBox(x, y, z, 0, -13, 14.2, 6.5, 5, 2.6, 2), 0.6); // sphenoidotomy (anterior wall opened)
    d = smin(d, max(sdRBox(x, y, z, 1.4, -13.5, -0.4, 0.6, 7.4, 7.4, 0.3), -sdRBox(x, y, z, 0, -13, 14.2, 6.5, 5, 2.6, 2)), 0.4); // intersinus septum
    d = smax(d, -sdCone(ax, y, z, 7.0, 1.4, 7.2, 12.8, 1.4, 19.5, 2.0, 2.0), 0.5); // optic canal
    d = smax(d, -sdCone(ax, y, z, 15.5, -8.2, 8, 15.9, -8.9, 19, 1.8, 1.8), 0.4); // foramen rotundum
    d = smax(d, -sdCone(ax, y, z, 20.7, -11, -5.4, 21.3, -21, -3, 2.3, 2.3), 0.4); // foramen ovale
    d = smax(d, -sdEll(ax, y, z, 16.5, -7.3, -10, 5.2, 2.6, 4.2), 0.8); // Meckel cave / trigeminal impression
    // specimen bounds: an irregular dissection edge rather than a clean box cut
    d = smax(d, sdEll(x, y, z, 0, -8, 0.5, 34, 22, 30) + 1.6 * noise3(x * 0.12, y * 0.12 + 4, z * 0.12), 1.0);
    if (d < 2.2 && d > -2.2) d += 0.12 * fbm(x * 0.45, y * 0.45, z * 0.45) + 0.05 * noise3(x * 2.2, y * 2.2, z * 2.2);
    return d;
  }
  // air in sphenoid sinus (for MR slice)
  function airSDF(x, y, z) {
    const icaD = P.ica.dist(abs(x), y, z, 5);
    let d = sinusSDF(x, y, z, icaD);
    d = max(d, -max(sdRBox(x, y, z, 1.4, -13.5, -0.4, 0.6, 7.4, 7.4, 0.3), -sdRBox(x, y, z, 0, -13, 14.2, 6.5, 5, 2.6, 2)));
    return d;
  }

  // ---------- cavernous sinus (push shifts the lateral wall of the left side) ----------
  function pushW(z) { const t = (z - 1.5) / 7; return Math.exp(-t * t); }
  function csStatic(ax, y, z) {
    let d = P.icaCav.dist(ax, y, z, 6);
    d = smin(d, sdEll(ax, y, z, 14.5, -6.2, -8.5, 4.2, 3.2, 3.8), 2.0);
    d = smin(d, sdEll(ax, y, z, 15.8, -2.5, 11.5, 3.2, 2.8, 3.5), 2.0);
    return d;
  }
  function csSDF(x, y, z, push, boneD, stat) {
    const ax = abs(x), pu = x > 0 ? push : 0;
    let d = stat !== undefined ? stat : csStatic(ax, y, z);
    d = smin(d, sdRBox(ax, y, z, 12.4 + pu * pushW(z) * 0.9, -3.6, 1.8, 4.8, 4.2, 7.8, 2.6), 2.0);
    d = smax(d, 7.3 - ax, 0.8);
    d = smax(d, y - 1.6, 0.8);
    d = smax(d, -(y + 9.5), 0.8);
    if (boneD !== undefined) d = smax(d, -boneD, 0.5);
    return d;
  }

  // ---------- optic apparatus ----------
  function opticSDF(x, y, z) {
    const ax = abs(x);
    let d = P.opticN.dist(ax, y, z, 4);
    d = smin(d, sdEll(x, y, z, 0, 6.9, 2.2, 6.2, 1.7, 3.9), 1.6);
    d = smin(d, P.opticT.dist(ax, y, z, 4), 1.4);
    return d;
  }

  // ---------- tumour & gland states ----------
  const ZS = [0.4, -2.0, 1.0, 0.01, 0.01, 0.01];
  const T_A = [0.3, -2.3, 0.8, 6.8, 4.0, 6.0];
  const T_B = [0.2, 1.8, 0.2, 5.4, 3.4, 5.0];
  const L1 = [5.8, -0.4, 2.4, 3.4, 3.0, 4.3];
  const L2 = [7.6, 0.2, 2.4, 4.2, 2.7, 4.5];
  const S3 = [12.4, -0.1, 2.4, 3.9, 2.1, 4.8];
  const C3 = [8.8, -5.0, 2.4, 2.4, 2.6, 4.2];
  const I3 = [12.2, -8.6, 2.4, 3.8, 2.1, 4.6];
  const LC = [15.0, -3.8, 2.4, 2.5, 4.6, 4.8];
  const EX = [11.8, -4.2, -3.2, 4.0, 4.4, 3.8];
  // slots: A, B, lateral, superior, connector, inferior, lateral-closure, posterior
  const GLAND_N = { a: [0, -3.5, 1.2, 6.3, 2.2, 4.0], p: [0, -3.5, -3.2, 3.6, 2.0, 2.2], mid: [0, 2.2, -2.2], bot: [0, -1.8, -1.4] };
  const GLAND_M = { a: [-5.4, -1.6, 1.4, 2.3, 3.4, 4.2], p: [-3.2, -3.0, -5.0, 2.4, 1.8, 1.6], mid: [-3.5, 5.2, -4.2], bot: [-5.2, 1.2, -3.6] };
  const STATES = {
    none: { label: 'Tümör yok', slots: [ZS, ZS, ZS, ZS, ZS, ZS, ZS, ZS], gland: GLAND_N, push: 0 },
    g0: { label: 'Derece 0', slots: [T_A, T_B, ZS, ZS, ZS, ZS, ZS, ZS], gland: GLAND_M, push: 0 },
    g1: { label: 'Derece 1', slots: [T_A, T_B, L1, ZS, ZS, ZS, ZS, ZS], gland: GLAND_M, push: 0 },
    g2: { label: 'Derece 2', slots: [T_A, T_B, L2, ZS, ZS, ZS, ZS, ZS], gland: GLAND_M, push: 0.3 },
    g3a: { label: 'Derece 3A', slots: [T_A, T_B, L2, S3, ZS, ZS, ZS, ZS], gland: GLAND_M, push: 2.6 },
    g3b: { label: 'Derece 3B', slots: [T_A, T_B, L2, ZS, C3, I3, ZS, ZS], gland: GLAND_M, push: 2.0 },
    g4: { label: 'Derece 4', slots: [T_A, T_B, L2, S3, C3, I3, LC, EX], gland: GLAND_M, push: 3.2 }
  };
  // collapsed slots grow from the nearest active lobe so morphs look organic
  function lerpArr(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }
  function lerpState(sa, sb, t) {
    const slots = sa.slots.map((s, i) => {
      let a = s, b = sb.slots[i];
      if (a === ZS && b !== ZS) a = [b[0] * 0.6, b[1] * 0.6, b[2], 0.01, 0.01, 0.01];
      if (b === ZS && a !== ZS) b = [a[0] * 0.6, a[1] * 0.6, a[2], 0.01, 0.01, 0.01];
      return lerpArr(a, b, t);
    });
    const g = {};
    for (const k of ['a', 'p', 'mid', 'bot']) g[k] = lerpArr(sa.gland[k], sb.gland[k], t);
    return { slots, gland: g, push: sa.push + (sb.push - sa.push) * t };
  }
  function tumorRaw(x, y, z, slots) {
    let d = 1e3;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (s[3] < 0.05) continue;
      // cheap reject
      const m = Math.max(s[3], s[4], s[5]) + 3;
      if (abs(x - s[0]) > m || abs(y - s[1]) > m || abs(z - s[2]) > m) { d = smin(d, 3, 1.8); continue; }
      d = smin(d, sdEll(x, y, z, s[0], s[1], s[2], s[3], s[4], s[5]), 1.8);
    }
    return d;
  }
  function tumorSDF(x, y, z, st, icaD, optD, nz) {
    let d = tumorRaw(x, y, z, st.slots);
    if (d > 4) return d;
    d += 0.25 * nz;
    d = smax(d, -(icaD - 0.35), 0.5);
    d = smax(d, -(optD - 0.2), 0.5);
    return d;
  }
  function glandSDF(x, y, z, st, tumD, icaD) {
    const g = st.gland;
    let d = sdEll(x, y, z, ...g.a);
    d = smin(d, sdEll(x, y, z, ...g.p), 1.2);
    const T = A.stalkTop;
    d = smin(d, sdCone(x, y, z, T[0], T[1], T[2], g.mid[0], g.mid[1], g.mid[2], 1.6, 1.15), 1.0);
    d = smin(d, sdCone(x, y, z, g.mid[0], g.mid[1], g.mid[2], g.bot[0], g.bot[1], g.bot[2], 1.15, 1.2), 1.0);
    if (tumD < 3) d = smax(d, -(tumD - 0.25), 0.6);
    if (icaD < 3) d = smax(d, -(icaD - 0.3), 0.5);
    return d;
  }

  // ---------- Knosp lines at a coronal plane ----------
  // Uses the dense ICA path; finds crossings of z = zc in the siphon (control params 3.5 .. 12).
  function knospAt(icaPath, zc) {
    const hits = [];
    for (let i = 0; i < icaPath.n - 1; i++) {
      const c = icaPath.C[i];
      if (c < 3.6 || c > 12) continue;
      const z0 = icaPath.Z[i] - zc, z1 = icaPath.Z[i + 1] - zc;
      if ((z0 <= 0 && z1 > 0) || (z0 > 0 && z1 <= 0)) {
        const t = z0 / (z0 - z1);
        hits.push({ x: icaPath.X[i] + (icaPath.X[i + 1] - icaPath.X[i]) * t, y: icaPath.Y[i] + (icaPath.Y[i + 1] - icaPath.Y[i]) * t, r: icaPath.R[i] + (icaPath.R[i + 1] - icaPath.R[i]) * t, c });
      }
    }
    if (hits.length < 2) return null;
    hits.sort((a, b) => a.y - b.y);
    const lo = hits[0], up = hits[hits.length - 1];
    if (up.y - lo.y < 4) return null;
    const dx = up.x - lo.x, dy = up.y - lo.y, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;
    let nx = uy, ny = -ux; if (nx < 0) { nx = -nx; ny = -ny; } // lateral normal (+x)
    const ext = 4.5;
    const mk = (off0, off1) => [[lo.x + nx * off0 - ux * ext, lo.y + ny * off0 - uy * ext], [up.x + nx * off1 + ux * ext, up.y + ny * off1 + uy * ext]];
    return { lo, up, n: [nx, ny], u: [ux, uy], medial: mk(-lo.r, -up.r), central: mk(0, 0), lateral: mk(lo.r, up.r) };
  }
  // x of a Knosp line at height y (line given as two 2D points)
  function lineX(line, y) { const [a, b] = line; const t = (y - a[1]) / (b[1] - a[1]); return a[0] + (b[0] - a[0]) * t; }

  function tumorNoise(x, y, z) { return fbm(x * 0.32 + 11.3, y * 0.32, z * 0.32); }

  return { noise3, fbm, sdEll, sdRBox, sdCone, smin, smax, makePath, mirror, A, P, boneSDF, airSDF, fossaSDF, csStatic, csSDF, pushW, opticSDF, tumorNoise,
    STATES, lerpState, tumorRaw, tumorSDF, glandSDF, knospAt, lineX };
})();
