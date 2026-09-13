const createCarLeftSvg = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
  <circle cx="25" cy="40" r="8" fill="#111"/>
  <circle cx="75" cy="40" r="8" fill="#111"/>
  <circle cx="25" cy="40" r="3.5" fill="#DDD"/>
  <circle cx="75" cy="40" r="3.5" fill="#DDD"/>
  <path d="M5,35 L95,35 L95,20 L80,20 L65,5 L30,5 L20,20 L5,20 Z" fill="${color}"/>
  <path d="M5,35 L95,35 L93,33 L7,33 Z" fill="#000" opacity="0.3"/>
  <path d="M33,8 L50,8 L50,18 L23,18 Z" fill="#1A252F"/>
  <path d="M54,8 L63,8 L77,18 L54,18 Z" fill="#1A252F"/>
  <path d="M60,10 L65,15" stroke="#FFF" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
  <polygon points="95,20 92,20 89,24 93,24" fill="#F1C40F"/>
  <polygon points="5,20 8,20 9,24 6,24" fill="#f70303"/>
</svg>`;

const createCarRightSvg = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
  <circle cx="25" cy="10" r="8" fill="#111"/>
  <circle cx="75" cy="10" r="8" fill="#111"/>
  <circle cx="25" cy="10" r="3.5" fill="#DDD"/>
  <circle cx="75" cy="10" r="3.5" fill="#DDD"/>
  <path d="M5,15 L95,15 L95,30 L80,30 L65,45 L30,45 L20,30 L5,30 Z" fill="${color}"/>
  <path d="M5,15 L95,15 L93,17 L7,17 Z" fill="#000" opacity="0.3"/>
  <path d="M33,42 L50,42 L50,32 L23,32 Z" fill="#1A252F"/>
  <path d="M54,42 L63,42 L77,32 L54,32 Z" fill="#1A252F"/>
  <path d="M60,40 L65,35" stroke="#FFF" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
  <polygon points="95,30 92,30 89,26 93,26" fill="#F1C40F"/>
  <polygon points="5,30 8,30 9,26 6,26" fill="#f70303"/>
</svg>`;

const uvArrowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20" viewBox="0 0 100 20">
  <!-- Haste da seta (corpo fino) -->
  <rect x="0" y="8" width="80" height="4" rx="2" fill="rgba(255, 255, 0, 0.8)" />
  <!-- Ponta da seta (triângulo) -->
  <path d="M75,5 L100,10 L75,15 Z" fill="rgba(255, 255, 0, 1)" />
</svg>
`;

const cloudSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
  <path d="M10,45 Q10,25 30,25 Q35,10 55,15 Q70,5 85,15 Q110,15 110,35 Q110,55 90,55 L30,55 Q10,55 10,45 Z" 
        fill="white" />
</svg>`;

const encodeSvg = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const uvArrowImage = encodeSvg(uvArrowSvg);
const cloudImage = encodeSvg(cloudSvg);

const carColors = [
    "#E74C3C",
    "#F1C40F",
    "#2ECC71",
    "#ECF0F1",
    "#FF8C00",
    "#9B59B6"
];

const carAssets = carColors.map(color => {
    return {
        right: encodeSvg(createCarRightSvg(color)),
        left: encodeSvg(createCarLeftSvg(color))
    };
});

const getRandomCarAssets = () => {
    const randomIndex = Math.floor(Math.random() * carAssets.length);
    return carAssets[randomIndex];
};

// --- World Parameters (Initial Configuration) ---
const ticksPerDay = 240; // Increase to 600 to make the day longer and car movement slower
const groundY = 360;

const ticksPerHour = ticksPerDay / 24;

// --- Day Phases (Hour Markers) ---
let morningStart;
let afternoonStart;
let eveningStart;
let nightStart;

let periodDurationNight;
let periodDurationMorning;
let periodDurationAfternoon;
let periodDurationEvening;

let currentPhase = "";
let periodStartTick = 0;
let periodDuration = 0;

let minPhaseHours;
let ticksInShortestPhase;
let travelTime;
let globalCarSpeed;

