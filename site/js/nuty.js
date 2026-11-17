/* Nuty zapachowe → miniatura surowca.
   Dopasowanie po rdzeniu słowa, w kolejności listy: pierwsze trafienie wygrywa, dlatego złożone nazwy
   („kwiat pomarańczy”, „skórka pomarańczowa”, „piżmo cedrowe”, „drewno ambrowe”) stoją przed ogólnymi.
   Nuta bez dopasowania (np. davana, ylang-ylang, heliotrop) wyświetla się jako sam tekst. Pliki: img/nuty/{slug}.webp.
   Listopad 2026 (decyzja 106): nowe miniatury dla nut, które dostawały cudze zdjęcie (truskawka kawę, karmel miód, mango marakuję,
   figa śliwkę, sosna i jałowiec cedr, osmantus, piwonia i bez konwalię) albo nie miały żadnego (fiołek, gruszka, herbata, migdał). */
(function (root) {
  'use strict';

  var REGULY = [
    // przed ogólnymi regułami, które by je przechwyciły („kaw” w truskawce, „róż” w pieprzu różowym i drzewie różanym)
    ['truskaw', 'truskawka'], ['różowy pieprz', 'rozowy-pieprz'], ['pieprz różow', 'rozowy-pieprz'], ['drzewo róż', 'drewno'], ['drewno róż', 'drewno'],
    ['kwiat pomarańcz', 'kwiat-pomaranczy'], ['neroli', 'kwiat-pomaranczy'], ['petitgrain', 'kwiat-pomaranczy'],
    ['skórka pomarańcz', 'pomarancza'], ['kwiat tytoni', 'tyton'], ['liść tytoni', 'tyton'], ['tytoń', 'tyton'],
    ['kwiat bzu', 'bez'], ['bzu', 'bez'], ['lilak', 'bez'],
    ['piżmo cedrowe', 'pizmo'], ['ambrette', 'pizmo'], ['piżmian', 'pizmo'], ['piżm', 'pizmo'],
    ['drewno ambrowe', 'drewno'], ['ambrowe drewno', 'drewno'], ['drzewo ambrowe', 'drewno'], ['amberwood', 'drewno'],
    ['drzewo sandał', 'sandalowiec'], ['sandał', 'sandalowiec'],
    ['drewno wetywer', 'wetyweria'], ['wetyweri', 'wetyweria'],
    ['jałowiec wirginij', 'cedr'], ['drzewo cedr', 'cedr'], ['cedr', 'cedr'],
    ['jałow', 'jalowiec'], ['cade', 'jalowiec'],
    ['sosn', 'sosna'], ['jodł', 'sosna'], ['igliw', 'sosna'],
    ['oud', 'oud'], ['agar', 'oud'],
    ['kadzid', 'kadzidlo'], ['olibanum', 'kadzidlo'], ['elemi', 'kadzidlo'],
    ['benzoin', 'zywice'], ['labdanum', 'zywice'], ['cistus', 'zywice'], ['opoponax', 'zywice'], ['żywic', 'zywice'], ['liquidambar', 'zywice'],
    ['mirr', 'zywice'], ['galbanum', 'zywice'], ['balsam', 'zywice'], ['mastyks', 'zywice'],
    ['ambr', 'ambra'], ['ambergris', 'ambra'], ['bursztyn', 'ambra'],
    ['paczul', 'paczula'],
    ['mech', 'mech'], ['mszyst', 'mech'],
    ['skór', 'skora'], ['zamsz', 'skora'],
    ['wanili', 'wanilia'], ['tonk', 'tonka'], ['kumaryn', 'tonka'],
    ['kakao', 'kakao'], ['pralin', 'kakao'], ['czekolad', 'kakao'], ['kaw', 'kawa'],
    ['karmel', 'karmel'], ['miód', 'miod'], ['miodow', 'miod'],
    ['migdał', 'migdal'], ['orzech', 'orzechy'],
    ['bergamot', 'bergamotka'], ['mandaryn', 'mandarynka'], ['grejpfrut', 'grejpfrut'], ['pomelo', 'grejpfrut'],
    ['limonk', 'limonka'], ['kalamansi', 'limonka'],
    ['cytryn', 'cytryna'], ['cytron', 'cytryna'], ['cytrus', 'cytryna'], ['litsea', 'cytryna'],
    ['pomarańcz', 'pomarancza'],
    ['porzeczk', 'porzeczka'], ['ananas', 'ananas'], ['jabł', 'jablko'], ['grusz', 'gruszka'],
    ['mango', 'mango'], ['marakuj', 'marakuja'], ['egzotyczn', 'marakuja'],
    ['malin', 'malina'], ['agrest', 'agrest'], ['brzoskwin', 'brzoskwinia'], ['morel', 'morela'],
    ['śliwk', 'sliwka'], ['figa', 'figa'], ['figi', 'figa'], ['figow', 'figa'], ['suszone owoce', 'suszone-owoce'], ['daktyl', 'suszone-owoce'],
    ['wiśni', 'wisnia'], ['wiśn', 'wisnia'], ['czereśn', 'wisnia'],
    ['koniak', 'koniak'], ['rumow', 'koniak'], ['rumu', 'koniak'], ['likier', 'koniak'],
    ['irys', 'irys'], ['fioł', 'fiolek'], ['orchid', 'orchidea'], ['mięt', 'mieta'], ['morsk', 'morskie'], ['sól', 'morskie'], ['mineraln', 'morskie'],
    ['herbat', 'herbata'], ['oolong', 'herbata'],
    ['róż', 'roza'], ['pomarose', 'roza'], ['jaśmin', 'jasmin'], ['lawend', 'lawenda'], ['lawandyn', 'lawenda'],
    ['geranium', 'geranium'], ['konwali', 'konwalia'], ['magnoli', 'magnolia'], ['piwoni', 'piwonia'], ['mimoz', 'mimoza'],
    ['osmant', 'osmanthus'], ['gardeni', 'biale-kwiaty'], ['tuberoz', 'biale-kwiaty'], ['kwiat', 'biale-kwiaty'],
    ['szafran', 'szafran'], ['kardamon', 'kardamon'], ['cynamon', 'cynamon'], ['imbir', 'imbir'],
    ['pieprz', 'pieprz'],
    ['rozmaryn', 'ziola'], ['tymian', 'ziola'], ['oregano', 'ziola'], ['szałwi', 'ziola'], ['bazyli', 'ziola'], ['laurow', 'ziola'], ['werben', 'ziola'], ['buchu', 'ziola'],
    ['gałk', 'galka'], ['kolendr', 'kolendra'], ['kurkum', 'kurkuma'],
    ['kmin', 'przyprawy'], ['kumin', 'przyprawy'], ['ziele angielskie', 'przyprawy'],
    ['korzenn', 'przyprawy'], ['przypraw', 'przyprawy'], ['anyż', 'przyprawy'],
    ['drew', 'drewno'], ['drzew', 'drewno'], ['cashmeran', 'drewno'], ['kaszmeran', 'drewno'], ['gwajak', 'drewno'], ['akigalawood', 'drewno'],
    ['georgywood', 'drewno'], ['palo santo', 'drewno'], ['cypriol', 'drewno'],
    ['palisander', 'drewno'], ['dąb', 'drewno'], ['heban', 'drewno'], ['brzoz', 'drewno']
  ];

  // podpisy miniatur (alt i tytuł), w mianowniku, tak jak na etykiecie słoika w pracowni
  var NAZWY = {
    'bergamotka': 'bergamotka', 'cytryna': 'cytryna', 'mandarynka': 'mandarynka', 'grejpfrut': 'grejpfrut',
    'pomarancza': 'pomarańcza', 'porzeczka': 'czarna porzeczka', 'ananas': 'ananas', 'jablko': 'jabłko',
    'marakuja': 'marakuja', 'malina': 'malina', 'brzoskwinia': 'brzoskwinia', 
    'sliwka': 'śliwka', 'wisnia': 'wiśnia', 'mieta': 'mięta', 'morskie': 'sól morska',
    'roza': 'róża', 'jasmin': 'jaśmin', 'kwiat-pomaranczy': 'kwiat pomarańczy', 'lawenda': 'lawenda',
    'irys': 'irys', 'geranium': 'geranium', 'biale-kwiaty': 'białe kwiaty',
    'szafran': 'szafran', 'kardamon': 'kardamon', 'cynamon': 'cynamon', 'imbir': 'imbir',
    'rozowy-pieprz': 'różowy pieprz', 'pieprz': 'czarny pieprz', 'ziola': 'zioła', 'przyprawy': 'przyprawy',
    'paczula': 'paczula', 'wetyweria': 'wetyweria', 'sandalowiec': 'sandałowiec', 'cedr': 'cedr',
    'drewno': 'drewno', 'oud': 'oud', 'kadzidlo': 'kadzidło', 'ambra': 'ambra',
    'zywice': 'żywice', 'pizmo': 'piżmo', 'skora': 'skóra', 'wanilia': 'wanilia',
    'tonka': 'tonka', 'kakao': 'kakao', 'kawa': 'kawa', 'tyton': 'tytoń',
    'mech': 'mech dębowy', 'miod': 'miód',
    'truskawka': 'truskawka', 'karmel': 'karmel', 'mango': 'mango', 'figa': 'figa', 'suszone-owoce': 'suszone owoce',
    'morela': 'morela', 'agrest': 'agrest', 'sosna': 'igliwie', 'jalowiec': 'jałowiec', 'limonka': 'limonka',
    'osmanthus': 'osmantus', 'piwonia': 'piwonia', 'magnolia': 'magnolia', 'mimoza': 'mimoza', 'bez': 'bez',
    'konwalia': 'konwalia', 'galka': 'gałka muszkatołowa', 'kolendra': 'kolendra', 'kurkuma': 'kurkuma',
    'fiolek': 'fiołek', 'gruszka': 'gruszka', 'herbata': 'herbata', 'orchidea': 'orchidea', 'migdal': 'migdał',
    'orzechy': 'orzechy', 'koniak': 'koniak'
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
