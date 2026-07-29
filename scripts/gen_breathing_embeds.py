#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates the two paste-ready article embeds for the figure-8 breathing method.

Output (docs/):
  breathing-1-method.embed.html   — the method, one body
  breathing-2-union.embed.html    — the merged body

Both are JS-free on purpose: article bodies are injected with
dangerouslySetInnerHTML (client/src/pages/ArticlePage.tsx), which never executes
<script>. The runner is a zero-length round dash travelling along the path via a
CSS stroke-dashoffset animation, so the motion is pure CSS.

Conventions from feature-prompts/html-embed-block/03_adapt-acim-diagram.md:
  - every selector prefixed with `.html-embed `
  - dark mode via `.dark ` prefixes, not prefers-color-scheme
  - artifact tokens (--surface-1, --text-primary, …) come from the CSS bridge
"""

import math
import os

PI, TAU = math.pi, 2 * math.pi

# ---------------------------------------------------------------- breath timing
IN, TURN, EX = 6500, 5000, 6500
TOTAL = IN + TURN + EX + TURN                       # 23 s
P1 = IN / TOTAL * 100                               # end of inhale
P2 = (IN + TURN) / TOTAL * 100                      # end of first turn
P3 = (IN + TURN + EX) / TOTAL * 100                 # end of exhale

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")


# ---------------------------------------------------------------- geometry
def pt(t, g):
    s = math.sin(t) * math.cos(t)
    a = -g["A"] if g["fl"] else g["A"]
    return (g["cx"] + a * s, g["cy"] - g["h"] * math.cos(t))


def poly(t0, t1, n, g):
    return [pt(t0 + (t1 - t0) * i / n, g) for i in range(n + 1)]


def d_of(pts):
    return "M" + "L".join("%.1f %.1f" % p for p in pts)


def arc(t0, t1, g, n=64, pad=0.012):
    p = (t1 - t0) * pad
    return d_of(poly(t0 - p, t1 + p, n, g))


def tangent(t0, t1, f, g):
    t = t0 + (t1 - t0) * f
    e = (t1 - t0) * 0.008
    a, b = pt(t - e, g), pt(t + e, g)
    return ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2,
            math.degrees(math.atan2(b[1] - a[1], b[0] - a[0])))


def cum(pts):
    c = [0.0]
    for i in range(1, len(pts)):
        c.append(c[-1] + math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    return c


# ------------------------------------------------- the runner's path + keyframes
def runner(t_start, g, name, sgn=1, n=520, steps=20):
    """Full-8 path starting at the inhale strand, plus the dashoffset keyframes.

    The eased profile (0.5-0.5cos) makes the speed fall to zero at every pole,
    and the turning arcs get a long duration over a short arc — a near-stop.
    """
    pts = poly(t_start, t_start + sgn * TAU, n, g)
    cl = cum(pts)
    L = cl[-1]

    def dist(t):
        x = (t - t_start) / (sgn * TAU) * n
        i = max(0, min(n - 1, int(x)))
        return cl[i] + (cl[i + 1] - cl[i]) * (x - i)

    q = sgn * PI / 2
    sched = [(t_start, t_start + q, IN),
             (t_start + q, t_start + 2 * q, TURN),
             (t_start + 2 * q, t_start + 3 * q, EX),
             (t_start + 3 * q, t_start + 4 * q, TURN)]

    rows, elapsed = [], 0
    for si, (a, b, dur) in enumerate(sched):
        for j in range(steps + 1):
            if si and j == 0:
                continue
            u = j / steps
            eased = 0.5 - 0.5 * math.cos(PI * u)
            rows.append(((elapsed + dur * u) / TOTAL * 100,
                         dist(a + (b - a) * eased)))
        elapsed += dur

    body = "".join("%.3f%%{stroke-dashoffset:%.2f}" % (p, -d) for p, d in rows)
    return d_of(pts), L, "@keyframes %s{%s}" % (name, body)


# ---------------------------------------------------------------- svg fragments
def arrow(t0, t1, f, g, col):
    x, y, a = tangent(t0, t1, f, g)
    return ('<g transform="translate(%.2f,%.2f) rotate(%.2f)">'
            '<path d="M -8 -9 L 10 0 L -8 9 Z" fill="%s" stroke="var(--b8-card)" '
            'stroke-width="1.6" stroke-linejoin="round"/></g>' % (x, y, a, col))


def badge(x, y, sign, r=22, fs=32):
    cls = "minus" if sign == "-" else "plus"
    return ('<g class="b8-badge b8-%s"><circle cx="%.1f" cy="%.1f" r="%d"/>'
            '<text x="%.1f" y="%.1f" style="font-size:%dpx">%s</text></g>'
            % (cls, x, y, r, x, y + 1, fs, "−" if sign == "-" else "+"))


def label(x, y, txt, anchor, cls="b8-organ"):
    return '<text class="%s" x="%.1f" y="%.1f" text-anchor="%s">%s</text>' % (cls, x, y, anchor, txt)


def grad(gid, p0, p1, c0, c1):
    return ('<linearGradient id="%s" gradientUnits="userSpaceOnUse" x1="%.1f" y1="%.1f" '
            'x2="%.1f" y2="%.1f"><stop offset="0%%" stop-color="%s"/>'
            '<stop offset="100%%" stop-color="%s"/></linearGradient>'
            % (gid, p0[0], p0[1], p1[0], p1[1], c0, c1))


MINUS, PLUS = "var(--b8-minus)", "var(--b8-plus)"


def runner_markup(cls, track, ref):
    """Three stacked <use> of the same track: blurred glow, card-coloured ring, core."""
    return ('<g class="b8-run %s %s">'
            '<use href="#%s" class="b8-glowdot"/>'
            '<use href="#%s" class="b8-ring"/>'
            '<use href="#%s" class="b8-core"/></g>'
            % (cls, track, ref, ref, ref))


def eight(g, uid, poles, reverse=False):
    """One complete figure-8: ribbon, coloured strands, arrows, runner.

    poles maps the four extremes to a sign, named in the unmirrored frame:
    ur = top-front, ll = bottom-back, lr = bottom-front, ul = top-back.
    reverse traverses the 8 the other way round; the inhale strand is always
    the one joining the two minus poles, and the runner starts there.
    """
    T = {"ur": PI / 4, "ll": 3 * PI / 4, "lr": 5 * PI / 4, "ul": 7 * PI / 4}
    col = {k: (MINUS if v == "-" else PLUS) for k, v in poles.items()}

    if reverse:
        order = [("A", "ll", "ur"), ("capTop", "ur", "ul"),
                 ("B", "ul", "lr"), ("capBottom", "lr", "ll")]
        tv = [3 * PI / 4, PI / 4, -PI / 4, -3 * PI / 4, -5 * PI / 4]
        sgn = -1
    else:
        order = [("A", "ur", "ll"), ("capBottom", "ll", "lr"),
                 ("B", "lr", "ul"), ("capTop", "ul", "ur")]
        tv = [PI / 4, 3 * PI / 4, 5 * PI / 4, 7 * PI / 4, 9 * PI / 4]
        sgn = 1

    seg = {name: (tv[i], tv[i + 1], a, b) for i, (name, a, b) in enumerate(order)}

    # each strand joins two identical poles; the minus one is the inhale
    inhale = "A" if poles["ur"] == "-" else "B"
    rpath, L, kf = runner(seg[inhale][0], g, "b8run%s" % uid, sgn)

    gA = "b8-glow-in" if inhale == "A" else "b8-glow-ex"
    gB = "b8-glow-ex" if inhale == "A" else "b8-glow-in"

    dA = arc(seg["A"][0], seg["A"][1], g)
    dB = arc(seg["B"][0], seg["B"][1], g)
    dCB = arc(seg["capBottom"][0], seg["capBottom"][1], g)
    dCT = arc(seg["capTop"][0], seg["capTop"][1], g)

    def cap_grad(gid, name):
        t0, t1, p0, p1 = seg[name]
        return grad(gid, pt(t0, g), pt(t1, g), col[p0], col[p1])

    # every path is defined once and referenced; the closed track doubles as the ribbon
    s = ['<defs>%s%s'
         '<path id="tk%s" fill="none" d="%s"/>'
         '<path id="sa%s" fill="none" d="%s"/><path id="sb%s" fill="none" d="%s"/>'
         '<path id="cb%s" fill="none" d="%s"/><path id="ct%s" fill="none" d="%s"/>'
         '</defs>'
         % (cap_grad("gb%s" % uid, "capBottom"), cap_grad("gt%s" % uid, "capTop"),
            uid, rpath, uid, dA, uid, dB, uid, dCB, uid, dCT)]

    s.append('<use href="#tk%s" class="b8-back"/>' % uid)
    s.append('<use href="#cb%s" class="b8-seg" stroke="url(#gb%s)"/>' % (uid, uid))
    s.append('<use href="#ct%s" class="b8-seg" stroke="url(#gt%s)"/>' % (uid, uid))

    s.append('<use href="#sa%s" class="b8-strandglow %s" stroke="%s"/>' % (uid, gA, col["ur"]))
    s.append('<use href="#sa%s" class="b8-seg" stroke="%s"/>' % (uid, col["ur"]))
    s.append('<use href="#sa%s" class="b8-flow %s"/>' % (uid, gA))

    s.append('<use href="#sb%s" class="b8-halo"/>' % uid)
    s.append('<use href="#sb%s" class="b8-strandglow %s" stroke="%s"/>' % (uid, gB, col["lr"]))
    s.append('<use href="#sb%s" class="b8-seg" stroke="%s"/>' % (uid, col["lr"]))
    s.append('<use href="#sb%s" class="b8-flow %s"/>' % (uid, gB))

    for name, c in (("A", col["ur"]), ("B", col["lr"])):
        for f in (0.30, 0.73):
            s.append(arrow(seg[name][0], seg[name][1], f, g, c))

    return "".join(s), "tk%s" % uid, L, kf, T


# =============================================================== diagram 1
# two standalone maps, one per sex — each with its own four labels and its own
# front/back marking, since neither has the other body to orient against
ONE = dict(cx=340, cy=350, A=300, h=200, fl=False)   # front on the right
VB1 = "85 118 545 480"


def one_body(sex):
    pol = ({"ur": "-", "ll": "-", "lr": "+", "ul": "+"} if sex == "male" else
           {"ur": "+", "ll": "+", "lr": "-", "ul": "-"})
    uid = "M" if sex == "male" else "F"
    genitals = "איבר המין" if sex == "male" else "אזור המין"

    # the male's 8 is traversed the other way round, so that both sexes end up
    # inhaling on the way up — and so that both agree with the merged 8 of the
    # second article, where his ישבן and her גב sit on the same minus line
    body, ref, L, kf, T = eight(ONE, uid, pol, reverse=(sex == "male"))

    svg = ['<svg class="b8-svg" viewBox="%s" xmlns="http://www.w3.org/2000/svg" '
           'role="img" aria-label="מפת ה־8 — %s">' % (VB1, "זכר" if sex == "male" else "נקבה")]
    svg.append(body)
    for key, sign in pol.items():
        x, y = pt(T[key], ONE)
        svg.append(badge(x, y, sign))

    fx, bx = pt(T["ur"], ONE)[0] + 34, pt(T["ul"], ONE)[0] - 34
    svg.append(label(fx, 209, "חזה", "start"))
    svg.append(label(bx, 209, "גב", "end"))
    svg.append(label(bx, 491, "ישבן", "end"))
    svg.append(label(fx, 491, genitals, "start", "b8-organ b8-lg"))
    svg.append(label(fx, 491, "מין", "start", "b8-organ b8-sm"))

    svg.append(label(628, 590, "קדימה ▸", "end", "b8-side"))
    svg.append(label(87, 590, "◂ אחורה", "start", "b8-side"))

    track = "b8-trackM" if sex == "male" else "b8-trackF"
    svg.append(runner_markup("b8-run-in", track, ref))
    svg.append(runner_markup("b8-run-ex", track, ref))
    svg.append("</svg>")
    return "".join(svg), kf, L


def diagram_one():
    sm, kfm, Lm = one_body("male")
    sf, kff, Lf = one_body("female")
    return sm, sf, kfm, kff, Lm, Lf


# =============================================================== diagram 2
def diagram_two():
    g = dict(cx=500, cy=380, A=320, h=212, fl=False)
    # outer poles of the merged body
    pol = {"ur": "+",   # his back
           "lr": "-",   # his buttocks
           "ul": "-",   # her back
           "ll": "+"}   # her buttocks
    body, uref, L, kf, T = eight(g, "U", pol)

    SEAM = "M 500 120 C 600 180,600 300,500 380 C 400 460,400 580,500 640"
    BODY_F = SEAM + " L 410 640 Q 340 640 340 570 L 340 190 Q 340 120 410 120 Z"
    BODY_M = SEAM + " L 590 640 Q 660 640 660 570 L 660 190 Q 660 120 590 120 Z"

    svg = ['<svg class="b8-svg" viewBox="180 62 640 620" xmlns="http://www.w3.org/2000/svg" '
           'role="img" aria-label="הגוף המאוחד — 8 אחת">']
    svg.append('<path class="b8-bodyF" d="%s"/><path class="b8-bodyM" d="%s"/>'
               '<path class="b8-seam" d="%s"/>' % (BODY_F, BODY_M, SEAM))
    svg.append(label(420, 100, "נקבה", "middle", "b8-who"))
    svg.append(label(580, 100, "זכר", "middle", "b8-who"))

    # the two neutralised contacts, drawn under the ribbon
    for cx, cy, left, right in ((575, 242, "+", "-"), (425, 517, "-", "+")):
        svg.append('<rect class="b8-cancel" x="%.1f" y="%.1f" width="80" height="42" rx="21"/>'
                   % (cx - 40, cy - 21))
        for dx, sg in ((-17, left), (17, right)):
            cls = "minus" if sg == "-" else "plus"
            svg.append('<g class="b8-mini b8-%s"><circle cx="%.1f" cy="%.1f" r="15"/>'
                       '<text x="%.1f" y="%.1f">%s</text></g>'
                       % (cls, cx + dx, cy, cx + dx, cy + 1, "−" if sg == "-" else "+"))

    svg.append(body)

    long_ = {"ur": "גב · זכר", "lr": "ישבן · זכר", "ul": "גב · נקבה", "ll": "ישבן · נקבה"}
    short = {"ur": "גב", "lr": "ישבן", "ul": "גב", "ll": "ישבן"}
    for key, sign in pol.items():
        x, y = pt(T[key], g)
        svg.append(badge(x, y, sign, r=24, fs=34))
        out = 1 if x > g["cx"] else -1
        anchor = "start" if out > 0 else "end"
        # the long form would overflow the viewBox once the mobile media query
        # scales the type up, so a short form takes over there
        svg.append(label(x + out * 36, y, long_[key], anchor, "b8-organ b8-lg"))
        svg.append(label(x + out * 36, y, short[key], anchor, "b8-organ b8-sm"))

    svg.append(runner_markup("b8-run-in", "b8-trackU", uref))
    svg.append(runner_markup("b8-run-ex", "b8-trackU", uref))
    svg.append("</svg>")
    return "".join(svg), kf, L


# ---------------------------------------------------------------- shared CSS
def css(scope, keyframes, dash_rules):
    return """
