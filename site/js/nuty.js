/* Nuty zapachowe → miniatura surowca.
   Dopasowanie po rdzeniu słowa, w kolejności listy: pierwsze trafienie wygrywa, dlatego złożone nazwy
   („kwiat pomarańczy”, „skórka pomarańczowa”, „piżmo cedrowe”, „drewno ambrowe”) stoją przed ogólnymi.
   Nuta bez dopasowania (np. gruszka, fiołek, herbata: za rzadkie na własną miniaturę) wyświetla się jako sam tekst. Pliki: img/nuty/{slug}.webp */
(function (root) {
  'use strict';

  var REGULY = [
    ['kwiat pomarańcz', 'kwiat-pomaranczy'], ['neroli', 'kwiat-pomaranczy'], ['petitgrain', 'kwiat-pomaranczy'],
    ['skórka pomarańcz', 'pomarancza'], ['kwiat tytoni', 'tyton'], ['liść tytoni', 'tyton'], ['tytoń', 'tyton'],
    ['piżmo cedrowe', 'pizmo'], ['ambrette', 'pizmo'], ['piżmian', 'pizmo'], ['piżmo', 'pizmo'],
    ['drewno ambrowe', 'drewno'], ['ambrowe drewno', 'drewno'], ['drzewo ambrowe', 'drewno'],
    ['drzewo sandał', 'sandalowiec'], ['sandał', 'sandalowiec'],
    ['drewno wetywer', 'wetyweria'], ['wetyweri', 'wetyweria'],
    ['drzewo cedr', 'cedr'], ['cedr', 'cedr'], ['jałowiec', 'cedr'], ['cade', 'cedr'], ['sosna', 'cedr'], ['jodł', 'cedr'],
    ['oud', 'oud'], ['agar', 'oud'],
    ['kadzid', 'kadzidlo'], ['olibanum', 'kadzidlo'], ['elemi', 'kadzidlo'],
    ['benzoin', 'zywice'], ['labdanum', 'zywice'], ['cistus', 'zywice'], ['opoponax', 'zywice'], ['żywic', 'zywice'], ['liquidambar', 'zywice'],
    ['ambr', 'ambra'], ['ambergris', 'ambra'], ['bursztyn', 'ambra'],
    ['paczul', 'paczula'],
    ['mech', 'mech'], ['mszyst', 'mech'],
    ['skór', 'skora'], ['zamsz', 'skora'],
    ['wanili', 'wanilia'], ['tonka', 'tonka'],
    ['kakao', 'kakao'], ['pralin', 'kakao'], ['kaw', 'kawa'], ['miód', 'miod'], ['miodow', 'miod'], ['karmel', 'miod'],
    ['bergamot', 'bergamotka'], ['mandaryn', 'mandarynka'], ['grejpfrut', 'grejpfrut'], ['pomelo', 'grejpfrut'],
    ['cytryn', 'cytryna'], ['cytron', 'cytryna'], ['cytrus', 'cytryna'], ['limonk', 'cytryna'], ['kalamansi', 'cytryna'],
    ['pomarańcz', 'pomarancza'],
    ['porzeczk', 'porzeczka'], ['ananas', 'ananas'], ['jabł', 'jablko'], ['marakuj', 'marakuja'], ['egzotyczn', 'marakuja'], ['mango', 'marakuja'],
    ['malin', 'malina'], ['agrest', 'malina'], ['brzoskwin', 'brzoskwinia'], ['morel', 'brzoskwinia'],
    ['śliwk', 'sliwka'], ['suszone owoce', 'sliwka'], ['daktyl', 'sliwka'], ['figa', 'sliwka'],
    ['wiśni', 'wisnia'], ['wiśn', 'wisnia'],
    ['irys', 'irys'], ['mięt', 'mieta'], ['morsk', 'morskie'], ['sól', 'morskie'], ['mineraln', 'morskie'],
    ['różowy pieprz', 'rozowy-pieprz'], ['róż', 'roza'], ['jaśmin', 'jasmin'], ['lawend', 'lawenda'],
    ['geranium', 'geranium'], ['konwali', 'kwiaty'], ['magnoli', 'kwiaty'], ['piwoni', 'kwiaty'], ['cyklamen', 'kwiaty'],
    ['gardeni', 'kwiaty'], ['mimoz', 'kwiaty'], ['osmant', 'kwiaty'], ['kwiat', 'kwiaty'], ['bzu', 'kwiaty'],
    ['szafran', 'szafran'], ['kardamon', 'kardamon'], ['cynamon', 'cynamon'], ['imbir', 'imbir'],
    ['pieprz', 'pieprz'],
    ['rozmaryn', 'ziola'], ['tymian', 'ziola'], ['oregano', 'ziola'], ['szałwi', 'ziola'], ['bazyli', 'ziola'], ['laurow', 'ziola'], ['werben', 'ziola'],
    ['kolendr', 'przyprawy'], ['kmin', 'przyprawy'], ['kumin', 'przyprawy'], ['gałka', 'przyprawy'], ['ziele angielskie', 'przyprawy'],
    ['korzenn', 'przyprawy'], ['przypraw', 'przyprawy'], ['anyż', 'przyprawy'], ['kurkum', 'przyprawy'],
    ['drew', 'drewno'], ['drzew', 'drewno'], ['cashmeran', 'drewno'], ['gwajak', 'drewno'], ['akigalawood', 'drewno'],
    ['palisander', 'drewno'], ['dąb', 'drewno'], ['heban', 'drewno'], ['brzoz', 'drewno']
  ];

  // podpisy miniatur (alt i tytuł), w mianowniku, tak jak na etykiecie słoika w pracowni
  var NAZWY = {
    'bergamotka': 'bergamotka', 'cytryna': 'cytryna', 'mandarynka': 'mandarynka', 'grejpfrut': 'grejpfrut',
    'pomarancza': 'pomarańcza', 'porzeczka': 'czarna porzeczka', 'ananas': 'ananas', 'jablko': 'jabłko',
    'marakuja': 'marakuja', 'malina': 'malina', 'brzoskwinia': 'brzoskwinia', 
    'sliwka': 'śliwka', 'wisnia': 'wiśnia', 'mieta': 'mięta', 'morskie': 'sól morska',
    'roza': 'róża', 'jasmin': 'jaśmin', 'kwiat-pomaranczy': 'kwiat pomarańczy', 'lawenda': 'lawenda',
    'irys': 'irys', 'geranium': 'geranium', 'kwiaty': 'białe kwiaty',
    'szafran': 'szafran', 'kardamon': 'kardamon', 'cynamon': 'cynamon', 'imbir': 'imbir',
    'rozowy-pieprz': 'różowy pieprz', 'pieprz': 'czarny pieprz', 'ziola': 'zioła', 'przyprawy': 'przyprawy',
    'paczula': 'paczula', 'wetyweria': 'wetyweria', 'sandalowiec': 'sandałowiec', 'cedr': 'cedr',
    'drewno': 'drewno', 'oud': 'oud', 'kadzidlo': 'kadzidło', 'ambra': 'ambra',
    'zywice': 'żywice', 'pizmo': 'piżmo', 'skora': 'skóra', 'wanilia': 'wanilia',
    'tonka': 'tonka', 'kakao': 'kakao', 'kawa': 'kawa', 'tyton': 'tytoń',
    'mech': 'mech dębowy', 'miod': 'miód'
  };

  function slug(note) {
    var n = String(note || '').toLowerCase();
    for (var i = 0; i < REGULY.length; i++) if (n.indexOf(REGULY[i][0]) !== -1) return REGULY[i][1];
    return null;
  }

  var api = { REGULY: REGULY, NAZWY: NAZWY, slug: slug };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NicciNuty = api;
})(this);
