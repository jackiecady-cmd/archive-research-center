/**
 * Idempotent seed script for the Archive & Research Center demo dataset.
 * Run via: pnpm --filter @workspace/db run seed
 *
 * Research-integrity rules preserved throughout:
 *  - FamilySearch sources are labeled as LDS-funded
 *  - No DNAGenics sources (those belong to the Genealogy/DNA page only)
 *  - Confidence grades reflect actual evidentiary basis
 */

import { db, collectionsTable, repositoriesTable, sourcesTable } from "./index.js";
import { eq } from "drizzle-orm";

// ── Collections ───────────────────────────────────────────────────────────────

const COLLECTIONS = [
  {
    name: "Greco-Roman Primary Sources",
    slug: "greco-roman",
    subject: "Classical antiquity",
    description:
      "First-century and earlier Greek and Latin documents bearing on the ancient Mediterranean world — papyri, inscriptions, and literary texts in original script.",
    iconLabel: "📜",
    featured: true,
  },
  {
    name: "Ecclesiastical Manuscripts",
    slug: "ecclesiastical",
    subject: "Early Christian and Jewish literature",
    description:
      "Biblical manuscripts, church fathers, rabbinic texts, and Second Temple period writings held in institutional and digital collections.",
    iconLabel: "✝",
    featured: true,
  },
  {
    name: "Parish & Civil Records",
    slug: "parish-civil",
    subject: "Genealogy and demographic history",
    description:
      "Baptismal registers, marriage bonds, burial records, and civil registration indexes from Europe and the Americas.",
    iconLabel: "🗂",
    featured: false,
  },
  {
    name: "Census & Population Registers",
    slug: "census",
    subject: "Demographic and social history",
    description:
      "National census schedules, tax rolls, and household registers from the 19th and early 20th centuries.",
    iconLabel: "📊",
    featured: false,
  },
  {
    name: "Numismatic & Epigraphic Evidence",
    slug: "numismatic",
    subject: "Material culture and epigraphy",
    description:
      "Coin legends, dedicatory inscriptions, and funerary epitaphs as primary evidence for dating, titulature, and religious practice.",
    iconLabel: "🪙",
    featured: false,
  },
];

const REPOSITORIES = [
  {
    name: "Vatican Apostolic Library",
    slug: "vatican-apostolic-library",
    institutionType: "Research library and manuscript repository",
    description:
      "The Vatican Apostolic Library (Biblioteca Apostolica Vaticana) preserves manuscript, archival, printed, numismatic, and visual collections. DigiVatLib provides access to digitized holdings, while the online catalogue also describes material that is not available as digital images.",
    url: "https://www.vaticanlibrary.va/",
  },
];

// ── Sources ───────────────────────────────────────────────────────────────────

