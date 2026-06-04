import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  options?: string[];
}

const QUICK_REPLIES = [
  "What schemes am I eligible for?",
  "How to apply for Ayushman Bharat?",
  "PM Kisan – who can apply?",
  "Documents needed for PM Mudra?",
  "Best scheme for students?",
  "Senior citizen benefits?",
  "Farmer schemes available?",
  "How to get free LPG?",
];

function getBotResponse(input: string): { text: string; options?: string[] } {
  const q = input.toLowerCase();

  if (q.includes("ayushman") || q.includes("health") || q.includes("hospital") || q.includes("medical")) {
    return {
      text: "🏥 **Ayushman Bharat – PM Jan Arogya Yojana** gives ₹5 lakh health cover per family per year for hospitalization.\n\n✅ Eligibility: Listed in SECC 2011 data (BPL families).\n📋 Documents: Aadhaar Card + Ration Card.\n📞 Helpline: **14555**\n\nVisit any empaneled hospital and ask for the Ayushman Mitra desk.",
      options: ["How to check if I'm eligible?", "Documents needed for Ayushman?", "Find nearby empaneled hospital"],
    };
  }

  if (q.includes("pm kisan") || q.includes("kisan samman") || (q.includes("farmer") && q.includes("6000"))) {
    return {
      text: "🌾 **PM Kisan Samman Nidhi** gives farmers ₹6,000/year in 3 installments of ₹2,000 each directly to their bank.\n\n✅ Eligibility: All farmer families with cultivable land.\n📋 Documents: Aadhaar + Land Records + Bank Passbook.\n🌐 Register at: **pmkisan.gov.in** or your nearest CSC.",
      options: ["PM Kisan documents needed?", "Farmer schemes available?", "Kisan Credit Card benefits?"],
    };
  }

  if (q.includes("mudra") || q.includes("business loan") || q.includes("small business") || q.includes("entrepreneur")) {
    return {
      text: "💼 **PM Mudra Yojana** offers collateral-free loans for small businesses:\n• 🌱 **Shishu**: up to ₹50,000\n• 🌿 **Kishore**: ₹50,001 – ₹5 lakh\n• 🌳 **Tarun**: ₹5 lakh – ₹10 lakh\n\n📋 Documents: Aadhaar, PAN, business plan, bank statements.\n🏦 Apply at any bank, RRB, or NBFC near you.",
      options: ["What is the interest rate on Mudra?", "Stand-Up India for SC/ST?", "Startup India Seed Fund?"],
    };
  }

  if (q.includes("student") || q.includes("scholarship") || q.includes("education") || q.includes("study")) {
    return {
      text: "🎓 **Top schemes for students:**\n\n1️⃣ **PM Scholarship** – ₹25,000/year for wards of Ex-Servicemen\n2️⃣ **NMMSS** – ₹12,000/year for Class 9-12 (income < ₹1.5L)\n3️⃣ **INSPIRE** – ₹80,000/year for science students\n4️⃣ **Pre-Matric Scholarship** – for SC/ST students\n\n🌐 Apply at: **scholarships.gov.in**",
      options: ["INSPIRE scholarship details?", "Documents for NSP scholarship?", "Beti Bachao Beti Padhao?"],
    };
  }

  if (q.includes("senior") || q.includes("old age") || q.includes("elderly") || q.includes("pension") || q.includes("retired") || q.includes("60 year")) {
    return {
      text: "👴 **Top schemes for senior citizens:**\n\n1️⃣ **IGNOAPS** – ₹300–500/month pension (BPL seniors)\n2️⃣ **SCSS** – 8.2% interest on savings\n3️⃣ **PMVVY** – Guaranteed 7.4% return via LIC\n4️⃣ **Annapurna** – 10 kg free food grains/month\n5️⃣ **Rashtriya Vayoshri** – Free walking aids, wheelchairs, hearing aids\n\n👉 Use the age slider on our home page and set age 60+ to see all senior schemes!",
      options: ["SCSS account opening steps?", "How to apply for old age pension?", "Free assistive devices for seniors?"],
    };
  }

  if (q.includes("farmer") || q.includes("agriculture") || q.includes("kisan") || q.includes("crop")) {
    return {
      text: "🌾 **Schemes for farmers:**\n\n1️⃣ **PM Kisan** – ₹6,000/year income support\n2️⃣ **PM Fasal Bima** – Cheap crop insurance (2% premium)\n3️⃣ **Kisan Credit Card** – Credit up to ₹3 lakh at 4% interest\n4️⃣ **PM Mudra** – Business loans for agri-allied activities\n\n📱 Register/track: **pmkisan.gov.in**",
      options: ["PM Kisan – who can apply?", "Kisan Credit Card process?", "Crop insurance coverage?"],
    };
  }

  if (q.includes("lpg") || q.includes("gas") || q.includes("ujjwala") || q.includes("cooking")) {
    return {
      text: "🔥 **PM Ujjwala Yojana 2.0** gives free LPG connection to women from BPL households:\n\n✅ Free connection + first refill free + free stove\n📋 Documents: Aadhaar + Ration Card/BPL Certificate + Bank passbook\n🏪 Apply at: Your nearest HP/Bharat/Indane Gas distributor\n\n💡 Migrant workers can apply with self-declaration instead of address proof!",
      options: ["Ujjwala eligibility details?", "Find nearest gas distributor?", "LPG subsidy amount?"],
    };
  }

  if (q.includes("eligible") || q.includes("which scheme") || q.includes("what scheme") || q.includes("find scheme")) {
    return {
      text: "🔍 The best way to find schemes for you:\n\n1️⃣ **Go to Home page** → set your age on the slider\n2️⃣ Click **'Find Schemes'** to see schemes matching your age group\n3️⃣ Use the **Filters** on the schemes page to narrow by sector and income\n4️⃣ Browse **Central Schemes** for nationwide programs\n\nOr ask me about specific topics like health, education, farming, business, or housing!",
      options: ["Health insurance schemes?", "Business loan schemes?", "Housing assistance schemes?"],
    };
  }

  if (q.includes("document") || q.includes("apply") || q.includes("how to")) {
    return {
      text: "📋 **Common documents needed for most schemes:**\n\n• Aadhaar Card (mandatory for almost all)\n• Bank Account Passbook\n• Income Certificate\n• Ration Card (for BPL schemes)\n• Caste Certificate (for SC/ST/OBC)\n• Passport-size photographs\n\n💡 Tip: Get all documents digitized on **DigiLocker** (digilocker.gov.in) for easy access!",
      options: ["How to open DigiLocker?", "Income certificate kaise banaye?", "What is a BPL certificate?"],
    };
  }

  if (q.includes("housing") || q.includes("house") || q.includes("awas") || q.includes("home loan")) {
    return {
      text: "🏠 **Housing schemes available:**\n\n1️⃣ **PMAY Urban** – Up to ₹2.67L subsidy on home loans (income < ₹18L)\n2️⃣ **PMAY Gramin** – ₹1.2–1.3L grant for rural house construction\n\n✅ Eligibility: Must NOT own a pucca house anywhere in India.\n🌐 Check at: **pmaymis.gov.in** or **pmayg.nic.in**",
      options: ["PMAY Urban loan subsidy calculation?", "PMAY Gramin eligibility?", "Who cannot apply for PMAY?"],
    };
  }

  if (q.includes("insurance") || q.includes("suraksha bima") || q.includes("jeevan jyoti")) {
    return {
      text: "🛡️ **Affordable insurance for all:**\n\n1️⃣ **PM Suraksha Bima** – ₹2L accident cover at only ₹20/year\n2️⃣ **PM Jeevan Jyoti** – ₹2L life insurance at ₹436/year\n3️⃣ **Ayushman Bharat** – ₹5L health cover (for eligible families)\n\n🏦 Enroll at any bank branch. Premium auto-debited from your account!",
      options: ["How to claim PMSBY?", "Ayushman Bharat eligibility?", "Get all three insurances?"],
    };
  }

  if (q.includes("digilocker") || q.includes("csc") || q.includes("common service") || q.includes("helpline")) {
    return {
      text: "💻 **Useful Government Portals:**\n\n• **DigiLocker**: digilocker.gov.in – Store all your documents digitally\n• **National Scholarship Portal**: scholarships.gov.in\n• **CSC Locator**: locator.csccloud.in – Find nearest Common Service Centre\n• **Umang App**: umang.gov.in – Access 1200+ govt services on mobile\n• **MyScheme Portal**: myscheme.gov.in – Find all central schemes\n\n📞 **PM Helpline**: 7800004200",
      options: ["How to find nearest CSC?", "What is the Umang app?", "Check scheme status online?"],
    };
  }

  if (q.includes("skill") || q.includes("training") || q.includes("job") || q.includes("employment")) {
    return {
      text: "💪 **Skill & employment schemes:**\n\n1️⃣ **PMKVY** – Free skill certification + ₹8,000 reward\n2️⃣ **DDU-GKY** – Free residential training + guaranteed placement\n3️⃣ **e-SHRAM** – Register as unorganised worker + free ₹2L insurance\n4️⃣ **Startup India** – Support for new businesses\n\n🌐 Apply at: **skillindiadigital.gov.in**",
      options: ["PMKVY course list?", "DDU-GKY training centres?", "e-SHRAM registration steps?"],
    };
  }

  // Default fallback
  return {
    text: "🙏 I'm here to help you find government schemes! You can ask me about:\n\n• Health, education, or housing schemes\n• Farmer and agriculture benefits\n• Business loans and startup support\n• Senior citizen and pension plans\n• Skill training and employment\n\nOr use the quick options below to get started:",
    options: QUICK_REPLIES.slice(0, 4),
  };
}

let msgId = 0;
function makeMsg(from: "bot" | "user", text: string, options?: string[]): Message {
  return { id: ++msgId, from, text, options };
}

const GREETING = makeMsg(
  "bot",
  "🙏 **Namaste! Welcome to YojanaConnect.**\n\nI can help you find the right government scheme for you. What would you like to know?",
  QUICK_REPLIES.slice(0, 4)
);

export function HelpBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, open]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg = makeMsg("user", text);
    const response = getBotResponse(text);
    const botMsg = makeMsg("bot", response.text, response.options);
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  }

  function renderText(text: string) {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i} className="block">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </span>
      );
    });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110"
        aria-label="Open help bot"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">YojanaBot</p>
              <p className="text-xs text-white/80">Government Scheme Assistant</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.from === "user" ? "" : "space-y-2"}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.from === "user"
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {renderText(msg.text)}
                  </div>
                  {msg.from === "bot" && msg.options && (
                    <div className="flex flex-col gap-1 pl-1">
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => sendMessage(opt)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline text-left group"
                        >
                          <ChevronRight className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type your question..."
              className="text-sm h-9"
            />
            <Button
              size="sm"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="h-9 px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
