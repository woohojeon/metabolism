export type Pathway = {
  slug: string
  name: string
  equation: string
  location: string
  summary: string
  overview: string[]
  steps: { title: string; detail: string }[]
  regulation: string[]
  energetics: string
  vetNote: string
}

export type Category = {
  slug: string
  name: string
  korean: string
  tagline: string
  image: string
  intro: string[]
  pathways: Pathway[]
}

export const categories: Category[] = [
  {
    slug: 'carbohydrate',
    name: 'Carbohydrate',
    korean: '탄수화물',
    tagline: 'Central energy currency of the cell',
    image: '/images/carbohydrate.jpg',
    intro: [
      'Carbohydrate metabolism sits at the hub of the metabolic map. Glucose is the universal fuel that every cell can burn, and the pathways that build, store, and dismantle it determine how an animal survives feast and famine alike.',
      'These six pathways form a tightly regulated network: glycolysis releases energy, gluconeogenesis restores blood glucose, glycogen stores it, the pentose phosphate pathway diverts it toward biosynthesis, and the citric acid cycle finishes its oxidation.',
    ],
    pathways: [
      {
        slug: 'glycolysis',
        name: 'Glycolysis',
        equation: 'Glucose + 2 NAD⁺ + 2 ADP + 2 Pᵢ → 2 Pyruvate + 2 NADH + 2 ATP',
        location: 'Cytosol',
        summary:
          'The ten-step cytosolic pathway that splits one glucose into two pyruvate, harvesting a net 2 ATP and 2 NADH without requiring oxygen.',
        overview: [
          'Glycolysis is the oldest and most universal energy-releasing pathway, running in essentially every cell. It is conventionally divided into an energy-investment phase (steps 1–5), in which two ATP are spent to prime and cleave the six-carbon sugar, and an energy-payoff phase (steps 6–10), in which four ATP and two NADH are generated.',
          'Because it does not need oxygen, glycolysis is the lifeline of tissues such as red blood cells, renal medulla, and rapidly contracting muscle. Under anaerobic conditions the pyruvate produced is reduced to lactate by lactate dehydrogenase, regenerating the NAD⁺ that glycolysis must have to keep running.',
          'Its products feed forward into the citric acid cycle (via pyruvate), gluconeogenesis, fatty acid synthesis, and the pentose phosphate pathway, making glycolysis the central distribution point of carbon flux.',
        ],
        steps: [
          { title: 'Glucose → Glucose-6-P', detail: 'Hexokinase (glucokinase in liver) traps glucose using ATP — the first committed, irreversible step.' },
          { title: 'Fructose-6-P → Fructose-1,6-bisP', detail: 'Phosphofructokinase-1 (PFK-1) is the rate-limiting, most heavily regulated enzyme of the pathway.' },
          { title: 'Cleavage', detail: 'Aldolase splits the six-carbon sugar into two interconvertible triose phosphates.' },
          { title: 'Payoff', detail: 'GAPDH, phosphoglycerate kinase, enolase, and pyruvate kinase generate NADH and ATP by substrate-level phosphorylation.' },
        ],
        regulation: [
          'PFK-1 is activated by AMP and fructose-2,6-bisphosphate, inhibited by ATP and citrate — linking flux to the cell’s energy charge.',
          'Hexokinase is inhibited by its product glucose-6-phosphate; liver glucokinase is not, allowing the liver to buffer blood glucose.',
          'Pyruvate kinase is activated by fructose-1,6-bisphosphate (feed-forward) and inhibited by ATP and alanine.',
        ],
        energetics: 'Net yield per glucose: 2 ATP and 2 NADH (≈ 5–7 ATP equivalents once NADH is oxidized aerobically).',
        vetNote:
          'In horses and racing greyhounds, intense exercise outpaces oxygen delivery and lactate accumulates; serial blood lactate is a practical field measure of anaerobic effort and fitness.',
      },
      {
        slug: 'gluconeogenesis',
        name: 'Gluconeogenesis',
        equation: '2 Pyruvate + 4 ATP + 2 GTP + 2 NADH → Glucose + 4 ADP + 2 GDP + 6 Pᵢ',
        location: 'Cytosol & mitochondria (liver, kidney cortex)',
        summary:
          'The biosynthesis of new glucose from non-carbohydrate precursors — lactate, glycerol, and glucogenic amino acids — that keeps blood glucose stable during fasting.',
        overview: [
          'Gluconeogenesis is essentially glycolysis run in reverse, but the three irreversible glycolytic steps must be bypassed by dedicated enzymes. It occurs chiefly in the liver, with the renal cortex contributing during prolonged fasting.',
          'The pathway is indispensable for tissues that depend on glucose — brain and red blood cells — when dietary intake stops. Its precursors arrive via the Cori cycle (lactate from muscle), the glucose–alanine cycle (amino nitrogen), and glycerol released from adipose triacylglycerol.',
          'Because it consumes six high-energy phosphates per glucose, gluconeogenesis is energetically expensive and is reciprocally regulated with glycolysis so the two never run at full speed simultaneously (a futile cycle).',
        ],
        steps: [
          { title: 'Pyruvate → Oxaloacetate', detail: 'Pyruvate carboxylase (mitochondrial, biotin-dependent) is activated by acetyl-CoA.' },
          { title: 'Oxaloacetate → PEP', detail: 'PEP carboxykinase (PEPCK) uses GTP; this bypass spans the mitochondrial membrane via malate.' },
          { title: 'Fructose-1,6-bisP → Fructose-6-P', detail: 'Fructose-1,6-bisphosphatase, the key regulated step, opposes PFK-1.' },
          { title: 'Glucose-6-P → Glucose', detail: 'Glucose-6-phosphatase in the ER releases free glucose — present in liver/kidney but not muscle.' },
        ],
        regulation: [
          'Fructose-2,6-bisphosphate is the master switch: high levels (fed state) favor glycolysis, low levels (fasting, glucagon) favor gluconeogenesis.',
          'Glucagon and cortisol induce PEPCK and fructose-1,6-bisphosphatase; insulin suppresses them.',
          'Acetyl-CoA from fatty acid oxidation activates pyruvate carboxylase, coupling fat breakdown to glucose synthesis.',
        ],
        energetics: 'Costs 6 ATP equivalents per glucose synthesized — the price of reversing the exergonic glycolytic steps.',
        vetNote:
          'High-producing dairy cows draw enormous glucose for lactose synthesis; when intake lags, hepatic gluconeogenesis is overwhelmed and ketosis develops — a major periparturient metabolic disease.',
      },
      {
        slug: 'glycogen-metabolism',
        name: 'Glycogen Metabolism',
        equation: 'Glycogenₙ + Glucose-1-P ⇌ Glycogenₙ₊₁  (synthesis ↔ breakdown)',
        location: 'Cytosol (liver & skeletal muscle)',
        summary:
          'The synthesis (glycogenesis) and breakdown (glycogenolysis) of glycogen, the branched glucose polymer that buffers blood glucose and fuels muscle contraction.',
        overview: [
          'Glycogen is the animal storage form of glucose, deposited as cytoplasmic granules mainly in liver and muscle. Liver glycogen maintains blood glucose for the whole body; muscle glycogen is a private fuel reserve for that muscle, since muscle lacks glucose-6-phosphatase.',
          'Glycogenesis adds glucose units (donated by UDP-glucose) to growing chains through glycogen synthase, while branching enzyme creates the α-1,6 linkages that make the molecule highly branched and rapidly mobilizable.',
          'Glycogenolysis runs the reverse: glycogen phosphorylase cleaves glucose-1-phosphate from chain ends, and a debranching enzyme handles the branch points. The two opposing pathways are reciprocally controlled by phosphorylation.',
        ],
        steps: [
          { title: 'Glucose-6-P → Glucose-1-P → UDP-glucose', detail: 'Phosphoglucomutase and UDP-glucose pyrophosphorylase activate glucose for storage.' },
          { title: 'Chain elongation', detail: 'Glycogen synthase forms α-1,4 bonds; branching enzyme adds α-1,6 branches.' },
          { title: 'Mobilization', detail: 'Glycogen phosphorylase releases glucose-1-phosphate; debranching enzyme clears branch points.' },
        ],
        regulation: [
          'Glucagon (liver) and epinephrine (muscle) trigger a cAMP–PKA cascade that activates phosphorylase and inactivates synthase.',
          'Insulin promotes glycogen synthesis by activating protein phosphatase-1, which dephosphorylates the enzymes.',
          'Muscle phosphorylase is also activated allosterically by AMP and Ca²⁺ during contraction.',
        ],
        energetics: 'Storage costs ~1 ATP (as UTP) per glucose added; mobilization yields glucose-1-phosphate directly, sparing the hexokinase step.',
        vetNote:
          'Inherited glycogen storage diseases occur across species; equine polysaccharide storage myopathy (PSSM) causes exertional rhabdomyolysis from abnormal muscle glycogen handling.',
      },
      {
        slug: 'pentose-phosphate-pathway',
        name: 'Pentose Phosphate Pathway',
        equation: 'Glucose-6-P + 2 NADP⁺ → Ribulose-5-P + 2 NADPH + CO₂',
        location: 'Cytosol',
        summary:
          'A parallel route for glucose-6-phosphate that produces NADPH for biosynthesis and antioxidant defense, plus ribose-5-phosphate for nucleotides.',
        overview: [
          'Rather than generating ATP, the pentose phosphate pathway (PPP) serves two biosynthetic purposes. Its oxidative branch is irreversible and yields NADPH; its non-oxidative branch reversibly interconverts sugars to supply ribose-5-phosphate or feed carbon back into glycolysis.',
          'NADPH is the cell’s reducing power for reductive biosynthesis (fatty acids, cholesterol, steroids) and, critically, for regenerating reduced glutathione that protects cells from oxidative damage. Tissues with heavy lipid synthesis or oxidative stress — liver, adipose, mammary gland, red blood cells, adrenal cortex — run the PPP actively.',
          'The pathway flexibly adjusts its output: when nucleotides are needed it favors ribose; when NADPH dominates the demand, excess pentoses are recycled to glycolytic intermediates.',
        ],
        steps: [
          { title: 'Oxidative branch', detail: 'Glucose-6-phosphate dehydrogenase (G6PD) is the committed, rate-limiting step producing the first NADPH.' },
          { title: '6-Phosphogluconate → Ribulose-5-P', detail: '6-phosphogluconate dehydrogenase yields the second NADPH and releases CO₂.' },
          { title: 'Non-oxidative branch', detail: 'Transketolase (thiamine-dependent) and transaldolase shuffle carbons between 3-, 4-, 5-, 6-, and 7-carbon sugars.' },
        ],
        regulation: [
          'G6PD is controlled by the NADP⁺/NADPH ratio — a high demand for NADPH (low NADPH) accelerates the pathway.',
          'Insulin upregulates G6PD expression during the well-fed, lipogenic state.',
        ],
        energetics: 'No net ATP; the payoff is 2 NADPH and a pentose per glucose-6-phosphate entering the oxidative branch.',
        vetNote:
          'Red cells depend on PPP-derived NADPH to counter oxidative stress. Onion or garlic toxicosis in dogs and cats — and acetaminophen in cats — overwhelms this defense, causing Heinz-body hemolytic anemia.',
      },
      {
        slug: 'citric-acid-cycle',
        name: 'Citric Acid Cycle (TCA)',
        equation: 'Acetyl-CoA + 3 NAD⁺ + FAD + GDP + Pᵢ → 2 CO₂ + 3 NADH + FADH₂ + GTP + CoA',
        location: 'Mitochondrial matrix',
        summary:
          'The central oxidative hub that completely burns acetyl-CoA to CO₂, feeding electron carriers to the respiratory chain and intermediates to biosynthesis.',
        overview: [
          'The citric acid cycle (Krebs / TCA cycle) is the common final pathway for the oxidation of carbohydrate, fat, and protein fuels, all of which converge on acetyl-CoA. Each turn fully oxidizes one acetyl group to two molecules of CO₂.',
          'The cycle is amphibolic: besides extracting energy as NADH and FADH₂, its intermediates are siphoned off for biosynthesis (citrate for fatty acids, α-ketoglutarate and oxaloacetate for amino acids, succinyl-CoA for heme). These withdrawals must be balanced by anaplerotic reactions that replenish the cycle.',
          'Because it is strictly aerobic — the reduced carriers it makes can only be reoxidized by oxygen in the electron transport chain — the cycle ties cellular energy production directly to respiration.',
        ],
        steps: [
          { title: 'Citrate synthesis', detail: 'Citrate synthase condenses acetyl-CoA with oxaloacetate.' },
          { title: 'Oxidative decarboxylations', detail: 'Isocitrate dehydrogenase and α-ketoglutarate dehydrogenase release the two CO₂ and produce NADH.' },
          { title: 'Regeneration of oxaloacetate', detail: 'Succinyl-CoA synthetase (GTP), succinate dehydrogenase (FADH₂, also Complex II), fumarase, and malate dehydrogenase close the loop.' },
        ],
        regulation: [
          'Controlled by energy charge and NADH/NAD⁺ ratio: high ATP and NADH inhibit citrate synthase, isocitrate dehydrogenase, and α-ketoglutarate dehydrogenase.',
          'Ca²⁺ released during muscle contraction stimulates the cycle to match ATP demand.',
        ],
        energetics: 'Per acetyl-CoA: 3 NADH, 1 FADH₂, 1 GTP → roughly 10 ATP after oxidative phosphorylation.',
        vetNote:
          'Cobalt deficiency in ruminants impairs vitamin B₁₂ synthesis by rumen microbes, blocking methylmalonyl-CoA entry into the cycle and causing wasting — a reminder that the TCA cycle depends on micronutrient cofactors.',
      },
      {
        slug: 'pyruvate-metabolism',
        name: 'Pyruvate Metabolism',
        equation: 'Pyruvate → Acetyl-CoA / Lactate / Oxaloacetate / Alanine',
        location: 'Cytosol & mitochondrial matrix',
        summary:
          'The metabolic crossroads where pyruvate is directed toward complete oxidation, anaerobic recycling, gluconeogenesis, or transamination.',
        overview: [
          'Pyruvate is the branch point that connects glycolysis to nearly every other pathway. Its fate is decided by the cell’s oxygen supply, energy state, and biosynthetic needs.',
          'Under aerobic conditions the pyruvate dehydrogenase (PDH) complex oxidatively decarboxylates pyruvate to acetyl-CoA, committing carbon to the TCA cycle or fatty acid synthesis — an irreversible, tightly regulated reaction. Anaerobically, lactate dehydrogenase reduces pyruvate to lactate to regenerate NAD⁺.',
          'For biosynthesis, pyruvate carboxylase converts pyruvate to oxaloacetate (anaplerosis and gluconeogenesis), while transamination yields alanine, a major carrier of amino nitrogen from muscle to liver.',
        ],
        steps: [
          { title: 'Pyruvate → Acetyl-CoA', detail: 'PDH complex (three enzymes, five cofactors including thiamine, lipoate, FAD, NAD⁺, CoA).' },
          { title: 'Pyruvate → Lactate', detail: 'Lactate dehydrogenase regenerates cytosolic NAD⁺ for continued glycolysis.' },
          { title: 'Pyruvate → Oxaloacetate', detail: 'Pyruvate carboxylase replenishes the TCA cycle and primes gluconeogenesis.' },
          { title: 'Pyruvate → Alanine', detail: 'Alanine aminotransferase links carbohydrate and amino acid metabolism.' },
        ],
        regulation: [
          'PDH is inactivated by phosphorylation (PDH kinase, stimulated by acetyl-CoA and NADH) and reactivated by PDH phosphatase (stimulated by Ca²⁺ and insulin).',
          'High acetyl-CoA favors pyruvate carboxylase over PDH, directing pyruvate toward gluconeogenesis when fuel is abundant.',
        ],
        energetics: 'The PDH reaction yields 1 NADH per pyruvate and supplies the 2-carbon unit that the TCA cycle oxidizes.',
        vetNote:
          'Thiamine (B₁) is an essential PDH cofactor; thiamine deficiency causes polioencephalomalacia in ruminants and is a risk in cats fed thiaminase-rich raw fish, producing neurologic disease.',
      },
    ],
  },
  {
    slug: 'lipid',
    name: 'Lipid',
    korean: '지질',
    tagline: 'Dense energy storage and membrane architecture',
    image: '/images/lipid.jpg',
    intro: [
      'Lipids are the animal body’s most concentrated energy store and the structural backbone of every membrane. Lipid metabolism governs how fat is mobilized for fuel, synthesized for storage, and converted into signaling and transport molecules.',
      'These pathways pivot on acetyl-CoA: β-oxidation breaks fatty acids down to it, synthesis builds fatty acids up from it, ketogenesis repackages it for export, and cholesterol synthesis diverts it toward sterols and steroids.',
    ],
    pathways: [
      {
        slug: 'fatty-acid-beta-oxidation',
        name: 'Fatty Acid β-Oxidation',
        equation: 'Palmitoyl-CoA + 7 FAD + 7 NAD⁺ + 7 CoA → 8 Acetyl-CoA + 7 FADH₂ + 7 NADH',
        location: 'Mitochondrial matrix',
        summary:
          'The mitochondrial spiral that shortens fatty acids two carbons at a time, releasing acetyl-CoA and reduced electron carriers for abundant ATP.',
        overview: [
          'β-oxidation is the principal route for extracting energy from fat. Fatty acids liberated from adipose triacylglycerol travel to tissues, are activated to fatty acyl-CoA, and are carried into the mitochondrion by the carnitine shuttle — the committed, rate-limiting step.',
          'Inside the matrix, each round of four reactions (oxidation, hydration, oxidation, thiolysis) clips off one acetyl-CoA and generates one FADH₂ and one NADH. The cycle repeats until the chain is fully consumed.',
          'Because fat is reduced and anhydrous, it stores far more energy per gram than glycogen, making β-oxidation the dominant fuel pathway during fasting, sustained exercise, and in cardiac muscle, which prefers fatty acids at rest.',
        ],
        steps: [
          { title: 'Activation', detail: 'Acyl-CoA synthetase couples the fatty acid to CoA at the cost of 2 ATP equivalents.' },
          { title: 'Carnitine shuttle', detail: 'CPT-1 on the outer membrane is the rate-limiting gate; CPT-2 regenerates acyl-CoA inside.' },
          { title: 'Four-step spiral', detail: 'Acyl-CoA dehydrogenase (FADH₂), enoyl-CoA hydratase, hydroxyacyl-CoA dehydrogenase (NADH), and thiolase release acetyl-CoA.' },
        ],
        regulation: [
          'Malonyl-CoA, the first intermediate of fatty acid synthesis, inhibits CPT-1 — so synthesis and oxidation cannot run together.',
          'Glucagon and fasting promote lipolysis and oxidation; insulin suppresses them.',
        ],
        energetics: 'Complete oxidation of palmitate (C16) yields ~106 ATP — far more than the 2 ATP from a glucose by glycolysis.',
        vetNote:
          'Cats have limited capacity to handle large fat loads during anorexia; rapid mobilization overwhelms the liver and causes hepatic lipidosis, a common and serious feline disease.',
      },
      {
        slug: 'fatty-acid-synthesis',
        name: 'Fatty Acid Synthesis',
        equation: '8 Acetyl-CoA + 7 ATP + 14 NADPH → Palmitate + 8 CoA + 14 NADP⁺',
        location: 'Cytosol',
        summary:
          'The cytosolic assembly of long-chain fatty acids from acetyl-CoA and malonyl-CoA, using NADPH as reducing power, when fuel is abundant.',
        overview: [
          'Fatty acid synthesis is the anabolic counterpart of β-oxidation, building palmitate two carbons at a time on the multifunctional fatty acid synthase (FAS) complex. It occurs in the cytosol of liver, adipose, and mammary tissue during the well-fed state.',
          'Acetyl-CoA generated in the mitochondrion is exported to the cytosol as citrate, then regenerated. The committed step is its carboxylation to malonyl-CoA by acetyl-CoA carboxylase (ACC), the key regulatory enzyme. NADPH, supplied largely by the pentose phosphate pathway, drives the reductive condensations.',
          'The pathway converts surplus dietary carbohydrate and protein carbon into storage fat, integrating energy intake with long-term reserves.',
        ],
        steps: [
          { title: 'Citrate shuttle', detail: 'Acetyl-CoA leaves the mitochondrion as citrate and is cleaved back by ATP-citrate lyase.' },
          { title: 'Acetyl-CoA → Malonyl-CoA', detail: 'Acetyl-CoA carboxylase (biotin-dependent) — the committed, rate-limiting step.' },
          { title: 'Chain elongation', detail: 'FAS repeats condensation, reduction, dehydration, and reduction until palmitate (C16) is released.' },
        ],
        regulation: [
          'ACC is activated by citrate and insulin, inhibited by palmitoyl-CoA and by AMP-activated kinase (AMPK) during energy stress.',
          'Its product malonyl-CoA simultaneously blocks β-oxidation, enforcing reciprocal control.',
        ],
        energetics: 'Consumes 7 ATP and 14 NADPH to make one palmitate — an energy investment in storage.',
        vetNote:
          'The mammary gland is a fatty-acid-synthesizing powerhouse during lactation; milk fat yield in dairy species is highly sensitive to diet and to the supply of acetate from rumen fermentation.',
      },
      {
        slug: 'ketone-body-metabolism',
        name: 'Ketone Body Metabolism',
        equation: '2 Acetyl-CoA → Acetoacetate ⇌ β-Hydroxybutyrate (+ Acetone)',
        location: 'Liver mitochondria (synthesis); extrahepatic tissues (use)',
        summary:
          'The hepatic conversion of surplus acetyl-CoA into water-soluble ketone bodies that export fat-derived fuel to the brain, heart, and muscle during fasting.',
        overview: [
          'When fatty acid oxidation outpaces the TCA cycle’s capacity — during fasting, starvation, or uncontrolled diabetes — the liver condenses excess acetyl-CoA into ketone bodies. These small, soluble molecules circulate freely and cross the blood–brain barrier.',
          'Acetoacetate and β-hydroxybutyrate become major alternative fuels for the brain (which cannot oxidize fatty acids directly), heart, and skeletal muscle, sparing glucose and reducing the need to catabolize muscle protein for gluconeogenesis.',
          'The liver makes ketones but cannot use them — it lacks the enzyme thiophorase (succinyl-CoA transferase) — so the bodies it produces are obligately exported to peripheral tissues.',
        ],
        steps: [
          { title: 'Condensation', detail: 'Thiolase and HMG-CoA synthase build HMG-CoA from three acetyl-CoA.' },
          { title: 'Cleavage', detail: 'HMG-CoA lyase releases acetoacetate, which is reduced to β-hydroxybutyrate.' },
          { title: 'Utilization', detail: 'In peripheral tissues, thiophorase converts acetoacetate back to acetyl-CoA for the TCA cycle.' },
        ],
        regulation: [
          'Ketogenesis rises when insulin is low and glucagon high, driving lipolysis and β-oxidation.',
          'Oxaloacetate depletion (diverted to gluconeogenesis) limits TCA throughput and pushes acetyl-CoA toward ketones.',
        ],
        energetics: 'β-hydroxybutyrate is an efficient fuel; its oxidation yields ~21.5 ATP per molecule in peripheral tissues.',
        vetNote:
          'Ketosis is a flagship veterinary metabolic disease: acetonemia in dairy cattle and pregnancy toxemia in ewes and does arise when glucose demand outstrips supply, sending the liver into overdrive ketogenesis.',
      },
      {
        slug: 'cholesterol-synthesis',
        name: 'Cholesterol Synthesis',
        equation: '18 Acetyl-CoA + ATP + NADPH → Cholesterol (C₂₇)',
        location: 'Cytosol & endoplasmic reticulum (chiefly liver)',
        summary:
          'The multistep construction of cholesterol from acetyl-CoA through mevalonate and isoprenoid intermediates — the precursor of bile acids, steroid hormones, and vitamin D.',
        overview: [
          'Cholesterol is an essential membrane component and the parent molecule of bile acids, steroid hormones, and vitamin D. Animals can synthesize all they need, principally in the liver, from acetyl-CoA.',
          'The pathway proceeds through mevalonate to activated five-carbon isoprene units, which polymerize into squalene and cyclize into the steroid nucleus. The rate-limiting and most regulated step is the formation of mevalonate by HMG-CoA reductase — the molecular target of statin drugs.',
          'Cholesterol is packaged with triacylglycerol into lipoproteins for transport, and its homeostasis is balanced against dietary uptake and conversion to bile acids for excretion.',
        ],
        steps: [
          { title: 'Acetyl-CoA → HMG-CoA', detail: 'Cytosolic HMG-CoA synthase forms the same intermediate used in ketogenesis.' },
          { title: 'HMG-CoA → Mevalonate', detail: 'HMG-CoA reductase, the rate-limiting step, uses 2 NADPH (statin target).' },
          { title: 'Isoprenoids → Squalene → Cholesterol', detail: 'Successive condensations build the C₂₇ sterol ring.' },
        ],
        regulation: [
          'HMG-CoA reductase is downregulated by cholesterol (via SREBP), by phosphorylation (AMPK), and by sterol-driven degradation.',
          'Insulin and thyroid hormone increase, while glucagon decreases, reductase activity.',
        ],
        energetics: 'Highly reductive and ATP-consuming; emphasizes biosynthesis rather than energy yield.',
        vetNote:
          'Species differ strikingly in lipoprotein handling — dogs and cats are relatively resistant to diet-induced atherosclerosis, whereas hypothyroid dogs develop marked hypercholesterolemia, a useful diagnostic clue.',
      },
      {
        slug: 'triacylglycerol-metabolism',
        name: 'Triacylglycerol Metabolism',
        equation: 'Glycerol-3-P + 3 Fatty acyl-CoA ⇌ Triacylglycerol + 3 CoA',
        location: 'Cytosol (liver, adipose, intestine)',
        summary:
          'The synthesis and lipolysis of triacylglycerol, the body’s principal energy depot, balancing fuel storage against mobilization under hormonal control.',
        overview: [
          'Triacylglycerol (TAG) is the storage form of fatty acids, packed into adipocytes as a nearly anhydrous, high-density energy reserve. Its metabolism is a continuous cycle of esterification (storage) and lipolysis (release).',
          'Synthesis proceeds from glycerol-3-phosphate and activated fatty acids in liver and adipose tissue; the intestine uses the monoacylglycerol pathway to re-form dietary TAG for packaging into chylomicrons. Lipolysis liberates free fatty acids and glycerol for use elsewhere.',
          'The free fatty acids feed β-oxidation, while glycerol returns to the liver for gluconeogenesis — making TAG turnover a key node linking fat stores to whole-body fuel economy.',
        ],
        steps: [
          { title: 'Esterification', detail: 'Glycerol-3-phosphate is acylated stepwise; phosphatidic acid is dephosphorylated and acylated to TAG.' },
          { title: 'Lipolysis', detail: 'Adipose triglyceride lipase (ATGL) and hormone-sensitive lipase (HSL) sequentially hydrolyze TAG.' },
          { title: 'Export & uptake', detail: 'Lipoprotein lipase at capillary walls releases fatty acids from circulating TAG for tissue uptake.' },
        ],
        regulation: [
          'Hormone-sensitive lipase is activated by epinephrine/glucagon (via PKA) and strongly inhibited by insulin.',
          'Insulin promotes esterification by raising glycerol-3-phosphate availability and lipoprotein lipase activity in adipose.',
        ],
        energetics: 'Storage is energetically cheap relative to the enormous ATP yield recovered on complete oxidation of the stored fatty acids.',
        vetNote:
          'Obesity is the most common nutritional disorder in companion animals; excess TAG storage drives insulin resistance, and in cats it predisposes to type-2-like diabetes mellitus.',
      },
    ],
  },
  {
    slug: 'protein',
    name: 'Protein',
    korean: '단백질',
    tagline: 'Nitrogen economy and amino acid turnover',
    image: '/images/protein.jpg',
    intro: [
      'Protein metabolism manages the body’s nitrogen. Unlike carbohydrate and fat, amino acids cannot be stored, so their carbon skeletons are constantly recycled for energy or biosynthesis while their nitrogen is safely disposed of.',
      'These pathways trace nitrogen from its removal (transamination and deamination), through its detoxification (urea cycle), to the fate of the carbon skeletons (catabolism) and the building of new amino acids (biosynthesis).',
    ],
    pathways: [
      {
        slug: 'transamination-deamination',
        name: 'Transamination & Deamination',
        equation: 'Amino acid + α-Ketoglutarate ⇌ α-Keto acid + Glutamate → α-KG + NH₄⁺',
        location: 'Cytosol & mitochondria (liver, muscle)',
        summary:
          'The coupled removal of amino groups — first funneled onto glutamate by aminotransferases, then released as free ammonia by glutamate dehydrogenase.',
        overview: [
          'Before an amino acid can be oxidized, its α-amino group must be removed. Transamination transfers that group to α-ketoglutarate, generating glutamate and the corresponding α-keto acid, all catalyzed by pyridoxal-phosphate-dependent aminotransferases.',
          'Glutamate then acts as the collection point for amino nitrogen. In the liver, glutamate dehydrogenase oxidatively deaminates it, releasing free ammonium and regenerating α-ketoglutarate — the only reaction that liberates the nitrogen for disposal via the urea cycle.',
          'This two-stage strategy channels the nitrogen of twenty different amino acids through a single common intermediate, simplifying both its handling and its regulation.',
        ],
        steps: [
          { title: 'Transamination', detail: 'Aminotransferases (e.g. ALT, AST) shuttle amino groups onto α-ketoglutarate using PLP.' },
          { title: 'Oxidative deamination', detail: 'Glutamate dehydrogenase releases NH₄⁺ and NADH/NADPH, regenerating α-ketoglutarate.' },
          { title: 'Nitrogen transport', detail: 'Glutamine synthetase and the glucose–alanine cycle ferry nitrogen safely to the liver.' },
        ],
        regulation: [
          'Glutamate dehydrogenase is allosterically activated by ADP/GDP (energy need) and inhibited by ATP/GTP.',
          'Aminotransferase activity tracks amino acid availability and the demand for gluconeogenic substrate.',
        ],
        energetics: 'Transamination is near-equilibrium and energy-neutral; deamination contributes reducing equivalents.',
        vetNote:
          'Serum ALT and AST are cornerstone diagnostic enzymes: ALT is a liver-specific marker in dogs and cats, while AST elevations also flag muscle injury — interpreting them is daily clinical biochemistry.',
      },
      {
        slug: 'urea-cycle',
        name: 'Urea Cycle',
        equation: 'NH₄⁺ + HCO₃⁻ + Aspartate + 3 ATP → Urea + Fumarate + 2 ADP + AMP',
        location: 'Liver (mitochondria & cytosol)',
        summary:
          'The five-enzyme hepatic cycle that converts toxic ammonia into water-soluble urea for safe excretion by the kidneys.',
        overview: [
          'Ammonia is highly neurotoxic, so terrestrial animals convert it to non-toxic urea. The urea cycle, confined to the liver, incorporates two nitrogen atoms — one from free ammonium, one from aspartate — and a carbon from bicarbonate into each urea molecule.',
          'The pathway straddles two compartments: the first two steps occur in the mitochondrion, the remainder in the cytosol. Its initiating enzyme, carbamoyl phosphate synthetase I, requires the allosteric activator N-acetylglutamate, linking urea production to the overall rate of amino acid catabolism.',
          'The fumarate released ties the cycle to the TCA cycle, and the whole process is upregulated on high-protein diets and during fasting, when amino acid breakdown surges.',
        ],
        steps: [
          { title: 'Carbamoyl phosphate', detail: 'CPS-I (mitochondrial) fixes NH₄⁺ and HCO₃⁻ using 2 ATP; needs N-acetylglutamate.' },
          { title: 'Citrulline → Argininosuccinate', detail: 'Ornithine transcarbamoylase, then argininosuccinate synthetase adds aspartate (the second nitrogen).' },
          { title: 'Arginine → Urea', detail: 'Argininosuccinate lyase and arginase release urea and regenerate ornithine.' },
        ],
        regulation: [
          'N-acetylglutamate (made when glutamate and arginine are plentiful) activates CPS-I, the committed step.',
          'Enzyme levels are induced by high-protein intake and by glucagon/glucocorticoids during fasting.',
        ],
        energetics: 'Costs 4 high-energy phosphate bonds (3 ATP → 2 ADP + AMP) per urea, partly offset by fumarate entering the TCA cycle.',
        vetNote:
          'Hepatic encephalopathy from portosystemic shunts — common in young dogs of certain breeds — results when ammonia bypasses the urea cycle and reaches the brain; blood ammonia and bile acids are key diagnostics.',
      },
      {
        slug: 'amino-acid-catabolism',
        name: 'Amino Acid Catabolism',
        equation: 'Amino acid carbon skeletons → 7 central metabolites',
        location: 'Cytosol & mitochondria (mainly liver)',
        summary:
          'The breakdown of the carbon skeletons left after deamination into seven intermediates that feed the TCA cycle, gluconeogenesis, or ketogenesis.',
        overview: [
          'Once nitrogen is stripped away, the remaining carbon skeleton of each amino acid is funneled into one of just seven products: pyruvate, acetyl-CoA, acetoacetyl-CoA, α-ketoglutarate, succinyl-CoA, fumarate, or oxaloacetate.',
          'Amino acids are classified by where their carbons end up. Glucogenic amino acids yield pyruvate or TCA intermediates and can be converted to glucose; ketogenic amino acids (leucine and lysine exclusively) yield acetyl-CoA or acetoacetyl-CoA and contribute to ketone bodies and fat. Several are both.',
          'This catabolism allows dietary or muscle protein to serve as fuel and as a gluconeogenic substrate during fasting, integrating amino acids fully into whole-body energy metabolism.',
        ],
        steps: [
          { title: 'Glucogenic entry', detail: 'Skeletons enter as pyruvate, α-ketoglutarate, succinyl-CoA, fumarate, or oxaloacetate for glucose synthesis.' },
          { title: 'Ketogenic entry', detail: 'Leucine and lysine yield acetyl-CoA / acetoacetyl-CoA, feeding ketone and fat synthesis.' },
          { title: 'Branched-chain handling', detail: 'Branched-chain α-keto acid dehydrogenase processes valine, leucine, and isoleucine, mainly in muscle.' },
        ],
        regulation: [
          'Flux follows substrate supply; catabolism accelerates during fasting and on high-protein diets.',
          'Branched-chain α-keto acid dehydrogenase is regulated by phosphorylation in parallel with PDH.',
        ],
        energetics: 'Carbon skeletons yield ATP through the TCA cycle or spare glucose by gluconeogenesis.',
        vetNote:
          'Inherited defects of branched-chain catabolism (maple syrup urine disease) occur in cattle; species also differ in amino acid requirements, central to formulating balanced animal diets.',
      },
      {
        slug: 'amino-acid-biosynthesis',
        name: 'Amino Acid Biosynthesis',
        equation: 'α-Keto acid + Glutamate ⇌ Amino acid + α-Ketoglutarate',
        location: 'Cytosol & mitochondria',
        summary:
          'The construction of nonessential amino acids from central metabolites and amino nitrogen, while essential amino acids must be obtained from the diet.',
        overview: [
          'Animals can synthesize the nonessential amino acids from glycolytic and TCA intermediates, drawing amino nitrogen mainly from glutamate and glutamine. Transamination of α-keto acids is the simplest route, directly mirroring catabolism.',
          'The essential amino acids cannot be made — their carbon skeletons require pathways animals lack — so they must come from food. The dividing line between essential and nonessential is species-dependent and nutritionally critical.',
          'Beyond protein synthesis, amino acids are precursors for an enormous range of products: heme, nucleotides, neurotransmitters, creatine, glutathione, and nitric oxide, making their biosynthesis central to far more than building proteins.',
        ],
        steps: [
          { title: 'Direct transamination', detail: 'Alanine, aspartate, and glutamate form from pyruvate, oxaloacetate, and α-ketoglutarate.' },
          { title: 'Glutamine & related', detail: 'Glutamine, proline, and arginine derive from glutamate; serine and glycine from 3-phosphoglycerate.' },
          { title: 'Sulfur & aromatic', detail: 'Cysteine forms from methionine; tyrosine from the essential phenylalanine.' },
        ],
        regulation: [
          'Biosynthetic pathways are feedback-inhibited by their end-product amino acids.',
          'Nitrogen availability through glutamate/glutamine sets the overall pace.',
        ],
        energetics: 'Requires ATP and reducing equivalents; biosynthesis is an investment rather than an energy source.',
        vetNote:
          'Cats are obligate carnivores with unusual requirements: taurine and arginine are essential, and dietary deficiency causes dilated cardiomyopathy and life-threatening hyperammonemia respectively.',
      },
    ],
  },
  {
    slug: 'nucleic-acid',
    name: 'Nucleic acid',
    korean: '핵산',
    tagline: 'Building blocks of genetic information',
    image: '/images/nucleic-acid.jpg',
    intro: [
      'Nucleotide metabolism supplies the building blocks of DNA and RNA, plus the energy carriers (ATP, GTP) and signaling molecules (cAMP) that power and coordinate the cell. Because these molecules are needed for every round of cell division, their pathways are prime targets for antiviral and anticancer drugs.',
      'These pathways cover the costly de novo construction of purine and pyrimidine rings, the breakdown of nucleotides to excretory products, and the economical salvage routes that recycle preformed bases.',
    ],
    pathways: [
      {
        slug: 'purine-biosynthesis',
        name: 'Purine Biosynthesis',
        equation: 'PRPP + Glutamine + Glycine + Aspartate + CO₂ + formyl groups → IMP → AMP / GMP',
        location: 'Cytosol',
        summary:
          'The de novo assembly of the purine ring directly onto ribose-5-phosphate, producing IMP and then AMP and GMP, at high energy cost.',
        overview: [
          'Unlike pyrimidines, the purine ring is built piece by piece directly on a ribose-5-phosphate scaffold. Activated PRPP serves as the foundation, and atoms are contributed by glycine, glutamine, aspartate, CO₂, and folate-borne one-carbon units across ten enzymatic steps.',
          'The first committed product is inosine monophosphate (IMP), the common precursor that branches to AMP and GMP through separate two-step routes. The whole process is energetically expensive, consuming multiple ATP.',
          'Because the pathway depends on folate-derived one-carbon units, antifolate drugs (e.g. methotrexate) block purine synthesis — a basis for cancer chemotherapy and immunosuppression.',
        ],
        steps: [
          { title: 'PRPP → 5-Phosphoribosylamine', detail: 'Glutamine-PRPP amidotransferase, the committed and rate-limiting step.' },
          { title: 'Ring assembly → IMP', detail: 'Nine further steps add carbons and nitrogens, requiring glycine, formyl-tetrahydrofolate, and aspartate.' },
          { title: 'IMP → AMP / GMP', detail: 'Branch reactions using GTP (for AMP) and ATP (for GMP) balance the two nucleotides.' },
        ],
        regulation: [
          'PRPP amidotransferase is feedback-inhibited by IMP, AMP, and GMP and activated by PRPP.',
          'Reciprocal use of GTP to make AMP and ATP to make GMP keeps the two pools balanced.',
        ],
        energetics: 'Consumes several ATP per ring assembled — far costlier than the salvage pathway.',
        vetNote:
          'Antifolates and purine analogues used in veterinary oncology exploit this pathway; rapidly dividing tumor cells are especially dependent on de novo purine synthesis.',
      },
      {
        slug: 'pyrimidine-biosynthesis',
        name: 'Pyrimidine Biosynthesis',
        equation: 'Glutamine + HCO₃⁻ + Aspartate → Orotate → UMP → CTP / dTMP',
        location: 'Cytosol & mitochondria',
        summary:
          'The de novo route in which the pyrimidine ring is fully assembled first, then attached to ribose-5-phosphate to form UMP, the precursor of all pyrimidine nucleotides.',
        overview: [
          'Pyrimidine synthesis takes the opposite strategy to purines: the six-membered ring is constructed from carbamoyl phosphate and aspartate before being joined to PRPP. The cytosolic carbamoyl phosphate synthetase II initiates the pathway.',
          'The first complete nucleotide, UMP, is the parent of UTP, CTP, and — after reduction by ribonucleotide reductase — the deoxyribonucleotides including dTMP. Thymidylate synthase, which makes dTMP, requires a folate cofactor.',
          'This dependence makes pyrimidine synthesis a second major chemotherapeutic target: 5-fluorouracil inhibits thymidylate synthase, starving dividing cells of the dTMP needed for DNA replication.',
        ],
        steps: [
          { title: 'Carbamoyl phosphate (cytosolic)', detail: 'CPS-II uses glutamine and bicarbonate — the committed step in animals.' },
          { title: 'Ring → Orotate → UMP', detail: 'Aspartate transcarbamoylase and downstream enzymes form orotate, which joins PRPP to give UMP.' },
          { title: 'UMP → CTP / dTMP', detail: 'Phosphorylation, amination (CTP), and thymidylate synthase (dTMP) complete the set.' },
        ],
        regulation: [
          'CPS-II is inhibited by UTP and activated by PRPP and ATP in mammals.',
          'Ribonucleotide reductase governs the balanced supply of deoxyribonucleotides for DNA synthesis.',
        ],
        energetics: 'ATP-dependent assembly; cheaper than purine synthesis but still a biosynthetic investment.',
        vetNote:
          'Thymidylate synthase inhibitors and ribonucleotide reductase inhibitors feature in antiviral and antineoplastic therapy used in veterinary medicine.',
      },
      {
        slug: 'nucleotide-degradation',
        name: 'Nucleotide Degradation',
        equation: 'Purines → Uric acid;  Pyrimidines → β-alanine / β-aminoisobutyrate',
        location: 'Cytosol (mainly liver)',
        summary:
          'The catabolism of nucleotides — purines to uric acid via xanthine oxidase, pyrimidines to soluble end products that re-enter central metabolism.',
        overview: [
          'Nucleotides are continuously turned over. Purine nucleotides are dephosphorylated and deaminated to hypoxanthine and xanthine, which xanthine oxidase oxidizes to uric acid — the final excretory product in primates and birds.',
          'Most mammals possess uricase, which further degrades uric acid to far more soluble allantoin, so their excretory chemistry differs importantly from that of humans and birds. Pyrimidine breakdown is simpler, yielding β-alanine and β-aminoisobutyrate that re-enter normal metabolism.',
          'The high insolubility of uric acid makes its handling clinically significant, since precipitation produces crystals and stones.',
        ],
        steps: [
          { title: 'Purine breakdown', detail: 'Nucleotidases, adenosine deaminase, and purine nucleoside phosphorylase yield hypoxanthine and xanthine.' },
          { title: 'Uric acid formation', detail: 'Xanthine oxidase produces uric acid; most mammals convert it further to allantoin via uricase.' },
          { title: 'Pyrimidine breakdown', detail: 'Ring opening yields β-alanine and β-aminoisobutyrate, which are fully metabolized.' },
        ],
        regulation: [
          'Degradative flux follows nucleotide turnover and cell death; allopurinol inhibits xanthine oxidase to lower uric acid.',
          'The balance between salvage and degradation determines how much purine is lost as uric acid.',
        ],
        energetics: 'Catabolic and largely energy-releasing; the recovered ribose and bases can be salvaged.',
        vetNote:
          'Dalmatians have a defect in uric acid transport and excrete uric acid rather than allantoin, predisposing them to urate uroliths — a textbook species-specific consequence of this pathway.',
      },
      {
        slug: 'salvage-pathway',
        name: 'Salvage Pathway',
        equation: 'Free base + PRPP → Nucleotide + PPᵢ',
        location: 'Cytosol',
        summary:
          'The energy-efficient recovery of preformed purine and pyrimidine bases into nucleotides, sparing the costly de novo pathways.',
        overview: [
          'Rather than building rings from scratch, cells reclaim free bases released by nucleic acid turnover and re-attach them to PRPP. This salvage is far cheaper than de novo synthesis and is the dominant route in many tissues — notably the brain, which has limited de novo capacity.',
          'Two phosphoribosyltransferases handle purines: HGPRT salvages hypoxanthine and guanine, and APRT salvages adenine. Pyrimidine bases and nucleosides are recovered by their own kinases, such as thymidine kinase.',
          'The importance of salvage is dramatized by its failure: a complete deficiency of HGPRT in humans causes Lesch–Nyhan syndrome, with overproduction of uric acid and severe neurological disease.',
        ],
        steps: [
          { title: 'Purine salvage', detail: 'HGPRT recovers hypoxanthine and guanine; APRT recovers adenine, each using PRPP.' },
          { title: 'Pyrimidine salvage', detail: 'Nucleoside kinases (e.g. thymidine kinase) re-phosphorylate recovered nucleosides.' },
          { title: 'Integration', detail: 'Salvaged nucleotides feed back to inhibit de novo synthesis, conserving energy.' },
        ],
        regulation: [
          'Salvage competes with degradation for free bases; high PRPP favors salvage.',
          'Recovered nucleotides feedback-inhibit PRPP amidotransferase, balancing the two supply routes.',
        ],
        energetics: 'Highly economical — a single PRPP and one transfer replace a multistep, ATP-hungry de novo pathway.',
        vetNote:
          'Many antiviral nucleoside analogues depend on salvage kinases for activation, and thymidine kinase activity in blood serves as a proliferation marker used in veterinary lymphoma management.',
      },
    ],
  },
]

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug)
}

export function getPathway(categorySlug: string, pathwaySlug: string) {
  const category = getCategory(categorySlug)
  const pathway = category?.pathways.find((p) => p.slug === pathwaySlug)
  return pathway ? { category, pathway } : null
}
