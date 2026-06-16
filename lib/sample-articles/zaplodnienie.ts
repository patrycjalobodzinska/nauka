// Artykuł „Zapłodnienie i wczesne etapy rozwoju zarodka" (slideshow 1338).
//
// Treść wyciągnięta z zescrapowanego HTML-a (Vue SSR) i oczyszczona z elementów
// interfejsu: narzędzi moderacji, linków do slajdów, dymków komentarzy, ikon
// FontAwesome, scaffoldingu przeglądarki mediów (swiper) oraz ankiety na końcu.
// Zostawiono nagłówki, akapity, listy, wyróżnione terminy i ryciny.
//
// Kolory wyróżnień z oryginału zmapowano na klasy .t1–.t4 (definicje w
// globals.css → .article-prose), dzięki czemu są czytelne także w trybie ciemnym:
//   t1 = pomarańczowy   t2 = fioletowy   t3 = morski/teal   t4 = czerwony

export const articleTitle = "Zapłodnienie i wczesne etapy rozwoju zarodka";

const img = (src: string, alt: string) =>
  `<figure><img loading="lazy" src="${src}" alt="${alt}" /><figcaption>${alt}</figcaption></figure>`;

export const articleHtml = `
<h1>Zapłodnienie i wczesne etapy rozwoju zarodka</h1>

<h2>Wstęp</h2>
<h3>Informacje podstawowe</h3>
<p>Pierwsza komórka nowo powstałego organizmu człowieka (<strong class="t1">zygota</strong>) powstaje w wyniku <strong class="t1">zapłodnienia</strong> – procesu połączenia gamety żeńskiej i męskiej.</p>
<p>Gamety powstają z <strong class="t2">pierwotnych komórek płciowych</strong>, które ulegają podziałowi <strong class="t2">mejotycznemu</strong> w mikrośrodowisku gonad.</p>
<p>Główne różnice pomiędzy gametogenezą męską i żeńską dotyczą podziału cytoplazmy i organelli komórkowych.</p>

<h2>Gonada męska</h2>
<h3>Struktura</h3>
<p>Jądro jest jednym z <strong class="t3">narządów wewnętrznych</strong> układu płciowego męskiego.</p>
<p>Składa się z <strong>płacików</strong> (około 200) oraz <strong>sieci</strong> jądra i jest otoczone <strong>błoną białawą</strong>.</p>
<p>W każdym płaciku znajdują się 1–4 <strong class="t1">kanaliki kręte</strong>, których ściana zbudowana jest z <strong class="t1">nabłonka plemnikotwórczego</strong> spoczywającego na błonie podstawnej wzmocnionej z zewnątrz komórkami mioidalnymi.</p>
<p>Nabłonek plemnikotwórczy składa się z komórek płciowych męskich (gamet) w różnym stadium rozwoju uporządkowanych przestrzennie przez <strong class="t1">komórki Sertolego</strong>.</p>
${img("https://media-manager.gumlet.io/lek/01919f44-a278-73b8-a86a-b472b7a952fe/0194a6c6-94f6-7094-b37f-de2cc7de0865.jpg?format=auto", "Jądro – przekrój strzałkowy")}
<p><strong>Najwcześniejsze stadia rozwoju</strong> komórek płciowych znajdują się <strong>na obwodzie</strong> kanalika krętego, spoczywając na błonie podstawnej.</p>
<p><strong>Najpóźniejsze stadia rozwoju</strong> gamet (najbardziej dojrzałe, czyli plemniki) znajdują się <strong>w świetle</strong> kanalika krętego, uwalniając się w kierunku sieci jądra (dalej najądrza, nasieniowodu).</p>
<p>W trakcie rozwoju wewnątrzmacicznego gonady męskie, w otoczeniu <strong class="t2">osłonek</strong> (wywodzących się ze ściany jamy brzusznej) oraz <strong class="t2">pochewki</strong> jądra (uchyłka otrzewnej), <strong>zstępują</strong> z jamy brzusznej przez <strong class="t2">kanał pachwinowy</strong> do <strong class="t2">worka mosznowego</strong>.</p>
<p>Do momentu inicjacji pokwitania gonada męska zbudowana jest ze <strong class="t1">sznurów płciowych</strong> złożonych z <strong class="t1">komórek płciowych</strong> i <strong class="t1">komórek podporowych</strong> (komórek Sertolego).</p>
<p>W okresie pokwitania sznury płciowe rozwijają się w <strong class="t1">kanaliki kręte jądra</strong>.</p>

<h3>Regulacja</h3>
<p>W okresie pokwitania <strong>hormon luteotropowy</strong> (<abbr title="Hormon luteinizujący, lutropina">LH</abbr>) przysadki mózgowej stymuluje <strong class="t2">komórki Leydiga</strong> do syntezy męskich hormonów płciowych, które są niezbędnym czynnikiem warunkującym <strong class="t3">rozwój gamet męskich</strong>.</p>
<p>Proces rozwoju gamety męskiej (spermatogeneza) trwa 74 dni i składa się ze:</p>
<ul>
  <li>1) <strong class="t3">spermatogoniogenezy</strong> (odnowa puli komórek macierzystych),</li>
  <li>2) <strong class="t3">spermatocytogenezy</strong> (podziały mejotyczne),</li>
  <li>3) <strong class="t3">spermiogenezy</strong> (dojrzewanie spermatyd w plemniki).</li>
</ul>

<h2>Gonada żeńska</h2>
<h3>Struktura</h3>
<p>Jajnik jest jednym z <strong class="t3">narządów wewnętrznych</strong> układu płciowego żeńskiego.</p>
<p>Składa się z:</p>
<ul>
  <li>1) <strong class="t2">kory</strong>,</li>
  <li>2) i <strong class="t2">rdzenia</strong>.</li>
</ul>
<p>Położony jest <strong>wewnątrzotrzewnowo</strong>, a do jego powierzchni przylegają <strong class="t1">strzępki jajowodu</strong>, umożliwiając przedostanie się uwolnionej gamety do wnętrza jajowodu.</p>
<p>Dwie główne funkcje jajnika to:</p>
<ul>
  <li>– <strong>produkcja gamet</strong>,</li>
  <li>– <strong>synteza hormonów płciowych</strong>.</li>
</ul>
${img("https://media-manager.gumlet.io/lek/0190c5c5-bcd2-71e2-8dad-22331549b729/0198c65a-9d40-71a5-806b-4db00298ff6f.jpg?format=auto", "Jajnik – przekrój czołowy")}

<h3>Rozwój jajnika</h3>
<p>W pierwszym trymestrze ciąży w gonadach płodu <strong class="t2">pierwotne komórki rozrodcze</strong> różnicują się w <strong class="t2">oogonie</strong>.</p>
<p>Skupiska oogonii otoczone są płaskimi komórkami pochodzącymi z <strong class="t2">nabłonka otaczającego jajnik</strong>.</p>
<p>Część oogonii dzieli się mitotycznie, część zaś otacza się komórkami pęcherzykowymi i zaczyna się <strong class="t2">różnicować w oocyty I rzędu</strong>.</p>
<p>Maksimum liczby komórek rozrodczych (7 milionów) płód osiąga w <strong>5. miesiącu</strong> życia wewnątrzmacicznego. Tuż po osiągnięciu tego maksimum większość komórek rozrodczych ulega atrezji. Przeżyją jedynie te, które położone są w korze narządu.</p>
<p>W obu gonadach jest ich około 600–800 tysięcy, są w stadium oocytu I rzędu i w tym stadium pozostaną do momentu rekrutacji. W momencie narodzin gonada nie zawiera już oogoniów.</p>
<p>Od okresu pokwitania przysadka mózgowa uwalnia w sposób cykliczny <strong>hormon folikulotropowy</strong> (<abbr title="Hormon folikulotropowy, folitropina">FSH</abbr>) oraz <strong>hormon luteotropowy</strong> (<abbr title="Hormon luteinizujący, lutropina">LH</abbr>), które stymulują wydzielanie estrogenów i progesteronu, a przez to rozwój pęcherzyków jajnikowych, a jednocześnie regulację przemian zachodzących w błonie śluzowej macicy (endometrium).</p>
<p>Dzięki temu moment owulacji jest zsynchronizowany z fazą sekrecyjną w endometrium, które jest gotowe na przyjęcie potencjalnego zarodka.</p>

<h2>Gamety</h2>
<h3>Powstawanie gamet</h3>
<h4>Podział mejotyczny</h4>
<p><strong class="t3">Mejoza</strong> jest podziałem komórkowym zachodzącym w linii gametogenicznej komórek diploidalnych, prowadzącym do redukcji materiału genetycznego w jądrach komórkowych czterech komórek potomnych.</p>
<p>W trakcie dwóch podziałów mejozy <strong class="t3">diploidalne</strong> (<strong class="t3">2n</strong>) komórki macierzyste ulegają podziałowi na <strong class="t2">haploidalne</strong> (<strong class="t2">1n</strong>) komórki potomne (<strong>n</strong> oznacza liczbę chromosomów).</p>
${img("https://media-manager.gumlet.io/lek/01917461-556f-715f-85bd-8c3a4c60a1ea/01973bed-07ac-723a-8473-4399b6f742c8.jpg?format=auto", "Podział mejotyczny")}
<h4>Różnica pomiędzy podziałem mitotycznym i mejotycznym</h4>
<p>Zarówno podział mitotyczny, jak i mejotyczny prowadzi do powstania komórek potomnych.</p>
<p>Poprzez <strong class="t1">mitozę</strong> dzielą się komórki somatyczne. Podziały te zachodzą bardzo intensywnie w czasie wzrastania organizmu w pierwszych okresach ontogenezy człowieka oraz później, w dojrzałym organizmie, w populacjach komórek o wysokim potencjale regeneracyjnym.</p>
<p><strong class="t3">Mejoza</strong> zachodzi jedynie w populacji komórek gametogenicznych i ma na celu redukcję liczby chromosomów w gametach.</p>
${img("https://media-manager.gumlet.io/anatomy-us/01917464-c9ab-71b6-840e-f727c3f2ae62/019df344-17ab-7042-a556-c1c2f29d6dbd.jpg?format=auto", "Podział mitotyczny i mejotyczny – porównanie")}
<h3>Gametogeneza męska</h3>
<p>Gametogeneza męska – <strong class="t3">spermatogeneza</strong> – to proces powstawania i dojrzewania plemników.</p>
<p>Proces ten zachodzi w <strong class="t3">kanalikach krętych</strong> jądra od momentu pokwitania.</p>
<p>W wyniku spermatogenezy komórki macierzyste (spermatogonia) rozwijają się w dojrzałe plemniki.</p>
<p>Z pojedynczej komórki macierzystej powstają <strong class="t3">cztery</strong> potomne równoważne i funkcjonalne gamety męskie.</p>
${img("https://media-manager.gumlet.io/anatomy-us/01917469-a585-7222-9366-88de52703e34/019df349-cde5-7012-a2f2-da0430b08fda.jpg?format=auto", "Gametogeneza męska")}
<h3>Gametogeneza żeńska</h3>
<p>Gametogeneza żeńska – <strong class="t2">oogeneza</strong> – przebiega w jajnikach.</p>
<p>We wczesnych stadiach ontogenezy oogonia dzielą się mitotycznie, tworząc diploidalne <strong class="t2">oocyty I rzędu</strong>. Oocyt I rzędu w przebiegu pierwszego podziału mejotycznego dzieli się na:</p>
<ul>
  <li>1) haploidalny <strong class="t2">oocyt II rzędu</strong>,</li>
  <li>2) haploidalne <strong class="t2">ciałko kierunkowe</strong>.</li>
</ul>
<p>W drugim podziale mejotycznym następuje redukcja ilości materiału do 1c.</p>
<p>W gametogenezie żeńskiej nie występuje etap dojrzałej autonomicznej „komórki jajowej".</p>
${img("https://media-manager.gumlet.io/anatomy-us/0191746d-147f-71d7-a66f-b098b22a230c/019df34c-eee0-71f6-a911-28b71e5a27b4.jpg?format=auto", "Gametogeneza żeńska")}

<h2>Zapłodnienie</h2>
<h3>Zaplemnienie</h3>
<p><strong class="t1">Zapłodnienie</strong> jest złożonym procesem, który prowadzi do połączenia materiału genetycznego ojca z materiałem genetycznym matki w pierwszej komórce organizmu potomnego.</p>
<p>Najczęściej ma miejsce w <strong class="t1">bańce jajowodu</strong>.</p>
<p>W procesie zapłodnienia występują trzy stadia kontaktu plemnika z oocytem II rzędu:</p>
<ul>
  <li>1) <strong>zaplemnienie</strong>,</li>
  <li>2) <strong>reakcja akrosomalna</strong>,</li>
  <li>3) <strong>fuzja błon</strong> oocytu i plemnika.</li>
</ul>
${img("https://media-manager.gumlet.io/anatomy-us/01917470-a895-7107-b649-7c4fe4cf7b2f/019df350-f34a-737a-ad2a-79351d7adcba.jpg?format=auto", "Zaplemnienie i zapłodnienie")}
<h3>Inicjacja zapłodnienia</h3>
<p>W pierwszej fazie plemnik przenika przez barierę utworzoną przez <strong class="t2">wieniec promienisty</strong>.</p>
<p>W drugiej fazie jeden lub więcej plemników przenika przez <strong class="t1">osłonkę przejrzystą</strong>.</p>
<p>W trzeciej fazie jeden plemnik przechodzi przez <strong class="t2">błonę oocytu</strong>, tracąc przy tym własną błonę komórkową.</p>
<h3>Reakcja akrosomalna</h3>
<p><strong>Reakcja akrosomalna</strong> zachodzi pomiędzy enzymami akrosomu plemnika a osłonką przejrzystą oocytu II rzędu.</p>
<p><strong class="t1">Enzymy</strong> uwolnione z akrosomu torują drogę plemnika w kierunku błony komórkowej oocytu II rzędu i jednocześnie zmieniają właściwości fizykochemiczne <strong class="t1">osłonki przejrzystej</strong>, która od tego momentu staje się <strong class="t1">barierą dla kolejnych plemników</strong>.</p>
<p>Mechanizm ten umożliwia zatem ostatni etap zapłodnienia i jednocześnie <strong>chroni przed polispermią</strong>.</p>
${img("https://media-manager.gumlet.io/anatomy-us/01917475-ea8b-7274-921b-8a2b32696115/019df355-71f9-737e-816c-96ad2b12305f.jpg?format=auto", "Reakcja akrosomalna")}
<h3>Zakończenie procesu zapłodnienia</h3>
<p>Przeniknięcie plemnika przez błonę komórkową jest impulsem do <strong class="t3">dokończenia II podziału mejotycznego</strong> oocytu II rzędu.</p>
<p>Ten etap jest konieczny dla ostatecznej redukcji materiału genetycznego w gamecie żeńskiej.</p>
<p>W wyniku drugiego podziału mejotycznego powstaje <strong class="t3">drugie ciało kierunkowe</strong>, które umiejscowuje się pomiędzy błoną komórkową a osłonką przejrzystą.</p>
<p>Jeśli w danym cyklu miesięcznym nie dojdzie do zapłodnienia, gameta żeńska pozostanie w stadium <strong class="t3">oocytu II rzędu</strong>, a następnie ulegnie nekrozie.</p>
<h3>Konsekwencje zapłodnienia</h3>
<p>Konsekwencją zapłodnienia jest powstanie <strong class="t1">pierwszej komórki somatycznej</strong> (<strong class="t1">zygoty</strong>) nowego organizmu, o typowej dla gatunku ilości materiału genetycznego.</p>
<p>Materiał genetyczny pochodzący z gamety formuje <strong class="t1">przedjądrze żeńskie i męskie</strong>.</p>
<p>Przedjądrza ulegają fuzji, następuje <strong class="t1"><em>imprinting</em> genomowy</strong>, a zaraz po tym <strong class="t1">pierwszy podział mitotyczny</strong>.</p>

<h2>Zygota</h2>
<h3>Komórka somatyczna</h3>
<p><strong class="t1">Zygota</strong> człowieka zawiera 23 pary chromosomów (22 par autosomów i 1 pary chromosomów płciowych).</p>
<p>Wykazuje się <strong class="t1">zmiennością genetyczną</strong> względem komórek somatycznych organizmów rodzicielskich dzięki <strong class="t1">nowej kompozycji par chromosomów</strong> oraz dzięki zjawisku <strong class="t1"><em>crossing-over</em></strong> zachodzącemu podczas gametogenezy.</p>
${img("https://media-manager.gumlet.io/anatomy-us/0191747a-a38f-7082-844f-5cfc00db5247/019df358-2f3b-71f4-8d73-f15c3adea840.jpg?format=auto", "Zygota")}
<h3>Podział mitotyczny</h3>
<p><strong class="t1">Zygota</strong> otoczona osłonką przejrzystą przemieszcza się we wnętrzu jajowodu w kierunku światła macicy.</p>
<p>W trakcie pierwszej doby od momentu zapłodnienia ulega pierwszemu podziałowi mitotycznemu.</p>
${img("https://media-manager.gumlet.io/lek/01917480-e992-72f3-91e8-4c484a8bbed4/0194a75b-2dad-701e-836f-e5bfa51e0946.jpg?format=auto", "Stadia rozwoju przed implantacją")}
<h3>Stadia rozwoju zarodka przed implantacją</h3>
<p>W wyniku pierwszego podziału mitotycznego powstają dwie siostrzane komórki: <strong class="t2">blastomery</strong>.</p>
<p>O zarodku na tym etapie mówimy, że znajduje się w stadium <strong class="t2">2 blastomerów</strong>.</p>
<p>Zarodek taki otoczony jest osłonką przejrzystą, a blastomery ulegają kolejnym podziałom mitotycznym.</p>
<p>W ten sposób powstaje zarodek w stadium kolejno <strong class="t2">4</strong> i <strong class="t2">8 blastomerów</strong>.</p>

<h2>Morula</h2>
<h3>Budowa</h3>
<p>Zarodek składający się z 12–32 blastomerów nosi nazwę <strong class="t1">moruli</strong> i także otoczony jest <strong class="t1">osłonką przejrzystą</strong>.</p>
<p>Morula w momencie jej powstania znajduje się w <strong class="t1">świetle jajowodu</strong> i, podobnie jak poprzednie stadia, swobodnie przemieszcza się w kierunku światła macicy.</p>
${img("https://media-manager.gumlet.io/anatomy-us/01917485-2ad6-7054-8bc1-7cf174144294/019df35a-d826-7076-a267-d829f178161f.jpg?format=auto", "Morula")}
<h3>Przemiany struktury i osłonki przejrzystej</h3>
<p>Na przełomie 4. i 5. doby od momentu zapłodnienia morula dociera do granicy pomiędzy jajowodem i światłem macicy.</p>
<p>W tym czasie dochodzi do rozluźnienia utkania moruli, pomiędzy blastomerami pojawiają się przestrzenie, zanika także osłonka przejrzysta.</p>

<h2>Blastocysta</h2>
<h3>Budowa</h3>
<p>Komórki stanowiące masę moruli zmieniają swój układ. Formują:</p>
<ul>
  <li>– zewnętrzną warstwę (<strong class="t1">trofoblast</strong>) – zawiązek części płodowej łożyska,</li>
  <li>– masę wewnętrzną (<strong class="t2">węzeł zarodkowy</strong>, czyli <strong class="t2">embrioblast</strong>), z której rozwinie się nowy organizm.</li>
</ul>
<p>Zarodek w tym stadium rozwoju nazywa się <strong class="t1">blastocystą</strong>.</p>
${img("https://media-manager.gumlet.io/lek/01917487-bf9a-7321-b48f-fa6d9b9dbdec/019363e8-e874-735f-9fce-4605b86b1353.jpg?format=auto", "Blastocysta")}
<p>W trakcie 24 godzin od momentu wniknięcia zarodka do macicy komórki trofoblastu namnażają się, a część z nich ulega fuzji.</p>
<p>Zmiany w trofoblaście prowadzą do wyodrębnienia:</p>
<ul>
  <li>– <strong class="t1">cytotrofoblastu</strong> (zbudowanego z komórek o klasycznej budowie),</li>
  <li>– <strong class="t2">syncytiotrofoblastu</strong> (zbudowanego z zespólni komórkowych).</li>
</ul>
${img("https://media-manager.gumlet.io/lek/0191748b-6da3-738e-855b-32527456c9a4/0192afc5-d300-715b-881f-7ef5e87a652f.jpg?format=auto", "Blastocysta ze zróżnicowanym trofoblastem")}
<p>Syncytiotrofoblast stanowi zewnętrzną warstwę ściany blastocysty.</p>
<p>Zespólnie syncytiotrofoblastu syntetyzują wiele substancji, z których najważniejsze są:</p>
<ul>
  <li>– <strong>enzymy proteolityczne</strong> uwalniane do bezpośredniego otoczenia zarodka – do endometrium,</li>
  <li>– <strong>hormony</strong>, m.in. gonadotropinę łożyskową.</li>
</ul>
<h3>Implantacja</h3>
<p>Do 5. doby od momentu zapłodnienia zarodek nie jest połączony fizycznie z organizmem matki.</p>
<p>Od 6. doby życia zarodka rozpoczyna się <strong class="t3">implantacja</strong> (zagnieżdżenie).</p>
<p>Proces ten polega na wnikaniu trofoblastu w strukturę endometrium (błony śluzowej macicy). Na początku 2. tygodnia rozwoju blastocysta jest już wyraźnie zagłębiona w błonie śluzowej macicy.</p>
<p>W 9. dobie w syncytiotrofoblaście powstają rozstępy (lakuny).</p>
<p>Enzymy syncytiotrofoblastu trawią ścianę naczyń zatokowych endometrium, przez co krew wpływa do lakun i pod koniec 2. tygodnia od momentu zapłodnienia powstaje <strong class="t3">pierwotne krążenie maciczno-łożyskowe</strong>.</p>
<p>W tym samym czasie proliferują komórki cytotrofoblastu. Ich skupiska tworzą kolumny wrastające w syncytiotrofoblast i w taki sposób powstają <strong class="t3">kosmki pierwotne</strong> łożyska.</p>
<p>Pod koniec 2. tygodnia rozwoju blastocysta jest już całkowicie zagłębiona w błonie śluzowej macicy, a ubytek błony śluzowej macicy powstały w czasie implantacji wypełniony jest skrzepem, a następnie ulega wygojeniu.</p>
<p>Wpływ hormonów ciążowych oraz interakcja z syncytio- i cytotrofoblastem prowadzi do zmian właściwości endometrium i jego przekształcenia w doczesną.</p>
<p>Łożysko jest wspólnym narządem utworzonym przez tkanki matczyne i zarodkowe/płodowe.</p>
${img("https://media-manager.gumlet.io/lek/01905388-3add-73e1-92d0-7ffea12bbdf1/01966230-ebf5-70db-ad9f-0b0a2748771c.jpg?format=auto", "Łożysko")}
<h3>Dwuwarstwowa tarczka zarodkowa</h3>
<p>W 7. dobie rozwoju z <strong class="t2">węzła zarodkowego</strong> (<strong class="t2">embrioblastu</strong>) wyodrębnia się dwie warstwy:</p>
<ul>
  <li>1) <strong class="t2">epiblast</strong>,</li>
  <li>2) <strong class="t2">hypoblast</strong>,</li>
</ul>
<p>które tworzą wspólnie <strong class="t2">dwuwarstwową tarczkę zarodkową</strong>.</p>
${img("https://media-manager.gumlet.io/lek/01917492-1a52-7298-9181-82f00ff44458/01934dc6-88f8-7208-a9b8-5ed7e0b45f7c.jpg?format=auto", "Blastocysta z dwuwarstwową tarczką zarodkową i jamą owodniową")}
<p>Następnie, w 9. dobie, w obrębie komórek epiblastu pojawia się mała jamka, która powiększa się, w wyniku czego powstaje <strong class="t1">jama owodniowa</strong>.</p>
<p>Komórki epiblastu, które w wyniku tego rozwarstwienia pozostały w kontakcie z cytotrofoblastem, nazywamy od tego momentu <strong class="t1">amnioblastami</strong>.</p>
<p>W tym samym czasie komórki hypoblastu proliferują i układają się na komórkach cytotrofoblastu, formując <strong class="t2">błonę zewnątrzzarodkowej jamy ciała</strong>.</p>
<p>Hypoblast i błona zewnątrzzarodkowej jamy ciała wspólnie wyścielają <strong class="t1">jamę pęcherzyka żółtkowego pierwotnego</strong> (<strong class="t1">zewnątrzzarodkową jamę ciała</strong>).</p>
<p>Także w 2. tygodniu rozwoju pomiędzy warstwą cytotrofoblastu a błoną pęcherzyka żółtkowego powstaje <strong class="t1">mezoderma zewnątrzzarodkowa</strong>.</p>
<p>Komórki mezodermy zewnątrzzarodkowej pochodzą z komórek ściany pierwotnego pęcherzyka żółtkowego (czyli z błony zewnątrzzarodkowej jamy ciała).</p>
${img("https://media-manager.gumlet.io/lek/019174bc-17d5-7169-b772-0e15a82b4a1a/01934444-0b27-71c2-820f-93d60c36d367.jpg?format=auto", "Blastocysta z dwuwarstwową tarczką zarodkową i jamą owodniową (2)")}
<p>Jeszcze w 2. tygodniu życia zarodka dochodzi do powstania szczelin pomiędzy komórkami mezodermy pozazarodkowej.</p>
<p>Szczeliny te łączą się w większe przestrzenie, aż powstanie jedna <strong class="t1">wspólna jama kosmówkowa</strong> (pozazarodkowa jama ciała).</p>
${img("https://media-manager.gumlet.io/lek/019174c5-4315-70df-a091-8d638438925f/01930b6f-a52f-706c-a48c-fc4892ce74bb.jpg?format=auto", "Blastocysta z mezodermą pozazarodkową")}
<p>Powstanie pozazarodkowej jamy ciała sprawia, że mezoderma pozazarodkowa ulega podziałowi na:</p>
<ul>
  <li>1) <strong class="t1">blaszkę ścienną</strong> przylegającą do cytotrofoblastu,</li>
  <li>2) <strong class="t1">blaszkę trzewną</strong> pokrywającą zarodek wraz z pęcherzykiem żółtkowym.</li>
</ul>
<p>Blaszka ścienna i trzewna mezodermy pozazarodkowej są połączone <strong class="t1">szypułą łączącą</strong>, która jest zawiązkiem pępowiny.</p>
${img("https://media-manager.gumlet.io/anatomia/01919ada-73ad-7057-9137-57ab6e492572/01970130-c6a1-7361-9076-09a801db1321.jpg?format=auto", "Zarodek z jamą kosmówkową")}

<h2>Tarczka zarodkowa</h2>
<h3>Przełom 2. i 3. tygodnia</h3>
<p>Gastrulację poprzedzają zmiany w obrębie płytki zarodkowej.</p>
<p>W warstwie epiblastu powstają:</p>
<ul>
  <li>– <strong class="t2">smuga pierwotna</strong>,</li>
  <li>– <strong class="t2">węzeł pierwotny</strong>,</li>
  <li>– <strong class="t2">płytka przedstrunowa</strong>,</li>
  <li>– <strong class="t2">błona stekowa</strong>.</li>
</ul>
${img("https://media-manager.gumlet.io/lek/019174d1-75b8-70ad-b6a2-9220d56f0776/0192afb8-68e6-70e1-83a8-74d5d966c6a9.jpg?format=auto", "Tarczka zarodkowa – przełom 2. i 3. tygodnia – widok z góry")}
<h3>Gastrulacja</h3>
<p>W procesie gastrulacji komórki epiblastu migrują dośrodkowo, w kierunku węzła pierwotnego i smugi pierwotnej.</p>
<p>Następnie przechodzą poprzez smugę pierwotną i układają się w dwie nowe warstwy komórek:</p>
<ul>
  <li>1) endodermę,</li>
  <li>2) mezodermę.</li>
</ul>
<p>Komórki wnikające w węzeł pierwotny następnie ulegają inwaginacji i migrują w linii prostej w stronę przedniego bieguna zarodka, aż do płytki przedstrunowej.</p>
<p>Tworzą cewkowaty twór zwany <strong class="t3">wyrostkiem struny grzbietowej</strong>.</p>
${img("https://media-manager.gumlet.io/anatomy-us/019174e2-3217-7335-b0e9-4c32ed67e380/019df366-ec37-7378-b6d6-e3f162372e9d.jpg?format=auto", "Tarczka zarodkowa – przekrój strzałkowy")}
<p>Wraz z pojawieniem się komórek <strong class="t1">endodermy</strong> apoptozie ulegają komórki hypoblastu.</p>
<p>Można zatem powiedzieć, że komórki <strong class="t1">hypoblastu</strong> są zastępowane przez komórki endodermy zarodka.</p>
<p>Endoderma tworzy początkowo jednorodną płaską warstwę komórkową, bezpośrednio sąsiadującą z wnętrzem pęcherzyka żółtkowego.</p>
<p><strong class="t4">Mezoderma</strong> początkowo jest niezróżnicowaną warstwą komórek, jednak pod wpływem działania czynników wzrostu uwalnianych przez <strong>strunę grzbietową</strong> ulega zróżnicowaniu w:</p>
<ul>
  <li>1) <strong class="t4">mezodermę przyosiową</strong>,</li>
  <li>2) <strong class="t4">mezodermę pośrednią</strong>,</li>
  <li>3) <strong class="t4">mezodermę boczną</strong>.</li>
</ul>
<p>Od momentu pojawienia się mezodermy <strong class="t2">epiblast</strong> zmienia swoją nazwę na <strong class="t2">ektoderma</strong>.</p>
<p>Na początku 3. tygodnia zostają ukształtowane <strong>trzy podstawowe listki</strong> zarodka:</p>
<ul>
  <li>1) <strong class="t2">ektoderma</strong>,</li>
  <li>2) <strong class="t4">mezoderma</strong>,</li>
  <li>3) <strong class="t1">endoderma</strong>, które wchodzą w kolejne etapy różnicowania.</li>
</ul>
${img("https://media-manager.gumlet.io/anatomy-us/019174f8-1e6e-7146-bbcd-cfd512141d8a/019df36a-0dd0-70d4-99a3-cdb19e50079e.jpg?format=auto", "Zarodek na początku 3. tygodnia – przekrój poprzeczny")}

<h2>Fałdowanie zarodka</h2>
<h3>Informacje wstępne</h3>
<p><strong>Trójwarstwowa tarczka zarodkowa</strong> pod wpływem czynników wzrostu uwalnianych przez <strong>strunę grzbietową</strong> zmienia swój kształt.</p>
<p>Ektoderma i mezoderma wyraźnie zwiększają swoją objętość, zyskując przewagę nad endodermą. Zmiany zachodzące w endodermie na tym etapie mają głównie charakter subkomórkowy.</p>
<p>Zmiana proporcji pomiędzy listkami zarodkowymi prowadzi do <strong>zmian kształtu</strong> zarodka, który zaczyna zamykać się wzdłuż długiej osi, a jego boczne krawędzie zaczynają zbliżać się do siebie. Jednocześnie, wraz ze wzrastaniem zarodka na długość, dochodzi także do zmiany kształtu zarodka wzdłuż jego długiej osi i zbliżania się bieguna głowowego do ogonowego.</p>
<p>Proces zamykania zarodka do wewnątrz nazywamy <strong>fałdowaniem</strong>. Na przekroju poprzecznym przez zarodek obserwujemy tzw. <strong>fałdowanie boczne</strong>, a na przekroju strzałkowym <strong>fałdowanie głowowo-ogonowe</strong>.</p>
<h3>Fałdowanie boczne</h3>
<p>Od początku powstania trójwarstwowej tarczki zarodkowej jej listki poddane są oddziaływaniu struny grzbietowej.</p>
<p><strong>Struna grzbietowa</strong> za pośrednictwem uwalnianych czynników wzrostu wyznacza <strong class="t1">oś długą zarodka</strong> i wywołuje zmiany na poziomie komórkowym i w strukturze morfologicznej <strong>wszystkich listków zarodkowych</strong>.</p>
${img("https://media-manager.gumlet.io/anatomy-us/019174fd-06bd-731c-bf3a-b947dc80ab2b/019df2f2-d101-7205-bab2-bd61a6212796.jpg?format=auto", "Fałdowanie boczne")}
<p>Najbardziej widoczne zmiany na poziomie morfologicznym zachodzą w ektodermie i mezodermie.</p>
<p>Intensywny wzrost ektodermy i mezodermy, wywołany czynnikami uwalnianymi przez strunę grzbietową, przebiega z jednoczesnymi <strong>zmianami struktury</strong> tych dwóch listków zarodkowych.</p>
<p><strong class="t2">Ektoderma</strong> różnicuje się w <strong class="t2">ektodermę powierzchowną</strong> i <strong class="t2">płytkę nerwową</strong>.</p>
<p>W <strong class="t4">mezodermie</strong> różnicują się trzy obszary:</p>
<ul>
  <li>1) <strong class="t4">mezoderma przyosiowa</strong>,</li>
  <li>2) <strong class="t4">mezoderma pośrednia</strong>,</li>
  <li>3) <strong class="t4">mezoderma boczna</strong>.</li>
</ul>
<p>W ektodermie struna grzbietowa:</p>
<ul>
  <li>– indukuje proces <strong class="t1">neurulacji</strong> – powstanie <strong class="t1">cewy nerwowej</strong> i <strong class="t1">grzebieni nerwowych</strong> z płytki nerwowej, ORAZ</li>
  <li>– wzrastanie boczne ektodermy powierzchownej synchronicznie z leżącą pod nią mezodermą, aż do całkowitego zrośnięcia bocznych krawędzi ektodermy w linii pośrodkowej.</li>
</ul>
<p>W mezodermie struna grzbietowa pogłębia proces różnicowania, w tym także wyodrębnienia w <strong class="t4">mezodermie bocznej</strong>:</p>
<ul>
  <li>– <strong class="t4">blaszki ściennej</strong> (przylegającej do ektodermy powierzchniowej),</li>
  <li>– <strong class="t4">blaszki trzewnej</strong> (przylegającej do endodermy).</li>
</ul>
<p>Blaszki te oddzielone są wąską szczeliną, która stopniowo powiększa się i w ten sposób powstaje <strong class="t4">wewnątrzzarodkowa jama ciała</strong>.</p>
<p>W tym samym czasie dochodzi także do uformowania <strong class="t1">cewy pokarmowej</strong>, która wyścielona jest od wewnątrz <strong class="t1">endodermą</strong>.</p>
<p>W części środkowej zarodka wnętrze cewy pokarmowej jest połączone <strong class="t1">przewodem pęcherzykowo-jelitowym</strong> ze światłem <strong class="t1">pęcherzyka żółtkowego</strong>, co opóźnia zamknięcie wewnątrzzarodkowej jamy ciała w tej części zarodka.</p>
<h3>Fałdowanie głowowo-ogonowe</h3>
<p>Proces fałdowania obserwowany na przekroju strzałkowym nazywamy fałdowaniem głowowo-ogonowym.</p>
<p>W wyniku tego procesu biegun ogonowy zarodka zbliża się do bieguna głowowego.</p>
${img("https://media-manager.gumlet.io/anatomy-us/01917520-0736-708d-b15d-ec0d45b5c702/019df26c-43c7-7325-a459-95b992700c9d.jpg?format=auto", "Zarodek w 3. tygodniu – przekrój strzałkowy")}
<p>Na przekroju strzałkowym zarodka, na początku 3. tygodnia, narządem położonym najbardziej dogłowowo jest <strong class="t2">zawiązek serca</strong>.</p>
<p>Ku tyłowi od zawiązka serca znajduje się <strong class="t3">płytka przedstrunowa</strong>, następnie <strong class="t3">węzeł pierwotny</strong> z <strong class="t3">dołkiem pierwotnym</strong> i rozwijającą się <strong class="t3">wypustką struny grzbietowej</strong>. Dalej ku tyłowi widoczna jest <strong class="t3">smuga pierwotna</strong>, a za nią <strong class="t3">błona stekowa</strong>.</p>
<p>W kolejnych etapach fałdowania głowowo-ogonowego zarodek przybiera kształt łuku.</p>
<p><strong class="t1">Cewa nerwowa</strong> i <strong class="t1">jej pochodne</strong>, przykryte ektodermą powierzchniową, lokalizują się od wypukłej strony zarodka, od wklęsłej zaś strony lokalizuje się <strong class="t1">cewa pokarmowa</strong> zamknięta w wewnątrzzarodkowej jamie ciała.</p>
`;
