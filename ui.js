// @ts-check

//TODO: support canvas?

//TODO: support WebGL?

/** @typedef {Partial<{ flex?: number | CSSStyleDeclaration["flex"] } & Omit<CSSStyleDeclaration, "flex">>} BodyObjectStyle */
/** @typedef {Record<string, any>} BodyObjectAttributes */
/** @typedef {Partial<{ ns: string, tag: string, attributes: BodyObjectAttributes, style: BodyObjectStyle } & Omit<HTMLElement & HTMLImageElement & HTMLInputElement & HTMLAnchorElement, "attributes" | "style">>} BodyObjectForHTML */
/** @typedef {BodyObjectForHTML & { body?: BodyObjectLike[] | BodyObjectLike | BodyFunc }} BodyObject */
/** @typedef {BodyObject | string | undefined | void} BodyObjectLike */
/** @typedef {() => BodyObjectLike} BodyFunc */
/** @typedef {BodyObjectLike | BodyFunc} BodyLike */
/** @typedef {BodyObject & BodyObjectModifiers} BodyObjectWithModifiers */

/** @type {BodyObject} */
export let currentBody = undefined;

/** @type {BodyFunc | undefined} */
let currentTrackedFunc = undefined;

/** @type {WeakMap<BodyFunc, BodyObjectWithModifiers>} */
let bodyObjectByBodyFunc = new WeakMap();

/** @type {WeakMap<BodyObjectWithModifiers, HTMLElement>} */
let elByBodyObject = new WeakMap();

/** @typedef {typeof modifiers} BodyObjectModifiers */
const modifiers = {
    /** @param {BodyObject} modifier */
    modify(modifier) {
        if (!modifier) return this;
        const { modifiers = (this.modifiers = []) } = this;
        modifiers.push(modifier);
        return this;
    },

    /** @param {BodyObject["style"]} style */
    setStyle(style) {
        return style ? this.modify({ style }) : this;
    },

    /** @param {BodyObject["attributes"]} attributes */
    setAttributes(attributes) {
        return attributes ? this.modify({ attributes }) : this;
    },

    /** @param {Partial<GlobalEventHandlers>} handlers */
    setHandlers(handlers) {
        return this.modify(handlers);
    }
};

/** @param {any} extraModifiers */
export function addModifiers(extraModifiers) {
    Object.assign(modifiers, extraModifiers);
}

/** @param {BodyFunc} fn */
export function trackedCall(fn) {
    const prevTrackedFunc = currentTrackedFunc;
    currentTrackedFunc = fn;
    const result = fn();
    currentTrackedFunc = prevTrackedFunc;
    return result;
}

/**
 * Build an object representing the given body.
 * @param {BodyLike} body
 * @param {BodyObject} [parentBody]
 */
function build(body = {}, parentBody = currentBody || {}) {
    currentBody = parentBody;

    if (!parentBody.body) parentBody.body = [];

    /** @type {BodyObjectLike} */
    let obj;
    if (body instanceof Function) {
        currentBody = Object.create(modifiers);
        obj = trackedCall(body) || currentBody;
    } else {
        obj = body;
    }

    /** @type {BodyObject & BodyObjectModifiers} */
    // @ts-ignore
    const bodyObj = typeof obj === "string" ? { innerText: obj } : obj;

    Object.setPrototypeOf(bodyObj, modifiers);

    // @ts-ignore
    parentBody.body.push(bodyObj);

    currentBody = parentBody;

    // tracking for automatic updates on data changes
    if (body instanceof Function) {
        bodyObjectByBodyFunc.set(body, bodyObj);
    }

    return bodyObj;
}

/** @param {BodyObject & BodyObjectModifiers} bodyObj */
export function applyModifiers(bodyObj) {
    const { modifiers } = bodyObj;
    if (!modifiers) return bodyObj;

    const { style, attributes } = bodyObj;

    Object.assign(bodyObj, ...modifiers);

    const styleObjs = [];
    if (style) styleObjs.push(style);

    const attrsObjs = [];
    if (attributes) attrsObjs.push(attributes);

    for (const modifier of modifiers) {
        const { style, attributes } = modifier;
        if (style) styleObjs.push(style);
        if (attributes) attrsObjs.push(attributes);
    }

    // @ts-ignore
    if (styleObjs.length > 0) bodyObj.style = Object.assign(...styleObjs);

    // @ts-ignore
    if (attrsObjs.length > 0) bodyObj.attributes = Object.assign(...attrsObjs);

    return bodyObj;
}