let lastCloudLevel = 0;
const cloudLevels = {
    "0": 0,
    "1": 5,
    "2": 10,
    "3": 20
};

const simStartDate = new Date();
simStartDate.setHours(0, 0, 0, 0);

globals.set("datetime", "");
globals.set("NO2-particle-count", 0);
globals.set("globalPhase", "");

addWidget({
    data: {
        label: "Cloud Level",
        min: 0,
        max: 3,
        step: 1,
        formatType: "integer",
        showReadout: true
    },
    defaultValue: 0,
    globalKey: "cloudLevel",
    type: "slider"
});
addWidget({
    data: {
        label: "Date, time"
    },
    defaultValue: "",
    globalKey: "datetime",
    type: "readout"
});
addWidget({
    data: {
        label: "Period"
    },
    defaultValue: "",
    globalKey: "globalPhase",
    type: "readout"
});

function isTouching(agent, type) {
    const others = agent.overlapping("actor");
    if (!others || others.length === 0) return false;
    if (type === "any") return others.length > 0;
    return others.some(other => other.label(type) && !other.removed);
}

function setStartTime(phase, hour, period) {
    const h24 = (parseInt(hour) % 12) + (period === "PM" ? 12 : 0);

    switch (phase) {
        case "morning": morningStart = h24; break;
        case "afternoon": afternoonStart = h24; break;
        case "evening": eveningStart = h24; break;
        case "night": nightStart = h24; break;
    }
}

function initialize() {
    // --- Day Phases (Hour Markers) ---
    // Can be defined by the blocks in setup()
    morningStart = 6;
    afternoonStart = 11;
    eveningStart = 16;
    nightStart = 20;

    globalCarSpeed = sim.width / (ticksPerHour * 2.0);

    setup();

    // 1. Morning: Starts at morningStart and goes until afternoonStart
    // If afternoonStart is less than morningStart, the duration is 0 (phase skipped)
    periodDurationMorning = Math.max(0, afternoonStart - morningStart);

    // 2. Afternoon: Starts where Morning ENDS and goes until eveningStart
    // We use Math.max with the previous marker to prevent negative overlap or "time travel"
    periodDurationAfternoon = Math.max(0, eveningStart - Math.max(morningStart, afternoonStart));

    // 3. Evening: Starts where Afternoon ENDS and goes until nightStart
    periodDurationEvening = Math.max(0, nightStart - Math.max(morningStart, afternoonStart, eveningStart));

    // 4. Night: The remainder of the day (24h minus the active phases)
    // This ensures the total sum of durations never exceeds 24 hours
    periodDurationNight = 24 - (periodDurationMorning + periodDurationAfternoon + periodDurationEvening);

    // Safety buffer for speed calculations to avoid division by zero (NaN)
    // If a phase has 0 duration due to invalid input, we use 0.1 for the math engine
    let durMorning = Math.max(0.1, periodDurationMorning);
    let durAfternoon = Math.max(0.1, periodDurationAfternoon);
    let durEvening = Math.max(0.1, periodDurationEvening);
    let durNight = Math.max(0.1, periodDurationNight);

    // Identify the shortest phase to ensure cars can cross the screen within its timeframe
    minPhaseHours = Math.min(durMorning, durAfternoon, durEvening, durNight);

    ticksInShortestPhase = (minPhaseHours / 24) * ticksPerDay;

    // travelTime: The car crosses the screen within 80% of the shortest phase duration
    travelTime = ticksInShortestPhase * 0.8;

    // Calculate globalCarSpeed based on simulation width
    // Math.max(travelTime, 1) prevents a division by zero error
    globalCarSpeed = sim.width / Math.max(travelTime, 1);
}