/* ==== %(scope)s : self-contained, no JS ==== */
/* dark only, on purpose: the block carries its own surface so it looks the
   same whatever theme the surrounding page happens to be in */
.html-embed .b8{
  --b8-minus:#5b9dfb; --b8-minus-soft:#16304f;
  --b8-plus:#f97070;  --b8-plus-soft:#45191a;
  --b8-neutral:#45413a;
  --b8-bodyA:#1f1c17; --b8-bodyB:#38322a; --b8-bodyline:#57503f;
  --b8-card:#1d1c18; --b8-surface2:#26241f;
  --b8-ink:#f0eee8; --b8-muted:#a09a8e; --b8-line:#33312b;
  direction:rtl; line-height:1.85;
  background:#14130f; color:var(--b8-ink);
  border:1px solid var(--b8-line); border-radius:16px;
  padding:1.4em 1.5em 1.6em;
}

.html-embed .b8 h2{font-size:1.45em;margin:0 0 .5em;line-height:1.35}
.html-embed .b8 h3{font-size:1.1em;margin:1.6em 0 .4em}
.html-embed .b8 h4{font-size:1em;margin:1.2em 0 .3em;color:var(--b8-muted);letter-spacing:.02em}
.html-embed .b8 ol{margin:.2em 0 1em;padding-inline-start:1.35em}
.html-embed .b8 ol li{margin:.35em 0}
.html-embed .b8 p{margin:0 0 .9em;color:var(--b8-ink)}
.html-embed .b8 ul{margin:.2em 0 1em;padding-inline-start:1.25em}
.html-embed .b8 li{margin:.3em 0}
.html-embed .b8 .b8-lead{font-size:1.06em;color:var(--b8-muted)}
.html-embed .b8 .b8-rule{background:var(--b8-surface2);border:1px solid var(--b8-line);
  border-radius:12px;padding:.85em 1.1em;margin:1.2em 0}
