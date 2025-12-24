struct VertexInput {
    @location(0) position : vec4f,
    @location(1) color    : vec4f,
    @location(2) texcoords: vec2f,
    @location(3) normal   : vec3f,
};

struct VertexOutput {
    @builtin(position) clipPosition : vec4f,
    @location(0) position : vec3f,   // world position
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
    position: vec3f,
    ambient: f32,
};

@group(3) @binding(0) var<uniform> light0 : LightUniforms;
@group(3) @binding(1) var<uniform> light1 : LightUniforms;

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

    // Light 0
    let L0 = normalize(light0.position - input.position);
    let lambert0 = max(dot(N, L0), 0.0);
    let lighting0 = lambert0 + light0.ambient;

    // Light 1
    let L1 = normalize(light1.position - input.position);
    let lambert1 = max(dot(N, L1), 0.0);
    let lighting1 = lambert1 + light1.ambient;

    let lighting = (lighting0 + lighting1) / 1.0; // average contribution

    output.color = vec4f(materialColor.rgb * lighting, materialColor.a);
    return output;
}