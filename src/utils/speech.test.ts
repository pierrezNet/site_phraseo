import { describe, it, expect } from 'vitest'
import { toSpeech, frenchNumber, englishNumber, groupFlightNumber } from './speech'

describe('frenchNumber', () => {
  it.each([
    [0, 'zéro'], [21, 'vingt et un'], [71, 'soixante et onze'], [80, 'quatre-vingts'], [81, 'quatre-vingt-un'],
    [99, 'quatre-vingt-dix-neuf'], [200, 'deux cents'], [210, 'deux cent dix'], [1013, 'mille treize'],
    [2500, 'deux mille cinq cents'], [80000, 'quatre-vingt mille'], [200000, 'deux cent mille'],
  ])('%i → %s', (n, words) => expect(frenchNumber(n)).toBe(words))
})

describe('englishNumber', () => {
  it.each([
    ['1013', 'one zero one tree'], ['2500', 'two thousand fife hundred'], ['10000', 'one zero thousand'],
    ['300', 'tree hundred'], ['90', 'niner zero'], ['0500', 'zero fife zero zero'],
  ])('%s → %s', (n, words) => expect(englishNumber(n)).toBe(words))
})

describe('toSpeech — français', () => {
  const fr = (t: string) => toSpeech(t, 'fr')

  it('langage courant pour altitudes, QNH, pistes et fréquences', () => {
    expect(fr('Montez 2500 pieds, Q_N_H 1013.')).toBe('Montez deux mille cinq cents pieds, cu haine hache mille treize.')
    expect(fr('piste 26 Gauche')).toBe('piste vingt-six Gauche')
    expect(fr('contactez Lille Tour, 118 décimale 7')).toBe('contactez Lille Tour, cent dix-huit décimale sept')
    expect(fr('120 décimale 0_25')).toBe('cent vingt décimale zéro vingt-cinq')
    expect(fr('Information (119.700), 120,775, 121.075')).toBe(
      'Information cent dix-neuf décimale sept, cent vingt décimale sept cent soixante-quinze, cent vingt et un décimale zéro soixante-quinze'
    )
  })

  it('langage courant aussi pour transpondeur, niveau et chiffres à underscores ; zéro initial chiffre par chiffre', () => {
    expect(fr('transpondeur 1000')).toBe('transpondeur mille')
    expect(fr('niveau 110, niveau 1_1_0')).toBe('niveau cent dix, niveau cent dix')
    expect(fr('niveau de transition (6_0)')).toBe('niveau de transition soixante')
    expect(fr('piste 04')).toBe('piste zéro quatre')
  })

  it('cap sur trois chiffres, un par un (manuel DGAC)', () => {
    expect(fr('tournez à droite cap 270')).toBe('tournez à droite cap deux sept zéro')
    expect(fr('cap 60, cap 0_60')).toBe('cap zéro six zéro, cap zéro soixante')
    expect(toSpeech('turn right heading 60', 'en')).toBe('turn right heading zero six zero')
  })

  it('points de report et procédures lus comme des mots', () => {
    expect(fr('départ Bubli_3_Papa, direct BASIP')).toBe('départ Bubli trois Papa, direct Basip')
    expect(fr('autorisé ODILO 1A')).toBe('autorisé Odilo unité Alfa')
    expect(fr('départ MIRGU 7H, direct MIRGU')).toBe('départ Mire-gu sept Hotel, direct Mire-gu')
    expect(toSpeech('departure MIRGU 7H', 'en')).toBe('departure Mirgu seven Hotel')
  })

  it('types d\'avions et mots réécrits pour la voix française', () => {
    expect(fr('derrière un A320 puis l\'Airbus A320')).toBe('derrière un Airbus trois cent vingt puis l\'Airbus trois cent vingt')
    expect(fr('un Boeing 737')).toBe('un Boïngue sept cent trente-sept')
  })

  it('indicatifs et taxiways en alphabet OACI', () => {
    expect(fr('F-EPST, roulez via W41')).toBe('Fox trotte Echo Papa Sierra Tango, roulez via Ouisski quarante et un')
    expect(fr('F S T, rappelez prêt')).toBe('Fox trotte Sierra Tango, rappelez prêt')
    expect(fr('point d\'attente (S A 1)')).toBe('point d\'attente Sierra Alfa unité')
  })

  it('retire notes, balises et entités', () => {
    expect(fr('Roulez {rappel facultatif} <i>vite</i> &amp; bien')).toBe('Roulez vite & bien')
    expect(fr('séparation (1 800) pieds')).toBe('séparation mille huit cents pieds')
  })

  it('« un » en langage courant', () => {
    expect(fr('éloignement 1 minute, numéro 1')).toBe('éloignement une minute, numéro un')
  })

  it('heures', () => {
    expect(fr('il est 15 heures 05')).toBe('il est quinze heures zéro cinq')
    expect(fr('décollage 15_40')).toBe('décollage quinze quarante')
  })
})

describe('toSpeech — anglais', () => {
  const en = (t: string) => toSpeech(t, 'en')

  it('chiffre par chiffre, tree / fife / niner', () => {
    expect(en('squawk 7001, Q_N_H 1013')).toBe('squawk seven zero zero one, Q N H one zero one tree')
    expect(en('climb 2500 feet')).toBe('climb two thousand fife hundred feet')
    expect(en('contact Tower 1_1_8 decimal 9')).toBe('contact Tower one one eight decimal niner')
    expect(en('wind 240 degrees 10 knots, temperature -5')).toBe(
      'wind two four zero degrees one zero knots, temperature minus fife'
    )
  })

  it('« I » reste un pronom, les lettres d’indicatif sont épelées', () => {
    expect(en('F S T, I say again')).toBe('Foxtrot Sierra Tango, I say again')
    expect(en('traffic 11 o\'clock, 4 miles')).toBe('traffic eleven o\'clock, four miles')
    expect(en('make a 360 delaying action, make a 180, level 360')).toBe(
      'make a three-sixty delaying action, make a one-eighty, level tree six zero'
    )
    expect(en('behind A320, departure Bubli_3_Papa')).toBe('behind Airbus tree two zero, departure Bubli tree Papa')
    expect(en('holding point Z, runway 26 Left')).toBe('holding point Zulu, runway two six Left')
  })
})

describe('groupFlightNumber', () => {
  it.each([
    ['Air Europe 012', 'Air Europe 0_12'],
    ['Air France 1234', 'Air France 12_34'],
    ['Air France 123', 'Air France 1_23'],
    ['Air Europe 01', 'Air Europe 01'],
    ['F-EPST', 'F-EPST'],
  ])('%s → %s', (cal, grouped) => expect(groupFlightNumber(cal)).toBe(grouped))

  it('se dit par groupes en français', () => {
    expect(toSpeech(groupFlightNumber('Air Europe 012'), 'fr')).toBe('Air Europe zéro douze')
    expect(toSpeech('(Air France 12_34), roulez', 'fr')).toBe('Air France douze trente-quatre, roulez')
  })
})

describe('routes et C_T_O_T', () => {
  it('route ATS et créneau', () => {
    expect(toSpeech('puis (route) (Upper N 871)', 'fr')).toBe('puis route Upper November huit cent soixante et onze')
    expect(toSpeech('then (Upper N 871)', 'en')).toBe('then Upper November eight seven one')
    expect(toSpeech('C_T_O_T 15_25', 'fr')).toBe('cé té o té quinze vingt-cinq')
  })
})
