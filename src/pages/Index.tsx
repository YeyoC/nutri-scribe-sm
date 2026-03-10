import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar, { type NavTab } from "@/components/Navbar";
import AIAnalysisSection from "@/components/AIAnalysisSection";
import FoodGroupList from "@/components/FoodGroupList";
import EquivalentsChart from "@/components/EquivalentsChart";
import DietDistributionSection from "@/components/DietDistributionSection";
import ResultsSection from "@/components/ResultsSection";
import ExportSection from "@/components/ExportSection";
import BottomBar from "@/components/BottomBar";
import CalculadorasSection from "@/components/CalculadorasSection";
import DietaSection from "@/components/DietaSection";
import GraficosSection from "@/components/GraficosSection";
import PlatillosSection from "@/components/PlatillosSection";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import AdminPanel from "@/components/AdminPanel";
import { useAdmin } from "@/hooks/useAdmin";
import { SMAE_GROUPS, calculateTotals, type FoodGroup } from "@/data/smaeData";

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NavTab>("dietocalculo");
  const [groups, setGroups] = useState<FoodGroup[]>(
    SMAE_GROUPS.map((g) => ({ ...g }))
  );
  const [goals, setGoals] = useState({ kcal: 2000, protein: 75, lipids: 55.6, hco: 300 });

  const totals = calculateTotals(groups);
  const hasData = groups.some((g) => g.equivalents > 0);

  const handleGroupChange = useCallback((id: string, value: number) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, equivalents: value } : g))
    );
  }, []);

  const handleAIAnalysis = useCallback((equivalents: { id: string; equivalents: number }[]) => {
    setGroups((prev) =>
      prev.map((g) => {
        const match = equivalents.find((e) => e.id === g.id);
        return match ? { ...g, equivalents: g.equivalents + match.equivalents } : g;
      })
    );
  }, []);

  const handleClear = useCallback(() => {
    setGroups(SMAE_GROUPS.map((g) => ({ ...g })));
  }, []);

  const handleTabChange = useCallback((tab: NavTab) => {
    const authTabs: NavTab[] = ["platillos", "configuracion", "admin"];
    if (authTabs.includes(tab) && !user) {
      navigate("/auth");
      return;
    }
    setActiveTab(tab);
  }, [user, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case "dietocalculo":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-3 space-y-5">
              <AIAnalysisSection onAnalysis={handleAIAnalysis} />
              <FoodGroupList groups={groups} onChange={handleGroupChange} />
            </div>
            <div className="lg:col-span-5 space-y-5">
              <EquivalentsChart groups={groups} totals={totals} />
            </div>
            <div className="lg:col-span-4 space-y-5">
              <DietDistributionSection kcalTotal={totals.kcal} onDistributionChange={setGoals} />
              <ResultsSection totals={totals} goals={goals} />
              <ExportSection hasData={hasData} groups={groups} totals={totals} goals={goals} onClear={handleClear} />
            </div>
          </div>
        );

      case "distribucion":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 space-y-5">
              <DietDistributionSection kcalTotal={totals.kcal} onDistributionChange={setGoals} />
              <ResultsSection totals={totals} goals={goals} />
            </div>
            <div className="lg:col-span-6 space-y-5">
              <EquivalentsChart groups={groups} totals={totals} />
              <ExportSection hasData={hasData} groups={groups} totals={totals} goals={goals} onClear={handleClear} />
            </div>
          </div>
        );

      case "dieta":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <DietaSection groups={groups} />
            </div>
            <div className="lg:col-span-4 space-y-5">
              <FoodGroupList groups={groups} onChange={handleGroupChange} />
              <ExportSection hasData={hasData} groups={groups} totals={totals} goals={goals} onClear={handleClear} />
            </div>
          </div>
        );

      case "calculadoras":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6">
              <CalculadorasSection />
            </div>
            <div className="lg:col-span-6 space-y-5">
              <ResultsSection totals={totals} goals={goals} />
              <EquivalentsChart groups={groups} totals={totals} />
            </div>
          </div>
        );

      case "graficos":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6">
              <GraficosSection groups={groups} totals={totals} goals={goals} />
            </div>
            <div className="lg:col-span-6 space-y-5">
              <EquivalentsChart groups={groups} totals={totals} />
              <ResultsSection totals={totals} goals={goals} />
            </div>
          </div>
        );

      case "platillos":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <PlatillosSection onUsarEnDieta={handleAIAnalysis} />
            </div>
            <div className="lg:col-span-4 space-y-5">
              <FoodGroupList groups={groups} onChange={handleGroupChange} />
              <ResultsSection totals={totals} goals={goals} />
            </div>
          </div>
        );

      case "configuracion":
        return (
          <div className="max-w-lg mx-auto space-y-5">
            <TwoFactorSetup />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="container px-4 py-6">{renderContent()}</main>
      <BottomBar totals={totals} goals={goals} />
    </div>
  );
};

export default Index;