const SOURCES = [
  // ── Greco-Roman Primary Sources ──────────────────────────────────────────

  {
    title: "Papyrus Oxyrhynchus 1224 — Gospel Fragment",
    sourceType: "primary",
    collectionSlug: "greco-roman",
    author: "Unknown",
    dateLabel: "c. 300 CE (copy); composition possibly 1st–2nd c.",
    language: "English (translation)",
    originalLanguage: "Greek (Koinē)",
    originalLanguageText:
      "καὶ πρoσελθὼν εἷς τῶν Φαρισαίων ἠρώτα αὐτόν·\nδιδάσκαλε, τί ποιήσας ζωὴν αἰώνιον κληρονομήσω;",
    provenance:
      "Excavated at Oxyrhynchus, Egypt, by Grenfell and Hunt (1897–1907). Now held at the Bodleian Libraries, Oxford. Published in The Oxyrhynchus Papyri, vol. X (1914).",
    confidence: "medium",
    chronology:
      "Palaeographic dating places the copy in the early 4th century CE. The underlying composition may be 1st–2nd century, but the relationship to canonical gospels is debated.",
    availability: "public_domain",
    rightsStatement: "Public domain. Digital images © Bodleian Libraries.",
    description:
      "A fragmentary papyrus preserving uncanonical sayings of Jesus in Greek Koinē. The text overlaps with but diverges from the canonical Synoptic tradition, making it significant for the study of early Christian oral and written transmission.",
    excerpt:
      "A Pharisee approached and asked him: 'Teacher, what must I do to inherit eternal life?' — a question paralleled in the Synoptics but here in a form suggesting independent transmission.",
    externalUrl: "https://www.papyri.info/ddbdp/p.oxy;10;1224",
    tags: ["Jesus", "gospel", "papyrus", "Oxyrhynchus", "early Christianity"],
    yearApprox: 300,
  },
  {
    title: "Josephus, Antiquities of the Jews XVIII.3.3 — Testimonium Flavianum",
    sourceType: "primary",
    collectionSlug: "greco-roman",
    author: "Flavius Josephus",
    dateLabel: "c. 93–94 CE",
    language: "English (translation)",
    originalLanguage: "Greek (Koinē)",
    originalLanguageText:
      "Γίνεται δὲ κατὰ τοῦτον τὸν χρόνον Ἰησοῦς, σοφὸς ἀνήρ, εἴγε ἄνδρα αὐτὸν λέγειν χρή·\nἦν γὰρ παραδόξων ἔργων ποιητής, διδάσκαλος ἀνθρώπων τῶν ἡδονῇ τἀληθῆ δεχομένων.",
    provenance:
      "Transmitted through the medieval manuscript tradition of Josephus. Earliest complete MSS date to the 11th century CE. The Greek text was first critically edited by Niese (1892). The passage is preserved in the Codex Ambrosianus and Codex Florentinus.",
    confidence: "medium",
    chronology:
      "The authenticity of the passage is disputed: most scholars accept a genuine Josephan core substantially modified by later Christian scribes. The original composition dates to c. 93 CE.",
    availability: "public_domain",
    rightsStatement: "Greek text in public domain. Loeb Classical Library translation © Harvard University Press.",
    description:
      "The Testimonium Flavianum is the most cited non-Christian reference to Jesus in antiquity. Its current form almost certainly reflects Christian interpolation, but philological and patristic evidence supports the existence of an authentic Josephan core.",
    excerpt:
      "About this time there lived Jesus, a wise man — if indeed one ought to call him a man. For he was a performer of astonishing deeds, a teacher of people who receive the truth with pleasure.",
    externalUrl: "https://www.perseus.tufts.edu/hopper/text?doc=J.+AJ+18.3.3",
    tags: ["Jesus", "Josephus", "Jewish antiquities", "historical Jesus", "1st century"],
    yearApprox: 93,
  },
  {
    title: "Tacitus, Annals XV.44 — Nero and the Christians",
    sourceType: "primary",
    collectionSlug: "greco-roman",
    author: "Publius Cornelius Tacitus",
    dateLabel: "c. 116–117 CE",
    language: "English (translation)",
    originalLanguage: "Latin",
    originalLanguageText:
      "Ergo abolendo rumori Nero subdidit reos et quaesitissimis poenis adfecit,\nquos per flagitia invisos vulgus Christianos appellabat.\nAuctor nominis eius Christus Tiberio imperitante per procuratorem Pontium Pilatum supplicio adfectus erat.",
    provenance:
      "Transmitted in a single manuscript, the Codex Mediceus II (11th century), held at the Biblioteca Medicea Laurenziana, Florence. First printed edition by Beroaldo (1515). Critical text by Fisher (Oxford, 1906).",
    confidence: "high",
    chronology:
      "Written c. 116–117 CE, approximately 80 years after the described events (64 CE fire of Rome). Tacitus is writing as a senator with access to official records.",
    availability: "public_domain",
    rightsStatement: "Latin text in public domain.",
    description:
      "Tacitus reports Nero's persecution of Christians as scapegoats for the fire of Rome in 64 CE, providing one of the earliest independent references to the execution of Christ under Pontius Pilate. The passage is universally accepted as authentic.",
    excerpt:
      "The founder of this sect, Christus, was executed in the reign of Tiberius by the procurator Pontius Pilate; and the pernicious superstition, suppressed for a time, broke out again — not only through Judaea, but through the city of Rome as well.",
    externalUrl: "https://www.perseus.tufts.edu/hopper/text?doc=Tac.+Ann.+15.44",
    tags: ["Tacitus", "Roman history", "Christians", "Nero", "Pilate", "1st century"],
    yearApprox: 116,
  },
  {
    title: "Pliny the Younger, Epistulae X.96 — Letter to Trajan on Christians",
    sourceType: "primary",
    collectionSlug: "greco-roman",
    author: "Gaius Caecilius Secundus (Pliny the Younger)",
    dateLabel: "c. 112 CE",
    language: "English (translation)",
    originalLanguage: "Latin",
    originalLanguageText:
      "Sollemne est mihi, domine, omnia de quibus dubito ad te referre.\nQuis enim potest melius vel cunctationem meam regere vel ignorantiam instruere?\nCognitioni de Christianis interfui numquam.",
    provenance:
      "Transmitted in a collection of Pliny's letters. Earliest MSS are 9th–10th century. Critical edition by Mynors (Oxford, 1963).",
    confidence: "high",
    chronology:
      "Written c. 112 CE when Pliny was governor of Bithynia-Pontus under Trajan. Contemporary administrative document.",
    availability: "public_domain",
    rightsStatement: "Latin text in public domain.",
    description:
      "Pliny writes to Emperor Trajan asking for guidance on how to deal with Christians in his province, describing their practices and the challenge of enforcement. One of the earliest external descriptions of Christian worship.",
    excerpt:
      "They asserted that the sum of their guilt or error had been this: they were accustomed to meet on a fixed day before dawn and sing responsively a hymn to Christ as to a god.",
    externalUrl: "https://www.perseus.tufts.edu/hopper/text?doc=Plin.+Ep.+10.96",
    tags: ["Pliny", "Roman administration", "early Christianity", "2nd century"],
    yearApprox: 112,
  },

  // ── Ecclesiastical Manuscripts ───────────────────────────────────────────

  {
    title: "Dead Sea Scrolls — Isaiah Scroll (1QIsa-a), Isaiah 53",
    sourceType: "primary",
    collectionSlug: "ecclesiastical",
    author: "Unknown (Qumran scribal community)",
    dateLabel: "c. 125–100 BCE",
    language: "English (translation)",
    originalLanguage: "Hebrew (Biblical)",
    originalLanguageText:
      "מִי הֶאֱמִין לִשְׁמֻעָתֵנוּ וּזְרוֹעַ יְהוָה עַל מִי נִגְלָתָה׃\nוַיַּעַל כַּיּוֹנֵק לְפָנָיו וְכַשֹּׁרֶשׁ מֵאֶרֶץ צִיָּה לֹא תֹאַר לוֹ וְלֹא הָדָר וְנִרְאֵהוּ וְלֹא מַרְאֶה וְנֶחְמְדֵהוּ׃",
    provenance:
      "Discovered 1947 in Cave 1, Qumran. Now held at the Shrine of the Book, Israel Museum, Jerusalem. Among the oldest known manuscripts of the Hebrew Bible, predating the Masoretic Text by approximately 1,000 years.",
    confidence: "high",
    chronology:
      "Carbon-14 dating places the scroll to c. 335–107 BCE (95% confidence). Palaeographic analysis suggests c. 125–100 BCE for composition of this copy.",
    availability: "open_access",
    rightsStatement:
      "Images digitized by the Israel Antiquities Authority and freely available via the Leon Levy Dead Sea Scrolls Digital Library.",
    description:
      "The Great Isaiah Scroll (1QIsa-a) is the best-preserved of all Dead Sea Scrolls and the only complete book of the Hebrew Bible recovered from Qumran. Isaiah 53, the so-called 'Suffering Servant' passage, is central to both Jewish and Christian interpretive traditions.",
    excerpt:
      "Who has believed our report? And to whom has the arm of the LORD been revealed? For he grew up before him like a young plant, and like a root out of dry ground — no form or majesty that we should look at him.",
    externalUrl: "https://www.deadseascrolls.org.il/explore-the-archive/manuscript/1Q8-1",
    tags: ["Dead Sea Scrolls", "Isaiah", "Hebrew Bible", "Qumran", "Old Testament"],
    yearApprox: -100,
  },
  {
    title: "Codex Sinaiticus — New Testament (Matthew 5:3–12, Beatitudes)",
    sourceType: "primary",
    collectionSlug: "ecclesiastical",
    author: "Unknown (scribal team, possibly Caesarea Maritima)",
    dateLabel: "c. 330–360 CE",
    language: "English (translation)",
    originalLanguage: "Greek (Koinē)",
    originalLanguageText:
      "Μακάριοι οἱ πτωχοὶ τῷ πνεύματι, ὅτι αὐτῶν ἐστιν ἡ βασιλεία τῶν οὐρανῶν.\nμακάριοι οἱ πενθοῦντες, ὅτι αὐτοὶ παρακληθήσονται.\nμακάριοι οἱ πραεῖς, ὅτι αὐτοὶ κληρονομήσουσιν τὴν γῆν.",
    provenance:
      "Discovered at St Catherine's Monastery, Sinai, by Constantin von Tischendorf in 1844 and 1859. Portions held at the British Library (347 leaves), Leipzig University Library, National Library of Russia, and St Catherine's Monastery. Fully digitized and available online.",
    confidence: "high",
    chronology:
      "Palaeographic and codicological analysis places composition in the 4th century CE, possibly connected with the Eusebian canon tables production under Constantine.",
    availability: "open_access",
    rightsStatement:
      "Digital images freely available at codexsinaiticus.org. Physical leaves held by four partner institutions.",
    description:
      "Codex Sinaiticus is one of the two oldest complete New Testament manuscripts (with Codex Vaticanus). It is written in Greek Koinē by multiple scribes and contains numerous corrections made by later hands, making it a critical witness to early textual transmission.",
    excerpt:
      "Blessed are the poor in spirit, for theirs is the kingdom of heaven. Blessed are those who mourn, for they will be comforted. Blessed are the meek, for they will inherit the earth.",
    externalUrl: "https://www.codexsinaiticus.org/en/",
    tags: ["Codex Sinaiticus", "New Testament", "Matthew", "Greek manuscript", "4th century"],
    yearApprox: 350,
  },
  {
    title: "Mishnah Tractate Sanhedrin 43a — Yeshu and His Disciples",
    sourceType: "primary",
    collectionSlug: "ecclesiastical",
    author: "Tannaitic tradition (compiled by Rabbi Judah haNasi)",
    dateLabel: "Compiled c. 200 CE; underlying traditions earlier",
    language: "English (translation)",
    originalLanguage: "Hebrew (Mishnaic)",
    originalLanguageText:
      "בְּעֶרֶב פֶּסַח תָּלוּ אֶת יֵשׁוּ. וְהַכָּרוֹז יוֹצֵא לְפָנָיו אַרְבָּעִים יוֹם: יֵשׁוּ יוֹצֵא לִיסָּקֵל עַל שֶׁכִּשֵּׁף וְהֵסִית וְהִדִּיחַ אֶת יִשְׂרָאֵל.",
    provenance:
      "The Mishnah was compiled c. 200 CE in Roman Palestine under Rabbi Judah haNasi. This tractate survives in the Babylonian Talmud redaction (c. 500 CE). The uncensored text is preserved in the Munich Talmud MS (Codex Hebraicus 95, Bayerische Staatsbibliothek).",
    confidence: "medium",
    chronology:
      "The reference to 'Yeshu' is debated: some scholars identify it with Jesus of Nazareth; others argue for a different figure. The censored status of this passage in printed Talmud editions complicates its transmission history.",
    availability: "open_access",
    rightsStatement: "Text in public domain. Digitized Munich Talmud available via the Bayerische Staatsbibliothek.",
    description:
      "A Talmudic passage referring to the execution of 'Yeshu' on the eve of Passover for sorcery and leading Israel astray. The identification with Jesus of Nazareth is contested among scholars. Significant for the study of early Jewish responses to Christianity.",
    excerpt:
      "On the eve of Passover, Yeshu was hanged. The herald went before him for forty days: 'Yeshu is going to be stoned for practising sorcery, inciting and leading Israel astray.'",
    tags: ["Talmud", "Mishnah", "Yeshu", "Jewish sources", "historical Jesus"],
    yearApprox: 200,
    externalUrl: null,
  },
  {
    title: "Eusebius of Caesarea, Historia Ecclesiastica I.1 — Preface",
    sourceType: "scholarship",
    collectionSlug: "ecclesiastical",
    author: "Eusebius of Caesarea",
    dateLabel: "c. 313 CE (final edition)",
    language: "English (translation)",
    originalLanguage: "Greek (Koinē)",
    provenance:
      "Transmitted in Greek manuscript tradition. Earliest MSS 11th century. Critical edition by Schwartz and Mommsen (GCS series, 1903–1909).",
    confidence: "high",
    chronology:
      "The Historia Ecclesiastica went through multiple editions (c. 295–325 CE). Eusebius drew on earlier sources, some of which do not survive independently.",
    availability: "public_domain",
    rightsStatement: "Public domain. NPNF English translation (Schaff, 1890) also in public domain.",
    description:
      "The foundational work of Christian historiography, covering the church from apostolic times to Constantine. Eusebius preserves quotations from earlier sources now lost, making the Historia a critical secondary witness to 1st–3rd century Christianity.",
    excerpt:
      "It is my purpose to write an account of the successions of the holy apostles, as well as of the times which have elapsed from the days of our Saviour to our own — and to relate the many important events which occurred in the history of the Church.",
    externalUrl: "https://www.ccel.org/ccel/schaff/npnf201.iii.html",
    tags: ["Eusebius", "church history", "patristics", "4th century"],
    yearApprox: 313,
  },

  // ── Parish & Civil Records ───────────────────────────────────────────────

  {
    title: "Parish Register of St Bride's, Fleet Street — Baptismal Entries 1653–1700",
    sourceType: "primary",
    collectionSlug: "parish-civil",
    author: "Various parish clergy",
    dateLabel: "1653–1700",
    language: "English",
    provenance:
      "Original registers held at London Metropolitan Archives, reference P69/BRI2/A/001/MS06540. Digitized in partnership with FindMyPast. Microfilm held at the Society of Genealogists, London.",
    confidence: "high",
    chronology:
      "Civil registration did not begin in England until 1837. These parish registers are the primary genealogical source for 17th-century London Nonconformist and Anglican records.",
    availability: "restricted",
    rightsStatement:
      "Original records © London Metropolitan Archives. Digital images available via FindMyPast subscription. Physical access by appointment.",
    description:
      "Baptismal, marriage, and burial registers for one of the oldest City of London parishes. The registers span the Interregnum, Restoration, and early modern periods and include records of printers, journalists, and Fleet Street tradespeople.",
    excerpt:
      "Entries record forenames, surnames, dates of baptism, and father's name (or mother's name for illegitimate births), sometimes with occupation. Handwriting varies by incumbent.",
    tags: ["London", "baptismal register", "parish records", "17th century", "genealogy"],
    yearApprox: 1676,
  },
  {
    title: "Ireland Civil Registration Index — Births 1864–1900 (Connacht Province)",
    sourceType: "primary",
    collectionSlug: "parish-civil",
    author: "General Register Office, Ireland",
    dateLabel: "1864–1900",
    language: "English",
    provenance:
      "Original registers held at the General Register Office, Roscommon, Ireland. Index digitized and hosted by IrishGenealogy.ie (a government service). FamilySearch also holds microfilm copies.",
    confidence: "high",
    availability: "open_access",
    rightsStatement:
      "Crown copyright expired. Index freely searchable at IrishGenealogy.ie. Note: FamilySearch (operated by The Church of Jesus Christ of Latter-day Saints) has digitized complementary microfilm holdings.",
    description:
      "Civil registration of births in Ireland began 1 January 1864. These indexes cover Connacht province (counties Galway, Mayo, Roscommon, Sligo, Leitrim) and are among the most complete sources for post-Famine Irish genealogy.\n\n⚠ FamilySearch note: FamilySearch is funded by The Church of Jesus Christ of Latter-day Saints (LDS/Mormon). The collaborative family tree on FamilySearch.org is user-editable and may contain unsourced claims. Verify all information against primary register images.",
    excerpt:
      "Index entries include: surname, forenames, district, year, and General Register Office reference number. Full register images (mother's maiden name, father's occupation, address) are accessible via the linked record.",
    externalUrl: "https://www.irishgenealogy.ie",
    tags: ["Ireland", "civil registration", "births", "Connacht", "genealogy", "FamilySearch"],
    yearApprox: 1880,
  },
  {
    title: "Archdiocese of Quebec — Marriage Registers 1621–1800 (PRDH Index)",
    sourceType: "primary",
    collectionSlug: "parish-civil",
    author: "Catholic clergy, Parish of Quebec",
    dateLabel: "1621–1800",
    language: "English (index); French (originals)",
    originalLanguage: "French",
    provenance:
      "Original registers held in parish archives and at the Bibliothèque et Archives nationales du Québec (BAnQ). The Programme de recherche en démographie historique (PRDH) at the Université de Montréal has indexed all individuals in New France.",
    confidence: "high",
    availability: "restricted",
    rightsStatement:
      "PRDH database accessible via subscription at prdh-igd.com. BAnQ digital images free for out-of-copyright records.",
    description:
      "The most comprehensive genealogical database for French Canada, covering approximately 700,000 individuals across 200 years of colonial and early provincial Quebec. Marriage acts are the most genealogically complete document type, naming both parents of bride and groom.",
    excerpt:
      "Marriage acts in Quebec typically record: date and parish, full names of bride and groom, names and residences of four parents, and names of witnesses with their relationship to the parties.",
    externalUrl: "https://www.prdh-igd.com",
    tags: ["Quebec", "French Canada", "marriage records", "Catholic", "New France", "genealogy"],
    yearApprox: 1710,
  },

  // ── Census & Population Registers ────────────────────────────────────────

  {
    title: "United States Federal Census 1880 — Full Population Schedule",
    sourceType: "primary",
    collectionSlug: "census",
    author: "United States Bureau of the Census",
    dateLabel: "June 1880",
    language: "English",
    provenance:
      "Original schedules held at the National Archives and Records Administration (NARA), Record Group 29. Microfilm publication T9. Digitized and indexed by Ancestry.com and FamilySearch.\n\n⚠ FamilySearch note: FamilySearch is funded by The Church of Jesus Christ of Latter-day Saints (LDS/Mormon). Index transcriptions may contain errors; always verify against original microfilm images.",
    confidence: "high",
    availability: "public_domain",
    rightsStatement:
      "Original government records in the public domain. Database compilation rights held by Ancestry.com and FamilySearch respectively.",
    description:
      "The 1880 U.S. Federal Census is the first to record the relationship of each household member to the head of household, making it a critical genealogical resource. It also records birthplaces of parents, enabling one-step immigrant identification. Full index freely available on FamilySearch.",
    excerpt:
      "Schedule fields: name, relationship to head, sex, race, age, marital status, occupation, birthplace, father's birthplace, mother's birthplace. Disability and illness columns also recorded.",
    externalUrl: "https://1880census.familysearch.org",
    tags: ["US Census", "1880", "genealogy", "immigration", "household records"],
    yearApprox: 1880,
  },
  {
    title: "England & Wales Census 1911 — Individual Household Returns",
    sourceType: "primary",
    collectionSlug: "census",
    author: "General Register Office, England and Wales",
    dateLabel: "2 April 1911",
    language: "English",
    provenance:
      "Original schedules held at The National Archives, Kew, Record Series RG14. Digitized by FindMyPast in partnership with The National Archives. Available online from 2009 (100-year closure rule).",
    confidence: "high",
    availability: "restricted",
    rightsStatement:
      "Crown copyright expired for 1911 records. Digital images and transcription © FindMyPast / The National Archives. Subscription required for full image access.",
    description:
      "The 1911 Census is uniquely valuable because householders completed their own returns in their own handwriting, rather than enumerators copying entries. It is also the first to record the number of years married, children born alive, and children still living — critical data for reconstructing family structure.",
    excerpt:
      "Schedule includes: name, relationship, age, sex, occupation, birthplace, nationality, infirmity. Married women's fertility question adds: years married, children born alive, children still living.",
    externalUrl: "https://www.findmypast.co.uk/1911census",
    tags: ["England", "Wales", "census 1911", "genealogy", "household records"],
    yearApprox: 1911,
  },
  {
    title: "Swedish Household Examination Records (Husförhörslängder) 1800–1895",
    sourceType: "primary",
    collectionSlug: "census",
    author: "Church of Sweden (Swedish Lutheran parishes)",
    dateLabel: "1800–1895",
    language: "English (index); Swedish (originals)",
    originalLanguage: "Swedish",
    provenance:
      "Original records held by Swedish regional archives (landsarkiv). Digitized by the Swedish Church and hosted on Arkiv Digital and SVAR (Swedish Archive Image Bank). FamilySearch holds microfilm copies.\n\n⚠ FamilySearch note: FamilySearch is funded by The Church of Jesus Christ of Latter-day Saints (LDS/Mormon). Use official Swedish archive sources to verify.",
    confidence: "high",
    availability: "restricted",
    rightsStatement:
      "Original records public domain. Digital access via Arkiv Digital subscription or SVAR. Some records freely available via Demografiska databasen (DDB).",
    description:
      "The Swedish household examination records are among the most comprehensive pre-modern population registers in the world. Clergy visited every household annually, recording literacy levels and religious knowledge alongside demographic data. They form the backbone of Swedish genealogical research.",
    excerpt:
      "Entries record household by household: head of household, spouse, children, servants; ages; birthplaces; literacy rating; dates of communion; and notations on moves in and out of the parish.",
    externalUrl: "https://www.arkivdigital.net",
    tags: ["Sweden", "household examination", "Lutheran", "genealogy", "Scandinavian records"],
    yearApprox: 1850,
  },

  // ── Numismatic & Epigraphic Evidence ─────────────────────────────────────

  {
    title: "Pontius Pilate Inscription (Caesarea Maritima Dedicatory Stone)",
    sourceType: "primary",
    collectionSlug: "numismatic",
    author: "Roman provincial administration",
    dateLabel: "c. 26–37 CE",
    language: "English (translation)",
    originalLanguage: "Latin",
    originalLanguageText:
      "[DIS AUGUSTIS TIBERIÉUM\n[PON]TIUS PILATUS\n[PRAEF]ECTUS IUDA[EA]E\n[FECIT D]E[DICAVIT]",
    provenance:
      "Discovered in 1961 during excavations of the Roman theatre at Caesarea Maritima, Israel, by Italian archaeologist Antonio Frova. Now held at the Israel Antiquities Authority, displayed in the Israel Museum, Jerusalem.",
    confidence: "high",
    chronology:
      "The inscription dates to Pilate's tenure as prefect of Judaea (c. 26–37 CE). It is the only contemporary epigraphic evidence for Pilate's existence and his title (Prefect, not Procurator as earlier tradition held).",
    availability: "open_access",
    rightsStatement:
      "Archaeological find held by the Israel Antiquities Authority. Images in public domain via IAA digital collections.",
    description:
      "The Pilate Stone is the only surviving contemporary archaeological evidence for Pontius Pilate. Discovered during excavations of the Roman theatre at Caesarea Maritima, it confirms his title as Praefectus Iudaeae (Prefect of Judaea). The inscription was originally part of a Tiberieum — a building dedicated to the Emperor Tiberius.",
    excerpt:
      "[To the divine Augusti, the Tiberieum / [Pon]tius Pilate / [Pref]ect of Judae[a] / [had this d]e[dicated]]",
    externalUrl: "https://www.imj.org.il/en/collections/371440",
    tags: ["Pilate", "inscription", "epigraphy", "Caesarea Maritima", "Roman governor", "1st century"],
    yearApprox: 30,
  },
  {
    title: "Ossuary Inscription of James, Son of Joseph, Brother of Jesus",
    sourceType: "primary",
    collectionSlug: "numismatic",
    author: "Unknown (first-century Jerusalem workshop)",
    dateLabel: "1st century CE (contested)",
    language: "English (translation)",
    originalLanguage: "Aramaic",
    originalLanguageText: "יעקוב בר יוסף אחוי דישוע",
    provenance:
      "Acquired on the antiquities market; ownership claimed by Oded Golan, Israel. Announced publicly in 2002. Subject to Israeli forgery trial (2003–2012); Golan acquitted 2012 but authenticity remains disputed among scholars.",
    confidence: "uncertain",
    chronology:
      "The ossuary itself is consistent with 1st-century Jerusalem burial practice. The authenticity of the second part of the inscription ('brother of Jesus') is the point of dispute — some scholars consider it a later addition.",
    availability: "open_access",
    rightsStatement: "Photographs in public domain. Ossuary held privately.",
    description:
      "An Aramaic inscription on a limestone ossuary reading 'James, son of Joseph, brother of Jesus.' If authentic in its entirety, it would be the earliest artifact directly naming Jesus of Nazareth. The scholarly consensus remains divided: the first part of the inscription ('James, son of Joseph') is generally accepted; the second part ('brother of Jesus') is contested.",
    excerpt:
      "Ya'akov bar Yosef akhui di Yeshua — 'James, son of Joseph, brother of Jesus.' The Aramaic inscription is carved in a Jewish cursive script consistent with first-century burial practice in Jerusalem.",
    tags: ["James ossuary", "epigraphy", "Aramaic", "Jerusalem", "1st century", "contested"],
    yearApprox: 62,
  },
  {
    title: "Denarius of Tiberius — 'Tribute Penny' Coinage",
    sourceType: "primary",
    collectionSlug: "numismatic",
    author: "Roman Imperial Mint, Lugdunum (Lyon)",
    dateLabel: "c. 14–37 CE",
    language: "English (translation)",
    originalLanguage: "Latin",
    originalLanguageText:
      "Obverse: TI CAESAR DIVI AVG F AVGVSTVS\nReverse: PONTIF MAXIM",
    provenance:
      "Mass-produced throughout the Empire. Specimens held in collections worldwide including the British Museum (1867,0101.1266), the American Numismatic Society, and the Israel Antiquities Authority.",
    confidence: "high",
    chronology:
      "Minted continuously during Tiberius's reign (14–37 CE). The coin type is the leading candidate for the 'denarius of Caesar' referenced in the Gospels' tribute episode (Matthew 22:15–22 and parallels).",
    availability: "public_domain",
    rightsStatement:
      "Coin images from the British Museum collection available under Creative Commons via the British Museum online collection.",
    description:
      "The silver denarius of Tiberius is the standard identification for the 'tribute penny' of the Gospel accounts. The obverse shows Tiberius's laureate portrait with his name and divine lineage; the reverse identifies him as Pontifex Maximus. Its ubiquity in 1st-century Palestine is confirmed by numismatic finds at Masada, Qumran, and Jerusalem.",
    excerpt:
      "Obverse: TI CAESAR DIVI AVG F AVGVSTVS ('Tiberius Caesar, son of the divine Augustus, Augustus'). Reverse: PONTIF MAXIM ('Pontifex Maximus'). A seated female figure (Livia as Pax) occupies the reverse field.",
    externalUrl: "https://www.britishmuseum.org/collection/object/C_1867-0101-1266",
    tags: ["Tiberius", "denarius", "coinage", "tribute penny", "Roman numismatics", "1st century"],
    yearApprox: 25,
  },
];

