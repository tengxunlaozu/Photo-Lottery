/**
 * 3D 场景可视化模块 (基于 Three.js)
 */
const ThreeScene = {
    scene: null,
    camera: null,
    renderer: null,
    objects: [],
    stars: null,
    isRotating: true,
    rotationSpeed: 0.005,
    sphereRadius: 800,

    /**
     * 初始化 3D 渲染器和场景
     * @param {string} containerId - 挂载节点的 ID
     */
    init(containerId) {
        const container = document.getElementById(containerId);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.z = 3000;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        this.createStarfield();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate();
    },

    /**
     * 创建基于照片数据的 3D 球形墙
     * @param {Array} photos - 照片数据列表
     */
    createPhotoSphere(photos) {
        this.objects.forEach(obj => this.scene.remove(obj));
        this.objects = [];

        const l = photos.length;
        if (l === 0) return;

        for (let i = 0; i < l; i++) {
            const phi = Math.acos(-1 + (2 * i) / l);
            const theta = Math.sqrt(l * Math.PI) * phi;

            const texture = new THREE.TextureLoader().load(photos[i].data);
            const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
            const geometry = new THREE.PlaneGeometry(120, 120);
            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.setFromSphericalCoords(this.sphereRadius, phi, theta);
            mesh.lookAt(new THREE.Vector3(0, 0, 0));
            mesh.rotation.y += Math.PI;

            this.scene.add(mesh);
            this.objects.push(mesh);
        }
    },

    /**
     * 创建动态星空背景
     */
    createStarfield() {
        const vertices = [];
        const colors = [];
        const colorPresets = [
            new THREE.Color(0xff4d4d),
            new THREE.Color(0x9d4edd),
            new THREE.Color(0x48cae4),
            new THREE.Color(0xffd700),
            new THREE.Color(0xffffff)
        ];

        for (let i = 0; i < 5000; i++) {
            const x = THREE.MathUtils.randFloatSpread(5000);
            const y = THREE.MathUtils.randFloatSpread(5000);
            const z = THREE.MathUtils.randFloatSpread(5000);
            vertices.push(x, y, z);

            const color = colorPresets[Math.floor(Math.random() * colorPresets.length)];
            colors.push(color.r, color.g, color.b);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 4,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    },

    /**
     * 设置球体旋转速度 (抽奖时提速)
     */
    setSpeed(speed) {
        this.rotationSpeed = speed;
    },

    /**
     * 核心渲染循环
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isRotating) {
            this.scene.rotation.y += this.rotationSpeed;
            this.scene.rotation.x += this.rotationSpeed * 0.2;

            if (this.stars) {
                this.stars.rotation.y -= 0.0005;
                this.stars.rotation.z += 0.0002;
            }
        }

        TWEEN.update();
        this.renderer.render(this.scene, this.camera);
    }
};
