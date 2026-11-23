# BIT · Ti spiego internet

Sito ufficiale di **BIT**, il robot in giacca e cravatta che spiega internet e la tecnologia in 60 secondi.

- TikTok: [@bit.online](https://www.tiktok.com/@bit.online)
- Instagram: [@bit.online01](https://www.instagram.com/bit.online01/)

## Come è fatto
- Sito statico (HTML/CSS/JS) pubblicato con GitHub Pages, nessuna dipendenza esterna a runtime.
- `js/engine.js` è il motore 3D in stile PS1 di BIT (three.js), generato da `tools/build_engine.py`.
- `videos.json` contiene gli episodi mostrati nel carosello: per aggiungerne uno basta una nuova voce e la copertina in `assets/covers/`.

## Licenze di terze parti
- three.js · MIT (`vendor/LICENSE-three.txt`)
- Montserrat, VT323 · SIL Open Font License 1.1 (`assets/fonts/`)

© BIT · Tutti i diritti riservati sui contenuti (personaggio, video, testi, grafica).