.html-embed .b8 .b8-rule p:last-child{margin:0}
.html-embed .b8 b{font-weight:700}

/* --- the figure --- */
.html-embed .b8-fig:first-child{margin-top:0}
.html-embed .b8-fig{background:var(--b8-card);border:1px solid var(--b8-line);
  border-radius:14px;padding:.6em .4em .8em;margin:1.4em 0}
.html-embed .b8-svg{display:block;width:100%%;height:auto;direction:ltr}
.html-embed .b8-phase{display:grid;justify-items:center;margin:.1em 0 .4em}
.html-embed .b8-phase > span{grid-area:1/1;font-size:.85em;font-weight:700;
  padding:.25em .9em;border-radius:999px;border:1.5px solid var(--b8-line);
  background:var(--b8-surface2);color:var(--b8-muted);opacity:0}
.html-embed .b8-ph-in{background:var(--b8-minus-soft);color:var(--b8-minus);border-color:var(--b8-minus)}
.html-embed .b8-ph-ex{background:var(--b8-plus-soft);color:var(--b8-plus);border-color:var(--b8-plus)}
.html-embed .b8-figtitle{text-align:center;font-weight:700;font-size:1.05em;margin:.15em 0 .1em;letter-spacing:.03em}\n.html-embed .b8-side{font-size:17px;fill:var(--b8-muted);letter-spacing:.03em}\n.html-embed .b8-cap{text-align:center;font-size:.85em;color:var(--b8-muted);margin:.2em .6em 0}

