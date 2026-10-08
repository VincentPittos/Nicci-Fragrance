/**
 * NICCI: jednorazowa aktualizacja arkusza, październik 2026. Wygenerowane przez dev/aktualizacja_arkusza.py.
 *
 * Co robi (uruchom raz funkcję aktualizacja_2026_10 z edytora, po wklejeniu nowego Code.gs i uruchomieniu setup):
 *   1. Dopisuje do zakładki Produkty zapachy, których jeszcze nie ma (Lp. 56 i 72 do 100 w arkuszu doradcy).
 *      Wiersz z tym samym id, ale bez nazwy (np. p56), uzupełnia. Istniejących zapachów nie zmienia.
 *   2. Uzupełnia nowe kolumny bestseller, klimat i renoma, ale tylko w pustych komórkach.
 *   3. Zmienia kolumnę podobne w zapachach, w których arkusz doradcy ją poprawił, o ile w arkuszu sklepu jest
 *      jeszcze stara wartość (Twoje własne zmiany zostają).
 *   4. W zestawie Sweet & Spicy zamienia Lost Cherry (niedostępny) na Wet Cherry Liquor.
 * Wynik trafia do zakładki Log. Ponowne uruchomienie niczego nie dubluje. Po aktualizacji ten plik można usunąć.
 */
