//@ts-check
import * as ui from "../ui";
const { isSafeInteger: isInt, isFinite: isNum, parseFloat: asNum } = Number;

/** @type {{ s?: string, u?: string }} */
// @ts-ignore
const opts = Object.fromEntries(new URL(location.href).searchParams);

/** @type {HTMLElement} */
const appEl = document.getElementById("app");
if (!appEl) throw new Error("Expected app element!");

/** @param {number} scale */
const randomNum = scale => scale * Math.random();

/** @param {number} scale */
const randomInt = scale => Math.floor(randomNum(scale));

/**
 * @template T
 * @param {T[]} items
 */
const randomItem = items => items[randomInt(items.length)];

/**
 * @param {number} lo
 * @param {number} val
 * @param {number} hi
 */
const clamp = (lo, val, hi) => Math.max(lo, Math.min(hi, val));

/** @param {string} str */
const hash = str =>
    str.split("").reduce((o, s, i) => o * s.codePointAt(0) + i, 1);

/**
 * @param {number} cp0
 * @param {number} num
 */
function getCodePointsFrom(cp0, num) {
    const cps = [];
    for (let i = 0; i < num; i++) {
        cps.push(String.fromCodePoint(cp0 + i));
    }
    return cps;
}

// dice
const cpDieFaces = 0x2680;
const dieFaces = getCodePointsFrom(cpDieFaces, 6);

// cards
/** @param {number} cp0 */
function getCardsForSuit(cp0) {
    const [a, ...lo] = getCodePointsFrom(cp0, 10);
    const [j, c, q, k] = getCodePointsFrom(cp0 + 10, 4);
    return [...lo, j, q, k, a];
}
const cpCardsBack = 0x1f0a0;
const cpCardsSpades = 0x1f0a1;
const cpCardsHearts = 0x1f0b1;
const cpCardsDiamonds = 0x1f0c1;
const cpCardsClubs = 0x1f0d1;
const cardFacesSpades = getCardsForSuit(cpCardsSpades);
const cardFacesHearts = getCardsForSuit(cpCardsHearts);
const cardFacesDiamonds = getCardsForSuit(cpCardsDiamonds);
const cardFacesClubs = getCardsForSuit(cpCardsClubs);
const cardBack = String.fromCodePoint(cpCardsBack);
const cardFaces = [
    ...cardFacesSpades,
    ...cardFacesHearts,
    ...cardFacesDiamonds,
    ...cardFacesClubs
];

/** @param {string} c The card face */
const isCardFaceRed = c =>
    cardFacesHearts.includes(c) || cardFacesDiamonds.includes(c);

