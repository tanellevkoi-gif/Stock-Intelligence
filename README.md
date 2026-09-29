# Vaalavaade

Olemasoleva Vaalavaate universaalne aktsiavaade. Otsi ettevõtte nime või Yahoo aktsiasümboli järgi; IREN, CORZ ja NVO jäävad kiirvalikuks. Kõik nähtavad tekstid on eestikeelsed. Leht kasutab väikesi SVG-graafikuid ilma frontend-raamistikuta.

## Andmed

- `api/search.js`: Yahoo Finance `v1/finance/search`, ainult aktsiatüüpi vasted; nimi, sümbol ja börs. Otsingu tõrke korral saab sisestatud sümbolit kontrollida otse hinnapäringuga.
- `api/market.js`: Yahoo Finance `v8/finance/chart/{symbol}?range=1y&interval=1d`. Viimane hind, eelmine sulgemine, päevamaht ja kuni 260 tegelikku päevast OHLCV-rida. Kuus graafikuperioodi filtreeritakse neist sama andmestiku põhjal, nii et hinna- ja mahugraafik püsivad sünkroonis.
- `api/macro.js`: Yahoo chart-päringud sümbolitele `^IXIC`, `^GSPC`, `^VIX`, `^TNX`. Puuduvad vastused jäävad puuduvaks.
- Lühike, keskmine ja pikk muutus arvutatakse vastavalt 5, 20 ja 120 eelneva kauplemispäeva suhtes. Tugi/vastupanu põhineb eelneva 20 kuni 60 päeva kõrgeimatel/madalaimatel hindadel. Mahujoon on iga päeva eelneva 20 kauplemispäeva keskmine. Need on arvutused, mitte börsi eraldi andmevoog.
- Vaalasignaalid on hinna ja mahu kaudsed näitajad. Kolm stsenaariumi on tingimuslikud, mitte prognoos ega institutsioonide tegevuse tõend.

Node.js 20+: `npm run dev` ja `npm test`. Vercelile laadi ZIP-i sisu repo juurkausta, säilitades `api/` kausta. Build-käsku, andmebaasi, tasulist API-t ega keskkonnamuutujaid pole vaja. Yahoo avalik tasuta liides võib viibida, piirata päringuid või muutuda; serverless-mälu vahemälu pole püsiv. Börsiandmed ei ole garanteeritult reaalajas. Fed'i sündmuste usaldusväärset voogu selles versioonis ei kasutata.
