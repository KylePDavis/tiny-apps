const getAppItemHTML = ({ id, url = `${id}/index.html`, name = id }) => `
<li class="app-item">
<a href="${url}">${name}</a>
</li>
`;

const getAppListHTML = apps => `
<ul>
${apps.map(app => getAppItemHTML(app)).join("")}
</ul>
`;

const getAppHTML = ({ apps }) => `
<h1>Tiny Apps</h1>
${getAppListHTML(apps)}
`;

const appEl = document.getElementById("app");
appEl.innerHTML = getAppHTML({
    apps: [
        { id: "map", name: "Map" }
    ]
});

appEl.style.padding = "1vmax";
