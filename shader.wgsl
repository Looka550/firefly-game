struct VertexInput{
    @location(0) position : vec4f,
    @location(1) color    : vec4f,
    @location(2) texcoords: vec2f,
    @location(3) normal   : vec3f,
};

struct VertexOutput{
    @builtin(position) clipPosition : vec4f,
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
    @location(3) color : vec4f,
};

struct FragmentOutput{
    @location(0) color : vec4f,
};

@group(0) @binding(0) var<uniform> modelMatrix : mat4x4f;
@group(0) @binding(1) var<uniform> viewProjMatrix : mat4x4f;
@group(0) @binding(2) var baseTexture : texture_2d<f32>;
@group(0) @binding(3) var baseSampler : sampler;
@group(0) @binding(4) var<uniform> normalMatrix : mat4x4f;
@group(0) @binding(5) var normalSampler : sampler;
@group(0) @binding(6) var normalTexture : texture_2d<f32>;
@group(0) @binding(7) var<uniform> hasNormalMap : u32;

@group(2) @binding(0) var shadowMap : texture_depth_2d;
@group(2) @binding(1) var shadowSampler : sampler_comparison;
@group(2) @binding(2) var<uniform> lightViewProj : mat4x4f;


struct LightUniforms{
    position    : vec3f,
    ambient     : f32,
    attenuation : f32,
    intensity   : f32,
    padding    : vec3f, // poravnava na 32b
};

struct LightsBlock{
    lights     : array<LightUniforms, 32>,
    lightCount : u32,
    padding   : vec3u,
};

@group(3) @binding(0) var<uniform> lightsBlock : LightsBlock;

struct CameraUniforms{
    position : vec3f,
    padding : f32,
};

@group(1) @binding(0) var<uniform> camera : CameraUniforms;


@vertex
fn vertex(input: VertexInput) -> VertexOutput{
    var output: VertexOutput;

    let worldPos = modelMatrix * input.position;
    output.clipPosition = viewProjMatrix * worldPos;

    output.position = worldPos.xyz;
    output.normal = (normalMatrix * vec4(input.normal, 0.0)).xyz;
    output.texcoords = input.texcoords;
    output.color = input.color;

    return output;
}

@fragment
fn fragment(input: VertexOutput) -> FragmentOutput{
    var output: FragmentOutput;

    let materialColor = textureSample(baseTexture, baseSampler, input.texcoords) * input.color;

    var N = normalize(input.normal);

    if(hasNormalMap == 1u){
        let normalSample = textureSample(normalTexture, normalSampler, input.texcoords).xyz;
        let tangentNormal = normalize(normalSample * 2.0 - 1.0);
        N = normalize(input.normal + tangentNormal * 0.5);
    }

    let V = normalize(camera.position - input.position);

    var diffuseSum : f32 = 0.0;
    var specularSum : f32 = 0.0;
    var ambientSum : f32 = 0.0;

    let shininess : f32 = 32.0;
    let specularIntensity : f32 = 0.3;

    for (var i: u32 = 0u; i < lightsBlock.lightCount; i = i + 1u) {
        let light = lightsBlock.lights[i];

        let Lvec = light.position - input.position;
        let distance = length(Lvec);
        let L = normalize(Lvec);

        let attenuation = 1.0 / (1.0 + light.attenuation * distance * distance);
        let lambert = max(dot(N, L), 0.0);
        let H = normalize(L + V);
        let spec = pow(max(dot(N, H), 0.0), shininess);

        diffuseSum += lambert * attenuation * light.intensity;
        specularSum += spec * attenuation * specularIntensity * light.intensity;
        ambientSum += light.ambient;
    }

    let pointLightMask = clamp(diffuseSum + specularSum, 0.0, 1.0);


    // shadows
    let lightPos = lightViewProj * vec4f(input.position, 1.0);

    let flippedPos = vec3f(input.position.x, input.position.y, -input.position.z);
    let lightPosOffset = lightViewProj * vec4f(flippedPos, 1.0);

    let proj = lightPosOffset.xyz / lightPosOffset.w;
    var uv = proj.xy * 0.5 + 0.5;

    let shadowUV = proj.xy * 0.5 + 0.5;
    let normalBias = max(0.65 * (1.0 - dot(input.normal, normalize(vec3f(0, -1, 0)))), 0.2);


    var shadowSum: f32 = 0.0;
    let texSize: vec2f = vec2f(textureDimensions(shadowMap));
    for(var x: i32 = -1; x <= 1; x = x + 1){
        for(var y: i32 = -1; y <= 1; y = y + 1){
            let offset: vec2f = vec2f(f32(x)/texSize.x, f32(y)/texSize.y);
            shadowSum += textureSampleCompare(shadowMap, shadowSampler, shadowUV + offset, proj.z - normalBias);
        }
    }
    let shadow = shadowSum / 9.0; // 3x3 kernel


    let shadowFadeStart = 0.15;
    let shadowFadeEnd   = 0.5;

    // 0 = no light, 1 = strong light
    let shadowErase = smoothstep(shadowFadeStart, shadowFadeEnd, pointLightMask);
    let finalShadow = mix(shadow, 1.0, shadowErase);

    var color = materialColor.rgb * (diffuseSum + specularSum + ambientSum) * finalShadow;

    // fog

    let fogColor = vec3f(0.165, 0.161, 0.2);
    let fogDensity = 0.01;

    // dist from camera
    let viewDistance = distance(camera.position, input.position);

    let fogFactor = exp(-viewDistance * fogDensity);
    let fog = clamp(fogFactor, 0.0, 1.0);

    color = mix(fogColor, color, fog);

    output.color = vec4f(color, materialColor.a); // color + shadows + removing of shadows

    //output.color = vec4f(color, materialColor.a); // color + shadows
    //output.color = vec4f(vec3f(shadow), 1.0); // only shadows
    return output;
}
