import { useKitchenProfile } from "../context/KitchenProfileContext";
import { DIET_LABELS, EQUIPMENT_LABELS, type DietKey, type EquipmentKey, type SkillLevel, type UnitSystem } from "../types/kitchen";
import Footer from "../components/Footer";
import Header from "../components/Header";

const UNIT_OPTIONS: { value: UnitSystem; label: string }[] = [
  { value: "metric", label: "Grams / ml" },
  { value: "imperial", label: "Cups / oz" },
];

const SKILL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: "novice", label: "Beginner" },
  { value: "experienced", label: "Experienced" },
];

function MyKitchenTab() {
  const { profile, updateProfile } = useKitchenProfile();

  const toggleEquipment = (key: EquipmentKey) => {
    updateProfile({ equipment: { ...profile.equipment, [key]: !profile.equipment[key] } });
  };

  const toggleDiet = (key: DietKey) => {
    updateProfile({ diet: { ...profile.diet, [key]: !profile.diet[key] } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Equipment</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleEquipment(key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  profile.equipment[key]
                    ? "border-green-500/40 bg-green-500/15 text-green-400"
                    : "border-gray-700 bg-gray-800 text-gray-400"
                }`}
              >
                {EQUIPMENT_LABELS[key]}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Dietary restrictions</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DIET_LABELS) as DietKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleDiet(key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  profile.diet[key]
                    ? "border-red-500/40 bg-red-500/15 text-red-400"
                    : "border-gray-700 bg-gray-800 text-gray-400"
                }`}
              >
                {DIET_LABELS[key]}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Units</div>
          <div className="inline-flex w-fit overflow-hidden rounded-md border border-gray-700">
            {UNIT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateProfile({ units: option.value })}
                className={`px-3 py-2 text-xs font-semibold ${
                  profile.units === option.value ? "bg-blue-500/15 text-blue-400" : "bg-gray-900 text-gray-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Skill level</div>
          <div className="inline-flex w-fit overflow-hidden rounded-md border border-gray-700">
            {SKILL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateProfile({ skill: option.value })}
                className={`px-3 py-2 text-xs font-semibold ${
                  profile.skill === option.value ? "bg-blue-500/15 text-blue-400" : "bg-gray-900 text-gray-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            Beginners get more explanation of the "why" behind each step in chat.
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Default servings</div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => updateProfile({ servings: Math.max(1, profile.servings - 1) })}
              aria-label="Decrease"
              className="h-8 w-8 rounded-md border border-gray-700 bg-gray-900 text-sm text-gray-100"
            >
              −
            </button>
            <div className="min-w-[18px] text-center font-mono text-base text-gray-100">{profile.servings}</div>
            <button
              type="button"
              onClick={() => updateProfile({ servings: Math.min(12, profile.servings + 1) })}
              aria-label="Increase"
              className="h-8 w-8 rounded-md border border-gray-700 bg-gray-900 text-sm text-gray-100"
            >
              +
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default MyKitchenTab;
