/* Browser integration through an explicit adapter into game.js, not DOM state
 * scraping. Only the journey owns money/time/inventory and the saved encounter.
 */
(function (root) {
  'use strict';
  root.LWHStoryRuntime = function (api) {
    const B = root.LWHStoryBridge, $ = id => document.getElementById(id);
    const audio = root.LWHStoryAudio();
    const place = root.LWHStoryPlaceView($('roadArt').parentElement);
    const money = cents => '$' + (cents / 100).toFixed(2);
    function isActive() { return Boolean(api.getState().story?.trip.active); }
    const transcript = document.createElement('details'); transcript.id = 'storyTranscript'; transcript.hidden = true;
    const summary = document.createElement('summary'); summary.textContent = 'Read this stop’s conversation and events';
    const lines = document.createElement('div'); lines.className = 'story-transcript-lines';
    transcript.append(summary, lines); $('eventChoices').before(transcript);
    const sound = document.createElement('button'); sound.id = 'storySoundBtn'; sound.type = 'button'; sound.className = 'btn2'; sound.hidden = true;
    sound.onclick = () => { api.toggleSound(); refreshControls(); }; $('eventChoices').before(sound);
    const status = document.createElement('p'); status.id = 'storyStatus'; status.className = 'story-status'; status.hidden = true;
    $('eventBody').before(status);
    // The actual choices precede optional transcript/audio controls.
    $('eventChoices').after(transcript,sound);
    function refreshControls() {
      const s = api.getState(), active = isActive();
      const v = active ? B.describe(s.story) : null;
      $('roadScreen').classList.toggle('story-indoor',v?.presentation==='diner');
      place.render(v);
      sound.hidden = !active; sound.textContent = api.audio().soundOn ? 'MUTE SOUND' : 'ENABLE SOUND';
      $('marketStopBtn').disabled = active;
      $('dinerStopBtn').disabled = Boolean(s.currentEvent) || active || s.ended;
      $('restStopBtn').disabled = Boolean(s.currentEvent) || active || s.ended;
      $('glassRepairBtn').hidden = !s.windshieldDamaged || Boolean(s.currentEvent) || active;
      $('driveLegBtn').hidden = Boolean(s.currentEvent) || active;
      transcript.hidden = !s.storyTranscript?.length;
      if (!active) status.hidden = true;
    }
    function updateAudio() {
      const s = api.getState(), a = s.story?.trip.active;
      const paused = document.hidden || document.body.classList.contains('paused') || api.screen() !== 'roadScreen';
      const nodes = api.audio();
      const view = a ? B.describe(s.story) : null;
      const inDiner = Boolean(a && a.scene === 'diner' && (view.presentation ? view.presentation==='diner' : !['arrival','done'].includes(a.node)));
      audio.update({active: inDiner, enabled: nodes.soundOn, paused, context: nodes.context, output: nodes.output,
        id: a?.id || '', node: a?.node || '', revision:s.story?.revision, lines:view?.lines||[]});
      // Existing score is retained, simply quieter under the diner soundscape.
      if (nodes.music) nodes.music.gain.value = inDiner && !paused ? .08 : api.normalMusicGain;
    }
    function renderTranscript() {
      lines.replaceChildren();
      for (const entry of api.getState().storyTranscript || []) {
        const p = document.createElement('p'), speaker = document.createElement('b');
        speaker.textContent = entry.speaker + ': '; p.append(speaker, document.createTextNode(entry.text)); lines.append(p);
      }
      transcript.hidden = !lines.childElementCount;
    }
    function render() {
      const s = api.getState();
      if (!isActive()) { refreshControls(); renderTranscript(); updateAudio(); return; }
      const v = B.describe(s.story);
      api.setScene(v.art);
      $('eventTag').textContent = ({diner:'DINER',repair:'ROADSIDE REPAIR',callback:'A FAMILIAR FACE',discovery:'UNDER THE SEAT'})[v.scene] || 'ROAD';
      $('eventTitle').textContent = v.title; $('eventBody').replaceChildren();
      for (const entry of v.lines || [{speaker:'SCENE',text:v.body}]) {
        const row=document.createElement('p');row.className='story-line';row.dataset.speaker=entry.speaker;
        const label=document.createElement('b');label.className='story-speaker';label.textContent=entry.speaker;
        row.append(label,document.createTextNode(entry.text));
        if(!['SCENE','SOUND','YOU'].includes(entry.speaker)){
          const replay=document.createElement('button');replay.type='button';replay.className='story-voice-replay';replay.textContent='♪';
          replay.setAttribute('aria-label','Replay nonverbal voice for '+entry.speaker);
          replay.onclick=()=>{if(api.audio().soundOn)audio.say(entry.speaker,entry.text);};row.append(replay);
        }
        $('eventBody').append(row);
      }
      $('eventChoices').replaceChildren();
      const bill = s.story.trip.active.data.billCents || 0;
      status.hidden = false;
      status.textContent = 'Cash ' + money(Math.round(s.cash*100)) + (bill ? ' · Meal reserved ' + money(bill) : '') + ' · Health ' + Math.round(s.health ?? 100) + '/100';
      for (const choice of v.choices) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'choice'; b.dataset.storyChoice = choice.id;
        b.textContent = choice.label; b.disabled = !choice.enabled;
        const extras = [];
        if (choice.minutes) extras.push(choice.minutes + ' game minutes');
        if (choice.costCents) extras.push(money(choice.costCents));
        if (choice.reserveCents) extras.push(money(choice.reserveCents) + ' reserved; pay after eating');
        if (!choice.enabled) extras.push(choice.reason);
        if (extras.length) { const small = document.createElement('small'); small.className = 'story-choice-cost'; small.textContent = extras.join(' · '); b.append(small); }
        const token = {choiceId: choice.id, revision: v.revision, interactionId: v.interactionId};
        b.onclick = () => { try { commit(B.choose(api.getState(), token)); } catch (e) { api.warn(e.message); } };
        $('eventChoices').append(b);
      }
      renderTranscript(); refreshControls(); api.renderHud(); updateAudio();
    }
    function revealNarrative() {
      if (api.screen() !== 'roadScreen') return;
      const event = $('eventTitle').closest('.road-event');
      const column = event?.closest('.road-control-column');
      if (column) column.scrollTop += event.getBoundingClientRect().top - column.getBoundingClientRect().top;
    }
    function persist(next) {
      next.cityData = api.cityData(); next.screen = 'roadScreen';
      const old = localStorage.getItem(api.saveKey);
      B.assertAutosaveSafe(api.getState(), old);
      // Retain an untouched original v4 journey before its first story write.
      if (old && !api.getState().story && !localStorage.getItem(B.BACKUP_KEY)) localStorage.setItem(B.BACKUP_KEY, old);
      if (!old && api.getState().story) throw new Error('The saved journey was removed. Reopen it before choosing.');
      if (old) {
        const stored = JSON.parse(old);
        if (api.getState().story && (!stored.story || stored.story.revision !== api.getState().story.revision || stored.story.trip.id !== api.getState().story.trip.id || stored.cash !== api.getState().cash)) {
          throw new Error('This journey changed in another window. Reopen the saved journey before choosing.');
        }
      }
      localStorage.setItem(api.saveKey, JSON.stringify(next));
    }
    function commit(next) {
      // Do not show or consume a random outcome until its complete transaction
      // has been persisted. Quota errors leave the former screen and state intact.
      persist(next); api.setState(next); api.clearWarning();
      if (api.checkFailure()) { audio.stop(); return; }
      if (isActive()) render();
      else {
        $('eventTag').textContent = next.roadNarrative.tag;
        $('eventTitle').textContent = next.roadNarrative.title;
        $('eventBody').textContent = next.roadNarrative.body;
        $('eventChoices').replaceChildren(); api.renderHud(); renderTranscript(); refreshControls(); updateAudio();
      }
      // A tap near the bottom of a long choice list must not hide the next
      // result above the scroll position. Only presentation moves, never time.
      revealNarrative();
    }
    function begin(kind) {
      try { commit(B.begin(api.getState(), kind,{location:api.location()})); return true; }
      catch (e) { api.warn('Could not start this stop: ' + e.message); return false; }
    }
    function maybeCallback(){ if(!B.callbackDue(api.getState()))return false;begin('callback');return true; }
    function intercept(event, label) {
      if (event === 'food' && label === 'ENTER DINER') { begin('diner'); return true; }
      if(event==='luck'&&label!=='LEAVE IT ALONE'){begin('discovery');return true;}
      if (event === 'tire' && label === 'STOP NOW') { begin('repair'); return true; }
      return false;
    }
    $('dinerStopBtn').onclick = () => { if (!api.getState().currentEvent && !isActive()) begin('diner'); };
    return Object.freeze({isActive, begin, intercept, render, refreshControls, updateAudio, maybeCallback, pause: audio.stop, audioStatus: audio.status});
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
