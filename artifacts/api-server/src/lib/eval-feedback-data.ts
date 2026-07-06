// Full bilingual (EN/AR) 3-tier feedback database for the 15 weighted British
// Center teacher-evaluation criteria. Extracted from the reference prototype.
// Each criterion has Weak / Developing / Strong tiers, each with reason,
// feedback, recommendations, a training video reference, and a website.
// Stored as the `feedback` jsonb column on eval_criteria.

export interface TierFeedback {
  reason: string;
  feedback: string;
  rec: string;
}
export interface CriterionFeedback {
  weak: { en: TierFeedback; ar: TierFeedback };
  developing: { en: TierFeedback; ar: TierFeedback };
  strong: { en: TierFeedback; ar: TierFeedback };
  video: string;
  website: string;
}

type FDB = Record<number, CriterionFeedback>;

export const FEEDBACK_DB: FDB = {
  1: {
    weak: {
      en: { reason: "The lesson lacks clear staging and a logical flow; students may be unsure of the purpose of each part.", feedback: "You have the heart of a great teacher. With a clearer roadmap, your lessons will feel much more secure and engaging for everyone.", rec: "Start by planning backwards from the outcome; list 3-4 distinct stages (warm-up, presentation, practice, production) and stick to them; next time, share a visual agenda on the board so learners see the journey." },
      ar: { reason: "يفتقر الدرس إلى مراحل واضحة وتسلسل منطقي؛ قد لا يكون الطلاب متأكدين من الغرض من كل جزء.", feedback: "لديك قلب معلم عظيم. مع خريطة طريق أوضح، ستشعر دروسك بمزيد من الأمان والجاذبية للجميع.", rec: "ابدأ بالتخطيط من النتيجة المرجوة؛ حدد ٣-٤ مراحل مميزة (إحماء، عرض، ممارسة، إنتاج) والتزم بها؛ شارك جدول أعمال مرئي على السبورة ليرى الطلاب الرحلة." },
    },
    developing: {
      en: { reason: "Some stages are present, but transitions can feel abrupt or rushed. The lesson shape is beginning to form.", feedback: "You're building a solid structure. A little more attention to stage links and timing will make your lessons flow like a story.", rec: "Script your transitions; time each stage and add a buffer; try a 'think-pair-share' after each main input to consolidate." },
      ar: { reason: "توجد بعض المراحل، لكن الانتقالات قد تكون مفاجئة أو متسرعة. بدأ شكل الدرس يتكون.", feedback: "أنت تبني هيكلًا قويًا. القليل من الاهتمام بروابط المراحل والتوقيت سيجعل دروسك تتدفق كالقصة.", rec: "اكتب نص انتقالاتك؛ حدد وقت كل مرحلة وأضف هامشًا؛ جرب 'فكر-شارك-زوج' بعد كل مدخل رئيسي لترسيخه." },
    },
    strong: {
      en: { reason: "The lesson has a clear, well-paced structure. Students move smoothly through logical stages and know what to expect.", feedback: "Brilliant – your planning really shows. Learners thrive on this clarity. Now you can start experimenting with even more creative sequences.", rec: "Record a lesson and reflect on whether the order of stages could be even more inductive; try flipping the presentation; mentor a colleague on lesson staging." },
      ar: { reason: "يتمتع الدرس بهيكل واضح ووتيرة مناسبة. يتحرك الطلاب بسلاسة عبر مراحل منطقية ويعرفون ما يمكن توقعه.", feedback: "رائع – يظهر تخطيطك حقًا. يزدهر المتعلمون بهذا الوضوح. يمكنك الآن البدء في تجربة تسلسلات أكثر إبداعًا.", rec: "سجل درسًا وتأمل فيما إذا كان ترتيب المراحل يمكن أن يكون أكثر استقراءً؛ جرب قلب العرض؛ درّب زميلاً على تنظيم الدرس." },
    },
    video: "Advanced Lesson Planning: Task-Based Learning Sequences (Cambridge ELT)",
    website: "cambridgeenglish.org",
  },
  2: {
    weak: {
      en: { reason: "Materials aren't ready; time is lost between activities; transitions feel chaotic.", feedback: "Every expert was once a beginner. Great organisation is a habit you can grow lesson by lesson.", rec: "Create a pre-class checklist (handouts, audio, board pens); assign a timekeeper role to a student; display a numbered agenda and tick items off together." },
      ar: { reason: "المواد غير جاهزة؛ يضيع الوقت بين الأنشطة؛ الانتقالات فوضوية.", feedback: "كل خبير كان مبتدئًا. التنظيم الرائع عادة يمكنك تنميتها درسًا تلو الآخر.", rec: "أنشئ قائمة تفقدية قبل الدرس (نشرات، صوت، أقلام سبورة)؛ عيّن طالبًا مسؤولاً عن الوقت؛ اعرض جدول أعمال مرقمًا وعلّم عليه معًا." },
    },
    developing: {
      en: { reason: "Lessons usually have materials, but transitions sometimes overrun or feel messy.", feedback: "You're getting the hang of it. With tiny tweaks to your routines, your lessons will feel effortlessly organised.", rec: "Rehearse one transition a day until it becomes automatic; keep all handouts in labelled piles; use a countdown timer on the board for individual tasks." },
      ar: { reason: "تحتوي الدروس عادة على مواد، لكن الانتقالات تطول أحيانًا أو تكون غير منظمة.", feedback: "بدأت تتقن الأمر. بتعديلات صغيرة على روتينك، ستصبح دروسك منظمة بسلاسة.", rec: "تدرب على انتقال واحد يوميًا حتى يصبح تلقائيًا؛ حافظ على النشرات في أكوام معنونة؛ استخدم مؤقتًا تنازليًا على السبورة للمهام الفردية." },
    },
    strong: {
      en: { reason: "The lesson runs like clockwork. Materials are ready, transitions are seamless, and no learning time is wasted.", feedback: "Outstanding organisation frees everyone to focus on learning. Your classroom feels like a well-oiled learning machine.", rec: "Now use your strong organisation to take more risks: try station rotations or project-based work; share your time-saving systems at a staff meeting." },
      ar: { reason: "الدرس يسير كالساعة. المواد جاهزة، الانتقالات سلسة، ولا يضيع وقت التعلم.", feedback: "التنظيم المتميز يحرر الجميع للتركيز على التعلم. فصلك الدراسي يشبه آلة تعلم مزيتة جيدًا.", rec: "استخدم تنظيمك القوي لاتخاذ المزيد من المخاطر: جرب التدوير بين المحطات أو العمل القائم على المشاريع؛ شارك أنظمتك الموفرة للوقت في اجتماع المعلمين." },
    },
    video: "Routines That Work for Active Learning (Teaching Channel)",
    website: "teachingchannel.com",
  },
  3: {
    weak: {
      en: { reason: "Tasks are repetitive or unclear; students often finish early or seem disengaged.", feedback: "Variety is the spice of teaching. Even small changes in task design can ignite your students' curiosity.", rec: "Use a mix of pair, group, and individual tasks; include at least one hands-on activity per lesson; always provide a clear model before students begin." },
      ar: { reason: "المهام متكررة أو غير واضحة؛ غالبًا ما ينتهي الطلاب مبكرًا أو يبدون غير مهتمين.", feedback: "التنوع هو نكهة التدريس. حتى التغييرات الصغيرة في تصميم المهام يمكن أن تشعل فضول طلابك.", rec: "استخدم مزيجًا من المهام الثنائية والجماعية والفردية؛ أضف نشاطًا عمليًا واحدًا على الأقل في كل درس؛ قدم نموذجًا واضحًا دائمًا قبل أن يبدأ الطلاب." },
    },
    developing: {
      en: { reason: "Tasks are mostly appropriate but could benefit from more variety and clearer instructions.", feedback: "You're on the right track. A wider repertoire of activity types will keep learners on their toes.", rec: "Build a bank of 10 go-to activities (jigsaw, info-gap, role-play, debate); rotate them weekly; always check instructions with ICQs." },
      ar: { reason: "المهام مناسبة في الغالب لكنها قد تستفيد من مزيد من التنوع والتعليمات الأوضح.", feedback: "أنت على الطريق الصحيح. مجموعة أوسع من أنواع الأنشطة ستبقي المتعلمين متيقظين.", rec: "أنشئ بنكًا من ١٠ أنشطة مفضلة (أحجية، فجوة معلومات، تمثيل أدوار، مناظرة)؛ قم بتدويرها أسبوعيًا؛ تحقق دائمًا من التعليمات بأسئلة ICQ." },
    },
    strong: {
      en: { reason: "Tasks are varied, well-scaffolded, and genuinely engaging. Students are actively involved throughout.", feedback: "Your activities spark real communication. Students clearly enjoy the challenge and variety you bring.", rec: "Now design a full project-based unit; encourage student-designed tasks; share your best activities at a teacher development session." },
      ar: { reason: "المهام متنوعة ومدعومة جيدًا وجذابة حقًا. يشارك الطلاب بنشاط طوال الوقت.", feedback: "أنشطتك تثير تواصلاً حقيقيًا. من الواضح أن الطلاب يستمتعون بالتحدي والتنوع الذي تقدمه.", rec: "صمم الآن وحدة كاملة قائمة على المشاريع؛ شجع المهام التي يصممها الطلاب؛ شارك أفضل أنشطتك في جلسة تطوير المعلمين." },
    },
    video: "Project-Based Learning in ESL (Edutopia)",
    website: "edutopia.org",
  },
  4: {
    weak: {
      en: { reason: "Instructions are confusing; too much L1 used; teacher talk is overly complex for the level.", feedback: "Clear classroom language is a skill that grows with practice. Simplify and succeed.", rec: "Grade your language to the students' level; use gesture and visuals to support instructions; limit L1 to 10% of lesson time." },
      ar: { reason: "التعليمات مربكة؛ استخدام كثير للغة الأم؛ حديث المعلم معقد جدًا بالنسبة للمستوى.", feedback: "لغة الفصل الواضحة مهارة تنمو بالممارسة. بسّط لتنجح.", rec: "قم بتكييف لغتك مع مستوى الطلاب؛ استخدم الإيماءات والمرئيات لدعم التعليمات؛ حدد استخدام اللغة الأم بـ ١٠٪ من وقت الدرس." },
    },
    developing: {
      en: { reason: "Instructions are usually understood but could be more concise and level-appropriate.", feedback: "You communicate well. Streamlining your instructions will save time and boost comprehension.", rec: "Script key instructions in advance; use the same command words consistently (e.g., 'Turn to page...', 'Work with your partner'); record yourself and review." },
      ar: { reason: "التعليمات مفهومة عادة لكنها قد تكون أكثر إيجازًا وملاءمة للمستوى.", feedback: "تتواصل بشكل جيد. تبسيط تعليماتك سيوفر الوقت ويعزز الفهم.", rec: "اكتب التعليمات الرئيسية مسبقًا؛ استخدم كلمات أوامر متسقة؛ سجل نفسك وراجع الأداء." },
    },
    strong: {
      en: { reason: "Classroom language is clear, well-graded, and supports learning. Students follow instructions with ease.", feedback: "Your classroom English is a model for learners. They benefit immensely from your clarity and consistency.", rec: "Now help colleagues improve their classroom language; create a poster of common instructions for the staffroom; experiment with more complex discourse markers." },
      ar: { reason: "لغة الفصل واضحة ومناسبة للمستوى وتدعم التعلم. يتابع الطلاب التعليمات بسهولة.", feedback: "لغتك الإنجليزية في الفصل نموذج للمتعلمين. يستفيدون كثيرًا من وضوحك واتساقك.", rec: "ساعد زملاءك الآن في تحسين لغتهم الصفية؛ أنشئ ملصقًا للتعليمات الشائعة في غرفة المعلمين؛ جرب علامات خطاب أكثر تعقيدًا." },
    },
    video: "Advanced Classroom Language Techniques (Cambridge ELT)",
    website: "cambridgeenglish.org",
  },
  5: {
    weak: {
      en: { reason: "Classroom feels disorganised; behaviour issues disrupt learning; routines are absent.", feedback: "Management is the foundation. Once routines are solid, everything else becomes easier.", rec: "Establish 3-5 non-negotiable routines (entry, attention signal, handing out papers); practise them explicitly; use positive reinforcement consistently." },
      ar: { reason: "الفصل يبدو غير منظم؛ مشاكل السلوك تعطل التعلم؛ الروتينات غائبة.", feedback: "الإدارة هي الأساس. بمجرد أن تصبح الروتينات صلبة، يصبح كل شيء آخر أسهل.", rec: "أسس ٣-٥ روتينات غير قابلة للتفاوض (الدخول، إشارة الانتباه، توزيع الأوراق)؛ تدرب عليها بشكل صريح؛ استخدم التعزيز الإيجابي باستمرار." },
    },
    developing: {
      en: { reason: "Most routines work but a few students occasionally derail activities; transitions need tightening.", feedback: "You have decent control. Sharpening a couple of routines will make a world of difference.", rec: "Identify the one routine that costs the most time and redesign it; use non-verbal signals for redirection; seat disruptive students strategically." },
      ar: { reason: "معظم الروتينات تعمل لكن بعض الطلاب يعطلون الأنشطة أحيانًا؛ الانتقالات تحتاج تشديدًا.", feedback: "لديك سيطرة جيدة. تحسين بعض الروتينات سيحدث فرقًا كبيرًا.", rec: "حدد الروتين الوحيد الذي يكلف أكبر وقت وأعد تصميمه؛ استخدم إشارات غير لفظية لإعادة التوجيه؛ أجلس الطلاب المشاغبين بشكل استراتيجي." },
    },
    strong: {
      en: { reason: "The classroom is a well-managed environment where learning thrives. Routines are automatic and respectful.", feedback: "Your management skills are top-notch. Students feel safe, respected, and ready to learn.", rec: "Now mentor a struggling colleague; introduce student-led classroom jobs; experiment with flexible seating arrangements." },
      ar: { reason: "الفصل بيئة مُدارة جيدًا حيث يزدهر التعلم. الروتينات تلقائية ومحترمة.", feedback: "مهاراتك الإدارية من الدرجة الأولى. يشعر الطلاب بالأمان والاحترام والاستعداد للتعلم.", rec: "درّب زميلاً يعاني الآن؛ قدم وظائف صفية يقودها الطلاب؛ جرب ترتيبات جلوس مرنة." },
    },
    video: "Next-Level Classroom Management (Cult of Pedagogy)",
    website: "cultofpedagogy.com",
  },
  6: {
    weak: {
      en: { reason: "The classroom atmosphere feels tense or flat; students hesitate to participate.", feedback: "A warm atmosphere is the soil where learning grows. Small gestures of encouragement can transform the room.", rec: "Greet every student by name at the door; use music during transitions; celebrate effort publicly, not just correct answers." },
      ar: { reason: "جو الفصل متوتر أو باهت؛ يتردد الطلاب في المشاركة.", feedback: "الجو الدافئ هو التربة التي ينمو فيها التعلم. لفتات صغيرة من التشجيع يمكن أن تحول الغرفة.", rec: "استقبل كل طالب باسمه عند الباب؛ استخدم الموسيقى أثناء الانتقالات؛ احتفل بالجهد علنًا، وليس فقط بالإجابات الصحيحة." },
    },
    developing: {
      en: { reason: "The atmosphere is generally pleasant but can dip during challenging activities.", feedback: "You create a nice vibe. Sustaining it through tough moments is the next step.", rec: "Use humour intentionally; check in with quieter students privately; start each lesson with a quick energiser." },
      ar: { reason: "الجو لطيف بشكل عام لكنه قد ينخفض أثناء الأنشطة الصعبة.", feedback: "تخلق جوًا لطيفًا. الحفاظ عليه خلال اللحظات الصعبة هو الخطوة التالية.", rec: "استخدم الفكاهة بشكل مقصود؛ تفقد الطلاب الأكثر هدوءًا بشكل خاص؛ ابدأ كل درس بنشاط منشط سريع." },
    },
    strong: {
      en: { reason: "The classroom buzzes with positive energy. Students feel safe to take risks and support each other.", feedback: "Your classroom is a joy to walk into. The supportive atmosphere you've cultivated is truly special.", rec: "Document your community-building strategies; present them at a staff meeting; introduce peer-nomination awards." },
      ar: { reason: "الفصل يعج بالطاقة الإيجابية. يشعر الطلاب بالأمان للمخاطرة ويدعمون بعضهم البعض.", feedback: "فصلك الدراسي ممتع للدخول إليه. الجو الداعم الذي زرعته مميز حقًا.", rec: "وثق استراتيجيات بناء المجتمع الخاصة بك؛ اعرضها في اجتماع المعلمين؛ قدم جوائز ترشيح الأقران." },
    },
    video: "Creating a Culture of Belonging (Cult of Pedagogy)",
    website: "cultofpedagogy.com",
  },
  7: {
    weak: {
      en: { reason: "Limited use of teaching aids; technology is absent or misused; students are passive.", feedback: "Tools are extensions of your teaching. Even simple visuals can dramatically boost engagement.", rec: "Incorporate at least one digital tool per lesson (e.g., Kahoot, Quizlet, YouTube clip); use realia whenever possible; prepare a simple slideshow." },
      ar: { reason: "استخدام محدود للوسائل التعليمية؛ التكنولوجيا غائبة أو مستخدمة بشكل خاطئ؛ الطلاب سلبيون.", feedback: "الأدوات هي امتدادات لتدريسك. حتى المرئيات البسيطة يمكن أن تعزز المشاركة بشكل كبير.", rec: "أدرج أداة رقمية واحدة على الأقل في كل درس (مثل Kahoot، Quizlet، مقطع يوتيوب)؛ استخدم الأشياء الحقيقية كلما أمكن؛ حضّر عرض شرائح بسيط." },
    },
    developing: {
      en: { reason: "Some tools are used but not always effectively; engagement is inconsistent.", feedback: "You're experimenting with tools – great! Now focus on using them purposefully to enhance, not distract.", rec: "Choose one tech tool per week and master it; always link the tool to a learning objective; ask students for feedback on what helps them." },
      ar: { reason: "يتم استخدام بعض الأدوات لكن ليس دائمًا بفعالية؛ المشاركة غير متسقة.", feedback: "أنت تجرب الأدوات – رائع! ركز الآن على استخدامها بشكل هادف للتعزيز وليس للإلهاء.", rec: "اختر أداة تقنية واحدة في الأسبوع وأتقنها؛ اربط الأداة دائمًا بهدف تعليمي؛ اسأل الطلاب عن ملاحظاتهم حول ما يساعدهم." },
    },
    strong: {
      en: { reason: "A rich variety of tools and media are used seamlessly to boost engagement and learning.", feedback: "Your lessons are multimedia-rich and students are clearly hooked. Technology serves your pedagogy beautifully.", rec: "Train colleagues on your favourite tools; create a shared resource bank; experiment with student-created digital content." },
      ar: { reason: "تُستخدم مجموعة غنية من الأدوات والوسائط بسلاسة لتعزيز المشاركة والتعلم.", feedback: "دروسك غنية بالوسائط المتعددة ومن الواضح أن الطلاب مهتمون. التكنولوجيا تخدم أصول تدريسك بشكل جميل.", rec: "درّب زملاءك على أدواتك المفضلة؛ أنشئ بنك موارد مشترك؛ جرب المحتوى الرقمي الذي يصنعه الطلاب." },
    },
    video: "Innovative EdTech for Language Teachers (Cambridge ELT)",
    website: "cambridgeenglish.org",
  },
  8: {
    weak: {
      en: { reason: "The whiteboard is messy or underused; key information is missing or illegible.", feedback: "Your board is a powerful visual anchor. A little organisation here pays huge dividends in clarity.", rec: "Divide the board into zones (agenda, new vocab, examples, homework); use colour coding; write the lesson objective at the top and leave it visible." },
      ar: { reason: "السبورة فوضوية أو غير مستخدمة بشكل كافٍ؛ المعلومات الرئيسية مفقودة أو غير مقروءة.", feedback: "سبورتك هي مرساة بصرية قوية. القليل من التنظيم هنا يعطي أرباحًا كبيرة في الوضوح.", rec: "قسّم السبورة إلى مناطق (جدول الأعمال، مفردات جديدة، أمثلة، واجب منزلي)؛ استخدم الترميز اللوني؛ اكتب هدف الدرس في الأعلى واتركه مرئيًا." },
    },
    developing: {
      en: { reason: "The board is functional but could be more organised and visually appealing.", feedback: "Your board does the job. With some simple design principles, it can become a real learning tool.", rec: "Plan your board layout in your lesson plan; use images and diagrams alongside text; leave student contributions on the board." },
      ar: { reason: "السبورة تؤدي الغرض لكنها قد تكون أكثر تنظيمًا وجاذبية بصرية.", feedback: "سبورتك تؤدي المهمة. ببعض مبادئ التصميم البسيطة، يمكن أن تصبح أداة تعلم حقيقية.", rec: "خطط لتخطيط سبورتك في خطة الدرس؛ استخدم الصور والرسوم البيانية بجانب النص؛ اترك مساهمات الطلاب على السبورة." },
    },
    strong: {
      en: { reason: "The whiteboard is a model of clarity – well-organised, colour-coded, and used interactively.", feedback: "Your boardwork is exemplary. Students can literally see the learning journey.", rec: "Photograph your best board layouts for your portfolio; train new teachers on board management; experiment with student-led boardwork." },
      ar: { reason: "السبورة نموذج للوضوح – منظمة جيدًا ومشفرة بالألوان ومستخدمة بشكل تفاعلي.", feedback: "استخدامك للسبورة مثالي. يمكن للطلاب رؤية رحلة التعلم حرفيًا.", rec: "صوّر أفضل تخطيطات سبورتك لمحفظتك؛ درّب المعلمين الجدد على إدارة السبورة؛ جرب استخدام السبورة بقيادة الطلاب." },
    },
    video: "Mastering Boardwork in Language Classrooms (Cambridge ELT)",
    website: "cambridgeenglish.org",
  },
  9: {
    weak: {
      en: { reason: "Appearance is unprofessional; attire is too casual or unkempt for a teaching environment.", feedback: "Professional appearance builds respect and sets the tone. Small adjustments make a big impact.", rec: "Adopt a smart-casual dress code; ensure clothes are clean and ironed; pay attention to grooming details." },
      ar: { reason: "المظهر غير مهني؛ الملابس غير رسمية جدًا أو غير مرتبة لبيئة التدريس.", feedback: "المظهر المهني يبني الاحترام ويحدد النغمة. التعديلات الصغيرة تحدث تأثيرًا كبيرًا.", rec: "اعتمد قواعد لباس أنيق غير رسمي؛ تأكد من أن الملابس نظيفة ومكوية؛ انتبه لتفاصيل النظافة الشخصية." },
    },
    developing: {
      en: { reason: "Appearance is generally acceptable but could be more consistently professional.", feedback: "You look fine. Elevating your professional image will boost both your confidence and classroom authority.", rec: "Plan your teaching wardrobe for the week; invest in a few quality pieces; consider the cultural expectations of your centre." },
      ar: { reason: "المظهر مقبول بشكل عام لكنه قد يكون أكثر احترافية باستمرار.", feedback: "تبدو جيدًا. رفع صورتك المهنية سيعزز ثقتك وسلطتك الصفية.", rec: "خطط لخزانة ملابس التدريس للأسبوع؛ استثمر في بضع قطع عالية الجودة؛ راعِ التوقعات الثقافية لمركزك." },
    },
    strong: {
      en: { reason: "Teacher presents a polished, professional image that commands respect and sets a positive example.", feedback: "You look the part perfectly. Your professional appearance reinforces the high standards of the centre.", rec: "Mentor new teachers on professional standards; contribute to the centre's dress code guidelines; maintain this excellent standard." },
      ar: { reason: "يقدم المعلم صورة مهنية مصقولة تفرض الاحترام وتضع مثالاً إيجابيًا.", feedback: "تبدو مثاليًا. مظهرك المهني يعزز المعايير العالية للمركز.", rec: "درّب المعلمين الجدد على المعايير المهنية؛ ساهم في إرشادات قواعد اللباس في المركز؛ حافظ على هذا المعيار الممتاز." },
    },
    video: "The Impact of Teacher Presence (Teaching Channel)",
    website: "teachingchannel.com",
  },
  10: {
    weak: {
      en: { reason: "Frequent grammar or pronunciation errors; language model is unreliable for students.", feedback: "Accuracy matters. Students look to you as their primary English model – investing in your own language skills is essential.", rec: "Take a refresher grammar course; practise pronunciation with apps like ELSA Speak; prepare language points thoroughly before teaching." },
      ar: { reason: "أخطاء متكررة في القواعد أو النطق؛ نموذج اللغة غير موثوق للطلاب.", feedback: "الدقة مهمة. الطلاب ينظرون إليك كنموذجهم الأساسي للغة الإنجليزية – الاستثمار في مهاراتك اللغوية أمر أساسي.", rec: "خذ دورة تجديدية في القواعد؛ تدرب على النطق بتطبيقات مثل ELSA Speak؛ حضّر نقاط اللغة جيدًا قبل التدريس." },
    },
    developing: {
      en: { reason: "Occasional errors but generally comprehensible; some fossilised mistakes persist.", feedback: "Your English is solid. Polishing those last few rough edges will elevate your teaching significantly.", rec: "Keep a notebook of errors you notice; work with a language exchange partner; read extensively in English." },
      ar: { reason: "أخطاء عرضية لكنها مفهومة بشكل عام؛ بعض الأخطاء المتجذرة لا تزال موجودة.", feedback: "لغتك الإنجليزية قوية. صقل تلك الحواف الخشنة القليلة سيرفع تدريسك بشكل كبير.", rec: "احتفظ بدفتر للأخطاء التي تلاحظها؛ اعمل مع شريك تبادل لغوي؛ اقرأ على نطاق واسع باللغة الإنجليزية." },
    },
    strong: {
      en: { reason: "Language use is highly accurate; the teacher provides an excellent model of English for learners.", feedback: "Your English is a real asset. Students are lucky to have such a strong language model.", rec: "Now explore stylistic nuances and register; mentor colleagues on language accuracy; consider pursuing advanced qualifications." },
      ar: { reason: "استخدام اللغة دقيق للغائية؛ يقدم المعلم نموذجًا ممتازًا للغة الإنجليزية للمتعلمين.", feedback: "لغتك الإنجليزية رصيد حقيقي. الطلاب محظوظون بوجود مثل هذا النموذج اللغوي القوي.", rec: "استكشف الآن الفروق الأسلوبية والسجل اللغوي؛ درّب زملاءك على دقة اللغة؛ فكر في متابعة مؤهلات متقدمة." },
    },
    video: "Advanced Language Awareness for Teachers (International House)",
    website: "ihworld.com",
  },
  11: {
    weak: {
      en: { reason: "Objectives are not stated; students don't know what they're learning or why.", feedback: "Clear objectives are like a destination on a map. Share them and your students will follow with purpose.", rec: "Write a simple 'By the end of this lesson, you will...' statement; display it visibly; refer back to it at the end." },
      ar: { reason: "الأهداف غير مذكورة؛ الطلاب لا يعرفون ما يتعلمونه أو لماذا.", feedback: "الأهداف الواضحة مثل الوجهة على الخريطة. شاركها وسيتبعك طلابك بهدف.", rec: "اكتب عبارة بسيطة 'بنهاية هذا الدرس، ستكون قادرًا على...'؛ اعرضها بشكل مرئي؛ عد إليها في النهاية." },
    },
    developing: {
      en: { reason: "Objectives are sometimes stated but could be more specific and measurable.", feedback: "You're getting there. Sharper objectives will give your lessons a clearer sense of direction.", rec: "Use SMART criteria for objectives; post them on the board; have students self-assess against them at the end." },
      ar: { reason: "تذكر الأهداف أحيانًا لكنها قد تكون أكثر تحديدًا وقابلية للقياس.", feedback: "أنت تقترب. الأهداف الأكثر وضوحًا ستعطي دروسك إحساسًا أوضح بالاتجاه.", rec: "استخدم معايير SMART للأهداف؛ علقها على السبورة؛ اطلب من الطلاب تقييم أنفسهم مقابلها في النهاية." },
    },
    strong: {
      en: { reason: "Objectives are clearly stated, visible throughout the lesson, and revisited at the close.", feedback: "Perfect! Your students always know the goal – and they love hitting it.", rec: "Now involve students in setting personal objectives; create objective-based exit tickets; share your approach with the team." },
      ar: { reason: "الأهداف مذكورة بوضوح ومرئية طوال الدرس ويُعاد النظر فيها في الختام.", feedback: "مثالي! طلابك يعرفون دائمًا الهدف – ويحبون تحقيقه.", rec: "أشرك الطلاب الآن في وضع أهداف شخصية؛ أنشئ تذاكر خروج قائمة على الأهداف؛ شارك نهجك مع الفريق." },
    },
    video: "Student-Centred Objective Setting (Edutopia)",
    website: "edutopia.org",
  },
  12: {
    weak: {
      en: { reason: "Only a few students participate; the rest are passive or distracted.", feedback: "Every student deserves a voice. Simple participation structures can draw everyone in.", rec: "Use random name selectors; incorporate pair work before whole-class sharing; use mini-whiteboards for all-student responses." },
      ar: { reason: "عدد قليل فقط من الطلاب يشارك؛ البقية سلبيون أو مشتتون.", feedback: "كل طالب يستحق صوتًا. هياكل المشاركة البسيطة يمكن أن تجذب الجميع.", rec: "استخدم محددات الأسماء العشوائية؛ أدرج العمل الثنائي قبل المشاركة مع الفصل كله؛ استخدم سبورات صغيرة لاستجابات جميع الطلاب." },
    },
    developing: {
      en: { reason: "Many students participate but some still slip through the cracks.", feedback: "Good engagement overall. Now target those quiet corners of the room.", rec: "Track participation with a seating chart; use 'cold calling' gently and supportively; give thinking time before answers." },
      ar: { reason: "يشارك العديد من الطلاب لكن البعض لا يزالون يتسللون عبر الشقوق.", feedback: "مشاركة جيدة بشكل عام. استهدف الآن تلك الزوايا الهادئة من الغرفة.", rec: "تتبع المشاركة بمخطط جلوس؛ استخدم 'الاستدعاء البارد' بلطف ودعم؛ امنح وقتًا للتفكير قبل الإجابات." },
    },
    strong: {
      en: { reason: "All students are actively involved; participation is balanced and enthusiastic.", feedback: "Your classroom is fully inclusive. Every learner feels valued and heard.", rec: "Now try Socratic seminars; let students lead discussions; document your participation strategies for the centre." },
      ar: { reason: "جميع الطلاب مشاركون بنشاط؛ المشاركة متوازنة وحماسية.", feedback: "فصلك شامل بالكامل. كل متعلم يشعر بالتقدير والاستماع.", rec: "جرب الآن ندوات سقراطية؛ دع الطلاب يقودون المناقشات؛ وثق استراتيجيات المشاركة الخاصة بك للمركز." },
    },
    video: "Student-Led Discussions in ESL (Cambridge ELT)",
    website: "cambridgeenglish.org",
  },
  13: {
    weak: {
      en: { reason: "Students rarely use English spontaneously; they default to L1 whenever possible.", feedback: "Creating an English-speaking environment takes strategy. Small nudges can shift the habit.", rec: "Implement an 'English-only' zone with visual reminders; use praise when students attempt English; set short timed English-only challenges." },
      ar: { reason: "نادرًا ما يستخدم الطلاب الإنجليزية تلقائيًا؛ يعودون للغة الأم كلما أمكن.", feedback: "خلق بيئة ناطقة بالإنجليزية يحتاج استراتيجية. دفعات صغيرة يمكن أن تغير العادة.", rec: "طبق منطقة 'الإنجليزية فقط' مع تذكيرات بصرية؛ استخدم الثناء عندما يحاول الطلاب الإنجليزية؛ حدد تحديات قصيرة موقوتة باللغة الإنجليزية فقط." },
    },
    developing: {
      en: { reason: "Students use English for tasks but revert to L1 for social talk.", feedback: "Good progress. Now extend English use into the informal spaces of your classroom.", rec: "Model English during break times; create English conversation corners; reward consistent English use with a class point system." },
      ar: { reason: "يستخدم الطلاب الإنجليزية للمهام لكنهم يعودون للغة الأم في الحديث الاجتماعي.", feedback: "تقدم جيد. مدد الآن استخدام الإنجليزية إلى المساحات غير الرسمية في فصلك.", rec: "استخدم الإنجليزية كنموذج خلال أوقات الاستراحة؛ أنشئ زوايا محادثة بالإنجليزية؛ كافئ الاستخدام المتسق للإنجليزية بنظام نقاط للفصل." },
    },
    strong: {
      en: { reason: "Students confidently use English for both academic and social purposes in class.", feedback: "Fantastic! Your classroom is a true English immersion environment.", rec: "Now challenge students with debates and presentations; invite English-speaking guests; celebrate this achievement publicly." },
      ar: { reason: "يستخدم الطلاب الإنجليزية بثقة للأغراض الأكاديمية والاجتماعية في الفصل.", feedback: "رائع! فصلك بيئة انغماس حقيقية في اللغة الإنجليزية.", rec: "تحدَّ الطلاب الآن بالمناظرات والعروض التقديمية؛ ادعُ ضيوفًا ناطقين بالإنجليزية؛ احتفل بهذا الإنجاز علنًا." },
    },
    video: "Creating an Immersive English Environment (Cambridge ELT)",
    website: "cambridgeenglish.org",
  },
  14: {
    weak: {
      en: { reason: "Teacher dominates talk time; students have few opportunities to speak.", feedback: "The person doing the talking is doing the learning. Shift the balance and watch your students flourish.", rec: "Aim for a 30:70 TTT-STT ratio; use pair work extensively; time your own talking and set a limit." },
      ar: { reason: "يسيطر المعلم على وقت التحدث؛ لدى الطلاب فرص قليلة للتحدث.", feedback: "الشخص الذي يتحدث هو الذي يتعلم. انقل التوازن وشاهد طلابك يزدهرون.", rec: "استهدف نسبة ٣٠:٧٠ لوقت تحدث المعلم مقابل الطلاب؛ استخدم العمل الثنائي على نطاق واسع؛ وقت تحدثك الخاص وضع حدًا." },
    },
    developing: {
      en: { reason: "Student talk time is decent but could be further maximised with better task design.", feedback: "You're sharing the floor. With even more student-centred activities, the learning will deepen.", rec: "Use 'think-pair-share' routinely; let students explain concepts to each other; minimise echo talk (repeating students' answers)." },
      ar: { reason: "وقت تحدث الطلاب جيد لكنه يمكن أن يزيد مع تصميم مهام أفضل.", feedback: "أنت تشارك المساحة. مع المزيد من الأنشطة المتمركزة حول الطالب، سيتعمق التعلم.", rec: "استخدم 'فكر-شارك-زوج' بشكل روتيني؛ دع الطلاب يشرحون المفاهيم لبعضهم البعض؛ قلل من حديث الصدى (تكرار إجابات الطلاب)." },
    },
    strong: {
      en: { reason: "Students do most of the talking; the teacher facilitates rather than lectures.", feedback: "Your classroom hums with student voices. This is communicative teaching at its best.", rec: "Now experiment with completely student-led lessons; record a lesson and analyse the talk time ratio; present your findings at a conference." },
      ar: { reason: "يقوم الطلاب بمعظم الحديث؛ المعلم ييسر بدلاً من إلقاء المحاضرات.", feedback: "فصلك يعج بأصوات الطلاب. هذا هو التدريس التواصلي في أفضل حالاته.", rec: "جرب الآن دروسًا يقودها الطلاب بالكامل؛ سجل درسًا وحلل نسبة وقت التحدث؛ اعرض نتائجك في مؤتمر." },
    },
    video: "The Silent Teacher: Facilitating Student Talk (Teaching Channel)",
    website: "teachingchannel.com",
  },
  15: {
    weak: {
      en: { reason: "Teacher appears impatient or dismissive; encouragement is rare; mistakes are met with criticism.", feedback: "A teacher's warmth is remembered long after the lesson. Patience and encouragement are your superpowers.", rec: "Count your positive vs. negative comments in a lesson; aim for 5:1 praise-to-correction ratio; smile and use students' names warmly." },
      ar: { reason: "يبدو المعلم غير صبور أو متجاهلاً؛ التشجيع نادر؛ الأخطاء تقابل بالنقد.", feedback: "دفء المعلم يُذكر طويلاً بعد الدرس. الصبر والتشجيع هما قواك الخارقة.", rec: "عد تعليقاتك الإيجابية مقابل السلبية في الدرس؛ استهدف نسبة ٥:١ للمديح مقابل التصحيح؛ ابتسم واستخدم أسماء الطلاب بدفء." },
    },
    developing: {
      en: { reason: "Teacher is generally kind but can show frustration during challenging moments.", feedback: "Your warmth is evident. Maintaining composure under pressure is the hallmark of a master teacher.", rec: "Practise deep breathing when frustrated; have a calm-down phrase ready ('Let's take a moment'); reflect after tough lessons." },
      ar: { reason: "المعلم لطيف بشكل عام لكنه قد يظهر إحباطًا خلال اللحظات الصعبة.", feedback: "دفؤك واضح. الحفاظ على رباطة الجأش تحت الضغط هو سمة المعلم المتمكن.", rec: "تدرب على التنفس العميق عند الإحباط؛ جهّز عبارة تهدئة ('لنأخذ لحظة')؛ تأمل بعد الدروس الصعبة." },
    },
    strong: {
      en: { reason: "Teacher is consistently patient, encouraging, and creates a psychologically safe space for all learners.", feedback: "Your temperament is a gift. Students bloom under your kind, steady presence.", rec: "Mentor others on building rapport; write about your approach for the centre blog; continue being the wonderful teacher you are." },
      ar: { reason: "المعلم صبور باستمرار ومشجع ويخلق مساحة آمنة نفسيًا لجميع المتعلمين.", feedback: "طبعك هدية. يزدهر الطلاب تحت حضورك اللطيف والثابت.", rec: "درّب الآخرين على بناء العلاقات؛ اكتب عن نهجك لمدونة المركز؛ استمر في كونك المعلم الرائع الذي أنت عليه." },
    },
    video: "Building Psychological Safety in Classrooms (Teaching Channel)",
    website: "teachingchannel.com",
  },
};
