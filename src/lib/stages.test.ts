import { describe, it, expect } from "vitest";
import {
  classifyHeat,
  classifyCold,
  classifyRain,
  maxStage,
  HEAT_THRESHOLDS,
  COLD_THRESHOLDS,
} from "./stages";

describe("classifyHeat — 폭염 단계", () => {
  it("경계값 판정 (KORAIL 기존 기준)", () => {
    expect(classifyHeat(30.9)).toBe("normal");
    expect(classifyHeat(HEAT_THRESHOLDS.interest)).toBe("interest"); // 31
    expect(classifyHeat(HEAT_THRESHOLDS.warning)).toBe("warning"); // 33
    expect(classifyHeat(HEAT_THRESHOLDS.danger)).toBe("danger"); // 35
    expect(classifyHeat(41)).toBe("danger");
  });
});

describe("classifyCold — 한파 단계(초안)", () => {
  it("체감온도가 낮을수록 위험 단계", () => {
    expect(classifyCold(0)).toBe("normal");
    expect(classifyCold(COLD_THRESHOLDS.interest)).toBe("interest"); // -10
    expect(classifyCold(COLD_THRESHOLDS.warning)).toBe("warning"); // -12
    expect(classifyCold(COLD_THRESHOLDS.danger)).toBe("danger"); // -15
    expect(classifyCold(-25)).toBe("danger");
  });
});

describe("classifyRain — 호우 단계(초안)", () => {
  it("특보가 있으면 특보를 우선한다", () => {
    expect(classifyRain({ rn1mm: 0, advisory: "warning" })).toBe("danger");
    expect(classifyRain({ rn1mm: 0, advisory: "advisory" })).toBe("warning");
  });
  it("특보가 없으면 강수량으로 근사한다", () => {
    expect(classifyRain({ rn1mm: 0 })).toBe("normal");
    expect(classifyRain({ rn1mm: 5, pty: 1 })).toBe("interest");
    expect(classifyRain({ rn1mm: 25 })).toBe("warning");
    expect(classifyRain({ rn1mm: 40 })).toBe("danger");
  });
});

describe("maxStage — 더 위험한 단계 선택", () => {
  it("두 단계 중 위험 단계를 반환", () => {
    expect(maxStage("normal", "warning")).toBe("warning");
    expect(maxStage("danger", "interest")).toBe("danger");
    expect(maxStage("normal", "normal")).toBe("normal");
  });
});
