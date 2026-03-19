import React from 'react';
import { 
  Home, 
  LayoutGrid, 
  PlusCircle, 
  Compass, 
  User,
  Search,
  Bell,
  Heart,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Download,
  RefreshCw,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  History,
  CreditCard,
  Settings,
  HelpCircle,
  MessageCircle,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Tab = 'home' | 'workbench' | 'generate' | 'fengshui' | 'profile';

interface Product {
  id: string;
  title: string;
  image: string;
  rating?: number;
  price?: string;
  tag?: string;
}

// --- Mock Data ---
const RECOMMENDATIONS: Product[] = [
  { id: '1', title: '现代简约客厅', image: 'https://picsum.photos/seed/living1/600/800', rating: 4.9 },
  { id: '2', title: '北欧原木卧室', image: 'https://picsum.photos/seed/bedroom1/600/700', rating: 4.8 },
  { id: '3', title: '极简主义书房', image: 'https://picsum.photos/seed/study1/600/900', rating: 5.0 },
  { id: '4', title: '侘寂风餐厅', image: 'https://picsum.photos/seed/dining1/600/750', rating: 4.7 },
];

const WORKBENCH_TOOLS = [
  { id: 'rough', title: '毛坯精装', desc: '毛坯房一键变精装', image: 'https://picsum.photos/seed/rough_case/800/400', tag: '热门', color: 'bg-orange-500' },
  { id: 'furniture', title: '家具植入', desc: '在场景中添加家具', image: 'https://picsum.photos/seed/furniture_case/800/400', tag: '高效', color: 'bg-blue-500' },
  { id: 'style', title: '风格迁移', desc: '变换房间装修风格', image: 'https://picsum.photos/seed/style_case/800/400', tag: '创意', color: 'bg-purple-500' },
  { id: 'fengshui', title: '风水检测', desc: 'AI深度解析房间风水', image: 'https://picsum.photos/seed/fengshui_case/800/400', tag: '专业', color: 'bg-emerald-500' },
  { id: 'render', title: '光照渲染', desc: '极致光影效果增强', image: 'https://picsum.photos/seed/render_case/800/400', tag: '画质', color: 'bg-rose-500' },
];

const ACTIVITIES = [
  { id: '1', title: '疯狂动物城主题装修', desc: '探索奇幻森林风格的家', image: 'https://picsum.photos/seed/theme1/800/400' },
  { id: '2', title: '曼妙主题装修', desc: '法式复古与现代简约的碰撞', image: 'https://picsum.photos/seed/theme2/800/400' },
  { id: '3', title: '极简原木生活', desc: '回归自然的纯粹体验', image: 'https://picsum.photos/seed/theme3/800/400' },
];

const MY_WORKS = [
  { id: 'w1', image: 'https://picsum.photos/seed/work1/400/500', title: '现代客厅' },
  { id: 'w2', image: 'https://picsum.photos/seed/work2/400/500', title: '北欧卧室' },
  { id: 'w3', image: 'https://picsum.photos/seed/work3/400/500', title: '工业风书房' },
  { id: 'w4', image: 'https://picsum.photos/seed/work4/400/500', title: '日式餐厅' },
  { id: 'w5', image: 'https://picsum.photos/seed/work5/400/500', title: '极简玄关' },
];

const FENGSHUI_RECORDS = [
  { id: 'r1', date: '2024-03-16', score: 88, image: 'https://picsum.photos/seed/fs1/400/300', status: '上吉' },
  { id: 'r2', date: '2024-03-14', score: 72, image: 'https://picsum.photos/seed/fs2/400/300', status: '中平' },
  { id: 'r3', date: '2024-03-10', score: 92, image: 'https://picsum.photos/seed/fs3/400/300', status: '大吉' },
];

// --- Components ---

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (t: Tab) => void }) => {
  const tabs: { id: Tab, label: string, icon: React.ReactNode }[] = [
    { id: 'home', label: '首页', icon: <Home size={20} /> },
    { id: 'workbench', label: '工作台', icon: <LayoutGrid size={20} /> },
    { id: 'generate', label: '生图', icon: <PlusCircle size={20} /> },
    { id: 'fengshui', label: '风水', icon: <Compass size={20} /> },
    { id: 'profile', label: '我的', icon: <User size={20} /> },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-[375px] left-1/2 -translate-x-1/2 bg-white border-t border-black/5 h-[60px] flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex flex-col items-center justify-center w-16 h-full"
          >
            {isActive && (
              <motion.div
                layoutId="nav-active-indicator"
                className="absolute -top-6 w-14 h-14 bg-wood rounded-full border-[6px] border-[#F7F7F7] shadow-lg shadow-wood/20 flex items-center justify-center"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <div className="text-white">
                  {tab.icon}
                </div>
              </motion.div>
            )}
            
            <div className={`transition-all duration-300 ${isActive ? 'opacity-0 -translate-y-4' : 'opacity-100 text-gray-400'}`}>
              {tab.icon}
            </div>
            
            <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive ? 'text-wood translate-y-2' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

const Header = ({ title }: { title: string }) => (
  <header className="sticky top-0 bg-[#F7F7F7]/80 backdrop-blur-md z-40 px-6 h-[44px] flex items-center justify-between border-b border-black/5">
    <h1 className="text-base font-bold tracking-tight">{title}</h1>
    <div className="flex items-center gap-4">
      <Bell size={18} className="text-gray-600" />
    </div>
  </header>
);

const ProductCard = ({ product }: { product: Product, key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 mb-4 group"
  >
    <div className="relative aspect-[3/4] overflow-hidden">
      <img 
        src={product.image} 
        alt={product.title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <button className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
        <Heart size={16} />
      </button>
    </div>
    <div className="p-4 flex justify-between items-center">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{product.title}</h3>
        {product.rating && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-gray-400 font-medium">评分 {product.rating}</span>
          </div>
        )}
      </div>
      <button className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
        <ChevronRight size={16} />
      </button>
    </div>
  </motion.div>
);

// --- Page Views ---

const HomePage = () => {
  const [activeActivity, setActiveActivity] = React.useState(0);

  return (
    <div className="pb-[80px]">
      <Header title="暖界AI" />
      <main>
        {/* Carousel Section */}
        <section className="mb-8">
          <div className="relative h-48 overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeActivity}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <img 
                  src={ACTIVITIES[activeActivity].image} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 pb-10">
                  <h3 className="text-white font-bold text-xl">{ACTIVITIES[activeActivity].title}</h3>
                  <p className="text-white/80 text-xs mt-1">{ACTIVITIES[activeActivity].desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {ACTIVITIES.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveActivity(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${activeActivity === i ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Feed Section */}
        <section className="px-6 mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold">推荐灵感</h2>
            <span className="text-xs text-gray-400 font-medium">查看更多</span>
          </div>
          <div className="columns-2 gap-4">
            {RECOMMENDATIONS.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </main>
    </div>
  );
};

const WorkbenchPage = ({ onToolSelect }: { onToolSelect: (id: string) => void }) => (
  <div className="pb-[80px]">
    <Header title="工作台" />
    <main className="px-6">
      <div className="grid grid-cols-1 gap-5">
        {WORKBENCH_TOOLS.map((tool) => (
          <button 
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className="relative aspect-[16/7] rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-all text-left group border border-black/5"
          >
            <img 
              src={tool.image} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              referrerPolicy="no-referrer" 
            />
            {/* Overlay with better gradient and glass effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent flex flex-col justify-center p-6">
              <h3 className="text-white font-bold text-xl tracking-tight">{tool.title}</h3>
              <p className="text-white/60 text-xs mt-1 max-w-[65%] leading-relaxed">{tool.desc}</p>
              
              <div className="absolute right-6 bottom-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </main>
  </div>
);

const GENERATE_MODES = [
  { id: 'inspiration', label: '灵感生图' },
  { id: 'text-to-image', label: '文生图' },
  { id: 'image-to-image', label: '图生图' },
  { id: 'furniture', label: '家具植入' },
  { id: 'style', label: '风格迁移' },
  { id: 'render', label: '光照渲染' },
];

const GeneratePage = () => {
  const [messages, setMessages] = React.useState<{ id: string, type: 'user' | 'ai', content: string, image?: string }[]>([
    { id: '1', type: 'ai', content: '您好！我是您的AI设计助手。请上传房间照片并输入您的设计需求，我将为您生成精美的装修效果图。' }
  ]);
  const [inputValue, setInputValue] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [currentMode, setCurrentMode] = React.useState(GENERATE_MODES[0]);
  const [isModePickerOpen, setIsModePickerOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = { id: Date.now().toString(), type: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsGenerating(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg = { 
        id: (Date.now() + 1).toString(), 
        type: 'ai' as const, 
        content: `已为您使用【${currentMode.label}】模式生成了以下设计方案：`,
        image: `https://picsum.photos/seed/gen${Date.now()}/800/1200`
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F7F7F7]">
      <Header title="AI 生图" />
      
      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6 no-scrollbar pb-48">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] space-y-2 ${msg.type === 'user' ? 'flex flex-col items-end' : ''}`}>
              <div className={`p-4 rounded-xl rounded-br-2xl text-sm shadow-sm ${
                msg.type === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-900 border border-black/5 !rounded-br-xl rounded-tl-2xl'
              }`}>
                {msg.content}
              </div>
              {msg.image && (
                <div className="rounded-2xl overflow-hidden shadow-md border border-black/5 w-full max-w-[280px] bg-white">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img src={msg.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-3 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI 生成方案</span>
                      <div className="flex gap-2">
                        <button className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"><Download size={12} /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-black/5">
                      <div className="flex gap-3">
                        <button className="flex items-center gap-1 text-gray-400 hover:text-wood transition-colors group">
                          <ThumbsUp size={16} className="group-active:scale-125 transition-transform" />
                          <span className="text-[10px] font-bold">点赞</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors group">
                          <ThumbsDown size={16} className="group-active:scale-125 transition-transform" />
                          <span className="text-[10px] font-bold">点踩</span>
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={handleSend}
                          className="flex items-center gap-1 text-gray-400 hover:text-black transition-colors group"
                        >
                          <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                          <span className="text-[10px] font-bold">重新生成</span>
                        </button>
                        <button className="flex items-center gap-1 text-wood hover:opacity-80 transition-colors group">
                          <Share2 size={14} />
                          <span className="text-[10px] font-bold">发布到广场</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white border border-black/5 p-4 rounded-xl rounded-tl-2xl flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">正在为您构思设计方案...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-[60px] left-1/2 -translate-x-1/2 w-full max-w-[375px] px-4 pb-4 z-40">
        <div className="bg-white rounded-[32px] shadow-2xl border border-black/5 p-5">
          {/* Mode Selector - Small Pill */}
          <div className="flex justify-start mb-4">
            <button 
              onClick={() => setIsModePickerOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 border border-black/5 active:opacity-70 transition-opacity shadow-sm"
            >
              <span className="text-black font-bold text-[11px] tracking-tight">{currentMode.label}</span>
              <ChevronRight size={12} className="rotate-90 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Upload Box */}
            <button className="flex-shrink-0 w-16 h-16 rounded-2xl border-2 border-dashed border-black/5 flex items-center justify-center text-gray-300 hover:text-gray-400 hover:border-black/10 transition-all bg-gray-50/50">
              <PlusCircle size={24} />
            </button>

            {/* Text Area */}
            <div className="flex-1 min-w-0">
              <textarea 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="输入文字，创意无限可能" 
                className="w-full bg-transparent text-gray-700 text-sm focus:outline-none resize-none h-12 leading-relaxed placeholder:text-gray-300"
              />
            </div>

            {/* Send Button */}
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              className={`flex-shrink-0 px-4 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm font-bold text-xs ${
                inputValue.trim() && !isGenerating 
                ? 'bg-black text-white scale-100' 
                : 'bg-gray-100 text-gray-300 scale-95'
              } active:scale-95`}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* Mode Picker Popup */}
      <AnimatePresence>
        {isModePickerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModePickerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <div className="fixed inset-0 flex items-center justify-center z-[80] pointer-events-none p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-[32px] w-full max-w-[360px] p-8 shadow-2xl pointer-events-auto"
              >
                <h2 className="text-xl font-bold mb-6 text-center">选择生图模式</h2>
                <div className="grid grid-cols-2 gap-3">
                  {GENERATE_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setCurrentMode(mode);
                        setIsModePickerOpen(false);
                      }}
                      className={`p-4 rounded-2xl text-center transition-all border ${
                        currentMode.id === mode.id 
                          ? 'bg-black text-white border-black shadow-lg scale-[1.02]' 
                          : 'bg-[#F7F7F7] text-gray-600 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-bold text-sm">{mode.label}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setIsModePickerOpen(false)}
                  className="w-full mt-8 py-4 rounded-2xl bg-gray-100 text-gray-400 font-bold transition-colors hover:bg-gray-200"
                >
                  取消
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const FengShuiPage = () => {
  const [mode, setMode] = React.useState<'detect' | 'advisor'>('detect');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [view, setView] = React.useState<'main' | 'list' | 'detail'>('main');
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setIsCompleted(true);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  if (isAnalyzing) {
    return (
      <div className="pb-[80px] min-h-screen flex flex-col items-center justify-center px-8 bg-white">
        <div className="w-full max-w-xs text-center">
          <div className="mb-8 relative">
            <div className="w-24 h-24 rounded-full border-4 border-gray-100 border-t-black animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
              {progress}%
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">正在进行AI风水检测</h2>
          <p className="text-gray-400 text-sm mb-8">AI正在深度解析房间布局、光影与方位...</p>
          
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-black"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="pb-[80px] min-h-screen bg-[#F7F7F7]">
        <header className="px-6 h-[44px] flex items-center gap-4 sticky top-0 bg-[#F7F7F7]/80 backdrop-blur-md z-40 border-b border-black/5">
          <button onClick={() => setView('main')} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-black/5">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-base font-bold">检测记录</h1>
        </header>
        <main className="px-6 space-y-4">
          {FENGSHUI_RECORDS.map((record) => (
            <div 
              key={record.id} 
              onClick={() => { setSelectedRecord(record); setView('detail'); }}
              className="bg-white rounded-2xl p-4 flex gap-4 border border-black/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <img src={record.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-bold">{record.date}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${record.score > 85 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {record.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm mt-1">评分: {record.score}</h3>
                <p className="text-[10px] text-gray-400 mt-1">点击查看详细AI风水报告</p>
              </div>
              <div className="flex items-center">
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  if (view === 'detail') {
    const record = selectedRecord || FENGSHUI_RECORDS[0];
    return (
      <div className="pb-[80px]">
        <header className="px-6 h-[44px] flex items-center gap-4 sticky top-0 bg-[#F7F7F7]/80 backdrop-blur-md z-40 border-b border-black/5">
          <button onClick={() => setView('list')} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-black/5">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-base font-bold">风水深度解析报告</h1>
        </header>
        <main className="px-6">
          <div className="bg-white rounded-2xl p-8 text-center mb-6 border border-black/5 shadow-sm">
            <div className="relative inline-block mb-4">
              <svg className="w-32 h-32">
                <circle cx="64" cy="64" r="60" fill="none" stroke="#F0F0F0" strokeWidth="8" />
                <motion.circle 
                  cx="64" cy="64" r="60" fill="none" stroke="#1A1A1A" strokeWidth="8" 
                  strokeDasharray="377" 
                  initial={{ strokeDashoffset: 377 }}
                  animate={{ strokeDashoffset: 377 - (377 * (record.score / 100)) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tracking-tighter">{record.score}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">综合评分</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">风水格局：{record.status}</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">您的房间整体气场稳定，采光充足，符合“藏风聚气”的基本原则，仅需局部微调即可达到最佳状态。</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">AI 核心分析结果</h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold">已深度扫描</span>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-black/5 flex gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex flex-shrink-0 items-center justify-center font-bold text-xl">!</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">门冲煞：入户门对卫生间</h3>
                  <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">严重</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  <span className="font-bold text-gray-700">影响：</span>财气易流失，湿气直冲玄关，影响居住者健康。
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  <span className="font-bold text-gray-700">建议：</span>在玄关处设置实木屏风或悬挂长帘，阻断气流直冲。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-black/5 flex gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex flex-shrink-0 items-center justify-center font-bold text-xl">?</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">靠山不实：床头靠窗</h3>
                  <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">中等</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  <span className="font-bold text-gray-700">影响：</span>缺乏安全感，睡眠质量波动，事业运势不稳。
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  <span className="font-bold text-gray-700">建议：</span>尽量将床头靠向实墙。若无法移动，请使用厚重的遮光帘并保持窗户常闭。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-black/5 flex gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex flex-shrink-0 items-center justify-center font-bold text-xl">✓</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">明堂开阔：采光极佳</h3>
                  <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold">优异</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  <span className="font-bold text-gray-700">解析：</span>客厅采光充足，阳气旺盛，有利于家庭和谐与事业上升。
                </p>
              </div>
            </div>
          </div>

          <button className="w-full h-16 rounded-2xl bg-black text-white font-bold mt-10 shadow-lg shadow-black/10 active:scale-[0.98] transition-all">
            获取完整化解方案 (19.9元)
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="pb-[80px]">
      <Header title="AI 风水" />
      <main className="px-6">
        <div className="relative h-40 rounded-2xl overflow-hidden mb-4 shadow-sm">
          <img src="https://picsum.photos/seed/fengshui/800/400" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-center p-6">
            <h2 className="text-white text-xl font-bold">AI 深度风水解析</h2>
            <p className="text-white/70 text-xs mt-1">融合传统智慧与现代AI技术</p>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white p-1 rounded-full border border-black/5 shadow-sm">
            <button 
              onClick={() => setMode('detect')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${mode === 'detect' ? 'bg-black text-white shadow-md' : 'text-gray-400'}`}
            >
              检测分析
            </button>
            <button 
              onClick={() => setMode('advisor')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${mode === 'advisor' ? 'bg-black text-white shadow-md' : 'text-gray-400'}`}
            >
              AI风水顾问
            </button>
          </div>
        </div>

        {mode === 'detect' ? (
          <div className="space-y-6">
            <div 
              className="bg-white rounded-2xl border border-dashed border-gray-300 h-52 w-full max-w-[320px] mx-auto flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setUploadedImage('https://picsum.photos/seed/room_upload/600/800')}
            >
              {uploadedImage ? (
                <div className="w-full h-full relative">
                  <img src={uploadedImage} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                    <p className="text-white text-xs font-bold">点击更换照片</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Camera size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">上传房间照片</p>
                    <p className="text-xs text-gray-400 mt-1">AI将自动识别布局与方位</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setView('list')}
                className="flex-1 h-16 rounded-2xl border border-black font-bold relative group active:scale-[0.98] transition-all"
              >
                查看记录
                {isCompleted && (
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] px-2 py-1 rounded-full font-bold shadow-lg animate-bounce">
                    任务完成
                  </span>
                )}
              </button>
              <button 
                onClick={startAnalysis}
                disabled={!uploadedImage}
                className={`flex-[2] h-16 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${uploadedImage ? 'bg-black text-white shadow-black/10' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                立即开始 (4积分)
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-black/5 min-h-[350px] flex flex-col shadow-sm">
            <div className="flex-1 space-y-4">
              <div className="bg-gray-100 rounded-xl rounded-tl-2xl p-4 max-w-[80%]">
                <p className="text-sm">您好！我是您的AI风水顾问。您可以询问关于房间布局、色彩搭配或化解建议的问题。</p>
              </div>
              <div className="bg-black text-white rounded-xl rounded-br-2xl p-4 max-w-[80%] ml-auto shadow-md">
                <p className="text-sm">卧室床头对着镜子有什么影响吗？</p>
              </div>
            </div>
            <div className="mt-6 relative">
              <input 
                type="text" 
                placeholder="输入您的问题..." 
                className="w-full bg-gray-50 border border-black/5 rounded-xl py-4 px-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-md">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const ProfilePage = () => {
  const [showAllWorks, setShowAllWorks] = React.useState(false);

  if (showAllWorks) {
    return (
      <div className="pb-[80px] min-h-screen bg-[#F7F7F7]">
        <header className="px-6 h-[44px] flex items-center gap-4 sticky top-0 bg-[#F7F7F7]/80 backdrop-blur-md z-40 border-b border-black/5">
          <button onClick={() => setShowAllWorks(false)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-black/5">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-base font-bold">我的作品</h1>
        </header>
        <main className="px-6">
          <div className="grid grid-cols-2 gap-4">
            {MY_WORKS.map((work) => (
              <div key={work.id} className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                <div className="aspect-[3/4]">
                  <img src={work.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-800">{work.title}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pb-[80px]">
      <header className="px-6 pt-8 pb-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-xl bg-wood/10 border-4 border-white shadow-sm overflow-hidden">
          <img src="https://picsum.photos/seed/avatar/200/200" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">HuiTing</h1>
          <p className="text-xs text-gray-400 mt-1">追求极致美学的家装爱好者</p>
          <div className="flex gap-2 mt-3">
            <span className="px-2 py-1 rounded-lg bg-black text-white text-[10px] font-bold">PRO 会员</span>
            <span className="px-2 py-1 rounded-lg bg-wood/10 text-wood text-[10px] font-bold">积分: 1280</span>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* My Works Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">我的作品</h2>
            <button 
              onClick={() => setShowAllWorks(true)}
              className="text-xs text-gray-400 font-medium flex items-center gap-1"
            >
              更多 <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
            {MY_WORKS.map((work) => (
              <div key={work.id} className="flex-shrink-0 w-32 bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                <div className="aspect-[3/4]">
                  <img src={work.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 px-6 flex justify-between items-center">
            <span className="text-sm font-bold">内容管理</span>
          </div>
          <div className="divide-y divide-black/5">
            <button 
              onClick={() => setShowAllWorks(true)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid size={18} className="text-gray-400" />
                <span className="text-sm">我的作品</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Compass size={18} className="text-gray-400" />
                <span className="text-sm">风水报告</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Heart size={18} className="text-gray-400" />
                <span className="text-sm">我的收藏</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <div className="divide-y divide-black/5">
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-gray-400" />
                <span className="text-sm">订单与订阅</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <MessageCircle size={18} className="text-gray-400" />
                <span className="text-sm">联系客服</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-gray-400" />
                <span className="text-sm">用户指南</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-gray-400" />
                <span className="text-sm">账户设置</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          </div>
        </div>

        <div className="text-center pb-8">
          <p className="text-[10px] text-gray-300 font-medium">暖界AI Version 2.4.0</p>
        </div>
      </main>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = React.useState<Tab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomePage />;
      case 'workbench': return <WorkbenchPage onToolSelect={() => setActiveTab('generate')} />;
      case 'generate': return <GeneratePage />;
      case 'fengshui': return <FengShuiPage />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="max-w-[375px] mx-auto bg-[#F7F7F7] min-h-[812px] relative shadow-2xl overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
