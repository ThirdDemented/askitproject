/* Original synthesized ambience and nonverbal character voices, not sampled
 * dialogue or speech recognition. Text always carries all meaning.
 */
(function (root) {
  'use strict';
  root.LWHStoryAudio = function () {
    let timer = null, key = '', ctx = null, bus = null, tick = 0;
    let queued=[]; let voiceSerial=0;
    function clearVoices(){queued.forEach(clearTimeout);queued=[];voiceSerial++;}
    const sources = new Set();
    function stop() {
      clearVoices(); clearInterval(timer); timer = null; key = '';
      for (const node of sources) { try { node.stop(); } catch (_) {} try { node.disconnect(); } catch (_) {} }
      sources.clear();
      if (bus) { try { bus.disconnect(); } catch (_) {} } bus = null;
    }
    function tone(freq, duration, volume, delay = 0, voice = false) {
      if (!ctx || !bus || ctx.state !== 'running') return;
      const oscillator = ctx.createOscillator(), gain = ctx.createGain();
      const filter = ctx.createBiquadFilter(), at = ctx.currentTime + delay;
      oscillator.type = voice ? 'sawtooth' : 'sine'; oscillator.frequency.setValueAtTime(freq, at);
      if (voice) oscillator.frequency.linearRampToValueAtTime(freq * .84, at + duration);
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(voice ? 350 : 2400, at);
      if (voice) { filter.Q.value = 3; filter.frequency.linearRampToValueAtTime(1100, at + duration * .4); filter.frequency.linearRampToValueAtTime(350, at + duration); }
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      oscillator.connect(filter); filter.connect(gain); gain.connect(bus); sources.add(oscillator);
      oscillator.onended = () => { sources.delete(oscillator); oscillator.disconnect(); filter.disconnect(); gain.disconnect(); };
      oscillator.start(at); oscillator.stop(at + duration + .03);
    }
    function voice(high = false) {
      for (let i = 0; i < 5; i++) tone((high ? 170 : 110) + (i % 3) * 14, .17 + (i % 2) * .04, .018, i * .24, true);
    }
    function say(speaker, text) {
      if(!ctx||!bus||ctx.state!=='running')return;
      let hash=0;for(const ch of speaker)hash=(hash*31+ch.charCodeAt(0))>>>0;
      const base=105+(hash%105),count=Math.min(10,Math.max(3,Math.ceil(text.length/18)));
      for(let i=0;i<count;i++)tone(base+(i%3)*12,.15+(i%2)*.03,.018,i*.21,true);
    }
    function speakLines(lines){
      clearVoices();let delay=0;
      for(const line of lines.filter(l=>!['SCENE','SOUND','YOU'].includes(l.speaker)).slice(0,4)){
        queued.push(setTimeout(()=>say(line.speaker,line.text),delay));delay+=Math.min(10,Math.max(3,Math.ceil(line.text.length/18)))*210+300;
      }
    }
    function startNoise() {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const samples = buffer.getChannelData(0); let n = 7523;
      for (let i = 0; i < samples.length; i++) { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; samples[i] = (n / 4294967296 * 2 - 1) * .012; }
      const noise = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
      noise.buffer = buffer; noise.loop = true; filter.type = 'lowpass'; filter.frequency.value = 1700;
      noise.connect(filter); filter.connect(bus); sources.add(noise);
      noise.onended = () => { sources.delete(noise); noise.disconnect(); filter.disconnect(); };
      noise.start();
    }
    function update(options) {
      const active = options.active && options.enabled && !options.paused && options.context?.state === 'running';
      if (!active) { stop(); return; }
      const nextKey = options.id + ':' + options.node+':'+(options.revision||0);
      if (key === nextKey && timer) return;
      const sameVisit = key.startsWith(options.id + ':');
      stop(); ctx = options.context; bus = ctx.createGain(); bus.gain.value = .65; bus.connect(options.output); key = nextKey;
      startNoise(); tick = 0;
      if(options.lines?.length)speakLines(options.lines);
      else if (['menu', 'waiting', 'conversation', 'stranger'].includes(options.node)) voice(options.node !== 'conversation');
      if (options.node === 'ready') { tone(1100, .55, .035); tone(1650, .25, .018, .08); }
      if (!sameVisit) tone(750, .12, .02);
      timer = setInterval(() => {
        if (ctx.state !== 'running') { stop(); return; }
        tick++; tone(tick % 2 ? 1600 : 2200, .08, .01);
        // Ambient chatter is deliberately softer than speaker-specific cues.
        if(tick%4===0&&options.node==='waiting')tone(135,.4,.006,0,true);
      }, 4300);
    }
    return Object.freeze({update, stop, say, status: () => ({playing: Boolean(timer), sources: sources.size, key})});
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
