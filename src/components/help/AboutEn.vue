<template>
  <div>
    <p>
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer"><img alt="Creative Commons licence" src="https://i.creativecommons.org/l/by/4.0/80x15.png"></a>
      <span xmlns:dct="https://purl.org/dc/terms/" property="dct:title">Aviation phraseology for virtual pilots</span> is one of the applications by
      <a xmlns:cc="https://creativecommons.org/ns#" href="https://pierrez.net" property="cc:attributionName" target="_blank" rel="cc:attributionURL noopener noreferrer">Emmanuel Pierrez</a>
      published on <a href="https://aeronautique.xyz/en/phraseologie/" target="_blank" rel="noopener noreferrer">aeronautique.xyz</a>,
      licensed under the <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">Creative Commons Attribution 4.0 International licence</a>.
      The phraseology follows the French civil aviation authority (DGAC) phraseology manual for general air traffic.
    </p>
    <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/Manuel_Phras%C3%A9ologie.pdf" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 mt-3 p-3 border rounded-lg hover:bg-gray-100 transition-colors">
      <svg class="w-10 h-10 shrink-0 text-red-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H14a1 1 0 0 1-1-1V3.5zM9.5 13.5c0-.28.22-.5.5-.5h1c.83 0 1.5.67 1.5 1.5S11.83 16 11 16h-.5v1a.5.5 0 0 1-1 0v-3.5zm1 1.5h.5a.5.5 0 0 0 0-1h-.5v1zm3.5-1.5c0-.28.22-.5.5-.5h.5a1.5 1.5 0 0 1 0 3h-.5a.5.5 0 0 1-.5-.5v-2zm1 .5v1h.5a.5.5 0 0 0 0-1H15zM6.5 13a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-1H5.5a.5.5 0 0 1 0-1H6v-.5H5.5a.5.5 0 0 1 0-1h1z"/>
      </svg>
      <div class="flex flex-col">
        <span class="text-sm font-medium">Download the phraseology manual (in French)</span>
        <span class="text-xs text-gray-500">PDF — 2.6 MB — up to date as of 15 April 2023</span>
      </div>
    </a>
    <p>The texts are gathered in two <a href="https://github.com/pierrezNet/site_phraseo/tree/main/src/data" target="_blank" rel="noopener noreferrer">JSON files</a>, which make up the aviation phraseology reference.</p>
    <p class="mt-2">Questions, phraseology remarks, ideas: join the <a href="https://avrobb.org/en/forum/4-phraseologie-aeronautique" target="_blank" rel="noopener noreferrer">phraseology forum</a> (open to read, sign up to post; posts are machine translated between English and French).</p>

    <h3 class="text-lg font-semibold mt-3">Your data</h3>
    <p>Flight parameters, level and settings stay on your device (browser local storage). <strong>Unless you use the voice, only the ICAO weather code is sent.</strong> The following features go through the site's relay (hosted by Cloudflare), only when you use them:</p>
    <ul class="list-disc ml-5 space-y-1 mt-1">
      <li><strong>Weather</strong>: only the aerodrome ICAO code is sent, to fetch the METAR (NOAA).</li>
      <li><strong>Listening to lines</strong> (clicking an icon, the R key, and automatic playback during a full flight when the ATC voice is on in Settings): the text to be spoken (callsign, aerodromes, frequencies…) is sent to the Cloudflare Workers AI speech synthesis service. The audio is cached for 30 days, under a hashed key, so the same line is not synthesised twice.</li>
      <li><strong>Spoken answers (quiz)</strong>: the microphone only opens while you hold Space or the talk button; the recording of your answer is sent to the Cloudflare Workers AI speech recognition service (Whisper), only for the time of the transcription. The site does not keep it.</li>
      <li><strong>Voice quota</strong>: for these two features, a random anonymous identifier created in your browser and your IP address are used to count the day's usage. These counters are erased every night at midnight UTC.</li>
      <li><strong>Feedback</strong>: messages you send through “Send feedback” become a private topic on our forum. Your nickname, if any, is shown with the feedback; your contact details are never published and are e-mailed to the administrators only. Feedback useful to everyone may then be published on the phraseology forum, without your contact details.</li>
    </ul>
    <p class="mt-2">Anonymous, cookie-free audience measurement (Cloudflare Web Analytics) helps us understand how the service is used, without using your IP addresses. The phraseology service is free to use but is intended for flight simulation only.</p>
  </div>
</template>
