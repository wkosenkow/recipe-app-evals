import { useKitchenProfile } from "../context/KitchenProfileContext";
import { DIET_OPTIONS, EQUIPMENT_OPTIONS, type DietRestriction, type SkillLevel, type UnitSystem } from "../types/kitchen";
import TabBar from "../components/TabBar";

const UNIT_OPTIONS: UnitSystem[] = ["metric", "imperial"];
const SKILL_OPTIONS: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];

function MyKitchenTab() {
  const { profile, updateProfile } = useKitchenProfile();

  const toggleEquipment = (key: string) => {
    updateProfile({ equipment: { ...profile.equipment, [key]: !profile.equipment[key] } });
  };

  const toggleDiet = (diet: DietRestriction) => {
    const next = profile.diet.includes(diet)
      ? profile.diet.filter((d) => d !== diet)
      : [...profile.diet, diet];
    updateProfile({ diet: next });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <div className="text-xl font-semibold text-gray-100">My Kitchen</div>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Servings</div>
          <input
            type="number"
            min={1}
            max={12}
            value={profile.servings}
            onChange={(e) => updateProfile({ servings: Math.max(1, Number(e.target.value) || 1) })}
            className="w-24 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100"
          />
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Units</div>
          <div className="flex gap-2">
            {UNIT_OPTIONS.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => updateProfile({ units: unit })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  profile.units === unit
                    ? "border-blue-500/40 bg-blue-500/15 text-blue-400"
                    : "border-gray-700 bg-gray-800 text-gray-400"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Skill level</div>
          <div className="flex gap-2">
            {SKILL_OPTIONS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => updateProfile({ skill })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  profile.skill === skill
                    ? "border-blue-500/40 bg-blue-500/15 text-blue-400"
                    : "border-gray-700 bg-gray-800 text-gray-400"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Equipment</div>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleEquipment(item.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  profile.equipment[item.key]
                    ? "border-green-500/40 bg-green-500/15 text-green-400"
                    : "border-gray-700 bg-gray-800 text-gray-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Diet restrictions</div>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleDiet(item.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  profile.diet.includes(item.key)
                    ? "border-red-500/40 bg-red-500/15 text-red-400"
                    : "border-gray-700 bg-gray-800 text-gray-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <TabBar />
    </div>
  );
}

export default MyKitchenTab;
