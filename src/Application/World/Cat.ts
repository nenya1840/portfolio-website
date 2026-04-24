import * as THREE from 'three';
import Application from '../Application';
import Resources from '../Utils/Resources';
import Time from '../Utils/Time';

export default class Cat {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    time: Time;

    model: THREE.Group;
    zzz: { sprite: THREE.Sprite; offset: number; basePos: THREE.Vector3 }[] = [];

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        this.time = this.application.time;

        this.setModel();
        this.setZzz();
    }

    setModel() {
        this.model = this.resources.items.gltfModel.catModel.scene;

        // Scene has no lights — convert lit materials to MeshBasicMaterial
        // while keeping each mesh's original texture/color.
        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const src: any = child.material;
                const basic = new THREE.MeshBasicMaterial({
                    map: src.map ?? null,
                    color: src.color ? src.color.clone() : new THREE.Color(0xffffff),
                    transparent: src.transparent ?? false,
                    opacity: src.opacity ?? 1,
                });
                child.material = basic;
            }
        });

        this.model.scale.setScalar(700);
        this.model.position.set(700, -1000, 2500);
        this.model.rotation.y = -Math.PI / 4;

        this.scene.add(this.model);
    }

    makeTextSprite(
        text: string,
        opts: { fontSize?: number; color?: string; weight?: string } = {}
    ): THREE.Sprite {
        const fontSize = opts.fontSize ?? 120;
        const color = opts.color ?? '#333333';
        const weight = opts.weight ?? 'bold';
        const pad = 40;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const font = `${weight} ${fontSize}px "Comic Sans MS", "Marker Felt", cursive`;
        ctx.font = font;
        const metrics = ctx.measureText(text);
        canvas.width = Math.ceil(metrics.width + pad * 2);
        canvas.height = fontSize + pad * 2;

        // Reassigning size resets the context — re-apply font.
        ctx.font = font;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(canvas.width, canvas.height, 1);
        return sprite;
    }

    setZzz() {
        const texts = ['z', 'Z', 'z'];
        const p = this.model.position;
        for (let i = 0; i < texts.length; i++) {
            const sprite = this.makeTextSprite(texts[i], {
                fontSize: 100,
                color: '#9aa3b2',
                weight: 'bold',
            });
            const basePos = new THREE.Vector3(
                p.x + 200 + i * 80,
                p.y + 500 + i * 120,
                p.z
            );
            sprite.position.copy(basePos);
            sprite.renderOrder = 999;
            this.scene.add(sprite);
            // Stagger each Z by a different phase offset.
            this.zzz.push({ sprite, offset: i * 1200, basePos });
        }
    }

    update() {
        const t = this.time.elapsed;
        for (const z of this.zzz) {
            // 3-second loop: rise 400 units and fade out.
            const period = 3000;
            const phase = ((t + z.offset) % period) / period; // 0..1
            z.sprite.position.y = z.basePos.y + phase * 400;
            z.sprite.position.x = z.basePos.x + Math.sin(phase * Math.PI * 2) * 30;
            (z.sprite.material as THREE.SpriteMaterial).opacity = 1 - phase;
        }
    }
}
