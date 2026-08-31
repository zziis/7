/**
 * ZILZAL PLATFORM - AI CHATBOT ENGINE (ZILZAL AI)
 */

class ZilzalAIEngine {
  constructor() {
    this.messages = [];
    this.isTyping = false;
    this.speechEnabled = true;
    this.setupKnowledgeBase();
  }

  setupKnowledgeBase() {
    this.knowledge = [
      {
        keywords: ["مرحبا", "سلام", "هلا", "اهلين", "صباح", "مساء", "مين انت", "من انت", "تعريف"],
        response: "أهلاً بك! أنا **Zilzal AI** 🤖 المساعد الذكي الرسمي لمنصة **ZILZAL**.\n\nأنا هنا لمساعدتك في كل ما يخص المنصة، البرمجة، اقتراح الأفلام والألعاب، روابط تطبيقات APK، وشرح التقنيات الحديثة. كيف يمكنني خدمتك اليوم؟ ✨"
      },
      {
        keywords: ["منصة", "زلزال", "zilzal", "عن المنصة", "ميزات", "مميزات", "موقع"],
        response: "⚡ **منصة ZILZAL** هي منصة ترفيهية وتقنية مستقبلية متكاملة تقدم لك:\n\n1. 📢 **شريط إعلانات متحرك** وعواجل لحظية.\n2. 🔗 **روابط سريعة لحساباتنا** (تليجرام، انستغرام، فيسبوك، تيك توك).\n3. 💬 **رومات خاصة** للدردشة التفاعلية والمجتمع.\n4. 🎮 **ألعاب مدمجة** للعب الفوري وسحق السكورات.\n5. 📺 **أفلام ومسلسلات** بتصنيفات سينمائية وتفاصيل كاملة.\n6. 📱 **متجر تطبيقات APK** محدثة ومعدلة وآمنة.\n7. 🌐 **نظام قابل للرفع المباشر** على GitHub."
      },
      {
        keywords: ["تلي", "تليجرام", "قناة", "تلغرام", "انستا", "انستغرام", "فيس", "فيسبوك", "تيك توك", "حسابات", "حساباتي"],
        response: "📲 يمكنك الوصول المباشر إلى جميع حساباتنا الرسمية من الشريط العلوي تحت اسم المنصة:\n\n• 📢 **قناة تليجرام:** @ZilzalHub (+125K عضو)\n• 📸 **انستغرام:** @Zilzal.Official\n• 👥 **فيسبوك:** Zilzal Tech & Media\n• 🎵 **تيك توك:** @Zilzal.Live\n\nاضغط على أيقونة الحساب لفتحه فوراً أو نسخ المعرف!"
      },
      {
        keywords: ["كود", "برمجة", "جافاسكربت", "javascript", "html", "css", "بايثون", "python"],
        response: "💻 إليك نموذج كود JavaScript حديث ومطور لإنشاء شريط إعلانات متحرك وتأثير نيون:\n\n```javascript\n// ZILZAL Modern Ticker Controller\nfunction initNeonTicker(elementId, speed = 30) {\n  const ticker = document.getElementById(elementId);\n  ticker.style.animation = `tickerLTR ${speed}s linear infinite`;\n  ticker.addEventListener('mouseenter', () => {\n    ticker.style.animationPlayState = 'paused';\n  });\n  ticker.addEventListener('mouseleave', () => {\n    ticker.style.animationPlayState = 'running';\n  });\n  console.log('⚡ Zilzal Ticker Initialized');\n}\n```\n\nهل تود كوداً لشيء مخصص آخر؟"
      },
      {
        keywords: ["فيلم", "افلام", "سينما", "مسلسل", "مسلسلات", "اكشن", "خيال"],
        response: "🎬 **ترشيحات السينما والمسلسلات في ZILZAL:**\n\n1. 🌟 **Cyber City 2099 (4K HDR)**: خيال علمي سايبورغ رائع.\n2. 🔥 **The Seismic Protocol**: أكشن وإثارة جيولوجية ملحمية.\n3. 📺 **سجلات السايبر (Cyber Chronicles)**: 3 مواسم كاملة من صراع الهاكرز والذكاء الاصطناعي.\n\nتفضل بزيارة قسم **الأفلام** أو **المسلسلات** من القائمة الجانبية للتفاصيل!"
      },
      {
        keywords: ["apk", "تطبيق", "تطبيقات", "برنامج", "تنزيل", "تحميل", "العاب مهكرة"],
        response: "📱 **أبرز تطبيقات APK المتاحة الآن في متجر ZILZAL:**\n\n• 🛠️ **Zilzal Super Tools Pro**: صيانة النظام وتسريع الهاتف.\n• 🎬 **Cinema Zilzal HD Plus**: أفلام ومسلسلات بدون إعلانات VIP.\n• ⚡ **Cyber Game Booster**: قفل الفريمات على 120 FPS وخفض البينغ.\n• 🛡️ **Zilzal VPN Cyber Shield**: خوادم سريعة وتشفير عالي.\n\nيمكنك تحميلها مباشرة بضغطة زر من قسم **تطبيقات APK**!"
      },
      {
        keywords: ["لعبة", "العاب", "فضاء", "2048", "game", "games"],
        response: "🎮 جهزنا لك ألعاباً ممتعة مدمجة في المنصة:\n\n1. 🚀 **سفينة الفضاء (Zilzal Space Defender)**: أطلق الليزر وحطم الكويكبات!\n2. 🔢 **Zilzal 2048 Neon**: ادمج الأرقام للوصول إلى رقم 2048 الأسطوري.\n3. ❌ **Tic-Tac-Toe AI (إكس أو)**: تحدَّ الذكاء الاصطناعي بنمط النيون.\n\nانقر على زر **الألعاب** في القائمة الجانبية وابدأ اللعب فوراً!"
      },
      {
        keywords: ["github", "جيت هاب", "رفع", "نشر", "مستودع"],
        response: "🐙 **مشروع المنصة جاهز للرفع على GitHub بنسبة 100%!**\n\nالخطوات السريعة للرفع:\n```bash\ngit init\ngit add .\ngit commit -m 'Initial commit - Zilzal Modern Platform'\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/zilzal-platform.git\ngit push -u origin main\n```\nكما قمنا بإعداد ملف `.github/workflows/deploy.yml` للنشر التلقائي والمجاني عبر **GitHub Pages**!"
      }
    ];
  }

  findStoredResponse(userQuery) {
    const q = userQuery.toLowerCase().trim();
    for (const item of this.knowledge) if (item.keywords.some(k => q.includes(k))) return item.response;
    return null;
  }

  generateResponse(userQuery) {
    const q = userQuery.toLowerCase().trim();
    for (const item of this.knowledge) {
      if (item.keywords.some(k => q.includes(k))) {
        return item.response;
      }
    }

    // Default intelligent dynamic answer
    return `شكراً لسؤالك! ⚡ بخصوص "${userQuery}":\n\nأنا أواصل التعلم وتحديث قاعدة بياناتي باستمرار. يمكنك استكشاف جميع أقسام منصة **ZILZAL** من القائمة الجانبية (الألعاب، الرومات، الأفلام، التطبيقات، والإعدادات)، أو تجربة أحد الاقتراحات السريعة بالأسفل! ✨`;
  }

  speak(text) {
    if (!this.speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Clean text for speech
    const cleanText = text.replace(/[*#`_~\[\]()]/g, '').replace(/https?:\/\/\S+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
}

// Global instance
window.zilzalAI = new ZilzalAIEngine();
