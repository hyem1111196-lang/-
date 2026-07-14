import { describe, it, expect } from "vitest";
import {
  classifyHeat,
  classifyCold,
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
    expect(classifyHeat(37.9)).toBe("danger");
    expect(classifyHeat(HEAT_THRESHOLDS.critical)).toBe("critical"); // 38
    expect(classifyHeat(41)).toBe("critical");
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

describe("maxStage — 더 위험한 단계 선택", () => {
  it("두 단계 중 위험 단계를 반환", () => {
    expect(maxStage("normal", "warning")).toBe("warning");
    expect(maxStage("danger", "interest")).toBe("danger");
    expect(maxStage("normal", "normal")).toBe("normal");
  });
});