.html-embed .b8-legend{display:flex;flex-wrap:wrap;gap:.5em 1.4em;justify-content:center;
  font-size:.88em;color:var(--b8-muted);margin:.9em 0 1.9em}
.html-embed .b8-legend span{display:inline-flex;align-items:center;gap:.45em}
.html-embed .b8-sw{width:30px;height:8px;border-radius:99px;display:inline-block}
.html-embed .b8-sw-m{background:var(--b8-minus)} .html-embed .b8-sw-p{background:var(--b8-plus)}
.html-embed .b8-pl{display:inline-flex;width:22px;height:22px;border-radius:50%%;
  align-items:center;justify-content:center;font-weight:800;font-size:14px}
.html-embed .b8-pl-m{background:var(--b8-minus-soft);color:var(--b8-minus);border:2px solid var(--b8-minus)}
.html-embed .b8-pl-p{background:var(--b8-plus-soft);color:var(--b8-plus);border:2px solid var(--b8-plus)}

/* --- svg parts --- */
.html-embed .b8-back{fill:none;stroke:var(--b8-neutral);stroke-width:15;stroke-linecap:round;opacity:.5}
.html-embed .b8-seg{fill:none;stroke-width:10;stroke-linecap:round}
.html-embed .b8-halo{fill:none;stroke:var(--b8-card);stroke-width:22;stroke-linecap:round}
.html-embed .b8-strandglow{fill:none;stroke-width:24;stroke-linecap:round;opacity:0;filter:blur(6px)}
.html-embed .b8-flow{fill:none;stroke:#fff;stroke-width:3.2;stroke-linecap:round;
  stroke-dasharray:9 21;opacity:0}