/**
 * @param {HTMLElement} el
 * @param {BodyObject["style"]} style
 */
export function renderStyle(el, style) {
    Object.assign(el.style, style);
}

/**
 * @param {HTMLElement} el
 * @param {BodyLike} bodyLike
 */
export function render(el, bodyLike) {
    const bodyObj = build(bodyLike);

    applyModifiers(bodyObj);

    //TODO: don't render if same as last time

    // tracking for automatic updates on data changes
    elByBodyObject.set(bodyObj, el);

    const { ns: pNS, tag: pTag, body, attributes, style, ...props } = bodyObj;
    if (pTag && pTag.toUpperCase() !== el.tagName.toUpperCase()) {
        throw new Error("Unexpected element type mismatch!");
    }

    // handle attributes
    if (attributes) {
        /** @type {Set<string>} */
        const extras = new Set(el.getAttributeNames());
        // set new attributes
        for (const name in attributes) {
            el.setAttribute(name, attributes[name]);
            extras.delete(name);
        }
        // remove extra attributes
        for (const attrName of extras) {
            el.removeAttribute(attrName);
        }
    }

    // handle styles
    if (style) {
        // remove any styles (unless handled above)
        if (!attributes) el.removeAttribute("style");
        // set new styles
        renderStyle(el, style);
    }

    // reset contents if needed
    //TODO: YOU ARE HERE, KEEP OLD ELEMENTS AROUND UNTIL DONE!
    if (el.children.length) el.innerHTML = "";

    // handle everything else
    Object.assign(el, props);

    if (body) {
        const children = Array.isArray(body) ? body : [body];
        for (const child of children) {
            let ns;
            let tag = "div";
            if (typeof child === "object") ({ ns, tag } = child);
            //TODO: try to reuse child elements
            const childEl = ns
                ? document.createElementNS(ns, tag)
                : document.createElement(tag);
            el.appendChild(childEl);
            // @ts-ignore
            render(childEl, child);
        }
    }

    return bodyObj;
}

/** @type {<T>(newVal: any, oldVal: T) => T} */
function coercePrimitive(newVal, oldVal) {
    const oldValType = typeof oldVal;
    if (
        oldValType !== "object" &&
        oldValType !== "undefined" &&
        oldValType !== typeof newVal &&
        newVal !== null
    ) {
        return oldVal.constructor(newVal);
    } else {
        return newVal;
    }
}

/** @type {Set<BodyFunc>} */
const pendingForRender = new Set();

/** @type {number} */
let scheduledRenderID;

function queueForRender(...bodyFuncs) {
    for (const bodyFunc of bodyFuncs) {
        pendingForRender.add(bodyFunc);
    }
    scheduleRender();
}

function scheduleRender() {
    cancelAnimationFrame(scheduledRenderID);
    scheduledRenderID = requestAnimationFrame(renderPending);
}

function renderPending() {
    if (pendingForRender.size === 0) return;

    const bodyFuncs = Array.from(pendingForRender);
    pendingForRender.clear();
    for (const bodyFunc of bodyFuncs) {
        const bodyObj = bodyObjectByBodyFunc.get(bodyFunc);
        bodyObjectByBodyFunc.delete(bodyFunc);

        const el = elByBodyObject.get(bodyObj);
        elByBodyObject.delete(bodyObj);

        if (el && el.parentNode) {
            const newBodyObj = build(bodyFunc);
            newBodyObj.modifiers = bodyObj.modifiers;
            render(el, newBodyObj);
        }
    }
}

/** @template T */
export class Binding {
    /**
     * @param {(...args: any[]) => T} get
     * @param {(val: T, ...args: any[]) => void} set
     */
    constructor(get, set) {
        /** @type {T} */
        this.value;
        Object.defineProperty(this, "value", { get, set });
    }
    toJSON() {
        return this.value;
    }
}

