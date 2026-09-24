# Etap 3: Plan grafik i budżet OpenArt

Stan konta OpenArt (sprawdzony `openart_account_get`): plan Starter, **900 kredytów**. Zasada z promptu: generujemy pojedynczo, po każdym kadrze raport zużycia, przy 700 zużytych kredytach zatrzymanie i pytanie.

## Ceny (sprawdzone `openart_model_cost` przed generowaniem)

| Model | Konfiguracja | Kredyty za kadr |
|---|---|---|
| GPT Image 2.5 Sunburst | 1:1, 2K, jakość medium | 35 |
| GPT Image 2.5 Sunburst | 1:1, 2K, jakość high | 130 (za drogo na serię) |
| Nano Banana 2 | 1:1, 2K | 30 |

Kadr kwadratowy 2K, bo ten sam plik przytniemy do 4:5 w lewej kolumnie karuzeli na komputerze i do 4:3 nad panelem na telefonie.

## Czego NIE generujemy

| Grafika | Skąd | Kredyty |
|---|---|---|
| Kompozycja hero | Twój plik `refs/hero-czysty.webp`, używany w całości | 0 |
| Grafika Open Graph (1200×630) | składana lokalnie z kadru hero i wektorowego logo | 0 |
| Ikony quizu (16) i ikony UI | rysowane jako SVG | 0 |

## Plan generowania

| # | Kadr | Model | Wariantów | Kredyty |
|---|---|---|---|---|
| 1 | Test stylu: rodzina cytrusowa | Sunburst medium i Nano Banana 2, po jednym | 2 | 65 |
| 2 | Drzewna (12 zapachów) | model wybrany po teście | 1 | 35 |
| 3 | Gourmand (9) | wybrany | 1 | 35 |
| 4 | Orientalna (7) | wybrany | 1 | 35 |
| 5 | Aromatyczna (5) | wybrany | 1 | 35 |
| 6 | Ambrowa (4) | wybrany | 1 | 35 |
| 7 | Skórzana (3) | wybrany | 1 | 35 |
| 8 | Świeża (3) | wybrany | 1 | 35 |
| 9 | Kwiatowa (3) | wybrany | 1 | 35 |
| 10 | Słodka (2) | wybrany | 1 | 35 |
| | **Rdzeń** | | | **380** |
| R | Rezerwa na powtórki kadrów, które nie wyjdą (do 4 sztuk) | wybrany | do 4 | do 140 |
| | **Maksimum z rezerwą** | | | **520** |

Kwoty przy modelu Sunburst. Po teście wygrał Nano Banana 2 (30 kredytów za kadr), a opcje A i B zostały przyjęte, więc limit to 660, próg zatrzymania 700. Jeśli po teście wygra Nano Banana 2, rdzeń spada do 335, a maksimum do 455. Cztery najliczniejsze rodziny (cytrusowa, drzewna, gourmand, orientalna) idą pierwsze, zgodnie z promptem. Wodnej i szyprowej nie ma w katalogu, więc nie mają kadru.

### Opcje poza listą priorytetów promptu (tylko na Twoją wyraźną zgodę)

| Opcja | Kredyty | Po co |
|---|---|---|
| A. Karta 3 sekcji 2: odlewanie z flakonu do złotego atomizera | 35 | lepiej opowiada „Odlewamy z oryginału” niż kadr z hero |
| B. Miniatury nut jako zdjęcia surowców (3 arkusze po 16 miniatur, cięte lokalnie) | 105 | wygląd jak w referencji LV zamiast ikon SVG |

## Prompty

Baza z promptu, bez zmian:

```
Luxury still life product photography, dramatic directional warm light from top right, deep shadows, dark stone and warm cream surfaces, gold accents, shallow depth of field, 85mm lens, hyperrealistic textures, editorial perfume campaign aesthetic, generous empty space for text, no people, no text, no logos, no watermark.
```

Dla spójności serii każdy kadr dostaje ten sam dopisek: `Square composition, raw ingredients only arranged loosely on a warm cream travertine slab, no perfume bottles, no packaging.` Surowce wynikają z najczęstszych nut danej rodziny w katalogu:

