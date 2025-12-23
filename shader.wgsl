struct VertexInput {
    @location(0) position : vec4f,
    @location(1) color    : vec4f,
    @location(2) texcoords: vec2f,
    @location(3) normal   : vec3f,
};

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(0) color     : vec4f,
    @location(1) texcoords : vec2f,
    @location(2) normal    : vec3f,
};

struct FragmentOutput {
    @location(0) color : vec4f,
};

@group(0) @binding(0) var<uniform> mvpMatrix : mat4x4f;
@group(0) @binding(1) var baseTexture : texture_2d<f32>;
@group(0) @binding(2) var baseSampler : sampler;

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    output.position = mvpMatrix * input.position;
    output.color = input.color;
    output.texcoords = input.texcoords;

    // College tutorial equivalent (simplified, no normalMatrix yet)
    output.normal = input.normal;

    return output;
}

@fragment
fn fragment(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;

    let texColor = textureSample(baseTexture, baseSampler, input.texcoords);

    let N = normalize(input.normal);
    let L = normalize(vec3f(0.0, 1.0, 0.0));

    let lambert = max(dot(N, L), 0.0);

    output.color = vec4f(texColor.rgb * lambert, texColor.a);

    return output;
}
