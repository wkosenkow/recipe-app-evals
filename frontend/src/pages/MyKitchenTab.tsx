import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useKitchenProfile } from "../context/KitchenProfileContext";
import { type SkillLevel, type UnitSystem } from "../types/kitchen";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

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
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div className="py-10 text-center text-sm text-neutral-500">
            Log in to customize your kitchen.{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-accent-300 hover:text-accent-200"
            >
              Log in
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {loading && <div className="text-sm text-neutral-500">Loading…</div>}

        <div className="field">
          <label htmlFor="kitchen-equipment">Equipment</label>
          <input
            id="kitchen-equipment"
            className="input"
            value={profile.equipment}
            onChange={(e) => updateProfile({ equipment: e.target.value })}
            placeholder="e.g. oven, blender, no stand mixer"
          />
        </div>

        <div className="field">
          <label htmlFor="kitchen-diet">Dietary restrictions</label>
          <input
            id="kitchen-diet"
            className="input"
            value={profile.diet}
            onChange={(e) => updateProfile({ diet: e.target.value })}
            placeholder="e.g. dairy-free, tree nut allergy"
          />
        </div>

        {/* Buttons rather than radios, so `role`/`aria-checked` are what tell a
            screen reader this is a single choice — and what the `.seg-opt`
            selected style keys off. */}
        <div className="field">
          <label id="kitchen-units-label">Units</label>
          <div className="seg w-fit" role="radiogroup" aria-labelledby="kitchen-units-label">
            {UNIT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={profile.units === option.value}
                onClick={() => updateProfile({ units: option.value })}
                className="seg-opt"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label id="kitchen-skill-label">Skill level</label>
          <div className="seg w-fit" role="radiogroup" aria-labelledby="kitchen-skill-label">
            {SKILL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={profile.skill === option.value}
                onClick={() => updateProfile({ skill: option.value })}
                className="seg-opt"
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Beginners get more explanation of the &quot;why&quot; behind each step in chat.
          </div>
        </div>

        <div className="field">
          <label id="kitchen-servings-label">Default servings</label>
          <div className="flex items-center gap-6" aria-labelledby="kitchen-servings-label">
            <button
              type="button"
              onClick={() => updateProfile({ servings: Math.max(1, profile.servings - 1) })}
              aria-label="Decrease servings"
              className="btn btn-secondary btn-icon"
            >
              −
            </button>
            <div className="min-w-[18px] text-center font-pixel text-[15px] text-text" aria-live="polite">
              {profile.servings}
            </div>
            <button
              type="button"
              onClick={() => updateProfile({ servings: Math.min(12, profile.servings + 1) })}
              aria-label="Increase servings"
              className="btn btn-secondary btn-icon"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default MyKitchenTab;
