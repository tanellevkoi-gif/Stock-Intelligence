# Vaalavaade

Olemasolev kerge eestikeelne vaade IREN, CORZ ja NVO jälgimiseks. `api/market.js` kasutab Yahoo Finance'i tasuta chart-päringut hinna, mahu ja kuni 60 kauplemispäeva ajaloo jaoks. Toetus- ja vastupanutasemed põhinevad eelnenud 20 ja kuni 60 päeva kõrgeimatel/madalaimatel hindadel; need ei ole prognoosid. `api/macro.js` küsib samast allikast Nasdaqi, S&P 500, VIXi ja USA 10 aasta tootluse. Puuduv näitaja jääb puuduvaks. Fed'i värskete otsuste voogu ei kasutata.

Node.js 20+: `npm run dev`; testid: `npm test`. Vercelis deploy repo juurkaustast; build-käsku, pakette ega keskkonnamuutujaid pole vaja. Kaks `api/` faili on Verceli serverless-funktsioonid. Yahoo tasuta avalik liides võib piirata päringuid, viibida või muutuda; see ei taga reaalajas börsiandmeid. Funktsioonid hoiavad õnnestunud vastust serveri mälu kestel lühikest aega ja märgivad ajutise tõrke korral vana vastuse. Serverless-eksemplaride mälu pole püsiv. Viimane andmeaeg tuleb allikast, mitte lehe avamise hetkest.

## GitHubi üleslaadimine

Paki ZIP lahti ja laadi **Stock-Intelligence kausta sisu** repo juurkausta, säilitades `api/` kausta. Asenda olemasolev `api/market.js` ja lisa `api/macro.js`. `macro.js` repo juurkaustas ei loo Vercelis `/api/macro` aadressi. Kui brauser näitab pärast juurutamist vana vastust, laadi leht värskelt; lühike CDN-vahemälu võib olla kuni mõne minuti vanune.