sim.beforeTick = () => {

    /* Execute queued onClick actions */
    if (onClickPendingEvent) {
        onClick(onClickPendingEvent);
        onClickPendingEvent = undefined;
    }

    const tick = sim.tickIndex;
    const dayOffset = Math.floor(tick / ticksPerDay);
    const h = ((tick % ticksPerDay) / ticksPerDay) * 24;
    const totalSecs = Math.floor(h * 3600);
    let phase = "";

    if ((h >= 0 && h < morningStart) || h >= nightStart) {
        phase = "night";
        periodDuration = periodDurationNight
    }
    else if (h < afternoonStart) {
        phase = "morning";
        periodDuration = periodDurationMorning
    }
    else if (h < eveningStart) {
        phase = "afternoon";
        periodDuration = periodDurationAfternoon
    }
    else {
        phase = "evening";
        periodDuration = periodDurationEvening
    }

    if (phase !== currentPhase) {
        periodStartTick = tick;
        currentPhase = phase;
        globals.set("globalPhase", currentPhase);
    }

    const simDate = new Date(simStartDate);
    simDate.setDate(simDate.getDate() + dayOffset);

    const mm = String(simDate.getMonth() + 1).padStart(2, '0');
    const dd = String(simDate.getDate()).padStart(2, '0');
    const yyyy = simDate.getFullYear();
    const hh = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const min = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSecs % 60).padStart(2, '0');

    const simDateTime = `${mm}/${dd}/${yyyy}, ${hh}:${min}:${ss}`;
    globals.set("datetime", simDateTime);

    globals.set("NO2-particle-count", sim.withLabel("no2") ? sim.withLabel("no2").size : 0);

    sim.actors.forEach(agent => {
        if (agent.x < 0 || agent.x > sim.width || agent.y < 0 || agent.y > sim.height) {
            agent.state.hide = true;
            agent.remove();
        }
    });

    sim.withLabel("uv").forEach(uv => {
        if (uv.removed) return;
        if (uv.y > groundY) uv.remove();
    });

    sim.withLabel("no2").forEach(no2 => {
        if (no2.removed) return;
        no2.x += (Math.random() - 0.5) * 1.5;
    });

    // Cloud level
    const currentLevel = globals.get("cloudLevel");
    if (currentLevel !== lastCloudLevel) {
        sim.withLabel("cloud").forEach(cloud => {
            cloud.state.hide = true;
            cloud.remove();
        });
        create_cloud(cloudLevels[String(currentLevel)]);
        lastCloudLevel = currentLevel;
    }
}

/**
 * Helper function to determine if an agent should be spawned in the current tick
 * based on the total amount requested for the current time period.
 */
function shouldSpawn(totalInPeriod) {
    if (totalInPeriod <= 0) return false;

    const periodTicks = (periodDuration / 24) * ticksPerDay;
    const interval = Math.max(periodTicks / totalInPeriod, 1);
    const elapsed = sim.tickIndex - periodStartTick;

    const currentCount = Math.floor(elapsed / interval);
    const previousCount = Math.floor((elapsed - 1) / interval);

    // Returns true only when we "step" into a new interval
    return currentCount !== previousCount;
}

function create_a_car() {
    const isLeft = Math.random() < 0.5;
    const agentCarImgs = getRandomCarAssets();

    const agent = new AA.Actor({
        x: isLeft ? 1 : sim.width - 1,
        y: groundY - 10,
        maxSpeed: 100,
        radius: 14,
        vel: new AA.Vector(isLeft ? globalCarSpeed : -globalCarSpeed, 0)
    });

    agent.label("car", true);
    agent.state.hide = false;
    agent.state.alpha = 1;

    agent.vis({
        image: isLeft ? agentCarImgs.left : agentCarImgs.right,
        alpha: alphaFunction
    });

    agent.addTo(sim);
    return agent;
}

function create_car(num, callback) {
    for (let i = 0; i < num; i++) {
        const agent = create_a_car();
        if (callback) callback(agent);
    }
}

const trafficOptions = {
    "rarely": 5,
    "sometimes": 15,
    "always": 45
};

function spawnCar(totalInPeriod) {
    if (!shouldSpawn(totalInPeriod)) return;

    create_a_car();
}

// --- UV Speed Relative Calculation ---
// Speed to cross height in 1 simulated hour
const globalUVSpeed = sim.height / (ticksPerHour * 1.0);
const globalUVRadius = 25;

