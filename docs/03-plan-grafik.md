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
| Miniatury nut | biblioteka 31 ikon SVG w złotej linii, pokrywa 92% wystąpień nut (567 z 619), reszta jako tekst | 0 |
| Zdjęcie w karcie 3 sekcji 2 | kadr z Twojego zdjęcia hero: złote atomizery Nicci | 0 |

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

Kwoty przy modelu Sunburst. Jeśli po teście wygra Nano Banana 2, rdzeń spada do 335, a maksimum do 455. Cztery najliczniejsze rodziny (cytrusowa, drzewna, gourmand, orientalna) idą pierwsze, zgodnie z promptem. Wodnej i szyprowej nie ma w katalogu, więc nie mają kadru.

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

## Zdjęcia produktów (packshoty)

Polityka sieci tego środowiska blokuje strony sklepów i producentów. Brama odrzuciła m.in. `www.notino.pl`, `fimgs.net`, `www.sephora.pl`, `www.douglas.pl` oraz strony Xerjoff, Amouage, Louis Vuitton, Creed, Tom Ford, Dior, Mancera i Montale. Do wyboru:

1. **Własne zdjęcia flakonów i atomizerów Nicci** (najbezpieczniejsze prawnie, rekomendacja z promptu). Wystarczy telefon, jasne jednolite tło i światło z góry. Resztę robi skrypt.
2. **Materiały prasowe od Ciebie** (pliki od dystrybutorów albo pobrane przez Ciebie). W raporcie końcowym wpiszemy źródło każdego pliku.
3. **Poszerzenie dostępu sieci środowiska** o wskazane domeny. Wtedy pobiorę packshoty sam i zapiszę źródło każdego.

W każdym wariancie skrypt ujednolici zdjęcia: kadr 4:5, jednakowe tło i wielkość flakonu, WebP 400 i 800 px, zapis do `site/img/produkty/{id}-400.webp` i `{id}-800.webp`, uzupełnienie `zdjecie_url`. Karty bez zdjęcia pokazują do tego czasu elegancki kadr zastępczy z inicjałem marki, więc strona może iść dalej.
