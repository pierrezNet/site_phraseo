<template>
  <div class="space-y-3 text-sm">
    <p>This project is a training tool for aviation radiotelephony phraseology, designed for VFR and IFR virtual pilots, in French and in English, based on the French civil aviation authority (DGAC) phraseology manual.</p>

    <h3 id="aide-utilisation" class="font-semibold text-base mt-4">Getting started</h3>
    <p>The <strong>IFR / VFR</strong> switch in the bar changes the flight rules. The <strong>Settings</strong> menu holds the level, the quiz, the ATC voice and the two languages:</p>
    <ul class="list-disc ml-5 space-y-1">
      <li><strong>Phraseology language</strong>: the language of the pilot and ATC lines, the one you are learning;</li>
      <li><strong>Interface language</strong>: the language of menus and explanations. You can, for instance, keep the interface in English and practise the exchanges in French.</li>
    </ul>
    <p>Fill in your flight (<strong>Flight parameters</strong>), pick a flight phase, then the matching task: the phraseology is shown with your own flight data.</p>

    <h3 id="aide-niveaux" class="font-semibold text-base mt-4">Levels</h3>
    <p>Choose your level in <strong>Settings</strong>:</p>
    <ul class="list-disc ml-5 space-y-1">
      <li><strong>Beginner</strong>: essential phraseology for a standard flight (start-up, taxi, take-off, circuit, landing). Complex situations are hidden.</li>
      <li><strong>Intermediate</strong>: all common situations (CTOT, traffic, go-around, special approaches, transit, immediate take-off…).</li>
      <li><strong>Advanced</strong>: phraseology beyond common situations (chapter 5 of the DGAC manual: coordination, rare situations…).</li>
    </ul>
    <p>The tasks and options on offer adapt to the chosen level.</p>

    <h3 id="aide-icones" class="font-semibold text-base mt-4">Icons</h3>
    <ul class="list-disc ml-5 space-y-1">
      <li>Aircraft: the <strong>pilot</strong> starts the exchange (on a line: listen to the pilot)</li>
      <li>Microphone: <strong>ATC</strong> starts the exchange (on a line: listen to ATC)</li>
      <li>Chevron <strong>&gt;</strong>: opens a choice of sub-options</li>
    </ul>

    <h3 id="aide-quiz" class="font-semibold text-base mt-4">Quiz mode</h3>
    <ul class="list-disc ml-5 space-y-1">
      <li>With <strong>Quiz</strong> on in Settings, the pilot's lines are hidden: say or type them yourself.</li>
      <li>An answer <strong>passes</strong> when every critical item is right (callsign, runway, QNH, frequency, level, squawk…) <strong>and</strong> the score reaches 75%. Greetings do not count.</li>
      <li>“Roger” alone instead of a readback is always wrong; other phraseology mistakes are pointed out in the debriefing (💬) without failing the answer.</li>
      <li>After a failed answer, <strong>Try again</strong>; once marked, the expected answer is shown.</li>
    </ul>

    <h3 id="aide-vol" class="font-semibold text-base mt-4">Full flight</h3>
    <ul class="list-disc ml-5 space-y-1">
      <li>In quiz mode, the <strong>Full flight</strong> button chains every step of a flight, from start-up to the stand, at the chosen level. Pick the flight (the first one is preselected), then <strong>Start the flight</strong>.</li>
      <li>A <strong>brief</strong> gives the pilot's decision at each step; <strong>unexpected events</strong> (⚡) may occur.</li>
      <li><strong>Two attempts</strong> per line; if your intention is missing, ATC asks for it.</li>
      <li>The flight strip recalls your parameters: one click inserts the value into your answer.</li>
      <li>At the end, a <strong>debrief</strong> by phase and a review of your mistakes.</li>
    </ul>

    <h3 id="aide-voix" class="font-semibold text-base mt-4">Listening and speaking</h3>
    <ul class="list-disc ml-5 space-y-1">
      <li>Click the <strong>microphone</strong> icon of a line to hear ATC, the <strong>aircraft</strong> icon to hear the pilot. Click again to stop.</li>
      <li><strong>R</strong> key: replays (or stops) the last ATC line.</li>
      <li>In quiz mode, <strong>hold Space</strong> (or the “🎙 Hold to talk” button, or the aircraft icon) while you speak and release to send: your answer appears (“Heard: …”) and is marked at once. 15 seconds at most; the browser asks for microphone access the first time.</li>
      <li>In the answer box, Space talks while the box is empty; once you type, Space (and R) type normally.</li>
      <li>On mobile, quiz answers are spoken: hold “🎙 Hold to talk”, wait for “● TRANSMITTING”, speak, release. If the microphone is refused or the quota is used up, typing comes back.</li>
      <li>Once marked, the aircraft icon plays the expected answer.</li>
      <li><strong>ATC voice</strong> in Settings: during a full flight, ATC speaks automatically. Today's remaining voice quota is shown there.</li>
      <li>Synthetic voices with a radio effect; voice and speech recognition have a daily quota, the texts always remain available.</li>
    </ul>

    <h3 id="aide-carte" class="font-semibold text-base mt-4">Interactive map</h3>
    <p>In VFR at beginner level on a computer, a map of the circuit replaces the buttons. Click a numbered point to show the matching phraseology; the flight phase follows automatically.</p>

    <h3 id="aide-meteo" class="font-semibold text-base mt-4">Weather</h3>
    <p>Enter the ICAO code in the flight parameters (e.g. LFPO). The QNH and weather information come from the live METAR.</p>

    <h3 id="aide-sauvegarde" class="font-semibold text-base mt-4">Saving</h3>
    <p>Flight parameters, level, languages and the voice setting are stored on your device: you get them back from one session to the next. What is sent to the relay (voice, weather, quota) is detailed in <strong>About</strong>.</p>
  </div>
</template>
