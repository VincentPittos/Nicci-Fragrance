# Raport konwersji arkusza

Wygenerowany przez `dev/konwersja_arkusza.py`. Wszystkie wartości oznaczone w zakładce „Do weryfikacji” są propozycją do akceptacji właściciela.

Produkty: 71 (aktywne: 64, wyłączone: 7). Zestawy: 7. Pozycji do weryfikacji: 114.

## Rodziny aktywnych produktów

| Rodzina | Liczba |
|---|---|
| cytrusowa | 16 |
| drzewna | 12 |
| gourmand | 9 |
| orientalna | 7 |
| aromatyczna | 5 |
| ambrowa | 4 |
| skórzana | 3 |
| świeża | 3 |
| kwiatowa | 3 |
| słodka | 2 |

## Mapowanie rodzin opisowych na kanoniczne

| W źródle | Propozycja | Pewne | Produktów |
|---|---|---|---|
| Ambrowo-drzewna | ambrowa | tak | 1 |
| Ambrowo-gourmand | ambrowa | tak | 1 |
| Korzenno-ambrowa | ambrowa | do weryfikacji | 1 |
| Owocowo-ambrowa | ambrowa | do weryfikacji | 1 |
| Aromatyczno-drzewna | aromatyczna | tak | 1 |
| Aromatyczno-korzenna | aromatyczna | tak | 1 |
| aromatyczna | aromatyczna | tak | 1 |
| aromatyczno-drzewna | aromatyczna | tak | 1 |
| aromatyczno-gourmand | aromatyczna | tak | 1 |
| Cytrusowa | cytrusowa | tak | 1 |
| Cytrusowo-ambrowa | cytrusowa | tak | 1 |
| Cytrusowo-aromatyczna | cytrusowa | tak | 4 |
| Cytrusowo-drzewna | cytrusowa | tak | 3 |
| Cytrusowo-gourmand | cytrusowa | tak | 1 |
| Cytrusowo-kadzidlana | cytrusowa | tak | 1 |
| Cytrusowo-korzenna | cytrusowa | tak | 1 |
| Cytrusowo-kwiatowa | cytrusowa | tak | 2 |
| Cytrusowo-morska | cytrusowa | tak | 1 |
| Cytrusowo-musująca | cytrusowa | tak | 1 |
| Cytrusowo-owocowa | cytrusowa | tak | 1 |
| Korzenno-cytrusowa | cytrusowa | do weryfikacji | 1 |
| cytrusowo-korzenna | cytrusowa | tak | 1 |
| Drzewno-agarowa | drzewna | tak | 1 |
| Drzewno-aromatyczna | drzewna | tak | 1 |
| Drzewno-cytrusowa | drzewna | tak | 1 |
| Drzewno-gourmand | drzewna | tak | 1 |
| Drzewno-korzenna | drzewna | tak | 1 |
| Drzewno-skórzana | drzewna | tak | 1 |
| Dymno-drzewna | drzewna | do weryfikacji | 1 |
| Dymno-żywiczna | drzewna | do weryfikacji | 1 |
| Korzenno-drzewna | drzewna | do weryfikacji | 3 |
| Owocowo-drzewna | drzewna | do weryfikacji | 1 |
| owocowo-drzewna | drzewna | do weryfikacji | 1 |
| Gourmand | gourmand | tak | 4 |
| Gourmand-korzenna | gourmand | tak | 1 |
| Korzenno-gourmand | gourmand | do weryfikacji | 3 |
| gourmand | gourmand | tak | 2 |
| Irysowo-kadzidlana | kwiatowa | do weryfikacji | 1 |
| Kwiatowo-drzewna | kwiatowa | tak | 2 |
| Owocowo-kwiatowa | kwiatowa | do weryfikacji | 1 |
| Agarowo-różana | orientalna | do weryfikacji | 1 |
| Korzenna | orientalna | do weryfikacji | 1 |
| Orientalna | orientalna | tak | 1 |
| Orientalna-gourmand | orientalna | tak | 1 |
| Orientalno-agarowa | orientalna | tak | 1 |
| Orientalno-żywiczna | orientalna | tak | 1 |
| korzenna | orientalna | do weryfikacji | 1 |
| oreintalno-skórzana | orientalna | tak | 1 |
| Skórzana | skórzana | tak | 1 |
| Skórzano-agarowa | skórzana | tak | 1 |
| skórzana | skórzana | tak | 1 |
| Korzenno-słodka | słodka | do weryfikacji | 1 |
| Owocowo-agarowa | słodka | do weryfikacji | 1 |
| zielono-herbaciana | świeża | do weryfikacji | 1 |
| Świeża | świeża | tak | 2 |

## Reguły

* **rodzina:** pierwszy człon nazwy opisowej, który jest jedną z 12 rodzin kanonicznych. Gdy żadnego nie ma: korzenna, agarowa, żywiczna, kadzidlana → orientalna; dymna → drzewna; owocowa → słodka; irysowa, różana → kwiatowa; zielona, herbaciana → świeża.
* **profil:** arkusz go nie ma. Propozycja z ogólnej wiedzy o linii producenta: serie męskie (np. Sauvage, Eros, Bottled, Aventus) → męski, reszta → unisex. Cała kolumna do weryfikacji.
* **intensywność:** z projekcji 1–5: do 2,5 → 1, do 3,5 → 2, od 4 → 3.
* **sezon:** „cały rok” → wszystkie cztery; kwalifikatory (najlepiej, wczesna, późna) pominięte.
* **pora:** dzień i wieczór razem → uniwersalna.
* **ml_dostepne:** źródło nie ma stanów. Puste = do uzupełnienia przez właściciela, niedostępne w źródle → 0.
* **aktywny = NIE:** brak nazwy (Lp. 56–58), niska pewność danych, nazwa do potwierdzenia (Lp. 13).

## Pola do weryfikacji

| Pole | Pozycji |
|---|---|
| rodzina | 28 |
| sezon | 19 |
| nuty / osiągi | 17 |
| podobne | 10 |
| opis | 7 |
| pora | 5 |
| ml_dostepne | 5 |
| sklad | 5 |
| ceny | 3 |
| aktywny | 3 |
| marka, nazwa | 3 |
| trwalosc | 3 |
| projekcja | 3 |
| okazja | 1 |
| nazwa | 1 |
| cena | 1 |

Szczegóły: `dev/dane/do-weryfikacji.csv` albo zakładka „Do weryfikacji” w `import-do-arkusza.xlsx`.
