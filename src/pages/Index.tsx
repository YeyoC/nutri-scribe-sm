import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AIAnalysisSection from "@/components/AIAnalysisSection";
import FoodGroupList from "@/components/FoodGroupList";
import EquivalentsChart from "@/components/EquivalentsChart";
import DietDistributionSection from "@/components/DietDistributionSection";
import ResultsSection from "@/components/ResultsSection";
import ExportSection from "@/components/ExportSection";
import BottomBar from "@/components/BottomBar";
import { SMAE_GROUPS, calculateTotals, type FoodGroup } from "@/data/smaeData";

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-5">
            <AIAnalysisSection onAnalysis={handleAIAnalysis} />
            <FoodGroupList groups={groups} onChange={handleGroupChange} />
          </div>

          {/* Center column */}
          <div className="lg:col-span-5 space-y-5">
            <EquivalentsChart groups={groups} totals={totals} />
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-5">
            <DietDistributionSection
              kcalTotal={totals.kcal}
              onDistributionChange={setGoals}
            />
            <ResultsSection totals={totals} goals={goals} />
            <ExportSection hasData={hasData} />
          </div>
        </div>
      </main>

      <BottomBar totals={totals} goals={goals} />
    </div>
  );
};

export default Index;
