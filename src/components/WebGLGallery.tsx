import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { useAddToCart, useIsInCart, useIsWishlisted, useToggleWishlist } from "@/hooks/useCommerce";
import { useFormatPrice } from "@/lib/currency-format";

export interface GalleryItem {
  slug: string;
  title: string;
  artist: string;
  image: string;
  id?: string;
  price_min?: number | null;
  price_max?: number | null;
  price_display?: "range" | "on_request" | "fixed";
  display_price?: number | null;
}

type VitrineElement = HTMLDivElement & {
  __nudge?: (dir: 1 | -1) => void;
};

const VERT = /* glsl */ `
  varying vec2 vUv;
  uniform float uHover;
  uniform float uVelocity;
  void main() {
    vUv = uv;
    vec3 p = position;
    float speed = clamp(abs(uVelocity), 0.0, 1.0);
    float w = sin(uv.y * 3.1415) * speed * 0.08;
    p.x += w;
    p.z += sin(uv.x * 3.1415) * uHover * 0.12;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uHover;
  uniform float uVelocity;
  uniform float uTime;
  void main() {
    float speed = clamp(abs(uVelocity), 0.0, 1.0);
    float shift = speed * 0.006 + uHover * 0.003;
    vec2 uv = vUv;
    vec2 c = uv - 0.5;
    uv = 0.5 + c * (1.0 - uHover * 0.025);
    float r = texture2D(uTex, uv + vec2(shift, 0.0)).r;
    float g = texture2D(uTex, uv).g;
    float b = texture2D(uTex, uv - vec2(shift, 0.0)).b;
    vec3 col = vec3(r, g, b);
    float v = smoothstep(1.1, 0.3, length(c));
    col *= mix(0.85, 1.05, v);
    col += vec3(0.16, 0.0, 0.0) * uHover * (0.5 + 0.5 * sin(uTime * 2.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function WebGLGallery({ items }: { items: GalleryItem[] }) {
  const formatPrice = useFormatPrice();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const [supported, setSupported] = useState(true);
  // Manual offset (in index units) is rebased whenever the user clicks controls,
  // so button navigation and scroll navigation share one virtual focus value.
  const manualOffsetRef = useRef(0);
  const scrollIndexRef = useRef(0);
  const targetIndexRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
      });
    } catch {
      setSupported(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 8.15;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const planes: THREE.Mesh[] = [];
    const geo = new THREE.PlaneGeometry(1.6, 2, 32, 32);

    items.forEach((it, i) => {
      const uniforms = {
        uTex: { value: new THREE.Texture() },
        uHover: { value: 0 },
        uVelocity: { value: 0 },
        uTime: { value: 0 },
      };
      loader.load(it.image, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
        uniforms.uTex.value = tex;
      });
      const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.index = i;
      scene.add(mesh);
      planes.push(mesh);
    });

    const spacing = 2.18;
    const lastIndex = items.length - 1;

    const state = {
      current: targetIndexRef.current,
      target: targetIndexRef.current,
      velocity: 0,
      focus: targetIndexRef.current,
    };

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // Single source of truth: map scroll progress → float index → clamp → round
    let scrollRaf = 0;
    const computeFromScroll = () => {
      scrollRaf = 0;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh;
      const passed = vh - r.top;
      const p = Math.min(Math.max(passed / total, 0), 1);
      // Map progress across [0, lastIndex]
      const rawIdx = p * lastIndex;
      scrollIndexRef.current = rawIdx;
      const combined = Math.min(lastIndex, Math.max(0, rawIdx + manualOffsetRef.current));
      const focused = Math.min(lastIndex, Math.max(0, Math.round(combined)));
      targetIndexRef.current = focused;
      state.target = focused;
    };
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(computeFromScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    computeFromScroll();

    // Expose a way for React handlers to nudge the target
    const wrap = wrapRef.current as VitrineElement | null;
    if (!wrap) return;
    wrap.__nudge = (dir: 1 | -1) => {
      const current = targetIndexRef.current;
      const next = Math.min(lastIndex, Math.max(0, current + dir));
      if (next === current) return;
      manualOffsetRef.current = next - scrollIndexRef.current;
      targetIndexRef.current = next;
      state.target = next;
      state.focus = next;
      setFocus(next);
    };

    // Click handling via raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const onClick = () => {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(planes);
      if (hits[0]) {
        const idx = hits[0].object.userData.index as number;
        const slug = items[idx].slug;
        window.location.href = `/artworks/${slug}`;
      }
    };
    const canvas = canvasRef.current;
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (visible = e.isIntersecting)),
      { threshold: 0.01 },
    );
    io.observe(wrap);

    let rafId = 0;
    const clock = new THREE.Clock();
    const render = () => {
      rafId = requestAnimationFrame(render);
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.033);
      const time = clock.getElapsedTime();
      const prev = state.current;
      state.current = THREE.MathUtils.damp(state.current, state.target, 3.35, dt);
      const instantVelocity = (state.current - prev) / Math.max(dt, 0.016);
      const normalizedVelocity = THREE.MathUtils.clamp(instantVelocity / 14, -1, 1);
      state.velocity = THREE.MathUtils.damp(state.velocity, normalizedVelocity, 7, dt);

      planes.forEach((p, i) => {
        const offset = i - state.current;
        const x = offset * spacing;
        p.position.x = x;
        p.position.z = -Math.abs(offset) * 0.62 - Math.min(Math.abs(offset), 1) * 0.08;
        p.position.y = 0.72 + Math.sin(offset * 0.52) * 0.025;
        p.rotation.y = -offset * 0.11;
        p.rotation.z = -offset * 0.012;
        const dist = Math.abs(x);
        const hover = Math.max(0, 1 - dist / 1.6);
        const mat = p.material as THREE.ShaderMaterial;
        mat.uniforms.uHover.value = THREE.MathUtils.damp(mat.uniforms.uHover.value, hover, 8, dt);
        mat.uniforms.uVelocity.value = state.velocity;
        mat.uniforms.uTime.value = time;
        const scale = 1 + hover * 0.075;
        p.scale.setScalar(THREE.MathUtils.damp(p.scale.x, scale, 8, dt));
      });

      const visualIndex = THREE.MathUtils.clamp(Math.round(state.current), 0, lastIndex);
      if (visualIndex !== state.focus) {
        state.focus = visualIndex;
        setFocus(visualIndex);
      }

      const caption = captionRef.current;
      if (caption) {
        const rect = canvas.getBoundingClientRect();
        caption.style.left = `${rect.width / 2}px`;
        caption.style.top = `${Math.min(rect.height * 0.66, rect.height - 210)}px`;
        caption.style.width = `${Math.min(rect.width * 0.82, 560)}px`;
      }

      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
      wrap.__nudge = undefined;
      io.disconnect();
      planes.forEach((p) => {
        const mat = p.material as THREE.ShaderMaterial;
        const texture = mat.uniforms.uTex.value as THREE.Texture | undefined;
        texture?.dispose();
        mat.dispose();
      });
      geo.dispose();
      renderer.dispose();
    };
  }, [items]);

  const nudge = (dir: 1 | -1) => {
    const el = wrapRef.current as VitrineElement | null;
    if (el && typeof el.__nudge === "function") el.__nudge(dir);
  };

  if (!supported) {
    return (
      <div className="grid grid-flow-col auto-cols-[70vw] md:auto-cols-[36vw] gap-6 overflow-x-auto snap-x snap-mandatory px-6 py-16">
        {items.map((it) => (
          <Link
            key={it.slug}
            to="/artworks/$slug"
            params={{ slug: it.slug }}
            className="snap-center block"
          >
            <div className="aspect-[4/5] overflow-hidden bg-mist">
              <img src={it.image} alt={it.title} className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 text-sm">
              <em className="italic">{it.title}</em> — {it.artist}
            </div>
          </Link>
        ))}
      </div>
    );
  }

  const active = items[focus];
  const atStart = focus <= 0;
  const atEnd = focus >= items.length - 1;
  return (
    <div ref={wrapRef} className="relative w-full h-[100vh] cursor-pointer" data-cursor="hover">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {active && (
        <div
          ref={captionRef}
          key={focus}
          className="absolute text-center webgl-caption"
          style={{ pointerEvents: "none" }}
        >
          <div className="eyebrow mb-1">{active.artist}</div>
          <div className="font-serif italic text-2xl md:text-3xl text-ink">{active.title}</div>
          {(active.display_price != null || active.price_min != null) && (
            <div className="mt-1 font-serif text-base text-ink tabular-nums">
              {formatPrice({
                price_min: active.price_min ?? null,
                price_max: active.price_max ?? null,
                price_display: active.price_display ?? "fixed",
              })}
            </div>
          )}
          <div
            className="mt-3 flex items-center justify-center gap-3"
            style={{ pointerEvents: "auto" }}
          >
            <CaptionActions item={active} />
          </div>
          <div className="mt-3" style={{ pointerEvents: "auto" }}>
            <Link
              to="/artworks/$slug"
              params={{ slug: active.slug }}
              className="text-[11px] tracking-[0.22em] uppercase text-ink/70 hover:text-[color:var(--accent)] transition"
            >
              Explore artwork →
            </Link>
          </div>
        </div>
      )}
      <div className="absolute top-6 right-6 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase text-ink/60 z-10 pointer-events-none">
        <span className="dot pulse-dot" />
        <span>
          Scroll · Focused work {String(focus + 1).padStart(2, "0")} / {items.length}
        </span>
      </div>
      <div className="absolute left-1/2 bottom-3 md:bottom-5 -translate-x-1/2 z-10 flex items-center gap-4 md:gap-5 pointer-events-none">
        <button
          type="button"
          aria-label="Previous work"
          onClick={() => nudge(-1)}
          disabled={atStart}
          className="pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center border border-ink/15 bg-paper/85 backdrop-blur-md shadow-sm hover:border-[color:var(--accent,#E40700)] hover:text-[color:var(--accent,#E40700)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M7.5 2 3.5 6l4 4" />
          </svg>
        </button>
        <div className="pointer-events-none select-none text-[11px] tracking-[0.28em] uppercase text-ink/60 tabular-nums min-w-[5.5rem] text-center">
          {String(focus + 1).padStart(2, "0")} <span className="text-ink/25">/</span>{" "}
          {String(items.length).padStart(2, "0")}
        </div>
        <button
          type="button"
          aria-label="Next work"
          onClick={() => nudge(1)}
          disabled={atEnd}
          className="pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center border border-ink/15 bg-paper/85 backdrop-blur-md shadow-sm hover:border-[color:var(--accent,#E40700)] hover:text-[color:var(--accent,#E40700)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="m4.5 2 4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function CaptionActions({ item }: { item: GalleryItem }) {
  const id = item.id ?? "";
  const inCart = useIsInCart(id);
  const wishlisted = useIsWishlisted(id);
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  return (
    <>
      {id && (
        <button
          type="button"
          onClick={() => addToCart.mutate(id)}
          disabled={inCart || addToCart.isPending}
          className="inline-flex items-center gap-1.5 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] text-[11px] tracking-[0.18em] uppercase px-3 py-2 hover:brightness-110 disabled:opacity-60 transition"
        >
          <ShoppingBag size={12} />
          {inCart ? "In cart" : "Add to cart"}
        </button>
      )}
      {id && (
        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => toggleWishlist.mutate({ artworkId: id, on: wishlisted })}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-ink text-ink hover:bg-ink hover:text-paper transition"
        >
          <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      )}
    </>
  );
}
