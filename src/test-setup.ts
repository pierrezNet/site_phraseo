// Tests écrits en français : navigateur simulé en français (jsdom annonce en-US),
// d'où une interface et des échanges en français par défaut
Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true })
