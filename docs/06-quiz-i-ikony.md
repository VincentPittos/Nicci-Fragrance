# Etap 6: quiz, wynik i ikony odpowiedzi

## Mapa odpowiedź → ikona

Odpowiedzi i ich kolejność pochodzą wyłącznie z `Nicci.quiz.questions`. Ikony: `site/js/ikony.js`, siatka 32×32, obrys 1,5 px, zaokrąglone końce, bez wypełnień, złoto na ciemnym kaflu. Arkusz do oceny: `dev/etap-6/arkusz-ikon.png` (źródło `dev/etap-6/ikony.html`).

| Pytanie | Odpowiedź (z API) | Ikona | Linia doprecyzowania (nasz tekst) |
|---|---|---|---|
| Dla kogo szukasz zapachu? | Dla niego | flakon o prostych krawędziach z etykietą | Męskie klasyki i zapachy dla każdego |
| | Dla niej | flakon o miękkim kształcie | Kobiece i te dla każdego |
| | Bez znaczenia | dwa flakony obok siebie | Pokażemy wszystko, co pasuje |
| Który klimat jest Ci najbliższy? (do dwóch) | Świeżo i czysto | przekrojony cytrus (decyzja właściciela) | Cytrusy, bergamotka, zioła |
| | Drzewnie i elegancko | słoje drewna | Cedr, wetyweria, skóra |
| | Słodko i otulająco | kropla karmelu | Wanilia, ambra, przyprawy |
| | Kwiatowo | kwiat z profilu | Jaśmin, kwiat pomarańczy, irys |
| Kiedy chcesz go nosić? | Na co dzień | słońce w zenicie | Praca, uczelnia, spacer |
| | Wieczorem i na wyjścia | półksiężyc | Kolacja, randka, koncert |
| | Do wszystkiego | słońce i księżyc | Jeden zapach na każdą okazję |
| W jakiej porze roku? | Ciepłe miesiące | słońce nad wodą | Wiosna i lato |
| | Chłodne miesiące | płatek śniegu | Jesień i zima |
| | Cały rok | obieg roku | Bez względu na pogodę |
| Jak mocny ma być? | Blisko skóry | jeden łuk przy punkcie | Poczuje go ktoś, kto stoi blisko |
| | Wyczuwalny | dwa łuki | Czuć go w rozmowie, nie od progu |
| | Zostawia ślad | trzy łuki | Zostaje w pamięci po wyjściu |

Uwaga do „Dla niej”: w katalogu nie ma pozycji z profilem „damski” (są męski i unisex), więc ta odpowiedź pokaże zapachy unisex. Tak liczy `Nicci.quiz.recommend`, strona niczego nie dopisuje.

## Mechanika

Jedno pytanie na ekran, pasek postępu i licznik „2 z 5”. Wybór pojedynczy przechodzi dalej po 0,38 s, klimat (do dwóch) czeka na „Dalej”, trzeci kafel jest zablokowany z komunikatem. „Wstecz” zawsze widoczne (na pierwszym ekranie wraca na stronę główną). Przejścia poziome na sprężynie. Stan w `sessionStorage` (`nicci_quiz_state`): powrót z wyniku otwiera ostatnie pytanie z zaznaczeniami. `?rodzina=drzewna` zaznacza klimat, do którego należy rodzina, i mówi o tym na pierwszym ekranie. Ekran przejściowy trwa 1,2 s z realną liczbą zapachów z katalogu.

## Wynik

Linia pod nagłówkiem z odpowiedzi, np. „Drzewne i otulające, wieczorowe, zostawiające ślad, na chłodne miesiące”. Uzasadnienie przy każdym zapachu z pól produktu: rodzina, pora, dwie nuty o różnych surowcach, intensywność, np. „Skórzany, z charakterem, na wieczór, w nutach szafran i kakao, zostawia wyraźny ślad.” Domyślnie 5 ml. „Dodaj wszystkie trzy” z sumą, link do katalogu z filtrem rodziny pierwszego zapachu, pasek „Przejdź do zamówienia” po dodaniu.

Dopasowanie częściowe (żaden z trzech nie należy do rodzin z odpowiedzi): uczciwy komunikat i wysunięty pierwszy dostępny zestaw odkrywców. Zestaw „z tej rodziny” pojawi się, gdy zestawy dostaną rodzinę w arkuszu (teraz ta kolumna jest pusta).

Wszystkie teksty przejdą jeszcze przez /copywriting, /storytelling i /humanizer w etapie 8.