| Rodzina | Najczęstsze nuty w katalogu | Surowce w kadrze |
|---|---|---|
| cytrusowa | cytryna, bergamotka, mandarynka, grejpfrut, wetyweria | halved lemons, bergamot, mandarin segments, pink grapefruit slice, curled citrus peel, a few vetiver roots |
| drzewna | paczula, wetyweria, kardamon, kadzidło, cynamon | split cedar blocks, vetiver roots, dried patchouli leaves, green cardamom pods, frankincense tears, cinnamon quills |
| gourmand | wanilia, tonka, cynamon, liść tytoniu, kawa | vanilla pods, tonka beans, roasted coffee beans, a dried tobacco leaf, cinnamon quills |
| orientalna | róża, szafran, ambra, kadzidło, oud | dark red rose petals, saffron threads, amber resin chunks, frankincense tears, agarwood chips |
| aromatyczna | wetyweria, cedr, kardamon, różowy pieprz, geranium | vetiver roots, cedar shavings, cardamom pods, pink peppercorns, geranium leaves |
| ambrowa | wanilia, tonka, sandałowiec, pomarańcza | vanilla pods, tonka beans, sandalwood chips, a halved Sicilian orange, amber resin |
| skórzana | skóra, paczula, szafran, porzeczka, kakao | a folded swatch of supple dark leather, saffron threads, blackcurrants, cocoa nibs, frankincense tears |
| świeża | bergamotka, mandarynka, jaśmin, zielona herbata, porzeczka | bergamot, mandarin, jasmine buds, loose green tea leaves, blackcurrants, petitgrain leaves |
| kwiatowa | kwiat pomarańczy, neroli, jaśmin, irys, rozmaryn | orange blossom sprigs, jasmine flowers, a single iris flower, a rosemary sprig, pink peppercorns |
| słodka | marakuja, szafran, róża, wanilia, benzoina | halved passion fruit, saffron threads, rose petals, vanilla pods, benzoin resin |

## Wykonanie

### Kadry rodzin (10) i opcja A

Wszystkie w Nano Banana 2, 1:1, 2K, z tym samym dopiskiem serii. Po pierwszej próbie orientalnej zmieniliśmy opis światła na „Soft natural beam of warm window light grazing the slab from the top right, no light lines, no glowing streaks”, bo „thin sliver of gold light” rysował neonową kreskę. Od kadru aromatycznego dochodzi „resting on dark slate, plain dark warm backdrop, no visible window”, żeby tło było wspólne dla serii.

Pliki: `site/img/rodziny/{rodzina}-45-640|1280.webp` (4:5, lewa kolumna karuzeli na komputerze) i `{rodzina}-43-800|1200.webp` (4:3, nad panelem na telefonie). Przycięcie: `dev/grafiki/przetworz_kadr.py`.

Opcja A, karta 3 sekcji 2: flakon bez etykiety, dwa złote atomizery, pipeta i lejek na trawertynie, tło grafitowe. 3:4 jak karta (280×372). Pliki: `site/img/sekcja2/odlewanie-600|1200.webp`.

### Opcja B: miniatury nut

Trzy arkusze 4×4 (owoce i świeże, kwiaty i przyprawy, drewna, żywice i gourmand). Cięcie `dev/grafiki/tnij_nuty.py` wykrywa szczeliny siatki z profilu jasności, więc lekko nierówna siatka z generatora nie przesuwa kadrów. 48 plików `site/img/nuty/{slug}.webp`, 256×256, razem 380 KB, ładowane dopiero w szufladzie produktu.

Słownik `site/js/nuty.js` przypisuje nutę do miniatury po rdzeniu słowa (np. „drewno gwajakowe” → drewno, „kwiat tytoniu” → tytoń, „różowy pieprz” przed „różą”). Pokrycie: **603 z 619 wystąpień nut (97,4%)**. Bez miniatury, jako sam tekst: gruszka, fiołek, herbata (za rzadkie na własny kafelek) oraz pojedyncze: nasiona marchwi, rum, davana, akord coli, orzechy, gorzki migdał, immortelle, akord wina, lukrecja, tamaryndowiec.

## Zdjęcia produktów (packshoty)

Źródło: oficjalne strony i sklepy producentów. Każdy plik ma zapisaną stronę i adres obrazu w `dev/zdjecia/zrodla-wybrane.csv` (użyte) i `dev/zdjecia/zrodla.csv` (wszyscy kandydaci). Zasady: `robots.txt` każdej domeny sprawdzony i przestrzegany, Fragrantica i sklepy z zakazem dla botów pominięte, **zabezpieczeń przed botami nie obchodzimy**.

