// AUTO-GENERATED from 'Overview-key step.pptx' via LibreOffice.
// Overview text + cropped Key-step SVG per pathway. Do not edit by hand;
// regenerate with scratchpad/gen_content.py if the source deck changes.

export type PathwayContent = {
  overview: string[]
  keyStepSvg?: string
}

// Keyed by `${categorySlug}/${pathwaySlug}`.
export const pathwayContent: Record<string, PathwayContent> = {
  "carbohydrate-metabolism/glycolysis": {
    overview: [
      `해당과정(glycolysis)은 세포의 세포질에서 포도당(Glucose)을 분해하여 ATP와 피루브산(Pyruvate)을 생성하는 일련의 대사 경로이다. 이는 사람을 포함한 생명체의 가장 원시적이고 보편적인 에너지 획득 방식으로, 산소 유무와 관계없이 진행되는 대표적인 이화작용이다.`,
      `전체 과정은 총 10단계의 세부 반응으로 나뉘며, 에너지를 소비하는 1~5단계의 '에너지 투자기(preparatory phase)'와 에너지를 회수하는 6~10단계의 '에너지 회수기(payoff phase)'로 구분된다. 결과적으로 포도당 1분자가 분해되면 2분자의 피루브산, 2분자의 순수한 ATP, 그리고 2분자의 NADH가 생성되어 세포의 다양한 생명 활동 및 후속 호흡 대사에 기여한다.`,
      `해당과정의 전체 반응식은 다음과 같다.`,
      `포도당 + 2 NAD+ + 2 ADP + 2 Pi → 2 피루브산 + 2 NADH + 2 H+ + 2 ATP + 2 H2O`,
    ],
    keyStepSvg: "/keysteps/glycolysis.svg",
  },
  "carbohydrate-metabolism/gluconeogenesis": {
    overview: [
      `포도당신생합성(gluconeogenesis)은 피루브산(pyruvate), 젖산(lactate), 포도당 생성성 아미노산(glucogenic amino acids), 글리세롤(glycerol) 등 특정 비탄수화물 기질로부터 포도당을 생성하는 필수적인 대사 경로이다. 주로 간에서 일어나며 신장 피질에서도 일어나며, 단식, 기아, 저탄수화물 식이 또는 격렬한 운동 중에 혈당을 일정하게 유지하고 뇌와 적혈구처럼 포도당을 필수 에너지원으로 사용하는 조직에 당을 공급하는 데 중요한 역할을 한다.`,
      `이 경로는 전체적으로 해당과정(glycolysis)의 역반응과 유사하지만, 해당과정의 비가역적인 3가지 우회 단계(key step)에서는 완전히 다른 특이 효소들을 사용한다. 피루브산에서 포도당-6-인산으로 이어지는 경로는 자발적으로 진행되기 위해 4분자의 ATP와 2분자의 GTP를 필요로 하고, 2개의 NADH가 사용된다.`,
    ],
    keyStepSvg: "/keysteps/gluconeogenesis.svg",
  },
  "carbohydrate-metabolism/other-hexoses-and-disaccharides": {
    overview: [
      `자연계에 존재하는 프럭토스(과당), 갈락토스, 만노스 등의 다양한 육탄당들은 포도당이 아님에도 불구하고 특이적인 효소 전환 경로를 통해 해당과정(glycolysis)의 중간 대사산물 형태로 변환되어 유입된다.`,
      `프럭토스(Fructose): 주로 간에서는 프럭토카이네이스(fructokinase)에 의해 프럭토스 1-인산이 된 후, 알돌레이스 B에 의해 쪼개져 디하이드록시아세톤 인산(DHAP)과 글리세르알데하이드 3-인산(GAP) 형태로 해당과정의 에너지 회수기 지점으로 합류하고, 근육에서는 헥소카이네이스가 직접 프럭토스 6-인산으로 변환시킨다.`,
      `갈락토스(Galactose): 갈락토카이네이스(galactokinase)에 의해 인산화된 후 UDP-글루코스와의 전이 반응 및 에피머화 반응을 거쳐 최종적으로 글루코스 6-인산으로 전환되어 해당과정의 가장 초기 단계로 유입된다.`,
      `만노스(Mannose): 헥소카이네이스에 의해 만노스 6-인산으로 인산화된 후, 포스포만노스 이성질화효소(phosphomannose isomerase)의 작용을 받아 프럭토스 6-인산으로 바뀌어 해당과정 내부로 들어온다.`,
    ],
    keyStepSvg: "/keysteps/other-hexoses-and-disaccharides.svg",
  },
  "carbohydrate-metabolism/glycogen-metabolism": {
    overview: [
      `글리코겐(glycongen)은 동물체 내에서 포도당을 저장하는 대표적인 다당류로, 주로 간과 근육에 축적된다. 포도당 분자들이 α-1,4 결합으로 사슬을 늘리고, 약 10개마다 α-1,6 결합으로 가지(branch)를 치는 고도의 조밀한 구조를 이루고 있다. 글리코겐 대사는 혈당과 세포 내 에너지를 일정하게 유지하기 위해 합성(Glycogenesis)과 분해(Glycogenolysis) 과정이 정밀하게 교차 조절되는데(단순한 역반응은 아님), 식후 혈당이 높을 때는 포도당이 글루코스 6-인산과 1-인산을 거쳐 UDP-글루코스로 활성화된 후, 글리코겐 신타아제(glycogen synthase)에 의해 기존 사슬에 결합하며 합성된다. 반대로 공복이나 운동 시에는 글리코겐 포스포릴레이스(glycogen phosphorylase)가 가인산분해 반응을 통해 사슬 말단으로부터 글루코스 1-인산을 하나씩 떼어내어 신속하게 에너지를 공급한다.`,
    ],
    keyStepSvg: "/keysteps/glycogen-metabolism.svg",
  },
  "carbohydrate-metabolism/fates-of-glucose-6-phosphate": {
    overview: [
      `세포질 내에서 포도당이 인산화되어 생성된 포도당 6-인산(Glucose-6-Phosphate)은 세포의 대사 및 에너지 상태에 따라 서로 다른 운명을 맞이하는 핵심 분기점이며, 아래와 같이 3가지 경로로 진행될 수 있다.`,
      `해당과정 지속: 세포 내 에너지가 부족할 때 포도당 6-인산은 포스포글루코스 이성질화효소에 의해 과당 6-인산으로 전환되며 피루브산을 생성하는 이화작용을 지속한다.`,
      `글리코겐 저장: 에너지와 혈당이 충분할 때 포도당 6-인산은 글루코스 1-인산으로 전환된 후 활성화되어 간과 근육에 글리코겐 형태로 축적된다.`,
      `오탄당 인산경로: 세포 분열이 활발하여 핵산 합성이 필요하거나 항산화 및 합성 대사를 위한 NADPH가 필요할 때, 포도당 6-인산은 산화적 탈탄산 반응을 거쳐 오탄당으로 진입한다.`,
    ],
    keyStepSvg: "/keysteps/fates-of-glucose-6-phosphate.svg",
  },
  "carbohydrate-metabolism/pentose-phosphate-pathway": {
    overview: [
      `오탄당 인산경로(pentose phosphate pathway, PPP)는 해당과정(glycolysis)의 주요 우회 경로이자 세포질에서 평행하게 진행되는 대사 작용이다. 이 경로는 ATP를 생산하는 대신, 생체 내 합성 대사에 필수적인 환원제인 NADPH와 핵산(DNA, RNA) 및 뉴클레오타이드 합성의 뼈대가 되는 오탄당인 리보스 5-인산을 공급하는 매우 중요한 역할을 한다.`,
      `오탄당 인산경로는 크게 두 가지 단계로 구분되는데, 첫 번째는 포도당 6-인산을 산화시켜 NADPH와 리불로스 5-인산(ribulose 5-phosphate)을 생성하는 산화적 단계(비가역적)이고, 두 번째는 오탄당 인산들을 유기적으로 재배열하여 과당 6-인산이나 글리세르알데하이드 3-인산과 같은 해당과정 중간체로 되돌리는 비산화적 단계(가역적)이다.`,
    ],
    keyStepSvg: "/keysteps/pentose-phosphate-pathway.svg",
  },
  "carbohydrate-metabolism/fates-of-pyruvate": {
    overview: [
      `해당과정(glycolysis)의 최종 생성물인 피루브산(pyruvate)은 세포 내 산소의 유무와 공급 상태에 따라 서로 다른 대사 운명을 맞이하게 된다.`,
      `유산소 조건 (Aerobic conditions): 산소가 충분할 때 피루브산은 미토콘드리아 기질로 이동하고, 이곳에서 피루브산 탈수소효소 복합체(Pyruvate dehydrogenase complex)에 의해 아세틸-CoA로 산화되며, 이는 TCA 회로와 전자전달계로 이어져 대량의 ATP를 생산하는 세포 호흡 과정을 거친다.`,
      `무산소 조건 (Anaerobic conditions): 산소가 부족하거나 없는 환경(예: 격렬한 운동 중인 골격근 또는 적혈구)에서는 발효(fermentation)가 일어난다. 동물 세포에서는 피루브산이 젖산 탈수소효소(lactate dehydrogenase)에 의해 젖산(lactate)으로 환원되며, 이 과정은 해당과정의 지속에 필수적인 NAD+ 를 재생산하는 역할을 한다. 효모 등에서는 에탄올 발효가 진행된다.`,
    ],
    keyStepSvg: "/keysteps/fates-of-pyruvate.svg",
  },
  "carbohydrate-metabolism/citrate-cycle": {
    overview: [
      `시트르산 회로(TCA 회로 또는 크렙스 회로)는 산소 호흡을 하는 생물체 내 미토콘드리아 기질에서 일어나는 세포 호흡의 핵심 중간 과정이다. 탄수화물, 지방, 단백질 등의 기질이 분해되어 생성된 아세틸-CoA를 산화시켜 세포에 필요한 에너지를 생산하는 일련의 순환 대사 경로이다.`,
      `이 회로는 아세틸-CoA가 미토콘드리아 내 옥살아세트산(oxaloacetate)과 결합하여 시트르산을 형성하면서 시작되고, 회로가 연속적으로 회전하면서 탄소는 이산화탄소(CO2)로 방출되고, 이 과정에서 방출되는 고에너지 전자는 NAD+ 와 FAD+ 를 각각 NADH와 FADH2로 환원시키는데 사용된다. 또한 기질수준 인산화를 통해 하나의 GTP(또는 ATP)가 직접 생성된다. 이렇게 축적된 NADH와 FADH2는 이후 전자전달계로 넘어가 대량의 ATP를 생산하는 원동력이 된다. 한 번의 시트르산 회로를 통해 3NADH, 1FADH2, 2CO2, 1GTP(또는 ATP)가 생성된다.`,
    ],
    keyStepSvg: "/keysteps/citrate-cycle.svg",
  },
  "carbohydrate-metabolism/electron-transfer-system-and-oxidative-phosphorylation": {
    overview: [
      `산화적 인산화(oxidative phosphorylation)는 미토콘드리아 내막에서 일어나는 세포 호흡의 최종 단계로, 전자전달계(ETC)와 화학삼투를 결합하여 대량의 ATP를 생산하는 과정이다. 해당과정과 시트르산 회로에서 추출된 고에너지 전자 운반체인 NADH와 FADH2 가 전자전달계의 단백질 복합체들에 전자를 전달하면서 시작된다.`,
      `전자가 복합체들을 따라 차례로 이동하며 에너지를 방출할 때, 이 전자의 에너지를 원동력 삼아 미토콘드리아 기질의 양성자(H+)를 막사이공간으로 이동시킨다. 이로 인해 막을 경계로 강한 양성자 농도 기울기(전기화학적 전위차)가 형성되고, 이 기울기를 해소하기 위해 양성자들이 ATP 합성효소(ATP synthase)를 통해 미토콘드리아 기질로 다시 들어오는 역학적 회전력을 이용해 ADP와 무기인산(P)을 결합시켜 ATP를 합성하게 된다. 최종 전자의 수용체는 산소이며, 전자 및 양성자와 결합하여 물(H2O)을 형성한다.`,
    ],
    keyStepSvg: "/keysteps/electron-transfer-system-and-oxidative-phosphorylation.svg",
  },
  "lipid-metabolism/lipolysis": {
    overview: [
      `지질분해(lipolysis)는 에스테르 결합을 가진 지질 화합물에 가수분해효소가 작용하여 그 구성 성분을 방출하는 핵심적인 이화작용이다.`,
      `중성지방(TG)의 분해: 주로 지방조직의 지질방울에서 일어나며, 에너지가 필요할 때 호르몬 신호에 의해 활성화된다. 중성지방은 지방조직 트리글리세라이드 라이페이스(ATGL), 호르몬 민감성 라이페이스(HSL), 모노아실글리세롤 라이페이스(MGL)의 순차적인 촉매 작용을 거쳐 3분자의 지방산과 1분자의 글리세롤로 최종 분해되어 에너지원으로 쓰인다.`,
      `세포막 글리세로인지질의 분해: 세포막의 구조를 이루는 인지질은 포스포리파이스(Phospholipase, PL)라는 특이적 가수분해효소 군집에 의해 분해된다. 효소가 인지질 골격의 어느 에스테르 결합을 끊느냐에 따라 PLA1, PLA2, PLC, PLD 등으로 분류된다. 특히 PLA2 는 2번 탄소의 불포화지방산(예: 아라키돈산)을 잘라내어 염증 및 신호전달 매개체 전구체를 방출하며, PLC는 인산염기를 통째로 잘라내어 2차 신호전달 물질인 DAG와 IP3를 생성한다.`,
    ],
    keyStepSvg: "/keysteps/lipolysis.svg",
  },
  "lipid-metabolism/glycerol-metabolism": {
    overview: [
      `중성지방(Triglyceride)은 라이페이스(lipase)의 작용으로 1분자의 글리세롤(glycerol)과 3분자의 지방산(fatty acid)으로 가수분해 되는데, 이 중 친수성 물질인 글리세롤은 혈액을 통해 주로 간세포로 운반되어 당대사 경로에 합류하게 된다. 간에 도달한 글리세롤은 글리세롤 카이네이스(glycerol kinase)에 의해 ATP를 소모하며 글리세롤 3-인산(glycerol 3-phosphate )으로 인산화되고, 이후 글리세롤 3-인산 탈수소효소(glycerol 3-phosphate dehydrogenase)에 의해 NAD+를 NADH 로 환원시키면서 디하이드록시아세톤 인산(DHAP)으로 산화된다. DHAP는 삼탄당 이성질화효소(triose phosphate isomerase)를 통해 글리세르알데하이드 3-인산(GAP)과 상호 전환될 수 있다.`,
      `이렇게 생성된 DHAP와 GAP는 세포의 에너지 상태와 호르몬 신호에 따라 두 가지 운명을 가지는데, 에너지가 필요할 때는 해당과정(glycolysis)을 거쳐 피루브산으로 분해되며, 혈당 공급이 필요할 때는 포도당신생합성(gluconeogenesis) 경로를 거쳐 포도당으로 합성된다.`,
    ],
    keyStepSvg: "/keysteps/glycerol-metabolism.svg",
  },
  "lipid-metabolism/oxidation": {
    overview: [
      `중성지방(triglyceride)의 분해로 생성된 지방산은 혈중 알부민과 결합하여 세포로 운반된 후, 미토콘드리아 기질 내부에서 β-산화(β-oxidation) 과정을 거쳐 아세틸-CoA로 분해된다. β-산화는 지방산 사슬의 카르복실기 말단으로부터 탄소 2개씩을 반복적으로 잘라내는 연속적인 순환 대사 경로이다.`,
      `지방산 활성화 및 운반: 세포질로 유입된 지방산은 CoA와 결합하여 ATP를 소모하며 아실-CoA(Acyl-CoA)로 활성화된 후, 카르니틴(carnitine) 셔틀을 통해 미토콘드리아 내막을 통과한다.`,
      `β- 산화의 4단계 순환: 미토콘드리아 기질에서 아실-CoA는 산화(Oxidation), 수화(Hydration), 산화(Oxidation), 티올분해(Thiolysis)의 4가지 효소 반응을 반복 구동하고, 이 순환을 한 번 돌 때마다 1분자의 FADH2 , 1분자의 NADH, 그리고 탄소 2개가 잘려 나간 1분자의 아세틸-CoA가 생성된다.`,
      `에너지 대사 진입: 최종 산물인 아세틸-CoA는 시트르산 회로(TCA 회로)로 진입하여 완전히 산화되며, FADH2와 NADH는 전자전달계로 이동하여 다량의 ATP를 생산한다.`,
    ],
    keyStepSvg: "/keysteps/oxidation.svg",
  },
  "lipid-metabolism/ketone-bodies": {
    overview: [
      `케톤체(ketone bodies) 대사는 단식, 장시간 운동, 또는 저탄수화물 고지방 식단(케톤생성 식사) 등으로 인해 체내 가용 포도당이 극도로 부족해질 때 일어나는 생리적 반응이다.`,
      `케톤체 생성 (Ketogenesis): 포도당이 부족해지면 간은 지방산을 대량으로 분해하여 아세틸-CoA를 만들지만, 옥살아세트산(oxaloacetate)의 포도당신생합성의 이용으로 이들이 TCA 회로에 진입하지 못하면서, 간세포의 미토콘드리아 기질에서 아세틸-CoA들이 응축되어 세 가지 케톤체인 아세토아세테이트(acetoacetate), β-하이드록시부티레이트(β-hydroxybutyrate), 아세톤(acetone)을 형성한다.`,
      `케톤체 분해 및 이용 (Ketolysis): 생성된 수용성 케톤체는 혈액을 통해 간을 빠져나가 뇌, 심장, 골격근 등 말초 조직으로 운반되고, 말초 조직의 미토콘드리아에서 케톤체는 티오포레이스(thiophorase) 등의 효소 작용을 통해 다시 아세틸-CoA로 역전환되며, TCA 회로와 산화적 인산화를 거쳐 세포의 핵심 대체 에너지원으로 사용된다.`,
    ],
    keyStepSvg: "/keysteps/ketone-bodies.svg",
  },
  "lipid-metabolism/fatty-acid-synthesis": {
    overview: [
      `지방산 합성(fatty acid synthesis)은 세포 내에 에너지가 과잉일 때 미토콘드리아에서 유출된 시트르산으로부터 유래한 아세틸-CoA와 NADPH를 원동력 삼아 세포질에서 진행되는 대표적인 동화작용이다.`,
      `전구체 이동 및 활성화: 미토콘드리아 기질의 아세틸-CoA는 막을 통과할 수 없어 시트르산 형태로 세포질로 빠져나온 후 다시 아세틸-CoA로 전환된다. 이후 아세틸-CoA 카복실화효소(Acetyl-CoA Carboxylase)의 촉매 작용을 통해 중탄산염(HCO3- )과 결합하여 고에너지 활성 형태인 말로닐-CoA(Malonyl-CoA)를 형성하는데, 이 단계가 지방산 합성의 속도조절 단계이다.`,
      `지방산 생성효소 복합체(FAS)의 순환 반응: 활성화된 아세틸-CoA(시작점)와 말로닐-CoA는 지방산 생성효소의 ACP(Acyl Carrier Protein)에 결합하고, 이후 축합(Condensation), 환원(Reduction), 탈수(Dehydration), 환원(Reduction)의 4단계 순환 과정을 반복하며 사슬의 탄소를 2개씩 연장한다. 이 환원 단계에서 오탄당 인산 경로 등에서 공급된 NADPH가 필수적인 환원제로 소모된다. 이 순환을 거쳐 최종적으로 탄소 16개짜리 포화지방산인 팔미트산(palmitate)이 합성된다.`,
    ],
    keyStepSvg: "/keysteps/fatty-acid-synthesis.svg",
  },
  "lipid-metabolism/lipogenesis": {
    overview: [
      `생체 내 주요 지질인 중성지방, 글리세로인지질, 스핑고지질, 콜레스테롤은 세포의 구조 유지와 에너지 저장 및 신호 전달을 위해 정밀한 대사 과정을 거쳐 합성된다.`,
      `중성지방(TG) 및 글리세로인지질: 두 지질은 포스파티드산(Phosphatidic acid)이라는 공통 중간체로부터 시작하며, 포스파티드산이 탈인산화되어 디아실글리세롤(DAG)이 된 후 아실기가 추가되면 중성지방이 되고, CDP-지방산 지지체나 머리기부(콜린, 에탄올아민 등)가 결합하면 인지질이 합성된다.`,
      `스핑고지질: 팔미토일-CoA(palmitoyl-CoA)와 세린(serine)이 축합하여 아미노 알코올 뼈대인 스핑고신(sphingosine)을 형성하며 시작되고, 여기에 지방산이 결합하여 세라마이드(Ceramide)가 되고, 당이나 인산콜린이 붙어 최종 구조를 이루게된다.`,
      `콜레스테롤: 세포질에서 아세틸-CoA 3분자가 응축되어 HMG-CoA를 형성한 후, 메발론산(Mevalonate)으로 환원되는 속도조절 단계를 거쳐 이소프레노이드 단위를 통해 합성된다.`,
    ],
    keyStepSvg: "/keysteps/lipogenesis.svg",
  },
  "protein-metabolism/transamination": {
    overview: [
      `아미노산 이화과정(catabolism)의 첫 단계는 질소를 포함하는 α-아미노기(α-NH3+)를 탄소 골격으로부터 분리하는 것이다. 이 전하를 띤 아미노기를 안전하게 수집하고 운반하는 대사 경로가 바로 아미노기 전이반응(Transamination)이며, 이 반응은 주로 간세포의 세포질과 미토콘드리아에서 활발히 일어난다.`,
      `아미노기 전이과정은 아미노기 전이효소(aminotransferase)의 촉매 하에, 공여체 아미노산의 α-아미노기가 수용체인 α-케토글루타르산(α-ketoglutarate)으로 전달되고, 이 과정에서 공여체 아미노산은 상응하는 α-케토산(케토산 골격)으로 바뀌어 에너지 대사(TCA 회로 등)에 참여하며, 아미노기를 받아들인 수용체는 L-글루탐산(L-glutamate)으로 전환된다. 모든 아미노기 전이효소는 비타민 B6 유도체인 피리독살 인산(Pyridoxal phosphate, PLP)을 필수 조효소로 사용하는데, PLP가 아미노산으로부터 아미노기를 일시적으로 받아 피리독사민 인산(PMP)이 된 후, 이를 다시 α-케토글루타르산에 넘겨주는 메커니즘을 따른다.`,
    ],
    keyStepSvg: "/keysteps/transamination.svg",
  },
  "protein-metabolism/oxidative-deamination": {
    overview: [
      `아미노산 이화과정(catabolism) 중 대부분의 아미노기로부터 유래한 질소는 간세포에서 글루탐산(Glutamate) 형태로 수집되는데, 이렇게 모인 아미노기를 최종적으로 분리하여 처리하는 핵심 대사 경로가 바로 간세포의 미토콘드리아 기질 내에서 진행되는 산화적 탈아미노반응(Oxidative Deamination)이다.`,
      `미토콘드리아 기질로 유입된 L-글루탐산은 글루탐산 탈수소효소(Glutamate dehydrogenase)의 촉매 작용을 받는데, 글루탐산의 α-탄소가 산화되면서 전자가 전이되고, 중간체인 α-이민노글루타르산(α-iminoglutarate)이 형성되며, 생성된 이민 중간체는 물과 반응하여 빠르게 가수분해된다. 이 과정에서 아미노기가 유독한 암모니아(-NH4+ )형태로 완전히 떨어져 나오며, 탄소 골격은 α-케토글루타르산(α-ketoglutarate)으로 재생성된다. 재생성된 탄소 골격은 세포 내 에너지 상태에 따라 시트르산 회로(TCA cycle)로 진입하여 에너지를 생산하거나 다시 아미노기 전이반응의 수용체로 재활용 될 수 있다. 분리된 독성 암모니아는 동일한 미토콘드리아 기질에서 시작되는 요소 회로(Urea cycle)를 통해 신속하게 무독성의 요소(Urea)로 전환된 후 배설된다.`,
    ],
    keyStepSvg: "/keysteps/oxidative-deamination.svg",
  },
  "protein-metabolism/urea-cycle": {
    overview: [
      `아미노산 이화과정에서 생성된 암모늄 이온(NH4+ )은 강력한 신경독성을 가지고 있어, 간세포는 이를 독성이 없는 수용성 물질인 요소(Urea)로 전환하여 배출하는데, 이 연쇄적 대사 경로를 요소 회로(Urea cycle)라고 한다. 이 회로는 미토콘드리아 기질과 세포질의 두 구획에 걸쳐 진행된다.`,
      `미토콘드리아 기질 단계: 암모니아는 중탄산염(HCO3-)과 결합하여 카바모일 인산(Carbamoyl phosphate)으로 전환되며 회로 진입을 준비하고, 이어서 오르니틴 트랜스카바모일레이스(OTC)에 의해 오르니틴(Ornithine)과 결합하여 시트룰린(Citrulline)을 형성한 후 세포질로 수송된다.`,
      `세포질 단계: 시트룰린은 아스파르트산과 응축되어 아르지니노숙신산을 거쳐 아르지닌(Arginine)으로 전환되고, 최종적으로 아르지네이스(Arginase) 효소에 의해 아르지닌이 가수분해되면서 요소가 방출되고 오르니틴이 재생성되어 회로가 순환된다.`,
    ],
    keyStepSvg: "/keysteps/urea-cycle.svg",
  },
  "protein-metabolism/keto-acid-oxidation": {
    overview: [
      `아미노산 이화과정 중 아미노기 전이반응을 거치면 질소 성분은 분리되고 대사 중간체인 α-케토산(α-keto acid) 형태의 탄소 골격이 남는데, 이 탄소 골격은 아미노산의 종류(R 곁사슬의 구조)에 따라 대사적 운명이 크게 두 가지로 나뉜다.`,
      `포도당신생합성 경로 (Glucogenic Amino Acids): 알라닌, 아스파르트산 등 다수의 아미노산은 분해되어 피루베이트(Pyruvate)나 옥살아세트산(Oxaloacetate), α-케토글루타르산 등 TCA 회로의 중간산물인 α- 케토산으로 전환되는데, 이들은 공복 시 간에서 포도당신생합성(Gluconeogenesis)의 전구체로 작용하여 포도당을 생성한다.`,
      `케톤체 및 지질 합성 경로 (Ketogenic Amino Acids): 류신, 라이신은 분해되어 아세틸-CoA(Acetyl-CoA)나 아세토아세틸-CoA를 형성하는데, 이 탄소 골격들은 포도당으로 전환될 수 없으며, 케톤체 생성(Ketogenesis)이나 지방산 합성의 원료로 사용된다.`,
    ],
  },
  "protein-metabolism/amino-acid-synthesis": {
    overview: [
      `아미노산 생합성(amino acid synthesis)은 생명체가 해당과정, 오탄당 인산 경로, 시트르산 회로(TCA 회로)의 대사 중간산물(탄소 골격)에 질소(아미노기)를 결합하여 필요한 아미노산을 스스로 만들어내는 필수적인 동화작용이다. 간이나 조직의 미토콘드리아에서 글루탐산 탈수소효소(Glutamate dehydrogenase)에 의해 α-케토글루타르산과 암모니아가 결합하여 L-글루탐산(L-glutamate)이 형성되거나, 글루타민 합성효소(Glutamine synthase)를 통해 글루타민이 만들어진다. 이렇게 고정된 글루탐산의 아미노기는 아미노기 전이효소(aminotransferase)와 조효소 PLP의 작용을 통해 다른 α-케토산 뼈대로 전달되어 아미노산이 합성된다.`,
    ],
    keyStepSvg: "/keysteps/amino-acid-synthesis.svg",
  },
  "protein-metabolism/molecules-derived-from-amino-acids": {
    overview: [
      `아미노산은 단백질을 구성하는 기본 단위 역할에 그치지 않고, 다양한 대사 경로를 통해 체내 항상성과 생리 기능을 조절하는 고활성 생체분자 및 특수 화합물의 전구체로 대사될 수 있다.`,
      `카테콜아민류 및 갑상선 호르몬: 방향족 아미노산인 L-티로신(L-Tyrosine)은 신경전달물질 및 호르몬 합성의 핵심 출발점이며, 티로신 수산화효소에 의해 L-DOPA로 전환된 후, 도파민(Dopamine), 노르에피네프린, 에피네프린이 순차적으로 합성되어 교감신경계 활성화를 매개한다. 또한, 티로신 골격은 요오드화 과정을 거쳐 갑상선 호르몬(T3, T4)의 모체가 된다.`,
      `생체 아민류: L-트립토판(L-Tryptophan)은 수산화 및 탈카복실화 반응을 통해 감정과 수면을 조절하는 세로토닌(Serotonin) 및 멜라토닌(Melatonin)으로 대사되고, L-글루탐산은 탈카복실화되어 중추신경계의 주요 억제성 신경전달물질인 GABA를 생성하며, L-히스티딘은 면역 및 알레르기 반응을 매개하는 히스타민(Histamine)으로 전환된다.`,
      `가스성 신호전달물질 및 에너지 저장원: L-아르지닌(L-Arginine)은 일산화질소 합성효소(NOS)의 기질로 작용하여 혈관 확장 및 세포 신호전달을 담당하는 일산화질소(NO)를 생성하고, 아울러 아르지닌은 글리신, 메티오닌과 함께 근육 내 고에너지 저장체인 크레아틴 인산(Phosphocreatine)의 골격을 형성한다.`,
    ],
    keyStepSvg: "/keysteps/molecules-derived-from-amino-acids.svg",
  },
  "nucleic-acid-metabolism/purine-nucleotides": {
    overview: [
      `퓨린 뉴클레오타이드(AMP, GMP)는 유전 정보 전달과 에너지 대사의 핵심 물질로, 신속한 세포 요구에 대응하기 위해 정밀한 합성 및 분해 경로를 거친다.`,
      `De novo 생합성: 활성화된 오탄당인 PRPP(5-phosphoribosyl-1-pyrophosphate) 위에 아미노산(글리신, 글루타민, 아스파르트산)과 CO2, 폼산 등으로부터 유래한 원자들을 차례로 결합하여 퓨린 고리를 형성한다. 이 경로의 최초 속도조절 단계는 글루타민-PRPP 아미도트랜스퍼레이스 반응이며, 최종 공통 중간체인 IMP(Inosine monophosphate)를 거쳐 각각 AMP와 GMP로 분기되어 합성된다.`,
      `분해(Catabolism) 및 배설: 퓨린 뉴클레오타이드가 분해될 때는 먼저 뉴클레오타이드가수분해효소에 의해 인산과 당이 제거되어 아데닌과 구아닌이 남고, 이 유리 염기들은 탈아미노화 및 산화 반응을 거쳐 공통 분해 중간체인 잔틴(Xanthine)으로 모이게 된다. 영장류와 개 등의 포유류는 잔틴 산화효소(Xanthine oxidase)의 작용으로 최종 대사산물인 요산(Uric acid) 또는 알란토인(Allantoin)을 형성하여 배설한다.`,
    ],
    keyStepSvg: "/keysteps/purine-nucleotides.svg",
  },
  "nucleic-acid-metabolism/pyrimidine-nucleotides": {
    overview: [
      `피리미딘 뉴클레오타이드(UMP, CMP, dTMP)는 DNA 및 RNA 합성의 필수 구성 성분이다. 퓨린 합성이 PRPP 당 위에서 진행되는 것과 달리, 피리미딘은 염기 고리를 먼저 완성한 후 당(PRPP)을 결합시키는 독특한 대사 경로를 따른다.`,
      `De novo 생합성: 세포질에서 글루타민, 중탄산염(HCO3-), 2분자의 ATP로부터 카바모일 인산(Carbamoyl phosphate)이 합성되면서 시작되고, 이후 아스파르트산과 결합하여 오로트산(Orotate)이라는 피리미딘 고리를 형성한다. 여기에 PRPP가 결합하여 최초의 피리미딘 뉴클레오타이드인 OMP가 생성되고, 탈카복실화되어 UMP가 된 후 UTP, CTP 및 dTMP로 전환된다.`,
      `분해(Catabolism) 경로: 피리미딘의 고리 구조는 퓨린과 달리 고리가 완전히 열리는 방식으로 분해되어 수용성 대사산물을 남긴다. 시토신(C)과 우라실(U)은 β-알라닌(β-alanine)으로 분해되어 아세틸-CoA 등으로 대사되며, 티민(T)은 β-아미노이소부티르산(β-aminoisobutyrate)으로 분해되어 숙시닐-CoA로 전환된 후 배설된다. 탈아미노화 과정을 거친 암모니아가 형성되고, 간세포에서 요소회로를 거쳐 요소로 전환된 후 배출된다.`,
    ],
    keyStepSvg: "/keysteps/pyrimidine-nucleotides.svg",
  },
}
