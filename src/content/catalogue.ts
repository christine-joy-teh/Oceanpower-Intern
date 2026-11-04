import type { Locale } from '../lib/routes';

export type Localized = { en:string; zh:string; es?:string; fr?:string };
export const local = (value:Localized, locale:Locale) => value[locale] || value.en;

const enZh = (en:string, zh:string):Localized => ({en,zh});

export const fibreProducts = {
  gfrp: {
    id:'gfrp', code:'01 / GLASS FIBER', route:'products/gfrp',
    name:enZh('GFRP Rebar','玻璃纤维增强筋（GFRP）'),
    short:enZh('Corrosion-resistant, lightweight and non-magnetic reinforcement.','耐腐蚀、轻质且不导磁的复合筋材。'),
    lead:enZh('Glass-fiber reinforcement for concrete structures exposed to corrosion, weight or electromagnetic constraints.','适用于腐蚀、减重或电磁敏感环境混凝土结构的玻璃纤维增强筋材。'),
    description:enZh('The latest Haichuan FRP manual describes pultruded GFRP rebar made from glass fibre, resin and curing materials. The standard tensile value changes with bar diameter, so the diameter class must be kept with every quoted value.','最新版海川 FRP 产品手册将 GFRP 筋描述为由玻璃纤维、树脂及固化材料经拉挤工艺成型的复合筋材。抗拉强度标准值随直径分档，引用参数时必须同时保留直径范围。'),
    image:'/assets/gfrp-product.jpg',
    alt:enZh('Glass-fiber reinforcement bars','玻璃纤维增强筋材'),
    facts:[
      {value:'≥110 MPa',label:enZh('Shear strength standard value','抗剪强度标准值')},
      {value:'≥1.2%',label:enZh('Ultimate tensile strain','极限拉应变')},
      {value:'≥40 GPa',label:enZh('Elastic modulus','弹性模量')},
    ],
    columns:[enZh('Bar diameter d','筋材直径 d'),enZh('Tensile strength standard value','抗拉强度标准值'),enZh('Shear strength','抗剪强度'),enZh('Ultimate tensile strain','极限拉应变'),enZh('Elastic modulus','弹性模量')],
    rows:[
      ['d < 16 mm','≥600 MPa','≥110 MPa','≥1.2%','≥40 GPa'],
      ['16 mm ≤ d < 25 mm','≥550 MPa','≥110 MPa','≥1.2%','≥40 GPa'],
      ['25 mm ≤ d < 34 mm','≥500 MPa','≥110 MPa','≥1.2%','≥40 GPa'],
      ['d ≥ 34 mm','≥450 MPa','≥110 MPa','≥1.2%','≥40 GPa'],
    ],
    tableNote:enZh('The manual states a 95% guarantee rate for the GFRP tensile-strength standard value. Product mechanics are referenced to JG/T 406-2013.','手册注明 GFRP 筋抗拉强度标准值保证率为 95%，产品力学性能参照 JG/T 406-2013。'),
    applications:[
      enZh('Shield-tunnel cuttable reinforcement','盾构可切削混凝土配筋'),
      enZh('Coastal and marine concrete structures','海工及沿海混凝土结构'),
      enZh('Concrete road and bridge decks','混凝土路面与桥面'),
      enZh('Highway concrete guardrails','公路混凝土护栏'),
    ],
    source:enZh('Source: Haichuan New Materials FRP Product Manual, printed p. 4. Catalogue reference; confirm the project specification and current test documents.','来源：海川新材料《纤维增强复合材料产品手册》，印刷页 4。目录参数仅供参考，项目规格及现行检测文件须另行确认。'),
  },
  bfrp: {
    id:'bfrp', code:'02 / BASALT FIBER', route:'products/bfrp',
    name:enZh('BFRP Rebar','玄武岩纤维增强筋（BFRP）'),
    short:enZh('Basalt-fibre reinforcement with catalogue minimum mechanical values.','具有目录最低力学性能值的玄武岩纤维增强筋材。'),
    lead:enZh('Basalt-fibre reinforcement for corrosion-resistant and electrically insulating applications.','适用于耐腐蚀及电绝缘应用的玄武岩纤维增强筋材。'),
    description:enZh('The new manual describes BFRP as basalt fibre combined with an epoxy resin matrix, fillers and curing agents through pultrusion. It lists density and minimum tensile, modulus and elongation values.','新手册将 BFRP 描述为玄武岩纤维与环氧树脂基体、填料及固化剂经拉挤成型的复合材料，并列出密度及抗拉强度、弹性模量和伸长率最低值。'),
    image:'/assets/bfrp-product.jpg',
    alt:enZh('Basalt-fiber reinforcement bars','玄武岩纤维增强筋材'),
    facts:[
      {value:'≥750 MPa',label:enZh('Tensile strength standard value','抗拉强度标准值')},
      {value:'≥40 GPa',label:enZh('Elastic modulus','弹性模量')},
      {value:'≥1.8%',label:enZh('Elongation','伸长率')},
    ],
    columns:[enZh('Property','性能'),enZh('Catalogue value','目录值')],
    rows:[
      [enZh('Density','密度'),'1.9–2.1 g/cm³'],
      [enZh('Tensile strength standard value','抗拉强度标准值'),'≥750 MPa'],
      [enZh('Elastic modulus','弹性模量'),'≥40 GPa'],
      [enZh('Elongation','伸长率'),'≥1.8%'],
    ],
    tableNote:enZh('The manual references JT/T 776.4-2010 for BFRP products. Diameter and project-specific design values are not stated in this table.','手册注明 BFRP 产品参照 JT/T 776.4-2010；本表未列直径及项目设计值。'),
    applications:[
      enZh('Corrosive concrete environments','腐蚀性混凝土环境'),
      enZh('Electrically insulating reinforcement zones','电绝缘配筋区域'),
      enZh('Projects requiring low-weight reinforcement','需要轻质配筋的项目'),
    ],
    source:enZh('Source: Haichuan New Materials FRP Product Manual, printed p. 5. Catalogue reference; confirm diameter, resin system and project design values.','来源：海川新材料《纤维增强复合材料产品手册》，印刷页 5。目录参数仅供参考，直径、树脂体系及项目设计值须另行确认。'),
  },
  cfrp: {
    id:'cfrp', code:'03 / CARBON FIBER', route:'products/cfrp',
    name:enZh('CFRP Rebar','碳纤维增强筋（CFRP）'),
    short:enZh('High-strength, low-weight carbon-fibre reinforcement.','高强、轻质的碳纤维增强筋材。'),
    lead:enZh('Carbon-fibre reinforcement for projects that require high tensile performance with low structural weight.','适用于高抗拉性能及结构减重需求的碳纤维增强筋材。'),
    description:enZh('The latest manual describes CFRP rebar made from carbon fibre and epoxy resin, with a full-thread surface to improve concrete adhesion. It provides minimum mechanical values rather than the older ranges shown on the prototype.','最新版手册将 CFRP 筋描述为采用碳纤维和环氧树脂制成、以全螺纹表面提高与混凝土粘结力的轻质高强筋材，并采用最低力学性能值，而非原型网站此前展示的区间值。'),
    image:'/assets/cfrp-production.jpg',
    alt:enZh('Carbon-fiber reinforcement production','碳纤维增强筋生产'),
    facts:[
      {value:'≥1800 MPa',label:enZh('Tensile strength standard value','抗拉强度标准值')},
      {value:'≥120 GPa',label:enZh('Elastic modulus','弹性模量')},
      {value:'≥1.5%',label:enZh('Elongation','伸长率')},
    ],
    columns:[enZh('Property','性能'),enZh('Catalogue value','目录值')],
    rows:[
      [enZh('Tensile strength standard value','抗拉强度标准值'),'≥1800 MPa'],
      [enZh('Elastic modulus','弹性模量'),'≥120 GPa'],
      [enZh('Elongation','伸长率'),'≥1.5%'],
    ],
    tableNote:enZh('The manual references JG/T 351-2012 for CFRP products. Diameter, density and project-specific design values are not stated in this table.','手册注明 CFRP 产品参照 JG/T 351-2012；本表未列直径、密度及项目设计值。'),
    applications:[
      enZh('High-strength reinforcement zones','高强配筋区域'),
      enZh('Projects with strict structural-weight constraints','对结构重量要求严格的项目'),
      enZh('Concrete systems requiring enhanced surface bond','需要提高界面粘结力的混凝土体系'),
    ],
    source:enZh('Source: Haichuan New Materials FRP Product Manual, printed p. 5. Catalogue reference; confirm grade, diameter and project design values.','来源：海川新材料《纤维增强复合材料产品手册》，印刷页 5。目录参数仅供参考，等级、直径及项目设计值须另行确认。'),
  },
} as const;

