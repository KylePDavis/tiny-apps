import * as ui from "../ui";

const appEl = document.getElementById("app");
if (!appEl) throw new Error("Expected app element!");

/** @param {number} scale */
const randomNum = scale => scale * Math.random();

/** @param {number} scale */
const randomInt = scale => Math.floor(randomNum(scale));

/**
 * @param {Data<number>} $rows
 * @param {Data<number>} $cols
 * @param {Data<boolean[]>} $enabled
 */
function uiGrid($rows, $cols, $enabled) {
    ui.hbox(() => {
        ui.hbox(() => {
            ui.text("Rows:");
            ui.textField($rows).setStyle({ width: "2em", margin: "0 0.3em" });
        });
        ui.hbox(() => {
            ui.text("Cols:");
            ui.textField($cols).setStyle({ width: "2em", margin: "0 0.3em" });
        });
        ui.button("Clear", () => {
            for (const $v of state.values.$) {
                $v.value = false;
            }
        });
    }).setStyle({
        margin: "0.5em 0em",
        justifyContent: "space-evenly",
        alignItems: "baseline"
    });
    ui.tag("table", () => {
        const numRows = $rows.value;
        const numCols = $cols.value;
        for (let ri = 0; ri < numRows; ri++) {
            ui.tag("tr", () => {
                for (let ci = 0; ci < numCols; ci++) {
                    const idx = numCols * ri + ci;
                    ui.tag("td", () => ({
                        style: {
                            backgroundColor: $enabled.value[idx] ? "red" : ""
                        }
                    }))
                        .setStyle({
                            border: "1px solid black"
                        })
                        .setHandlers({
                            onmousedown(ev) {
                                $enabled.value[idx] ^= true;
                            },
                            get ontouchstart() {
                                return this.onmousedown;
                            }
                        });
                }
            });
        }
    }).setStyle({
        width: "90%",
        height: "90%",
        margin: "auto"
    });
}

/**
 * @param {string} text
 * @param {Data<{ x: number, y: number }>} $pos
 */
function uiMovingText(text, $pos) {
    ui.text(() => ({
        innerText: "hello there",
        style: {
            position: "absolute",
            left: `${$pos.value.x}%`,
            top: `${$pos.value.y}%`,
            transition: "all 0.4s",
            backgroundColor: "white",
            fontSize: "42pt"
        }
    })).setHandlers({
        onclick() {
            $pos.value = { x: randomInt(90), y: randomInt(90) };
        }
    });
}

const state = ui.datas({
    counter: 10,
    values: []
});
const decrement = () => (state.counter = Math.max(0, state.counter - 1));
const increment = () => state.counter++;

ui.renderFull(appEl, () => {
    ui.vbox(() => {
        ui.hbox(() => {
            ui.button("<").setHandlers({ onclick: decrement });

            ui.text(() => `MY Count: ${state.counter}`).setStyle({
                margin: "0.5em"
            });

            ui.button(">").setHandlers({ onclick: increment });
        }).setStyle({
            justifyContent: "center",
            alignItems: "center"
        });
    }).setStyle({ flex: 10 });

    ui.vbox(() => {
        uiGrid(state.$.counter, state.$.counter, state.$.values);
    }).setStyle({
        flex: 80,
        justifyContent: "center"
    });

    ui.vbox(() => {
        ui.text("Footer");
    }).setStyle({ flex: 10 });

    ui.currentBody.style = { padding: "1vmax" };
});

Object.assign(window, { ui, state });
