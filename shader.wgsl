struct VertexInput {
    @location(0) position : vec4f,
    @location(1) color    : vec4f,
    @location(2) texcoords: vec2f,
    @location(3) normal   : vec3f,
};

struct VertexOutput {
    @builtin(position) clipPosition : vec4f,
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
};

struct FragmentOutput {
    @location(0) color : vec4f,
};

@group(0) @binding(0) var<uniform> modelMatrix : mat4x4f;
@group(0) @binding(1) var<uniform> viewProjMatrix : mat4x4f;
@group(0) @binding(2) var baseTexture : texture_2d<f32>;
@group(0) @binding(3) var baseSampler : sampler;
@group(0) @binding(4) var<uniform> normalMatrix : mat4x4f;

struct LightUniforms {
    position    : vec3f,
    ambient     : f32,
    attenuation : f32,
    padding    : vec3f, // poravnava na 32 B
};

struct LightsBlock {
    lights     : array<LightUniforms, 16>,
    lightCount : u32,
    padding   : vec3u,
};

@group(3) @binding(0) var<uniform> lightsBlock : LightsBlock;

struct CameraUniforms {
    position : vec3f,
    padding : f32,
};

@group(1) @binding(0) var<uniform> camera : CameraUniforms;


@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let worldPos = modelMatrix * input.position;
    output.clipPosition = viewProjMatrix * worldPos;

    output.position = worldPos.xyz;
    output.normal = (normalMatrix * vec4(input.normal, 0.0)).xyz;
    output.texcoords = input.texcoords;

    return output;
}

@fragment
fn fragment(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;

    let materialColor = textureSample(baseTexture, baseSampler, input.texcoords);
    let N = normalize(input.normal);
    let V = normalize(camera.position - input.position);

    var diffuseSum : f32 = 0.0;
    var specularSum : f32 = 0.0;
    var ambientSum : f32 = 0.0;

    let shininess : f32 = 32.0;
    let specularIntensity : f32 = 0.3; // 0 = no specular, 1 = full

    for (var i: u32 = 0u; i < lightsBlock.lightCount; i = i + 1u) {
        let light = lightsBlock.lights[i];

        let Lvec = light.position - input.position;
        let distance = length(Lvec);
        let L = normalize(Lvec);

        // --- Attenuation ---
        let attenuation = 1.0 / (1.0 + light.attenuation * distance * distance);

        // --- Lambert ---
        let lambert = max(dot(N, L), 0.0);

        // --- Blinn-Phong ---
        let H = normalize(L + V);
        let spec = pow(max(dot(N, H), 0.0), shininess);

        diffuseSum += (lambert + light.ambient) * attenuation;
        specularSum += spec * attenuation * specularIntensity;
        ambientSum += light.ambient;
    }

    var color =
        materialColor.rgb * (diffuseSum + ambientSum) +
        vec3f(specularSum);

    //color = vec3f(ambientSum);

    output.color = vec4f(color, materialColor.a);
    return output;
}