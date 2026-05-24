export interface Aarti {
  id: string;
  title: { en: string; hi: string };
  category: "morning" | "evening" | "prayer" | "mantra";
  pdfUrl?: string;
  lyrics: { en: string; hi: string };
}

export const aartis: Aarti[] = [
  {
    id: "mangala-aarti",
    title: { en: "Mangala Aarti (Sri Sri Gurvastakam)", hi: "मंगल आरती (श्री श्री गुर्वष्टकम्)" },
    category: "morning",
    lyrics: {
      en: `1. samsara-davanala-lidha-loka-
tranaya karunya-ghanaghanatvam
praptasya kalyana-gunarnavasya
vande guroh sri-caranaravindam

2. mahaprabhoh kirtana-nrtya-gita-
vaditra-madyan-manaso rasena
romanca-kampasru-taranga-bhajo
vande guroh sri-caranaravindam

3. sri-vigraharadhana-nitya-nana-
srngara-tan-mandira-marjanadau
yuktasya bhaktams ca niyunjato pi
vande guroh sri-caranaravindam

4. catur-vidha-sri-bhagavat-prasada-
svadv-anna-trptan hari-bhakta-sanghan
krtvaiva trptim bhajatah sadaiva
vande guroh sri-caranaravindam

5. sri-radhika-madhavayor apara-
madhurya-lila guna-rupa-namnam
prati-ksanasvadana-lolupasya
vande guroh sri-caranaravindam

6. nikunja-yuno rati-keli-siddhyai
ya yalibhir yuktir apekshaniya
tatrati-dakshyad ati-vallabhasya
vande guroh sri-caranaravindam

7. sakshad-dharitvena samasta-sastrair
uktas tatha bhavyata eva sadbhih
kintu prabhor yah priya eva tasya
vande guroh sri-caranaravindam

8. yasya prasadad bhagavat-prasado
yasyaprasadan na gatih kuto 'pi
dhyayan stuvams tasya yasas tri-sandhyam
vande guroh sri-caranaravindam`,
      hi: `१. संसार-दावानल-लीढ-लोक-
त्राणाय कारुण्य-घनाघनत्वम्।
प्राप्तस्य कल्याण-गुणार्णवस्य
वन्दे गुरोः श्री-चरणारविन्दम्।।

२. महाप्रभोः कीर्तन-नृत्य-गीत-
वादित्र-माद्यन्-मनसो रसेन।
रोमांच-कम्पाश्रु-तरंग-भाजो
वन्दे गुरोः श्री-चरणारविन्दम्।।

३. श्री-विग्रहाराधन-नित्य-नाना-
श्रृंगार-तन्-मन्दिर-मार्जनादौ।
युक्तस्य भक्तांश्च नियुञ्जतोऽपि
वन्दे गुरोः श्री-चरणारविन्दम्।।

४. चतुर्विध-श्री-भगवत्-प्रसाद-
स्वाद्वन्न-तृप्तान् हरि-भक्त-संघान्।
कृत्वैव तृप्तिं भजतः सदैव
वन्दे गुरोः श्री-चरणारविन्दम्।।

५. श्री-राधिका-माधवायोरपार-
माधुर्य-लीला गुण-रूप-नाम्नाम्।
प्रतिक्षणास्वादन-लोलुपस्य
वन्दे गुरोः श्री-चरणारविन्दम्।।

६. निकुञ्ज-यूनो रति-केलि-सिद्ध्यै
या यालिभिर्युक्तिरपेक्षणीया।
तत्राति-दाक्ष्यादति-वल्लभस्य
वन्दे गुरोः श्री-चरणारविन्दम्।।

७. साक्षाद्धरित्वेन समस्त-शास्त्रै-
रुक्तस्तथा भाव्यत एव सद्भिः।
किन्तु प्रभोर्यः प्रिय एव तस्य
वन्दे गुरोः श्री-चरणारविन्दम्।।

८. यस्य प्रसादाद्भगवत्-प्रसादो
यस्याप्रसादान्न गतिः कुतोऽपि।
ध्यायन् स्तुवंस्तस्य यशस्त्रि-सन्ध्यं
वन्दे गुरोः श्री-चरणारविन्दम्।।`,
    },
  },
  {
    id: "tulsi-aarti",
    title: { en: "Sri Tulasi Aarti", hi: "श्री तुलसी आरती" },
    category: "morning",
    lyrics: {
      en: `1. namo namah tulasi! krsna-preyasi
radha-krsna-seva pabo ei abhilasi
je tomara sarana loy, tara vancha purna hoy
krpa kori' koro tare vrndavana-vasi

2. mora ei abhilsa, vilasa kunje dio vasa
nayana heribo sada jugala-rupa-rasi
ei nivedana dhara, sakhir anugata koro
seva-adhikara diye koro nija dasi

3. dina krsna-dase koy, ei jena mora hoy
sri-radha-govinda-preme sada jena bhasi

4. yani kani ca papani brahma-hatyadikani ca
tani tani pranasyanti pradaksinah pade pade`,
      hi: `१. नमो नमः तुलसी! कृष्ण-प्रेयसि
राधा-कृष्ण-सेवा पाबो एइ अभिलाषी
जे तोमार शरण लय, तार वांछा पूर्ण होय,
कृपा करि' करो तारे वृन्दावन-वासी।।

२. मोर एइ अभिलाष, विलास कुंजे दिओ वास
नयने हेरिबो सदा युगल-रूप-राशि
एइ निवेदन धर, सखीर अनुगत कर
सेवा-अधिकार दिये कर निज दासी।।

३. दीन कृष्ण-दासे कय, एइ जेन मोर होय
श्री-राधा-गोविन्द-प्रेमे सदा जेन भासी।।

४. यानि कानि च पापानि ब्रह्म-हत्यादिकानि च।
तानि तानि प्रणश्यन्ति प्रदक्षिणः पदे पदे।।`,
    },
  },
  {
    id: "guru-puja",
    title: { en: "Guru Puja (Sri Guru-vandana)", hi: "गुरु पूजा (श्री गुरु वंदना)" },
    category: "morning",
    lyrics: {
      en: `1. sri-guru-carana-padma, kevala-bhakati-sadma,
bando mui savadhana mate
jahara prasade bhai, e bhava toriya jai,
krsna-prapti hoy jaha ha'te

2. guru-mukha-padma-vakya, cittete koriya aikya,
ar na koriho mane asa
sri-guru-carane rati, ei se uttama-gati,
je prasade pure sarva asa

3. cakhu-dan dilo jei, janme janme prabhu sei,
divya jnan hrde prokasito
prema-bhakti jaha hoite, avidya vinasa jate,
vede gay jahara carito

4. sri-guru karuna-sindhu, adhama janara bandhu,
lokanath lokera jivana
ha ha prabhu koro doya, deho more pada-chaya,
ebe jasa ghusuk tribhuvana`,
      hi: `१. श्री गुरु चरण पद्म, केवल भक्ति सद्म,
बंदों मुई सावधान मते।
जाहार प्रसादे भाई, ए भव तरिया जाई,
कृष्ण प्राप्ति होय जाहा हाते।।

२. गुरु मुख पद्म वाक्य, चित्तेते करिया ऐक्य,
आर ना करिहो मने आशा।
श्री गुरु चरणे रति, एइ से उत्तम-गति,
जे प्रसादे पूरे सर्व आशा।।

३. चक्षु-दान दिलो जेई, जन्मे जन्मे प्रभु सेई,
दिव्य ज्ञान हृदे प्रकाशितो।
प्रेम-भक्ति जाहा हइते, अविद्या विनाश जाते,
वेदे गाय जाहार चरितो।।

४. श्री-गुरु करुणा-सिन्धु, अधम जनर बन्धु,
लोकनाथ लोकेर जीवन।
हा हा प्रभु करो दया, देहो मोरे पद-छाया,
एबे यश घोषुक त्रिभुवन।।`,
    },
  },
  {
    id: "gaura-aarti",
    title: { en: "Sri Gaura Aarti", hi: "श्री गौर आरती" },
    category: "evening",
    lyrics: {
      en: `1. jaya jaya gauracander aratiko sobha
jahnavi-tata-vane jaga-mana-lobha
(jaya) gauranger arotik sobha jaga-jana-mana-lobha

2. dakhine nitaicand, bame gadadhara
nikate advaita, srinivasa chatra-dhara

3. bosiyache gauracand ratna-simhasane
arati koren brahma-adi deva-gane

4. narahari-adi kori' camara dhulaya
sanjaya-mukunda-vasu-ghosh-adi gaya

5. sankha baje ghanta baje baje karatala
madhura mrdanga baje parama rasala

6. bahu-koti candra jini' vadana ujjvala
gala-dese vana-mala kore jhalamala

7. siva-suka-narada preme gada-gada
bhakativinoda dekhe gorara sampada`,
      hi: `१. जय जय गौरचाँदेर आरतिको शोभा,
जाह्नवी-तट-वने जग-मन-लोभा।
(जय) गौरांगेर आरतिक शोभा जग-जन-मन-लोभा।।

२. दक्षिणे निताईचाँद, वामे गदाधर,
निकटे अद्वैत, श्रीनिवास छत्र-धर।।

३. बसियाछे गौरचाँद रत्न-सिंहासने,
आरती करेन ब्रह्मा-आदि देव-गणे।।

४. नरहरि-आदि करि' चामर ढुलाय,
संजय-मुकुन्द-वासु-घोष-आदि गाय।।

५. शंख बाजे घण्टा बाजे बाजे करताल,
मधुर मृदंग बाजे परम रसाल।।

६. बहु-कोटि चन्द्र जिनि' वदन उज्ज्वल,
गल-देशे वन-माला करे झलमल।।

७. शिव-शुक-नारद प्रेमे गद-गद,
भकतिविनोद देखे गोरार सम्पद।।`,
    },
  },
  {
    id: "narsimha-aarti",
    title: { en: "Sri Narasimha Pranama", hi: "श्री नृसिंह प्रणाम" },
    category: "prayer",
    lyrics: {
      en: `1. namaste narasimhaya, prahladahlada-dayine
hiranyakasipor vaksah-sila-tanka-nakhalaye

2. ito nrsimhah parato nrsimho, yato yato yami tato nrsimhah
bahir nrsimho hrdaye nrsimho, nrsimham adim saranam prapadye

3. tava kara-kamala-vare nakham adbhuta-srngam
dalita-hiranyakasipu-tanu-bhrngam
kesava dhrta-narahari-rupa jaya jagadisa hare`,
      hi: `१. नमस्ते नरसिंहाय, प्रह्लादाह्लाद-दायिने।
हिरण्यकशिपोर्वक्षः-शिला-टंक-नखालये।।

२. इतो नृसिंहः परतो नृसिंहो, यतो यतो यामि ततो नृसिंहः।
बहिर्नृसिंहो हृदये नृसिंहो, नृसिंहमादिं शरणं प्रपद्ये।।

३. तव कर-कमल-वरे नखम् अद्भुत-शृंगम्
दलित-हिरण्यकशिपु-तनु-भृंगम्
केशव धृत-नरहरि-रूप जय जगदीश हरे।।`,
    },
  },
  {
    id: "damodar-aarti",
    title: { en: "Sri Damodarastakam", hi: "श्री दामोदराष्टकम्" },
    category: "evening",
    lyrics: {
      en: `1. namamisvaram sac-cid-ananda-rupam
lasat-kundalam gokule bhrajamanam
yasoda-bhiyolukhalad dhavamanam
paramrstam atyantato drutya gopya

2. rudantam muhur netra-yugmam mrjantam
karambhoja-yugmena satanka-netram
muhuh svasa-kampa-trirekhanka-kantha-
sthita-graivam damodaram bhakti-baddham

3. itidrk sva-lilabhir ananda-kunde
sva-ghosam nimajjantam akhyapayantam
tadiyesita-jnesu bhaktair jitatvam
punah prematas tam satavrtti vande

4. varam deva moksam na moksavadhim va
na canyam vrne 'ham varesad apiha
idam te vapur natha gopala-balam
sada me manasy avirastam kim anyaih

5. idam te mukhambhojam atyanta-nilair
vrtam kuntalaih snigdha-raktais ca gopya
muhus cumbitam bimba-raktadharam me
manasy avirastam alam laksa-labhaih

6. namo deva damodarananta visno
prasida prabho duhkha-jalabdhi-magnam
krpa-drsti-vstyati-dinam batanu-
grhanesa mam ajnam edhy aksi-drsyah

7. kuveratmajau baddha-murtyaiva yadvat
tvaya mocitau bhakti-bhajau krtau ca
tatha prema-bhaktim svakam me prayacchha
na mokse graho me 'sti damodareha

8. namas te 'stu damne sphurad-dipti-dhamne
tvadiyodarayatha visvasya dhamne
namo radhikayai tvadiya-priyayai
namo 'nanta-lilaya devaya tubhyam`,
      hi: `१. नमामीश्वरं सच्-चिद्-आनंद-रूपम्,
लसत्-कुण्डलं गोकुले भ्राजमानम्।
यशोदा-भियोलूखलाद् धावमानं,
परामृष्टमत्यन्ततो द्रुत्य गोप्या।।

२. रुदन्तं मुहुर्-नेत्र-युग्मं मृजन्तम्,
कराम्भोज-युग्मेन सातंक-नेत्रम्।
मुहुः श्वास-कम्प-त्रिरेखांक-कण्ठ-
स्थित-ग्रैवं दामोदरं भक्ति-बद्धम्।।

३. इतीदृक् स्व-लीलाभिर् आनंद-कुण्डे,
स्व-घोषं निमज्जन्तम् आख्यापयन्तम्।
तदीयेषित-ज्ञेषु भक्तैर्-जितत्वं,
पुनः प्रेमतस् तं शतावृत्ति वन्दे।।

४. वरं देव मोक्षं न मोक्षावधिं वा,
न चान्यं वृणेऽहं वरेशाद् अपीह।
इदं ते वपुर् नाथ गोपाल-बालं,
सदा मे मनस्य् आविरास्तां किम् अन्यैः।।

५. इदं ते मुखाम्भोजम् अत्यन्त-नीलैर्-,
वृतं कुन्तलैः स्निग्ध-रक्तैश् च गोप्या।
मुहुश् चुम्बितं बिम्ब-रक्ताधरं मे,
मनस्य् आविरास्ताम् अलं लक्ष-लाभैः।।

६. नमो देव दामोदरानन्त विष्णो,
प्रसीद प्रभो दुःख-जालाब्धि-मग्नम्।
कृपा-दृष्टि-वृष्ट्याति-दीनं बतानु-
गृहाणेश माम् अज्ञम् एध्य् अक्षि-दृश्यः।।

७. कुवेरात्मजौ बद्ध-मूर्त्यैव यद्वत्,
त्वया मोचितौ भक्ति-भाजौ कृतौ च।
तथा प्रेम-भक्तिं स्वकं मे प्रयच्छ,
न मोक्षे ग्रहो मेऽस्ति दामोदरेह।।

८. नमस् तेऽस्तु दाम्ने स्फुरद्-दीप्ति-धाम्ने,
त्वदीयोदरायाथ विश्वस्य धाम्ने।
नमो राधिकायै त्वदीय-प्रियायै,
नमोऽनन्त-लीलाय देवाय तुभ्यम्।।`,
    },
  },
  {
    id: "sandhya-aarti",
    title: { en: "Sandhya Aarti (Jaya Radha-Madhava)", hi: "संध्या आरती (जय राधा-माधव)" },
    category: "evening",
    lyrics: {
      en: `jaya radha-madhava kunja-vihari
gopi-jana-vallabha giri-vara-dhari
yasoda-nandana vraja-jana-ranjana
yamuna-tira-vana-cari`,
      hi: `जय राधा-माधव कुंज-विहारी,
गोपी-जन-वल्लभ गिरि-वर-धारी।
यशोदा-नंदन व्रज-जन-रंजन,
यमुना-तीर-वन-चारी।।`,
    },
  },
  {
    id: "maha-mantra",
    title: { en: "Hare Krishna Maha-Mantra", hi: "हरे कृष्ण महामंत्र" },
    category: "mantra",
    lyrics: {
      en: `Hare Krishna Hare Krishna
Krishna Krishna Hare Hare
Hare Rama Hare Rama
Rama Rama Hare Hare`,
      hi: `हरे कृष्ण हरे कृष्ण
कृष्ण कृष्ण हरे हरे।
हरे राम हरे राम
राम राम हरे हरे।।`,
    },
  },
  {
    id: "vaishnava-pranam",
    title: { en: "Vaishnava Pranam", hi: "वैष्णव प्रणाम" },
    category: "prayer",
    lyrics: {
      en: `vancha-kalpatarubhyas ca krpa-sindhubhya eva ca
patitanam pavanebhyo vaisnavebhyo namo namah`,
      hi: `वांछा-कल्पतरुभ्यश्च कृपा-सिन्धुभ्य एव च।
पतितानां पावनेभ्यो वैष्णवेभ्यो नमो नमः।।`,
    },
  },
  {
    id: "prabhupada-pranam",
    title: { en: "Srila Prabhupada Pranati", hi: "श्रील प्रभुपाद प्रणति" },
    category: "prayer",
    lyrics: {
      en: `nama om visnu-padaya krsna-presthaya bhu-tale
srimate bhaktivedanta-svamin iti namine

namas te sarasvate deve gaura-vani-pracarine
nirvisesa-sunyavadi-pascatya-desa-tarine`,
      hi: `नम ॐ विष्णु-पादाय कृष्ण-प्रेष्ठाय भू-तले।
श्रीमते भक्तिवेदान्त-स्वामिन् इति नामिने।।

नमस् ते सारस्वते देवे गौर-वाणी-प्रचारिणे।
निर्विशेष-शून्यवादी-पाश्चात्य-देश-तारिणे।।`,
    },
  }
];
