import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useKitchenProfile } from "../context/KitchenProfileContext";
import { type SkillLevel, type UnitSystem } from "../types/kitchen";
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useKitchenProfile();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-950">
        <Header />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="py-10 text-center text-sm text-gray-500">
            Log in to customize your kitchen.{" "}
            <button type="button" onClick={() => navigate("/login")} className="font-semibold text-blue-400 hover:underline">
              Log in
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        {loading && <div className="text-sm text-gray-500">Loading…</div>}

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Equipment</div>
          <input
            value={profile.equipment}
            onChange={(e) => updateProfile({ equipment: e.target.value })}
            placeholder="e.g. oven, blender, no stand mixer"
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600"
          />
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-gray-300">Dietary restrictions</div>
          <input
            value={profile.diet}
            onChange={(e) => updateProfile({ diet: e.target.value })}
            placeholder="e.g. dairy-free, tree nut allergy"
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600"
          />
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