export const categoryPortfolios = {
  'products/fibre-reinforced-composites': {
    eyebrow:'FRP PRODUCT MANUAL',
    intro:enZh('The latest Haichuan manual expands the website beyond three rebar materials. It also documents a separate all-thread resin anchor bar and application systems for tunnelling, slopes, marine concrete, roads, bridges and guardrails.','最新版海川手册将网站内容由三类复合筋材扩展至独立的全螺纹树脂锚杆，并补充盾构、边坡、海工混凝土、道路桥梁及护栏等应用体系。'),
    notice:enZh('Values below are catalogue references, not interchangeable design values. Keep each figure with its product and diameter, and obtain engineering confirmation before specifying.','以下参数为目录参考值，不同产品及直径的参数不可互换。设计选用前须取得工程确认。'),
    products:[
      ...Object.values(fibreProducts).map(product=>({
        id:product.id,
        name:product.name,
        summary:product.short,
        facts:product.facts.map((fact:any)=>({label:fact.label,value:fact.value})),
        applications:product.applications,
        href:product.route,
        source:product.source,
      })),
      {
        id:'gfrp-anchor-bar',
        name:enZh('GFRP All-thread Resin Anchor Bar','GFRP 全螺纹树脂锚杆'),
        summary:enZh('A distinct anchoring product for tunnel and slope reinforcement; its values must not be substituted with GFRP rebar specifications.','用于隧道及边坡加固的独立锚固产品，其参数不得与 GFRP 筋材参数混用。'),
        facts:[
          {label:enZh('Available diameters in the table','表列直径'),value:'18 / 20 / 22 / 24 / 27 / 32 mm'},
          {label:enZh('Tensile strength','抗拉强度'),value:'≥300 MPa'},
          {label:enZh('Shear strength','抗剪切强度'),value:'≥75 MPa'},
          {label:enZh('Torque','扭矩'),value:'≥45 N·m'},
        ],
        applications:[enZh('Tunnel anchoring','隧道锚固'),enZh('Highway-slope reinforcement','公路边坡加固'),enZh('Mine roadway support','矿山巷道支护')],
        source:enZh('Source: Haichuan New Materials FRP Product Manual, printed p. 6. Anchoring force and component capacities vary by diameter; request the complete current table before specifying.','来源：海川新材料《纤维增强复合材料产品手册》，印刷页 6。锚固力及部件承载力随直径变化，设计选用前请索取完整现行参数表。'),
      },
    ],
  },
  'products/asphalt-based-products': {
    eyebrow:'ASPHALT MATERIAL SYSTEMS',
    intro:enZh('The new knowledge set introduces a coordinated asphalt portfolio for rutting resistance, drainage, tunnel fire safety, warm-mix construction, recycling and coloured pavement.','新增资料形成了覆盖抗车辙、排水降噪、隧道阻燃、温拌施工、再生利用及彩色路面的沥青材料体系。'),
    notice:enZh('Performance and dosage depend on the binder, gradation, climate, traffic and construction process. Use these pages to identify the product family, then confirm the project mix design with Haichuan technical staff.','性能及掺量取决于沥青、级配、气候、交通荷载及施工工艺。本页用于识别产品系列，项目配合比须由海川技术人员确认。'),
    products:[
      {
        id:'rad-spunrie',name:enZh('Rad Spunrie anti-rutting modifier','车辙王抗车辙剂'),
        summary:enZh('A directly added composite polymer modifier for improving high-temperature rutting resistance without separate modified-asphalt equipment.','可直接投放的复合聚合物改性剂，无需专用改性沥青设备，用于提高高温抗车辙性能。'),
        facts:[{label:enZh('Typical dosage','典型掺量'),value:'0.3–0.5%'},{label:enZh('Special-zone dosage','特殊区域掺量'),value:'0.7–0.9%'},{label:enZh('Addition method','投放方式'),value:'Dry-process / 直投'}],
        details:[
          {title:enZh('How the manual describes it','手册所述作用机理'),items:[enZh('Composite polymers provide asphalt modification, reinforcement, filling and elastic recovery','复合聚合物通过沥青改性、加筋、填充及弹性恢复发挥作用'),enZh('Direct addition avoids separate modified-asphalt production and storage','直接投入拌缸，无需单独制备及储存改性沥青'),enZh('The aggregate gradation stays unchanged; the oil-stone ratio may still require adjustment','集料级配保持不变，但油石比仍可能需要调整')]},
          {title:enZh('Catalogue construction notes','目录施工要点'),items:[enZh('Add with hot aggregate and extend dry mixing by 8–10 seconds','随热集料投入，干拌时间延长 8–10 秒'),enZh('Typical dosage is by total asphalt-mixture mass','典型掺量按沥青混合料总质量计'),enZh('Layer selection, temperature and rolling sequence require a project trial mix','结构层、温度及碾压工艺须通过项目试拌确认')]},
        ],
        applications:[enZh('Heavy-traffic and hot-climate highways','重交通及高温地区公路'),enZh('Intersections and bus lanes','交叉口及公交车道'),enZh('Airport runways','机场跑道')],
        source:enZh('Source: Shenzhen Haichuan Rad Spunrie Product Manual. Dosage is relative to total asphalt-mixture mass and requires mix-design confirmation.','来源：深圳海川《抗车辙产品手册》。掺量按沥青混合料总质量计，须经配合比验证。'),
      },
      {
        id:'sinotps',name:enZh('SINOTPS high-viscosity modifier','SINOTPS 高粘改性剂'),
        summary:enZh('A high-viscosity asphalt system for porous drainage and noise-reducing pavements, plus bridge-deck and stress-absorbing layers.','用于排水降噪路面，并可延伸至桥面防水粘结层及应力吸收层的高粘沥青体系。'),
        facts:[{label:enZh('Typical porous surface','典型排水面层'),value:'OGFC-13'},{label:enZh('Typical surface thickness','典型面层厚度'),value:'4 cm'},{label:enZh('Catalogue noise reduction','目录降噪值'),value:'3–5 dB'}],
        details:[
          {title:enZh('Two production routes','两种生产路线'),items:[enZh('Wet route: prepare high-viscosity asphalt from base asphalt first','湿法：先以基质沥青制备高黏沥青'),enZh('Dry route: mix SINOTPS with aggregate before adding base asphalt','干法：先将 SINOTPS 与集料干拌，再加入基质沥青'),enZh('The route must match the plant, binder and mix-design requirements','生产路线须与拌合站、基质沥青及配合比要求匹配')]},
          {title:enZh('Catalogue reference performance','目录参考性能'),items:[enZh('60°C viscosity: 102,636 Pa·s in the stated grade-70 binder test','手册所列 70 号基质沥青试验中，60°C 黏度为 102,636 Pa·s'),enZh('OGFC-13 immersed-Marshall residual stability: 88.9%','OGFC-13 浸水马歇尔残留稳定度为 88.9%'),enZh('OGFC-13 freeze-thaw splitting residual strength ratio: 93.7%','OGFC-13 冻融劈裂残留强度比为 93.7%')]},
        ],
        applications:[enZh('Porous drainage pavement','排水路面'),enZh('Bridge-deck waterproof bonding','桥面防水粘结'),enZh('Stress-absorbing layers','应力吸收层'),enZh('High-performance SMA','高性能 SMA')],
        source:enZh('Source: Haichuan SINOTPS High-Viscosity Product Manual. Structure and performance require project-specific pavement design.','来源：海川《高粘产品手册》。结构及性能须结合具体项目进行路面设计。'),
      },
      {
        id:'frmax',name:enZh('FRMAX™ flame-retardant modifier','FRMAX™ 阻燃剂'),
        summary:enZh('High-efficiency and eco-friendly product types for flame-retardant, smoke-suppressed tunnel asphalt pavement.','面向隧道沥青路面的高效型及环保型阻燃、抑烟产品。'),
        facts:[{label:enZh('Product types','产品类型'),value:enZh('High-efficiency / Eco-friendly','高效型 / 环保型')},{label:enZh('High-efficiency oxygen index at 10% dosage','高效型 10% 掺量氧指数'),value:'≥30'},{label:enZh('Eco-friendly oxygen index at 20% dosage','环保型 20% 掺量氧指数'),value:'≥28'}],
        details:[
          {title:enZh('High-efficiency type','高效型'),items:[enZh('White powder with effective flame-retardant content ≥85%','白色粉末，有效阻燃成分 ≥85%'),enZh('Catalogue relationship: oxygen index ≥26 / ≥28 / ≥30 at 8% / 9% / 10% dosage in asphalt','目录对应关系：掺量 8% / 9% / 10% 时，氧指数 ≥26 / ≥28 / ≥30'),enZh('Uses synergistic organic flame retardants and inorganic metal oxides','采用有机阻燃剂与无机金属氧化物协同体系')]},
          {title:enZh('Eco-friendly type','环保型'),items:[enZh('Purplish-red granules with effective flame-retardant content ≥70%','紫红色颗粒，有效阻燃成分 ≥70%'),enZh('Catalogue relationship: oxygen index ≥24 / ≥26 / ≥28 at 10% / 15% / 20% dosage in asphalt','目录对应关系：掺量 10% / 15% / 20% 时，氧指数 ≥24 / ≥26 / ≥28'),enZh('The manual describes low toxicity and no corrosive gas during its protective-carbonisation action','手册称其在脱水成炭保护过程中低毒且不产生腐蚀性气体')]},
        ],
        applications:[enZh('Long road tunnels','长大公路隧道'),enZh('Tunnel sections requiring flame-retardant pavement','有阻燃要求的隧道路段')],
        source:enZh('Source: Haichuan FRMAX™ Flame-Retardant Product Manual. Dosage and oxygen-index targets are product-type specific.','来源：海川《阻燃产品手册》。掺量及氧指数目标须按具体产品类型选用。'),
      },
      {
        id:'ec-series',name:enZh('EC series warm-mix additives','EC 系列温拌剂'),
        summary:enZh('EC-130 uses water-bearing mineral material to foam asphalt; EC-120 changes the viscosity-temperature relationship through a polyolefin modifier.','EC-130 利用含水无机矿物材料使沥青发泡；EC-120 通过聚烯烃类改性剂改变粘温关系。'),
        facts:[{label:enZh('Catalogue temperature reduction','目录降温幅度'),value:'20–35°C'},{label:enZh('EC-130 type','EC-130 类型'),value:enZh('Zeolite mineral','沸石矿物')},{label:enZh('EC-120 type','EC-120 类型'),value:enZh('Polyolefin modifier','聚烯烃改性剂')}],
        details:[
          {title:enZh('EC-130 · foaming route','EC-130 · 发泡路线'),items:[enZh('Water-bearing inorganic mineral commonly described as zeolite','含水无机矿物材料，通常称为沸石'),enZh('Releases water at around 100°C to foam asphalt and reduce viscosity','在约 100°C 释放水分，使沥青发泡并降低黏度'),enZh('The manual assigns the 20–35°C reduction specifically to EC-130','手册将 20–35°C 的降温幅度明确用于 EC-130')]},
          {title:enZh('EC-120 · viscosity-temperature route','EC-120 · 黏温改性路线'),items:[enZh('Polyolefin-type viscosity-reducing modifier','聚烯烃类降黏改性剂'),enZh('Changes the asphalt viscosity-temperature curve','改变沥青黏温曲线'),enZh('Grade selection depends on binder, plant route and target workability','型号选择取决于基质沥青、拌合工艺及目标和易性')]},
        ],
        applications:[enZh('Low-temperature construction','低温施工'),enZh('Long tunnels','长大隧道'),enZh('Ultra-thin overlays','超薄罩面'),enZh('Asphalt recycling','沥青再生')],
        source:enZh('Source: Shenzhen Haichuan EC Series Warm-Mix Product Manual. Verify dosage, mixing temperature and mixture performance by project testing.','来源：深圳海川《温拌产品手册》。掺量、拌和温度及混合料性能须通过项目试验验证。'),
      },
      {
        id:'op-series',name:enZh('OP series asphalt regenerant','OP 系列沥青再生剂'),
        summary:enZh('A hot-mix recycling additive intended to restore aged-asphalt performance in reclaimed pavement mixtures.','用于热拌再生混合料、改善老化沥青性能的再生添加剂。'),
        facts:[{label:enZh('OP-900 application','OP-900 适用对象'),value:enZh('Penetration-grade asphalt','重交道路沥青')},{label:enZh('OP-1100 application','OP-1100 适用对象'),value:enZh('Modified asphalt','改性沥青')},{label:enZh('Physical form','产品形态'),value:enZh('Brown flowable liquid','棕色流动液体')}],
        details:[
          {title:enZh('Grade selection','型号选择'),items:[enZh('OP-900 is for reclaimed penetration-grade / heavy-duty road asphalt','OP-900 用于重交道路沥青的再生'),enZh('OP-1100 is for reclaimed modified asphalt','OP-1100 用于改性沥青的再生'),enZh('The grades are not interchangeable without testing the reclaimed binder','未检测回收沥青前，不应互换两种型号')]},
          {title:enZh('What must be tested','项目检测重点'),items:[enZh('RAP proportion and recovered-binder condition','RAP 掺配比例及回收沥青状态'),enZh('Target penetration, softening, ductility and mixture performance','目标针入度、软化、延度及混合料性能'),enZh('Plant hot recycling or in-place hot recycling process','厂拌热再生或就地热再生工艺')]},
        ],
        applications:[enZh('Plant hot recycling','厂拌热再生'),enZh('In-place hot recycling','就地热再生')],
        source:enZh('Source: Haichuan OP Series Asphalt Regenerant Product Manual. Select the grade after testing the reclaimed asphalt material.','来源：海川《再生剂产品手册》。产品型号须在检测回收沥青材料后确定。'),
      },
      {
        id:'roadpower',name:enZh('RoadPower coloured pavement systems','RoadPower 彩色路面体系'),
        summary:enZh('A portfolio covering coloured asphalt binder and colorant, anti-skid polymer surfacing, and a repair coating for aged coloured pavement.','涵盖彩色沥青胶结料与色粉、彩色防滑聚合物铺装及旧彩色路面修复涂层的产品体系。'),
        facts:[{label:enZh('Anti-skid texture depth','防滑构造深度'),value:'1.6–2.0 mm'},{label:enZh('Pendulum value','摆式摩擦值'),value:'75–85 BPN'},{label:enZh('Repair-layer thickness','修复层建议厚度'),value:'0.5–1 mm'}],
        details:[
          {title:enZh('Coloured asphalt concrete','彩色沥青混凝土'),items:[enZh('RoadPower binder grades: OP-90, OP-70 and OP-50','RoadPower 胶结料型号：OP-90、OP-70 及 OP-50'),enZh('Typical coloured layer: 2–4 cm, determined by application','彩色面层典型厚度为 2–4 cm，须按应用确定'),enZh('Binder, colorant, aggregate and mixture design form one coordinated system','胶结料、色粉、集料及配合比构成完整体系')]},
          {title:enZh('Anti-skid polymer surfacing','彩色防滑聚合物铺装'),items:[enZh('Resin components, wear-resistant aggregate and UV-resistant top coat','由树脂组分、耐磨骨料及抗紫外面涂组成'),enZh('Traffic-based catalogue thickness: 1–2 / 2–4 / 2–5 mm for light / medium / heavy traffic','目录按轻 / 中 / 重交通给出 1–2 / 2–4 / 2–5 mm 厚度'),enZh('Used where visual channelisation and skid resistance are both required','适用于同时需要交通导向及防滑性能的区域')]},
          {title:enZh('Coloured asphalt repair coating','彩色沥青修复涂层'),items:[enZh('Single sprayed or rolled layer for aged or faded coloured pavement','用于老化或褪色彩色路面的单层喷涂或滚涂修复'),enZh('Catalogue tack-free drying time: ≤1 hour','目录表干时间：≤1 小时'),enZh('May also colour black asphalt or cement-concrete surfaces after substrate review','经基层条件复核后，也可用于黑色沥青或水泥混凝土着色')]},
        ],
        applications:[enZh('Greenways and cycle lanes','绿道及自行车道'),enZh('Bus lanes and traffic guidance','公交车道及交通导向'),enZh('Ramps, curves and crossings','匝道、弯道及人行横道'),enZh('Coloured pavement maintenance','彩色路面养护')],
        source:enZh('Source: Shenzhen Haichuan Coloured Asphalt Product Manual. Colour, layer thickness and construction temperature require project confirmation.','来源：深圳海川《彩色沥青产品手册》。颜色、层厚及施工温度须按项目确认。'),
      },
    ],
  },
  'products/integrated-solutions': {
    eyebrow:'2026 AIRPORT PAVEMENT MANUAL',
    intro:enZh('The updated 2026 manual presents five dedicated airport-asphalt product groups: polyester fibre, anti-rutting, high-viscosity, high-modulus and warm-mix systems. This page keeps each product role, dosage note and construction route separate.','更新后的 2026 年手册列出五类机场沥青道面专用产品：聚酯纤维、抗车辙、高黏、高模量及温拌材料。本页将各产品的作用、目录掺量及施工方式分开说明。'),
    notice:enZh('Catalogue values are starting references, not a pavement design or approval. The manual expressly requires users to verify technical data through their own tests. Confirm the mixture, binder, gradation, loading, climate, construction window and applicable airport standards before selection.','目录参数仅用于初步筛选，不构成道面设计或批准。手册明确要求用户自行试验确认技术数据。选型前须核对混合料、基质沥青、级配、荷载、气候、施工窗口及适用机场标准。'),
    products:[
      {
        id:'am-400',name:enZh('AM-400 polyester fibre for airport asphalt concrete','AM-400 机场沥青砼专用聚酯纤维'),
        summary:enZh('A bundled monofilament synthetic fibre intended to stabilise and reinforce asphalt mixtures for airport pavement and other demanding surfaces.','用于稳定并加筋沥青混合料的束状单丝合成纤维，适用于机场道面及其他高要求铺装。'),
        facts:[
          {label:enZh('Product form','产品形态'),value:enZh('Bundled monofilament polyester fibre','束状单丝聚酯纤维')},
          {label:enZh('Catalogue dosage','目录掺量'),value:'0.2–0.3%'},
          {label:enZh('Mixing sequence','拌和顺序'),value:enZh('Dry mix before hot asphalt','先干拌，再加入热沥青')},
          {label:enZh('Additional dry mixing','延长干拌时间'),value:'5–15 s'},
        ],
        applications:[enZh('Airport asphalt pavement','机场沥青道面'),enZh('Bridge-deck pavement','桥梁铺装'),enZh('High-grade highways','高等级公路'),enZh('Key municipal roads','重要市政道路')],
        details:[
          {title:enZh('Catalogue-described functions','手册所述作用'),items:[enZh('Stabilises and reinforces the asphalt mixture','稳定并加筋沥青混合料'),enZh('Supports mixture dispersion and high-temperature stability','改善混合料分散性及高温稳定性'),enZh('Supports low-temperature and water stability','改善低温稳定性及水稳定性')]},
        ],
        source:enZh('Source: Oceanpower 2026 Airport Pavement Solution Manual, printed pp. 13–14. Dosage and mixing time are catalogue references and require project testing.','来源：海川《2026 机场道面解决方案》，印刷页 13–14。掺量及拌和时间为目录参考值，须经项目试验确认。'),
      },
      {
        id:'am-500',name:enZh('AM-500 anti-rutting additive for airport asphalt concrete','AM-500 机场沥青砼专用抗车辙添加剂'),
        summary:enZh('A directly added composite-polymer modifier intended to improve strength, high-temperature rutting resistance, water stability and cracking resistance in airport asphalt mixtures.','可直接投入拌缸的复合高聚物改性剂，用于改善机场沥青混合料的强度、高温抗车辙、水稳定性及抗裂性。'),
        facts:[
          {label:enZh('Catalogue dosage','目录掺量'),value:'0.3–0.6%'},
          {label:enZh('Applicable structures','适用结构'),value:'AC / SMA'},
          {label:enZh('Addition method','投放方式'),value:enZh('Direct addition to mixer','直接投入拌缸')},
          {label:enZh('Mixing-time note','拌和时间说明'),value:enZh('+5 s dry and wet mixing','干拌、湿拌各延长 5 s')},
        ],
        applications:[enZh('Airport asphalt structural layers','机场沥青道面结构层'),enZh('High-temperature service','高温服役环境'),enZh('Heavy-load pavement','重载道面'),enZh('AC and SMA mixtures','AC 与 SMA 混合料')],
        details:[
          {title:enZh('Selection intent','选型目标'),items:[enZh('High-temperature rutting and shoving control','控制高温车辙及推移'),enZh('Mixture modification without changing aggregate gradation','不改变集料级配的混合料改性'),enZh('Project oil-stone ratio and temperatures still require adjustment','油石比及施工温度仍须按项目调整')]},
        ],
        source:enZh('Source: Oceanpower 2026 Airport Pavement Solution Manual, printed pp. 15–16. The manual gives project-dependent mixing and temperature guidance; confirm it through trial mixing.','来源：海川《2026 机场道面解决方案》，印刷页 15–16。手册所列拌和及温度要求与项目条件相关，须通过试拌确认。'),
      },
      {
        id:'am-600',name:enZh('AM-600 high-viscosity additive for airport asphalt concrete','AM-600 机场沥青砼专用高黏沥青添加剂'),
        summary:enZh('A high-viscosity asphalt modifier for airport pavement, heavy traffic and permeable pavement where adhesion, high-temperature stability, fatigue and water stability are central requirements.','面向机场道面、重载交通及透水路面的高黏沥青改性剂，重点改善黏结、高温稳定、抗疲劳及水稳定性能。'),
        facts:[
          {label:enZh('Production route','生产方式'),value:enZh('Wet or dry mixing','湿拌或干拌')},
          {label:enZh('Wet route','湿拌方式'),value:enZh('Prepare high-viscosity asphalt first','先制备高黏沥青')},
          {label:enZh('Dry route','干拌方式'),value:enZh('Mix with aggregate before binder','先与集料干拌')},
          {label:enZh('Target mixture','目标混合料'),value:enZh('High-viscosity asphalt / SMA','高黏沥青 / SMA')},
        ],
        applications:[enZh('Airport pavement','机场道面'),enZh('Heavy-traffic pavement','重载交通道面'),enZh('Permeable pavement','透水路面'),enZh('High-viscosity SMA','高黏 SMA')],
        details:[
          {title:enZh('Catalogue-described performance focus','手册所述性能重点'),items:[enZh('Reduce plastic deformation of the mixture','降低混合料塑性变形'),enZh('Improve aggregate-binder adhesion','提高沥青与集料黏结力'),enZh('Improve anti-scattering, fatigue and water stability','改善抗飞散、抗疲劳及水稳定性')]},
        ],
        source:enZh('Source: Oceanpower 2026 Airport Pavement Solution Manual, printed pp. 17–18. Binder grade, target viscosity and mixture requirements require project confirmation.','来源：海川《2026 机场道面解决方案》，印刷页 17–18。基质沥青等级、目标黏度及混合料要求须按项目确认。'),
      },
      {
        id:'am-800',name:enZh('AM-800 high-modulus additive for airport asphalt concrete','AM-800 机场沥青砼专用高模量添加剂'),
        summary:enZh('A high-modulus asphalt-mixture additive intended to improve dynamic modulus and high-temperature stability where pavement strength and deformation resistance are priorities.','用于提高沥青混合料动态模量及高温稳定性的添加剂，适合以道面强度及抗变形为重点的项目。'),
        facts:[
          {label:enZh('Primary target','主要目标'),value:enZh('Dynamic modulus','动态模量')},
          {label:enZh('Addition method','投放方式'),value:enZh('Direct addition before asphalt spray','沥青喷洒前直接投入')},
          {label:enZh('Mixing-time note','拌和时间说明'),value:enZh('+5 s dry and wet mixing','干拌、湿拌各延长 5 s')},
          {label:enZh('Catalogue packaging','目录包装'),value:'30 kg'},
        ],
        applications:[enZh('Airport pavement','机场道面'),enZh('Heavy traffic','重载交通'),enZh('High-temperature regions','高温地区'),enZh('Long longitudinal gradients','长大纵坡路段')],
        details:[
          {title:enZh('Engineering review points','工程复核重点'),items:[enZh('Target dynamic modulus and structural layer design','目标动态模量及结构层设计'),enZh('Rutting, water damage and low-temperature cracking requirements','车辙、水损害及低温开裂要求'),enZh('Aggregate and binder heating temperatures','集料及沥青加热温度')]},
        ],
        source:enZh('Source: Oceanpower 2026 Airport Pavement Solution Manual, printed pp. 19–20. Layer-thickness claims and modulus targets require project-specific structural verification.','来源：海川《2026 机场道面解决方案》，印刷页 19–20。结构层厚度及模量目标须按具体项目进行结构验算。'),
      },
      {
        id:'am-warm-mix',name:enZh('AM-110 / AM-120 / AM-130 warm-mix systems','AM-110 / AM-120 / AM-130 温拌体系'),
        summary:enZh('Three different warm-mix routes—oil-based surfactant, polyolefin viscosity modifier and water-bearing zeolite—requiring selection by plant process, binder and temperature target.','三种不同温拌路线：油基表面活性剂、聚烯烃降黏改性剂及含水沸石，须根据拌合站工艺、基质沥青及降温目标选用。'),
        facts:[
          {label:'AM-110',value:enZh('Oil-based surfactant · 20–40°C reduction','油基表面活性剂 · 降温 20–40°C')},
          {label:'AM-120',value:enZh('Polyolefin viscosity modifier','聚烯烃降黏改性剂')},
          {label:'AM-130',value:enZh('Zeolite · 20–35°C reduction','沸石 · 降温 20–35°C')},
          {label:enZh('Catalogue WMA mixing range','目录 WMA 拌和温度'),value:'120–140°C'},
        ],
        applications:[enZh('Lower-temperature construction','降温施工'),enZh('Night or winter paving','夜间或冬季施工'),enZh('Long-haul or constrained work windows','长距离运输或受限施工窗口'),enZh('Recyclable pavement systems','可再生路面体系')],
        details:[
          {title:enZh('Do not treat the three grades as interchangeable','三种型号不可直接互换'),items:[enZh('AM-110 is added through an asphalt plant or storage centre','AM-110 可在沥青厂或储运中心添加'),enZh('AM-120 changes the asphalt viscosity-temperature relationship','AM-120 改变沥青黏温关系'),enZh('AM-130 releases water near 100°C to foam the asphalt','AM-130 在约 100°C 释放水分使沥青发泡')]},
        ],
        source:enZh('Source: Oceanpower 2026 Airport Pavement Solution Manual, printed pp. 21–23. Temperature reductions are catalogue statements; validate workability and road performance with the selected binder and gradation.','来源：海川《2026 机场道面解决方案》，印刷页 21–23。降温幅度为目录陈述，须结合所选基质沥青及级配验证施工和易性与路用性能。'),
      },
    ],
  },
} as const;
