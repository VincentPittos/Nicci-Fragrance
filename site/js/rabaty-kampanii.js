/* NICCI: rabaty kampanii naliczane na stronie (decyzja 116). Lista właściciela z 22.11.2026 na Black Weeks:
   procent dla 10 i 20 ml, liczony od obecnych cen z arkusza (po podwyżkach z decyzji 114 i 115), cena po rabacie
   do najbliższych 5 zł, końcówki 2,5 i 7,5 w górę (właściciel 22.11). site/js/app.js (withRabaty) nalicza je tylko od „od” do „do” według
   zegara odwiedzającego (podgląd: ?teraz=2026-11-23T00:01) i tylko przy wstrzymanej sprzedaży na stronie: przy
   otwartej sprzedaży cenę zamówienia liczy serwer, który tych rabatów nie zna (tak jak zapas z decyzji 84).
   Pojemność bez wpisu (5 ml, a w Sospiro Basso także 10 ml) zostaje bez rabatu.

   PROCENT: jak strona pokazuje obniżkę.
   'od-ceny-przed': przekreślona obecna cena i procent z listy (polecenie właściciela z 22.11), pod spodem zawsze
     najniższa cena z 30 dni przed obniżką (site/js/ceny-30dni.js).
   'od-najnizszej-30': przekreślona najniższa cena z 30 dni i procent liczony od niej (wyrok TSUE C-330/23);
     pozycje, które nie są tańsze niż 30 dni wcześniej, strona pokazuje bez oznaczenia promocji. */
window.NicciRabaty = {
  PROCENT: 'od-ceny-przed',
  kampanie: [{
    id: 'black-weeks',
    od: '2026-11-23T00:00:00+01:00',
    do: '2026-11-30T00:00:00+01:00',
    rabaty: {
      // Versace Eros (Parfum) i Eros Energy
      p55: { 10: 40, 20: 50 }, p56: { 10: 40, 20: 50 },
      // Creed Aventus i Absolu Aventus
      p11: { 10: 15, 20: 20 }, p12: { 10: 10, 20: 20 },
      // Kilian Angels' Share i Angels' Share On The Rocks
      p89: { 10: 12, 20: 25 }, p90: { 10: 12, 20: 25 },
      // Sospiro Basso, tylko 20 ml (Vibrato jest tylko w 5 i 10 ml, więc bez rabatu)
      p85: { 20: 15 },
      // Maison Francis Kurkdjian: Grand Soir i Oud Satin Mood; Baccarat Rouge 540 osobno
      p42: { 10: 10, 20: 20 }, p83: { 10: 10, 20: 20 }, p43: { 10: 30, 20: 40 },
      // Montale, wszystkie
      p27: { 10: 10, 20: 20 }, p28: { 10: 10, 20: 20 }, p29: { 10: 10, 20: 20 }, p30: { 10: 10, 20: 20 }, p31: { 10: 10, 20: 20 },
      // Tom Ford, wszystkie (Lost Cherry i Oud Wood teraz bez pojemności w sprzedaży)
      p32: { 10: 12.5, 20: 25 }, p33: { 10: 12.5, 20: 25 }, p34: { 10: 12.5, 20: 25 }, p35: { 10: 12.5, 20: 25 },
      p36: { 10: 12.5, 20: 25 }, p37: { 10: 12.5, 20: 25 }, p38: { 10: 12.5, 20: 25 }, p86: { 10: 12.5, 20: 25 },
      p87: { 10: 12.5, 20: 25 }, p88: { 10: 12.5, 20: 25 },
      // Nous Tous, wszystkie
      p46: { 10: 10, 20: 15 }, p47: { 10: 10, 20: 15 }, p48: { 10: 10, 20: 15 }, p49: { 10: 10, 20: 15 }, p50: { 10: 10, 20: 15 },
      // Amouage, wszystkie
      p15: { 10: 10, 20: 25 }, p16: { 10: 10, 20: 25 }, p17: { 10: 10, 20: 25 }, p19: { 10: 10, 20: 25 }, p20: { 10: 10, 20: 25 }, p78: { 10: 10, 20: 25 },
      // Louis Vuitton, wszystkie
      p01: { 10: 10, 20: 15 }, p02: { 10: 10, 20: 15 }, p03: { 10: 10, 20: 15 }, p04: { 10: 10, 20: 15 }, p05: { 10: 10, 20: 15 },
      // Dior: Sauvage Elixir i Sauvage Extrait; pozostałe Dior
      p53: { 10: 15, 20: 25 }, p54: { 10: 15, 20: 25 }, p51: { 10: 10, 20: 15 }, p52: { 10: 10, 20: 15 },
      // Hugo Boss Bottled Elixir i Bottled Absolu
      p59: { 10: 10, 20: 15 }, p60: { 10: 10, 20: 15 },
      // Hermès Terre d'Hermès Eau Intense Vétiver
      p65: { 10: 10, 20: 15 },
      // Azzaro, wszystkie (Chrome tylko w 20 ml)
      p69: { 10: 10, 20: 15 }, p70: { 10: 10, 20: 15 }, p71: { 10: 10, 20: 15 },
      // Parfums de Marly, wszystkie
      p75: { 10: 10, 20: 15 }, p76: { 10: 10, 20: 15 }, p77: { 10: 10, 20: 15 },
      // Atkinsons, wszystkie
      p95: { 10: 10, 20: 15 }, p96: { 10: 10, 20: 15 }, p97: { 10: 10, 20: 15 },
      // Mancera, wszystkie
      p21: { 10: 5, 20: 10 }, p22: { 10: 5, 20: 10 }, p23: { 10: 5, 20: 10 }, p24: { 10: 5, 20: 10 }, p25: { 10: 5, 20: 10 }
    }
  }]
};
