struct VertexInput {
    @location(0) position : vec4f
};

@group(0) @binding(0) var<uniform> modelMatrix : mat4x4f;
@group(0) @binding(1) var<uniform> lightVP : mat4x4f;

@vertex
fn vertex(input: VertexInput) -> @builtin(position) vec4f {
    return lightVP * modelMatrix * input.position;
}