precision highp float;
precision highp sampler2D;

uniform sampler2D uStateTexture;
uniform sampler2D uWindTexture;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

const float BURN_UNBURNED = 0.0;
const float BURN_BURNING = 0.5;
const float BURN_ASH = 1.0;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec4 state = texture2D(uStateTexture, vUv);
    float fuel = state.r;
    float temperature = state.g;
    float burnState = state.b;
    float burnProgress = state.a;

    vec2 windVec = texture2D(uWindTexture, vUv).rg * 2.0 - 1.0;

    vec3 vegetationColor = mix(
        vec3(0.12, 0.22, 0.1),
        vec3(0.28, 0.40, 0.25),
        fuel
    );

    vec3 ashColor = vec3(0.12, 0.10, 0.08);

    vec3 fireBaseColor = vec3(1.0, 0.27, 0.0);
    vec3 fireTipColor = vec3(1.0, 0.85, 0.2);
    vec3 fireCoreColor = vec3(1.0, 0.95, 0.8);

    vec3 color;
    float alpha = 1.0;

    if (burnState < 0.25) {
        color = vegetationColor;

        float dx = 1.0 / uResolution.x;
        float dy = 1.0 / uResolution.y;
        float heatGlow = 0.0;
        for (int i = -2; i <= 2; i++) {
            for (int j = -2; j <= 2; j++) {
                if (i == 0 && j == 0) continue;
                vec2 sampleUv = vUv + vec2(float(i) * dx, float(j) * dy);
                if (sampleUv.x < 0.0 || sampleUv.x > 1.0 ||
                    sampleUv.y < 0.0 || sampleUv.y > 1.0) continue;
                vec4 neighbor = texture2D(uStateTexture, sampleUv);
                if (neighbor.b > 0.25 && neighbor.b < 0.75) {
                    float dist = length(vec2(float(i), float(j)));
                    heatGlow += exp(-dist * 1.5) * 0.3;
                }
            }
        }
        color += vec3(0.5, 0.1, 0.0) * heatGlow;
    } else if (burnState > 0.75) {
        float emberNoise = fbm(vUv * 50.0 + uTime * 0.1);
        color = mix(ashColor, vec3(0.2, 0.08, 0.02), emberNoise * 0.3 * (1.0 - burnProgress));
    } else {
        vec2 fireUv = vUv;
        fireUv += windVec * vec2(0.02) * (1.0 - burnProgress);

        float fireNoise = fbm(fireUv * 8.0 + vec2(0.0, -uTime * 3.0));
        float fireNoise2 = fbm(fireUv * 15.0 + vec2(uTime * 1.5, -uTime * 4.0));

        float fireIntensity = (1.0 - burnProgress) * (0.6 + 0.4 * fireNoise);

        float stretchFactor = 1.0 + max(dot(windVec, vec2(0.0, 1.0)), 0.0) * 1.5;
        fireIntensity *= stretchFactor;

        vec3 fireColor = mix(fireBaseColor, fireTipColor, fireNoise);
        fireColor = mix(fireColor, fireCoreColor, fireNoise2 * 0.4);
        fireColor *= 1.0 + fireNoise * 0.5;

        float edgeGlow = smoothstep(0.0, 0.3, burnProgress) * smoothstep(1.0, 0.5, burnProgress);
        fireColor *= 1.0 + edgeGlow * 0.8;

        color = mix(vegetationColor * 0.3, fireColor, fireIntensity);
        color += vec3(0.3, 0.05, 0.0) * (1.0 - burnProgress) * 0.5;

        float smokeNoise = fbm(vUv * 5.0 + vec2(uTime * 0.3, -uTime * 0.8));
        vec3 smokeColor = vec3(0.3, 0.28, 0.25);
        float smokeAmount = smoothstep(0.4, 0.8, burnProgress) * smokeNoise * 0.5;
        color = mix(color, smokeColor, smokeAmount);
    }

    gl_FragColor = vec4(color, alpha);
}
