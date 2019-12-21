// @ts-check

/**
 * @param {string} sel
 * @returns {HTMLElement|SVGElement}
 */
const $ = sel => document.querySelector(sel);

/**
 * @param {string} sel
 * @returns {NodeListOf<HTMLElement|SVGElement>}
 */
const $$ = sel => document.querySelectorAll(sel);

/** @type {Array<{ id: string, name: string, capital: string }>} */
const statesList = [
    { id: "HI", name: "Hawaii", capital: "Honolulu" },
    { id: "AK", name: "Alaska", capital: "Juneau" },
    { id: "FL", name: "Florida", capital: "Tallahassee" },
    { id: "SC", name: "South Carolina", capital: "Columbia" },
    { id: "GA", name: "Georgia", capital: "Atlanta" },
    { id: "AL", name: "Alabama", capital: "Montgomery" },
    { id: "NC", name: "North Carolina", capital: "Raleigh" },
    { id: "TN", name: "Tennessee", capital: "Nashville" },
    { id: "RI", name: "Rhode Island", capital: "Providence" },
    { id: "CT", name: "Connecticut", capital: "Hartford" },
    { id: "MA", name: "Massachusetts", capital: "Boston" },
    { id: "ME", name: "Maine", capital: "Augusta" },
    { id: "NH", name: "New Hampshire", capital: "Concord" },
    { id: "VT", name: "Vermont", capital: "Montpelier" },
    { id: "NY", name: "New York", capital: "Albany" },
    { id: "NJ", name: "New Jersey", capital: "Trenton" },
    { id: "PA", name: "Pennsylvania", capital: "Harrisburg" },
    { id: "DE", name: "Delaware", capital: "Dover" },
    { id: "MD", name: "Maryland", capital: "Annapolis" },
    { id: "WV", name: "West Virginia", capital: "Charleston" },
    { id: "KY", name: "Kentucky", capital: "Frankfort" },
    { id: "OH", name: "Ohio", capital: "Columbus" },
    { id: "MI", name: "Michigan", capital: "Lansing" },
    { id: "WY", name: "Wyoming", capital: "Cheyenne" },
    { id: "MT", name: "Montana", capital: "Helena" },
    { id: "ID", name: "Idaho", capital: "Boise" },
    { id: "WA", name: "Washington", capital: "Olympia" },
    { id: "TX", name: "Texas", capital: "Austin" },
    { id: "CA", name: "California", capital: "Sacramento" },
    { id: "AZ", name: "Arizona", capital: "Phoenix" },
    { id: "NV", name: "Nevada", capital: "Carson City" },
    { id: "UT", name: "Utah", capital: "Salt Lake City" },
    { id: "CO", name: "Colorado", capital: "Denver" },
    { id: "NM", name: "New Mexico", capital: "Santa Fe" },
    { id: "OR", name: "Oregon", capital: "Salem" },
    { id: "ND", name: "North Dakota", capital: "Bismarck" },
    { id: "SD", name: "South Dakota", capital: "Pierre" },
    { id: "NE", name: "Nebraska", capital: "Lincoln" },
    { id: "IA", name: "Iowa", capital: "Des Moines" },
    { id: "MS", name: "Mississippi", capital: "Jackson" },
    { id: "IN", name: "Indiana", capital: "Indianapolis" },
    { id: "IL", name: "Illinois", capital: "Springfield" },
    { id: "MN", name: "Minnesota", capital: "Saint Paul" },
    { id: "WI", name: "Wisconsin", capital: "Madison" },
    { id: "MO", name: "Missouri", capital: "Jefferson City" },
    { id: "AR", name: "Arkansas", capital: "Little Rock" },
    { id: "OK", name: "Oklahoma", capital: "Oklahoma City" },
    { id: "KS", name: "Kansas", capital: "Topeka" },
    { id: "LA", name: "Louisiana", capital: "Baton Rouge" },
    { id: "VA", name: "Virginia", capital: "Richmond" }
];

const statesMap = new Map(statesList.map(si => [si.id, si]));

const infoBoxEl = $("#info-box");

/** @param {MouseEvent} evt */
const onMouseOver = evt => {
    infoBoxEl.style.display = "block";
    const stateId = evt.target.id;
    const stateInfo = statesMap.get(stateId);
    infoBoxEl.innerHTML = `
  <div><b>${stateInfo.name}</b></div>
  <div>${stateInfo.capital}, ${stateInfo.id}</div>
`.trim();
};

/** @param {MouseEvent} evt */
const onMouseLeave = evt => {
    infoBoxEl.style.display = "none";
};

/** @param {MouseEvent} evt */
const onMouseMove = evt => {
    const left = evt.pageX - infoBoxEl.clientWidth / 2;
    const top = evt.pageY - infoBoxEl.clientHeight - 30;
    Object.assign(infoBoxEl.style, {
        left: `${left}px`,
        top: `${top}px`
    });
};

document.onmousemove = onMouseMove;

for (const el of $$("path,circle")) {
    el.onmouseover = onMouseOver;
    el.onmouseleave = onMouseLeave;
}
