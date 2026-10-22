// Judge-style questions for "اسأل AVYRA", used by deck-check.mjs (check T6).
// Each pair: [question, expected entry]. The expected entry is named by a key of KEYS (a unique
// piece of that entry's question); "a|b" accepts either; "null" = must answer "out of scope".
// A: rephrasings of the deck's own questions · B: four questions that used to get the wrong
// answer · C, D, E: further sets, each written before the matcher was changed to fit it.
const KEYS = { what:'ما هو AVYRA', prob:'المشكلة', cost:'تأخّر القرار', how:'كيف يعمل', dec:'القرار النهائي', logic:'صندوق أسود', bias:'بالفريق المحلي', time:'يوفّر', mkt:'حجم السوق', cust:'عملاؤكم', rev:'تربحون', costs:'هيكل التكاليف', adv:'المنافسين', gulf:'الخليج وعُمان', val:'الدليل', wrong:'خاطئة', real:'حقيقية؟', road:'خارطة', tech:'التقنيات', sec:'تحمون', part:'شركاؤكم', chan:'تصلون', team:'الفريق؟', fund:'تمويل', fin:'المالية', term:'MRO و AOG', pilot:'عميل حقيقي' };
const A = [
  ['من هم أعضاء الفريق؟','team'],['من الفريق','team'],['who is on the team','team'],['كم المبلغ المطلوب؟','fund'],['how much funding do you need','fund'],
  ['كيف تكسبون المال؟','rev'],['ما نموذج الإيرادات','rev'],['من المنافسون؟','adv'],['what is your competitive advantage','adv'],['هل البيانات حقيقية؟','real'],
  ['is the demo real','real'],['ما حجم السوق المستهدف؟','mkt'],['what is the market size','mkt'],['هل يتخذ النظام القرار بدلاً من المهندس؟','dec'],['كم تكلفة توقف الطائرة؟','cost'],
  ['ما معنى AOG','term'],['ما هي خطتكم القادمة','road'],['هل النظام منحاز للفريق المحلي؟','bias'],['ما التوقعات المالية للسنوات الثلاث؟','fin'],
];
const B = [['من هم منافسوكم؟','adv'],['ما حجم التمويل؟','fund'],['ماذا يحدث إذا أخطأ النظام؟','wrong'],['هل جربتم مع عميل حقيقي؟','pilot|real']];
const C = [
  ['ما هي فكرة المشروع؟','what'],['عرّفنا على AVYRA','what'],['ما هي المشكلة؟','prob'],['لماذا يستغرق القرار وقتاً طويلاً؟','prob|time'],
  ['كم تخسر شركة الطيران عندما تتوقف الطائرة؟','cost'],['what does an AOG hour cost','cost'],['ما هي الوكلاء الستة؟','how'],['هل يمكن للمهندس رفض التوصية؟','dec|wrong'],
  ['هل النظام يتخذ القرار تلقائياً؟','dec'],['كيف تحسبون درجة الثقة؟','logic'],['هل تستخدمون Claude؟','logic|tech'],['كم دقيقة يحتاج للتوصية؟','time'],
  ['how fast is it','time'],['ما هو السوق المستهدف؟','mkt|cust'],['what is your TAM','mkt'],['من هم المستخدمون؟','cust'],['من سيدفع لكم؟','cust|rev'],
  ['ما هو نموذج التسعير؟','rev'],['how do you make money','rev'],['ما هي تكاليفكم؟','costs'],['من هم منافسوكم الرئيسيون؟','adv'],['لماذا عمان تحديداً؟','gulf'],
  ['هل قابلتم عملاء؟','val'],['هل لديكم عميل حتى الآن؟','pilot|real'],['ما مدى دقة التوصيات؟','wrong'],['هل البيانات في العرض الحي حقيقية؟','real'],
  ['ما هي خطتكم للسنتين القادمتين؟','road'],['متى ستطلقون المنتج؟','road'],['ما الأنظمة التي تتكاملون معها؟','tech'],['هل البيانات آمنة؟','sec'],
  ['هل تعتمدون على سحابة محلية؟','sec|part'],['من هم شركاؤكم في التنفيذ؟','part'],['كيف ستسوقون المنتج؟','chan'],['من المؤسسون؟','team'],['ما خلفية الفريق؟','team'],
  ['كم المبلغ الذي تحتاجونه؟','fund'],['how will you use the money','fund'],['ما الإيرادات المتوقعة بعد ثلاث سنوات؟','fin'],['ما الفرق بين MRO و AOG','term'],
  ['what is the weather today','null'],['ما رأيك في كرة القدم؟','null'],['كم عدد موظفيكم؟','null|team'],
];
const D = [
  ['شنو فكرة المشروع؟','what'],['وش المشكلة اللي تحلونها؟','prob'],['ليش القرار ياخذ يومين؟','prob|time'],['كم خسارة الطائرة المتوقفة في الساعة؟','cost'],
  ['كم وكيل في النظام؟','how'],['هل الذكاء الاصطناعي يقرر بدل المهندس؟','dec'],['كيف نثق في التوصية؟','logic|wrong'],['how is the confidence score calculated','logic'],
  ['does it always pick the local team','bias'],['كم الوقت الذي توفرونه؟','time'],['ما حجم الفرصة السوقية؟','mkt'],['what is the serviceable market','mkt'],
  ['من العميل المستهدف؟','cust'],['كم سعر الاشتراك؟','rev'],['what are your costs','costs'],['من ينافسكم؟','adv'],['why the gulf','gulf'],
  ['هل عندكم دليل على الطلب؟','val'],['what if the recommendation is wrong','wrong'],['are these real numbers','real'],['what are the next milestones','road'],
  ['هل تستخدمون n8n؟','tech'],['how do you handle data security','sec'],['who are your partners','part'],['how will you reach customers','chan'],
  ['who are the founders','team'],['كم تحتاجون من المال؟','fund'],['what revenue do you expect in year 3','fin|rev'],['what does MRO stand for','term'],
  ['هل جربتم المنتج في شركة طيران؟','pilot|real'],['كيف حال الطقس؟','null'],['من فاز بالمباراة أمس؟','null'],
];
const E = [
  ['ما الذي يقدمه AVYRA لمهندس الصيانة؟','what|how'],['لماذا القرار اليدوي مشكلة؟','prob'],['كم دولار تخسر الشركة في ساعة AOG؟','cost'],['اشرح لي خطوات عمل الوكلاء','how'],
  ['من يوافق على التوصية؟','dec'],['هل يمكن تفسير التوصية؟','logic'],['هل تفضلون المتعاقد أحياناً؟','bias'],['كم ثانية تستغرق التوصية؟','time'],
  ['كم يبلغ السوق العالمي لصيانة الطائرات؟','mkt'],['ما هي شركات الطيران المستهدفة؟','cust'],['هل لديكم رسوم تكامل؟','rev'],['ما أكبر مصاريفكم؟','costs'],
  ['ما الذي يجعلكم مختلفين؟','adv'],['لماذا تبدؤون من عمان؟','gulf'],['هل تحدثتم مع مدراء صيانة؟','val'],['من المسؤول إذا كانت التوصية خاطئة؟','wrong|dec'],
  ['is the demo using real airline data','real|pilot'],['what happens in the next 6 months','road'],['what technology do you use','tech'],['أين تُخزن البيانات؟','sec'],
  ['هل لديكم شراكة مع موردي القطع؟','part'],['كيف ستبيعون المنتج؟','chan'],['ما دور فيصل في الفريق؟','team'],['ما نسبة الملكية المعروضة؟','fund'],
  ['ما الإيراد المتوقع في السنة الأولى؟','fin'],['what is AOG','term'],['هل لديكم عملاء يدفعون الآن؟','pilot|real|cust'],['ما عاصمة فرنسا؟','null'],
];
export const SETS = { A, B, C, D, E };
export { KEYS };
