"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Zap,
  Shield,
  Globe,
  Wallet,
  Server,
  Clock,
  Star,
  AlertTriangle,
  Upload,
  Gavel,
  Menu,
  X,
  ArrowRight,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

// ─── Types ───
interface GPUListing {
  id: string;
  name: string;
  vram: string;
  cudaCores: number;
  pricePerHour: number;
  provider: string;
  reputation: number;
  available: boolean;
  location: string;
}

interface Job {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  gpuName: string;
  duration: string;
  cost: number;
  createdAt: string;
}

// ─── Mock Data ───
const GPU_LISTINGS: GPUListing[] = [
  { id: "1", name: "NVIDIA RTX 4090", vram: "24 GB", cudaCores: 16384, pricePerHour: 0.45, provider: "NodeAlpha", reputation: 4.9, available: true, location: "US-East" },
  { id: "2", name: "NVIDIA RTX 3090", vram: "24 GB", cudaCores: 10496, pricePerHour: 0.32, provider: "GPUHub", reputation: 4.7, available: true, location: "EU-West" },
  { id: "3", name: "NVIDIA A100", vram: "80 GB", cudaCores: 6912, pricePerHour: 1.20, provider: "CloudMine", reputation: 4.8, available: true, location: "AP-South" },
  { id: "4", name: "NVIDIA RTX 4080", vram: "16 GB", cudaCores: 9728, pricePerHour: 0.38, provider: "RenderPro", reputation: 4.5, available: false, location: "US-West" },
  { id: "5", name: "AMD MI250X", vram: "128 GB", cudaCores: 14080, pricePerHour: 0.95, provider: "CryptoFarm", reputation: 4.6, available: true, location: "EU-Central" },
  { id: "6", name: "NVIDIA RTX 4070", vram: "12 GB", cudaCores: 5888, pricePerHour: 0.22, provider: "AIWorker", reputation: 4.3, available: true, location: "US-East" },
];

const ACTIVE_JOBS: Job[] = [
  { id: "job-1", status: "running", gpuName: "NVIDIA RTX 4090", duration: "2h 15m", cost: 1.01, createdAt: "2026-06-05T10:00:00Z" },
  { id: "job-2", status: "completed", gpuName: "NVIDIA RTX 3090", duration: "45m", cost: 0.24, createdAt: "2026-06-05T09:00:00Z" },
  { id: "job-3", status: "pending", gpuName: "NVIDIA A100", duration: "—", cost: 0, createdAt: "2026-06-05T11:00:00Z" },
];

