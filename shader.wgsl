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
@group(0) @binding(4) var<uniform> lightPosition : vec3f;

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let worldPos = modelMatrix * input.position;
    output.clipPosition = viewProjMatrix * worldPos;

    output.position = worldPos.xyz;
    output.normal = input.normal; // normalMatrix comes next tutorial step
    output.texcoords = input.texcoords;

    return output;
}


@fragment
fn fragment(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;

    let texColor = textureSample(baseTexture, baseSampler, input.texcoords);

    let N = normalize(input.normal);
    let L = normalize(lightPosition - input.position);

    let lambert = max(dot(N, L), 0.0);


    output.color = vec4f(texColor.rgb * lambert, texColor.a);

    return output;
}