.html-embed .b8-badge circle{stroke-width:3}
.html-embed .b8-minus circle{fill:var(--b8-minus-soft);stroke:var(--b8-minus)}
.html-embed .b8-plus  circle{fill:var(--b8-plus-soft);stroke:var(--b8-plus)}
.html-embed .b8-badge text{font-weight:800;text-anchor:middle;dominant-baseline:central}
.html-embed .b8-minus text{fill:var(--b8-minus)} .html-embed .b8-plus text{fill:var(--b8-plus)}
.html-embed .b8-mini circle{stroke-width:2.5;opacity:.5}
.html-embed .b8-mini text{font-size:21px;font-weight:800;text-anchor:middle;
  dominant-baseline:central;opacity:.55}
.html-embed .b8-cancel{fill:none;stroke:var(--b8-neutral);stroke-width:2;stroke-dasharray:5 5}
.html-embed .b8-organ{font-size:20px;fill:var(--b8-ink);font-weight:600;dominant-baseline:central}
.html-embed .b8-sm{display:none}
.html-embed .b8-who{font-size:21px;fill:var(--b8-muted);font-weight:600;letter-spacing:.04em}
.html-embed .b8-bodyF{fill:var(--b8-bodyA);stroke:var(--b8-bodyline);stroke-width:2}
.html-embed .b8-bodyM{fill:var(--b8-bodyB);stroke:var(--b8-bodyline);stroke-width:2}
.html-embed .b8-seam{fill:none;stroke:var(--b8-bodyline);stroke-width:2.5}

/* --- the single runner: a zero-length round dash sliding along the whole 8 --- */
.html-embed .b8-run use{fill:none;stroke-linecap:round}
.html-embed .b8-glowdot{stroke-width:40;opacity:.2;filter:blur(6px)}
.html-embed .b8-ring{stroke:var(--b8-card);stroke-width:26}
.html-embed .b8-core{stroke-width:20}
.html-embed .b8-run-in .b8-glowdot,.html-embed .b8-run-in .b8-core{stroke:var(--b8-minus)}
.html-embed .b8-run-ex .b8-glowdot,.html-embed .b8-run-ex .b8-core{stroke:var(--b8-plus)}
.html-embed .b8-run-in{animation:b8fadeIn %(total)dms linear infinite}
.html-embed .b8-run-ex{animation:b8fadeEx %(total)dms linear infinite}
.html-embed .b8-glow-in{animation:b8glowIn %(total)dms linear infinite}
.html-embed .b8-glow-ex{animation:b8glowEx %(total)dms linear infinite}
.html-embed .b8-flow.b8-glow-in{animation:b8dash 1.6s linear infinite,b8flowIn %(total)dms linear infinite}
.html-embed .b8-flow.b8-glow-ex{animation:b8dash 1.6s linear infinite,b8flowEx %(total)dms linear infinite}
.html-embed .b8-ph-in{animation:b8phIn %(total)dms linear infinite}
.html-embed .b8-ph-turn{animation:b8phTurn %(total)dms linear infinite}
.html-embed .b8-ph-ex{animation:b8phEx %(total)dms linear infinite}

@keyframes b8dash{to{stroke-dashoffset:-30}}
@keyframes b8fadeIn{0%%,%(p1).3f%%{opacity:1}%(p2).3f%%,%(p3).3f%%{opacity:0}100%%{opacity:1}}
@keyframes b8fadeEx{0%%,%(p1).3f%%{opacity:0}%(p2).3f%%,%(p3).3f%%{opacity:1}100%%{opacity:0}}
@keyframes b8glowIn{0%%,%(p1).3f%%{opacity:.30}%(p2).3f%%,%(p3).3f%%{opacity:0}100%%{opacity:.30}}
@keyframes b8glowEx{0%%,%(p1).3f%%{opacity:0}%(p2).3f%%,%(p3).3f%%{opacity:.30}100%%{opacity:0}}
@keyframes b8flowIn{0%%,%(p1).3f%%{opacity:.85}%(p2).3f%%,%(p3).3f%%{opacity:0}100%%{opacity:.85}}
@keyframes b8flowEx{0%%,%(p1).3f%%{opacity:0}%(p2).3f%%,%(p3).3f%%{opacity:.85}100%%{opacity:0}}
@keyframes b8phIn{0%%,%(p1a).3f%%{opacity:1}%(p1).3f%%,100%%{opacity:0}}
@keyframes b8phTurn{0%%,%(p1a).3f%%{opacity:0}%(p1).3f%%,%(p2a).3f%%{opacity:1}%(p2).3f%%,%(p3a).3f%%{opacity:0}%(p3).3f%%,100%%{opacity:1}}
@keyframes b8phEx{0%%,%(p2a).3f%%{opacity:0}%(p2).3f%%,%(p3a).3f%%{opacity:1}%(p3).3f%%,100%%{opacity:0}}
%(keyframes)s
%(dash)s