| Metoda | Marki | Produktów |
|---|---|---|
| Sklep Shopify: wyszukiwarka i dane produktu | Xerjoff, Amouage, Creed, Tom Ford, Marc-Antoine Barrois, Maison Crivelli, Essential Parfums, Nutu, Tiziana Terenzi, Sospiro | 31 |
| Strona produktu, `og:image` | Mancera, Montale, BOSS | 13 |
| Strona budowana skryptem, render w Chromium | Rabanne, Azzaro | 6 |
| **Razem ze zdjęciem** | | **49 z 64 aktywnych** |

**Bez zdjęcia (15), strony odpowiadają 403 albo ekranem Cloudflare także przeglądarce:** Louis Vuitton (Imagination, Pacific Chill, Afternoon Swim, Nouveau Monde, Ombre Nomade), Maison Francis Kurkdjian (Grand Soir, Baccarat Rouge 540), Dior (Homme Cologne, Sauvage Parfum, Sauvage Elixir, Sauvage Extrait), Versace (Eros Parfum), YSL (Y Parfum, MYSLF Parfum), Hermès (Terre d'Hermès Eau Intense Vétiver). Te karty pokazują kadr zastępczy z inicjałem marki. Potrzebne własne zdjęcia albo materiały prasowe od dystrybutora; skrypt przyjmie je bez zmian.

Ujednolicenie (`dev/zdjecia/przygotuj_wejscie.py`, potem `ujednolic_zdjecia.py`): kadr 4:5, tło #F1EFEC, flakon na 74% wysokości, podstawa na 88%. Flakon kopiowany bez zmian; tło i cień przenoszone jako mapa cieniowania (źródło podzielone przez model tła), więc cień zostaje miękki, a tło wychodzi równe. PNG z przezroczystością (Xerjoff, Tom Ford, Montale, Crivelli, Azzaro) wklejane po kanale alfa. Z dwóch zdjęć (Bois Pacifique, 1 Million) usunięta plakietka nagrody Fragrance Foundation. Pliki: `site/img/produkty/{id}-400|800.webp`, adres w arkuszu: `/img/produkty/{id}-800.webp`.

## Hero na telefonie

Na telefonie hero pokazuje prawe 70% zdjęcia (atomizery Nicci) w powiększeniu, więc zwykły plik 800 albo 1200 px był rozciągany 2,5 raza i wychodził rozmyty. Osobny kadr z pliku właściciela `refs/hero-czysty.webp`, przygotowany skryptem `dev/grafiki/hero_telefon.py`:

| Plik | Rozmiar | Obróbka | Dla kogo |
|---|---|---|---|
| `hero-m-1000.webp` | 1000 × 797, 60 KB | zmniejszenie, lekkie wyostrzenie | małe ekrany 2× |
| `hero-m-1400.webp` | 1400 × 1116, 100 KB | piksele źródła, wyostrzenie (unsharp mask 1,0 / 55%) | ekrany 2× |
| `hero-m-2100.webp` | 2100 × 1674, 138 KB | EDSR ×2 (lokalnie, OpenCV dnn_superres), zmniejszenie, delikatne wyostrzenie | ekrany 3× |

Przeglądarka wybiera plik z `sizes` zależnego od wysokości ekranu, bo od niej zależy wysokość kadru. Każdy telefon pobiera jeden plik. Na iPhonie (390 px, 3×) kadr jest powiększany 1,03 raza zamiast 2,56. Cienka jasna obwódka przy flakonie Louis Vuitton jest w oryginale, wyostrzanie jej nie dodało.

## Grafika Open Graph

`site/img/og.jpg`, 1200×630, 100 KB: kadr z `refs/hero-czysty.webp`, złote logo wektorowe i linia „Oryginalne perfumy w odlewkach 5, 10 i 20 ml” (do przejścia przez humanizer w etapie 8). Budowa: `node dev/grafiki/zbuduj_og.js`.

## Dziennik zużycia OpenArt

| Data | Kadr | Model, konfiguracja | historyId | Wynik | Kredyty | Saldo |
|---|---|---|---|---|---|---|
| 23.09.2026 | Test: cytrusowa | GPT Image 2.5 Sunburst, 1:1, 2k, medium | `0jWMCvw0TWYGzB0Crl15` | 1360×1360 px (mimo „2k”), odrzucony na rzecz NB2 | 35 | 865 |
| 23.09.2026 | Test: cytrusowa | Nano Banana 2, 1:1, 2K | `Ey7rlYySB2yMCb4NeL0R` | przyjęty | 30 | 835 |
| 23.09.2026 | Drzewna | Nano Banana 2, 1:1, 2K | `Dbs17Hc5fQ30UvBiSQ1D` | przyjęty | 30 | 805 |
| 23.09.2026 | Gourmand | Nano Banana 2, 1:1, 2K | `mEvHWI4E4OjIVwgyOUE7` | przyjęty | 30 | 775 |
| 23.09.2026 | Orientalna v1 | Nano Banana 2, 1:1, 2K | `9Js9W6yIaetyqpJYfzvr` | odrzucony: neonowa smuga światła (powtórka 1 z 4) | 30 | 745 |
| 23.09.2026 | Orientalna v2 | Nano Banana 2, 1:1, 2K | `fiD2A27NauRgBUAR4rmG` | przyjęty | 30 | 715 |
| 23.09.2026 | Aromatyczna | Nano Banana 2, 1:1, 2K | `wzAnWmIjE8HDmApWOmFu` | przyjęty | 30 | 685 |
| 23.09.2026 | Ambrowa | Nano Banana 2, 1:1, 2K | `9pSECOoRVcxcNy0te5A0` | przyjęty | 30 | 655 |
| 23.09.2026 | Skórzana | Nano Banana 2, 1:1, 2K | `06xSHp8PT7WIHHV5m4WJ` | przyjęty | 30 | 625 |
| 23.09.2026 | Świeża | Nano Banana 2, 1:1, 2K | `hBQTTvnMbXFvhNzIyioX` | przyjęty | 30 | 595 |
| 23.09.2026 | Kwiatowa | Nano Banana 2, 1:1, 2K | `xoTYeCIvjac6sLzzGLCC` | przyjęty | 30 | 565 |
| 23.09.2026 | Słodka v1 | Nano Banana 2, 1:1, 2K | `AR820WTRlU8zxF3g8ySs` | odrzucony: nienaturalny miąższ marakui, złota pęseta w kadrze (powtórka 2 z 4) | 30 | 535 |
| 23.09.2026 | Słodka v2 | Nano Banana 2, 1:1, 2K | `cjYu5q80xJY66WsYEB5I` | przyjęty | 30 | 505 |
| 23.09.2026 | Opcja A: odlewanie | Nano Banana 2, 3:4, 2K | `YMo2cwBagaVqxgfKH78r` | przyjęty, przycięta czarna ramka | 30 | 475 |
| 23.09.2026 | Opcja B: nuty, arkusz 1 | Nano Banana 2, 1:1, 2K | `IbqdHdg4FKKZPyVntU0x` | przyjęty, 16 z 16 zgodnych z opisem | 30 | 445 |
| 23.09.2026 | Opcja B: nuty, arkusz 2 | Nano Banana 2, 1:1, 2K | `dMJRlj3Gq0pRIy87XYAB` | przyjęty, 16 z 16 | 30 | 415 |
| 23.09.2026 | Opcja B: nuty, arkusz 3 | Nano Banana 2, 1:1, 2K | `nzMj8zSc0oSL3Sl6IH7N` | przyjęty, 16 z 16 | 30 | 385 |

**Zużyte: 515 z limitu 660** (próg zatrzymania 700). Saldo potwierdzone `openart_account_get` po słodkiej v2 (505) i po ostatnim arkuszu (385). Powtórki: 2 z 4. Zapas: 145 kredytów do limitu.

## Sieć

Po odblokowaniu sieci działa pobieranie z `cdn.openart.ai` i ze stron producentów. Część marek blokuje ruch automatyczny po swojej stronie (403, Cloudflare), co opisuje sekcja o zdjęciach. Przeglądarka Chromium w środowisku nie ufała certyfikatowi pośrednika, bo magazyn NSS był pusty; dodany certyfikat `/root/.ccr/agent-proxy-ca.crt` (tylko w tym kontenerze, weryfikacja TLS pozostaje włączona).
