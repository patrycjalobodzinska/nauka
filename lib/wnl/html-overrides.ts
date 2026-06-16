/**
 * Tresc-jako-obrazek (tabele i schematy WNL) odtworzona recznie jako HTML —
 * renderowana zamiast ryciny (zaznaczalna, responsywna, w motywie, bez hot-linku).
 * Klucz = URL PL ryciny (files.pl ze slideshow JSON; sprawdzane PRZED localize).
 * Sam const + funkcja, bez I/O — bezpieczne i na serwerze, i u klienta.
 */
const T: Record<string, string> = {
  // #7 Zatoki przynosowe (lekcja: Jama nosowa)
  "https://storage.googleapis.com/media-manager/lek/0195eaeb-818a-7363-aa41-ab83bad8dee2/0195eaeb-818a-7363-aa41-ab83bb84f914.png": `
<figure class="wnl-embed">
<table class="wnl-tbl">
<caption>Zatoki przynosowe</caption>
<thead>
<tr><th rowspan="2">Zatoka przynosowa</th><th colspan="2">Miejsce ujścia zatoki</th></tr>
<tr><th>Lokalizacja</th><th>Szczegółowa lokalizacja</th></tr>
</thead>
<tbody>
<tr><th scope="row">Zatoka <b>szczękowa</b></th><td rowspan="3">Przewód nosowy środkowy</td><td>Lejek sitowy</td></tr>
<tr><th scope="row">Zatoka <b>czołowa</b></th><td>Lejek sitowy lub przedsionek przewodu nosowego środkowego</td></tr>
<tr><th scope="row">Komórki <b>sitowe przednie</b></th><td>Lejek sitowy, przedsionek przewodu nosowego środkowego lub nad albo na puszce sitowej</td></tr>
<tr><th scope="row">Komórki <b>sitowe tylne</b></th><td>Przewód nosowy górny i najwyższy</td><td>Ujścia komórek sitowych tylnych</td></tr>
<tr><th scope="row">Zatoka <b>klinowa</b></th><td>Zachyłek klinowo-sitowy</td><td>Otwór zatoki klinowej</td></tr>
</tbody>
</table>
</figure>`,

  // #5 Układ piramidowy — uszkodzenie ośrodkowe a obwodowe (lekcja: Układ ruchowy)
  "https://storage.googleapis.com/media-manager/anatomia/0195eaee-7d2e-728d-9990-99bb82400f1d/019d3ea3-02b6-70bc-94dc-6fd6c5ac0219.png": `
<figure class="wnl-embed">
<table class="wnl-tbl">
<caption>Układ piramidowy — uszkodzenie ośrodkowe a obwodowe</caption>
<thead><tr><th>Uszkodzenie ośrodkowe</th><th>Uszkodzenie obwodowe</th></tr></thead>
<tbody>
<tr><td>Objawy po stronie uszkodzenia lub po stronie przeciwnej w zależności od wysokości uszkodzenia</td><td>Objawy zawsze po stronie uszkodzenia</td></tr>
<tr><td>Początkowo niedowład wiotki, następnie spastyczny</td><td>Niedowład wiotki</td></tr>
<tr><td>Wzmożone odruchy ścięgniste, napięcie mięśniowe i klonusy</td><td>Osłabione odruchy ścięgniste lub ich brak, osłabione napięcie mięśniowe, brak klonusów</td></tr>
<tr><td>Obecne patologiczne odruchy piramidowe (Babińskiego, Rossolimo, Oppenheima)</td><td>Brak patologicznych odruchów</td></tr>
<tr><td>Brak zaników mięśniowych</td><td>Obecne zaniki mięśniowe</td></tr>
<tr><td>Brak fascykulacji</td><td>Obecne fascykulacje</td></tr>
</tbody>
</table>
</figure>`,

  // #13 Zawartość śródpiersia według nowego podziału (lekcja: Śródpiersie)
  "https://storage.googleapis.com/media-manager/anatomy-us/0195eaee-2a0f-7096-a6e5-ea9ca04f8718/019e1b57-1048-725a-b3fb-d0b16a2a1436.png": `
<figure class="wnl-embed">
<table class="wnl-tbl">
<caption>Zawartość śródpiersia według nowego podziału</caption>
<thead><tr><th>Część śródpiersia</th><th>Zawartość</th></tr></thead>
<tbody>
<tr><th scope="row">Śródpiersie górne</th><td>Grasica<br>Żyły ramienno-głowowe<br>Górna część żyły głównej górnej<br>Łuk aorty wraz z gałęziami<br>Nerwy błędne wraz z gałęziami<br>Tchawica<br>Przełyk<br>Przewód piersiowy<br>Pnie współczulne<br>Nerwy przeponowe<br>Węzły chłonne przytchawicze<br>Węzły chłonne tchawiczo-oskrzelowe górne</td></tr>
<tr><th colspan="2" class="sub">Śródpiersie dolne</th></tr>
<tr><th scope="row">Śródpiersie przednie</th><td>Wpuklenia mostkowo-osierdziowe<br>Gałęzie śródpiersiowe tętnic piersiowych wewnętrznych<br>Węzły chłonne śródpiersiowe przednie</td></tr>
<tr><th scope="row">Śródpiersie środkowe</th><td>Serce wraz z osierdziem<br>Aorta wstępująca<br>Pień płucny i tętnice płucne<br>Dolna część żyły głównej górnej, żyła główna dolna<br>Nerwy przeponowe<br>Naczynia osierdziowo-przeponowe<br>Rozdwojenie tchawicy i oskrzela główne<br>Łuk żyły nieparzystej<br>Część głęboka splotu sercowego<br>Węzły chłonne tchawiczo-oskrzelowe</td></tr>
<tr><th scope="row">Śródpiersie tylne</th><td>Aorta piersiowa<br>Żyły nieparzyste<br>Przełyk<br>Przewód piersiowy<br>Nerwy błędne, splot przełykowy i pnie błędne<br>Węzły chłonne śródpiersiowe tylne<br>Pnie współczulne</td></tr>
</tbody>
</table>
</figure>`,

  // #11 Połączenia kręgosłupa — podział i klasyfikacja (lekcja: Połączenia kręgów i budowa kręgosłupa)
  "https://storage.googleapis.com/media-manager/anatomia/0195eaea-f1df-72ab-bedb-52f80d20135e/019c1dbe-defe-7222-bf8c-813bf0bd6eb9.png": `
<figure class="wnl-embed">
<table class="wnl-tbl">
<caption>Połączenia kręgosłupa — podział i klasyfikacja</caption>
<thead><tr><th>Grupa połączeń</th><th>Rodzaj</th><th>Połączenie / połączenia</th></tr></thead>
<tbody>
<tr><th colspan="3" class="sub">Połączenia kręgosłupa z czaszką</th></tr>
<tr><th scope="row">Połączenia wolne</th><td>—</td><td>Stawy szczytowo-potyliczne</td></tr>
<tr><th scope="row">Połączenia ścisłe</th><td>Więzozrosty włókniste</td><td>Błona szczytowo-potyliczna przednia i tylna</td></tr>
<tr><th colspan="3" class="sub">Połączenia kręgów prawdziwych oraz połączenie kręgu L5 z kością krzyżową</th></tr>
<tr><th scope="row">Połączenia wolne</th><td>—</td><td>Staw szczytowo-obrotowy<br>Stawy międzykręgowe</td></tr>
<tr><th scope="row" rowspan="3">Połączenia ścisłe</th><td>Więzozrosty włókniste</td><td>Więzadło podłużne przednie<br>Więzadło podłużne tylne<br>Więzadła międzykolcowe<br>Więzadła międzypoprzeczne<br>Więzadło karkowe<br>Więzadło nadkolcowe</td></tr>
<tr><td>Więzozrosty sprężyste</td><td>Więzadła żółte</td></tr>
<tr><td>Chrząstkozrosty włókniste</td><td>Krążki międzykręgowe</td></tr>
<tr><th colspan="3" class="sub">Połączenia kręgów krzyżowych</th></tr>
<tr><th scope="row">Połączenia ścisłe</th><td>Kościozrosty</td><td>Kościozrosty pomiędzy kręgami krzyżowymi</td></tr>
<tr><th colspan="3" class="sub">Połączenia kręgów guzicznych</th></tr>
<tr><th scope="row" rowspan="2">Połączenia ścisłe</th><td>Chrząstkozrosty włókniste</td><td>Połączenia pierwszego i drugiego oraz drugiego i trzeciego kręgu guzicznego</td></tr>
<tr><td>Kościozrosty</td><td>Połączenia trzeciego i czwartego oraz czwartego i piątego kręgu guzicznego</td></tr>
<tr><th colspan="3" class="sub">Połączenia kości krzyżowej i kości guzicznej</th></tr>
<tr><th scope="row" rowspan="2">Połączenia ścisłe</th><td>Chrząstkozrosty włókniste</td><td>Krążek międzykręgowy</td></tr>
<tr><td>Więzozrosty włókniste</td><td>Więzadła krzyżowo-guziczne brzuszne<br>Więzadła krzyżowo-guziczne grzbietowe powierzchowne<br>Więzadła krzyżowo-guziczne grzbietowe głębokie<br>Więzadła krzyżowo-guziczne boczne</td></tr>
</tbody>
</table>
</figure>`,

  // #10 Kręgi — podsumowanie i porównanie (lekcja: Budowa kręgów)
  "https://storage.googleapis.com/media-manager/anatomy-us/0195eae8-b432-71b8-a8d9-78956a3024ef/019e1801-fc95-7326-83b2-00c5e5e1f1fe.png": `
<figure class="wnl-embed">
<table class="wnl-tbl">
<caption>Kręgi — podsumowanie i porównanie</caption>
<thead><tr><th>Struktura</th><th>Kręgi szyjne (C3–C6)</th><th>Kręgi piersiowe</th><th>Kręgi lędźwiowe</th></tr></thead>
<tbody>
<tr><th scope="row">Trzon</th><td>Niski, prostokątny o zaokrąglonych kątach<br>Posiada haki trzonu</td><td>Bardziej masywny, kształtu sercowatego<br>Posiada dołki żebrowe górne i dolne dla stawów głów żeber</td><td>Masywny, nerkowatego kształtu</td></tr>
<tr><th scope="row">Otwór kręgowy</th><td>Duży, trójkątny</td><td>Mały, okrągły</td><td>Nieco większy, trójkątny</td></tr>
<tr><th scope="row">Wyrostki kolczyste</th><td>Drobne, skierowane do tyłu, rozdwojone na końcu</td><td>Długie, skierowane do tyłu i do dołu, dachówkowato na siebie zachodzące</td><td>Masywne, kierowane ku tyłowi, spłaszczone w kierunku strzałkowym</td></tr>
<tr><th scope="row">Wyrostki poprzeczne</th><td>Zawierają otwory wyrostka poprzecznego, guzki przednie i tylne oraz bruzdę nerwu rdzeniowego</td><td>Skierowane bocznie i do tyłu. Zawierają dołki żebrowe wyrostka poprzecznego dla stawów żebrowo-poprzecznych</td><td>Nieobecne. Zamiast nich wyrostki żebrowe. Odpowiednikiem wyrostków poprzecznych są wyrostki dodatkowe</td></tr>
<tr><th scope="row">Wyrostki stawowe</th><td>Ustawione pod kątem 45°. Górne skierowane nieco do tyłu, dolne nieco do przodu</td><td>Ustawione w płaszczyźnie czołowej. Górne zwrócone powierzchnią stawową do tyłu, dolne do przodu</td><td>Ustawione w płaszczyźnie strzałkowej. Górne zwrócone powierzchnią stawową przyśrodkowo i nieco do tyłu, dolne bocznie i do przodu. Górne zawierają wyrostek suteczkowaty</td></tr>
</tbody>
</table>
</figure>`,

  // ── Schematy (plany/drzewka pojęć) → zagnieżdżone divy ──────────────────────
  // #1 Klasyfikacja kości — plan prezentacji
  "https://storage.googleapis.com/media-manager/lek/0195eae8-65a9-72da-805e-0b49b6fa3004/0195eae8-65a9-72da-805e-0b49b711486b.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Klasyfikacja kości i ich połączeń</div>
<ul class="wnl-outline">
<li><span class="box">Kości</span></li>
<li><span class="box">Klasyfikacja kości</span></li>
<li><span class="box">Połączenia kości</span></li>
</ul></figure>`,

  // #2 Klasyfikacja kości — Kości
  "https://storage.googleapis.com/media-manager/lek/0195eae8-66b5-7329-8440-1af8d6a19912/0195eae8-66b5-7329-8440-1af8d77ce0cd.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Klasyfikacja kości i ich połączeń</div>
<ul class="wnl-outline">
<li><span class="box lead">Kości</span><ul><li><span class="box">Informacje podstawowe</span></li></ul></li>
<li><span class="box">Klasyfikacja kości</span></li>
<li><span class="box">Połączenia kości</span></li>
</ul></figure>`,

  // #3 Klasyfikacja kości — Klasyfikacja kości
  "https://storage.googleapis.com/media-manager/lek/0195eae8-67fe-72bd-b6c9-debdd0f60594/0195eae8-67fe-72bd-b6c9-debdd16dce58.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Klasyfikacja kości i ich połączeń</div>
<ul class="wnl-outline">
<li><span class="box">Kości</span></li>
<li><span class="box lead">Klasyfikacja kości</span><ul>
<li><span class="box">Informacje wstępne</span></li>
<li><span class="box">Kości długie</span></li>
<li><span class="box">Kości krótkie</span></li>
<li><span class="box">Kości płaskie</span></li>
<li><span class="box">Kości różnokształtne</span></li>
<li><span class="box">Kości pneumatyczne</span></li>
<li><span class="box">Kości sezamowate</span></li>
</ul></li>
<li><span class="box">Połączenia kości</span></li>
</ul></figure>`,

  // #4 Klasyfikacja kości — Połączenia kości
  "https://storage.googleapis.com/media-manager/lek/0195eae8-6956-70f2-a945-90bbaa4f321d/0195eae8-6956-70f2-a945-90bbaaa91625.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Klasyfikacja kości i ich połączeń</div>
<ul class="wnl-outline">
<li><span class="box">Kości</span></li>
<li><span class="box">Klasyfikacja kości</span></li>
<li><span class="box lead">Połączenia kości</span><ul>
<li><span class="box">Informacje wstępne</span></li>
<li><span class="box">Połączenia ścisłe</span></li>
<li><span class="box">Stawy</span></li>
</ul></li>
</ul></figure>`,

  // #6 Naczynia tętnicze głowy i szyi (Część II)
  "https://storage.googleapis.com/media-manager/lek/0195eaee-17b3-72d1-ba4b-31e65165bf31/0195eaee-17b3-72d1-ba4b-31e6519321a7.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Naczynia tętnicze głowy i szyi (Część II)</div>
<ul class="wnl-outline">
<li><span class="box">Wstęp</span></li>
<li><span class="box">Tętnica szyjna zewnętrzna</span></li>
<li><span class="box">Gałęzie tętnicy szyjnej zewnętrznej</span></li>
<li><span class="box">Unaczynienie tętnicy szyjnej zewnętrznej</span></li>
<li><span class="box">Gałęzie tętnicy podobojczykowej</span></li>
<li><span class="box lead">Zestawienie unaczynienia istotnych okolic i zespolenia</span><ul>
<li><span class="box">Podniebienie</span></li>
<li><span class="box">Zęby i dziąsła</span></li>
<li><span class="box">Język</span></li>
<li><span class="box">Gruczoły ślinowe</span></li>
<li><span class="box">Nos zewnętrzny</span></li>
<li><span class="box">Jama nosowa</span></li>
<li><span class="box">Zatoki przynosowe</span></li>
<li><span class="box">Ucho zewnętrzne, środkowe i wewnętrzne</span></li>
<li><span class="box">Gardło, krtań i tchawica</span></li>
<li><span class="box">Skóra głowy</span></li>
<li><span class="box">Opona twarda</span></li>
<li><span class="box">Zespolenia tętnic głowy i szyi</span></li>
<li><span class="box">Zespolenie tętnicy szyjnej wewnętrznej</span></li>
<li><span class="box">Zespolenie tętnicy szyjnej zewnętrznej</span></li>
</ul></li>
</ul></figure>`,

  // #8 Nerwy miednicy
  "https://storage.googleapis.com/media-manager/lek/0195eaeb-bc91-7291-a0d4-d02550975a57/0195eaeb-bc91-7291-a0d4-d02550f0cc58.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Nerwy miednicy</div>
<ul class="wnl-outline">
<li><span class="box">Wstęp</span></li>
<li><span class="box">Autonomiczny układ nerwowy</span></li>
<li><span class="box">Nerwy somatyczne</span></li>
<li><span class="box lead">Zestawienie unerwienia istotnych okolic</span><ul><li><span class="box">Podsumowanie</span></li></ul></li>
</ul></figure>`,

  // #9 Budowa kręgów
  "https://storage.googleapis.com/media-manager/lek/0195eae8-b337-7045-908d-d37a50ad53f8/0195eae8-b337-7045-908d-d37a516c62d3.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Budowa kręgów</div>
<ul class="wnl-outline">
<li><span class="box">Wstęp</span></li>
<li><span class="box">Ogólna budowa kręgu</span></li>
<li><span class="box">Kręgi szyjne</span></li>
<li><span class="box">Kręgi piersiowe</span></li>
<li><span class="box">Kręgi lędźwiowe</span></li>
<li><span class="box lead">Porównanie budowy kręgów</span></li>
<li><span class="box">Kość krzyżowa</span></li>
<li><span class="box">Kość guziczna</span></li>
</ul></figure>`,

  // #12 Naczynia tętnicze, żylne i chłonne klatki piersiowej
  "https://storage.googleapis.com/media-manager/lek/0195eaed-d9b1-71e6-b17c-53cbc0329468/0195eaed-d9b1-71e6-b17c-53cbc0ee5564.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Naczynia tętnicze, żylne i chłonne klatki piersiowej</div>
<ul class="wnl-outline">
<li><span class="box">Duże naczynia tętnicze</span></li>
<li><span class="box">Gałęzie łuku aorty</span></li>
<li><span class="box">Naczynia tętnicze ściany klatki piersiowej</span></li>
<li><span class="box lead">Zestawienie unaczynienia tętniczego istotnych okolic</span><ul>
<li><span class="box">Opłucna</span></li>
<li><span class="box">Osierdzie</span></li>
<li><span class="box">Trzewia klatki piersiowej</span></li>
</ul></li>
<li><span class="box">Naczynia żylne</span></li>
<li><span class="box">Naczynia żylne ściany klatki piersiowej</span></li>
<li><span class="box">Naczynia i węzły chłonne</span></li>
</ul></figure>`,

  // #14 Nerwy klatki piersiowej
  "https://storage.googleapis.com/media-manager/lek/0195eaec-7a49-72a3-83c3-7424fe14c22f/0195eaec-7a49-72a3-83c3-7424fe42ff37.png": `
<figure class="wnl-embed"><div class="wnl-tree-title">Nerwy klatki piersiowej</div>
<ul class="wnl-outline">
<li><span class="box">Wstęp</span></li>
<li><span class="box">Nerwy rdzeniowe piersiowe</span></li>
<li><span class="box">Nerw przeponowy</span></li>
<li><span class="box">Nerw błędny</span></li>
<li><span class="box">Część piersiowa pnia współczulnego</span></li>
<li><span class="box">Sploty autonomiczne klatki piersiowej</span></li>
<li><span class="box lead">Zestawienie unerwienia istotnych okolic</span><ul>
<li><span class="box">Unerwienie czuciowe skóry klatki piersiowej i grzbietu</span></li>
<li><span class="box">Unerwienie ruchowe mięśni klatki piersiowej</span></li>
<li><span class="box">Unerwienie czuciowe opłucnej ściennej i osierdzia</span></li>
<li><span class="box">Unerwienie trzewi klatki piersiowej</span></li>
</ul></li>
</ul></figure>`,
};

export type SlideLike = { files: { pl?: string; la?: string; en?: string } };

/** Zwraca HTML nadpisania, jeśli któraś rycina (po URL PL) ma odpowiednik tekstowy. */
export function htmlOverride(slides: SlideLike[]): string | undefined {
  for (const s of slides) {
    const u = s.files?.pl;
    if (u && T[u]) return T[u];
  }
  return undefined;
}