/** @type {<T>(events: { get?: (val: T) => T, set?: (val: T, oldVal: T) => T}) => Binding<T>} */
export function binding({ get, set }) {
    return new Binding(get, set);
}

/**
 * @template T
 * @extends {Binding<T>}
 */
export class Data extends Binding {
    /**
     * @param {T} value
     * @param {(val: T) => T} [get]
     * @param {(val: T, oldVal: T) => T} [set]
     * @param {(a: T, b: T) => boolean} [eq]
     */
    constructor(value, get, set, eq = Object.is) {
        /** @type {Data<T>} */
        // @ts-ignore
        const self = super(
            function _get() {
                if (currentTrackedFunc) self.gets.add(currentTrackedFunc);
                return get ? get.call(this, value) : value;
            },
            function _set(newVal) {
                const oldVal = value;
                newVal = coercePrimitive(newVal, oldVal);
                value = set ? set.call(this, newVal, oldVal) : newVal;
                if (!eq(newVal, oldVal)) self.sync();
            }
        );

        /** @type {Set<BodyFunc>} */
        this.gets;
        Object.defineProperty(this, "gets", { value: new Set() });
    }
    sync() {
        const { gets } = this;
        if (gets.size > 0) {
            queueForRender(...gets);
            gets.clear();
            scheduleRender();
        }
    }
}

//TODO: make `data()` with `Object` and get rid of `datas()`
//TODO: make `data()` work with Date
//TODO: make `data()` work with Array
//TODO: make `data()` work with Set
//TODO: make `data()` work with Map
//TODO: make `data()` using other datas lazily get new computed result?
/** @typedef {undefined | boolean | number | string} Primitive */
/** @typedef {ReturnType<typeof data>} DataValue */

/** @type {<T>(value?: T, events?: { get?: (val: T) => T, set?: (val: T, oldVal: T) => T, eq?: (a: T, b: T) => boolean}) => Data<T>} */
export function data(value, { get, set, eq } = {}) {
    return new Data(value, get, set, eq);
}

/** @template T @typedef {T extends Binding<any> ? T["value"] : T} AsDataVal */
/** @template T @typedef {T extends Binding<any> ? T : Binding<T>} AsDataObj */
/** @template T @typedef {{ [P in keyof T]: AsDataVal<T[P]> }} AsDataVals */
/** @template T @typedef {{ [P in keyof T]: AsDataObj<T[P]> }} AsDataObjs */

/** @typedef {Binding<any> | Primitive | Array | object} DatasObjVal */
/** @typedef {Record<string, DatasObjVal>} DatasObj */
/** @type {<T extends DatasObj>(values: T) => AsDataVals<T> & { $: AsDataObjs<T> }} */
export function datas(values) {
    const $ = {};
    const obj = Object.defineProperty({}, "$", { value: $ });
    for (const key in values) {
        const desc = Object.getOwnPropertyDescriptor(values, key);
        const { get, set, value } = desc;
        const $data = get
            ? data(undefined, { get, set })
            : value instanceof Binding
            ? value
            : Array.isArray(value)
            ? data(dataArray(value))
            : data(value);
        // @ts-ignore
        $[key] = $data;
        const ddesc = Object.getOwnPropertyDescriptor($data, "value");
        ddesc.enumerable = true;
        Object.defineProperty(obj, key, ddesc);
    }
    // @ts-ignore
    return obj;
}

class ProxyArray extends Array {
    // METHODS THAT READ (SOME):
    // - some
    // - indexOf
    // - lastIndexOf
    // - includes
    // - findIndex
    // - find
    // - slice
    // - length
    // METHODS THAT READ (EVERY):
    // - keys?
    // - values
    // - entries
    // - every
    // - concat
    // - filter
    // - flat
    // - flatMap
    // - forEach
    // - join
    // - map
    // - reduce
    // - reduceRight
    // - toString
    // - toJSON ? …this doesn't usually exist but maybe it should for our case
    // METHODS THAT MUTATE:
    // "copyWithin",
    // "fill",
    // "pop",
    // "push",
    // "reverse",
    // "shift",
    // "sort",
    // "splice",
    // "unshift"
}

