export class GLTFMeshLoader {

    async load(url) {
        // ALWAYS work with URL objects
        const gltfUrl = url instanceof URL
            ? url
            : new URL(url, import.meta.url);

        const gltf = await fetch(gltfUrl).then(r => r.json());

        // load binary buffer
        const binUrl = new URL(gltf.buffers[0].uri, gltfUrl);
        const bin = await fetch(binUrl).then(r => r.arrayBuffer());

        // assume: 1 mesh, 1 primitive
        const primitive = gltf.meshes[0].primitives[0];

        const positions = this.readAccessor(
            gltf, bin, primitive.attributes.POSITION
        );

        const uvs = primitive.attributes.TEXCOORD_0 !== undefined
            ? this.readAccessor(
                gltf, bin, primitive.attributes.TEXCOORD_0
              )
            : null;

        const indices = this.readIndices(
            gltf, bin, primitive.indices
        );

        return this.buildInterleavedVertices(positions, uvs, indices);
    }

    readAccessor(gltf, bin, accessorIndex) {
        const accessor = gltf.accessors[accessorIndex];
        const view = gltf.bufferViews[accessor.bufferView];

        const componentCount = {
            SCALAR: 1,
            VEC2: 2,
            VEC3: 3
        }[accessor.type];

        const byteOffset =
            (view.byteOffset ?? 0) +
            (accessor.byteOffset ?? 0);

        return new Float32Array(
            bin,
            byteOffset,
            accessor.count * componentCount
        );
    }

    readIndices(gltf, bin, accessorIndex) {
        const accessor = gltf.accessors[accessorIndex];
        const view = gltf.bufferViews[accessor.bufferView];

        const byteOffset =
            (view.byteOffset ?? 0) +
            (accessor.byteOffset ?? 0);

        if (accessor.componentType === 5123) {
            return new Uint16Array(bin, byteOffset, accessor.count);
        }
        if (accessor.componentType === 5125) {
            return new Uint32Array(bin, byteOffset, accessor.count);
        }

        throw new Error('Unsupported index type');
    }

    buildInterleavedVertices(positions, uvs, indices) {
        const vertexCount = positions.length / 3;
        const data = new Float32Array(vertexCount * 10);

        for (let i = 0; i < vertexCount; i++) {
            const p = i * 3;
            const t = i * 2;
            const v = i * 10;

            // position (vec4)
            data[v + 0] = positions[p + 0];
            data[v + 1] = positions[p + 1];
            data[v + 2] = positions[p + 2];
            data[v + 3] = 1;

            // color (white)
            data[v + 4] = 1;
            data[v + 5] = 1;
            data[v + 6] = 1;
            data[v + 7] = 1;

            // uv
            if (uvs) {
                data[v + 8] = uvs[t + 0];
                data[v + 9] = uvs[t + 1];
            } else {
                data[v + 8] = 0;
                data[v + 9] = 0;
            }
        }

        return {
            vertices: data,
            indices
        };
    }
}
