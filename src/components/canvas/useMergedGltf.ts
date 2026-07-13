import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Loads a GLTF/GLB, merges all mesh geometries into one, recenters it at origin,
 * and reports the local Y range (used by the dispersion tint gradient).
 */
export function useMergedGltf(url: string, recomputeNormals = false) {
  const gltf = useLoader(GLTFLoader, url);
  return useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) {
        const g = mesh.geometry.clone();
        g.applyMatrix4(mesh.matrixWorld);
        // keep only position+normal+uv to allow a clean merge
        for (const attr of Object.keys(g.attributes)) {
          if (!["position", "normal", "uv"].includes(attr)) g.deleteAttribute(attr);
        }
        if (!g.attributes.normal) g.computeVertexNormals();
        if (!g.attributes.uv) {
          const count = g.attributes.position.count;
          g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * 2), 2));
        }
        geometries.push(g);
      }
    });

    const merged =
      geometries.length > 1
        ? (mergeGeometries(geometries, false) ?? geometries[0])
        : geometries[0];

    if (recomputeNormals) {
      merged.deleteAttribute("normal");
      merged.computeVertexNormals();
    }

    merged.computeBoundingBox();
    const bb = merged.boundingBox!;
    const center = new THREE.Vector3();
    bb.getCenter(center);
    merged.translate(-center.x, -center.y, -center.z);
    merged.computeBoundingBox();

    const localYRange = new THREE.Vector2(
      merged.boundingBox!.min.y,
      merged.boundingBox!.max.y,
    );
    return { geometry: merged, localYRange };
  }, [gltf, recomputeNormals]);
}