const { isSafeInteger: isInt } = Number;

/** @param {string} s */
const asInt = s => parseInt(s, 10);

/**
 * @template T
 * @param {T[]} arr
 * @param {{ getAt: (idx: number, arr: T[]) => T, setAt: (idx: number, val: T, arr: T[]) => T, getLen?: (arr: T[]) => number, setLen?: (len: number, arr: T[]) => number, getKey?: (arr: T[], key: string) => any, setKey?: (arr: T[], key: string, val: any) => any }} opts
 */
export function proxyArray(arr, opts) {
    const { getAt, setAt, getLen, setLen, getKey, setKey } = opts;
    /** @type {ProxyHandler<T[]>} */
    const proxyHandler = {
        get(arr, key, rcvr) {
            /** @type {any} */
            let v;
            /** @type {number} */
            let i;
            if (
                typeof key === "number" ||
                (typeof key === "string" && isInt((i = asInt(key))))
            ) {
                v = getAt(i, arr);
            } else if (getLen && key === "length") {
                v = getLen(arr);
            } else if (getKey && typeof key === "string") {
                v = getKey(arr, key);
            } else {
                v = arr[key];
            }
            return v;
        },
        set(arr, key, val, rcvr) {
            /** @type {any} */
            let v;
            /** @type {number} */
            let i;
            if (
                typeof key === "number" ||
                (typeof key === "string" && isInt((i = asInt(key))))
            ) {
                // if (i >= arr.length) this.set(arr, "length", i + 1, rcvr);
                v = setAt(i, val, arr);
            } else if (setLen && key === "length" && isInt(val)) {
                v = setLen(val, arr);
            } else if (setKey && typeof key === "string") {
                v = setKey(arr, key, val);
            } else {
                v = val;
            }
            arr[key] = v;
            return true;
        }
    };

    Object.setPrototypeOf(arr, ProxyArray.prototype);
    const ap = new Proxy(arr, proxyHandler);
    return ap;
}

/**
 * @template T
 * @typedef {Array<T> & { $: Array<Data<T>>, $length: Data<number> }} DataArray
 */

/**
 * @template T
 * @param {T[]} values
 * @return {DataArray<T>}
 */
export function dataArray(values = []) {
    /** @type {Array<Data<T>>} */
    const dataObjs = Array(values.length);

    const $length = data(values.length, {
        get: v => values.length,
        set: v => (dataObjs.length = values.length = v)
    });

    const proxyDataObjs = proxyArray(dataObjs, {
        getAt(idx, arr) {
            const dataObj = arr[idx];
            return dataObj ? dataObj : (arr[idx] = data(values[idx]));
        },
        setAt: (i, v) => v
    });

    // @ts-ignore
    return proxyArray(values, {
        getAt(idx) {
            return proxyDataObjs[idx].value;
        },
        setAt(idx, val) {
            const dataObj = dataObjs[idx];
            if (dataObj) {
                dataObj.value = val;
            } else {
                dataObjs[idx] = data(val);
            }
            return val;
        },
        getLen: () => $length.value,
        setLen: len => ($length.value = len),
        getKey(arr, key) {
            if (key === "$length") return $length;
            if (key === "$") return proxyDataObjs;
            return arr[key];
        },
        setKey(_arr, key, val) {
            if (key === "$" || key === "$length") {
                throw new TypeError(`Unable to set read-only property ${key}!`);
            }
            if (key === "length") $length.value = val;
            return val;
        }
    });
}

/**
 * @param {BodyLike} [body]
 * @param {BodyObject} [props]
 */
export const buildWith = (body, props) => {
    const bodyObj = build(body);
    return props ? Object.assign(bodyObj, props) : bodyObj;
};

/**
 * @param {string} tag
 * @param {BodyLike} [body]
 * @param {BodyObject} [obj]
 */
export const tag = (tag, body, obj) => buildWith(body, { tag, ...obj });

/** @param {string} innerHTML */
export const raw = innerHTML => tag("div", { innerHTML });

/** @param {BodyLike} [body] */
export const hbox = body =>
    tag("div", body).setStyle({ display: "flex", flexDirection: "row" });