const VATICAN_SOURCES = [
  {
    title: "Vat.lat.1 — Biblia (Latin Bible)",
    sourceType: "primary",
    collectionSlug: "ecclesiastical",
    author: "Unknown scribes",
    dateLabel: "Mid-15th century",
    language: "Latin",
    originalLanguage: "Latin",
    provenance:
      "Biblioteca Apostolica Vaticana, shelfmark Vat.lat.1. The DigiVatLib catalogue identifies the manuscript as “Biblia. Latino sec. XV med.” and provides a full BROWSE image viewer: https://digi.vatlib.it/mss/detail/Vat.lat.1",
    confidence: "high",
    chronology:
      "The repository catalogue dates the codex to the middle of the fifteenth century.",
    availability: "open_access",
    rightsStatement:
      "DigiVatLib permits free image use for personal study. Rights must be requested from the Vatican Apostolic Library for use in printed or online publications.",
    description:
      "A fifteenth-century Latin Bible held by the Vatican Apostolic Library, with the codex available for page-by-page study in DigiVatLib.",
    excerpt:
      "Repository record and digitized manuscript images for Vatican Latin shelfmark 1.",
    externalUrl: "https://digi.vatlib.it/view/MSS_Vat.lat.1",
    tags: ["Vatican Library", "DigiVatLib", "Latin Bible", "manuscript", "digitized"],
    yearApprox: 1450,
    repositoryAccessStatus: "digitized",
    repositoryAccessNote:
      "Digitized manuscript: DigiVatLib provides a page-image viewer. Publication and online reproduction require separate permission from the repository.",
  },
  {
    title: "Vat.lat.15321 — Vatican Latin Manuscript Catalogue Record",
    sourceType: "primary",
    author: "Unidentified",
    language: "Latin manuscript collection",
    provenance:
      "Biblioteca Apostolica Vaticana, shelfmark Vat.lat.15321. The official OPAC record provides catalogue metadata and bibliographic references but no DigiVatLib BROWSE link: https://opac.vatlib.it/mss/detail/Vat.lat.15321",
    confidence: "high",
    availability: "restricted",
    rightsStatement:
      "Catalogue metadata is publicly viewable. Consultation or reproduction of the manuscript itself is subject to Vatican Library admission, access, and reproduction policies.",
    description:
      "An official Vatican Library manuscript catalogue record represented here to distinguish discoverable metadata from digitized-manuscript access.",
    excerpt:
      "Catalogue description and bibliography are available online; no manuscript image viewer is linked from the official record.",
    externalUrl: "https://opac.vatlib.it/mss/detail/Vat.lat.15321",
    tags: ["Vatican Library", "OPAC", "catalogue record", "manuscript"],
    repositoryAccessStatus: "catalog_only",
    repositoryAccessNote:
      "Catalog-only record: bibliographic metadata is online, but no DigiVatLib manuscript image viewer is linked from the official OPAC record.",
  },
  {
    title: "Barb.lat.4351 — Temporarily Unavailable Manuscript",
    sourceType: "primary",
    author: "Unidentified",
    language: "Latin manuscript collection",
    provenance:
      "Biblioteca Apostolica Vaticana, shelfmark Barb.lat.4351. The shelfmark appears in the Library’s official “Temporarily unavailable Manuscripts” list, which covers material unavailable for conservation, restoration, or display reasons: https://www.vaticanlibrary.va/en/information-for-readers/unavailable-manuscripts.html",
    confidence: "high",
    availability: "restricted",
    rightsStatement:
      "The manuscript is listed by the Vatican Library as temporarily unavailable for consultation. Any later consultation or reproduction remains subject to repository policies.",
    description:
      "A Barberini Latin manuscript record used to show that an identified holding may be unavailable for consultation even when catalogue discovery remains possible.",
    excerpt:
      "Officially listed as temporarily unavailable for consultation by the Vatican Apostolic Library.",
    externalUrl: "https://opac.vatlib.it/mss/detail/Barb.lat.4351",
    tags: ["Vatican Library", "Barberini Latin", "manuscript", "temporarily unavailable"],
    repositoryAccessStatus: "restricted",
    repositoryAccessNote:
      "Restricted access: the Vatican Library currently lists this shelfmark as temporarily unavailable for conservation, restoration, or display reasons.",
  },
];

