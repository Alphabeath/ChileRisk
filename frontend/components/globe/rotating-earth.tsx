'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { GeoPermissibleObjects } from 'd3';
import type { FeatureCollection, Feature, GeometryObject, GeoJsonProperties } from 'geojson';

// Componente RotatingEarth
// Renderiza un globo interactivo usando D3 + TopoJSON.
// - Soporta una animación de introducción que centra y acerca Chile.
// - Modo fondo: skipIntro + autoRotate (pose lejana, rotación continua, sin estrella).
// - Permite arrastrar para rotar y usar la rueda para hacer zoom.
// - Responde a redimensionado mediante ResizeObserver.

interface RotatingEarthProps {
  // Clase CSS opcional para el contenedor
  className?: string;
  // Callback que se invoca cuando la animación de introducción alcanza ~85%
  onIntroComplete?: () => void;
  /** Skip Chile zoom intro — stay at far start pose. */
  skipIntro?: boolean;
  /** Start continuous auto-rotation after load. */
  autoRotate?: boolean;
}

export function RotatingEarth({
  className,
  onIntroComplete,
  skipIntro = false,
  autoRotate = false,
}: RotatingEarthProps) {
  // Referencia al contenedor que envuelve el SVG (útil para medir tamaño)
  const containerRef = useRef<HTMLDivElement>(null);
  // Referencia al elemento SVG donde D3 dibuja el globo
  const svgRef = useRef<SVGSVGElement>(null);

  // Flags mutables (refs) para controlar el estado de la animación de introducción
  const introCompleteRef = useRef(false); // true si la intro ya terminó
  const introStartedRef = useRef(false); // true si la intro ya empezó

  // Cache del GeoJSON (conversión desde TopoJSON) para evitar recargas
  const geoDataRef = useRef<FeatureCollection<GeometryObject, GeoJsonProperties> | null>(null);

  // Estado para controlar la aparición (fade-in) cuando los datos se cargan
  const [loaded, setLoaded] = useState(false);
  // Dimensiones del contenedor (actualizadas por ResizeObserver)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Observador de tamaño: actualiza `dimensions` cuando cambia el contenedor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions((prev) => {
            // Redondeamos para evitar re-renderings innecesarios por subpixel
            if (prev && prev.width === Math.round(width) && prev.height === Math.round(height)) return prev;
            return { width: Math.round(width), height: Math.round(height) };
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Efecto principal: crea/actualiza el SVG y el resto de bindings de D3
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !dimensions) return; // Espera hasta tener tamaño y referencia SVG

    const { width, height } = dimensions;
    const sensitivity = 75; // Sensibilidad para el arrastre (drag)

    // Respeta la preferencia de usuarios por reducir movimiento
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Background mode: always far pose, never Chile zoom. Landing: skip after intro or reduced-motion.
    const shouldSkipIntro =
      skipIntro || introCompleteRef.current || introStartedRef.current || prefersReducedMotion;
    // Far pose when skipIntro prop (page bg). Landing reduced-motion still lands on Chile.
    const useFarPose = skipIntro;
    const showChileStar = !skipIntro;
    const shouldAutoRotate = autoRotate && !prefersReducedMotion;

    // Rotación inicial y final (se usa para la animación de introducción)
    const startRotation: [number, number] = [40, -20];
    // Centrar en Chile: longitud aprox. -70, latitud aprox. -33
    // d3.geoOrthographic usa rotate([lambda, phi]) donde valores negativos centran
    // en una coordenada, por eso `endRotation` está expresado como [70, 33]
    const endRotation: [number, number] = [70, 33];

    // Escalas: inicio más alejado, final más cercano (para enfocar Chile)
    const startScale = Math.min(width, height) / 3.5;
    const endScale = Math.min(width, height) / 0.6; // zoom final para ver Chile completo

    const initialScale = useFarPose ? startScale : shouldSkipIntro ? endScale : startScale;
    const initialRotation = useFarPose
      ? startRotation
      : shouldSkipIntro
        ? endRotation
        : startRotation;

    // Proyección ortográfica (globo) configurada con escala/rotación según si saltamos la intro
    const projection = d3.geoOrthographic()
      .scale(initialScale)
      .center([0, 0])
      .rotate(initialRotation)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const svgSel = d3.select(svg);
    svgSel.selectAll('*').remove(); // limpieza antes de dibujar

    svgSel.attr('viewBox', `0 0 ${width} ${height}`);

    // Círculo principal que representa el océano del globo
    const globe = svgSel.append('circle')
      .style('fill', 'var(--ocean)')
      .style('stroke', 'var(--foreground)')
      .attr('stroke-width', '0.5')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale());

    // Graticule (líneas de lat/long) para contexto visual
    svgSel.append('path')
      .datum(d3.geoGraticule10())
      .attr('d', (d) => path(d as GeoPermissibleObjects) ?? '')
      .style('fill', 'none')
      .style('stroke', 'var(--ocean)')
      .style('stroke-width', '0.5')
      .attr('class', 'graticule');

    // Definición de un patrón (halftone) usado como relleno para países que no son Chile
    const defs = svgSel.append('defs');
    const pattern = defs.append('pattern')
      .attr('id', 'halftone')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4);
    pattern.append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 0.7)
      .attr('fill', '#636366');

    // Helper: genera la ruta SVG de una estrella de 5 puntas
    const createStarPath = (cx: number, cy: number, outerR: number, innerR: number, points = 5) => {
      const angle = Math.PI / points;
      let d = '';
      for (let i = 0; i < 2 * points; i++) {
        const r = (i % 2 === 0) ? outerR : innerR;
        const a = -Math.PI / 2 + i * angle;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        d += (i === 0 ? 'M' : 'L') + x + ' ' + y;
      }
      d += 'Z';
      return d;
    };

    // Recalcula los atributos 'd' de todos los paths y actualiza el radio del globo
    // Actualiza las rutas geográficas, el clip de Chile y la estrella según la proyección
    let chileFeatureRef: Feature<GeometryObject, GeoJsonProperties> | null = null;
    const updatePaths = () => {
      // paths de entidades geográficas (países)
      svgSel.selectAll<SVGPathElement, GeoPermissibleObjects>('path.geo').attr('d', (d) => path(d) ?? '');

      // graticule
      svgSel.selectAll<SVGPathElement, GeoPermissibleObjects>('path.graticule').attr('d', (d) => path(d as GeoPermissibleObjects) ?? '');

      globe
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', projection.scale());

      if (chileFeatureRef && showChileStar) {
        const centroid = path.centroid(chileFeatureRef as GeoPermissibleObjects);
        const bounds = path.bounds(chileFeatureRef as GeoPermissibleObjects);
        const bw = Math.max(6, bounds[1][0] - bounds[0][0]);
        const bh = Math.max(6, bounds[1][1] - bounds[0][1]);
        const outerR = Math.min(bw, bh) * 0.28;
        const innerR = outerR * 0.45;
        const starX = centroid[0] + bw * 0.24;
        const starY = bounds[0][1] + bh * 0.18;
        const starPath = createStarPath(starX, starY, outerR, innerR, 5);
        svgSel.selectAll<SVGPathElement, unknown>('path.chile-star').attr('d', starPath);
      }
    };

    // Timers para la rotación automática y la animación de introducción
    let rotationTimer: ReturnType<typeof d3.timer> | null = null;
    let introTimer: ReturnType<typeof d3.timer> | null = null;

    // Inicia rotación automática continua
    const startAutoRotation = () => {
      if (prefersReducedMotion) return;
      rotationTimer?.stop();
      rotationTimer = d3.timer(() => {
        const rotate = projection.rotate();
        projection.rotate([rotate[0] + 0.15, rotate[1]]); // rotación lenta sobre el eje Y
        updatePaths();
      });
    };

    const stopAutoRotation = () => {
      rotationTimer?.stop();
      rotationTimer = null;
    };

    // Animación de introducción: interpola rotación y escala hacia Chile
    const startIntroAnimation = () => {
      introStartedRef.current = true;
      const INTRO_DURATION = 4000;
      const rotInterp = d3.interpolate(startRotation, endRotation);
      const scaleInterp = d3.interpolate(startScale, endScale);

      introTimer = d3.timer((elapsed) => {
        const t = Math.min(elapsed / INTRO_DURATION, 1);
        const eased = d3.easeCubicInOut(t);

        const rot = rotInterp(eased);
        projection.rotate([rot[0], rot[1]]);
        projection.scale(scaleInterp(eased));
        updatePaths();

        // Consideramos la intro "completa" cuando alcanza el 85%.
        if (t >= 0.85 && !introCompleteRef.current) {
          introCompleteRef.current = true;
          onIntroComplete?.();
        }
        if (t >= 1) {
          introTimer?.stop();
          introTimer = null;
          if (showChileStar) {
            svgSel.select('.chile-star')
              .transition()
              .duration(350)
              .style('opacity', 1);
          }
        }
      });
    };

    // Comportamiento de arrastre: pausar animaciones y rotar según movimiento del mouse
    const dragBehavior = d3.drag<SVGSVGElement, unknown>()
      .on('start', () => {
        introTimer?.stop();
        introTimer = null;
        stopAutoRotation();
      })
      .on('drag', (event) => {
        const rotate = projection.rotate();
        const k = sensitivity / projection.scale();
        projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);
        updatePaths();
      })
      .on('end', () => {
        startAutoRotation();
        if (showChileStar) {
          svgSel.select('.chile-star')
            .transition()
            .duration(300)
            .style('opacity', 1);
        }
      });

    svgSel.call(dragBehavior);

    // Zoom con rueda: cambia la escala de la proyección con límites
    svgSel.on('wheel', (event: WheelEvent) => {
      event.preventDefault();
      const currentScale = projection.scale();
      const newScale = currentScale * (1 - event.deltaY * 0.001);
      const minScale = Math.min(width, height) / 6;
      const maxScale = Math.min(width, height);
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      projection.scale(clampedScale);
      updatePaths();
    }, { passive: false });

    // Pause rotation when tab is hidden (page-background perf)
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAutoRotation();
      } else if (shouldAutoRotate) {
        startAutoRotation();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Renderiza las entidades de tierra (países) y aplica estilo especial a Chile
    const renderLand = (land: FeatureCollection<GeometryObject, GeoJsonProperties>) => {
      const group = svgSel.append('g');

      const isChile = (d: { id?: number | string; properties?: GeoJsonProperties }) => {
        // Algunos TopoJSON usan ids numéricos o cadenas (Chile = 152)
        if (d.id === 152 || d.id === '152') return true;
        const props = d.properties || {};
        const name = props.name || props.NAME || props.ADMIN || props.admin || props.NAME_LONG || props.name_long;
        if (name === 'Chile') return true;
        return false;
      };

      group.selectAll('path')
        .data(land.features as GeoPermissibleObjects[])
        .enter().append('path')
        .attr('class', (d) => isChile(d as { id?: number | string; properties?: Record<string, unknown> }) ? 'geo chile' : 'geo')
        .attr('d', (d) => path(d as GeoPermissibleObjects) ?? '')
        .style('fill', (d) => isChile(d as { id?: number | string; properties?: Record<string, unknown> }) ? 'var(--primary-chile)' : 'url(#halftone)')
        .style('stroke', (d) => isChile(d as { id?: number | string; properties?: Record<string, unknown> }) ? 'var(--primary-chile)' : 'var(--foreground)')
        .style('stroke-width', '0.5');

      const chileFeature = land.features.find((f) => isChile(f));
      if (chileFeature && showChileStar) {
        chileFeatureRef = chileFeature;

        const centroid = path.centroid(chileFeature as GeoPermissibleObjects);
        const bounds = path.bounds(chileFeature as GeoPermissibleObjects);
        const bw = Math.max(6, bounds[1][0] - bounds[0][0]);
        const bh = Math.max(6, bounds[1][1] - bounds[0][1]);
        const outerR = Math.min(bw, bh) * 0.22;
        const innerR = outerR * 0.45;
        const starX = centroid[0] + bw * 1.2;
        const starY = bounds[0][1] + bh * 0.18;
        const starPath = createStarPath(starX, starY, outerR, innerR, 5);

        svgSel.append('path')
          .attr('class', 'chile-star')
          .attr('d', starPath)
          .attr('fill', '#fff')
          .style('opacity', 0)
          .style('pointer-events', 'none');
      } else if (chileFeature) {
        chileFeatureRef = chileFeature;
      }
    };

    // Lógica que se ejecuta una vez que los datos de países están listos
    const startAfterLoad = () => {
      setLoaded(true);

      if (shouldSkipIntro) {
        if (!introCompleteRef.current) {
          introCompleteRef.current = true;
          onIntroComplete?.();
        }
        if (showChileStar) {
          svgSel.select('.chile-star').style('opacity', 1);
        }
        if (shouldAutoRotate) {
          startAutoRotation();
        }
      } else {
        startIntroAnimation();
      }
    };

    // Si ya tenemos el GeoJSON en cache, renderizamos inmediatamente, si no lo cargamos
    if (geoDataRef.current) {
      renderLand(geoDataRef.current);
      startAfterLoad();
    } else {
      const loadTopology = async () => {
        // Primero intenta CDN, si falla usa ruta local como fallback
        const remote = await d3.json<Topology>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').catch(() => null);
        if (remote) return remote;
        return d3.json<Topology>('/geo/countries-110m.json').catch(() => null);
      };
      loadTopology().then((data) => {
        if (!data) {
          // Fallback: si el globo no carga (CDN bloqueado, ruta local rota, etc.),
          // desbloqueamos el contenido de la landing en lugar de dejar la página en blanco.
          if (!introCompleteRef.current) {
            introCompleteRef.current = true;
            onIntroComplete?.();
          }
          return;
        }
        const land = topojson.feature(data, data.objects.countries) as FeatureCollection<GeometryObject, GeoJsonProperties>;
        geoDataRef.current = land;
        renderLand(land);
        startAfterLoad();
      });
    }

    // Cleanup: detener timers y timeouts al desmontar o re-ejecutar el efecto
    return () => {
      introTimer?.stop();
      rotationTimer?.stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [dimensions, onIntroComplete, skipIntro, autoRotate]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      {/* SVG que contiene el globo; su opacidad depende de `loaded` */}
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      />
    </div>
  );
}
