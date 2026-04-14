import fs from "fs";
import path from "path";
import {
  buildCreatorBenchmarkBlocks,
  buildCreatorOutfitPrompt,
  buildDayOutfitPrompt,
  classifyTransitionIntensity,
  CREATOR_STYLE_DIRECTIONS,
  DAY_COLOR_DIRECTIONS,
  formatCreatorWeatherContext,
  formatDayWeatherContext,
  selectPromptDirection,
  type CreatorBenchmarkCandidate,
  type PromptDaySummary,
  type PromptMomentWeather,
} from "../src/lib/outfit-prompt";
import { selectDayOutfitFamily, type DayOutfitFamily } from "../src/lib/outfit-family";
import { buildOutfitSignalBrief } from "../src/lib/outfit-signals";

interface DayBenchmarkScenario {
  id: string;
  locationName: string;
  benchmarkDate: string;
  day: PromptDaySummary;
  paletteIndex: number;
  moments: PromptMomentWeather[];
  variationId: string;
  recentFamilies: DayOutfitFamily[];
  reviewFocus?: string;
}

interface CreatorBenchmarkScenario {
  id: string;
  locationName: string;
  day: PromptDaySummary;
  styleDirectionIndex: number;
  moments: PromptMomentWeather[];
  candidates: CreatorBenchmarkCandidate[];
  reviewFocus?: string;
}

interface CreatorBenchmarkFixture {
  validationScope: string;
  note: string;
  manualReviewChecklist?: string[];
  scenarios: CreatorBenchmarkScenario[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const cwd = process.cwd();
  const outDirArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  const outDir = path.resolve(cwd, outDirArg || "tmp/outfit-benchmarks");

  const dayFixture = readJson<DayBenchmarkScenario[]>(
    path.join(cwd, "tests/fixtures/outfit-benchmark-queries.json"),
  );
  const creatorFixture = readJson<CreatorBenchmarkFixture>(
    path.join(cwd, "tests/fixtures/creator-outfit-benchmark.json"),
  );

  ensureDir(outDir);

  const daySnapshots = dayFixture.map((scenario) => {
    const colorDirection = selectPromptDirection(DAY_COLOR_DIRECTIONS, { index: scenario.paletteIndex });
    const transition = classifyTransitionIntensity(scenario.moments);
    const signalBrief = buildOutfitSignalBrief({
      locationName: scenario.locationName,
      moments: scenario.moments,
      transition,
    });
    const familySelection = selectDayOutfitFamily({
      signalBrief,
      variationContext: {
        variationId: scenario.variationId,
        recentFamilies: scenario.recentFamilies,
      },
      locationName: scenario.locationName,
      date: scenario.benchmarkDate,
    });
    return {
      id: scenario.id,
      locationName: scenario.locationName,
      paletteDirection: colorDirection,
      transition,
      selectedFamily: familySelection.family,
      validFamilies: familySelection.validFamilies,
      familySeed: familySelection.seed,
      benchmarkDate: scenario.benchmarkDate,
      variationId: scenario.variationId,
      recentFamilies: scenario.recentFamilies,
      reviewFocus: scenario.reviewFocus || null,
      prompt: buildDayOutfitPrompt({
        locationName: scenario.locationName,
        day: scenario.day,
        weatherContext: formatDayWeatherContext(scenario.moments),
        colorDirection,
        transition,
        signalBrief,
        selectedFamily: familySelection.family,
      }),
    };
  });

  const creatorSnapshots = creatorFixture.scenarios.map((scenario) => {
    const styleDirection = selectPromptDirection(CREATOR_STYLE_DIRECTIONS, {
      index: scenario.styleDirectionIndex,
    });
    const transition = classifyTransitionIntensity(scenario.moments);
    const prompt = buildCreatorOutfitPrompt({
      locationName: scenario.locationName,
      day: scenario.day,
      weatherContext: formatCreatorWeatherContext(scenario.moments),
      styleDirection,
      transition,
      signalBrief: buildOutfitSignalBrief({
        locationName: scenario.locationName,
        moments: scenario.moments,
        transition,
      }),
    });
    const blocks = buildCreatorBenchmarkBlocks({
      candidates: scenario.candidates,
      promptText: prompt,
    });
    return {
      id: scenario.id,
      locationName: scenario.locationName,
      styleDirection,
      transition,
      validationScope: creatorFixture.validationScope,
      note: creatorFixture.note,
      manualReviewChecklist: creatorFixture.manualReviewChecklist || [],
      reviewFocus: scenario.reviewFocus || null,
      blockCount: blocks.length,
      imageBlockCount: blocks.filter((block) => block.type === "image").length,
      prompt,
    };
  });

  fs.writeFileSync(path.join(outDir, "day-mode.json"), `${JSON.stringify(daySnapshots, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "creator-mode.json"), `${JSON.stringify(creatorSnapshots, null, 2)}\n`);

  console.error(`Wrote ${daySnapshots.length} day-mode snapshots to ${path.join(outDir, "day-mode.json")}`);
  console.error(`Wrote ${creatorSnapshots.length} creator-mode snapshots to ${path.join(outDir, "creator-mode.json")}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