const screens = [
    // main screen
    {
        id: "Main",

        substate: ui.datas({}),

        header() {
            ui.text("Winter19 Puzzles");
        },

        footer() {
            if (opts.s) {
                ui.text("Unlock more with another QR Code.").setStyle({
                    margin: "1em",
                    opacity: "0.5"
                });
            }
        },

        content() {
            for (let i = 0; i < screens.length; i++) {
                const { id, inFrom } = screens[i];
                if (inFrom === this.id) {
                    ui.button(id, () => loadScreen(id)).setStyle({
                        background: "none",
                        border: "none",
                        margin: "1vmin"
                    });
                }
                if (opts.s && asNum(opts.s) === i) break;
            }
        }
    },

    // Diagram Solver screens
    {
        id: "Diagram Solver",

        inFrom: "Main",

        outTo: "Diagram Solver 👍",

        get canProceed() {
            return this.substate.isCorrect;
        },

        substate: ui.datas({
            tr: 2,
            br: 3,
            get t() {
                return 10 + (hash(opts.u || "") % 9) * this.tr;
            },
            x: 0,
            y: 0,
            get isCorrect() {
                return (
                    this.x * this.tr === this.t && this.x === this.y + this.br
                );
            }
        }),

        header() {
            ui.text(this.id);
        },

        footer() {
            ui.text("Work backwards to solve the problem.").setStyle({
                opacity: "0.5"
            });
        },

        /**
         * @param {{ cx: number, cy: number, $value?: ui.Binding<string|number>, value?: string|number }} opts
         * @param {ui.BodyLike} circleBody
         */
        uiCircleText({ cx, cy, $value, value = "_" }, circleBody) {
            const c = ui.circle({ cx, cy, r: 9 }, circleBody);
            ui.svgTag("text", () => {
                const val = ($value && $value.value) || value;
                const valStr = `${val}`;
                return {
                    textContent: valStr,
                    attributes: { x: cx, y: cy + 1 },
                    style: {
                        fill: "var(--button-text-color)",
                        stroke: "none",
                        cursor: $value ? "pointer" : "default",
                        textAnchor: "middle",
                        dominantBaseline: "middle"
                    },
                    onclick: $value
                        ? () => ($value.value = prompt("New value?") || 0)
                        : undefined
                };
            });
            return c;
        },

        content() {
            const { substate } = this;
            const { $ } = substate;
            ui.svg(() => {
                ui.currentBody.style = {
                    width: "80vmin",
                    height: "80vmin",
                    fill: "var(--button-background-color)",
                    stroke: "var(--button-text-color)",
                    strokeWidth: "0.5",
                    fontSize: "60%",
                    filter: "drop-shadow(0px 0px 4px #333)"
                };

                ui.svgTag("marker", () => {
                    ui.currentBody.attributes = {
                        id: "tri",
                        refX: 2,
                        refY: 2,
                        markerWidth: 4,
                        markerHeight: 4,
                        orient: "auto"
                    };
                    ui.svgTag("path").setAttributes({
                        d: "M 0 0 L 4 2 L 0 4 z",
                        stroke: "none",
                        fill: "var(--button-text-color)"
                    });
                });

                const css = () => ({
                    style: {
                        fill: substate.isCorrect ? "#0b0" : ""
                    }
                });

                const { t } = substate;
                this.uiCircleText({ cx: 55, cy: 10, value: t }, () => css());

                const lineEnd = { markerEnd: "url(#tri)" };
                const xs = { stroke: "#04f", ...lineEnd };
                const ts = { textAnchor: "middle", dominantBaseline: "middle" };
                ui.line({ x1: 45, y1: 30, x2: 50, y2: 20 }).setStyle(xs);
                ui.line({ x1: 65, y1: 30, x2: 60, y2: 20 }).setStyle(xs);
                ui.svgTag("text", () => ({
                    textContent: "✕",
                    attributes: { x: 55, y: 40 },
                    style: { fill: "#04f", stroke: "none", ...ts }
                }));

                const { tr } = substate;
                this.uiCircleText({ cx: 40, cy: 40, $value: $.x }, () => css());
                this.uiCircleText({ cx: 70, cy: 40, value: tr }, () => css());

                const ys = { stroke: "red", strokeDasharray: "1", ...lineEnd };
                ui.line({ x1: 30, y1: 60, x2: 35, y2: 50 }).setStyle(ys);
                ui.line({ x1: 50, y1: 60, x2: 45, y2: 50 }).setStyle(ys);
                ui.svgTag("text", () => ({
                    textContent: "+",
                    attributes: { x: 40, y: 70 },
                    style: { fill: "red", stroke: "none", ...ts }
                }));

                const { br } = substate;
                this.uiCircleText({ cx: 25, cy: 70, $value: $.y }, () => css());
                this.uiCircleText({ cx: 55, cy: 70, value: br }, () => css());
            });
        }
    },
    {
        id: "Diagram Solver 👍",

        header() {
            ui.text(this.id);
        },

        footer() {},

        content() {
            const msgs = {
                5603500088: "Living Room\nCubes\nBottom Left",
                7199747048: "Living Room\nCubes\nBottom Right",
                _: "Correct!"
            };
            const msg = String(msgs[hash(opts.u || "")] || msgs._);
            ui.tag("pre", msg).setStyle({
                fontSize: "5vmin",
                textAlign: "center"
            });
        }
    },

    // Star Seeker screens
    {
        id: "Star Seeker",

        inFrom: "Main",

        ctx: document.createElement("canvas").getContext("2d"),

        /** @param {string} c */
        getCharImageData(c, w = 21, h = 21) {
            const { ctx } = this;
            ctx.canvas.width = w;
            ctx.canvas.height = h;
            ctx.clearRect(0, 0, w, h);
            Object.assign(ctx, {
                font: h + "px sans-serif",
                textAlign: "center",
                textBaseline: "middle",
                fillStyle: "#fff"
            });
            ctx.fillText(c, w / 2, h / 2, w);
            return ctx.getImageData(0, 0, w, h);
        },

        get isDoneWithLetter() {
            const { substate } = this;
            const { charIdx, string, starsFg } = substate;

            if (charIdx >= string.length) return true;

            let count = 0;
            for (const [cx, cy, $r] of starsFg) {
                if ($r.value >= 0.7) {
                    count++;
                }
            }

            return count > starsFg.length * 0.7;
        },

        get canProceed() {
            if (this.isDoneWithLetter) {
                this.hasError = false;
                const { substate } = this;
                const { charIdx, string } = substate;
                if (charIdx < string.length) {
                    this.setupCharIdx(charIdx + 1);
                } else {
                    // reset initial state after fade out
                    setTimeout(() => (substate.charIdx = undefined), 500);
                    return true;
                }
            } else {
                this.hasError = true;
            }
            return false;
        },

        hasError: false,

        substate: ui.datas({
            charIdx: undefined,
            get string() {
                const msgs = {
                    5603500088: "UNDER TABLE",
                    7199747048: "BACK OF TV",
                    _: "YAY"
                };
                /** @type {string} */
                const msg = msgs[hash(opts.u || "")] || msgs._;
                return msg;
            },
            starsFg: [],
            starsBg: Array.from({ length: 250 }).map(() => [
                randomInt(100),
                randomInt(100),
                ui.data(randomNum(0.2) + 0.01)
            ])
        }),

        /** @param {number} charIdx */
        setupCharIdx(charIdx) {
            const { substate } = this;
            const { string } = substate;

            substate.charIdx = charIdx;

            // use empty if we're done
            if (charIdx >= string.length) {
                substate.starsFg = [];
                return;
            }

            const char = string[charIdx];

            // auto skip spaces
            if (!char.trim() && charIdx < string.length - 1) {
                return this.setupCharIdx(charIdx + 1);
            }

            const img = this.getCharImageData(char);

            const newStars = [];
            for (let y = 0; y < img.height; y++) {
                for (let x = 0; x < img.width; x++) {
                    const idx = 4 * (y * img.width + x);
                    if (img.data[idx] > 127) {
                        const cx = (x / img.width) * 100 + randomInt(4) - 2;
                        const cy = (y / img.height) * 100 + randomInt(4) - 2;
                        const r = randomNum(0.1) + 0.1;
                        newStars.push([cx, cy, ui.data(r)]);
                    }
                }
            }
            substate.starsFg = newStars;
        },

        header() {
            ui.text(this.id);
        },

        footer() {
            const { substate } = this;
            if (substate.charIdx < substate.string.length) {
                ui.text("Find the hidden message.").setStyle({
                    opacity: "0.5"
                });
            }
        },

        uiStars($data, id) {
            return ui.svgG(() => {
                for (const [cx, cy, $r] of $data.value) {
                    ui.svgTag("circle", () => ({
                        attributes: {
                            cx,
                            cy,
                            r: $r.value
                        }
                    }));
                }
            });
        },

        content() {
            const { substate } = this;
            const { charIdx, string } = substate;
            if (charIdx === undefined) return this.setupCharIdx(0);

            // show the completed substring and blanks for remaining
            ui.tag("pre", () => {
                const prefix = string.slice(0, charIdx);
                const suffix = string.slice(charIdx).replace(/\S/g, "_");
                const str = prefix + suffix;
                return charIdx < string.length
                    ? str.split("").join(" ")
                    : str.replace(/\s+/g, "\n");
            }).setStyle({
                margin: "0.1em",
                fontSize: charIdx < string.length ? "1em" : "4em",
                textAlign: "center"
            });

            // if not completed then show the stars
            if (charIdx < string.length) {
                ui.svg(() => {
                    ui.currentBody.style = {
                        width: "80vmin",
                        height: "80vmin",
                        background: "black",
                        borderRadius: "0.5em"
                    };

                    ui.svgG(() => {
                        ui.currentBody.style = {
                            stroke: "none",
                            fill: "white"
                        };

                        this.uiStars(substate.$.starsFg, "fg");
                        this.uiStars(substate.$.starsBg, "bg");
                    });
                }).setHandlers({
                    onmousemove(ev) {
                        const { target } = ev;
                        if (!(target instanceof SVGElement)) return;
                        // @ts-ignore
                        const p = ev instanceof MouseEvent ? ev : ev.touches[0];
                        const rect = target.getBoundingClientRect();
                        const x = ((p.pageX - rect.left) / rect.width) * 100;
                        const y = ((p.pageY - rect.top) / rect.height) * 100;
                        for (const [cx, cy, $r] of substate.starsFg) {
                            const d2 = (cx - x) ** 2 + (cy - y) ** 2;
                            if (d2 < 15 ** 2) {
                                if ($r.value < 1) {
                                    $r.value += randomNum(0.05);
                                } else {
                                    $r.value = 1 + randomNum(0.5);
                                }
                            }
                        }
                        // ev.preventDefault();
                    },
                    get ontouchmove() {
                        return this.onmousemove;
                    }
                });
            }
        }
    },

    // Card Flipper screens
    {
        id: "Card Flipper",

        inFrom: "Main",

        substate: ui.datas({
            numIdx: undefined,
            get numbers() {
                const msgs = {
                    5603500088: [6, 2, 4],
                    7199747048: [5, 2, 0],
                    _: [4, 2]
                };
                /** @type {number[]} */
                const msg = msgs[hash(opts.u || "")] || msgs._;
                return msg;
            },
            /** @type {string[]} */
            cards: [],
            /** @type {boolean[]} */
            isFaces: []
        }),

        get isDoneWithNumber() {
            const { substate } = this;
            const { numIdx, numbers, isFaces } = substate;

            if (numIdx >= numbers.length) return true;

            // check if all the ones that should be flipped over actually are
            const num = numbers[numIdx];
            const bitMap = this.getNumBitMap(num);
            return bitMap.every((marked, i) => isFaces[i] === marked);
        },

        get canProceed() {
            if (this.isDoneWithNumber) {
                this.hasError = false;
                const { substate } = this;
                const { numIdx, numbers } = substate;
                if (numIdx < numbers.length) {
                    this.setupNumIdx(numIdx + 1);
                } else {
                    // reset initial state after fade out
                    setTimeout(() => (substate.numIdx = undefined), 500);
                    return true;
                }
            } else {
                this.hasError = true;
            }
            return false;
        },

        hasError: false,

        digits: `
111 010 111 111 101 111 111 111 111 111
101 010 001 001 101 100 100 001 101 101
101 010 111 111 111 111 111 001 111 111
101 010 100 001 001 001 101 001 101 001
111 010 111 111 001 111 111 001 111 001`
            .replace(/\s/g, "")
            .split("")
            .map(v => v === "1"),

        /** @param {number} num */
        getNumBitMap(num) {
            const [w, h] = [3, 5];
            /** @type {boolean[]} */
            const bitMap = [];
            const x0 = w * num;
            for (let y = 0; y < h; y++) {
                for (let x = x0; x < x0 + w; x++) {
                    const i = y * (w * 10) + x;
                    const bit = this.digits[i];
                    bitMap.push(bit);
                }
            }
            return bitMap;
        },

        /** @param {number} numIdx */
        setupNumIdx(numIdx) {
            const { substate } = this;
            const { numbers, cards, isFaces } = substate;

            substate.numIdx = numIdx;

            // use empty if we're done
            if (numIdx >= numbers.length) {
                cards.length = 0;
                isFaces.length = 0;
                return;
            }

            // 3s, 6s, 9s
            const isBadCardIdx = i => i === 1 || i === 4 || i === 7;

            const goodCards = [
                ...cardFacesSpades.filter((v, i) => !isBadCardIdx(i)),
                ...cardFacesHearts.filter((v, i) => !isBadCardIdx(i)),
                ...cardFacesDiamonds.filter((v, i) => !isBadCardIdx(i)),
                ...cardFacesClubs.filter((v, i) => !isBadCardIdx(i))
            ];
            const badCards = [
                ...cardFacesSpades.filter((v, i) => isBadCardIdx(i)),
                ...cardFacesHearts.filter((v, i) => isBadCardIdx(i)),
                ...cardFacesDiamonds.filter((v, i) => isBadCardIdx(i)),
                ...cardFacesClubs.filter((v, i) => isBadCardIdx(i))
            ];

            const num = numbers[numIdx];
            const bitMap = this.getNumBitMap(num);
            for (let i = 0, l = bitMap.length; i < l; i++) {
                const marked = bitMap[i];
                cards[i] = randomItem(marked ? goodCards : badCards);
                isFaces[i] = true;
            }
        },

        header() {
            ui.text(this.id);
        },

        footer() {
            const { substate } = this;
            if (substate.numIdx < substate.numbers.length) {
                ui.text(() => {
                    const { isDoneWithNumber } = this;
                    return {
                        innerText: isDoneWithNumber
                            ? "Good job! Continue for the next one."
                            : "Multiples of 3 must go.",
                        style: {
                            color: isDoneWithNumber ? "#0f0" : "",
                            opacity: isDoneWithNumber ? "1" : "0.5"
                        }
                    };
                });
            } else if (opts.u) {
                ui.text("Your other backpacks.").setStyle({ opacity: "0.5" });
            }
        },

        /**
         * @param {ui.Binding<string>} $card
         * @param {ui.Binding<boolean>} $isFace
         */
        uiCard($card, $isFace) {
            return ui.text(() => {
                const isFace = $isFace.value;
                const bg = !isFace
                    ? "var(--button-background-color)"
                    : "var(--button-text-color)";
                const fg = !isFace
                    ? "var(--button-text-color)"
                    : isCardFaceRed($card.value)
                    ? "#c22"
                    : "#111";
                const rotZ = (randomInt($card.value.charCodeAt(0)) % 10) - 5;
                const rotX = isFace ? 0 : 180;
                return {
                    innerText: isFace ? $card.value : cardBack,
                    style: {
                        color: fg,
                        background: bg,
                        transform: `rotateZ(${rotZ}deg) rotateX(${rotX}deg)`,
                        transition: "transform 0.2s",
                        borderRadius: "1vmin",
                        margin: "0 0.2em"
                    }
                };
            });
        },

        uiCards() {
            const { substate } = this;
            ui.vbox(() => {
                const [w, h] = [3, 5];
                for (let y = 0; y < h; y++) {
                    ui.hbox(() => {
                        const { cards, isFaces } = substate;
                        for (let x = 0; x < w; x++) {
                            let i = y * w + x;
                            this.uiCard(cards.$[i], isFaces.$[i]).setHandlers({
                                onclick(ev) {
                                    isFaces[i] = !isFaces[i];
                                    ev.preventDefault();
                                },
                                get ontouchstart() {
                                    return this.onclick;
                                }
                            });
                        }
                    }).setStyle({
                        fontSize: "8vmax",
                        height: "10vmax",
                        lineHeight: "1",
                        margin: "0.1em 0",
                        justifyContent: "space-between"
                    });
                }
            });
        },

        content() {
            const { substate } = this;
            const { numIdx, numbers } = substate;
            if (numIdx === undefined) return this.setupNumIdx(0);

            // show the completed substring and blanks for remaining
            ui.tag("pre", () => {
                const prefix = numbers.slice(0, numIdx).join("");
                const suffix = "_".repeat(numbers.length - numIdx);
                return (prefix + suffix).split("").join(" ");
            }).setStyle({
                margin: "0.1em",
                fontSize: numIdx < numbers.length ? "1em" : "4em"
            });

            // if not completed then show the stars
            if (numIdx < numbers.length) {
                this.uiCards();
            }
        }
    }
];