const AKTUALIZACJA_2026_10 = {
 "nowe": [
  {
   "id": "p56",
   "aktywny": "TAK",
   "marka": "Versace",
   "nazwa": "Eros Energy",
   "rodzina": "cytrusowa",
   "profil": "męski",
   "nuty_glowy": "Krwista pomarańcza, grejpfrut, cytryna, limonka, mandarynka, bergamotka sycylijska",
   "nuty_serca": "Różowy pieprz, biała ambra, czarna porzeczka",
   "nuty_bazy": "Piżmo, paczula, dębowy mech",
   "opis": "Sześć różnych cytrusów naraz, czyli otwarcie tak jasne, że brzmi jak zimna woda z lodem w środku sierpnia. Prosty i energetyczny, bez niczego, co mogłoby komuś przeszkadzać. Dobry pierwszy zakup dla kogoś, kto boi się mocnych i słodkich zapachów. Trzeba go odświeżyć po kilku godzinach i to jedyne zastrzeżenie.",
   "sezon": "wiosna, lato",
   "pora": "dzień",
   "trwalosc": 2.5,
   "projekcja": 2.5,
   "intensywnosc": 1,
   "cena_5": "",
   "cena_10": 70,
   "cena_20": 130,
   "ml_dostepne": "",
   "podobne": "p12, p21, p62",
   "zdjecie_url": "",
   "kolejnosc": 56,
   "okazja": "Codzienność, sport, uczelnia, wakacje",
   "bestseller": "",
   "klimat": "cytrusowy, aromatyczny",
   "renoma": 1
  },
  {
   "id": "p72",
   "aktywny": "TAK",
   "marka": "Carner Barcelona",
   "nazwa": "Cuirs",
   "rodzina": "skórzana",
   "profil": "unisex",
   "nuty_glowy": "Szafran, kminek",
   "nuty_serca": "Drewno sandałowe, gwajakowiec, paczula, cedr Virginia, fiołek",
   "nuty_bazy": "Oud, skóra, francuskie labdanum, fasola tonka, bursztyn, piżmo, cypriol, amyris",
   "opis": "Otulające przyprawy okryte gładką skórą. Słodkawy z zachowanym balansem elegancji, przy czym bardzo uniwersalny. Nada się na randkę jak i na mniej zobowiązujące wyjścia w chłodniejsze dni w roku. Idealne wprowadzenie w zapachy skórzane.",
   "sezon": "wiosna, jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": "",
   "cena_10": 70,
   "cena_20": 130,
   "ml_dostepne": "",
   "podobne": "p32, p04, p33, p49",
   "zdjecie_url": "/img/produkty/p72-800.webp",
   "kolejnosc": 72,
   "okazja": "Randka, wyjście, codzienność zimną porą",
   "bestseller": "",
   "klimat": "drzewny, aromatyczny",
   "renoma": 2
  },
  {
   "id": "p73",
   "aktywny": "TAK",
   "marka": "New Notes",
   "nazwa": "Akigala Mandarino",
   "rodzina": "drzewna",
   "profil": "unisex",
   "nuty_glowy": "Mandarynka, marakuja, malina, jabłko",
   "nuty_serca": "Frezja, jaśmin, konwalia",
   "nuty_bazy": "Akigalawood, ambra",
   "opis": "Mandarynka z maliną i marakują, podane tak soczyście, że pierwsze minuty pachną jak miska owoców postawiona na słońcu, a w tle mineralne akordy akigalawood oraz szafran. Potem robi się kwiatowo i miękko, a na dnie zostaje ciepłe, lekko pieprzne drewno. Tej marki nie zna w Polsce prawie nikt, więc pytania o nazwę przychodzą same.",
   "sezon": "wiosna, lato, jesień",
   "pora": "dzień",
   "trwalosc": 4,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": 110,
   "cena_10": 180,
   "cena_20": 330,
   "ml_dostepne": "",
   "podobne": "p39, p44, p43",
   "zdjecie_url": "",
   "kolejnosc": 73,
   "okazja": "Uniwersalny: biuro, wyjście, codzienność premium",
   "bestseller": "",
   "klimat": "cytrusowy, kwiatowy",
   "renoma": 1
  },
  {
   "id": "p74",
   "aktywny": "TAK",
   "marka": "Xerjoff",
   "nazwa": "Opera",
   "rodzina": "kwiatowa",
   "profil": "unisex",
   "nuty_glowy": "Kosz owoców, róża turecka",
   "nuty_serca": "Skóra, ambra, gałka muszkatołowa, ylang-ylang",
   "nuty_bazy": "Cedr wirginijski, wetyweria haitańska, piżmo, paczula, wanilia",
   "opis": "Owocowy, różany start, który po kwadransie zamienia się w gładką skórę z przyprawą. Na końcu zostaje pudrowa wanilia na ciepłym drewnie. Trzyma ponad osiem godzin i wypełnia pomieszczenie, więc dwa psiknięcia to górna granica. Zapach na operę, kolację i każdą sytuację, do której zakładasz coś lepszego niż bluzę. Przez swoją kwiatowość częściej wybierany przez kobiety.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4.5,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": "",
   "cena_10": 110,
   "cena_20": 210,
   "ml_dostepne": "",
   "podobne": "p88, p83, p87, p04",
   "zdjecie_url": "/img/produkty/p74-800.webp",
   "kolejnosc": 74,
   "okazja": "Teatr, kolacja, okazje formalne",
   "bestseller": "",
   "klimat": "kwiatowy, orientalny",
   "renoma": 2
  },
  {
   "id": "p75",
   "aktywny": "TAK",
   "marka": "Parfums de Marly",
   "nazwa": "Layton",
   "rodzina": "ambrowa",
   "profil": "męski",
   "nuty_glowy": "Jabłko, bergamotka, kardamon",
   "nuty_serca": "Lawenda, fiołek, geranium",
   "nuty_bazy": "Paczula, wanilia, drzewo gwajakowe, praliny",
   "opis": "Flagowy zapach Parfums de Marly i jeden z tych, z którymi trudno się nie polubić. Soczyste jabłko z kardamonem na wejściu. Po godzinie słodka, kremowa wanilia z pralinami i dymnym drewnem. Trzyma od ośmiu do dziesięciu godzin, a na kurtce zostaje kilka dni. Jeśli szukasz zapachu, po którym ktoś się odwróci na jesiennej imprezie, to bardzo pewny wybór.",
   "sezon": "jesień, zima",
   "pora": "uniwersalna",
   "trwalosc": 4,
   "projekcja": 4.5,
   "intensywnosc": 3,
   "cena_5": 90,
   "cena_10": 120,
   "cena_20": 220,
   "ml_dostepne": "",
   "podobne": "p89, p52, p10, p71",
   "zdjecie_url": "/img/produkty/p75-800.webp",
   "kolejnosc": 75,
   "okazja": "Randka, wyjście, klub, codzienność zimą",
   "bestseller": "",
   "klimat": "slodki, aromatyczny",
   "renoma": 3
  },
  {
   "id": "p76",
   "aktywny": "TAK",
   "marka": "Parfums de Marly",
   "nazwa": "Pegasus Exclusif",
   "rodzina": "drzewna",
   "profil": "męski",
   "nuty_glowy": "Różowy pieprz, kardamon, migdał",
   "nuty_serca": "Lawenda, kwiat pomarańczy, geranium",
   "nuty_bazy": "Wanilia, ambroksan, oud, drzewo gwajakowe",
   "opis": "Migdał z wanilią na ciepłym, lekko dymnym drewnie. Pachnie jak wnętrze drogiej cukierni, do której ktoś wstawił skórzane fotele: słodko, ale zdecydowanie dorośle. Wersja parfum, czyli gęsta, i przy jednym psiknięciu trzyma kilkanaście godzin. Dobra propozycja dla kogoś, kto lubi Laytona i chce czegoś mniej rozpoznawalnego.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4.5,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": 90,
   "cena_10": 130,
   "cena_20": 240,
   "ml_dostepne": "",
   "podobne": "p75, p89, p95",
   "zdjecie_url": "/img/produkty/p76-800.webp",
   "kolejnosc": 76,
   "okazja": "Kolacja, wyjście, okazje formalne",
   "bestseller": "",
   "klimat": "slodki, drzewny",
   "renoma": 2
  },
  {
   "id": "p77",
   "aktywny": "TAK",
   "marka": "Parfums de Marly",
   "nazwa": "Sedley",
   "rodzina": "drzewna",
   "profil": "męski",
   "nuty_glowy": "Bergamotka, mięta kędzierzawa, pomarańcza",
   "nuty_serca": "Geranium, lawandyna, sosna",
   "nuty_bazy": "Sandałowiec, ambroksan, białe piżma",
   "opis": "Mięta z cytrusami i mydlana czystość, czyli zapach dobrze prowadzonego barber shopu. Lekki i uporządkowany, nikomu nie przeszkodzi w małym pomieszczeniu, dlatego świetnie pracuje w biurze. Na ciepłe miesiące i na dni, w których masz spotkanie i chcesz po prostu dobrze wyglądać.",
   "sezon": "wiosna, lato",
   "pora": "dzień",
   "trwalosc": 2.5,
   "projekcja": 2.5,
   "intensywnosc": 1,
   "cena_5": 80,
   "cena_10": 120,
   "cena_20": 160,
   "ml_dostepne": "",
   "podobne": "p14, p06, p64",
   "zdjecie_url": "/img/produkty/p77-800.webp",
   "kolejnosc": 77,
   "okazja": "Biuro, codzienność, spotkania w dzień",
   "bestseller": "",
   "klimat": "cytrusowy, aromatyczny",
   "renoma": 2
  },
  {
   "id": "p78",
   "aktywny": "TAK",
   "marka": "Amouage",
   "nazwa": "Guidance",
   "rodzina": "kwiatowa",
   "profil": "unisex",
   "nuty_glowy": "Gruszka, kadzidło, orzech laskowy",
   "nuty_serca": "Szafran, róża, jaśmin sambac, osmanthus",
   "nuty_bazy": "Labdanum (cistus), sandałowiec, akigalawood, ambra szara, wanilia",
   "opis": "Gruszka z orzechem laskowym brzmi prawie deserowo, dopóki nie wejdzie kadzidło i nie zrobi z tego czegoś poważnego. Serce jest kwiatowe i korzenne, a koniec ciepły, żywiczny i waniliowy, z tych, które zostają na ubraniu kilka dni. Dwadzieścia pięć procent olejków oznacza jedno psiknięcie na cały dzień. Amouage dostał za ten zapach dwie europejskie nagrody w 2024 roku, co w perfumerii niszowej zdarza się rzadko.",
   "sezon": "jesień, zima",
   "pora": "uniwersalna",
   "trwalosc": 5,
   "projekcja": 4.5,
   "intensywnosc": 3,
   "cena_5": 130,
   "cena_10": 220,
   "cena_20": 400,
   "ml_dostepne": "",
   "podobne": "p83, p42, p88",
   "zdjecie_url": "/img/produkty/p78-800.webp",
   "kolejnosc": 78,
   "okazja": "Kolacja, event, okazje specjalne, codzienność premium",
   "bestseller": "",
   "klimat": "kwiatowy, orientalny",
   "renoma": 2
  },
  {
   "id": "p79",
   "aktywny": "TAK",
   "marka": "Creed",
   "nazwa": "Delphinus",
   "rodzina": "drzewna",
   "profil": "unisex",
   "nuty_glowy": "Pieprz czarny, kadzidło, migdał, pieprz różowy",
   "nuty_serca": "Heliotrop, orchidea, masło irysowe",
   "nuty_bazy": "Paczula, tonka, amberwood, akord skórzany, wanilia Bourbon z Madagaskaru",
   "opis": "Creed sprzedaje to jako zapach drzewny. Ludzie, którzy go noszą, mówią o migdale i wanilii, i mają rację: jest tu gęsty, kremowy marcepan z pieprzem i pudrowym irysem. Trzyma powyżej ośmiu godzin, przy czym bardzo łatwo przesadzić, bo po dwóch psiknięciach ty przestajesz go czuć, a inni nie. Dla kogoś, kto lubi słodkie zapachy i chce mieć je w butelce z napisem Creed.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4.5,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": 130,
   "cena_10": 230,
   "cena_20": 400,
   "ml_dostepne": "",
   "podobne": "p76, p10",
   "zdjecie_url": "/img/produkty/p79-800.webp",
   "kolejnosc": 79,
   "okazja": "Kolacja, wyjście, okazje specjalne",
   "bestseller": "",
   "klimat": "slodki, drzewny",
   "renoma": 2
  },
  {
   "id": "p80",
   "aktywny": "TAK",
   "marka": "Essential Parfums",
   "nazwa": "Velvet Iris",
   "rodzina": "drzewna",
   "profil": "unisex",
   "nuty_glowy": "Esencja liścia kurkumy, różowy pieprz, liść buchu",
   "nuty_serca": "Konkret irysowy, galbanum, mastyks, akord zamszu Saffiano",
   "nuty_bazy": "Labdanum, kremowy akord drzewny, drzewo sandałowe",
   "opis": "Irys wytrawny i cielesny, bez pudru i bez kwiatowej słodyczy. Zielony, lekko korzenny start przechodzi w zamsz, a kończy się suchym, kremowym drewnem. To zapach na bliski dystans, który pracuje w rozmowie i przy stole. Dla kogoś, kto ma już w szufladzie cytrusy i słodycze i chce czegoś, czego nikt nie rozpozna.",
   "sezon": "wiosna, jesień",
   "pora": "uniwersalna",
   "trwalosc": 3,
   "projekcja": 2.5,
   "intensywnosc": 1,
   "cena_5": "",
   "cena_10": 80,
   "cena_20": 150,
   "ml_dostepne": "",
   "podobne": "p95, p35, p100",
   "zdjecie_url": "/img/produkty/p80-800.webp",
   "kolejnosc": 80,
   "okazja": "Biuro, spotkania, codzienność premium",
   "bestseller": "",
   "klimat": "kwiatowy, drzewny",
   "renoma": 1
  },
  {
   "id": "p81",
   "aktywny": "TAK",
   "marka": "Essential Parfums",
   "nazwa": "Ambre Latte",
   "rodzina": "gourmand",
   "profil": "unisex",
   "nuty_glowy": "Akord mleka migdałowego, pianka mleczna, prażona fasolka tonka",
   "nuty_serca": "Karmel dulce de leche, wanilia, benzoina, białe piżmo",
   "nuty_bazy": "Ambrofix, Georgywood, Akigalawood, biały sandałowiec",
   "opis": "Zimowe cappuccino: mleko migdałowe, karmel i prażona tonka, podane ciepło i leniwie. Pomysł jest prosty, a efekt działa dokładnie tam, gdzie powinien, czyli przy stole i w kołnierzu kurtki. Pod spodem siedzą drzewne molekuły, które trzymają słodycz w ryzach i rozciągają ją na wiele godzin. Premiera z tego roku, więc mogłeś nie doświadczyć tego wokół ciebie.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4,
   "projekcja": 3.5,
   "intensywnosc": 2,
   "cena_5": "",
   "cena_10": 80,
   "cena_20": 150,
   "ml_dostepne": "",
   "podobne": "p42, p27, p10",
   "zdjecie_url": "/img/produkty/p81-800.webp",
   "kolejnosc": 81,
   "okazja": "Randka, kawiarnia, chłodne wieczory",
   "bestseller": "",
   "klimat": "slodki",
   "renoma": 1
  },
  {
   "id": "p82",
   "aktywny": "TAK",
   "marka": "Ormonde Jayne",
   "nazwa": "Kashmir",
   "rodzina": "drzewna",
   "profil": "unisex",
   "nuty_glowy": "Bergamotka, kardamon, nasiona kolendry, szafran, różowy pieprz",
   "nuty_serca": "Jaśmin, irys, róża, niebieski mak, jodła himalajska",
   "nuty_bazy": "Cedr himalajski (deodar), sandałowiec, cashmeran, benzoina, wanilia, paczula, kadzidło, mirra, piżmo",
   "opis": "Zapach jak ciepły szal narzucony na ramiona pod koniec października. Korzenny i cytrusowy początek, miękkie kwiatowe serce, a na końcu gęste, żywiczne drewno z kadzidłem. Nosi się go cały dzień bez dopsiknięć. Ślad w powietrzu jest wyczuwalny i nikogo nie przytłacza. Ormonde Jayne to marka, której w Polsce praktycznie nie widać, więc ryzyko spotkania kogoś w tym samym zapachu jest bliskie zeru. Świetnie pachnie na kobiecie jak i na mężczyźnie.",
   "sezon": "jesień, zima",
   "pora": "uniwersalna",
   "trwalosc": 4.5,
   "projekcja": 3.5,
   "intensywnosc": 2,
   "cena_5": 100,
   "cena_10": 170,
   "cena_20": 310,
   "ml_dostepne": "",
   "podobne": "p20, p83, p95",
   "zdjecie_url": "/img/produkty/p82-800.webp",
   "kolejnosc": 82,
   "okazja": "Codzienność premium, kolacja, spotkania",
   "bestseller": "",
   "klimat": "drzewny, orientalny",
   "renoma": 1
  },
  {
   "id": "p83",
   "aktywny": "TAK",
   "marka": "Maison Francis Kurkdjian",
   "nazwa": "Oud Satin Mood",
   "rodzina": "kwiatowa",
   "profil": "unisex",
   "nuty_glowy": "Fiołek",
   "nuty_serca": "Oud, róża damasceńska",
   "nuty_bazy": "Akord waniliowo-ambrowy, benzoina",
   "opis": "Róża i wanilia na ciemnym drewnie, tak gładko, że słowo satin w nazwie nie jest przesadą. Od pierwszej sekundy jest ciepło, bez żadnej surowej fazy, a fiołek dorzuca odrobinę pudru. Zapach układa się wokół ciebie aurą, więc nikomu nie przeszkodzi w restauracji.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4,
   "projekcja": 4.5,
   "intensywnosc": 3,
   "cena_5": 150,
   "cena_10": 280,
   "cena_20": 520,
   "ml_dostepne": "",
   "podobne": "p43, p30, p49",
   "zdjecie_url": "",
   "kolejnosc": 83,
   "okazja": "Randka, kolacja, elegancki wieczór",
   "bestseller": "",
   "klimat": "orientalny, kwiatowy",
   "renoma": 3
  },
  {
   "id": "p84",
   "aktywny": "TAK",
   "marka": "Nishane",
   "nazwa": "Wūlóng Chá",
   "rodzina": "cytrusowa",
   "profil": "unisex",
   "nuty_glowy": "Bergamotka, pomarańcza, litsea cubeba, mandarynka",
   "nuty_serca": "Herbata oolong, gałka muszkatołowa",
   "nuty_bazy": "Piżmo, figa",
   "opis": "Cytrusy z herbatą oolong, czyli świeżość, która nie wyparowuje po godzinie. Pachnie jak zimna herbata z cytryną pita w upał, czysto i bez grama słodyczy. Cała sztuczka siedzi w tym, jak mocno jest skoncentrowany: dostajesz lekkie odczucie przy trwałości, jakiej letnie zapachy zwykle nie mają. Jeśli męczy cię to, że twoje świeże perfumy giną po dwóch godzinach, to jest rozwiązanie.",
   "sezon": "wiosna, lato",
   "pora": "dzień",
   "trwalosc": 4,
   "projekcja": 3,
   "intensywnosc": 2,
   "cena_5": "",
   "cena_10": 120,
   "cena_20": 210,
   "ml_dostepne": "",
   "podobne": "p01, p14, p07, p97",
   "zdjecie_url": "/img/produkty/p84-800.webp",
   "kolejnosc": 84,
   "okazja": "Biuro, upały, codzienność, wakacje",
   "bestseller": "",
   "klimat": "cytrusowy",
   "renoma": 2
  },
  {
   "id": "p85",
   "aktywny": "TAK",
   "marka": "Sospiro",
   "nazwa": "Basso",
   "rodzina": "drzewna",
   "profil": "unisex",
   "nuty_glowy": "Grejpfrut, głóg, galbanum",
   "nuty_serca": "Goździk, labdanum, nasiona selera, czarny i różowy pieprz, gałka muszkatołowa",
   "nuty_bazy": "Sandałowiec, wetyweria, drzewo gwajakowe, mech dębowy, cedr",
   "opis": "Grejpfrut, cytryna i zieleń na wejściu, a pod nimi ciemne, pieprzne drewno oraz delikatna słodycz dla równowagi. Brzmi poważnie i trochę surowo, jak dobrze skrojony garnitur w kolorze węgla, dlatego dobrze wypada przy ludziach starszych od ciebie. Bardziej złożona i wzmocniona wersja klasyka od Hermesa.",
   "sezon": "wiosna, lato, jesień",
   "pora": "uniwersalna",
   "trwalosc": 4,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": 70,
   "cena_10": 130,
   "cena_20": 220,
   "ml_dostepne": "",
   "podobne": "p45, p65, p15",
   "zdjecie_url": "/img/produkty/p85-800.webp",
   "kolejnosc": 85,
   "okazja": "Biuro, spotkania biznesowe, wieczorne wyjścia",
   "bestseller": "",
   "klimat": "drzewny, aromatyczny",
   "renoma": 1
  },
  {
   "id": "p86",
   "aktywny": "TAK",
   "marka": "Tom Ford",
   "nazwa": "Velvet Orchid",
   "rodzina": "kwiatowa",
   "profil": "damski",
   "nuty_glowy": "Bergamotka włoska, mandarynka, absolut rumowy, miód",
   "nuty_serca": "Orchidea, jaśmin absolut, kwiat pomarańczy, róża turecka, heliotrop, magnolia, narcyz",
   "nuty_bazy": "Balsam peruwiański, mirra, labdanum, sandałowiec, zamsz, wanilia, tonka",
   "opis": "Cieplejsza, bardziej miodowa siostra Black Orchid. Rumowo-cytrusowy start, gęsty bukiet kwiatów, a po kilku godzinach wanilia z zamszem. Trzyma osiem do dziesięciu godzin i wyraźnie go czuć, więc dwa psiknięcia to norma. Idealne na zimny wieczór, najczęściej wybierany przez kobiety.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4.5,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": "",
   "cena_10": 90,
   "cena_20": 160,
   "ml_dostepne": "",
   "podobne": "p87, p83, p98",
   "zdjecie_url": "/img/produkty/p86-800.webp",
   "kolejnosc": 86,
   "okazja": "Randka, kolacja, okazje formalne",
   "bestseller": "",
   "klimat": "kwiatowy, slodki",
   "renoma": 2
  },
  {
   "id": "p87",
   "aktywny": "TAK",
   "marka": "Tom Ford",
   "nazwa": "Black Orchid",
   "rodzina": "ambrowa",
   "profil": "damski",
   "nuty_glowy": "Czarna trufla, ylang-ylang, bergamotka, gorzka pomarańcza",
   "nuty_serca": "Czarna orchidea, czarna śliwka, absolut rumowy",
   "nuty_bazy": "Paczula, wanilia, meksykańska czekolada, kadzidło, sandałowiec, wetyweria",
   "opis": "Od dwudziestu lat dzieli ludzi i od dwudziestu lat sprzedaje się świetnie. Ciemna śliwka, trufla i czekolada brzmią jak wnętrze bardzo drogiego i bardzo ciemnego klubu. Ludzie wiedzą, że wszedłeś do budynku, więc dwa psiknięcia są maksimum, a na tkaninie zapach zostaje nawet półtora dnia. Weź go, jeśli chcesz, żeby cię zapamiętali, i odpuść, jeśli zależy ci, żeby spodobać się wszystkim.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4.5,
   "projekcja": 5,
   "intensywnosc": 3,
   "cena_5": "",
   "cena_10": 90,
   "cena_20": 160,
   "ml_dostepne": "",
   "podobne": "p86, p29",
   "zdjecie_url": "/img/produkty/p87-800.webp",
   "kolejnosc": 87,
   "okazja": "Kolacja, drinki, teatr, wyjście (nie do biura)",
   "bestseller": "",
   "klimat": "orientalny, kwiatowy, slodki",
   "renoma": 3
  },
  {
   "id": "p88",
   "aktywny": "TAK",
   "marka": "Tom Ford",
   "nazwa": "Oud Voyager",
   "rodzina": "drzewna",
   "profil": "damski",
   "nuty_glowy": "Absolut geranium, czerwona piwonia",
   "nuty_serca": "Osmanthus, oud",
   "nuty_bazy": "Floral Oud Tri-Distillate, cypriol",
   "opis": "Oud podany kwiatowo, co na rynku zdarza się rzadko. Geranium z czerwoną piwonią dają jasny, prawie różowy początek, a pod spodem siedzi ciemne, wilgotne drewno z dymem. Mimo wszystko jest to uniwersalne pachnidło dla kobiet i świetnie nada się na bezpieczny prezent. Premiera jest z tego roku, więc nikt wokół go nie zna, pytania o nazwę przychodzą szybko, a na chłodne miesiące wystarczą dwa psiknięcia w dzień.",
   "sezon": "wiosna, jesień, zima",
   "pora": "uniwersalna",
   "trwalosc": 4,
   "projekcja": 3.5,
   "intensywnosc": 2,
   "cena_5": 150,
   "cena_10": 230,
   "cena_20": 420,
   "ml_dostepne": "",
   "podobne": "p83, p42, p92",
   "zdjecie_url": "/img/produkty/p88-800.webp",
   "kolejnosc": 88,
   "okazja": "Wyjście, kolacja, okazje formalne",
   "bestseller": "",
   "klimat": "orientalny, kwiatowy",
   "renoma": 1
  },
  {
   "id": "p89",
   "aktywny": "TAK",
   "marka": "Kilian",
   "nazwa": "Angels' Share",
   "rodzina": "gourmand",
   "profil": "unisex",
   "nuty_glowy": "Esencja koniaku",
   "nuty_serca": "Esencja cynamonu, absolut tonki",
   "nuty_bazy": "Sandałowiec, praliny, wanilia",
   "opis": "W butelce jest prawdziwa esencja koniaku i dlatego płyn ma kolor whisky. Pachnie jak kieliszek postawiony obok ciasta z cynamonem: alkoholowo, ciepło i słodko, bez przechodzenia w cukier. Trzyma od dziewięciu do trzynastu godzin, więc nawet dziesięć mililitrów wystarcza na długo. Na jesienne i zimowe wieczory, i na sytuacje, w których chcesz, żeby ktoś podszedł bliżej. Perfumy z duszą dla kogoś, kto chce się wyróżnić.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 5,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p10, p35, p24",
   "zdjecie_url": "",
   "kolejnosc": 89,
   "okazja": "Randka, wyjście, klub, chłodne wieczory",
   "bestseller": "",
   "klimat": "slodki",
   "renoma": 3
  },
  {
   "id": "p90",
   "aktywny": "TAK",
   "marka": "Kilian",
   "nazwa": "Angels' Share On The Rocks",
   "rodzina": "gourmand",
   "profil": "unisex",
   "nuty_glowy": "Akord On The Rocks (bergamotka, grejpfrut, aldehydy), gorzka pomarańcza",
   "nuty_serca": "Koniak, cynamon, rezyna mirry",
   "nuty_bazy": "Absolut tonki, dąb",
   "opis": "Ten sam koniak, tylko polany czymś zimnym. Gorzka pomarańcza i bergamotka kładą na ciepłym rdzeniu chłodną, musującą warstwę, dzięki czemu całość jest lżejsza i mniej słodka od oryginału. Trzyma około sześciu do siedmiu godzin, czyli zauważalnie krócej. Jeśli kupujesz pierwszy flakon z tej linii, weź klasyczny Angels' Share. Ten bierz wtedy, gdy masz już oryginał i chcesz wersję na cieplejsze dni.",
   "sezon": "wiosna, jesień",
   "pora": "uniwersalna",
   "trwalosc": 3.5,
   "projekcja": 3,
   "intensywnosc": 2,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p89, p09",
   "zdjecie_url": "",
   "kolejnosc": 90,
   "okazja": "Codzienność, spotkania, cieplejsze wieczory",
   "bestseller": "",
   "klimat": "slodki, cytrusowy",
   "renoma": 2
  },
  {
   "id": "p91",
   "aktywny": "TAK",
   "marka": "Kilian",
   "nazwa": "Roses On Ice",
   "rodzina": "świeża",
   "profil": "damski",
   "nuty_glowy": "Ogórek",
   "nuty_serca": "Jagody jałowca, róża",
   "nuty_bazy": "Sandałowiec, piżmo",
   "opis": "Gin z tonikiem przełożony na perfumy, z ogórkiem i jałowcem na pierwszym planie. Chłód naprawdę się tu czuje. Róża jest nowoczesna i wytrawna, więc nie przypomina ani kwiaciarni, ani cukierka. Lekki i casualowy, lepiej wypada w dzień, wieczorem zaś piękny, alkoholowy akcent może się gubić. Na wiosnę i lato, dla kobiety, która chce świeżości z pomysłem.",
   "sezon": "wiosna, lato",
   "pora": "dzień",
   "trwalosc": 3.5,
   "projekcja": 2.5,
   "intensywnosc": 1,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p47, p23, p97",
   "zdjecie_url": "",
   "kolejnosc": 91,
   "okazja": "Codzienność, casual, upały",
   "bestseller": "",
   "klimat": "kwiatowy, aromatyczny",
   "renoma": 2
  },
  {
   "id": "p92",
   "aktywny": "TAK",
   "marka": "Kilian",
   "nazwa": "Woman in Gold",
   "rodzina": "kwiatowa",
   "profil": "damski",
   "nuty_glowy": "Bergamotka, różowy pieprz",
   "nuty_serca": "Róża, geranium",
   "nuty_bazy": "Tonka, akigalawood",
   "opis": "Inspiracją jest złoty portret Klimta i to naprawdę się słyszy: cytrusowy błysk na wejściu, ciepła, prawie piankowa baza na końcu. Róża jest nowoczesna i czysta, a tonka dodaje ciepła, po którym ludzie podchodzą bliżej. Nada się to od biura po kolację i spokojnie wytrzymuje pełny dzień pracy. Przede wszystkim na wiosnę oraz jesień.",
   "sezon": "wiosna, jesień, zima",
   "pora": "uniwersalna",
   "trwalosc": 4,
   "projekcja": 3,
   "intensywnosc": 2,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p93, p83, p73",
   "zdjecie_url": "",
   "kolejnosc": 92,
   "okazja": "Biuro, codzienność, kolacja, eleganckie wyjścia",
   "bestseller": "",
   "klimat": "kwiatowy, slodki",
   "renoma": 1
  },
  {
   "id": "p93",
   "aktywny": "TAK",
   "marka": "Kilian",
   "nazwa": "Good girl gone Bad",
   "rodzina": "kwiatowa",
   "profil": "damski",
   "nuty_glowy": "Kwiat pomarańczy, absolut róży majowej",
   "nuty_serca": "Absolut osmanthusa, absolut tuberozy, jaśmin",
   "nuty_bazy": "Narcyz",
   "opis": "Bukiet białych kwiatów z morelowym rozbłyskiem osmanthusa, podany gęsto i bez skromności. Pachnie drogo w sposób, który ludzie wyczuwają natychmiast, nawet jeśli nie umieją nazwać ani jednej nuty. Trzyma osiem do dziesięciu godzin. Zapach uniwersalny, lecz wiosną i latem wypadniesz w nim najlepiej. Zapach jednoznacznie kobiecy.",
   "sezon": "wiosna, lato, jesień",
   "pora": "uniwersalna",
   "trwalosc": 4,
   "projekcja": 3,
   "intensywnosc": 2,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p86, p92",
   "zdjecie_url": "",
   "kolejnosc": 93,
   "okazja": "Codzienność, spotkania, kolacja, prezent",
   "bestseller": "",
   "klimat": "kwiatowy",
   "renoma": 3
  },
  {
   "id": "p94",
   "aktywny": "TAK",
   "marka": "Kilian",
   "nazwa": "Sparkling Royal",
   "rodzina": "świeża",
   "profil": "damski",
   "nuty_glowy": "Mięta, cytryna",
   "nuty_serca": "Róża, czarna porzeczka (akord Kir Royal)",
   "nuty_bazy": "Prażona fasolka tonka, delikatne piżmo",
   "opis": "Kir Royal przełożony na zapach: czarna porzeczka z różą, a nad tym mięta i cytryna, które robią efekt bąbelków. Lekki i elegancki, nosi się go od brunchu po wieczorne wyjście. Kilian podaje ponad pięć godzin trwałości, co przy takiej konstrukcji jest wartością uczciwą, ale nie licz na chmurę w pomieszczeniu. Premiera z sierpnia, więc swoją popularność dopiero zyskuje. Idealny dla kobiet z klasą.",
   "sezon": "wiosna, lato",
   "pora": "uniwersalna",
   "trwalosc": 3.5,
   "projekcja": 2.5,
   "intensywnosc": 1,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p47, p91, p07",
   "zdjecie_url": "",
   "kolejnosc": 94,
   "okazja": "Brunch, spotkania w dzień, wieczorne celebracje",
   "bestseller": "",
   "klimat": "kwiatowy, cytrusowy",
   "renoma": 1
  },
  {
   "id": "p95",
   "aktywny": "TAK",
   "marka": "Atkinsons",
   "nazwa": "Shine Despite Everything",
   "rodzina": "drzewna",
   "profil": "unisex",
   "nuty_glowy": "Kadzidło somalijskie, nasiona kurkumy, ziele angielskie",
   "nuty_serca": "Irys, karmel, Ambrofix, akord różany",
   "nuty_bazy": "Kumaryna, wanilia z Madagaskaru, Akigalawood",
   "opis": "Karmel i irys na dymnym kadzidle, czyli słodycz, która nie przypomina deseru. Początek jest korzenny i trochę ostry, lecz szybko robi się pudrowo i ciepło z mocnymi akcentami wanilii i drewna. Parfum Intense trzyma dziewięć do dziesięciu godzin, a na ubraniu zostaje po kilka dni. Dobry wybór na formalny zimowy wieczór dla kogoś, kto chce orientalnego pazura i jednocześnie boi się oudu. Świetnie sprawdzi się dla kobiety jak i dla mężczyzny.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4.5,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p100, p78, p10",
   "zdjecie_url": "/img/produkty/p95-800.webp",
   "kolejnosc": 95,
   "okazja": "Okazje formalne, kolacja, event",
   "bestseller": "",
   "klimat": "orientalny, slodki",
   "renoma": 1
  },
  {
   "id": "p96",
   "aktywny": "TAK",
   "marka": "Atkinsons",
   "nazwa": "Oud Save the King",
   "rodzina": "orientalna",
   "profil": "męski",
   "nuty_glowy": "Akord bergamotki Earl Grey (herbata, bergamotka)",
   "nuty_serca": "Irys, zamsz",
   "nuty_bazy": "Sandałowiec, akord oudowy (agar)",
   "opis": "Herbata Earl Grey z bergamotką spotyka zamsz i subtelny oud. Efekt jest zaskakująco kulturalny, bo oud jest tu lekki i wygładzony, przez co zapach brzmi jak angielski klub, a nie arabski bazar. Trzyma bardzo długo oraz potrafi wypełnić pomieszczenie. Dobre wejście w oud dla kogoś, kto boi się przesady, zwłaszcza do garnituru.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4.5,
   "projekcja": 3.5,
   "intensywnosc": 2,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p30, p16, p54",
   "zdjecie_url": "/img/produkty/p96-800.webp",
   "kolejnosc": 96,
   "okazja": "Garnitur, okazje formalne, kolacja",
   "bestseller": "",
   "klimat": "orientalny, drzewny",
   "renoma": 2
  },
  {
   "id": "p97",
   "aktywny": "TAK",
   "marka": "Atkinsons",
   "nazwa": "Mint & Tonic",
   "rodzina": "cytrusowa",
   "profil": "unisex",
   "nuty_glowy": "Limonka, grejpfrut, mięta, mandarynka",
   "nuty_serca": "Imbir, geranium",
   "nuty_bazy": "Cedr, wetyweria, piżmo",
   "opis": "Mięta z limonką i grejpfrutem, czyli zapach zimnego drinka w upalny dzień. Lekki, zielony, bez grama słodyczy i bez ciężaru. Trzyma trzy do pięciu godzin i to cała prawda o nim, więc traktuj go jako zapach do odświeżania w ciągu dnia. Na lato i na biuro, kiedy chcesz pachnieć czysto i nic ponad to.",
   "sezon": "wiosna, lato",
   "pora": "dzień",
   "trwalosc": 2,
   "projekcja": 2,
   "intensywnosc": 1,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p51, p84",
   "zdjecie_url": "/img/produkty/p97-800.webp",
   "kolejnosc": 97,
   "okazja": "Biuro, codzienność, upały",
   "bestseller": "",
   "klimat": "cytrusowy, aromatyczny",
   "renoma": 1
  },
  {
   "id": "p98",
   "aktywny": "TAK",
   "marka": "Bohoboco",
   "nazwa": "Wet Cherry Liquor",
   "rodzina": "gourmand",
   "profil": "unisex",
   "nuty_glowy": "Wiśnia, nuty likierowe",
   "nuty_serca": "Syrop czereśniowy, truskawka, karmel, róża turecka",
   "nuty_bazy": "Sandałowiec, wetyweria, fasolka tonka, wanilia",
   "opis": "Dojrzała wiśnia podlana likierem, z karmelem i różą w tle. Bohoboco zrobiło tu coś, co wielu uważa za dojrzalszą wersję Lost Cherry: mniej cukierka, więcej wytrawności i wyraźne drewno na końcu. Słodko, ale bez lepkości, z trwałością i śladem, które realnie pracują. Polska marka niszowa, co bywa mocnym argumentem dla kogoś, kto szuka czegoś poza oczywistymi nazwami. Idealny dla kobiety jak i mężczyzny.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 4,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p34, p27",
   "zdjecie_url": "",
   "kolejnosc": 98,
   "okazja": "Randka, wyjście, chłodne wieczory",
   "bestseller": "",
   "klimat": "slodki, cytrusowy",
   "renoma": 1
  },
  {
   "id": "p99",
   "aktywny": "TAK",
   "marka": "Sisley",
   "nazwa": "Soir d'Orient",
   "rodzina": "drzewna",
   "profil": "damski",
   "nuty_glowy": "Cytryna włoska, galbanum irańskie",
   "nuty_serca": "Akord szafranowy, czarny pieprz z Madagaskaru, absolut róży tureckiej, geranium egipskie",
   "nuty_bazy": "Akord sandałowy, kadzidło somalijskie, paczula indonezyjska, nuty skórzane",
   "opis": "Szafran, róża i kadzidło, czyli klasyczny orientalny układ zrobiony przez francuski dom kosmetyczny. Otwarcie wypełnia pomieszczenie i brzmi bardzo drogo, a po dwóch godzinach zapach robi się intymny i zostaje blisko skóry. To zapach do eleganckiej garsonki i na wieczory zaplanowane z góry, nie na obiad w mieście. Chłodne miesiące i wieczór, dla kogoś, kto chce brzmieć dostojnie.",
   "sezon": "jesień, zima",
   "pora": "wieczór",
   "trwalosc": 3.5,
   "projekcja": 4,
   "intensywnosc": 3,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p27, p83, p93",
   "zdjecie_url": "",
   "kolejnosc": 99,
   "okazja": "Okazje formalne, przyjęcia, wieczorne wyjścia",
   "bestseller": "",
   "klimat": "orientalny, aromatyczny",
   "renoma": 1
  },
  {
   "id": "p100",
   "aktywny": "TAK",
   "marka": "Bohoboco",
   "nazwa": "Vanilla Black Pepper",
   "rodzina": "ambrowa",
   "profil": "unisex",
   "nuty_glowy": "Kwiat pomarańczy, wierzbówka kiprzyca",
   "nuty_serca": "Heliotrop, kadzidło (olibanum), róża, gałka muszkatołowa",
   "nuty_bazy": "Czarny pieprz, wanilia, cedr, białe piżmo",
   "opis": "Wanilia dla kogoś, kto nie chce pachnieć deserem. Czarny pieprz i kadzidło zabierają jej słodycz, a kwiatowe serce robi z całości rzecz raczej elegancką. Zapach siedzi bardzo blisko skóry: w biurze ani w windzie nikomu nie przeszkodzi, ale trzeba podejść, żeby go wyczuć. Flagowiec polskiego Bohoboco i jeden z niewielu zapachów z tej listy, które naprawdę nosi się przez cały rok. Idealny dla kobiety jak i mężczyzny.",
   "sezon": "wiosna, lato, jesień, zima",
   "pora": "uniwersalna",
   "trwalosc": 4,
   "projekcja": 3.5,
   "intensywnosc": 2,
   "cena_5": 140,
   "cena_10": 200,
   "cena_20": 370,
   "ml_dostepne": "",
   "podobne": "p95, p35, p31, p80",
   "zdjecie_url": "",
   "kolejnosc": 100,
   "okazja": "Biuro, codzienność, kolacja",
   "bestseller": "",
   "klimat": "slodki, aromatyczny",
   "renoma": 1
  }
 ],
 "quiz": {
  "p01": [
   "TAK",
   "cytrusowy, aromatyczny",
   3
  ],
  "p02": [
   "",
   "cytrusowy",
   2
  ],
  "p03": [
   "",
   "cytrusowy",
   2
  ],
  "p04": [
   "",
   "orientalny, slodki",
   2
  ],
  "p05": [
   "TAK",
   "orientalny, kwiatowy",
   3
  ],
  "p06": [
   "",
   "cytrusowy, aromatyczny",
   3
  ],
  "p07": [
   "",
   "cytrusowy",
   2
  ],
  "p08": [
   "TAK",
   "cytrusowy, slodki",
   3
  ],
  "p09": [
   "",
   "cytrusowy, aromatyczny",
   2
  ],
  "p10": [
   "TAK",
   "slodki, aromatyczny",
   3
  ],
  "p11": [
   "TAK",
   "cytrusowy, drzewny",
   3
  ],
  "p12": [
   "",
   "cytrusowy, drzewny",
   2
  ],
  "p13": [
   "",
   "cytrusowy, slodki",
   1
  ],
  "p14": [
   "",
   "cytrusowy",
   2
  ],
  "p15": [
   "",
   "cytrusowy, orientalny",
   2
  ],
  "p16": [
   "",
   "kwiatowy, drzewny",
   3
  ],
  "p17": [
   "",
   "orientalny, aromatyczny",
   2
  ],
  "p18": [
   "",
   "orientalny, kwiatowy",
   2
  ],
  "p19": [
   "",
   "orientalny, aromatyczny",
   3
  ],
  "p20": [
   "",
   "aromatyczny, orientalny",
   2
  ],
  "p21": [
   "",
   "cytrusowy",
   2
  ],
  "p22": [
   "",
   "cytrusowy, drzewny",
   2
  ],
  "p23": [
   "",
   "cytrusowy",
   2
  ],
  "p24": [
   "",
   "slodki",
   2
  ],
  "p25": [
   "",
   "aromatyczny, orientalny",
   3
  ],
  "p26": [
   "",
   "slodki",
   1
  ],
  "p27": [
   "",
   "slodki, kwiatowy",
   2
  ],
  "p28": [
   "",
   "orientalny, slodki",
   2
  ],
  "p29": [
   "TAK",
   "slodki",
   3
  ],
  "p30": [
   "",
   "orientalny, slodki",
   2
  ],
  "p31": [
   "",
   "aromatyczny, drzewny",
   2
  ],
  "p32": [
   "",
   "drzewny",
   3
  ],
  "p33": [
   "",
   "slodki, aromatyczny",
   2
  ],
  "p34": [
   "",
   "slodki, cytrusowy",
   3
  ],
  "p35": [
   "TAK",
   "slodki, aromatyczny",
   3
  ],
  "p36": [
   "",
   "drzewny, aromatyczny",
   2
  ],
  "p37": [
   "",
   "drzewny, orientalny",
   3
  ],
  "p38": [
   "",
   "drzewny, orientalny",
   2
  ],
  "p39": [
   "",
   "drzewny",
   2
  ],
  "p40": [
   "TAK",
   "cytrusowy, slodki",
   3
  ],
  "p41": [
   "",
   "orientalny, cytrusowy",
   2
  ],
  "p42": [
   "",
   "orientalny, slodki",
   3
  ],
  "p43": [
   "TAK",
   "slodki, orientalny",
   3
  ],
  "p44": [
   "TAK",
   "drzewny, aromatyczny",
   3
  ],
  "p45": [
   "TAK",
   "cytrusowy, drzewny",
   3
  ],
  "p46": [
   "",
   "cytrusowy",
   1
  ],
  "p47": [
   "",
   "cytrusowy, kwiatowy",
   1
  ],
  "p48": [
   "",
   "cytrusowy, kwiatowy",
   1
  ],
  "p49": [
   "",
   "orientalny, aromatyczny",
   1
  ],
  "p50": [
   "",
   "aromatyczny, cytrusowy",
   1
  ],
  "p51": [
   "",
   "cytrusowy",
   2
  ],
  "p52": [
   "",
   "aromatyczny, drzewny",
   2
  ],
  "p53": [
   "TAK",
   "aromatyczny, drzewny",
   3
  ],
  "p54": [
   "",
   "drzewny, aromatyczny",
   2
  ],
  "p55": [
   "",
   "aromatyczny, slodki",
   2
  ],
  "p56": [
   "",
   "cytrusowy, aromatyczny",
   1
  ],
  "p59": [
   "",
   "aromatyczny, drzewny",
   2
  ],
  "p60": [
   "",
   "orientalny, slodki",
   2
  ],
  "p61": [
   "",
   "drzewny",
   2
  ],
  "p62": [
   "",
   "cytrusowy, drzewny",
   2
  ],
  "p63": [
   "",
   "aromatyczny, cytrusowy",
   2
  ],
  "p64": [
   "",
   "kwiatowy, drzewny",
   2
  ],
  "p65": [
   "",
   "drzewny, cytrusowy",
   3
  ],
  "p66": [
   "",
   "slodki, aromatyczny",
   2
  ],
  "p67": [
   "",
   "cytrusowy",
   2
  ],
  "p68": [
   "",
   "slodki, aromatyczny",
   2
  ],
  "p69": [
   "",
   "cytrusowy",
   2
  ],
  "p70": [
   "",
   "slodki, drzewny",
   2
  ],
  "p71": [
   "",
   "slodki, aromatyczny",
   2
  ],
  "p72": [
   "",
   "drzewny, aromatyczny",
   2
  ],
  "p73": [
   "",
   "cytrusowy, kwiatowy",
   1
  ],
  "p74": [
   "",
   "kwiatowy, orientalny",
   2
  ],
  "p75": [
   "",
   "slodki, aromatyczny",
   3
  ],
  "p76": [
   "",
   "slodki, drzewny",
   2
  ],
  "p77": [
   "",
   "cytrusowy, aromatyczny",
   2
  ],
  "p78": [
   "",
   "kwiatowy, orientalny",
   2
  ],
  "p79": [
   "",
   "slodki, drzewny",
   2
  ],
  "p80": [
   "",
   "kwiatowy, drzewny",
   1
  ],
  "p81": [
   "",
   "slodki",
   1
  ],
  "p82": [
   "",
   "drzewny, orientalny",
   1
  ],
  "p83": [
   "",
   "orientalny, kwiatowy",
   3
  ],
  "p84": [
   "",
   "cytrusowy",
   2
  ],
  "p85": [
   "",
   "drzewny, aromatyczny",
   1
  ],
  "p86": [
   "",
   "kwiatowy, slodki",
   2
  ],
  "p87": [
   "",
   "orientalny, kwiatowy, slodki",
   3
  ],
  "p88": [
   "",
   "orientalny, kwiatowy",
   1
  ],
  "p89": [
   "",
   "slodki",
   3
  ],
  "p90": [
   "",
   "slodki, cytrusowy",
   2
  ],
  "p91": [
   "",
   "kwiatowy, aromatyczny",
   2
  ],
  "p92": [
   "",
   "kwiatowy, slodki",
   1
  ],
  "p93": [
   "",
   "kwiatowy",
   3
  ],
  "p94": [
   "",
   "kwiatowy, cytrusowy",
   1
  ],
  "p95": [
   "",
   "orientalny, slodki",
   1
  ],
  "p96": [
   "",
   "orientalny, drzewny",
   2
  ],
  "p97": [
   "",
   "cytrusowy, aromatyczny",
   1
  ],
  "p98": [
   "",
   "slodki, cytrusowy",
   1
  ],
  "p99": [
   "",
   "orientalny, aromatyczny",
   1
  ],
  "p100": [
   "",
   "slodki, aromatyczny",
   1
  ]
 },
 "podobne": {
  "p16": [
   "p09, p15",
   "p09, p31, p100, p64"
  ],
  "p42": [
   "p10, p35, p70",
   "p30, p10, p35"
  ],
  "p43": [
   "p42, p40, p08",
   "p73, p40, p08"
  ],
  "p44": [
   "p39, p65, p49",
   "p73, p39, p65"
  ]
 },
 "zestawy": {
  "z04": [
   "p34",
   "p98"
  ]
 }
};

