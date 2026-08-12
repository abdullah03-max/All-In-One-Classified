import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Marketplace3DHeroProps {
  scrollProgress: number; // 0 to 1
  onCategorySelect?: (slug: string) => void;
}

export const Marketplace3DHero: React.FC<Marketplace3DHeroProps> = ({ scrollProgress }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // WebGL support check
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.035);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 5, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isMobile;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    mainLight.position.set(10, 20, 15);
    scene.add(mainLight);

    const accentLight = new THREE.PointLight(0xf97316, 3, 25);
    accentLight.position.set(-8, 5, 5);
    scene.add(accentLight);

    const techLight = new THREE.PointLight(0x3b82f6, 4, 20);
    techLight.position.set(-6, 3, 6);
    scene.add(techLight);

    // Grouping
    const marketplaceGroup = new THREE.Group();
    scene.add(marketplaceGroup);

    // 1. Grid Floor
    const gridHelper = new THREE.GridHelper(50, 40, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -1;
    marketplaceGroup.add(gridHelper);

    // 2. Central Marketplace Core Hologram
    const coreGeo = new THREE.IcosahedronGeometry(1.8, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      wireframe: true,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 2, 0);
    marketplaceGroup.add(coreMesh);

    const innerCoreGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xeab308,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    coreMesh.add(innerCoreMesh);

    // 3. Mobile & Tech Zone (Left Front: x: -6, y: 1, z: 6)
    const techGroup = new THREE.Group();
    techGroup.position.set(-6, 1, 6);

    // Phone model shape
    const phoneGeo = new THREE.BoxGeometry(0.9, 1.8, 0.12);
    const phoneMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const phoneMesh = new THREE.Mesh(phoneGeo, phoneMat);
    phoneMesh.rotation.y = 0.3;
    techGroup.add(phoneMesh);

    // Phone screen glow
    const screenGeo = new THREE.PlaneGeometry(0.82, 1.68);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.07;
    phoneMesh.add(screenMesh);

    // Laptop model shape
    const laptopBaseGeo = new THREE.BoxGeometry(1.6, 0.08, 1.1);
    const laptopMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
    laptopBase.position.set(1.4, -0.4, -0.2);
    laptopBase.rotation.y = -0.4;
    techGroup.add(laptopBase);

    const laptopScreenGeo = new THREE.BoxGeometry(1.58, 1.0, 0.06);
    const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopMat);
    laptopScreen.position.set(0, 0.5, -0.5);
    laptopScreen.rotation.x = -0.25;
    laptopBase.add(laptopScreen);

    marketplaceGroup.add(techGroup);

    // 4. Vehicles Zone (Right Front: x: 6, y: 1, z: 4)
    const vehicleGroup = new THREE.Group();
    vehicleGroup.position.set(6, 1, 4);

    const carBodyGeo = new THREE.BoxGeometry(2.4, 0.6, 1.2);
    const carMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.1 });
    const carBody = new THREE.Mesh(carBodyGeo, carMat);
    vehicleGroup.add(carBody);

    const carTopGeo = new THREE.BoxGeometry(1.3, 0.5, 1.0);
    const carTopMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.3 });
    const carTop = new THREE.Mesh(carTopGeo, carTopMat);
    carTop.position.set(-0.2, 0.5, 0);
    carBody.add(carTop);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.8 });
    const wheelPositions = [
      [-0.7, -0.3, 0.65],
      [0.7, -0.3, 0.65],
      [-0.7, -0.3, -0.65],
      [0.7, -0.3, -0.65],
    ];
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, y, z);
      carBody.add(wheel);
    });

    marketplaceGroup.add(vehicleGroup);

    // 5. Property Zone (Left Back: x: -5, y: 2, z: -3)
    const propGroup = new THREE.Group();
    propGroup.position.set(-5, 2, -3);

    const houseBaseGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
    const houseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const houseBase = new THREE.Mesh(houseBaseGeo, houseMat);
    propGroup.add(houseBase);

    const roofGeo = new THREE.ConeGeometry(1.8, 1.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.7;
    roof.rotation.y = Math.PI / 4;
    houseBase.add(roof);

    marketplaceGroup.add(propGroup);

    // 6. Jobs & Services Zone (Right Back: x: 5, y: 2, z: -5)
    const jobsGroup = new THREE.Group();
    jobsGroup.position.set(5, 2, -5);

    const towerGeo = new THREE.BoxGeometry(1.4, 4.0, 1.4);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.2 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    jobsGroup.add(tower);

    marketplaceGroup.add(jobsGroup);

    // Floating Ambient Particles
    const particlesCount = isMobile ? 60 : 160;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 35;
      pPos[i + 1] = Math.random() * 12;
      pPos[i + 2] = (Math.random() - 0.5) * 35;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.15,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Idle Rotation
      coreMesh.rotation.y += 0.008;
      coreMesh.rotation.x += 0.004;
      phoneMesh.rotation.y += 0.005;
      carBody.rotation.y += 0.003;
      houseBase.rotation.y += 0.002;
      particles.rotation.y += 0.0005;

      // Scroll Interpolation
      const progress = Math.max(0, Math.min(1, scrollProgress));

      let targetCamX = 0;
      let targetCamY = 5;
      let targetCamZ = 18;
      let targetLookX = 0;
      let targetLookY = 0;
      let targetLookZ = 0;

      if (progress < 0.18) {
        const t = progress / 0.18;
        targetCamX = THREE.MathUtils.lerp(0, -6, t);
        targetCamY = THREE.MathUtils.lerp(5, 2.5, t);
        targetCamZ = THREE.MathUtils.lerp(18, 9.5, t);
        targetLookX = THREE.MathUtils.lerp(0, -6, t);
        targetLookY = THREE.MathUtils.lerp(0, 1, t);
        targetLookZ = THREE.MathUtils.lerp(0, 6, t);
      } else if (progress < 0.38) {
        const t = (progress - 0.18) / 0.2;
        targetCamX = THREE.MathUtils.lerp(-6, 6, t);
        targetCamY = THREE.MathUtils.lerp(2.5, 2.5, t);
        targetCamZ = THREE.MathUtils.lerp(9.5, 7.5, t);
        targetLookX = THREE.MathUtils.lerp(-6, 6, t);
        targetLookY = THREE.MathUtils.lerp(1, 1, t);
        targetLookZ = THREE.MathUtils.lerp(6, 4, t);
      } else if (progress < 0.58) {
        const t = (progress - 0.38) / 0.2;
        targetCamX = THREE.MathUtils.lerp(6, -5, t);
        targetCamY = THREE.MathUtils.lerp(2.5, 3.5, t);
        targetCamZ = THREE.MathUtils.lerp(7.5, 0.5, t);
        targetLookX = THREE.MathUtils.lerp(6, -5, t);
        targetLookY = THREE.MathUtils.lerp(1, 2, t);
        targetLookZ = THREE.MathUtils.lerp(4, -3, t);
      } else if (progress < 0.78) {
        const t = (progress - 0.58) / 0.2;
        targetCamX = THREE.MathUtils.lerp(-5, 5, t);
        targetCamY = THREE.MathUtils.lerp(3.5, 3.5, t);
        targetCamZ = THREE.MathUtils.lerp(0.5, -1.5, t);
        targetLookX = THREE.MathUtils.lerp(-5, 5, t);
        targetLookY = THREE.MathUtils.lerp(2, 2, t);
        targetLookZ = THREE.MathUtils.lerp(-3, -5, t);
      } else {
        const t = (progress - 0.78) / 0.22;
        targetCamX = THREE.MathUtils.lerp(5, 0, t);
        targetCamY = THREE.MathUtils.lerp(3.5, 9, t);
        targetCamZ = THREE.MathUtils.lerp(-1.5, 22, t);
        targetLookX = THREE.MathUtils.lerp(5, 0, t);
        targetLookY = THREE.MathUtils.lerp(2, 1, t);
        targetLookZ = THREE.MathUtils.lerp(-5, 0, t);
      }

      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.y += (targetCamY - camera.position.y) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;

      camera.lookAt(targetLookX, targetLookY, targetLookZ);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      scene.clear();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [scrollProgress, isMobile]);

  if (!webglSupported) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>
    );
  }

  return (
    <div ref={mountRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0" />
  );
};