@media (max-width:620px){
  .html-embed .b8{padding:1.1em 1em 1.2em}
  .html-embed .b8-lg{display:none}
  .html-embed .b8-sm{display:inline}
  .html-embed .b8-organ{font-size:30px}
  .html-embed .b8-who{font-size:31px}\n  .html-embed .b8-side{font-size:26px}
  .html-embed .b8-badge text{font-size:44px}
  .html-embed .b8-legend{gap:.4em .9em;font-size:.82em}
}
@media (prefers-reduced-motion:reduce){
  .html-embed .b8 *{animation:none !important}
  .html-embed .b8-run-ex{opacity:0}
}
""" % dict(scope=scope, total=TOTAL, p1=P1, p2=P2, p3=P3,
           p1a=P1 - 0.01, p2a=P2 - 0.01, p3a=P3 - 0.01,
           keyframes=keyframes, dash=dash_rules)


PHASE = ('<div class="b8-phase"><span class="b8-ph-in">שאיפה</span>'
         '<span class="b8-ph-turn">מפנה</span>'
         '<span class="b8-ph-ex">נשיפה</span></div>')

LEGEND = ('<div class="b8-legend">'
          '<span><i class="b8-pl b8-pl-p">+</i> איבר בולט</span>'
          '<span><i class="b8-pl b8-pl-m">−</i> איבר שקוע</span>'
          '<span><i class="b8-sw b8-sw-m"></i> קו המינוס = שאיפה</span>'
          '<span><i class="b8-sw b8-sw-p"></i> קו הפלוס = נשיפה</span>'
          '</div>')


# ---------------------------------------------------------------- articles
ART1 = """<div class="b8 b8-1">
<div class="b8-fig">
<div class="b8-figtitle">זכר</div>
%(phase)s
%(svg_m)s
<div class="b8-cap">החזה והישבן <b>שקועים</b> (−) — הם קו השאיפה. הגב ואיבר המין
<b>בולטים</b> (+) — הם קו הנשיפה. שימו לב לחצים: שני האלכסונים נעים מהגב אל החזית —
<b>החוצה</b>.</div>
</div>

<div class="b8-fig">
<div class="b8-figtitle">נקבה</div>
%(phase)s
%(svg_f)s
<div class="b8-cap">כאן הכול הפוך: הגב ואזור המין <b>שקועים</b> (−) — הם קו השאיפה.
החזה והישבן <b>בולטים</b> (+) — הם קו הנשיפה. והחצים הפוכים: שני האלכסונים נעים
מהחזית אל הגב — <b>פנימה</b>.</div>
</div>
%(legend)s

<p class="b8-lead">לפני כעשרים שנה התגלתה אלי שיטת נשימה, שלמיטב ידיעתי איננה קיימת בשום
מקום אחר. השיטה פשוטה, עם היגיון ברור המבוסס על האנטומיה האנושית.</p>

<p>למרות שהשיטה מזכירה טנטרה, למיטב ידיעתי היא איננה כלולה בשום מסורת ידועה. למרות זאת,
אני חושב שההיגיון האנטומי שבשיטה הופך אותה למדויקת יותר מכל שיטה אחרת.</p>

<h3>בולט ושקוע</h3>
<p>יש איברים <b>בולטים</b>, שיוצאים החוצה מקו הגוף, ויש איברים <b>שקועים</b>, שנכנסים
פנימה. לבולט נסמן <b>+</b>, לשקוע נסמן <b>−</b>.</p>

<p>אצל הזכר: החזה שקוע (−) והגב בולט (+); איבר המין בולט (+) והישבן שקוע (−). אצל הנקבה
זה הפוך בכל ארבעת האיברים: החזה בולט (+) והגב שקוע (−); אזור המין שקוע (−) והישבן
בולט (+). לא איבר אחד נשאר באותו קוטב — <b>שתי המפות הן היפוך מלא זו של זו</b>.</p>

<h3>המפה בצורת 8</h3>
<p>עכשיו נצייר על הגוף ספרה 8 גדולה: העיגול העליון על פלג הגוף העליון, העיגול התחתון על
האגן, והחיתוך ביניהם במותניים. לכל עיגול יש צד קדמי וצד אחורי — וכך מתקבלות ארבע נקודות
קיצון, שהן בדיוק ארבעת האיברים: חזה וגב למעלה, איבר המין והישבן למטה.</p>

<h3>שני הקווים שנחתכים</h3>
<p>ה־8 היא קו אחד רציף שחוצה את עצמו במרכז. בנקודת החיתוך נפגשים שני גדילים, וכל אחד מהם
מחבר בין שני קטבים <b>זהים</b>:</p>
<ul>
<li>אצל הזכר: גדיל אחד מחבר את החזה (−) לישבן (−) — שני מינוסים. השני מחבר את הגב (+)
לאיבר המין (+) — שני פלוסים.</li>
<li>אצל הנקבה, מאותו היגיון בדיוק, הגדילים מתחלפים: קו המינוס מחבר את הגב לאזור המין,
וקו הפלוס מחבר את החזה לישבן.</li>
</ul>

