import { registerModule } from './modules';

const clock = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;

registerModule('sound-mixer', root => {
  const play = root.querySelector<HTMLButtonElement>('[data-play]')!;
  const seek = root.querySelector<HTMLInputElement>('[data-seek]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const abort = new AbortController();
  let context: AudioContext | undefined;
  let loaded: Promise<void> | undefined;
  let running = false;
  let disposed = false;
  let loading = false;
  let offset = 0;
  let startTime = 0;
  let duration = 0;
  let frame = 0;
  const tracks = [...root.querySelectorAll<HTMLElement>('[data-track]')].map(el => ({
    el, canvas: el.querySelector('canvas')!, buffer: undefined as AudioBuffer | undefined,
    gain: undefined as GainNode | undefined, analyser: undefined as AnalyserNode | undefined,
    source: undefined as AudioBufferSourceNode | undefined, samples: new Float32Array(2048), displayGain: 16,
  }));
  let soloTrack: (typeof tracks)[number] | undefined;
  const applyLevels = () => {
    if (!context) return;
    for (const track of tracks) {
      const audible = !soloTrack || soloTrack === track;
      track.gain?.gain.setTargetAtTime(audible ? 1 : 0, context.currentTime, .01);
    }
  };
  const position = () => running && context ? Math.min(duration, offset + Math.max(0, context.currentTime - startTime)) : offset;
  const paint = () => {
    const pos = position();
    seek.setAttribute('aria-valuetext', `${clock(pos)} of ${clock(duration)}`);
    seek.value = String(duration ? pos / duration * 100 : 0);
    play.textContent = running ? '❚❚ PAUSE' : '▶ PLAY';
    play.setAttribute('aria-label', running ? 'Pause all tracks' : 'Play all tracks');
  };
  const draw = () => {
    for (const t of tracks) {
      const c = t.canvas.getContext('2d');
      if (!c) continue;
      const w = Math.round(t.canvas.clientWidth * devicePixelRatio), h = Math.round(t.canvas.clientHeight * devicePixelRatio);
      if (t.canvas.width !== w || t.canvas.height !== h) { t.canvas.width = w; t.canvas.height = h; }
      c.clearRect(0, 0, w, h);
      c.strokeStyle = '#00000018'; c.lineWidth = devicePixelRatio;
      c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
      if (!t.analyser || !running) continue;
      t.analyser.getFloatTimeDomainData(t.samples);
      let begin = 0;
      for (let i = 1; i < 1024; i++) if (t.samples[i - 1] <= 0 && t.samples[i] > .002) { begin = i; break; }
      let peak = .001;
      for (let i = begin; i < begin + 256; i++) peak = Math.max(peak, Math.abs(t.samples[i]));
      const target = Math.min(64, .85 / peak);
      t.displayGain += (target - t.displayGain) * (target < t.displayGain ? .8 : .08);
      c.strokeStyle = '#000'; c.lineWidth = 2 * devicePixelRatio; c.lineJoin = 'round'; c.beginPath();
      for (let i = 0; i < 256; i++) {
        const x = i / 255 * w, y = h / 2 - Math.max(-1, Math.min(1, t.samples[begin + i] * t.displayGain)) * h * .42;
        if (!i) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }
  };
  const stop = () => {
    offset = position(); running = false;
    for (const t of tracks) { t.source?.stop(); t.source?.disconnect(); t.source = undefined; }
    cancelAnimationFrame(frame); paint();
  };
  const tick = () => {
    if (!running || disposed) return;
    if (position() >= duration) { stop(); offset = 0; paint(); draw(); return; }
    paint(); draw(); frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!context || disposed) return;
    if (offset >= duration) offset = 0;
    // All three decoded stems start on the same audio-clock tick, including after seeking.
    startTime = context.currentTime + .03;
    for (const t of tracks) {
      t.source = context.createBufferSource(); t.source.buffer = t.buffer!;
      t.source.connect(t.analyser!); t.source.start(startTime, offset);
    }
    running = true; tick();
  };
  const load = () => loaded ??= (async () => {
    context ??= new AudioContext();
    await context.resume();
    await Promise.all(tracks.map(async t => {
      const response = await fetch(t.el.dataset.src!, { signal: abort.signal });
      if (!response.ok) throw new Error('Audio unavailable');
      t.buffer = await context!.decodeAudioData(await response.arrayBuffer());
      t.analyser = context!.createAnalyser(); t.analyser.fftSize = 2048;
      t.gain = context!.createGain(); t.gain.gain.value = 1;
      t.analyser.connect(t.gain); t.gain.connect(context!.destination);
    }));
    duration = Math.min(...tracks.map(t => t.buffer!.duration));
  })();
  const onPlay = async () => {
    if (loading) return;
    if (running) { stop(); return; }
    loading = true; play.disabled = true; status.textContent = 'Loading audio…';
    try { await load(); await context!.resume(); if (!disposed) { status.textContent = ''; start(); } }
    catch { if (!disposed) { status.textContent = 'Audio could not load. Please try again.'; loaded = undefined; } }
    finally { loading = false; play.disabled = false; }
  };
  play.addEventListener('click', onPlay, { signal: abort.signal });
  seek.addEventListener('input', () => {
    const next = Number(seek.value) / 100 * duration, wasRunning = running;
    stop(); offset = next; if (wasRunning) start(); else paint();
  }, { signal: abort.signal });
  for (const track of tracks) {
    track.el.addEventListener('pointerenter', () => { soloTrack = track; applyLevels(); }, { signal: abort.signal });
    track.el.addEventListener('pointerleave', () => { if (soloTrack === track) soloTrack = undefined; applyLevels(); }, { signal: abort.signal });
  }
  const resize = new ResizeObserver(draw); tracks.forEach(t => resize.observe(t.canvas));
  draw(); paint();
  return () => { disposed = true; stop(); abort.abort(); resize.disconnect(); void context?.close(); };
});
