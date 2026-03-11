import { BookOpen } from "lucide-react";

export type SmaeEdition = "smae4" | "smae5";

interface SmaeEditionSelectorProps {
  value: SmaeEdition;
  onChange: (edition: SmaeEdition) => void;
}

const SmaeEditionSelector = ({ value, onChange }: SmaeEditionSelectorProps) => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Edición SMAE</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange("smae4")}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border ${
            value === "smae4"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          SMAE 4
        </button>
        <button
          onClick={() => onChange("smae5")}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border ${
            value === "smae5"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          SMAE 5
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        La IA usará la edición seleccionada para calcular equivalentes.
      </p>
    </div>
  );
};

export default SmaeEditionSelector;