// ─── Brutalist Components ───
const BrutalCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`brutal-box p-6 cursor-pointer ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ number, title }: { number: string; title: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <span className="brutal-tag brutal-tag-red">{number}</span>
    <div className="brutal-line flex-1" />
    <h2 className="text-2xl md:text-4xl brutal-heading text-white">{title}</h2>
  </div>
);

const StatCard = ({ icon: Icon, value, label }: { icon: any; value: string; label: string }) => (
  <BrutalCard className="text-center">
    <Icon className="w-8 h-8 text-white mx-auto mb-3" strokeWidth={3} />
    <div className="text-4xl brutal-heading text-white mb-1">{value}</div>
    <div className="text-sm font-mono-light text-white/70 uppercase">{label}</div>
  </BrutalCard>
);

// ─── Main Page ───
export default function NoCapCompute() {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedGPU, setSelectedGPU] = useState<GPUListing | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(ACTIVE_JOBS);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const connectWallet = async () => {
    setWalletConnected(true);
    setWalletAddress("xdc" + Math.random().toString(36).substring(2, 14) + "..." + Math.random().toString(36).substring(2, 6));
    setNotification({ message: "WALLET CONNECTED", type: "success" });
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setNotification({ message: "WALLET DISCONNECTED", type: "success" });
  };

  const rentGPU = (gpu: GPUListing) => {
    setSelectedGPU(gpu);
    setShowJobModal(true);
  };

  const submitJob = () => {
    if (!selectedGPU) return;
    const newJob: Job = {
      id: `job-${Date.now()}`,
      status: "pending",
      gpuName: selectedGPU.name,
      duration: "—",
      cost: 0,
      createdAt: new Date().toISOString(),
    };
    setJobs([newJob, ...jobs]);
    setShowJobModal(false);
    setSelectedGPU(null);
    setNotification({ message: `JOB SUBMITTED: ${selectedGPU.name}`, type: "success" });
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { id: "home", label: "HOME" },
    { id: "marketplace", label: "MARKETPLACE" },
    { id: "jobs", label: "MY JOBS" },
    { id: "features", label: "FEATURES" },
    { id: "roadmap", label: "ROADMAP" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1a2e] brutal-grid"
>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-50 px-6 py-3 border border-[#e2e8f0] brutal-box-green flex items-center gap-3 rounded-xl shadow-lg ${
              notification.type === "success" ? "bg-white" : "bg-red-50"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" strokeWidth={2.5} />
            )}
            <span className="text-sm font-brutalist">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 brutal-nav transition-all duration-300 ${
          scrollY > 50 ? "py-2" : "py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => scrollToSection("home")}
          >
            <div className="w-10 h-10 bg-red-600 border-3 border-black flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div className="flex items-baseline">
              <span className="logo-nocap text-xl">NOCAP</span>
              <span className="logo-compute text-lg">COMPUTE</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 text-sm font-brutalist transition-all rounded-lg ${
                  activeSection === item.id
                    ? "bg-[#6366f1] text-white shadow-md"
                    : "bg-transparent text-[#1a1a2e] hover:bg-[#e2e8f0]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {walletConnected ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#1a1a2e] font-mono bg-[#e2e8f0] px-3 py-1.5 rounded-lg">
                  {walletAddress}
                </span>
                <button onClick={disconnectWallet} className="btn-brutal-secondary text-sm">
                  DISCONNECT
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} className="btn-brutal text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" strokeWidth={3} />
                CONNECT WALLET
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg bg-white border border-[#e2e8f0] shadow-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#1a1a2e]" strokeWidth={2} /> : <Menu className="w-5 h-5 text-[#1a1a2e]" strokeWidth={2} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border border-[#e2e8f0] rounded-xl mx-4 shadow-lg"
            >
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="w-full text-left px-4 py-3 text-sm font-brutalist text-[#1a1a2e] hover:bg-[#f8fafc] transition-all rounded-lg"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="pt-2 border-t border-[#e2e8f0]">
                  {walletConnected ? (
                    <div className="space-y-2">
                      <div className="text-xs text-[#1a1a2e] font-mono px-4">{walletAddress}</div>
                      <button onClick={disconnectWallet} className="w-full btn-brutal-secondary text-sm">
                        DISCONNECT WALLET
                      </button>
                    </div>
                  ) : (
                    <button onClick={connectWallet} className="w-full btn-brutal text-sm flex items-center justify-center gap-2">
                      <Wallet className="w-4 h-4" strokeWidth={2} />
                      CONNECT WALLET
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 border border-[#e2e8f0] bg-white px-4 py-2 mb-8 rounded-full shadow-sm">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-brutalist text-[#1a1a2e]">POWERED BY XDC NETWORK</span>
            </div>

            <h1 className="text-5xl md:text-8xl brutal-heading mb-6 leading-none">
              <span className="text-[#1a1a2e]">RENT GPU</span>
              <br />
              <span className="text-[#6366f1]">EARN XDC</span>
              <br />
              <span className="text-[#1a1a2e]">DECENTRALIZED</span>
            </h1>

            <p className="text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto mb-10 font-mono-light">
              PEER-TO-PEER GPU MARKETPLACE. COMMUNITY MEMBERS RENT IDLE GPUS. 
              TRUSTLESS PAYMENTS VIA XDC SMART CONTRACTS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => scrollToSection("marketplace")}
                className="btn-brutal text-lg flex items-center gap-2"
              >
                <Play className="w-5 h-5" strokeWidth={3} />
                BROWSE GPUS
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="btn-brutal-secondary text-lg flex items-center gap-2"
              >
                LEARN MORE
                <ArrowRight className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
              <StatCard icon={Server} value="2,400+" label="GPUS LISTED" />
              <StatCard icon={Zap} value="$0.50" label="FROM /HR" />
              <StatCard icon={Globe} value="50+" label="COUNTRIES" />
              <StatCard icon={Shield} value="99.9%" label="UPTIME" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="py-20 px-4 sm:px-6 border-t border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto">
          <SectionTitle number="01" title="GPU MARKETPLACE" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GPU_LISTINGS.map((gpu, index) => (
              <motion.div
                key={gpu.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <BrutalCard>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className={`brutal-tag ${gpu.available ? "brutal-tag-green" : "brutal-tag-red"}`}>
                      {gpu.available ? "AVAILABLE" : "BUSY"}
                    </div>
                  </div>

                  <h3 className="text-xl brutal-heading text-[#1a1a2e] mb-4">{gpu.name}</h3>
                  <div className="space-y-2 mb-4 font-mono-light text-sm">
                    <div className="flex justify-between border-b border-[#e2e8f0] pb-1">
                      <span className="text-[#64748b]">VRAM</span>
                      <span className="text-[#1a1a2e] font-bold">{gpu.vram}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#e2e8f0] pb-1">
                      <span className="text-[#64748b]">CUDA CORES</span>
                      <span className="text-[#1a1a2e] font-bold">{gpu.cudaCores.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#e2e8f0] pb-1">
                      <span className="text-[#64748b]">LOCATION</span>
                      <span className="text-[#1a1a2e] font-bold">{gpu.location}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#e2e8f0] pb-1">
                      <span className="text-[#64748b]">PROVIDER</span>
                      <span className="text-[#1a1a2e] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" strokeWidth={2} />
                        {gpu.reputation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0]">
                    <div>
                      <span className="text-2xl brutal-heading text-[#6366f1]">{gpu.pricePerHour} XDC</span>
                      <span className="text-xs font-mono-light text-[#64748b] block">/ HOUR</span>
                    </div>
                    <button
                      onClick={() => gpu.available && rentGPU(gpu)}
                      disabled={!gpu.available}
                      className={`px-4 py-2 font-brutalist text-sm rounded-lg transition-all ${
                        gpu.available
                          ? "bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-md"
                          : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                      }`}
                    >
                      {gpu.available ? "RENT NOW" : "UNAVAILABLE"}
                    </button>
                  </div>
                </BrutalCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* My Jobs Section */}
      <section id="jobs" className="py-20 px-4 sm:px-6 border-t border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto">
          <SectionTitle number="02" title="MY JOBS" />

          <div className="space-y-4">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <BrutalCard className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg border-2 border-[#e2e8f0] flex items-center justify-center ${
                      job.status === "running" ? "bg-blue-50" :
                      job.status === "completed" ? "bg-emerald-50" :
                      job.status === "failed" ? "bg-red-50" :
                      "bg-amber-50"
                    }`}>
                      {job.status === "running" ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" strokeWidth={2} /> :
                       job.status === "completed" ? <CheckCircle className="w-5 h-5 text-emerald-500" strokeWidth={2} /> :
                       job.status === "failed" ? <XCircle className="w-5 h-5 text-red-500" strokeWidth={2} /> :
                       <Clock className="w-5 h-5 text-amber-500" strokeWidth={2} />}
                    </div>
                    <div>
                      <h4 className="font-brutalist text-[#1a1a2e]">{job.gpuName}</h4>
                      <p className="text-sm font-mono-light text-[#64748b]">JOB ID: {job.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-mono-light text-[#64748b]">DURATION</p>
                      <p className="font-brutalist text-[#1a1a2e]">{job.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono-light text-[#64748b]">COST</p>
                      <p className="font-brutalist text-[#6366f1]">{job.cost} XDC</p>
                    </div>
                    <div className={`brutal-tag ${
                      job.status === "running" ? "bg-blue-50 text-blue-600 border-blue-200" :
                      job.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      job.status === "failed" ? "bg-red-50 text-red-600 border-red-200" :
                      "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                      {job.status.toUpperCase()}
                    </div>
                  </div>
                </BrutalCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 border-t border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto">
          <SectionTitle number="03" title="PLATFORM FEATURES" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Server, title: "GPU LISTINGS", desc: "Providers list GPU specs. Set availability schedules and go live instantly on the marketplace." },
              { icon: Shield, title: "SMART CONTRACT ESCROW", desc: "Payments locked in trustless escrow and released automatically upon verified job completion." },
              { icon: Star, title: "REPUTATION SYSTEM", desc: "Providers build verifiable on-chain reputation scores based on completion rate and ratings." },
              { icon: AlertTriangle, title: "SLASHING MECHANISM", desc: "Bad actors are economically penalized via stake slashing. Users receive automatic refunds." },
              { icon: Upload, title: "JOB SUBMISSION", desc: "Upload code and datasets directly. Monitor real-time job progress via the dashboard." },
              { icon: Gavel, title: "DISPUTE RESOLUTION", desc: "Built-in on-chain dispute mechanism. Protocol arbitrates fairly via smart contract." },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <BrutalCard>
                  <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg brutal-heading text-[#1a1a2e] mb-2">{feature.title}</h3>
                  <p className="text-sm font-mono-light text-[#64748b] leading-relaxed">{feature.desc}</p>
                </BrutalCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-20 px-4 sm:px-6 border-t border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto">
          <SectionTitle number="04" title="ROADMAP" />

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-[#e2e8f0]" />

            {[
              { phase: "PHASE 1", title: "MVP LAUNCH", time: "WEEK 1-2", desc: "Core marketplace with GPU listings, job submission, and escrow payments." },
              { phase: "PHASE 2", title: "SECURITY AUDIT", time: "WEEK 3-4", desc: "Third-party audit of all smart contracts. Bug bounty program launch." },
              { phase: "PHASE 3", title: "MAINNET LAUNCH", time: "MONTH 2", desc: "Deploy to XDC mainnet. Enable real XDC payments and withdrawals." },
              { phase: "PHASE 4", title: "DICO TOKEN TGE", time: "MONTH 3", desc: "Token generation event. Staking, governance, and reward distribution." },
              { phase: "PHASE 5", title: "ENTERPRISE API", time: "MONTH 6", desc: "High-volume compute API for enterprises. Container orchestration support." },
            ].map((item, index) => (
              <motion.div
                key={item.phase}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`relative flex items-center gap-8 mb-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <BrutalCard className={`inline-block ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <span className="brutal-tag bg-[#6366f1]/10 text-[#6366f1]">{item.phase}</span>
                    <h3 className="text-xl brutal-heading text-[#1a1a2e] mt-2">{item.title}</h3>
                    <span className="text-xs font-mono-light text-[#64748b]">{item.time}</span>
                    <p className="text-sm font-mono-light text-[#64748b] mt-2">{item.desc}</p>
                  </BrutalCard>
                </div>
                <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-[#6366f1] border-2 border-white rounded-full transform -translate-x-1/2 shadow-md" />
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex items-baseline">
                <span className="logo-nocap text-lg">NOCAP</span>
                <span className="logo-compute text-base">COMPUTE</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm font-brutalist">
              <button onClick={() => scrollToSection("home")} className="text-[#64748b] hover:text-[#6366f1] transition-colors">HOME</button>
              <button onClick={() => scrollToSection("marketplace")} className="text-[#64748b] hover:text-[#6366f1] transition-colors">MARKETPLACE</button>
              <button onClick={() => scrollToSection("features")} className="text-[#64748b] hover:text-[#6366f1] transition-colors">FEATURES</button>
              <button onClick={() => scrollToSection("roadmap")} className="text-[#64748b] hover:text-[#6366f1] transition-colors">ROADMAP</button>
            </div>
            <div className="text-sm font-mono-light text-[#64748b]">
              © 2026 NOCAP COMPUTE. BUILT FOR XDC HACKATHON.
            </div>
          </div>
        </div>
      </footer>

      {/* Job Modal */}
      <AnimatePresence>
        {showJobModal && selectedGPU && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
            onClick={() => setShowJobModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="brutal-box bg-black p-6 max-w-md w-full border-3 border-white"
            >
              <h3 className="text-xl brutal-heading text-white mb-4">RENT {selectedGPU.name}</h3>
              <div className="space-y-3 mb-6 font-mono-light text-sm">
                <div className="flex justify-between border-b border-white/20 pb-1">
                  <span className="text-white/60">PRICE</span>
                  <span className="text-white">{selectedGPU.pricePerHour} XDC/HR</span>
                </div>
                <div className="flex justify-between border-b border-white/20 pb-1">
                  <span className="text-white/60">PROVIDER</span>
                  <span className="text-white">{selectedGPU.provider}</span>
                </div>
                <div className="flex justify-between border-b border-white/20 pb-1">
                  <span className="text-white/60">VRAM</span>
                  <span className="text-white">{selectedGPU.vram}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="flex-1 btn-brutal-secondary text-sm"
                >
                  CANCEL
                </button>
                <button
                  onClick={submitJob}
                  className="flex-1 btn-brutal text-sm"
                >
                  CONFIRM RENTAL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