function aktualizacja_2026_10() {
  const ss = ss_();
  const D = AKTUALIZACJA_2026_10;
  ensureSheet_(ss, SHEET.PRODUKTY, HEADERS.Produkty);
  const sh = ss.getSheetByName(SHEET.PRODUKTY);
  const H = headerMap_(sh);
  const width = sh.getLastColumn();
  const wiersz = function (p) {
    const row = new Array(width).fill('');
    Object.keys(p).forEach(function (k) { if (H[k]) row[H[k] - 1] = p[k]; });
    return row;
  };
  const kolumna = function (name) {
    const n = sh.getLastRow() - 1;
    return n > 0 ? sh.getRange(2, H[name], n, 1).getValues().map(function (r) { return r[0]; }) : [];
  };

  // 1. nowe zapachy
  let ids = kolumna('id').map(str_);
  const nazwy = kolumna('nazwa').map(str_);
  let dodane = 0, uzupelnione = 0;
  D.nowe.forEach(function (p) {
    const i = ids.indexOf(p.id);
    if (i === -1) { sh.appendRow(wiersz(p)); ids.push(p.id); dodane++; }
    else if (!nazwy[i]) { sh.getRange(i + 2, 1, 1, width).setValues([wiersz(p)]); uzupelnione++; }
  });

  // 2. bestseller, klimat, renoma: tylko puste komórki
  ids = kolumna('id').map(str_);
  let quiz = 0;
  [['bestseller', 0], ['klimat', 1], ['renoma', 2]].forEach(function (k) {
    const vals = kolumna(k[0]);
    let zmiana = false;
    ids.forEach(function (id, i) {
      const v = D.quiz[id] ? D.quiz[id][k[1]] : '';
      if (v !== '' && str_(vals[i]) === '') { vals[i] = v; zmiana = true; quiz++; }
    });
    if (zmiana) sh.getRange(2, H[k[0]], vals.length, 1).setValues(vals.map(function (v) { return [v]; }));
  });

  // 3. podobne: tylko tam, gdzie jest jeszcze stara wartość
  const pod = kolumna('podobne');
  let podobne = 0;
  const pominiete = [];
  ids.forEach(function (id, i) {
    const z = D.podobne[id];
    if (!z) return;
    if (str_(pod[i]) === z[0]) { sh.getRange(i + 2, H.podobne).setValue(z[1]); podobne++; }
    else if (str_(pod[i]) !== z[1]) pominiete.push(id);
  });

  // 4. zestawy
  const zs = ss.getSheetByName(SHEET.ZESTAWY);
  const HZ = headerMap_(zs);
  let zestawy = 0;
  if (zs.getLastRow() > 1) {
    const zr = zs.getRange(2, 1, zs.getLastRow() - 1, zs.getLastColumn()).getValues();
    zr.forEach(function (r, i) {
      const z = D.zestawy[str_(r[HZ.id - 1])];
      const sklad = str_(r[HZ.sklad - 1]);
      if (!z || sklad.indexOf(z[0] + ':') === -1) return;
      zs.getRange(i + 2, HZ.sklad).setValue(sklad.split(z[0] + ':').join(z[1] + ':'));
      zestawy++;
    });
  }

  invalidateCatalog_();
  const opis = 'Dodane zapachy: ' + dodane + ', uzupełnione puste wiersze: ' + uzupelnione +
    ', uzupełnione komórki bestseller/klimat/renoma: ' + quiz + ', zmienione podobne: ' + podobne +
    (pominiete.length ? ' (pominięte, bo zmienione ręcznie: ' + pominiete.join(', ') + ')' : '') +
    ', zmienione zestawy: ' + zestawy + '.';
  log_('INFO', 'aktualizacja_2026_10', opis);
  return opis;
}
