import React from "react";

interface KeyFilterControlsProps {
  useKeyFilter: boolean;
  toggleKeyFilter: () => void;
  selectedKey: string;
  handleKeyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  startOctave: number;
  handleStartOctaveChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  includeOctave: boolean;
  setIncludeOctave: (value: boolean) => void;
  scaleType: "major" | "minor";
  handleScaleTypeChange: (type: "major" | "minor") => void;
  minorType: string;
  handleMinorTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  ALL_KEYS: string[];
  MINOR_TYPES: string[];
}

const KeyFilterControls: React.FC<KeyFilterControlsProps> = ({
  useKeyFilter,
  toggleKeyFilter,
  selectedKey,
  handleKeyChange,
  startOctave,
  handleStartOctaveChange,
  includeOctave,
  setIncludeOctave,
  scaleType,
  handleScaleTypeChange,
  minorType,
  handleMinorTypeChange,
  ALL_KEYS,
  MINOR_TYPES,
}) => {
  return (
    <div className="bg-slate-700 p-4 rounded">
      <h3 className="text-lg font-medium text-slate-300 mb-3">Key Filter</h3>

      {/* Key Filter Toggle */}
      <div className="flex items-center mb-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useKeyFilter}
            onChange={toggleKeyFilter}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
          <span className="ms-3 text-slate-300">Only notes in selected key</span>
        </label>
      </div>

      {/* Key Selector */}
      <div className="flex items-center mb-4">
        <label htmlFor="keySelect" className="text-slate-300 mr-2 w-1/3">
          Key:
        </label>
        <select
          id="keySelect"
          value={selectedKey}
          onChange={handleKeyChange}
          disabled={!useKeyFilter}
          className={`bg-slate-600 text-white px-3 py-2 rounded w-2/3 ${
            !useKeyFilter ? "opacity-50" : ""
          }`}
        >
          {ALL_KEYS.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      {/* Start Octave */}
      <div className="flex items-center mb-4">
        <label htmlFor="startOctave" className="text-slate-300 mr-2 w-1/3">
          Start Octave:
        </label>
        <input
          id="startOctave"
          type="number"
          min={1}
          max={7}
          value={startOctave}
          onChange={handleStartOctaveChange}
          className="bg-slate-600 text-white px-3 py-2 rounded w-2/3"
        />
      </div>

      {/* Include Octave Toggle */}
      <div className="flex items-center mb-6">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={includeOctave}
            onChange={() => setIncludeOctave(!includeOctave)}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
          <span className="ms-3 text-slate-300">Show octave numbers</span>
        </label>
      </div>

      {/* Scale Type */}
      <div className="bg-slate-700 p-4 rounded">
        <h3 className="text-lg font-medium text-slate-300 mb-3">Scale Type</h3>

        <div className="flex items-center gap-4 mb-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name="scaleType"
              checked={scaleType === "major"}
              onChange={() => handleScaleTypeChange("major")}
              className="text-indigo-500"
            />
            <span className="ms-2 text-slate-300">Major</span>
          </label>

          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name="scaleType"
              checked={scaleType === "minor"}
              onChange={() => handleScaleTypeChange("minor")}
              className="text-indigo-500"
            />
            <span className="ms-2 text-slate-300">Minor</span>
          </label>
        </div>

        {/* Minor Type Select */}
        {scaleType === "minor" && (
          <div className="flex items-center">
            <label htmlFor="minorType" className="text-slate-300 mr-2 w-1/3">
              Type:
            </label>
            <select
              id="minorType"
              value={minorType}
              onChange={handleMinorTypeChange}
              className="bg-slate-600 text-white px-3 py-2 rounded w-2/3"
            >
              {MINOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyFilterControls;
