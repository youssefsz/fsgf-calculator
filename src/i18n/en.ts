export const en = {
  site: {
    name: "FSGF Grade Calculator",
    shortName: "FSGF Calculator",
    description:
      "Estimate your averages for the Faculté des Sciences de Gafsa. Subject, UE, semester, and academic-year estimates based on official study-plan coefficients.",
  },
  nav: {
    programs: "Programs",
    methodology: "Methodology",
    dataStatus: "Data status",
    privacy: "Privacy",
  },
  language: {
    label: "Language",
    en: "English",
    fr: "Français",
    switchTo: "Switch to French",
  },
  theme: {
    label: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  common: {
    close: "Close",
    open: "Open",
    save: "Save",
    reset: "Reset",
    cancel: "Cancel",
    confirm: "Confirm",
    search: "Search",
    noResults: "No results",
    loading: "Loading…",
    error: "Error",
    retry: "Retry",
    back: "Back",
    next: "Next",
    done: "Done",
    edit: "Edit",
    remove: "Remove",
    optional: "Optional",
    unavailable: "Unavailable",
    notApplicable: "N/A",
    estimate: "Estimate",
    disclaimer: "Disclaimer",
    source: "Source",
  },
  calculator: {
    title: "Grade calculator",
    selectProgram: "Select a program",
    availablePrograms: "Available programs",
    unavailablePrograms: "Unavailable plans",
    searchPlaceholder: "Search by code, specialty, mention, or domain",
    noResultsTitle: "No matching programs",
    noResultsDescription:
      "We couldn't find a program matching your search. Try a different code, specialty, mention, or domain.",
    searchByCode: "Code",
    searchBySpecialty: "Specialty",
    searchByMention: "Mention",
    searchByDomain: "Domain",
    noPlan: "No published study plan",
    noPlanDescription:
      "The university directory lists this program but does not currently provide its study plan. You can still view its directory information.",
    selectYear: "Academic year",
    year: "Year {year}",
    semester: "Semester {semester}",
    missingSemester: "Semester {semester} is not published for this program.",
    yearIncomplete:
      "Only one semester is available for this year. The yearly average cannot be calculated.",
    reviewCurriculum: "Review curriculum",
    includedUes: "Included teaching units",
    excludedUes: "Excluded teaching units",
    excludeUe: "Exclude this unit",
    includeUe: "Include this unit",
    optionalUe: "Choose an option",
    optionalUeDescription:
      "Several versions of this unit are listed. Select the one that applies to your enrollment.",
    missingSubjects: "Incomplete source data",
    missingSubjectsDescription:
      "This unit is published without subject rows. Enter a direct unit grade and the published coefficient will still be used.",
    enterGrades: "Enter grades",
    componentMode: "Component grades",
    directMode: "Direct final grade",
    switchToDirect: "I know the final grade",
    switchToComponents: "Use components",
    exam: "Exam",
    ds: "DS",
    tp: "TP / practical",
    practicalOther: "Practical / other",
    cc: "Continuous assessment",
    finalGrade: "Final grade",
    directGrade: "Direct grade",
    ueGrade: "UE grade",
    enterDirectUeGrade: "Enter unit grade",
    formulaAssumptions: "Calculation assumptions",
    formulaDescription:
      "The application applies common default weights based on the exam regime. You can adjust them here; the total must equal 100%.",
    formulaTotalError: "Weights must total exactly 100%.",
    resetFormula: "Reset defaults",
    results: "Results",
    currentEstimate: "Current estimate",
    completeEstimate: "Complete estimate",
    partialEstimate: "Partial estimate",
    basedOn: "Based on {entered} of {total} subjects",
    semesterAverage: "Semester average",
    yearAverage: "Academic-year average",
    notYetAvailable: "Not yet available",
    completeAllSubjects: "Complete all subjects to see the final average.",
    resetConfirmTitle: "Reset calculation?",
    resetConfirmDescription:
      "This will clear all entered grades and selections for this program. Saved data on this device will be removed.",
    saveNotice: "Progress is saved automatically on this device.",
    invalidStateRemoved:
      "Saved calculation data was invalid or outdated and has been cleared.",
  },
  landing: {
    title: "Estimate your FSGF grades",
    subtitle:
      "A free, private, bilingual grade estimator for students of the Faculté des Sciences de Gafsa.",
    description:
      "Enter your component or final grades and get estimated subject, teaching-unit, semester, and academic-year averages using the official study-plan coefficients.",
    howItWorks: "How it works",
    step1: "Select your program",
    step1Description:
      "Search by program code, specialty, mention, or domain.",
    step2: "Choose your year",
    step2Description: "Pick the academic year and available semesters.",
    step3: "Enter grades",
    step3Description:
      "Use component mode or enter a direct final grade per subject.",
    step4: "Review estimates",
    step4Description:
      "See subject, UE, semester, and yearly estimates as you type.",
    disclaimer:
      "Calculated results are estimates for personal reference only. They are not official university results and do not determine pass/fail, credit validation, or progression decisions.",
    supportedPrograms: "Supported programs",
    browsePrograms: "Browse all programs",
  },
  programs: {
    title: "Programs",
    description:
      "Browse the supported programs from the Faculté des Sciences de Gafsa.",
    programPageTitle: "{code} — {specialty}",
    degreeType: "Degree",
    domain: "Domain",
    mention: "Mention",
    specialty: "Specialty",
    availableYears: "Available years",
    availableSemesters: "Available semesters",
    teachingUnits: "Teaching units",
    subjects: "Subjects",
    coefficients: "Coefficients",
    credits: "Credits",
    dataSource: "Data source",
    dataSourceDescription:
      "Program information is derived from the public university study-plan directory.",
    calculateFor: "Calculate for this program",
    notAvailable: "Calculator unavailable",
    notAvailableDescription:
      "This program does not have a published study plan, so grade estimation is not available.",
  },
  methodology: {
    title: "Methodology",
    description:
      "How grades are estimated and why the results are for guidance only.",
    formulas: "Default formulas",
    mxWithTp: "MX with practical work",
    mxWithTpFormula: "Final = Exam × 0.70 + DS × 0.20 + TP × 0.10",
    mxWithoutTp: "MX without practical work",
    mxWithoutTpFormula: "Final = Exam × 0.70 + DS × 0.30",
    cc: "Continuous assessment (CC)",
    ccFormula: "Final = Primary CC × 0.80 + practical/other × 0.20",
    directGrade: "Direct final grade",
    directGradeDescription:
      "If you already know the final subject grade, your faculty uses a different split, or the subject is a project, internship, thesis, or PFE, you can enter the final grade directly.",
    averages: "Averages",
    ueAverage: "UE average",
    ueAverageFormula:
      "Σ(subject final grade × subject coefficient) ÷ Σ(included subject coefficients)",
    semesterAverage: "Semester average",
    semesterAverageFormula:
      "Σ(UE average × UE coefficient) ÷ Σ(included UE coefficients)",
    yearAverage: "Academic-year average",
    yearAverageFormula: "(Semester A + Semester B) ÷ 2",
    limitations: "What this calculator does not determine",
    limitationsDescription:
      "The calculator gives numeric averages only. It does not decide pass/fail, compensation, credit validation, progression, or any official academic outcome. Always refer to the university for official decisions.",
  },
  dataStatus: {
    title: "Data status",
    description:
      "Information about the dataset used by the calculator and its known limitations.",
    generatedAt: "Generated on {date}",
    summary: "Summary",
    totalPrograms: "Total programs",
    usablePlans: "Usable study plans",
    unavailablePlans: "Unavailable plans",
    totalUnits: "Teaching units",
    totalSubjects: "Subjects",
    sourceInconsistencies: "Known source inconsistencies",
    sourceInconsistenciesDescription:
      "The public source contains inconsistencies that are preserved rather than silently corrected. Examples include missing subject rows for some teaching units, null credit values, and missing program metadata for programs without published plans.",
    unavailablePlansDescription:
      "Some programs are listed by the university but currently have no published study plan. They remain searchable and have informational pages so students know they exist.",
  },
  privacy: {
    title: "Privacy",
    description:
      "How your grades and preferences are handled by this application.",
    intro:
      "This privacy notice explains what information the FSGF Grade Calculator processes, how it is stored, and what it does not do. We built this tool to keep your academic data under your control.",
    localOnlyTitle: "Everything stays on your device",
    localOnly:
      "When you enter grades, choose teaching units, or adjust formula weights, that information is stored only in your browser's localStorage. It never leaves your device and is never sent to our servers or any third party.",
    noAccountTitle: "No account or cloud sync",
    noAccount:
      "You do not need to create an account, log in, or provide any personal information. There is no cloud database, no synchronization between devices, and no way for us to access your calculations.",
    dataWeCollectTitle: "Data we collect",
    dataWeCollect:
      "We do not collect personal data. The calculator downloads public study-plan JSON files (the program index and the single program you select) to your browser so it can perform calculations locally.",
    localStorageTitle: "How localStorage works",
    localStorage:
      "localStorage is a standard browser feature that lets websites save small amounts of data on your computer. Your saved calculations remain available when you close and reopen the browser, until you clear them.",
    clearingDataTitle: "How to clear your data",
    clearing:
      "You can delete your saved calculations at any time by clicking the Reset button inside the calculator. You can also clear all site data for this domain through your browser's settings.",
    analyticsTitle: "Analytics and tracking",
    analytics:
      "Version 1 of this application does not use analytics, trackers, advertising scripts, or cookies. We do not track which programs you view or what grades you enter.",
    thirdPartiesTitle: "Third-party services",
    thirdParties:
      "We do not embed third-party widgets, fonts loaded from external servers, or social media buttons. The site is fully static and self-contained.",
    changesTitle: "Changes to this notice",
    changes:
      "If we later add features that change how data is handled, we will update this notice and describe the changes clearly.",
    questionsTitle: "Questions",
    questions:
      "If you have questions about this privacy notice or the calculator, you can inspect the source code or contact the project maintainers.",
  },
  seo: {
    defaultTitle: "FSGF Grade Calculator",
    titleTemplate: "{title} | FSGF Grade Calculator",
  },
} as const

type Stringify<T> = T extends string ? string : { [K in keyof T]: Stringify<T[K]> }

export type Translations = Stringify<typeof en>
