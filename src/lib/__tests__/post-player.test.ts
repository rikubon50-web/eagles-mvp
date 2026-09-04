import { describe, it, expect } from "vitest";
import { findPlayerForTitle, normalizeName, postsMentioning } from "@/lib/post-player";

const players = [
  { id: "a", name: "中井莉湖" },
  { id: "b", name: "北村祐理" },
  { id: "c", name: "北村尚士" },
  { id: "d", name: "北村" }, // 短い名前（包含関係の検証用）
  { id: "e", name: "所空來" },
  { id: "f", name: "佐藤空來" },
  { id: "g", name: "丸山貴史" },
];

describe("normalizeName", () => {
  it("半角・全角空白を除去する", () => {
    expect(normalizeName("中井 莉湖")).toBe("中井莉湖");
    expect(normalizeName("１年　木戸康生")).toBe("１年木戸康生");
  });
});

describe("findPlayerForTitle", () => {
  it("タイトル内の空白入り名前を選手に紐付ける", () => {
    expect(findPlayerForTitle("【導く】 4年 中井 莉湖", players)?.id).toBe("a");
  });
  it("同姓の別人を取り違えない", () => {
    expect(findPlayerForTitle("【何もない自分】4年 北村祐理", players)?.id).toBe("b");
  });
  it("複数一致時は長い名前を優先する", () => {
    // 「北村」も一致するが「北村尚士」を選ぶ
    expect(findPlayerForTitle("4年 北村尚士", players)?.id).toBe("c");
  });
  it("名前の一部を含む別選手に誤爆しない", () => {
    // 「所空來」は「佐藤空來」を含まない
    expect(findPlayerForTitle("【勝たせる】3年 所空來", players)?.id).toBe("e");
  });
  it("コーチのタイトルも紐付く", () => {
    expect(findPlayerForTitle("【本気】専属TR 丸山貴史", players)?.id).toBe("g");
  });
  it("該当なしは null", () => {
    expect(findPlayerForTitle("新歓のお知らせ", players)).toBeNull();
    expect(findPlayerForTitle("", players)).toBeNull();
  });
});

describe("postsMentioning", () => {
  const posts = [
    { id: "1", title: "【導く】 4年 中井 莉湖" },
    { id: "2", title: "【何もない自分】4年 北村祐理" },
    { id: "3", title: "中井莉湖と北村祐理の対談" },
  ];
  it("名前を含む記事だけを入力順で返す", () => {
    expect(postsMentioning("中井莉湖", posts).map((p) => p.id)).toEqual(["1", "3"]);
    expect(postsMentioning("北村 祐理", posts).map((p) => p.id)).toEqual(["2", "3"]);
  });
  it("短すぎる名前は空配列", () => {
    expect(postsMentioning("中", posts)).toEqual([]);
  });
});
