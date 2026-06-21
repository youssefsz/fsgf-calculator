import type { Translations } from "./en"

export const fr: Translations = {
  site: {
    name: "Calculateur de notes FSGF",
    shortName: "Calculatrice FSGF",
    description:
      "Estimez vos moyennes pour la Faculté des Sciences de Gafsa. Moyennes par matière, UE, semestre et année universitaire basées sur les coefficients officiels des plans d'études.",
  },
  nav: {
    calculate: "Calculer",
    programs: "Parcours",
    methodology: "Méthodologie",
    dataStatus: "État des données",
    terms: "Conditions",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    menu: "Menu principal",
  },
  language: {
    label: "Langue",
    en: "English",
    fr: "Français",
    switchTo: "Passer à l'anglais",
  },
  theme: {
    label: "Thème",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
  },
  common: {
    close: "Fermer",
    open: "Ouvrir",
    save: "Enregistrer",
    reset: "Réinitialiser",
    cancel: "Annuler",
    confirm: "Confirmer",
    search: "Rechercher",
    noResults: "Aucun résultat",
    loading: "Chargement…",
    error: "Erreur",
    retry: "Réessayer",
    back: "Retour",
    next: "Suivant",
    done: "Terminé",
    edit: "Modifier",
    remove: "Supprimer",
    optional: "Optionnel",
    unavailable: "Indisponible",
    notApplicable: "N/A",
    estimate: "Estimation",
    disclaimer: "Avertissement",
    source: "Source",
  },
  calculator: {
    title: "Calculateur de notes",
    selectProgram: "Sélectionnez un parcours",
    availablePrograms: "Parcours disponibles",
    unavailablePrograms: "Plans indisponibles",
    searchPlaceholder:
      "Rechercher par code, spécialité, mention ou domaine",
    noResultsTitle: "Aucun parcours correspondant",
    noResultsDescription:
      "Nous n'avons trouvé aucun parcours correspondant à votre recherche. Essayez un autre code, spécialité, mention ou domaine.",
    searchByCode: "Code",
    searchBySpecialty: "Spécialité",
    searchByMention: "Mention",
    searchByDomain: "Domaine",
    noPlan: "Aucun plan d'étude publié",
    noPlanDescription:
      "L'annuaire universitaire répertorie ce parcours mais ne fournit actuellement pas son plan d'études. Vous pouvez toujours consulter ses informations d'annuaire.",
    selectYear: "Année universitaire",
    year: "Année {year}",
    semester: "Semestre {semester}",
    missingSemester: "Le semestre {semester} n'est pas publié pour ce parcours.",
    yearIncomplete:
      "Une seule session de semestre est disponible cette année. La moyenne annuelle ne peut pas être calculée.",
    reviewCurriculum: "Réviser le programme",
    includedUes: "Unités d'enseignement incluses",
    excludedUes: "Unités d'enseignement exclues",
    excludeUe: "Exclure cette unité",
    includeUe: "Inclure cette unité",
    optionalUe: "Choisir une option",
    optionalUeDescription:
      "Plusieurs versions de cette unité sont répertoriées. Sélectionnez celle qui correspond à votre inscription.",
    missingSubjects: "Données sources incomplètes",
    missingSubjectsDescription:
      "Cette unité est publiée sans lignes de matières. Saisissez une note d'unité directe ; le coefficient publié sera toujours utilisé.",
    enterGrades: "Saisir les notes",
    componentMode: "Notes par composante",
    directMode: "Note finale directe",
    switchToDirect: "Je connais la note finale",
    switchToComponents: "Utiliser les composantes",
    exam: "Examen",
    ds: "DS",
    tp: "TP / pratique",
    practicalOther: "Pratique / autre",
    cc: "Contrôle continu",
    finalGrade: "Note finale",
    directGrade: "Note directe",
    ueGrade: "Note UE",
    enterDirectUeGrade: "Saisir la note de l'unité",
    formulaAssumptions: "Hypothèses de calcul",
    formulaDescription:
      "L'application applique des pondérations par défaut courantes selon le régime d'examen. Vous pouvez les ajuster ici ; le total doit être de 100%.",
    formulaTotalError: "Les pondérations doivent totaliser exactement 100%.",
    resetFormula: "Réinitialiser les valeurs",
    results: "Résultats",
    currentEstimate: "Estimation actuelle",
    completeEstimate: "Estimation complète",
    partialEstimate: "Estimation partielle",
    basedOn: "Basé sur {entered} matières sur {total}",
    semesterAverage: "Moyenne du semestre",
    yearAverage: "Moyenne annuelle",
    notYetAvailable: "Pas encore disponible",
    completeAllSubjects:
      "Complétez toutes les matières pour voir la moyenne finale.",
    resetConfirmTitle: "Réinitialiser le calcul ?",
    resetConfirmDescription:
      "Cela effacera toutes les notes saisies et les sélections pour ce parcours. Les données enregistrées sur cet appareil seront supprimées.",
    saveNotice: "La progression est enregistrée automatiquement sur cet appareil.",
    invalidStateRemoved:
      "Les données de calcul enregistrées étaient invalides ou obsolètes et ont été effacées.",
    shareLink: "Copier le lien de partage",
    shareLinkCopied: "Lien de partage copié dans le presse-papiers",
    shareLinkFailed:
      "Impossible de copier le lien. Veuillez le copier depuis la barre d'adresse.",
    sharedFromLink: "Chargé depuis un lien partagé.",
    sharedProgramNotFound:
      "Ce lien partagé pointe vers un parcours indisponible. Sélectionnez un parcours ci-dessous pour continuer.",
  },
  landing: {
    title: "Estimez vos notes FSGF",
    subtitle:
      "Un estimateur de notes gratuit, privé et bilingue pour les étudiants de la Faculté des Sciences de Gafsa.",
    description:
      "Saisissez vos notes par composante ou vos notes finales et obtenez des moyennes estimées par matière, UE, semestre et année universitaire en utilisant les coefficients officiels des plans d'études.",
    howItWorks: "Comment ça marche",
    step1: "Sélectionnez votre parcours",
    step1Description:
      "Recherchez par code de parcours, spécialité, mention ou domaine.",
    step2: "Choisissez votre année",
    step2Description: "Sélectionnez l'année universitaire et les semestres disponibles.",
    step3: "Saisissez les notes",
    step3Description:
      "Utilisez le mode par composante ou saisissez une note finale directe par matière.",
    step4: "Consultez les estimations",
    step4Description:
      "Visualisez les moyennes par matière, UE, semestre et année au fur et à mesure de la saisie.",
    disclaimer:
      "Les résultats calculés sont des estimations à titre indicatif uniquement. Ils ne constituent pas des résultats universitaires officiels et ne déterminent pas la réussite, l'échec, la validation des crédits ou la progression.",
    supportedPrograms: "Parcours pris en charge",
    browsePrograms: "Parcourir tous les parcours",
  },
  programs: {
    title: "Parcours",
    description:
      "Parcourez les parcours pris en charge de la Faculté des Sciences de Gafsa.",
    programPageTitle: "{code} — {specialty}",
    degreeType: "Diplôme",
    domain: "Domaine",
    mention: "Mention",
    specialty: "Spécialité",
    availableYears: "Années disponibles",
    availableSemesters: "Semestres disponibles",
    teachingUnits: "Unités d'enseignement",
    subjects: "Matières",
    coefficients: "Coefficients",
    credits: "Crédits",
    dataSource: "Source des données",
    dataSourceDescription:
      "Les informations sur les parcours proviennent de l'annuaire public des plans d'études de l'université.",
    calculateFor: "Calculer pour ce parcours",
    notAvailable: "Calculateur indisponible",
    notAvailableDescription:
      "Ce parcours n'a pas de plan d'études publié, donc l'estimation des notes n'est pas disponible.",
  },
  methodology: {
    title: "Méthodologie",
    description:
      "Comment les notes sont estimées et pourquoi les résultats ne sont qu'indicatifs.",
    formulas: "Formules par défaut",
    mxWithTp: "MX avec travaux pratiques",
    mxWithTpFormula: "Finale = Examen × 0,70 + DS × 0,20 + TP × 0,10",
    mxWithoutTp: "MX sans travaux pratiques",
    mxWithoutTpFormula: "Finale = Examen × 0,70 + DS × 0,30",
    cc: "Contrôle continu (CC)",
    ccFormula: "Finale = CC principal × 0,80 + pratique/autre × 0,20",
    directGrade: "Note finale directe",
    directGradeDescription:
      "Si vous connaissez déjà la note finale de la matière, si votre faculté utilise une autre répartition, ou s'il s'agit d'un projet, stage, mémoire ou PFE, vous pouvez saisir la note finale directement.",
    averages: "Moyennes",
    ueAverage: "Moyenne d'UE",
    ueAverageFormula:
      "Σ(note finale matière × coefficient matière) ÷ Σ(coefficients des matières incluses)",
    semesterAverage: "Moyenne de semestre",
    semesterAverageFormula:
      "Σ(moyenne UE × coefficient UE) ÷ Σ(coefficients des UE incluses)",
    yearAverage: "Moyenne annuelle",
    yearAverageFormula: "(Semestre A + Semestre B) ÷ 2",
    limitations: "Ce que ce calculateur ne détermine pas",
    limitationsDescription:
      "Le calculateur fournit uniquement des moyennes numériques. Il ne décide pas de la réussite, de la compensation, de la validation des crédits, de la progression ou de tout résultat académique officiel. Référez-vous toujours à l'université pour les décisions officielles.",
  },
  dataStatus: {
    title: "État des données",
    description:
      "Informations sur le jeu de données utilisé par le calculateur et ses limites connues.",
    generatedAt: "Généré le {date}",
    summary: "Résumé",
    totalPrograms: "Parcours au total",
    usablePlans: "Plans d'études utilisables",
    unavailablePlans: "Plans indisponibles",
    totalUnits: "Unités d'enseignement",
    totalSubjects: "Matières",
    sourceInconsistencies: "Incohérences sources connues",
    sourceInconsistenciesDescription:
      "La source publique contient des incohérences qui sont conservées plutôt que corrigées silencieusement. Parmi les exemples : des lignes de matières manquantes pour certaines unités, des valeurs de crédits nulles et des métadonnées de parcours absentes pour les parcours sans plan publié.",
    unavailablePlansDescription:
      "Certains parcours sont répertoriés par l'université mais n'ont actuellement aucun plan d'études publié. Ils restent recherchables et disposent de pages d'information pour que les étudiants sachent qu'ils existent.",
  },
  privacy: {
    title: "Confidentialité",
    description:
      "Comment vos notes et préférences sont traitées par cette application.",
    intro:
      "Cette notice de confidentialité explique quelles informations le Calculateur de notes FSGF traite, comment elles sont stockées et ce qu'il ne fait pas. Nous avons conçu cet outil pour que vos données académiques restent sous votre contrôle.",
    localOnlyTitle: "Tout reste sur votre appareil",
    localOnly:
      "Lorsque vous saisissez des notes, choisissez des unités d'enseignement ou modifiez les pondérations, ces informations sont stockées uniquement dans le localStorage de votre navigateur. Elles ne quittent jamais votre appareil et ne sont jamais envoyées à nos serveurs ni à des tiers.",
    noAccountTitle: "Aucun compte ni synchronisation cloud",
    noAccount:
      "Vous n'avez pas besoin de créer un compte, de vous connecter ou de fournir des informations personnelles. Il n'y a pas de base de données cloud, pas de synchronisation entre appareils et aucun moyen pour nous d'accéder à vos calculs.",
    dataWeCollectTitle: "Données que nous collectons",
    dataWeCollect:
      "Nous ne collectons pas de données personnelles. Le calculateur télécharge les fichiers JSON publics des plans d'études (l'index des programmes et le seul programme que vous sélectionnez) dans votre navigateur afin d'effectuer les calculs localement.",
    localStorageTitle: "Comment fonctionne le localStorage",
    localStorage:
      "Le localStorage est une fonctionnalité standard du navigateur qui permet aux sites web d'enregistrer de petites quantités de données sur votre ordinateur. Vos calculs enregistrés restent disponibles après avoir fermé et rouvert le navigateur, jusqu'à ce que vous les effaciez.",
    clearingDataTitle: "Comment effacer vos données",
    clearing:
      "Vous pouvez supprimer vos calculs enregistrés à tout moment en cliquant sur le bouton Réinitialiser dans le calculateur. Vous pouvez également effacer toutes les données du site pour ce domaine via les paramètres de votre navigateur.",
    analyticsTitle: "Analyse et suivi",
    analytics:
      "La version 1 de cette application n'utilise pas d'outils d'analyse, de traqueurs, de scripts publicitaires ni de cookies. Nous ne suivons pas les programmes que vous consultez ni les notes que vous saisissez.",
    thirdPartiesTitle: "Services tiers",
    thirdParties:
      "Nous n'intégrons pas de widgets tiers, de polices chargées depuis des serveurs externes ni de boutons de réseaux sociaux. Le site est entièrement statique et autonome.",
    changesTitle: "Modifications de cette notice",
    changes:
      "Si nous ajoutons ultérieurement des fonctionnalités qui modifient la gestion des données, nous mettrons à jour cette notice et décrirons clairement les changements.",
    questionsTitle: "Questions",
    questions:
      "Si vous avez des questions sur cette notice de confidentialité ou sur le calculateur, vous pouvez inspecter le code source ou contacter les mainteneurs du projet.",
  },
  footer: {
    privacy: "Confidentialité",
    terms: "Conditions d'utilisation",
    openSource: "Projet open-source",
    sourceCode: "Code source",
    createdBy: "Créé par",
    notOfficial:
      "Ce n'est pas un site officiel de l'université. Il est construit à partir de données accessibles publiquement sur",
    rights: "Tous droits réservés.",
  },
  terms: {
    title: "Conditions d'utilisation",
    description:
      "Conditions régissant l'utilisation du Calculateur de notes FSGF.",
    intro:
      "En accédant au Calculateur de notes FSGF ou en l'utilisant, vous acceptez les présentes conditions. Veuillez les lire attentivement.",
    acceptanceTitle: "Acceptation des conditions",
    acceptance:
      "En utilisant cette application, vous reconnaissez avoir lu, compris et accepté d'être lié par ces conditions. Si vous n'êtes pas d'accord, veuillez cesser d'utiliser l'application.",
    purposeTitle: "Objet de l'application",
    purpose:
      "Le Calculateur de notes FSGF est un outil gratuit et open-source créé par Youssef Dhibi pour aider les étudiants de la Faculté des Sciences de Gafsa à estimer leurs moyennes académiques. Il utilise des données accessibles publiquement depuis parcours-lmd.salima.tn pour effectuer des calculs locaux dans votre navigateur.",
    notOfficialTitle: "Pas un site officiel de l'université",
    notOfficial:
      "Cette application n'est pas affiliée, approuvée ou connectée à la Faculté des Sciences de Gafsa ou à toute institution universitaire. C'est un projet open-source indépendant construit à partir de données accessibles publiquement.",
    noGuaranteeTitle: "Aucune garantie d'exactitude",
    noGuarantee:
      "Les résultats produits par ce calculateur sont des estimations à titre indicatif uniquement. Ils ne constituent pas des résultats académiques officiels et ne doivent pas servir de base pour les décisions de réussite, d'échec, de validation de crédits ou de progression académique. Référez-vous toujours à l'université pour les résultats officiels.",
    dataPrivacyTitle: "Données et confidentialité",
    dataPrivacy:
      "Tous les calculs et préférences sont stockés localement sur votre appareil. Nous ne collectons pas de données personnelles, ne requérons pas de compte et ne transmettons pas vos notes à un serveur. Pour plus de détails, consultez notre notice de confidentialité.",
    intellectualPropertyTitle: "Propriété intellectuelle",
    intellectualProperty:
      "C'est un projet open-source. Le code source est disponible pour inspection et contribution. Le design, le code et le contenu sont protégés par les lois applicables en matière de propriété intellectuelle. Vous pouvez reproduire, distribuer ou créer des œuvres dérivées tel que permis par la licence open source applicable au code source.",
    limitationsTitle: "Limitation de responsabilité",
    limitations:
      "L'application est fournie « en l'état » sans garanties d'aucune sorte. Le créateur ne sera pas responsable des dommages directs, indirects, accessoires ou consécutifs résultant de votre utilisation ou de votre incapacité à utiliser l'application.",
    changesTitle: "Modifications de ces conditions",
    changes:
      "Nous nous réservons le droit de mettre à jour ou de modifier ces conditions à tout moment. L'utilisation continue de l'application après la publication des modifications constitue l'acceptation des conditions révisées.",
    contactTitle: "Contact",
    contact:
      "Si vous avez des questions concernant ces conditions, vous pouvez inspecter le code source ou contacter le créateur sur youssef.tn.",
  },
  notFound: {
    title: "Page introuvable",
    description:
      "La page que vous recherchez n'existe pas ou a été déplacée.",
    backHome: "Retour à l'accueil",
  },
  seo: {
    defaultTitle: "Calculateur de notes FSGF",
    titleTemplate: "{title} | Calculateur de notes FSGF",
  },
} as const