function create_a_uv(props) {
    const { radius, speed, alpha } = props ?? {};

    const agent = new AA.Actor({
        x: Math.random() * sim.width,
        y: 0,
        maxSpeed: 100,
        vel: new AA.Vector(0, speed ?? globalUVSpeed),
        radius: radius ?? globalUVRadius
    });

    agent.label("uv", true);
    agent.state.hide = false;
    // Store the intensity alpha in the state
    agent.state.alpha = alpha ?? 1;

    agent.vis({
        image: uvArrowImage,
        tint: 0xFFFF00,
        alpha: alphaFunction
    });

    agent.addTo(sim);
    return agent;
}

function create_uv(num, callback) {
    for (let i = 0; i < num; i++) {
        const agent = create_a_uv();
        if (callback) callback(agent);
    }
}

const uvSettings = {
    "weak": { total: 10, radius: globalUVRadius, speed: globalUVSpeed, alpha: 0.4 },
    "moderate": { total: 30, radius: globalUVRadius, speed: globalUVSpeed, alpha: 0.6 },
    "strong": { total: 100, radius: globalUVRadius, speed: globalUVSpeed, alpha: 1.0 }
};

function spawnUVRay(totalInPeriod, radius, speed, alpha) {
    if (!shouldSpawn(totalInPeriod)) return;

    create_a_uv({
        radius: radius,
        speed: speed,
        alpha: alpha
    })
}

function create_a_no2(props) {
    const { x, y } = props ?? {};

    const agent = new AA.Actor({
        x: x ?? Math.random() * sim.width,
        y: y ?? (groundY - Math.random() * 100),
        maxSpeed: 100,
        vel: new AA.Vector((Math.random() - 0.5) * 1.0, -3),
        radius: 4,
    });

    agent.label("no2", true);
    agent.state.hide = false;
    agent.state.alpha = 1;

    agent.vis({
        tint: 0xCC6600,
        alpha: alphaFunction
    });

    agent.addTo(sim);
    return agent;
}

function create_no2(num, callback) {
    for (let i = 0; i < num; i++) {
        const agent = create_a_no2();
        if (callback) callback(agent);
    }
}

function spawnNo2(x, y) {
    if (sim.tickIndex % 4 !== 0) return;

    create_a_no2({
        x: x,
        y: y
    })
}

function create_a_cloud(props) {
    const { x, y } = props ?? {};

    const agent = new AA.Actor({
        x: x ?? Math.random() * sim.width,
        y: y ?? (50 + Math.random() * 150),
        radius: 30
    });

    agent.label("cloud", true);
    agent.state.hide = false;
    agent.state.alpha = 0.9;

    agent.vis({
        image: cloudImage,
        alpha: alphaFunction
    });

    agent.addTo(sim);
    return agent;
}

function create_cloud(num, callback) {
    for (let i = 0; i < num; i++) {
        const agent = create_a_cloud();
        if (callback) callback(agent);
    }
}

function alphaFunction(agent) {
    return agent.state.hide ? 0 : agent.state.alpha;
}

const phaseColors = {
    "night": 0x4D5964,
    "morning": 0xAED6F1,
    "afternoon": 0x87CEEB,
    "evening": 0x5499C7
};

function updateSkyColor(agent) {
    return phaseColors[currentPhase] || phaseColors["night"];
}

const groundGridY = Math.floor((groundY / sim.height) * sim._grid.ny);

const skyZone = new AA.Zone({
    indexLimits: [
        0,
        sim.xMaxIndex,
        0,
        groundGridY
    ]
}).addTo(sim);

skyZone.vis({
    tint: updateSkyColor
});

const groundZone = new AA.Zone({
    indexLimits: [
        0,
        sim.xMaxIndex,
        groundGridY,
        sim.yMaxIndex
    ]
}).addTo(sim);

groundZone.vis({
    tint: 0x228B22
});

// Store onClick actions to be executed during the next tick
let onClickPendingEvent = undefined;

function _onClick(event) {
    onClickPendingEvent = event;
}

sim.vis({
    background: true,
    click: _onClick
});

initialize();