/** @param {BodyLike} [body] */
export const vbox = body =>
    tag("div", body).setStyle({ display: "flex", flexDirection: "column" });

/**
 * @param {string} src
 * @param {BodyLike} [body]
 */
export const image = (src, body) => tag("img", body, { src });

/**
 * @param {BodyLike} [body]
 * @param {BodyObject} [obj]
 */
export const link = (body, obj) => tag("a", body, obj);

/** @param {BodyLike} [body] */
export const text = body => tag("span", body);

/**
 * @param {string} innerText
 * @param {GlobalEventHandlers["onclick"]} [onclick]
 * @param {BodyLike} [body]
 */
export const button = (innerText, onclick, body) =>
    tag("button", body, { innerText, onclick });

/**
 * @template T
 * @param {Binding<T>} $data
 * @param {string} [placeholder]
 */
export const textField = ($data, placeholder = "") =>
    tag("input", () => ({
        value: $data && $data.value !== undefined ? `${$data.value}` : "",
        attributes: !placeholder ? undefined : { placeholder },
        // @ts-ignore
        onchange: ev => ($data.value = ev.currentTarget.value)
    }));

/**
 * @param {string} tag
 * @param {BodyLike} [body]
 * @param {BodyObject} [obj]
 */
export const svgTag = (tag, body, obj) =>
    buildWith(body, { ns: "http://www.w3.org/2000/svg", tag, ...obj });

/** @param {BodyLike} body */
export const svg = body =>
    svgTag("svg", body).setAttributes({
        viewBox: "0 0 100 100",
        width: 100,
        height: 100
    });

/** @param {BodyLike} body */
export const svgGroup = body => svgTag("g", body);
export const svgG = svgGroup;

/** @typedef {Partial<{ cx: number, cy: number, r: number }>} CircleAttrs */
/**
 * @param {Partial<CircleAttrs & Omit<CSSStyleDeclaration, keyof CircleAttrs>>} attrs
 * @param {BodyLike} body
 */
export const circle = (attrs, body) =>
    svgTag("circle", body).setAttributes(attrs);

/** @typedef {Partial<{ x: number, y: number, width: number, height: number, rx: number, ry: number }>} RectAttrs */
/**
 * @param {Partial<RectAttrs & Omit<CSSStyleDeclaration, keyof RectAttrs>>} attrs
 * @param {BodyLike} body
 */
export const rect = (attrs, body) => svgTag("rect", body).setAttributes(attrs);

/** @typedef {Partial<{ x1: number, y1: number, x2: number, y2: number }>} LineAttrs */
/** @param {Partial<LineAttrs & Omit<CSSStyleDeclaration, keyof LineAttrs>>} attrs */
export const line = attrs => svgTag("line").setAttributes(attrs);

/** @param {number} v */
export const px = v => `${v}px`;

/** @param {number} v */
export const em = v => `${v}em`;

/** @param {number} v */
export const rem = v => `${v}rem`;

/** @param {number} v */
export const pt = v => `${v}pt`;

/** @param {number} v */
export const cm = v => `${v}cm`;

/** @param {number} v */
export const mm = v => `${v}mm`;

/** @param {number} v */
export const pct = v => `${v}%`;

/** @param {number} v */
export const vh = v => `${v}vh`;

/** @param {number} v */
export const vw = v => `${v}vw`;

/** Disable double taps  */
export function noDoubleTap() {
    let lt = Date.now();
    window.addEventListener("touchend", ev => {
        const t = Date.now();
        if (t - lt < 400) ev.preventDefault();
        lt = t;
    });
}

/** @param {HTMLElement} el */
export function noResize(el) {
    // tweaks for sizing and scrolling on iPad
    if (window.innerHeight !== window.outerHeight) {
        const onResize = () =>
            renderStyle(el, {
                width: px(window.innerWidth),
                height: px(window.innerHeight)
            });
        setTimeout(onResize, 100);
        setTimeout(onResize, 500);
        window.addEventListener("resize", onResize);
    }
}

/**
 * @param {HTMLElement} el
 * @param {BodyLike} bodyLike
 */
export function renderFull(el, bodyLike) {
    noResize(el);
    noDoubleTap();
    return render(el, bodyLike);
}
