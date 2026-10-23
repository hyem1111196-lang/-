import { describe, it, expect } from "vitest";
import { isPreviewHost, readWarningTestParam, warningTestStatus } from "./testHooks";

describe("testHooks — 운영 주소 잠금", () => {
  it("운영 호스트는 false, 미리보기·로컬은 true", () => {
    expect(isPreviewHost("korail-weather.pages.dev")).toBe(false);
    expect(isPreviewHost("warning-test.korail-weather.pages.dev")).toBe(true);
    expect(isPreviewHost("46689ece.korail-weather.pages.dev")).toBe(true);
    expect(isPreviewHost("localhost")).toBe(true);
    expect(isPreviewHost("example.com")).toBe(false);
  });
  it("파라미터·주입값", () => {
    expect(readWarningTestParam("?wrntest=COLD")).toBe("cold");
    expect(readWarningTestParam("")).toBeNull();
    expect(warningTestStatus("danger", "경기도")?.entries[0]).toMatchObject({ name: "한파경보", level: "danger" });
    expect(warningTestStatus("none", "경기도")?.entries).toEqual([]);
    expect(warningTestStatus("x", "경기도")).toBeNull();
  });
});
