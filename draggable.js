// @ts-check
import * as ui from "./ui";

/** @typedef {HTMLElement | SVGElement} DraggableElement */
/** @typedef {MouseEvent | TouchEvent} DraggableEvent */

const dragging = {
    /** @type {DraggableElement} */
    srcEl: undefined,

    /** @type {DraggableElement} */
    repEl: undefined,

    /** Drag offset based on original location */
    offset: { x: 0, y: 0 },

    canDrag: () => true,

    canDrop: () => true,

    /** @param {DraggableElement} el */
    getDragRep(el) {
        const { srcEl, offset } = dragging;
        /** @type {DraggableElement} */
        // @ts-ignore
        const repEl = el.cloneNode(true);

        // calculate offset from original size
        const { width, height } = srcEl.getBoundingClientRect();
        offset.x = -Math.floor(width / 2);
        offset.y = -Math.floor(height / 2);

        Object.assign(repEl.style, {
            position: "absolute",
            width: ui.px(width),
            height: ui.px(height)
        });

        return repEl;
    },

    /**
     * @param {DraggableElement} el
     * @param {DraggableEvent} evt
     */
    setDragPos(el, evt) {
        const { offset } = dragging;
        const p = evt instanceof MouseEvent ? evt : evt.touches[0];
        Object.assign(el.style, {
            left: ui.px(p.clientX + offset.x),
            top: ui.px(p.clientY + offset.y)
        });
    },

    cleanup() {
        const { srcEl, repEl } = this;
        repEl.parentElement.removeChild(repEl);
        srcEl.classList.remove("drag-src");
        this.repEl = undefined;
        this.srcEl = undefined;
        console.log("DRAG END");
    }
};

//TODO: make this work without side effects
ui.addModifiers({
    /** @typedef {(el?: DraggableElement, evt?: DraggableEvent) => void} DragFunc */
    /** @typedef {(el?: DraggableElement, evt?: DraggableEvent) => boolean} DragTestFunc */
    /** @typedef {(el?: DraggableElement, evt?: DraggableEvent) => boolean} DragPosFunc */
    /** @typedef {(el?: DraggableElement, evt?: DraggableEvent) => DraggableElement} DragRepFunc */
    /** @param {{ canDrag?: DragTestFunc, getDragRep?: DragRepFunc, setDragPos?: DragFunc, canDrop?: DragTestFunc }} [opts] */
    draggable({
        canDrag = dragging.canDrag,
        getDragRep = dragging.getDragRep.bind(dragging),
        setDragPos = dragging.setDragPos.bind(dragging),
        canDrop = dragging.canDrop
    } = {}) {
        /** @type {GlobalEventHandlers["onclick"]} */
        const onclick = evt => {
            if (dragging.srcEl) dragging.cleanup();

            const el = evt.currentTarget;
            if (!(el instanceof HTMLElement || el instanceof SVGElement)) {
                return;
            }

            if (!canDrag(el, evt)) return;
            const srcEl = el;
            dragging.srcEl = srcEl;
            console.log("DRAG START");

            // get the drag representation
            const repEl = dragging.getDragRep(el);
            dragging.repEl = repEl;

            repEl.classList.add("drag-rep");
            srcEl.classList.add("drag-src");

            // set the position
            dragging.setDragPos(repEl, evt);

            // add to the dom
            srcEl.parentNode.appendChild(repEl);
            document.body.appendChild(repEl);

            evt.preventDefault();
        };
        const ontouchstart = onclick;

        /** @type {GlobalEventHandlers["onmousemove"]} */
        const onmousemove = evt => {
            if (!dragging.srcEl) return;
            dragging.setDragPos(dragging.repEl, evt);
            evt.preventDefault();
        };
        const ontouchmove = onmousemove;

        /** @type {GlobalEventHandlers["onmouseup"]} */
        const onmouseup = evt => {
            if (!dragging.srcEl) return;
            // if (canDrop(el, evt)) { // TODO:
            dragging.cleanup();
            evt.preventDefault();
        };
        const ontouchend = onmouseup;

        this.setHandlers({
            onclick,
            ontouchstart,
            onmousemove,
            ontouchmove,
            onmouseup,
            ontouchend
        });
    }
});