<div class="b8-rule">
<p><b>הכלל כולו:</b> קו המינוס — שקוע אל שקוע — הוא תמיד קו ה<b>שאיפה</b>.
קו הפלוס — בולט אל בולט — הוא תמיד קו ה<b>נשיפה</b>.</p>
<p>הכלל זהה לגמרי בשני המינים. אבל מכיוון שהקטבים עצמם הפוכים, <b>הקווים מתחלפים</b>:
האלכסון שהוא שאיפה אצל הזכר הוא בדיוק אותו אלכסון שהוא נשיפה אצל הנקבה.</p>
</div>

<h3>המפנה</h3>
<p>שני הגדילים אינם נפגשים בקצוות; הם מחוברים בקשתות שעוברות בקצה העליון והתחתון של ה־8.
הקשתות האלה הן <b>נקודות המפנה</b> של הנשימה — הרגע שבין השאיפה לנשיפה. שם התנועה כמעט
נעצרת, והקוטביות מתחלפת בהדרגה מגדיל אחד לשני. בציור זה נראה כמעבר צבע איטי.</p>

<h3>איך מתרגלים</h3>
<p>על מנת לתרגל, המצאתי תרגיל צ\'י גונג בעמידה. את התנועה נעשה באמצעות הידיים, אך היא
מדמה את המסלול בתוך הגוף: הידיים מציירות באוויר כעין תנועת 8. החצים בדיאגרמות שלמעלה
מראים בדיוק את הכיוון הזה.</p>

<h4>לזכר</h4>
<ol>
<li>התחל כשהידיים סמוך לבטן התחתונה ולאיבר המין — ושם <b>אסוף את האנרגיה</b>.</li>
<li>הנע את הידיים באלכסון כלפי מעלה ו<b>החוצה</b>, מתרחקות מהגוף, עד גובה החזה.
בזמן התנועה — <b>שאיפה</b>.</li>
<li>קרב את הידיים לחזה.</li>
<li>הפוך את תנועת הידיים לדחיפה אלכסונית כלפי מטה ו<b>החוצה</b>, עד גובה הבטן התחתונה
ואיבר המין. בזמן התנועה — <b>נשיפה</b>.</li>
<li>קרב את הידיים לבטן התחתונה, אסוף את האנרגיה — וחוזר חלילה.</li>
</ol>

<h4>לנקבה</h4>
<p>אותה תנועה בגובה, אבל <b>הפוכה בעומק</b> — האלכסונים נכנסים אל הגוף במקום לצאת ממנו:</p>
<ol>
<li>התחילי כשהידיים מרוחקות מהגוף, בגובה הבטן התחתונה ואזור המין — ושם
<b>אספי את האנרגיה</b>.</li>
<li>הניעי את הידיים באלכסון כלפי מעלה ו<b>פנימה</b>, אל עבר החזה. בזמן התנועה —
<b>שאיפה</b>.</li>
<li>הרחיקי את הידיים מהחזה.</li>
<li>הפכי את תנועת הידיים לדחיפה אלכסונית כלפי מטה ו<b>פנימה</b>, אל הבטן התחתונה
ואזור המין. בזמן התנועה — <b>נשיפה</b>.</li>
<li>הרחיקי את הידיים, אספי את האנרגיה — וחוזר חלילה.</li>
</ol>

<div class="b8-rule">
<p>בשני המינים הידיים <b>עולות בשאיפה ויורדות בנשיפה</b>. ההבדל אינו בגובה אלא
ב<b>עומק</b> — בקירבה לגוף מול ריחוק ממנו:</p>
<p>אצל <b>הזכר</b> שני האלכסונים נעים <b>מהגב אל החזית</b> — מהישבן אל החזה בשאיפה,
ומהגב אל איבר המין בנשיפה. בידיים זה מורגש כתנועה <b>החוצה</b>, מתרחקת מהגוף.</p>
<p>אצל <b>הנקבה</b> שני האלכסונים נעים <b>מהחזית אל הגב</b> — מאזור המין אל הגב בשאיפה,
ומהחזה אל הישבן בנשיפה. בידיים זה מורגש כתנועה <b>פנימה</b>, מתקרבת אל הגוף.</p>
<p>שימו לב שזה אינו מאפיין של שלב הנשימה: אין שלב שבו הזכר נע פנימה או הנקבה החוצה.
הכיוון קבוע לכל אורך המחזור, ושונה בין המינים. כל עוד מסתכלים על גוף אחד ההבדל נראה
שרירותי — <b>הסיבה מתבררת במאמר השני</b>, על הנשימה ביחסי מין.</p>
</div>

