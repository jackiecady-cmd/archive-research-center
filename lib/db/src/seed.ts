/**
 * Idempotent seed script for the Archive & Research Center demo dataset.
 * Run via: pnpm --filter @workspace/db run seed
 *
 * Research-integrity rules preserved throughout:
 *  - Catalog records are historical sources, verified by people
 *  - Confidence grades reflect actual evidentiary basis
 */

import { db, collectionsTable, repositoriesTable, sourcesTable } from "./index.js";
import { ensureSeedUser } from "./seed-user.js";
import { evidenceTable } from "./schema/claims.js";
import { savedSourcesTable } from "./schema/projects.js";
import { translationsTable } from "./schema/translations.js";
import { eq, inArray } from "drizzle-orm";

const REMOVED_SOURCE_TITLES = [
  "Ireland Civil Registration Index — Births 1864–1900 (Connacht Province)",
  "Archdiocese of Quebec — Marriage Registers 1621–1800 (PRDH Index)",
  "Mishnah Tractate Sanhedrin 43a — Yeshu and His Disciples",
];

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
    subject: "Parish and civil registers",
    description:
      "Baptismal registers, marriage records, and civil registers kept as historical sources.",
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
      "The Vatican Apostolic Library (Biblioteca Apostolica Vaticana) preserves manuscript, archival, printed, numismatic, and visual collections. This archive stores catalogue links only. It does not reproduce Vatican images or manuscript text.",
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
    language: "English (Whiston, 1737)",
    originalLanguage: "Greek (Koinē)",
    provenance:
      "Transmitted through the medieval manuscript tradition of Josephus. Earliest complete manuscripts date to the 11th century CE. The English is William Whiston's translation, first published in 1737.",
    confidence: "medium",
    chronology:
      "The authenticity of the passage is disputed: most scholars accept a genuine Josephan core substantially modified by later Christian scribes. The original composition dates to c. 93 CE.",
    availability: "public_domain",
    rightsStatement:
      "English: William Whiston, The Works of Flavius Josephus (London: W. Bowyer, 1737), Antiquities 18.3.3. Public domain. Checked against the Whiston text at Perseus. No Loeb text is included.",
    description:
      "The Testimonium Flavianum is the most cited non-Christian reference to Jesus in antiquity. Its current form almost certainly reflects Christian interpolation, but philological and patristic evidence supports the existence of an authentic Josephan core.",
    excerpt:
      "Now there was about this time Jesus, a wise man, if it be lawful to call him a man; for he was a doer of wonderful works, a teacher of such men as receive the truth with pleasure.",
    externalUrl: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0146:book=18:whiston%20chapter=3:whiston%20section=3",
    tags: ["Jesus", "Josephus", "Jewish antiquities", "historical Jesus", "1st century"],
    yearApprox: 93,
  },
  {
    title: "Tacitus, Annals XV.44 — Nero and the Christians",
    sourceType: "primary",
    collectionSlug: "greco-roman",
    author: "Publius Cornelius Tacitus",
    dateLabel: "c. 116–117 CE",
    language: "English (Church and Brodribb, 1876)",
    originalLanguage: "Latin",
    provenance:
      "Transmitted in a single manuscript, the Codex Mediceus II (11th century), held at the Biblioteca Medicea Laurenziana, Florence. The English is the 1876 Church and Brodribb translation.",
    confidence: "high",
    chronology:
      "Written c. 116–117 CE, approximately 80 years after the described events (64 CE fire of Rome). Tacitus is writing as a senator with access to official records.",
    availability: "public_domain",
    rightsStatement:
      "English: Alfred John Church and William Jackson Brodribb, The Annals of Tacitus (London: Macmillan, 1876), book 15, chapter 44. Public domain. Checked against Wikisource.",
    description:
      "Tacitus reports Nero's persecution of Christians as scapegoats for the fire of Rome in 64 CE, providing one of the earliest independent references to the execution of Christ under Pontius Pilate. The passage is universally accepted as authentic.",
    excerpt:
      "Christus, from whom the name had its origin, suffered the extreme penalty during the reign of Tiberius at the hands of one of our procurators, Pontius Pilatus, and a most mischievous superstition, thus checked for the moment, again broke out not only in Judaea, the first source of the evil, but even in Rome, where all things hideous and shameful from every part of the world find their centre and become popular.",
    externalUrl: "https://en.wikisource.org/wiki/The_Annals_(Tacitus)/Book_15#44",
    tags: ["Tacitus", "Roman history", "Christians", "Nero", "Pilate", "1st century"],
    yearApprox: 116,
  },
  {
    title: "Pliny the Younger, Epistulae X.96 — Letter to Trajan on Christians",
    sourceType: "primary",
    collectionSlug: "greco-roman",
    author: "Gaius Caecilius Secundus (Pliny the Younger)",
    dateLabel: "c. 112 CE",
    language: "English (Melmoth, revised by Bosanquet)",
    originalLanguage: "Latin",
    provenance:
      "Transmitted in a collection of Pliny's letters. The earliest manuscripts are 9th–10th century. The English is William Melmoth's translation as revised by F. C. T. Bosanquet.",
    confidence: "high",
    chronology:
      "Written c. 112 CE when Pliny was governor of Bithynia-Pontus under Trajan. Contemporary administrative document. In the standard numbering this is Epistulae 10.96.",
    availability: "public_domain",
    rightsStatement:
      "English: William Melmoth, revised by F. C. T. Bosanquet, Letters of Pliny, the letter to Trajan on Christians. Public domain. Checked against Project Gutenberg eBook 2811. The 1915 Loeb revision by W. M. L. Hutchinson is not used.",
    description:
      "Pliny writes to Emperor Trajan asking for guidance on how to deal with Christians in his province, describing their practices and the challenge of enforcement. One of the earliest external descriptions of Christian worship.",
    excerpt:
      "They affirmed the whole of their guilt, or their error, was, that they met on a stated day before it was light, and addressed a form of prayer to Christ, as to a divinity, binding themselves by a solemn oath, not for the purposes of any wicked design, but never to commit any fraud, theft, or adultery.",
    externalUrl: "https://www.gutenberg.org/ebooks/2811",
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
    language: "English (JPS 1917, Masoretic text)",
    originalLanguage: "Hebrew",
    provenance:
      "Discovered 1947 in Cave 1, Qumran. Now held at the Shrine of the Book, Israel Museum, Jerusalem. The English excerpt is not a translation of the scroll.",
    confidence: "high",
    chronology:
      "Carbon-14 dating places the scroll to c. 335–107 BCE (95% confidence). Palaeographic analysis suggests c. 125–100 BCE for this copy. Editorial note: 1QIsa^a differs in places from the later Masoretic text. Those variant readings are not printed here. The English is the 1917 Jewish Publication Society translation of the Masoretic text of Isaiah 53:1–2.",
    availability: "public_domain",
    rightsStatement:
      "English: The Holy Scriptures According to the Masoretic Text (Philadelphia: The Jewish Publication Society of America, 1917), Isaiah 53:1–2. Public domain. This record does not reproduce images of 1QIsa^a.",
    description:
      "The Great Isaiah Scroll (1QIsa-a) is the best-preserved of the Dead Sea Scrolls and the only complete book of the Hebrew Bible recovered from Qumran. The English supplied here translates the Masoretic text, not the scroll.",
    excerpt:
      "Who would have believed our report? And to whom hath the arm of the Lord been revealed? For he shot up right forth as a sapling, and as a root out of a dry ground.",
    externalUrl: "https://en.wikisource.org/wiki/Bible_(Jewish_Publication_Society_1917)/Isaiah",
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
    title: "Babylonian Talmud (Bavli), Sanhedrin 43a",
    sourceType: "primary",
    collectionSlug: "ecclesiastical",
    author: "Babylonian Talmud (Bavli)",
    dateLabel: "Bavli redaction, c. 500 CE",
    language: "No English included",
    originalLanguage: "Hebrew and Aramaic",
    provenance:
      "This folio belongs to the Babylonian Talmud, not the Mishnah. The usual printed Bavli is the Romm edition (Vilna, 1880–1886). The notice about Yeshu is missing or censored in many printed copies, including printed editions in that tradition, and is preserved in Munich, Bayerische Staatsbibliothek, Cod. hebr. 95.",
    confidence: "medium",
    chronology:
      "Scholars dispute whether 'Yeshu' in this folio is Jesus of Nazareth. No English is printed here.",
    availability: "public_domain",
    rightsStatement:
      "No English rendering is included. A named public-domain English translation that contains this passage was not verified, so the earlier English was removed. Hebrew and Aramaic of the folio are not transcribed here.",
    description:
      "A catalogue reference to Bavli Sanhedrin 43a. The record does not quote the folio in English or in Hebrew.",
    excerpt:
      "No English rendering is included.",
    tags: ["Talmud", "Bavli", "Sanhedrin", "Yeshu", "Jewish sources"],
    yearApprox: 500,
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
      "Original registers held at London Metropolitan Archives, reference P69/BRI2/A/001/MS06540.",
    confidence: "high",
    chronology:
      "Civil registration did not begin in England until 1837. These parish registers are a primary record of 17th-century London parish life.",
    availability: "restricted",
    rightsStatement:
      "Original records © London Metropolitan Archives. Digital images available via FindMyPast subscription. Physical access by appointment.",
    description:
      "Baptismal, marriage, and burial registers for one of the oldest City of London parishes. The registers span the Interregnum, Restoration, and early modern periods and include records of printers, journalists, and Fleet Street tradespeople.",
    excerpt:
      "Entries record forenames, surnames, dates of baptism, and father's name (or mother's name for illegitimate births), sometimes with occupation. Handwriting varies by incumbent.",
    tags: ["London", "baptismal register", "parish records", "17th century"],
    yearApprox: 1676,
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
      "Original schedules held at the National Archives and Records Administration (NARA), Record Group 29. Microfilm publication T9.",
    confidence: "high",
    availability: "public_domain",
    rightsStatement:
      "Original government records in the public domain.",
    description:
      "The 1880 U.S. Federal Census is the first to record the relationship of each household member to the head of household. It also records parents' birthplaces, which historians use to study immigration and household structure.",
    excerpt:
      "Schedule fields: name, relationship to head, sex, race, age, marital status, occupation, birthplace, father's birthplace, mother's birthplace. Disability and illness columns also recorded.",
    externalUrl: "https://www.archives.gov/research/census/1880",
    tags: ["US Census", "1880", "immigration", "household records"],
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
      "The 1911 Census is valuable because householders completed their own returns in their own handwriting, rather than enumerators copying entries. It is also the first to record years married, children born alive, and children still living.",
    excerpt:
      "Schedule includes: name, relationship, age, sex, occupation, birthplace, nationality, infirmity. Married women's fertility question adds: years married, children born alive, children still living.",
    externalUrl: "https://www.findmypast.co.uk/1911census",
    tags: ["England", "Wales", "census 1911", "household records"],
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
      "Original records held by Swedish regional archives (landsarkiv). Digitized by the Church of Sweden and hosted on Arkiv Digital and SVAR (Swedish Archive Image Bank).",
    confidence: "high",
    availability: "restricted",
    rightsStatement:
      "Original records public domain. Digital access via Arkiv Digital subscription or SVAR. Some records freely available via Demografiska databasen (DDB).",
    description:
      "The Swedish household examination records are among the most comprehensive pre-modern population registers in the world. Clergy visited every household annually, recording literacy and religious knowledge alongside demographic data.",
    excerpt:
      "Entries record household by household: head of household, spouse, children, servants; ages; birthplaces; literacy rating; dates of communion; and notations on moves in and out of the parish.",
    externalUrl: "https://www.arkivdigital.net",
    tags: ["Sweden", "household examination", "Lutheran", "Scandinavian records"],
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
      "Biblioteca Apostolica Vaticana, shelfmark Vat.lat.1. Catalogue link only: https://digi.vatlib.it/mss/detail/Vat.lat.1. This record embeds no images and quotes no manuscript text.",
    confidence: "high",
    chronology:
      "The repository catalogue dates the codex to the middle of the fifteenth century.",
    availability: "restricted",
    rightsStatement:
      "Not cleared for publication. A written license from the Vatican Apostolic Library rights office is required before any images or texts from this manuscript are reused. This archive holds a link-only catalogue reference.",
    description:
      "A link-only catalogue reference to a fifteenth-century Latin Bible at the Vatican Apostolic Library. No images and no manuscript text are included.",
    excerpt:
      "Catalogue reference only. No images and no manuscript text are included.",
    externalUrl: "https://digi.vatlib.it/mss/detail/Vat.lat.1",
    tags: ["Vatican Library", "catalogue", "Latin Bible", "manuscript"],
    yearApprox: 1450,
    repositoryAccessStatus: "catalog_only",
    repositoryAccessNote:
      "Link-only catalogue reference. Images and text are not embedded. A written Vatican Library license is required before reuse.",
  },
  {
    title: "Vat.lat.15321 — Vatican Latin Manuscript Catalogue Record",
    sourceType: "primary",
    author: "Unidentified",
    language: "Latin manuscript collection",
    provenance:
      "Biblioteca Apostolica Vaticana, shelfmark Vat.lat.15321. Catalogue link only: https://opac.vatlib.it/mss/detail/Vat.lat.15321. This record embeds no images and quotes no manuscript text.",
    confidence: "high",
    availability: "restricted",
    rightsStatement:
      "Not cleared for publication. A written license from the Vatican Apostolic Library rights office is required before any images or texts from this manuscript are reused. This archive holds a link-only catalogue reference.",
    description:
      "A link-only catalogue reference to Vatican Latin manuscript 15321. No images and no manuscript text are included.",
    excerpt:
      "Catalogue reference only. No images and no manuscript text are included.",
    externalUrl: "https://opac.vatlib.it/mss/detail/Vat.lat.15321",
    tags: ["Vatican Library", "OPAC", "catalogue record", "manuscript"],
    repositoryAccessStatus: "catalog_only",
    repositoryAccessNote:
      "Link-only catalogue reference. Images and text are not embedded. A written Vatican Library license is required before reuse.",
  },
  {
    title: "Barb.lat.4351 — Temporarily Unavailable Manuscript",
    sourceType: "primary",
    author: "Unidentified",
    language: "Latin manuscript collection",
    provenance:
      "Biblioteca Apostolica Vaticana, shelfmark Barb.lat.4351. The shelfmark appears on the Library’s list of manuscripts temporarily unavailable for consultation: https://www.vaticanlibrary.va/en/information-for-readers/unavailable-manuscripts.html. This record embeds no images and quotes no manuscript text.",
    confidence: "high",
    availability: "restricted",
    rightsStatement:
      "Not cleared for publication. A written license from the Vatican Apostolic Library rights office is required before any images or texts from this manuscript are reused. This archive holds a link-only catalogue reference.",
    description:
      "A link-only catalogue reference to Barberini Latin manuscript 4351. The Library lists the shelfmark as temporarily unavailable for consultation. No images and no manuscript text are included.",
    excerpt:
      "Catalogue reference only. No images and no manuscript text are included.",
    externalUrl: "https://opac.vatlib.it/mss/detail/Barb.lat.4351",
    tags: ["Vatican Library", "Barberini Latin", "manuscript", "catalogue"],
    repositoryAccessStatus: "catalog_only",
    repositoryAccessNote:
      "Link-only catalogue reference. Images and text are not embedded. A written Vatican Library license is required before reuse.",
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
      await db.update(collectionsTable).set(col).where(eq(collectionsTable.slug, col.slug));
      console.log(`  – Collection updated: ${col.name}`);
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

  const removed = await db
    .select({ id: sourcesTable.id })
    .from(sourcesTable)
    .where(inArray(sourcesTable.title, REMOVED_SOURCE_TITLES));
  const removedIds = removed.map((row) => row.id);
  if (removedIds.length > 0) {
    await db.delete(savedSourcesTable).where(inArray(savedSourcesTable.sourceId, removedIds));
    await db.delete(evidenceTable).where(inArray(evidenceTable.sourceId, removedIds));
    await db.delete(translationsTable).where(inArray(translationsTable.sourceId, removedIds));
    await db.delete(sourcesTable).where(inArray(sourcesTable.id, removedIds));
    console.log(`  ✔ Removed ${removedIds.length} retired catalog records`);
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
      await db
        .update(sourcesTable)
        .set({
          ...src,
          externalUrl: src.externalUrl ?? null,
          originalLanguage: src.originalLanguage ?? null,
          originalLanguageText: src.originalLanguageText ?? null,
          yearApprox: src.yearApprox ?? null,
          provenance: src.provenance,
          tags: src.tags ?? [],
        })
        .where(eq(sourcesTable.title, src.title));
      console.log(`  – Source updated: ${src.title}`);
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

  await ensureSeedUser();
  console.log("🌱  Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
