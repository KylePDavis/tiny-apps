// @ts-check
import * as ui from "../ui";

const appEl = document.getElementById("app");
if (!appEl) throw new Error("Expected app element!");

/** @param {number} scale */
const randomNum = scale => scale * Math.random();

/** @param {number} scale */
const randomInt = scale => Math.floor(randomNum(scale));

/** The die face pips as bitmaps. */
const dieFacePips = [
    [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
    ],
    [
        [0, 0, 1],
        [0, 0, 0],
        [1, 0, 0]
    ],
    [
        [0, 0, 1],
        [0, 1, 0],
        [1, 0, 0]
    ],
    [
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 1]
    ],
    [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1]
    ],
    [
        [1, 0, 1],
        [1, 0, 1],
        [1, 0, 1]
    ]
];

/** @param {ui.Data<number>} $data */
function die($data) {
    const { svg } = ui; // …because prettier keeps messing with my indention…
    return svg(() => {
        ui.rect({ x: 3, y: 3, width: 94, height: 94, rx: 3, ry: 3 });

        if (!$data) return;

        const pips = dieFacePips[$data.value - 1];
        if (!pips) return;

        const y0 = 25;
        const x0 = 25;
        const xd = 25;
        const yd = 25;
        const r = 10;

        let cy = y0;
        for (const row of pips) {
            let cx = x0;
            for (const pip of row) {
                if (pip) {
                    ui.circle({ cx, cy, r, fill: "black" });
                }
                cx += xd;
            }
            cy += yd;
        }
    }).setStyle({
        fill: "#f4f4f4",
        stroke: "#000"
    });
}

const state = ui.datas({
    /** @type {number[]} */
    values: Array(7)
});

const decrementNumDice = () => state.values.length--;

const incrementNumDice = () => state.values.length++;

function rollDice() {
    const { values } = state;
    for (let i = 0, l = values.length; i < l; i++) {
        values[i] = 1 + randomInt(6);
    }
}

Object.assign(document, {
    /** @param {KeyboardEvent} ev */
    onkeydown(ev) {
        let handled = true;
        switch (ev.key) {
            case "ArrowLeft":
            case "ArrowDown":
                decrementNumDice();
                break;
            case "ArrowRight":
            case "ArrowUp":
                incrementNumDice();
                break;
            case " ":
                rollDice();
                break;
            default:
                handled = false;
                console.log(ev.key);
        }
        if (handled) ev.preventDefault();
    }
});

ui.renderFull(appEl, () => {
    ui.vbox(() => {
        ui.hbox(() => {
            ui.button("<", decrementNumDice);

            ui.text(() => `Number of Dice: ${state.values.length}`).setStyle({
                margin: "0.5em"
            });

            ui.button(">", incrementNumDice);
        }).setStyle({
            justifyContent: "center",
            alignItems: "center"
        });
    }).setStyle({ flex: 10 });

    ui.vbox(() => {
        ui.hbox(() => {
            //TODO: this doesn't work yet (it partially works but doesn't pick up on length changes):
            // for (const $value of state.values.$) {

            const { values } = state;
            for (let i = 0, l = values.length; i < l; i++) {
                const col = values[i] % 2 === 0 ? "lightgreen" : "red";
                die(values.$[i]).setStyle({
                    margin: "10px",
                    border: `1px solid ${col}`,
                    width: "10vmax",
                    height: "10vmax"
                });
            }
        }).setStyle({
            justifyContent: "center",
            flexFlow: "wrap"
        });

        ui.hbox(() => {
            ui.button("ROLL", rollDice).setStyle({
                padding: "0.5em",
                margin: "1em"
            });
        }).setStyle({
            justifyContent: "center"
        });
    }).setStyle({
        flex: 80,
        justifyContent: "center"
    });

    ui.vbox(() => {
        ui.text(() => {
            //TODO: this doesn't work at all yet...
            // const sum = state.values.reduce((t, v = 0) => t + v, 0);

            let sum = 0;
            for (const value of state.values) {
                if (Number.isSafeInteger(value)) {
                    sum += value;
                }
            }

            return `Sum: ${sum}`;
        });
    }).setStyle({ flex: 10 });

    ui.currentBody.style = { padding: "1vmax" };
});

Object.assign(window, { ui, state });
