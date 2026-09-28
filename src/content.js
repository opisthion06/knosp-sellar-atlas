// Bilingual content (tr / en). Step order must match STEP_DEFS in app.js.
window.KC = (function () {
  'use strict';
  const GT = { none: '—', g0: '0', g1: '1', g2: '2', g3a: '3A', g3b: '3B', g4: '4' };
  const INV = { g0: null, g1: 1.5, g2: 9.9, g3a: 26.5, g3b: 70.6, g4: 100 };
  const pct = (v, lang) => (lang === 'tr' ? '%' + String(v).replace('.', ',') : v + '%');

  // ------------------------------------------------------------------ TR
  const tr = {
    htmlLang: 'tr',
    docTitle: 'Knosp Sellar Atlası',
    ui: {
      'brand.title': 'Knosp <span>Sellar</span> Atlası',
      'brand.sub': 'Hipofiz adenomlarında kavernöz sinüs uzanımı · 3B etkileşimli ders',
      'tab.ders': 'Ders', 'tab.katman': 'Katmanlar', 'tab.test': 'Kendini sına', 'tab.kaynak': 'Kaynaklar',
      'nav.prev': '← Önceki', 'nav.next': 'Sonraki →', 'nav.restart': 'Başa dön', 'nav.stepAria': '{n}. adım: {t}',
      'g.structures': 'Yapılar', 'g.coronal': 'Koronal kesit', 'g.labels': 'Etiketler', 'g.controls': 'Kontroller',
      'ly.bone': 'Kemik (sfenoid, klinoidler, kafa tabanı)', 'ly.gland': 'Hipofiz bezi ve sap', 'ly.tumor': 'Adenom',
      'ly.ica': 'İnternal karotis arter', 'ly.vessels': 'Willis halkası dalları, baziler arter', 'ly.nerves': 'Kraniyal sinirler III, IV, V, VI',
      'ly.cs': 'Kavernöz sinüs', 'ly.optic': 'Optik sinir, kiazma, trakt', 'ly.dia': 'Diafragma sella',
      'ly.lines': 'Knosp çizgileri', 'ly.mr': 'MR kesitini kesit düzlemine yerleştir',
      'aria.boneOp': 'Kemik opaklığı', 'aria.mrOp': 'MR kesiti opaklığı',
      'lbl.step': 'Ders adımı', 'lbl.all': 'Tümü', 'lbl.off': 'Kapalı', 'autorot': 'Otomatik döndür',
      'help.1k': 'Sol sürükle', 'help.1v': 'Döndür', 'help.2k': 'Tekerlek / sıkıştır', 'help.2v': 'Yakınlaştır, uzaklaştır',
      'help.3k': 'Sağ sürükle / 2 parmak', 'help.3v': 'Kaydır', 'help.4k': 'Tıkla', 'help.4v': 'Yapıyı tanımla',
      'help.5k': 'Çift tıkla', 'help.5v': 'O noktaya odaklan', 'help.6k': '← →', 'help.6v': 'Ders adımları',
      'quiz.kicker': 'Kendini sına', 'quiz.title': 'Bu adenom hangi derecede?',
      'quiz.intro': 'Rastgele bir vaka yüklenir. Koronal kesiti döndürerek incele, MR kesitindeki çizgilere bak ve <b>sol</b> taraf (ekranın sağı) için Knosp derecesini seç.',
      'quiz.hint': 'Koronal kesiti ve MR kesitini incele, sonra <b>sol</b> taraf için dereceyi seç.',
      'quiz.next': 'Yeni vaka →', 'quiz.right': 'Doğru.', 'quiz.wrong': 'Yanlış. Doğru cevap: {g}.', 'quiz.score': 'Skor: {s} / {n}',
      'refs.h': 'Kaynaklar',
      'refs.n1': '(derece bazında cerrahi remisyon oranları)', 'refs.n2': '(çizgilerin kesit bazında tanımı)',
      'refs.n3': '(Rhoton, sellar bölgenin mikrocerrahi anatomisi)', 'refs.n4': '(kavernöz ICA çapı ≈ 5,1 mm; interkarotid mesafe ≈ 17,4 mm)',
      'refs.note': 'Model, literatürdeki ortalama ölçülere göre işaretli uzaklık alanlarıyla (SDF) üretilmiş şematik-gerçekçi bir eğitim modelidir; tek bir hastanın anatomisini temsil etmez. MR görüntüsü sentetiktir. Tümör <b>sol</b> tarafta derecelendirilir (radyolojik düzende ekranın sağı).',
      'badge.small': 'Knosp · sol', 'badge.none': 'Tümör yok · normal anatomi', 'badge.grade': 'Knosp {g} · sol taraf', 'badge.ask': 'Bu vakanın derecesi ne?',
      'view.overview': 'Genel', 'view.endonasal': 'Endonazal', 'view.boneTop': 'Üst', 'view.icaLat': 'Yan', 'view.coronal': 'Koronal',
      'view.reset': 'Adımın görünümüne dön', 'aria.views': 'Hazır görünümler',
      'gb.label': 'Knosp<br>sol', 'gb.normal': 'Normal', 'aria.gb': 'Knosp derecesi (sol taraf)',
      'cut.label': 'Koronal kesit', 'cut.note': 'Bu kesitte sifonun iki kolu yok', 'aria.cut': 'Kesit düzlemi (ön-arka, mm)',
      'inset.title': 'Koronal T1 + kontrast · sentetik', 'aria.insetClose': 'MR kesitini kapat',
      'aria.insetMin': 'MR penceresini küçült / büyüt', 'inset.drag': 'Başlıktan sürükleyerek taşı · köşeden boyutlandır · çift tıkla: yerine döndür',
      'leg.med': 'Medial tanjant', 'leg.cen': 'İnterkarotid çizgi', 'leg.lat': 'Lateral tanjant',
      'info.focus': 'Odaklan', 'info.close': 'Kapat',
      'load.title': 'Sellar bölge modelleniyor', 'load.init': 'Başlatılıyor…', 'load.optic': 'Optik aparat…', 'load.skull': 'Kafa tabanı modelleniyor…',
      'load.bone': 'Kemik yüzeyi hesaplanıyor…', 'load.mesh': 'Kemik ağı oluşturuluyor…', 'load.cs': 'Kavernöz sinüs…', 'load.tumor': 'Hipofiz ve tümör alanı…',
      'load.ready': 'Hazır', 'load.err': 'Model yüklenemedi: ',
      'axis.ant': 'ANTERİOR', 'axis.left': 'SOL', 'axis.right': 'SAĞ', 'axis.sup': 'SUPERİOR',
      'mr.R': 'SAĞ', 'mr.L': 'SOL'
    },
    icaSeg: ['C2 · petröz', 'C3 · laserum', 'C4 · kavernöz', 'C5 · klinoid', 'C6 · oftalmik', 'C7 · komünikan'],
    labelText: { ica_c2: 'ICA · C2 petröz', ica_c4: 'ICA · C4 kavernöz', ica_c5: 'ICA · C5 klinoid', ica_c6: 'ICA · C6 oftalmik', ica_c7: 'ICA · C7 komünikan' },
    grade: {
      none: 'Normal sellar anatomi. Hipofiz bezi sella içinde, kavernöz sinüs medial duvarı sağlam.',
      g0: 'Tümör medial tanjantı geçmez. Kavernöz sinüs invazyonu beklenmez.',
      g1: 'Tümör medial tanjantı geçer, interkarotid çizgiye ulaşmaz.',
      g2: 'Tümör interkarotid çizgiyi geçer, lateral tanjanta ulaşmaz.',
      g3a: 'Tümör lateral tanjantı intrakavernöz ICA’nın ÜSTÜNDEN (superior kompartman) geçer.',
      g3b: 'Tümör lateral tanjantı intrakavernöz ICA’nın ALTINDAN (inferior kompartman) geçer.',
      g4: 'İntrakavernöz ICA tümörle tamamen (360°) sarılmıştır.'
    },
    quiz: {
      g0: 'Tümörün lateral sınırı medial tanjantın (mavi) içinde kalıyor.',
      g1: 'Tümör medial tanjantı (mavi) geçiyor ama interkarotid çizgiye (sarı) ulaşmıyor.',
      g2: 'Tümör interkarotid çizgiyi (sarı) geçiyor, lateral tanjanta (pembe) ulaşmıyor.',
      g3a: 'Tümör lateral tanjantı (pembe) ICA’nın ÜSTÜNDEN geçiyor: superior kompartman.',
      g3b: 'Tümör lateral tanjantı (pembe) ICA’nın ALTINDAN geçiyor: inferior kompartman.',
      g4: 'İntrakavernöz ICA’nın çevresi tümörle tamamen sarılmış.'
    },
    info: {
      bone: ['Sfenoid kemik / kafa tabanı', 'Os sphenoidale', 'Sellar bölgenin kemik çerçevesi. Gövdesi sfenoid sinüsü içerir; küçük kanatlar ön, büyük kanatlar orta kraniyal fossanın tabanını oluşturur.'],
      sella: ['Sella turcica (hipofiz çukuru)', 'Fossa hypophysialis', 'Hipofiz bezinin oturduğu çukur. Tabanı sfenoid sinüse doğru kabarır; lateral kemik duvarı yoktur, lateral sınır kavernöz sinüsün medial dural duvarıdır.'],
      sellarfloor: ['Sellar taban (sinüs yüzü)', 'Sellar kabarıklık', 'Endoskopik endonazal yaklaşımda sfenoid sinüs içinden açılan ilk hedef. Kalınlığı genellikle 1 mm civarındadır.'],
      dorsum: ['Dorsum sellae', 'Dorsum sellae', 'Sellanın arka duvarı; üst ucunda posterior klinoid çıkıntılar bulunur. Arkasında baziler arter ve beyin sapı yer alır.'],
      pclin: ['Posterior klinoid çıkıntı', 'Processus clinoideus posterior', 'Dorsum sellaenin lateral ucu. Tentoryumun iç kenarı ve petroklinoid bağlar buraya tutunur.'],
      aclin: ['Anterior klinoid çıkıntı', 'Processus clinoideus anterior', 'Küçük kanadın arkaya uzanan ucu. ICA’nın klinoid segmenti (C5) bu çıkıntının hemen medialinden ve altından geçer; kavernöz sinüs tavanının ön kısmını örter.'],
      tuberculum: ['Tuberculum sellae', 'Tuberculum sellae', 'Sella çukurunun ön-üst kenarı. Genişletilmiş transtuberküler yaklaşımda rezeke edilir.'],
      planum: ['Planum sphenoidale', 'Planum sphenoidale', 'Sfenoid gövdesinin düz üst yüzü; ön kraniyal fossanın orta-arka kısmı.'],
      sinus: ['Sfenoid sinüs', 'Sinus sphenoidalis', 'Havalı sinüs; burada ön duvarı açılmış (sfenoidotomi) olarak gösterilmiştir. Endoskopik transsfenoidal cerrahinin koridoru.'],
      septum: ['İntersinüs septumu', 'Septum sinuum sphenoidalium', 'Sıklıkla orta hattan sapar ve karotis çıkıntısına tutunabilir; kör kırılması ICA yaralanmasına yol açabilir.'],
      carprom: ['Karotis çıkıntısı', 'Prominentia carotica', 'Kavernöz ICA’nın sfenoid sinüs lateral duvarında oluşturduğu kabarıklık. Kemik örtüsü bazen çok incedir ya da yoktur.'],
      clivus: ['Klivus', 'Clivus', 'Dorsum sellaeden foramen magnuma inen kemik eğim. Arkasında baziler arter ve pons bulunur.'],
      opticcanal: ['Optik kanal', 'Canalis opticus', 'Optik sinir ve oftalmik arteri orbitaya iletir; anterior klinoid çıkıntı ile optik strut arasında yer alır.'],
      rotundum: ['Foramen rotundum', 'Foramen rotundum', 'Maksiller sinirin (V2) pterigopalatin fossaya çıkış yeri.'],
      ovale: ['Foramen ovale', 'Foramen ovale', 'Mandibüler sinirin (V3) infratemporal fossaya çıkış yeri. V3 kavernöz sinüse girmez.'],
      petrous: ['Petröz apeks', 'Apex partis petrosae', 'Temporal kemiğin petröz kısmının ucu. İçinden ICA’nın petröz segmenti geçer; üst yüzünde trigeminal çukur (Meckel mağarası) vardır.'],
      mcf: ['Orta kraniyal fossa', 'Fossa cranii media', 'Temporal lobun oturduğu çukur; tabanını sfenoidin büyük kanadı oluşturur.'],
      gland: ['Hipofiz bezi', 'Hypophysis', 'Ön lob (adenohipofiz), arka lob (nörohipofiz) ve hipofiz sapından oluşur.'],
      gland_a: ['Adenohipofiz (ön lob)', 'Adenohypophysis', 'Bezin yaklaşık %75’i. Adenomların (PitNET) kaynağı. Makroadenomda genellikle karşı tarafa ve yukarı itilir, ince bir hilal halini alır.'],
      gland_p: ['Nörohipofiz (arka lob)', 'Neurohypophysis', 'Hipotalamik aksonların sonlandığı lob; T1 ağırlıklı MR’da “parlak nokta” verir.'],
      stalk: ['Hipofiz sapı', 'Infundibulum', 'Hipotalamusu hipofize bağlar; diafragma sellanın merkezî açıklığından geçer. Kitleler tarafından itilip gerilebilir.'],
      diaphragma: ['Diafragma sella', 'Diaphragma sellae', 'Sellanın dural tavanı. Merkezî açıklığından sap geçer. Suprasellar uzanımda tümör tarafından kubbe şeklinde itilir.'],
      chiasm: ['Optik kiazma', 'Chiasma opticum', 'Diafragmanın yaklaşık 5–10 mm üstünde. Aşağıdan bası çaprazlaşan nazal retina liflerini etkiler: bitemporal hemianopsi.'],
      opticnerve: ['Optik sinir (II)', 'N. opticus', 'Optik kanaldan kiazmaya uzanır; supraklinoid ICA’nın üst-medialindedir.'],
      optictract: ['Optik trakt', 'Tractus opticus', 'Kiazmadan lateral genikulat cisme uzanır.'],
      cs: ['Kavernöz sinüs', 'Sinus cavernosus', 'Superior orbital fissürden petröz apekse uzanan dural venöz boşluk. Lateral duvarı iki tabakalıdır (III, IV, V1, V2); medial duvarı tek ve incedir. İçinde ICA ve VI. sinir seyreder.'],
      ica: ['İnternal karotis arter', 'A. carotis interna', 'Kavernöz sinüs içinde sifon yapar. Knosp çizgileri intrakavernöz ve supraklinoid kesitleri arasına çizilir.'],
      mca: ['Orta serebral arter (M1)', 'A. cerebri media', 'ICA terminalinden laterale, Silvian fissüre gider.'],
      a1: ['Ön serebral arter (A1)', 'A. cerebri anterior', 'Optik sinir ve kiazmanın üstünden mediale geçer.'],
      a2: ['Ön serebral arter (A2)', 'A. cerebri anterior', 'Anterior komünikan arterin distalinde yukarı yükselir.'],
      acom: ['Anterior komünikan arter', 'A. communicans anterior', 'İki A1 segmentini birleştirir; kiazmanın üst-önünde yer alır.'],
      pcom: ['Posterior komünikan arter', 'A. communicans posterior', 'ICA’nın C7 segmentinden çıkar, arkaya PCA’ya uzanır; okülomotor sinirin yakınında seyreder.'],
      pca: ['Posterior serebral arter', 'A. cerebri posterior', 'Baziler tepeden çıkar. Okülomotor sinir PCA ile SCA arasından geçer.'],
      sca: ['Süperior serebellar arter', 'A. superior cerebelli', 'Baziler arterin tepeye yakın dalı; III. sinirin altında seyreder.'],
      basilar: ['Baziler arter', 'A. basilaris', 'Klivusun arkasında, prepontin sisternada.'],
      oph: ['Oftalmik arter', 'A. ophthalmica', 'Genellikle distal dural halkanın üstünden (C6) çıkar ve optik kanaldan sinirin altında orbitaya girer.'],
      cn3: ['Okülomotor sinir (III)', 'N. oculomotorius', 'Okülomotor üçgenden sinüs tavanına girer, lateral duvarın en üstünde seyreder ve superior orbital fissürden orbitaya geçer. Apopleksi ile ani pitoz ve midriyazis yapabilir.'],
      cn4: ['Troklear sinir (IV)', 'N. trochlearis', 'Lateral duvarda III’ün altında ilerler; önde III’ün üstünden çaprazlayarak mediale geçer.'],
      v1: ['Oftalmik sinir (V1)', 'N. ophthalmicus', 'Lateral duvarda IV’ün altında; superior orbital fissürden orbitaya girer.'],
      v2: ['Maksiller sinir (V2)', 'N. maxillaris', 'Lateral duvarın en alt kısmında seyreder; foramen rotundumdan çıkar.'],
      v3: ['Mandibüler sinir (V3)', 'N. mandibularis', 'Ganglionden doğrudan foramen ovaleye iner; kavernöz sinüse girmez.'],
      cn5: ['Trigeminal sinir kökü', 'N. trigeminus', 'Ponstan çıkıp petröz apeksin üstünden Meckel mağarasına girer.'],
      gg: ['Trigeminal (Gasser) ganglion', 'Ganglion trigeminale', 'Meckel mağarasında yer alır; V1, V2 ve V3 buradan ayrılır.'],
      cn6: ['Abdusens sinir (VI)', 'N. abducens', 'Dorello kanalından geçip sinüsün İÇİNDE, ICA’nın inferolateralinde serbestçe seyreder. İnferior kompartmanı (3B) dolduran tümör bu siniri sarabilir.'],
      tumor: ['Hipofiz makroadenomu', 'PitNET', 'Sellar kaynaklı, suprasellar ve lateral uzanımlı adenom. Lateral uzanımın ICA’ya göre konumu Knosp derecesini belirler.']
    },
    steps: [
      {
        kicker: 'Giriş', title: 'Sellar bölge',
        body: `<p>Hipofiz adenomları (PitNET) büyüdükçe en sık laterale, <b>kavernöz sinüse</b> doğru yayılır. <b>Knosp sınıflaması</b> (Knosp 1993; Micko 2015 revizyonu) bu uzanımı koronal kontrastlı T1 ağırlıklı MR’da <b>internal karotis artere (ICA)</b> göre çizilen üç çizgiyle derecelendirir.</p>
        <p>Model gerçek boyutlara yakın, milimetre ölçekli bir anatomi modelidir. Sürükleyerek döndür, tekerlekle yakınlaştır, sağ tık (veya iki parmak) ile kaydır. Bir yapıya tıklarsan açıklaması açılır.</p>`,
        facts: [['Kavernöz ICA çapı', '≈ 5 mm'], ['İnterkarotid mesafe', '≈ 17 mm'], ['Sella genişliği', '12–15 mm']]
      },
      {
        kicker: 'Kemik çerçeve', title: 'Sella turcica ve sfenoid kemik',
        body: `<p>Sella turcica sfenoid gövdesinin üst yüzündeki çukurdur. Önünde <b>tuberculum sellae</b> ve <b>planum sphenoidale</b>, arkasında <b>dorsum sellae</b> ve posterior klinoid çıkıntılar bulunur.</p>
        <p><b>Sellanın lateral kemik duvarı yoktur.</b> İki yanda ICA, sfenoid gövdesinin yan yüzündeki karotis oluğunda ilerler; lateral sınırı kavernöz sinüsün ince medial duvarı oluşturur. Adenomun laterale neden kolay yayıldığını bu açıklar.</p>
        <p>Anterior klinoid çıkıntı, ICA’nın klinoid segmentini (C5) lateralden ve üstten örter.</p>`
      },
      {
        kicker: 'Cerrahi koridor', title: 'Endonazal perspektif',
        body: `<p>Endoskopik endonazal yaklaşımda sfenoid sinüsün ön duvarı açıldığında cerrah önce <b>sellar tabanı</b> (sellar kabarıklık), iki yanında da <b>karotis çıkıntılarını</b> görür.</p>
        <p>İntersinüs septumu çoğunlukla orta hattan sapar ve karotis çıkıntısına uzanabilir. Kemiğin arkasındaki ICA seyrini görmek için <i>Katmanlar</i> sekmesinden kemik opaklığını azalt.</p>`
      },
      {
        kicker: 'Sellar içerik', title: 'Hipofiz, sap ve diafragma',
        body: `<p><b>Adenohipofiz</b> (ön lob) bezin yaklaşık %75’idir; adenomlar buradan köken alır. <b>Nörohipofiz</b> (arka lob) T1’de parlak nokta verir.</p>
        <p><b>Hipofiz sapı</b>, sellanın dural tavanı olan <b>diafragma sellanın</b> merkezî açıklığından geçer. <b>Optik kiazma</b> diafragmanın yaklaşık 5–10 mm üstündedir. Suprasellar uzanım kiazmaya aşağıdan bası yaparak bitemporal hemianopsiye yol açar.</p>`
      },
      {
        kicker: 'Venöz kompartman', title: 'Kavernöz sinüs',
        body: `<p>Kavernöz sinüs sellanın iki yanında, superior orbital fissürden petröz apekse uzanan dural bir venöz boşluktur.</p>
        <p><b>Lateral duvar</b> iki tabakalıdır ve sinirleri taşır. <b>Medial duvar</b> (sellar duvar) ise tek, ince bir dural tabakadır. Adenom sinüse bu ince duvar üzerinden girer.</p>
        <p>Sinüsün içi ICA’ya göre venöz kompartmanlara ayrılır: <b>superior</b>, <b>posterior</b>, <b>inferior</b> ve <b>lateral</b>. Micko’nun 3A/3B ayrımı üst ve alt kompartman farkına dayanır.</p>`
      },
      {
        kicker: 'Arteriyel iskelet', title: 'ICA: karotis sifonu',
        body: `<p>ICA petröz kanaldan çıkıp foramen laserumun üstünde yükselir. Kavernöz sinüs içinde <b>arka dirsek → yatay segment → ön dirsek</b> yapar (<b>C4</b>, Bouthillier). İki dural halka arasındaki kısa kısım <b>klinoid</b> (C5), distal halkanın üstündeki kısımlar <b>oftalmik</b> (C6) ve <b>komünikan</b> (C7) segmentlerdir.</p>
        <p>Koronal kesitte sifonun iki kolu birlikte görülür: altta <b>intrakavernöz</b>, üstte <b>supraklinoid</b> ICA. Knosp çizgileri bu iki kesitin arasına çizilir.</p>`,
        facts: [['Kemik opaklığı', '%22 (ICA seyri görünür)']]
      },
      {
        kicker: 'Lateral duvar', title: 'Kraniyal sinirler',
        body: `<p>Lateral duvarda yukarıdan aşağıya <b>III</b> (okülomotor), <b>IV</b> (troklear), <b>V1</b> (oftalmik) ve <b>V2</b> (maksiller) sinirleri seyreder.</p>
        <p><b>VI</b> (abdusens) Dorello kanalından geçer ve sinüsün <b>içinde</b>, ICA’nın inferolateralinde serbestçe ilerler. <b>V3</b> sinüse girmez; Meckel mağarasındaki ganglionden foramen ovaleye iner.</p>
        <p>Adenomlarda kavernöz sinüs invazyonuna rağmen kraniyal sinir defisiti nadirdir. Ani oftalmopleji hipofiz apopleksisini düşündürür; en sık III. sinir etkilenir.</p>`
      },
      {
        kicker: 'Ölçüm düzlemi', title: 'Koronal kesit ve Knosp çizgileri',
        body: `<p>Derece, ICA sifonunun iki kolunun birlikte göründüğü <b>koronal kontrastlı T1</b> kesitlerde belirlenir. Her tarafta üç çizgi çizilir:</p>
        <ul class="lines-key">
          <li><i class="k-med"></i><span><b>Medial tanjant</b>: intrakavernöz ve supraklinoid ICA’nın medial duvarlarını birleştirir.</span></li>
          <li><i class="k-cen"></i><span><b>İnterkarotid çizgi</b>: iki kesitin merkezlerini birleştirir.</span></li>
          <li><i class="k-lat"></i><span><b>Lateral tanjant</b>: iki kesitin lateral duvarlarını birleştirir.</span></li>
        </ul>
        <p>Taraflar ayrı derecelendirilir; tümörün en fazla uzandığı kesit esas alınır. Alttaki kaydırıcıyla kesit düzlemini ileri-geri taşı.</p>`
      },
      null, null, null, null, null, null, // grade steps (generated)
      {
        kicker: 'Özet', title: 'Klinik önem',
        body: summary('tr', 'Derece', 'Cerrahi invazyon', 'Cerrahi remisyon', '228 olgu', [
          'Derece 3–4 genellikle invaziv kabul edilir. 3A ile 3B’nin ayrılması prognoz için önemlidir: 3A derece 2’ye, 3B derece 4’e benzer davranır.',
          'Knosp yalnızca lateral uzanımı ölçer. Suprasellar ve sfenoid uzanım için Hardy–Wilson gibi sınıflamalarla birlikte kullanılır.',
          'Özellikle 2–3A sınırında gözlemciler arası farklılık olabilir. Kuşkulu tarafta birkaç ardışık koronal kesite bak.'
        ])
      }
    ],
    gradeBodies: {
      g0: `<p>Tümör sella içinde ve suprasellar alanda büyümüştür ama <b>medial tanjantı geçmez</b>. Normal bez karşı tarafa itilmiştir.</p><p>Kavernöz sinüs medial duvarı sağlamdır; invazyon beklenmez.</p>`,
      g1: `<p>Tümör <b>medial tanjantı geçer</b> fakat <b>interkarotid çizgiye ulaşmaz</b>. Medial duvar çoğunlukla itilir (kompresyon), yırtılmaz.</p>`,
      g2: `<p>Tümör <b>interkarotid çizgiyi geçer</b>, <b>lateral tanjanta ulaşmaz</b>. Tümör iki ICA kesiti arasına sokulur.</p><p>Gerçek invazyon oranı hâlâ düşüktür, ancak MR ile kompresyon–invazyon ayrımı her zaman yapılamaz.</p>`,
      g3a: `<p>Tümör <b>lateral tanjantı</b>, intrakavernöz ICA’nın <b>üstünden</b> geçer ve <b>superior kompartmanı</b> doldurur. Lateral duvardaki III, IV ve V1 laterale itilir.</p><p>Davranışı derece 2’ye yakındır; cerrahi olarak daha erişilebilirdir.</p>`,
      g3b: `<p>Tümör <b>lateral tanjantı</b>, intrakavernöz ICA’nın <b>altından</b> geçer ve <b>inferior kompartmanı</b> doldurur. Bu kompartmanda seyreden <b>VI. sinir</b> tümörle sarılabilir.</p><p>Gerçek invazyon çok olasıdır; davranışı derece 4’e yakındır.</p>`,
      g4: `<p>İntrakavernöz ICA tümörle <b>tamamen (360°) sarılmıştır</b>. Kavernöz sinüs invazyonu kesindir.</p><p>Total rezeksiyon nadiren mümkündür. Kalan tümör için radyocerrahi ve (fonksiyonel adenomlarda) medikal tedavi gündeme gelir.</p>`
    },
    gradeKicker: 'Knosp derecesi', gradeTitle: 'Derece {g}',
    gradeFacts: (g) => [['Cerrahi olarak doğrulanan invazyon', INV[g] == null ? 'beklenmez' : pct(INV[g], 'tr')], ['Kaynak', 'Micko ve ark. 2015']]
  };

  // ------------------------------------------------------------------ EN
  const en = {
    htmlLang: 'en',
    docTitle: 'Knosp Sellar Atlas',
    ui: {
      'brand.title': 'Knosp <span>Sellar</span> Atlas',
      'brand.sub': 'Cavernous sinus extension of pituitary adenomas · interactive 3D lesson',
      'tab.ders': 'Lesson', 'tab.katman': 'Layers', 'tab.test': 'Self-test', 'tab.kaynak': 'References',
      'nav.prev': '← Previous', 'nav.next': 'Next →', 'nav.restart': 'Start over', 'nav.stepAria': 'Step {n}: {t}',
      'g.structures': 'Structures', 'g.coronal': 'Coronal section', 'g.labels': 'Labels', 'g.controls': 'Controls',
      'ly.bone': 'Bone (sphenoid, clinoid processes, skull base)', 'ly.gland': 'Pituitary gland and stalk', 'ly.tumor': 'Adenoma',
      'ly.ica': 'Internal carotid artery', 'ly.vessels': 'Circle of Willis branches, basilar artery', 'ly.nerves': 'Cranial nerves III, IV, V, VI',
      'ly.cs': 'Cavernous sinus', 'ly.optic': 'Optic nerve, chiasm, tract', 'ly.dia': 'Diaphragma sellae',
      'ly.lines': 'Knosp lines', 'ly.mr': 'Place the MRI slice in the section plane',
      'aria.boneOp': 'Bone opacity', 'aria.mrOp': 'MRI slice opacity',
      'lbl.step': 'Lesson step', 'lbl.all': 'All', 'lbl.off': 'Off', 'autorot': 'Auto-rotate',
      'help.1k': 'Left drag', 'help.1v': 'Rotate', 'help.2k': 'Wheel / pinch', 'help.2v': 'Zoom in and out',
      'help.3k': 'Right drag / 2 fingers', 'help.3v': 'Pan', 'help.4k': 'Click', 'help.4v': 'Identify a structure',
      'help.5k': 'Double-click', 'help.5v': 'Focus on that point', 'help.6k': '← →', 'help.6v': 'Lesson steps',
      'quiz.kicker': 'Self-test', 'quiz.title': 'What Knosp grade is this adenoma?',
      'quiz.intro': 'A random case is loaded. Rotate the coronal section, check the lines on the MRI slice, and choose the Knosp grade for the <b>left</b> side (right side of the screen).',
      'quiz.hint': 'Review the coronal section and the MRI slice, then choose the grade for the <b>left</b> side.',
      'quiz.next': 'New case →', 'quiz.right': 'Correct.', 'quiz.wrong': 'Incorrect. The correct answer is {g}.', 'quiz.score': 'Score: {s} / {n}',
      'refs.h': 'References',
      'refs.n1': '(surgical remission rates by grade)', 'refs.n2': '(slice-based definition of the lines)',
      'refs.n3': '(Rhoton, microsurgical anatomy of the sellar region)', 'refs.n4': '(cavernous ICA diameter ≈ 5.1 mm; intercarotid distance ≈ 17.4 mm)',
      'refs.note': 'This is a schematic-realistic teaching model generated with signed distance fields (SDF) from mean dimensions reported in the literature; it does not represent any individual patient. The MRI image is synthetic. The tumor is graded on the <b>left</b> side (the right side of the screen in radiological convention).',
      'badge.small': 'Knosp · left', 'badge.none': 'No tumor · normal anatomy', 'badge.grade': 'Knosp {g} · left side', 'badge.ask': 'What grade is this case?',
      'view.overview': 'Overview', 'view.endonasal': 'Endonasal', 'view.boneTop': 'Superior', 'view.icaLat': 'Lateral', 'view.coronal': 'Coronal',
      'view.reset': 'Return to this step’s view', 'aria.views': 'Preset views',
      'gb.label': 'Knosp<br>left', 'gb.normal': 'Normal', 'aria.gb': 'Knosp grade (left side)',
      'cut.label': 'Coronal section', 'cut.note': 'Both limbs of the siphon are not in this slice', 'aria.cut': 'Section plane (anteroposterior, mm)',
      'inset.title': 'Coronal contrast-enhanced T1 · synthetic', 'aria.insetClose': 'Close the MRI slice',
      'aria.insetMin': 'Minimize / restore the MRI window', 'inset.drag': 'Drag the title bar to move · drag the corner to resize · double-click to reset',
      'leg.med': 'Medial tangent', 'leg.cen': 'Intercarotid line', 'leg.lat': 'Lateral tangent',
      'info.focus': 'Focus', 'info.close': 'Close',
      'load.title': 'Modeling the sellar region', 'load.init': 'Starting…', 'load.optic': 'Optic apparatus…', 'load.skull': 'Modeling the skull base…',
      'load.bone': 'Computing the bone surface…', 'load.mesh': 'Building the bone mesh…', 'load.cs': 'Cavernous sinus…', 'load.tumor': 'Pituitary and tumor field…',
      'load.ready': 'Ready', 'load.err': 'The model could not be loaded: ',
      'axis.ant': 'ANTERIOR', 'axis.left': 'LEFT', 'axis.right': 'RIGHT', 'axis.sup': 'SUPERIOR',
      'mr.R': 'R', 'mr.L': 'L'
    },
    icaSeg: ['C2 · petrous', 'C3 · lacerum', 'C4 · cavernous', 'C5 · clinoid', 'C6 · ophthalmic', 'C7 · communicating'],
    labelText: { ica_c2: 'ICA · C2 petrous', ica_c4: 'ICA · C4 cavernous', ica_c5: 'ICA · C5 clinoid', ica_c6: 'ICA · C6 ophthalmic', ica_c7: 'ICA · C7 communicating' },
    grade: {
      none: 'Normal sellar anatomy. The pituitary gland lies within the sella; the medial wall of the cavernous sinus is intact.',
      g0: 'The tumor does not cross the medial tangent. No cavernous sinus invasion is expected.',
      g1: 'The tumor crosses the medial tangent but does not reach the intercarotid line.',
      g2: 'The tumor crosses the intercarotid line but does not reach the lateral tangent.',
      g3a: 'The tumor extends beyond the lateral tangent ABOVE the intracavernous ICA (superior compartment).',
      g3b: 'The tumor extends beyond the lateral tangent BELOW the intracavernous ICA (inferior compartment).',
      g4: 'The intracavernous ICA is totally (360°) encased by tumor.'
    },
    quiz: {
      g0: 'The lateral margin of the tumor stays medial to the medial tangent (blue).',
      g1: 'The tumor crosses the medial tangent (blue) but does not reach the intercarotid line (yellow).',
      g2: 'The tumor crosses the intercarotid line (yellow) but does not reach the lateral tangent (pink).',
      g3a: 'The tumor crosses the lateral tangent (pink) ABOVE the ICA: superior compartment.',
      g3b: 'The tumor crosses the lateral tangent (pink) BELOW the ICA: inferior compartment.',
      g4: 'The intracavernous ICA is completely surrounded by tumor.'
    },
    info: {
      bone: ['Sphenoid bone / skull base', 'Os sphenoidale', 'The bony framework of the sellar region. The body contains the sphenoid sinus; the lesser wings form part of the anterior cranial fossa and the greater wings the floor of the middle cranial fossa.'],
      sella: ['Sella turcica (hypophyseal fossa)', 'Fossa hypophysialis', 'The fossa that houses the pituitary gland. Its floor bulges into the sphenoid sinus. It has no lateral bony wall; the lateral boundary is the medial dural wall of the cavernous sinus.'],
      sellarfloor: ['Sellar floor (sinus aspect)', 'Sellar bulge', 'The first target opened from within the sphenoid sinus in the endoscopic endonasal approach. It is typically about 1 mm thick.'],
      dorsum: ['Dorsum sellae', 'Dorsum sellae', 'The posterior wall of the sella, capped by the posterior clinoid processes. The basilar artery and brainstem lie behind it.'],
      pclin: ['Posterior clinoid process', 'Processus clinoideus posterior', 'The lateral tip of the dorsum sellae. The free edge of the tentorium and the petroclinoid ligaments attach here.'],
      aclin: ['Anterior clinoid process', 'Processus clinoideus anterior', 'The posterior projection of the lesser wing. The clinoid segment of the ICA (C5) passes immediately medial and inferior to it; it roofs the anterior part of the cavernous sinus.'],
      tuberculum: ['Tuberculum sellae', 'Tuberculum sellae', 'The anterosuperior margin of the sella. It is removed in the extended transtuberculum approach.'],
      planum: ['Planum sphenoidale', 'Planum sphenoidale', 'The flat superior surface of the sphenoid body; the posterior midline part of the anterior cranial fossa.'],
      sinus: ['Sphenoid sinus', 'Sinus sphenoidalis', 'Air-containing sinus, shown here with its anterior wall opened (sphenoidotomy). The corridor for endoscopic transsphenoidal surgery.'],
      septum: ['Intersinus septum', 'Septum sinuum sphenoidalium', 'Frequently off the midline and may insert onto the carotid prominence; fracturing it blindly risks ICA injury.'],
      carprom: ['Carotid prominence', 'Prominentia carotica', 'The bulge produced by the cavernous ICA on the lateral wall of the sphenoid sinus. Its bony covering may be very thin or dehiscent.'],
      clivus: ['Clivus', 'Clivus', 'The bony slope from the dorsum sellae to the foramen magnum. The basilar artery and pons lie behind it.'],
      opticcanal: ['Optic canal', 'Canalis opticus', 'Transmits the optic nerve and ophthalmic artery into the orbit; bounded by the anterior clinoid process and the optic strut.'],
      rotundum: ['Foramen rotundum', 'Foramen rotundum', 'Exit of the maxillary nerve (V2) into the pterygopalatine fossa.'],
      ovale: ['Foramen ovale', 'Foramen ovale', 'Exit of the mandibular nerve (V3) into the infratemporal fossa. V3 does not enter the cavernous sinus.'],
      petrous: ['Petrous apex', 'Apex partis petrosae', 'The tip of the petrous temporal bone. It transmits the petrous ICA; its superior surface bears the trigeminal impression (Meckel’s cave).'],
      mcf: ['Middle cranial fossa', 'Fossa cranii media', 'Houses the temporal lobe; its floor is formed by the greater wing of the sphenoid.'],
      gland: ['Pituitary gland', 'Hypophysis', 'Comprises the anterior lobe (adenohypophysis), the posterior lobe (neurohypophysis) and the pituitary stalk.'],
      gland_a: ['Adenohypophysis (anterior lobe)', 'Adenohypophysis', 'About 75% of the gland and the origin of adenomas (PitNETs). In macroadenomas it is usually displaced contralaterally and superiorly into a thin crescent.'],
      gland_p: ['Neurohypophysis (posterior lobe)', 'Neurohypophysis', 'Terminal field of hypothalamic axons; produces the “bright spot” on T1-weighted MRI.'],
      stalk: ['Pituitary stalk', 'Infundibulum', 'Connects the hypothalamus to the pituitary and passes through the central opening of the diaphragma sellae. Masses may displace and stretch it.'],
      diaphragma: ['Diaphragma sellae', 'Diaphragma sellae', 'The dural roof of the sella; the stalk passes through its central opening. With suprasellar extension it is pushed up into a dome.'],
      chiasm: ['Optic chiasm', 'Chiasma opticum', 'Lies about 5–10 mm above the diaphragma. Compression from below affects the crossing nasal retinal fibers: bitemporal hemianopia.'],
      opticnerve: ['Optic nerve (CN II)', 'N. opticus', 'Runs from the optic canal to the chiasm, superomedial to the supraclinoid ICA.'],
      optictract: ['Optic tract', 'Tractus opticus', 'Runs from the chiasm to the lateral geniculate body.'],
      cs: ['Cavernous sinus', 'Sinus cavernosus', 'A dural venous space extending from the superior orbital fissure to the petrous apex. Its lateral wall has two layers (CN III, IV, V1, V2); its medial wall is a single thin layer. The ICA and CN VI run within it.'],
      ica: ['Internal carotid artery', 'A. carotis interna', 'Forms the carotid siphon within the cavernous sinus. The Knosp lines are drawn between its intracavernous and supraclinoid cross-sections.'],
      mca: ['Middle cerebral artery (M1)', 'A. cerebri media', 'Runs laterally from the ICA terminus toward the Sylvian fissure.'],
      a1: ['Anterior cerebral artery (A1)', 'A. cerebri anterior', 'Passes medially above the optic nerve and chiasm.'],
      a2: ['Anterior cerebral artery (A2)', 'A. cerebri anterior', 'Ascends distal to the anterior communicating artery.'],
      acom: ['Anterior communicating artery', 'A. communicans anterior', 'Joins the two A1 segments, anterosuperior to the chiasm.'],
      pcom: ['Posterior communicating artery', 'A. communicans posterior', 'Arises from the C7 segment of the ICA and runs posteriorly to the PCA, close to the oculomotor nerve.'],
      pca: ['Posterior cerebral artery', 'A. cerebri posterior', 'Arises from the basilar apex. The oculomotor nerve passes between the PCA and the SCA.'],
      sca: ['Superior cerebellar artery', 'A. superior cerebelli', 'Arises near the basilar apex and runs below CN III.'],
      basilar: ['Basilar artery', 'A. basilaris', 'Lies behind the clivus in the prepontine cistern.'],
      oph: ['Ophthalmic artery', 'A. ophthalmica', 'Usually arises above the distal dural ring (C6) and enters the orbit through the optic canal, inferior to the nerve.'],
      cn3: ['Oculomotor nerve (CN III)', 'N. oculomotorius', 'Enters the roof of the sinus through the oculomotor triangle, runs highest in the lateral wall and reaches the orbit through the superior orbital fissure. Apoplexy can cause sudden ptosis and mydriasis.'],
      cn4: ['Trochlear nerve (CN IV)', 'N. trochlearis', 'Runs in the lateral wall below CN III; anteriorly it crosses above CN III to reach the medial side.'],
      v1: ['Ophthalmic nerve (V1)', 'N. ophthalmicus', 'Runs in the lateral wall below CN IV and enters the orbit through the superior orbital fissure.'],
      v2: ['Maxillary nerve (V2)', 'N. maxillaris', 'Runs in the lowest part of the lateral wall and exits through the foramen rotundum.'],
      v3: ['Mandibular nerve (V3)', 'N. mandibularis', 'Descends from the ganglion directly to the foramen ovale; it does not enter the cavernous sinus.'],
      cn5: ['Trigeminal nerve root', 'N. trigeminus', 'Leaves the pons and passes over the petrous apex into Meckel’s cave.'],
      gg: ['Trigeminal (Gasserian) ganglion', 'Ganglion trigeminale', 'Lies in Meckel’s cave; V1, V2 and V3 arise from it.'],
      cn6: ['Abducens nerve (CN VI)', 'N. abducens', 'Passes through Dorello’s canal and runs free WITHIN the sinus, inferolateral to the ICA. Tumor filling the inferior compartment (grade 3B) can encase it.'],
      tumor: ['Pituitary macroadenoma', 'PitNET', 'A sellar adenoma with suprasellar and lateral extension. The position of its lateral extension relative to the ICA determines the Knosp grade.']
    },
    steps: [
      {
        kicker: 'Introduction', title: 'The sellar region',
        body: `<p>As pituitary adenomas (PitNETs) enlarge, they most often extend laterally into the <b>cavernous sinus</b>. The <b>Knosp classification</b> (Knosp 1993; modified by Micko 2015) grades this extension on coronal contrast-enhanced T1-weighted MRI, using three lines drawn in relation to the <b>internal carotid artery (ICA)</b>.</p>
        <p>The model approximates real dimensions on a millimeter scale. Drag to rotate, scroll to zoom, right-drag (or use two fingers) to pan. Click any structure for a description.</p>`,
        facts: [['Cavernous ICA diameter', '≈ 5 mm'], ['Intercarotid distance', '≈ 17 mm'], ['Sellar width', '12–15 mm']]
      },
      {
        kicker: 'Bony framework', title: 'Sella turcica and sphenoid bone',
        body: `<p>The sella turcica is a depression on the superior surface of the sphenoid body. Anteriorly lie the <b>tuberculum sellae</b> and <b>planum sphenoidale</b>; posteriorly, the <b>dorsum sellae</b> and posterior clinoid processes.</p>
        <p><b>The sella has no lateral bony wall.</b> On each side the ICA runs in the carotid sulcus on the lateral surface of the sphenoid body, and the lateral boundary is the thin medial wall of the cavernous sinus. This is why adenomas extend laterally so readily.</p>
        <p>The anterior clinoid process covers the clinoid segment of the ICA (C5) laterally and superiorly.</p>`
      },
      {
        kicker: 'Surgical corridor', title: 'Endonasal perspective',
        body: `<p>In the endoscopic endonasal approach, once the anterior wall of the sphenoid sinus is opened, the surgeon first identifies the <b>sellar floor</b> (sellar bulge) and, on either side, the <b>carotid prominences</b>.</p>
        <p>The intersinus septum is often off the midline and may insert onto a carotid prominence. To see the course of the ICA behind the bone, lower the bone opacity in the <i>Layers</i> tab.</p>`
      },
      {
        kicker: 'Sellar contents', title: 'Pituitary gland, stalk and diaphragma',
        body: `<p>The <b>adenohypophysis</b> (anterior lobe) makes up about 75% of the gland and is the origin of adenomas. The <b>neurohypophysis</b> (posterior lobe) produces the T1 bright spot.</p>
        <p>The <b>pituitary stalk</b> passes through the central opening of the <b>diaphragma sellae</b>, the dural roof of the sella. The <b>optic chiasm</b> lies about 5–10 mm above the diaphragma; suprasellar extension compresses it from below and causes bitemporal hemianopia.</p>`
      },
      {
        kicker: 'Venous compartment', title: 'Cavernous sinus',
        body: `<p>The cavernous sinus is a dural venous space on each side of the sella, extending from the superior orbital fissure to the petrous apex.</p>
        <p>The <b>lateral wall</b> has two layers and carries the cranial nerves. The <b>medial wall</b> (sellar wall) is a single thin dural layer, and adenomas enter the sinus through it.</p>
        <p>Relative to the ICA, the sinus is divided into <b>superior</b>, <b>posterior</b>, <b>inferior</b> and <b>lateral</b> venous compartments. Micko’s 3A/3B distinction is based on the superior versus the inferior compartment.</p>`
      },
      {
        kicker: 'Arterial framework', title: 'ICA: the carotid siphon',
        body: `<p>The ICA leaves the petrous canal and ascends above the foramen lacerum. Within the cavernous sinus it forms a <b>posterior bend → horizontal segment → anterior bend</b> (<b>C4</b>, Bouthillier). The short part between the two dural rings is the <b>clinoid</b> segment (C5); above the distal ring follow the <b>ophthalmic</b> (C6) and <b>communicating</b> (C7) segments.</p>
        <p>A coronal section shows both limbs of the siphon: the <b>intracavernous</b> ICA below and the <b>supraclinoid</b> ICA above. The Knosp lines are drawn between these two cross-sections.</p>`,
        facts: [['Bone opacity', '22% (ICA course visible)']]
      },
      {
        kicker: 'Lateral wall', title: 'Cranial nerves',
        body: `<p>From superior to inferior, the lateral wall contains the <b>oculomotor (III)</b>, <b>trochlear (IV)</b>, <b>ophthalmic (V1)</b> and <b>maxillary (V2)</b> nerves.</p>
        <p>The <b>abducens nerve (VI)</b> passes through Dorello’s canal and runs free <b>within</b> the sinus, inferolateral to the ICA. <b>V3</b> does not enter the sinus; it descends from the ganglion in Meckel’s cave to the foramen ovale.</p>
        <p>Cranial nerve deficits are uncommon in adenomas despite cavernous sinus invasion. Sudden ophthalmoplegia suggests pituitary apoplexy, most often affecting CN III.</p>`
      },
      {
        kicker: 'Measurement plane', title: 'Coronal section and Knosp lines',
        body: `<p>The grade is assigned on <b>coronal contrast-enhanced T1</b> slices in which both limbs of the carotid siphon are visible. Three lines are drawn on each side:</p>
        <ul class="lines-key">
          <li><i class="k-med"></i><span><b>Medial tangent</b>: connects the medial walls of the intracavernous and supraclinoid ICA.</span></li>
          <li><i class="k-cen"></i><span><b>Intercarotid line</b>: connects the centers of the two cross-sections.</span></li>
          <li><i class="k-lat"></i><span><b>Lateral tangent</b>: connects their lateral walls.</span></li>
        </ul>
        <p>Each side is graded separately, and the slice with the greatest extension is decisive. Use the slider below to move the section plane anteriorly and posteriorly.</p>`
      },
      null, null, null, null, null, null,
      {
        kicker: 'Summary', title: 'Clinical significance',
        body: summary('en', 'Grade', 'Surgical invasion', 'Surgical remission', '228 cases', [
          'Grades 3–4 are generally considered invasive. Separating 3A from 3B matters for prognosis: grade 3A behaves like grade 2, and grade 3B like grade 4.',
          'The Knosp grade measures lateral extension only. Combine it with classifications such as Hardy–Wilson for suprasellar and sphenoid extension.',
          'Interobserver variability is notable, especially at the grade 2–3A boundary. Review several consecutive coronal slices on the more doubtful side.'
        ])
      }
    ],
    gradeBodies: {
      g0: `<p>The tumor has grown within the sella and into the suprasellar space but does <b>not cross the medial tangent</b>. The normal gland is displaced to the opposite side.</p><p>The medial wall of the cavernous sinus is intact, and invasion is not expected.</p>`,
      g1: `<p>The tumor <b>crosses the medial tangent</b> but <b>does not reach the intercarotid line</b>. The medial wall is usually displaced (compressed) rather than breached.</p>`,
      g2: `<p>The tumor <b>crosses the intercarotid line</b> but <b>does not reach the lateral tangent</b>, insinuating between the two ICA cross-sections.</p><p>True invasion is still uncommon, but MRI cannot always distinguish compression from invasion.</p>`,
      g3a: `<p>The tumor extends beyond the <b>lateral tangent</b> <b>above</b> the intracavernous ICA, filling the <b>superior compartment</b>. CN III, IV and V1 in the lateral wall are displaced laterally.</p><p>Its behavior resembles grade 2, and it is more accessible surgically.</p>`,
      g3b: `<p>The tumor extends beyond the <b>lateral tangent</b> <b>below</b> the intracavernous ICA, filling the <b>inferior compartment</b>. The <b>abducens nerve</b>, which runs in this compartment, may be encased.</p><p>True invasion is very likely; its behavior resembles grade 4.</p>`,
      g4: `<p>The intracavernous ICA is <b>totally (360°) encased</b> by tumor. Cavernous sinus invasion is certain.</p><p>Gross total resection is rarely achievable. Radiosurgery and, for functioning adenomas, medical therapy are considered for residual tumor.</p>`
    },
    gradeKicker: 'Knosp grade', gradeTitle: 'Grade {g}',
    gradeFacts: (g) => [['Surgically confirmed invasion', INV[g] == null ? 'not expected' : pct(INV[g], 'en')], ['Source', 'Micko et al. 2015']]
  };

  function summary(lang, hG, hInv, hRem, nRem, bullets) {
    const rem = { g0: 86.5, g1: 88.6, g2: 77.1, g3a: 56.0, g3b: 30.0, g4: 14.0 };
    const rows = ['g0', 'g1', 'g2', 'g3a', 'g3b', 'g4'].map((g) =>
      `<tr><td><span class="gchip g-${g}">${GT[g]}</span></td><td>${INV[g] == null ? '—' : pct(INV[g], lang)}</td><td>${pct(rem[g].toFixed(1), lang)}</td></tr>`).join('');
    return `<table class="sum"><thead><tr><th>${hG}</th><th>${hInv}<br><small>Micko 2015</small></th><th>${hRem}<br><small>${nRem}</small></th></tr></thead><tbody>${rows}</tbody></table>
    <ul class="bul">${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
  }

  // fill generated grade steps (indices 8–13)
  for (const L of [tr, en]) {
    ['g0', 'g1', 'g2', 'g3a', 'g3b', 'g4'].forEach((g, i) => {
      L.steps[8 + i] = {
        kicker: L.gradeKicker, title: L.gradeTitle.replace('{g}', GT[g]),
        body: `<p class="def"><span class="gchip g-${g}">${GT[g]}</span><span>${L.grade[g]}</span></p>` + L.gradeBodies[g],
        facts: L.gradeFacts(g)
      };
    });
  }
  return { tr, en, GT };
})();
