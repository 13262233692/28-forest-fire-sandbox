precision highp float;
precision highp sampler2D;

uniform sampler2D uStateTexture;
uniform sampler2D uWindTexture;
uniform sampler2D uIgnitionTexture;
uniform vec2 uResolution;
uniform float uIgnitionThreshold;
uniform float uBurnRate;
uniform float uFuelConsumptionRate;
uniform float uWindStrength;
uniform float uTemperatureDecay;
uniform float uSpreadRate;
uniform float uHumidity;
uniform float uDelta;
uniform float uMaxTempIncrease;
uniform int uReset;

varying vec2 vUv;

const float BURN_UNBURNED = 0.0;
const float BURN_BURNING = 0.5;
const float BURN_ASH = 1.0;

vec2 windVector(vec2 uv) {
    vec4 w = texture2D(uWindTexture, uv);
    return w.rg * 2.0 - 1.0;
}

void main() {
    if (uReset == 1) {
        float fuel = 0.6 + 0.4 * fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
        gl_FragColor = vec4(fuel, 0.0, BURN_UNBURNED, 0.0);
        return;
    }

    vec4 current = texture2D(uStateTexture, vUv);
    float fuel = current.r;
    float temperature = current.g;
    float burnState = current.b;
    float burnProgress = current.a;

    vec4 ignition = texture2D(uIgnitionTexture, vUv);
    if (ignition.r > 0.5 && burnState < 0.25) {
        burnState = BURN_BURNING;
        temperature = 1.0;
    }

    if (burnState > 0.75) {
        gl_FragColor = vec4(0.0, 0.0, BURN_ASH, 1.0);
        return;
    }

    float dx = 1.0 / uResolution.x;
    float dy = 1.0 / uResolution.y;

    vec2 offsets[8];
    offsets[0] = vec2(-dx, -dy);
    offsets[1] = vec2( 0.0, -dy);
    offsets[2] = vec2( dx, -dy);
    offsets[3] = vec2(-dx,  0.0);
    offsets[4] = vec2( dx,  0.0);
    offsets[5] = vec2(-dx,  dy);
    offsets[6] = vec2( 0.0,  dy);
    offsets[7] = vec2( dx,  dy);

    float dists[8];
    dists[0] = 1.414;
    dists[1] = 1.0;
    dists[2] = 1.414;
    dists[3] = 1.0;
    dists[4] = 1.0;
    dists[5] = 1.414;
    dists[6] = 1.0;
    dists[7] = 1.414;

    vec2 windVec = windVector(vUv) * uWindStrength;

    float heatInput = 0.0;

    for (int i = 0; i < 8; i++) {
        vec2 neighborUv = vUv + offsets[i];
        if (neighborUv.x < 0.0 || neighborUv.x > 1.0 ||
            neighborUv.y < 0.0 || neighborUv.y > 1.0) continue;

        vec4 neighbor = texture2D(uStateTexture, neighborUv);

        if (neighbor.b > 0.25 && neighbor.b < 0.75) {
            vec2 dirToNeighbor = normalize(offsets[i]);

            float windBias = dot(windVec, dirToNeighbor);

            float windAmplification = 1.0 + max(windBias, 0.0) * 2.5;
            float windSuppression = max(1.0 + min(windBias, 0.0) * 0.9, 0.05);

            float effectiveSpread = uSpreadRate * windAmplification * windSuppression;

            float humidityFactor = 1.0 - uHumidity * 0.8;
            effectiveSpread *= humidityFactor;

            effectiveSpread = max(effectiveSpread, 0.0);

            float distanceInv = 1.0 / dists[i];

            float neighborHeat = neighbor.g * effectiveSpread * distanceInv;

            heatInput += neighborHeat;
        }
    }

    float newTemp = temperature;
    float newFuel = fuel;
    float newBurnState = burnState;
    float newBurnProgress = burnProgress;

    if (burnState < 0.25) {
        float tempIncrease = min(heatInput, uMaxTempIncrease);
        newTemp = temperature + tempIncrease;

        float decayFactor = pow(uTemperatureDecay, uDelta);
        newTemp *= decayFactor;

        if (newTemp > uIgnitionThreshold && fuel > 0.1) {
            newBurnState = BURN_BURNING;
            newTemp = 1.0;
        }
    } else if (burnState > 0.25 && burnState < 0.75) {
        newTemp = 1.0;
        newBurnProgress = burnProgress + uBurnRate;
        newFuel = fuel - uFuelConsumptionRate;

        if (newFuel <= 0.0) {
            newFuel = 0.0;
            newBurnState = BURN_ASH;
            newTemp = 0.0;
            newBurnProgress = 1.0;
        }
        if (newBurnProgress >= 1.0) {
            newBurnState = BURN_ASH;
            newTemp = 0.0;
        }
    }

    newFuel = clamp(newFuel, 0.0, 1.0);
    newTemp = clamp(newTemp, 0.0, 1.0);
    newBurnProgress = clamp(newBurnProgress, 0.0, 1.0);

    gl_FragColor = vec4(newFuel, newTemp, newBurnState, newBurnProgress);
}