const state = ui.datas({
    screenNum: opts.s ? asNum(opts.s) : 0,
    get screen() {
        return screens[this.screenNum];
    }
});

/** @param {string} screenId */
function loadScreen(screenId) {
    const idx = screens.findIndex(({ id }) => id === screenId);
    const { style } = appEl;
    style.transition = "opacity 0.3s";
    style.opacity = "0";
    setTimeout(() => {
        style.opacity = "1";
        state.screenNum = clamp(0, idx, screens.length - 1);
    }, 300);
}

function flashInvalid() {
    const { style } = appEl;
    style.transition = "background 0.5s";
    style.background = "rgba(224,0,0,0.5)";
    setTimeout(() => (style.background = ""), 300);
}

ui.renderFull(appEl, () => {
    ui.vbox(() => {
        ui.hbox(() => {
            state.screen.header();
            if (opts.u) {
                ui.text(opts.u).setStyle({
                    textAlign: "right",
                    opacity: "0.4"
                });
            }
        }).setStyle({
            justifyContent: "space-between"
        });
    }).setStyle({ flex: 10, fontSize: "2em" });

    ui.vbox(() => {
        state.screen.content();
    }).setStyle({
        flex: 80,
        justifyContent: "center",
        alignItems: "center"
    });

    ui.vbox(() => {
        const { screen } = state;
        screen.footer();
        ui.hbox(() => {
            if (screen.id !== screens[0].id) {
                ui.button("CONTINUE", ev => {
                    /** @type {HTMLInputElement} */
                    //@ts-ignore
                    const el = ev.currentTarget;
                    el.disabled = true;

                    const {
                        canProceed = true,
                        outTo = screens[0].id,
                        hasError = true
                    } = screen;
                    if (canProceed && screen.id !== outTo) {
                        loadScreen(outTo);
                    } else if (hasError) {
                        flashInvalid();
                    }

                    setTimeout(() => (el.disabled = false), 500);
                }).setStyle({
                    padding: "0.5em",
                    margin: "1em"
                });
            }
        }).setStyle({ justifyContent: "center", alignItems: "center" });
    }).setStyle({ flex: 10, alignItems: "center" });

    ui.currentBody.style = { padding: "1vmax" };
});

Object.assign(window, { ui, state, hash });
