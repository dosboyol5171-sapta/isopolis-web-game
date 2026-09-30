import React, { useState } from 'react';
import { VillagerNPC } from '../types/game';
import { MessageSquare, X, Send, Heart, BookOpen, Sun, Sparkles, Terminal, Award } from 'lucide-react';

interface NPCDialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Global hook definition for the user's custom local AI model
declare global {
  interface Window {
    __ISOPOLIS_LOCAL_AI_HANDLER__?: (npc: VillagerNPC, message: string) => Promise<string> | string;
  }
}

export const NPCDialogueModal: React.FC<NPCDialogueModalProps> = ({ isOpen, onClose }) => {
  const villagers: (VillagerNPC & {
    heartLevel: number;
    loreStory: string;
    weatherTips: string[];
    marketAdvice: string;
  })[] = [
    {
      id: 'pak_budi',
      name: 'Pak Budi',
      role: 'Pedagang Benih & Tetua Pasar',
      avatar: '👨‍🌾',
      location: 'Pasar Desa',
      heartLevel: 3,
      personality: 'Ramah, hangat, suka bercerita tentang tanah pertanian dan cuaca.',
      dialogues: [
        'Selamat pagi, petani muda! Tanah Isopolis sangat subur jika kamu rajin menyiramnya tiap fajar.',
        'Padi dan Jagung adalah tanaman pokok terbaik untuk membangun modal awalmu!',
        'Kalau butuh benih baru berkualitas, mampirlah ke toko Pasar Desa Isopolis.',
        'Ingat, jangan biarkan ladangmu dipenuhi batu atau rumput liar agar tanaman bernapas leluasa.',
      ],
      loreStory: 'Dahulu kala, kincir angin di utara desa dibangun oleh kakek buyut saya. Angin sejuk dari lembah selalu memutar bilahnya untuk menggiling gandum pertama desa.',
      weatherTips: [
        'Saat hari cerah, siram tanamanmu sebelum tengah hari agar tidak layu terkena terik.',
        'Jika awan mendung atau hujan turun, santai saja! Alam yang akan menyiram seluruh ladangmu.',
        'Musim semi adalah masa emas untuk menanam stroberi dan sayur mayur berdaun segar.',
      ],
      marketAdvice: 'Simpan hasil panen kualitas terbaik ke dalam Kotak Pengiriman (Shipping Bin) sebelum jam 17:00 sore agar kurir desa membayarmu tepat waktu!',
    },
    {
      id: 'siti_craft',
      name: 'Siti',
      role: 'Pengrajin & Ahli Kriya',
      avatar: '👩‍🌾',
      location: 'Bengkel Kriya',
      heartLevel: 2,
      personality: 'Kreatif, energik, semangat membuat selai dan produk olahan bernilai tinggi.',
      dialogues: [
        'Tahukah kamu? Stroberi yang diolah menjadi Selai Manis di Meja Kriya harganya melonjak 3x lipat!',
        'Penyiram otomatis (Sprinkler) akan sangat mempermudah hidupmu saat ladangmu sudah luas.',
        'Kumpulkan kayu dan batu kali dari ladangmu, aku bisa membantumu merakit perkakas baru.',
        'Desain arsitektur rumah panggungmu sungguh estetik, aku suka gaya kayu alaminya!',
      ],
      loreStory: 'Saya belajar seni kriya kayu dari pemahat di tepi pantai. Rahasianya ada pada serat kayu pinus tua yang diampelas dengan minyak bunga matahari.',
      weatherTips: [
        'Kayu gelondong di ladang lebih mudah dipotong setelah terkena embun pagi.',
        'Simpan cadangan kayu dan batu di peti penyimpanan rumahmu sebelum musim badai.',
      ],
      marketAdvice: 'Jangan jual bahan mentah langsung bila kamu punya waktu. Produk olahan kriya seperti Minyak Masak dan Roti selalu dicari pedagang luar pulau!',
    },
    {
      id: 'mbah_joko',
      name: 'Mbah Joko',
      role: 'Tetua Desa Isopolis',
      avatar: '👴',
      location: 'Balai Desa',
      heartLevel: 4,
      personality: 'Bijaksana, tenang, gemar memberi nasehat spiritual tentang harmoni alam.',
      dialogues: [
        'Kehidupan di desa mengajarkan kita kesabaran mendalam. Benih yang baik butuh waktu untuk bersemi.',
        'Jaga stamina dan energi tubuhmu. Bila lelah bekerja, tidurlah sejenak di rumah panggungmu.',
        'Sungai Isopolis yang mengalir jernih adalah berkah dari mata air pegunungan purba.',
        'Setiap musim membawa warna dan ketenangan tersendiri bagi jiwa yang bersyukur.',
      ],
      loreStory: 'Batu prasasti di persimpangan jalan desa menandai batas ladang pertama yang dibuka 100 tahun lalu. Rawatlah tanah ini seperti merawat keluargamu sendiri.',
      weatherTips: [
        'Saat malam tiba, perhatikan kunang-kunang di atas padang rumput. Mereka pertanda tanah yang sangat sehat.',
        'Di waktu pagi berkabut, dengarkan kicau burung di dahan pohon pinus untuk menenangkan pikiran.',
      ],
      marketAdvice: 'Kekayaan sejati seorang petani bukan sekadar koin emas di kantong, melainkan lumbung yang penuh dan ladang yang terus hijau sepanjang masa.',
    },
    {
      id: 'maya_pet',
      name: 'Maya',
      role: 'Pemelihara Ternak',
      avatar: '👩‍🦰',
      location: 'Kandang Ternak',
      heartLevel: 3,
      personality: 'Pecinta hewan sejati, ceria, paham tingkah laku ayam, sapi, dan domba.',
      dialogues: [
        'Ayam-ayam suka sekali berjalan santai di sekitar rumput hijau saat matahari bersinar hangat!',
        'Sapi yang diberi makan rumput segar secara rutin akan menghasilkan susu murni yang kental dan harum.',
        'Bila kamu menyayangi hewan peliharaanmu, mereka akan menyambutmu dengan lompatan riang tiap pagi!',
      ],
      loreStory: 'Dahulu saya menemukan seekor anak domba tersesat di lereng bukit berbatu. Sekarang keturunannya menjadi kawanan domba berbulu lembut di desa kita.',
      weatherTips: [
        'Saat hujan deras, pastikan hewan ternakmu berada di dalam kandang terlindung agar tidak kedinginan.',
        'Rumput yang dipanen dengan sabit di hari cerah menghasilkan jerami terbaik untuk pakan.',
      ],
      marketAdvice: 'Telur emas dan susu segar berkualitas bintang selalu mendapat harga premium di restoran kota. Jangan lupa mengumpulkan hasil ternak setiap pagi!',
    },
  ];

  const [selectedNPC, setSelectedNPC] = useState(villagers[0]);
  const [friendshipHearts, setFriendshipHearts] = useState<Record<string, number>>({
    pak_budi: 3,
    siti_craft: 2,
    mbah_joko: 4,
    maya_pet: 3,
  });
  const [chatMessages, setChatMessages] = useState<{ sender: 'npc' | 'player'; text: string; topicBadge?: string }[]>([
    { sender: 'npc', text: villagers[0].dialogues[0] },
  ]);
  const [inputText, setInputText] = useState('');
  const [showLocalAiGuide, setShowLocalAiGuide] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  if (!isOpen) return null;

  const currentHearts = friendshipHearts[selectedNPC.id] || 0;

  const handleSelectNPC = (npc: typeof villagers[0]) => {
    setSelectedNPC(npc);
    setChatMessages([
      {
        sender: 'npc',
        text: npc.dialogues[Math.floor(Math.random() * npc.dialogues.length)],
      },
    ]);
  };

  // Local Smart Response Engine (100% Offline, Fast, Zero External APIs)
  const generateLocalDialogueResponse = async (userMsg: string, npc: typeof villagers[0]): Promise<string> => {
    // 1. Check if user has hooked their own custom local AI handler into window
    if (typeof window !== 'undefined' && typeof window.__ISOPOLIS_LOCAL_AI_HANDLER__ === 'function') {
      try {
        const customRes = await window.__ISOPOLIS_LOCAL_AI_HANDLER__(npc, userMsg);
        if (customRes && typeof customRes === 'string') {
          return customRes;
        }
      } catch (err) {
        console.warn('Custom local AI handler error:', err);
      }
    }

    const lower = userMsg.toLowerCase();

    // 2. Keyword-based character authentic responses
    if (lower.includes('padi') || lower.includes('beras') || lower.includes('sawah')) {
      return npc.id === 'pak_budi'
        ? 'Padi adalah berkah terbesar Isopolis! Pastikan petak tanahmu sudah dicangkul dan diairi dengan baik sebelum menabur benih padi.'
        : npc.id === 'siti_craft'
        ? 'Padi hasil panenmu bisa digiling menjadi tepung beras halus di meja kriya untuk membuat hidangan lezat!'
        : 'Padi melambangkan kesabaran. Rawatlah dengan cinta, dan dalam beberapa hari kebunmu akan menguning indah.';
    }

    if (lower.includes('jagung') || lower.includes('stroberi') || lower.includes('wortel') || lower.includes('labu')) {
      return `${npc.name}: "Pilihan benih yang sangat bagus! Tanaman hortikultura seperti itu bernilai tinggi bila dipanen di puncak kematangannya."`;
    }

    if (lower.includes('cuaca') || lower.includes('hujan') || lower.includes('angin') || lower.includes('musim')) {
      const tip = npc.weatherTips[Math.floor(Math.random() * npc.weatherTips.length)];
      return `${npc.name}: "Tentang cuaca hari ini — ${tip}"`;
    }

    if (lower.includes('ternak') || lower.includes('ayam') || lower.includes('sapi') || lower.includes('domba') || lower.includes('telur') || lower.includes('susu')) {
      return npc.id === 'maya_pet'
        ? 'Hewan-hewan di Isopolis sangat cerdas dan ramah. Usap mereka setiap pagi dan dengarkan suara riang mereka!'
        : 'Peternakan yang teratur di samping ladang sayur menciptakan ekosistem desa yang seimbang dan produktif.';
    }

    if (lower.includes('kriya') || lower.includes('kayu') || lower.includes('batu') || lower.includes('alat') || lower.includes('cangkul')) {
      return npc.id === 'siti_craft'
        ? 'Peralatan yang kokoh membuat pekerjaan mencangkul dan menebang pohon jadi jauh lebih cepat. Kumpulkan bahan dasarnya dari ladang!'
        : 'Perkakas yang baik adalah sahabat sejati seorang petani. Rawatlah cangkul dan penyiram airmu.';
    }

    if (lower.includes('sejarah') || lower.includes('desa') || lower.includes('cerita') || lower.includes('rahasia')) {
      return `${npc.name}: "${npc.loreStory}"`;
    }

    if (lower.includes('halo') || lower.includes('hai') || lower.includes('pagi') || lower.includes('siang') || lower.includes('malam') || lower.includes('salam')) {
      return `${npc.name}: "Salam hangat, sahabat petaniku! Senang sekali melihatmu berkunjung ke ${npc.location} hari ini."`;
    }

    // Default friendly character reply
    const genericReplies = [
      `Tentu saja! Di desa Isopolis, setiap usaha dan peluh keringatmu di ladang akan menghasilkan berkah melimpah.`,
      `Menarik sekali yang kamu katakan! Saya selalu senang bertukar pikiran dengan petani muda bersemangat sepertimu.`,
      `Nikmati hembusan angin desa hari ini. Jangan lupa menyempatkan diri bersantai di tepi sungai jika sudah selesai berladang.`,
    ];
    return genericReplies[Math.floor(Math.random() * genericReplies.length)];
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');
    setChatMessages((prev) => [...prev, { sender: 'player', text: userMsg }]);

    // Instant local processing without network lag
    const responseText = await generateLocalDialogueResponse(userMsg, selectedNPC);

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: 'npc', text: responseText }]);
    }, 150);
  };

  const handleTopicClick = (topicType: 'weather' | 'lore' | 'market' | 'gift') => {
    let promptMsg = '';
    let responseText = '';
    let badge = '';

    if (topicType === 'weather') {
      promptMsg = 'Bagaimana ramalan cuaca dan saran bertani hari ini?';
      badge = 'Cuaca & Ladang';
      const tip = selectedNPC.weatherTips[Math.floor(Math.random() * selectedNPC.weatherTips.length)];
      responseText = `${selectedNPC.name}: "${tip}"`;
    } else if (topicType === 'lore') {
      promptMsg = 'Bisa ceritakan kisah atau rahasia masa lalu desa?';
      badge = 'Kisah Desa';
      responseText = `${selectedNPC.name}: "${selectedNPC.loreStory}"`;
    } else if (topicType === 'market') {
      promptMsg = 'Apa saran terbaik untuk menjual hasil panen ke pasar?';
      badge = 'Pasar & Untung';
      responseText = `${selectedNPC.name}: "${selectedNPC.marketAdvice}"`;
    } else if (topicType === 'gift') {
      promptMsg = 'Memberikan sapaan hangat dan tanda persahabatan!';
      badge = 'Persahabatan';

      // Increase heart
      setFriendshipHearts((prev) => {
        const nextVal = Math.min(5, (prev[selectedNPC.id] || 0) + 1);
        return { ...prev, [selectedNPC.id]: nextVal };
      });
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 1200);

      responseText = `${selectedNPC.name}: "Terima kasih banyak! Kebaikan hatimu membuat hari saya di desa terasa begitu cerah. Persahabatan kita kini semakin erat!" 💖`;
    }

    setChatMessages((prev) => [
      ...prev,
      { sender: 'player', text: promptMsg, topicBadge: badge },
      { sender: 'npc', text: responseText },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-100 leading-tight">Interaksi Warga Desa</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Sistem Dialog Lokal
                </span>
              </div>
              <p className="text-xs text-slate-400">Dialog interaktif warga desa Isopolis dengan respon cerdas instan tanpa internet</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowLocalAiGuide(!showLocalAiGuide)}
              className="p-1.5 px-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5"
              title="Slot Handler AI Lokal Game"
            >
              <Terminal className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Slot AI Lokal</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Local AI Developer Hook Panel (Collapsible) */}
        {showLocalAiGuide && (
          <div className="bg-slate-950 border-b border-teal-500/30 p-3 text-xs text-slate-300 animate-in slide-in-from-top-3 duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Arsitektur Slot AI Lokal Isopolis</span>
              </div>
              <span className="text-[10px] text-teal-400/80 font-mono bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/50">
                100% Bebas Server Luar
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Anda dapat menghubungkan modul AI lokal (seperti WebLLM, model ONNX, atau rule-based engine Anda sendiri) langsung ke game dengan mengatur fungsi global berikut di konsol / script game Anda:
            </p>
            <div className="mt-2 p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-300 overflow-x-auto">
              {`window.__ISOPOLIS_LOCAL_AI_HANDLER__ = async (npc, userText) => {\n  // Contoh: panggil engine AI lokal Anda di sini\n  return \`[\${npc.name}]: Jawaban lokal untuk "\${userText}"\`;\n};`}
            </div>
          </div>
        )}

        {/* Main Section */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* NPC Selector List */}
          <div className="w-full sm:w-56 bg-slate-950/50 border-b sm:border-b-0 sm:border-r border-slate-800 p-3 space-y-2 overflow-x-auto sm:overflow-y-auto flex sm:flex-col shrink-0">
            {villagers.map((npc) => {
              const isSelected = selectedNPC.id === npc.id;
              const hearts = friendshipHearts[npc.id] || 0;
              return (
                <div
                  key={npc.id}
                  onClick={() => handleSelectNPC(npc)}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between shrink-0 sm:w-full ${
                    isSelected
                      ? 'bg-emerald-950/50 border-emerald-500 text-slate-100 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{npc.avatar}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{npc.name}</span>
                      <span className="text-[10px] text-slate-400">{npc.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-rose-400 text-xs font-bold pl-2">
                    <Heart className="w-3 h-3 fill-rose-500 mr-0.5" />
                    <span>{hearts}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-slate-900/60 p-4 space-y-3 justify-between overflow-hidden">
            {/* NPC Header & Friendship Hearts */}
            <div className="flex items-center justify-between bg-slate-800/70 p-3 rounded-2xl border border-slate-700/60">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedNPC.avatar}</span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-100">{selectedNPC.name}</span>
                  <span className="text-xs text-emerald-400 font-medium">{selectedNPC.location} • {selectedNPC.role}</span>
                </div>
              </div>

              {/* Heart Progression */}
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-1 transition-transform ${heartAnim ? 'scale-125 duration-200' : ''}`}>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <Heart
                      key={lvl}
                      className={`w-3.5 h-3.5 transition-colors ${
                        lvl <= currentHearts
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-slate-600 fill-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                  Persahabatan: Tk. {currentHearts}/5
                </span>
              </div>
            </div>

            {/* Quick Dialogue Topic Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => handleTopicClick('weather')}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 p-2 rounded-xl text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Tips Cuaca</span>
              </button>

              <button
                onClick={() => handleTopicClick('lore')}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 p-2 rounded-xl text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Kisah Desa</span>
              </button>

              <button
                onClick={() => handleTopicClick('market')}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 p-2 rounded-xl text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Saran Pasar</span>
              </button>

              <button
                onClick={() => handleTopicClick('gift')}
                className="bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 p-2 rounded-xl text-[10px] font-bold border border-rose-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500 shrink-0" />
                <span className="truncate">Sapa Sahabat</span>
              </button>
            </div>

            {/* Message Bubble List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-1 pr-1.5">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'player' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                      m.sender === 'player'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    {m.topicBadge && (
                      <div className="text-[9px] font-bold text-emerald-200 mb-1 opacity-90">
                        Topik: {m.topicBadge}
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Sapa ${selectedNPC.name} atau tanyakan sesuatu...`}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
