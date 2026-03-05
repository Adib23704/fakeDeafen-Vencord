import definePlugin from "@utils/types";
import { findByProps } from "@webpack";

let original: any;
let observer: MutationObserver | null = null;
let enabled = false;

function refresh() {
    const a = findByProps("toggleSelfMute");
    if (!a) return;
    a.toggleSelfMute();
    setTimeout(() => a.toggleSelfMute(), 50);
}

function icon(on: boolean) {
    const c = on ? "#ed4245" : "currentColor";
    return `
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="8" width="20" height="4" rx="2" fill="${c}"/>
        <rect x="11" y="3" width="10" height="8" rx="3" fill="${c}"/>
        ${on ? `
        <line x1="7" y1="18" x2="13" y2="24" stroke="${c}" stroke-width="2"/>
        <line x1="13" y1="18" x2="7" y2="24" stroke="${c}" stroke-width="2"/>
        <line x1="19" y1="18" x2="25" y2="24" stroke="${c}" stroke-width="2"/>
        <line x1="25" y1="18" x2="19" y2="24" stroke="${c}" stroke-width="2"/>
        <path d="M14 23c1-1 3-1 4 0" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
        ` : `
        <circle cx="10" cy="21" r="4" stroke="${c}" stroke-width="2" fill="none"/>
        <circle cx="22" cy="21" r="4" stroke="${c}" stroke-width="2" fill="none"/>
        <path d="M14 21c1 1 3 1 4 0" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
        `}
    </svg>`;
}

function mount() {
    const m = document.querySelector('[aria-label="Mute"]');
    if (!m || document.getElementById("fd-btn")) return;

    const b = document.createElement("button");
    b.id = "fd-btn";
    b.className = (m as HTMLElement).className;
    b.setAttribute("aria-label", "Fake Deafen");
    b.innerHTML = `<div class="contents__201d5">${icon(false)}</div>`;

    b.onclick = () => {
        enabled = !enabled;
        b.querySelector(".contents__201d5")!.innerHTML = icon(enabled);
        refresh();
    };

    m.parentElement?.insertBefore(b, m);
}

export default definePlugin({
    name: "FakeDeafen",
    description: "Fake deafen toggle",
    authors: [{ name: "Waleed", id: 547060993885470720n }, { name: "hyyven", id: 449282863582412850n }],

    start() {
        const g = findByProps("voiceStateUpdate", "voiceServerPing");
        if (!g) return;

        original = g.voiceStateUpdate;
        g.voiceStateUpdate = function (a: any) {
            if (enabled && a) {
                a.selfMute = true;
                a.selfDeaf = true;
            }
            return original.apply(this, arguments);
        };

        observer = new MutationObserver(mount);
        observer.observe(document.body, { childList: true, subtree: true });
        mount();
    },

    stop() {
        const g = findByProps("voiceStateUpdate", "voiceServerPing");
        if (g && original) g.voiceStateUpdate = original;

        observer?.disconnect();
        document.getElementById("fd-btn")?.remove();
    }
});