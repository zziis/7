/**
 * ZILZAL PLATFORM - MEDIA & CONFIGURATION DATA
 */

const ZILZAL_DATA = {
  // Social accounts configuration
  socials: [
    {
      id: "tg",
      name: "قناة التليجرام",
      handle: "@ZilzalHub",
      followers: "+125K عضو",
      icon: "fab fa-telegram",
      color: "#229ED9",
      url: "https://t.me/ZilzalHub",
      desc: "التحديثات الحصرية، الأكواد، والعروض اليومية"
    },
    {
      id: "ig",
      name: "انستغرام",
      handle: "@Zilzal.Official",
      followers: "+84K متابع",
      icon: "fab fa-instagram",
      color: "#E1306C",
      url: "https://instagram.com",
      desc: "يوميات، ستوريات تقنية، وتغطيات مباشرة"
    },
    {
      id: "fb",
      name: "صفحة فيسبوك",
      handle: "Zilzal Tech & Media",
      followers: "+210K معجب",
      icon: "fab fa-facebook-f",
      color: "#1877F2",
      url: "https://facebook.com",
      desc: "المجتمع الرسمي والمناقشات والمنشورات"
    },
    {
      id: "tt",
      name: "تيك توك",
      handle: "@Zilzal.Live",
      followers: "+340K متابع",
      icon: "fab fa-tiktok",
      color: "#00f2fe",
      url: "https://tiktok.com",
      desc: "فيديوهات قصيرة وشروحات سريعة وترندات"
    }
  ],

  // Top moving ads ticker items (Moving Left to Right)
  tickerAds: [
    { tag: "🔥 حصري", text: "أهلاً بكم في منصة ZILZAL الرسمية - بوابتكم إلى الترفيه والتقنية المستقبلية!" },
    { tag: "🤖 ذكاء اصطناعي", text: "تم تفعيل بوت ZILZAL AI الجديد كلياً - اطلب أكواد، أسئلة، وتحليلات فورية!" },
    { tag: "📱 تطبيقات APK", text: "تحديثات أسبوعية لأقوى التطبيقات والألعاب المعدلة بروابط مباشرة وسريعة وآمنة 100%." },
    { tag: "🎮 ألعاب نيون", text: "تحدَّ أصدقاءك في لعبة سفينة الفضاء وزلزال 2048 وسجل أعلى سكور!" },
    { tag: "🎬 سينما وسلسلات", text: "إضافة أحدث حلقات الموسم الجديد والأفلام السينمائية بجودة 4K فائقة الوضوح." },
    { tag: "💬 رومات خاصة", text: "انضم الآن إلى رومات الشات والدردشة الحية وتفاعل مع مجتمع زلزال." }
  ],

  // Movies Catalog
  movies: [
    {
      id: "m1",
      title: "Cyber City 2099",
      arabicTitle: "مدينة السايبر 2099",
      category: "خيال علمي",
      rating: "9.4",
      year: "2026",
      duration: "2h 15m",
      image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
      description: "في عالم مستقبلي يعج بالذكاء الاصطناعي والسايبورغ، يخوض بطل خارق معركة البقاء لاسترجاع المدينة الرقمية من سيطرة الأنظمة المستبدة.",
      quality: "4K HDR",
      views: "1.2M",
      director: "Alex Vance"
    },
    {
      id: "m2",
      title: "The Seismic Protocol",
      arabicTitle: "بروتوكول الزلزال",
      category: "أكشن / إثارة",
      rating: "8.9",
      year: "2025",
      duration: "1h 58m",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
      description: "فريق نخبة من المغامرين يتصدى لمؤامرة جيولوجية تهدد بحدوث زلازل كهرومغناطيسية مدمرة تعطل مدن العالم الكبرى.",
      quality: "UHD 1080p",
      views: "890K",
      director: "Marcus Wright"
    },
    {
      id: "m3",
      title: "Shadows in the Neon",
      arabicTitle: "ظلال في النيون",
      category: "غموض / جريمة",
      rating: "8.7",
      year: "2026",
      duration: "2h 05m",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
      description: "محقق غامض يطارد أشباح شبكة الإنترنت المظلمة بعد اختفاء أكبر علماء التشفير في طوكيو المستقبلية.",
      quality: "4K HDR",
      views: "640K",
      director: "Kenji Sato"
    },
    {
      id: "m4",
      title: "Galactic Horizon",
      arabicTitle: "أفق المجرة",
      category: "فضاء ومغامرات",
      rating: "9.1",
      year: "2025",
      duration: "2h 30m",
      image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
      description: "رحلة ملحمية لسفينة الفضاء زلزال عبر الثقوب الدودية للبحث عن موطن بشري جديد في أقاصي الكون.",
      quality: "IMAX 4K",
      views: "2.1M",
      director: "Elena Rostova"
    }
  ],

  // TV Series Catalog
  series: [
    {
      id: "s1",
      title: "Cyber Chronicles",
      arabicTitle: "سجلات السايبر",
      seasons: "3 مواسم",
      episodes: "24 حلقة",
      category: "خيال علمي / تشويق",
      rating: "9.6",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
      description: "صراع محموم بين نقابات الهاكرز والشركات العالمية الكبرى في سبيل السيطرة على العقل الاصطناعي المركزي.",
      status: "مستمر (الموسم 3 متوفر)"
    },
    {
      id: "s2",
      title: "Zilzal: Underground",
      arabicTitle: "زلزال: تحت الأرض",
      seasons: "2 موسم",
      episodes: "16 حلقة",
      category: "أكشن / دراما",
      rating: "9.2",
      image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
      description: "مجموعات سرية تقود ثورة رقمية وفكرية تحت أنقاض المدن الكبرى لإعادة الحرية للشبكات.",
      status: "مكتمل"
    },
    {
      id: "s3",
      title: "The Neural Nexus",
      arabicTitle: "العقدة العصبية",
      seasons: "1 موسم",
      episodes: "10 حلقات",
      category: "ذكاء اصطناعي",
      rating: "8.8",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      description: "تجربة علمية لربط الذاكرة البشرية بالسحابة الرقمية تؤدي إلى كشف أسرار كونية غامضة.",
      status: "جديد 2026"
    }
  ],

  // APK Store Applications - managed by developer
  apkList: [],

  // Private Chat Rooms
  rooms: [
    {
      id: "general",
      name: "الروم العام (General Lounge)",
      icon: "fa-solid fa-globe",
      color: "#00f0ff",
      activeUsers: 84,
      desc: "النقاشات العامة والترحيب بالأعضاء الجدد والفعاليات",
      initialMessages: [
        { user: "المشرف زلزال", avatar: "👑", time: "14:20", text: "أهلاً بجميع الأعضاء الجدد في مجتمع ZILZAL!", isMod: true },
        { user: "سعد التميمي", avatar: "🚀", time: "14:22", text: "منصة رائعة وتصميم النيون خرافي جداً 🔥" },
        { user: "سارة الكيبر", avatar: "⚡", time: "14:25", text: "جربت بوت الذكاء الاصطناعي وسريع جداً بالردود البرمجية!" }
      ]
    },
    {
      id: "gaming",
      name: "روم الجيمرز والبطولات 🎮",
      icon: "fa-solid fa-gamepad",
      color: "#b026ff",
      activeUsers: 42,
      desc: "تحديات الألعاب، بطولات السيرفر، ومشاركة السكورات",
      initialMessages: [
        { user: "CyberGamer_99", avatar: "👾", time: "15:02", text: "مين يوصل سكور 5000 في لعبة Zilzal Space Shooter؟" },
        { user: "نواف الحربي", avatar: "🏆", time: "15:05", text: "أنا جبت 4200 بصعوبة، اللعبة إدمانية!" }
      ]
    },
    {
      id: "vip",
      name: "روم VIP والمطورين ⚡",
      icon: "fa-solid fa-code",
      color: "#ff007f",
      activeUsers: 29,
      desc: "أحدث الأكواد والتطوير والميزات التجريبية المبكرة",
      initialMessages: [
        { user: "Dev_Samir", avatar: "💻", time: "16:00", text: "تم تجهيز المستودع للنشر المباشر على GitHub بنجاح.", isMod: true },
        { user: "TechMaster", avatar: "🛡️", time: "16:10", text: "التكامل مع API وتحديثات الـ APK شغالة 100%." }
      ]
    }
  ]
};
