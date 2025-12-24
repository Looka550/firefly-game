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
    position : vec3f,
    ambient  : f32,
};

struct LightsBlock {
    lights     : array<LightUniforms, 16>,
    lightCount : u32,
    _padding   : vec3u, // padding to 16-byte alignment
};

@group(3) @binding(0) var<uniform> lightsBlock : LightsBlock;

struct CameraUniforms {
    position : vec3f,
    _padding : f32,
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

    var lighting : f32 = 0.0;
    var specular : f32 = 0.0;

    let shininess : f32 = 32.0;

    for (var i: u32 = 0u; i < lightsBlock.lightCount; i = i + 1u) {
        let light = lightsBlock.lights[i];

        let L = normalize(light.position - input.position);
        let lambert = max(dot(N, L), 0.0);

        // ---- PHONG SPECULAR ----
        let R = reflect(-L, N);
        let spec = pow(max(dot(V, R), 0.0), shininess);

        lighting += lambert + light.ambient;
        specular += spec;
    }

    let color = materialColor.rgb * lighting + vec3f(specular);
    output.color = vec4f(color, materialColor.a);
    return output;
}