<h3>על הקצב</h3>
<p>אני אישית לא אוהב לתת זמנים. לדעתי זה הופך את התרגול למאולץ ולא נכון. הכלל מבחינתי
פשוט: <b>לאט כמה שיותר</b>.</p>
<p>די ברור שבחלק העליון והתחתון של ה־8 מדובר בשאיפה ובנשיפה חלשות, או בעצירה. אני אישית
אוהב רצף, ולכן איני "עוצר את הנשימה" — אבל ככל שאני קרוב יותר לקצה העליון או התחתון של
ה־8, כך השאיפה והנשיפה נחלשות.</p>
<p>שכל אחד יתרגל וימצא את הקצב הנכון עבורו.</p>
</div>"""


ART2 = """<div class="b8 b8-2">
<div class="b8-fig">
%(phase)s
%(svg)s
<div class="b8-cap">שני הפרופילים נכנסים זה בזה. במסגרות המקווקוות — נקודות החיבור
הפנימיות, שכבר אינן חלק מהמעטפת. מה שנשאר בחוץ, שני הגבים ושני הישבנים, מרכיב 8 אחת.</div>
</div>
%(legend)s

<p class="b8-lead">במאמר הקודם תיארתי את מפת ה־8: ארבעה קטבים על הגוף, שני קווים שנחתכים
במרכז, ושאיפה שהולכת תמיד על קו המינוס. כאן אני רוצה לקחת את אותה מפה צעד אחד קדימה —
ולראות מה קורה כששני גופים נפגשים ביחסי מין.</p>

<h3>הגופים משלימים זה את זה בכל נקודה</h3>
<p>כשגבר ואישה עומדים זה מול זה, כל מגע ביניהם הוא בין קטבים הפוכים. אם הבנתם את
הדיאגרמות במאמר הקודם, יהיה לכם קל מאוד להבין מה קורה כאן ביחסי מין.</p>

<p>בגדול: נקודות החיבור הפנימיות — <b>החזה</b> ו<b>איברי המין</b> — מתחברות זו לזו,
ונוצר גוף אחד גדול מאוחד. כלומר בגוף החדש לא נתייחס לנקודות הפנימיות, אלא לחיצוניות:</p>
<ul>
<li>גב — גב</li>
<li>ישבן — ישבן</li>
</ul>
<p>בדיאגרמה תוכלו לראות את זה בצורה פשוטה.</p>

<h3>כיוון החצים</h3>
<p>שימו לב לחצים שעל שני הקווים: <b>בשני השלבים</b> — גם בשאיפה וגם בנשיפה — הזרם
<b>יוצא מהזכר ונכנס לנקבה</b>. אין שלב אחד שבו זה מתהפך.</p>
<p>וזו הסיבה שבמאמר הראשון תנועת הידיים של הזכר היא תמיד <b>החוצה</b>, ושל הנקבה תמיד
<b>פנימה</b>. החוצה ופנימה אינם מאפיין של השאיפה או של הנשיפה — הם מאפיין קבוע של המין
עצמו, ואפשר לראות אותו רק כששני הגופים מצוירים יחד.</p>

<div class="b8-rule">
<p>צורת הנשימה היא <b>זהה לשני המינים</b> — רק שכל אחד מתייחס ל<b>גוף המאוחד</b>,
ולא רק לשלו.</p>
</div>

<h3>איך לתרגל?</h3>
<ol>
<li>קודם כל, שבו זה עם זו.</li>
<li>הגיעו למצב שהנשימה מסתנכרנת — דהיינו ששניכם בקצב אחד.</li>
<li>נשמו בדיוק כמו בתרגול שלכם לבד — רק שהפעם גבולות הגוף שלכם כוללים גם את גבולותיו
של בן או בת הזוג.</li>
</ol>
<p>גם תרגיל הצ\'י גונג שתיארנו קודם מדמה בדיוק את תנועת האנרגיה.</p>
</div>"""


# ---------------------------------------------------------------- build
def main():
    svg1m, svg1f, kf1m, kf1f, L1m, L1f = diagram_one()
    dash1 = (".html-embed .b8-trackF use{stroke-dasharray:0.1 %.1f;"
             "animation:b8runF %dms linear infinite}\n"
             ".html-embed .b8-trackM use{stroke-dasharray:0.1 %.1f;"
             "animation:b8runM %dms linear infinite}\n"
             % (L1f + 60, TOTAL, L1m + 60, TOTAL))
    html1 = ("<style>%s</style>\n%s\n" %
             (css("article 1 — the method", kf1f + "\n" + kf1m, dash1),
              ART1 % dict(phase=PHASE, svg_m=svg1m, svg_f=svg1f, legend=LEGEND)))

    svg2, kf2, L2 = diagram_two()
    dash2 = (".html-embed .b8-trackU use{stroke-dasharray:0.1 %.1f;"
             "animation:b8runU %dms linear infinite}\n" % (L2 + 60, TOTAL))
    html2 = ("<style>%s</style>\n%s\n" %
             (css("article 2 — the union", kf2, dash2),
              ART2 % dict(phase=PHASE, svg=svg2, legend=LEGEND)))

    for name, html in (("breathing-1-method.embed.html", html1),
                       ("breathing-2-union.embed.html", html2)):
        p = os.path.join(OUT, name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(html)
        print("wrote %s (%d bytes)" % (p, len(html)))


if __name__ == "__main__":
    main()