// ── Seed runner ───────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱  Starting seed…");

  // Upsert collections
  for (const col of COLLECTIONS) {
    const existing = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, col.slug));
    if (existing.length === 0) {
      await db.insert(collectionsTable).values(col);
      console.log(`  ✔ Collection inserted: ${col.name}`);
    } else {
      console.log(`  – Collection already exists: ${col.name}`);
    }
  }

  for (const repository of REPOSITORIES) {
    const existing = await db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.slug, repository.slug));
    if (existing.length === 0) {
      await db.insert(repositoriesTable).values(repository);
      console.log(`  ✔ Repository inserted: ${repository.name}`);
    } else {
      await db
        .update(repositoriesTable)
        .set(repository)
        .where(eq(repositoriesTable.slug, repository.slug));
      console.log(`  – Repository updated: ${repository.name}`);
    }
  }

  // Upsert sources (keyed by title — safe for a demo dataset)
  for (const src of SOURCES) {
    const existing = await db
      .select()
      .from(sourcesTable)
      .where(eq(sourcesTable.title, src.title));
    if (existing.length === 0) {
      await db.insert(sourcesTable).values({
        ...src,
        externalUrl: src.externalUrl ?? null,
        originalLanguage: src.originalLanguage ?? null,
        originalLanguageText: src.originalLanguageText ?? null,
        yearApprox: src.yearApprox ?? null,
        provenance: src.provenance,
        tags: src.tags ?? [],
      });
      console.log(`  ✔ Source inserted: ${src.title}`);
    } else {
      console.log(`  – Source already exists: ${src.title}`);
    }
  }

  const [vaticanRepository] = await db
    .select()
    .from(repositoriesTable)
    .where(eq(repositoriesTable.slug, "vatican-apostolic-library"));

  if (!vaticanRepository) {
    throw new Error("Vatican Apostolic Library repository was not seeded");
  }

  for (const src of VATICAN_SOURCES) {
    const existing = await db
      .select()
      .from(sourcesTable)
      .where(eq(sourcesTable.title, src.title));
    const values = {
      ...src,
      repositoryId: vaticanRepository.id,
      collectionSlug: "collectionSlug" in src ? src.collectionSlug : null,
      author: src.author ?? null,
      dateLabel: "dateLabel" in src ? src.dateLabel : null,
      language: src.language ?? null,
      originalLanguage: "originalLanguage" in src ? src.originalLanguage : null,
      chronology: "chronology" in src ? src.chronology : null,
      description: src.description ?? null,
      excerpt: src.excerpt ?? null,
      externalUrl: src.externalUrl,
      yearApprox: "yearApprox" in src ? src.yearApprox : null,
    };
    if (existing.length === 0) {
      await db.insert(sourcesTable).values(values);
      console.log(`  ✔ Vatican source inserted: ${src.title}`);
    } else {
      await db
        .update(sourcesTable)
        .set(values)
        .where(eq(sourcesTable.title, src.title));
      console.log(`  – Vatican source updated: ${src.title}`);
    }
  }

  console.log("🌱  Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
